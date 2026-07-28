"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type OrbMode = "idle" | "examiner" | "student" | "thinking";

interface SpeakingOrbProps {
  /** 0..1 loudness. Real mic RMS while the student talks, synthesised for TTS. */
  level: number;
  mode: OrbMode;
  className?: string;
  size?: number;
}

/**
 * The centrepiece of the speaking session — a soft blob that deforms with
 * whoever is currently talking.
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
  className,
  size = 300,
}: SpeakingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelRef = useRef(0);
  const modeRef = useRef<OrbMode>(mode);
  const rafRef = useRef<number | null>(null);

  // Feed the loop through refs so a changing level never re-runs the effect.
  levelRef.current = level;
  modeRef.current = mode;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

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
    };

    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = size * 0.24;
    const POINTS = 96;

    let phase = 0;
    let smoothed = 0;
    let breathe = 0;

    const draw = () => {
      const mode = modeRef.current;
      const { core, halo } = palette[mode];

      // Ease toward the incoming level so a dropped frame never jolts the shape.
      smoothed += (levelRef.current - smoothed) * 0.18;
      phase += mode === "idle" ? 0.006 : 0.018;
      breathe += 0.012;

      ctx.clearRect(0, 0, size, size);

      // Idle still moves, just barely — a frozen orb reads as a crash.
      const energy = mode === "idle" ? 0.06 : 0.12 + smoothed * 0.88;
      const radius = baseRadius * (1 + energy * 0.16 + Math.sin(breathe) * 0.02);

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
      haloGradient.addColorStop(0, withAlpha(halo, 0.34 + energy * 0.26));
      haloGradient.addColorStop(0.55, withAlpha(halo, 0.1 + energy * 0.12));
      haloGradient.addColorStop(1, withAlpha(halo, 0));
      ctx.fillStyle = haloGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, haloRadius, 0, Math.PI * 2);
      ctx.fill();

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
