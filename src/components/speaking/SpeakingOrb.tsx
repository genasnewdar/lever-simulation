"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type OrbMode = "idle" | "examiner" | "student" | "thinking" | "gathering";

interface SpeakingOrbProps {
  /** 0..1 loudness. Real mic RMS while the student talks, real TTS RMS for the examiner. */
  level: number;
  mode: OrbMode;
  /**
   * Bump this to fire a one-shot acknowledgement bounce — "got that".
   * The value itself is meaningless; only a change matters.
   */
  pulse?: number;
  className?: string;
  size?: number;
}

/**
 * The centrepiece of the speaking session — a soft blob that behaves like
 * somebody who is paying attention.
 *
 * It is not just a level meter. The examiner has no face, so everything a face
 * would carry has to be carried here, and each behaviour maps to something the
 * student can name:
 *
 * - `examiner`  ripples travel OUTWARD — it is putting something out into the room
 * - `student`   ripples travel INWARD, and it bobs every few seconds — it is
 *               taking your answer in, and showing you that it landed
 * - `thinking`  satellites orbit the core — work is happening, deliberately
 * - `gathering` the whole thing contracts, like a breath before speaking
 * - `pulse`     one soft bounce, fired the moment an answer is captured
 *
 * The inward/outward inversion is the load-bearing idea: the same ripple read
 * two ways tells you who the room belongs to right now, without a word of UI.
 *
 * Canvas rather than SVG/framer-motion: this repaints every frame off a live
 * audio level, and pushing 100+ path points through React each frame would
 * cost far more than drawing them directly.
 *
 * Colours are pulled from the app's CSS custom properties so the orb follows
 * the paper/ink theme in both light and dark mode.
 */
export function SpeakingOrb({
  level,
  mode,
  pulse = 0,
  className,
  size = 300,
}: SpeakingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelRef = useRef(0);
  const modeRef = useRef<OrbMode>(mode);
  const pulseRef = useRef(pulse);
  const rafRef = useRef<number | null>(null);

  // Feed the loop through refs so a changing level never re-runs the effect.
  levelRef.current = level;
  modeRef.current = mode;
  pulseRef.current = pulse;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    // A student who has asked for less movement still needs to know who is
    // speaking, so the colours and the level response stay — only the motion
    // that exists purely for personality is dropped.
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const styles = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: RGB): RGB =>
      resolveRGB(styles.getPropertyValue(name).trim(), fallback);

    const palette: Record<OrbMode, { core: RGB; halo: RGB }> = {
      idle: {
        core: read("--muted", [138, 138, 138]),
        halo: read("--paper-3", [232, 229, 223]),
      },
      examiner: {
        core: read("--mint-deep", [47, 158, 121]),
        halo: read("--mint", [79, 209, 165]),
      },
      student: {
        core: read("--ink", [28, 28, 30]),
        halo: read("--mint", [79, 209, 165]),
      },
      thinking: {
        core: read("--ink-soft", [74, 74, 79]),
        halo: read("--mint-soft", [215, 242, 232]),
      },
      // Deliberately the examiner's own colour: the pause before it speaks is
      // already its turn, and switching palettes would read as a hand-off.
      gathering: {
        core: read("--mint-deep", [47, 158, 121]),
        halo: read("--mint-soft", [215, 242, 232]),
      },
    };

    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = size * 0.24;
    const POINTS = 96;

    let phase = 0;
    let smoothed = 0;
    let breathe = 0;
    let orbit = 0;
    let ripple = 0;
    let attend = 0;
    /** Eases 0..1 as the orb draws breath before speaking. */
    let gather = 0;
    /** Decaying energy from the last acknowledgement bounce. */
    let bounce = 0;
    let lastPulse = pulseRef.current;

    const draw = () => {
      const mode = modeRef.current;
      const { core, halo } = palette[mode];

      if (pulseRef.current !== lastPulse) {
        lastPulse = pulseRef.current;
        bounce = 1;
      }

      // Ease toward the incoming level so a dropped frame never jolts the shape.
      smoothed += (levelRef.current - smoothed) * 0.18;
      gather += ((mode === "gathering" ? 1 : 0) - gather) * 0.12;
      bounce *= 0.93;

      phase += mode === "idle" ? 0.006 : 0.018;
      breathe += 0.012;
      orbit += mode === "gathering" ? 0.034 : 0.019;
      ripple = (ripple + (mode === "examiner" ? 0.007 : 0.005)) % 1;
      attend += 0.0055;

      ctx.clearRect(0, 0, size, size);

      // Idle still moves, just barely — a frozen orb reads as a crash.
      const energy = mode === "idle" ? 0.06 : 0.12 + smoothed * 0.88;

      // A slow bob while the student talks — the orb's version of a nod. It is
      // the only motion here that is not driven by sound, and that is the
      // point: it says "still with you" during the pauses, which is exactly
      // when a speaker starts to wonder whether anything is listening.
      const nod =
        mode === "student" && !calm
          ? Math.max(0, Math.sin(attend * Math.PI * 2)) ** 6 * 0.055
          : 0;

      const radius =
        baseRadius *
        (1 +
          energy * 0.16 +
          Math.sin(breathe) * 0.02 +
          nod +
          bounce * 0.2 -
          gather * 0.17);

      // ── Halo ────────────────────────────────────────────────────────────
      const haloRadius = radius * (1.75 + energy * 0.85);
      const haloGradient = ctx.createRadialGradient(
        cx,
        cy,
        radius * 0.5,
        cx,
        cy,
        haloRadius,
      );
      // Dimming as it gathers, flaring on the bounce: the orb inhales, then
      // brightens the instant it has your answer.
      const haloGain = (1 - gather * 0.45) * (1 + bounce * 0.5);
      haloGradient.addColorStop(
        0,
        withAlpha(halo, (0.34 + energy * 0.26) * haloGain),
      );
      haloGradient.addColorStop(
        0.55,
        withAlpha(halo, (0.1 + energy * 0.12) * haloGain),
      );
      haloGradient.addColorStop(1, withAlpha(halo, 0));
      ctx.fillStyle = haloGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, haloRadius, 0, Math.PI * 2);
      ctx.fill();

      // ── Ripples ─────────────────────────────────────────────────────────
      // Out while it speaks, in while it listens. Three of them, evenly spaced
      // in the cycle, each fading in and out over its own travel.
      if (!calm && (mode === "examiner" || mode === "student")) {
        const outward = mode === "examiner";
        for (let i = 0; i < 3; i++) {
          const t = (ripple + i / 3) % 1;
          const travel = outward ? t : 1 - t;
          const alpha = Math.sin(t * Math.PI) * (0.09 + energy * 0.2);
          if (alpha <= 0.004) continue;

          ctx.beginPath();
          ctx.arc(cx, cy, radius * (1.12 + travel * 1.45), 0, Math.PI * 2);
          ctx.strokeStyle = withAlpha(outward ? halo : core, alpha);
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      }

      // ── Concentric wobbling rings ───────────────────────────────────────
      for (let ring = 2; ring >= 0; ring--) {
        const ringScale = 1 + ring * (0.16 + energy * 0.14);
        const wobble = (0.05 + energy * 0.2) * (1 + ring * 0.5);

        ctx.beginPath();
        for (let i = 0; i <= POINTS; i++) {
          const angle = (i / POINTS) * Math.PI * 2;
          // Three incommensurate harmonics — no visible repeating pattern.
          const noise =
            Math.sin(angle * 3 + phase * 1.6 + ring) * 0.5 +
            Math.sin(angle * 5 - phase * 1.1 + ring * 2) * 0.3 +
            Math.sin(angle * 2 + phase * 2.3) * 0.2;

          const r = radius * ringScale * (1 + noise * wobble);
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        if (ring === 0) {
          const coreGradient = ctx.createRadialGradient(
            cx - radius * 0.3,
            cy - radius * 0.35,
            radius * 0.1,
            cx,
            cy,
            radius * 1.2,
          );
          coreGradient.addColorStop(0, withAlpha(halo, 0.95));
          coreGradient.addColorStop(1, withAlpha(core, 0.92));
          ctx.fillStyle = coreGradient;
          ctx.fill();
        } else {
          ctx.strokeStyle = withAlpha(core, ring === 1 ? 0.3 : 0.14);
          ctx.lineWidth = 1.25;
          ctx.stroke();
        }
      }

      // ── Satellites ──────────────────────────────────────────────────────
      // Three dots circling while it works. Motion that is plainly not the
      // student's voice is what separates "thinking" from "waiting"; they
      // speed up as it gathers, then leave with the breath.
      if (!calm && (mode === "thinking" || gather > 0.02)) {
        const presence = mode === "thinking" ? 1 : gather;
        for (let i = 0; i < 3; i++) {
          const angle = orbit + (i * Math.PI * 2) / 3;
          const distance = radius * (1.62 + Math.sin(orbit * 1.7 + i) * 0.14);
          const dot = size * 0.0085 * (1 + Math.sin(orbit * 3 + i * 2) * 0.28);

          ctx.beginPath();
          ctx.arc(
            cx + Math.cos(angle) * distance,
            cy + Math.sin(angle) * distance,
            dot,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = withAlpha(core, 0.5 * presence);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
      style={{ width: size, height: size }}
    />
  );
}

type RGB = [number, number, number];

function withAlpha([r, g, b]: RGB, alpha: number): string {
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}

/**
 * Turn a CSS colour into concrete rgb channels by painting it.
 *
 * The theme is authored in oklch(), which gradient colour stops accept only in
 * newer engines — and `addColorStop` throws outright on anything it can't
 * parse. Painting one pixel and reading it back gets real channels wherever the
 * browser understands the colour at all, and the sentinel catches the case
 * where it silently didn't.
 */
function resolveRGB(color: string, fallback: RGB): RGB {
  if (!color) return fallback;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fallback;

    // Sentinel: if `color` is unparseable, fillStyle keeps this value.
    ctx.fillStyle = "rgb(1, 2, 3)";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);

    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    if (r === 1 && g === 2 && b === 3) return fallback;
    return [r, g, b];
  } catch {
    return fallback;
  }
}
