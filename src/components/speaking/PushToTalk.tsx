"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * How long a press has to be held before releasing counts as "I'm finished".
 *
 * Anything shorter is treated as a tap, which latches recording on instead.
 * That gives the two-minute Part 2 long turn a hands-free mode, and — more
 * importantly in a graded test — means a slipped finger can never submit a
 * one-second answer.
 */
const LOCK_THRESHOLD_MS = 600;

interface PushToTalkProps {
  /** True while audio is actually being captured. */
  recording: boolean;
  /** True once a tap has latched recording on; release no longer submits. */
  locked: boolean;
  disabled?: boolean;
  /** Begin capturing. */
  onStart: () => void;
  /** A tap — keep capturing until the student presses again. */
  onLock: () => void;
  /** End the turn and submit. */
  onFinish: () => void;
}

/**
 * Hold-to-talk control.
 *
 * Desktop holds the space bar, touch holds the button; both resolve to the same
 * three intents so there is one mental model to explain. Space is handled on
 * `window` rather than through button focus so it works no matter what the
 * student last clicked.
 */
export function PushToTalk({
  recording,
  locked,
  disabled = false,
  onStart,
  onLock,
  onFinish,
}: PushToTalkProps) {
  const [isTouch, setIsTouch] = useState(false);
  const pressStartRef = useRef<number | null>(null);

  // Props change between a keydown and its keyup, so the handlers read refs.
  const stateRef = useRef({ recording, locked, disabled });
  stateRef.current = { recording, locked, disabled };

  useEffect(() => {
    setIsTouch(window.matchMedia?.("(pointer: coarse)").matches ?? false);
  }, []);

  const press = useCallback(() => {
    const { recording, locked, disabled } = stateRef.current;
    if (disabled) return;

    // Latched: the next press is what ends the turn.
    if (locked) {
      pressStartRef.current = null;
      onFinish();
      return;
    }

    if (recording || pressStartRef.current !== null) return;

    pressStartRef.current = Date.now();
    onStart();
  }, [onFinish, onStart]);

  const release = useCallback(() => {
    const startedAt = pressStartRef.current;
    pressStartRef.current = null;

    const { locked, disabled } = stateRef.current;
    if (disabled || locked || startedAt === null) return;

    if (Date.now() - startedAt < LOCK_THRESHOLD_MS) onLock();
    else onFinish();
  }, [onFinish, onLock]);

  // ── Space bar ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      return (
        el.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || isTypingTarget(e.target)) return;
      // Stops the page scrolling and stops Space from "clicking" the button.
      e.preventDefault();
      if (e.repeat) return;
      press();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space" || isTypingTarget(e.target)) return;
      e.preventDefault();
      release();
    };

    // A keyup never arrives if the window loses focus mid-hold. Latching rather
    // than releasing is the safe resolution: releasing would submit a partial
    // answer the student never meant to end, whereas latching keeps recording
    // and leaves them one press away from finishing.
    const handleBlur = () => {
      if (pressStartRef.current === null) return;
      pressStartRef.current = null;
      if (!stateRef.current.locked && !stateRef.current.disabled) onLock();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [onLock, press, release]);

  // ── Rendering ─────────────────────────────────────────────────────────────

  const label = locked
    ? "Хариултаа дуусгах"
    : recording
      ? "Сонсож байна…"
      : isTouch
        ? "Дараад барина уу"
        : "Space дарж бариарай";

  const hint = locked
    ? isTouch
      ? "Дуусмагц дахин дарна уу."
      : "Дуусмагц Space дарна уу."
    : recording
      ? "Тавихад хариулт илгээгдэнэ. Түр дарж тавибал гараа авч болно."
      : isTouch
        ? "Товчийг дараад бариад ярина уу. Богино дарвал гар чөлөөлөгдөнө."
        : "Space товчийг дараад бариад ярина уу. Богино дарвал гар чөлөөлөгдөнө.";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-pressed={recording}
        onPointerDown={(e) => {
          // Capture so a finger sliding off the button still reports its
          // release here rather than getting lost.
          e.currentTarget.setPointerCapture?.(e.pointerId);
          press();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onContextMenu={(e) => e.preventDefault()}
        // Space is handled globally; this stops the native button activation
        // from firing a second, duplicate press.
        onKeyDown={(e) => e.preventDefault()}
        onKeyUp={(e) => e.preventDefault()}
        className={cn(
          "inline-flex h-12 select-none items-center gap-2.5 rounded-full px-8",
          "text-[14px] font-medium tracking-tight transition-all",
          "touch-none [-webkit-touch-callout:none]",
          "disabled:cursor-not-allowed disabled:bg-paper-3 disabled:text-muted",
          locked
            ? "bg-ink text-paper hover:bg-ink-soft"
            : recording
              ? "scale-[1.03] bg-mint-deep text-paper shadow-[0_0_0_6px_var(--mint-soft)]"
              : "bg-ink text-paper hover:bg-ink-soft active:scale-[0.98]",
        )}
      >
        {locked ? (
          <Square className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {label}
      </button>

      <p className="max-w-[32ch] text-center text-[11px] leading-relaxed text-muted">
        {hint}
      </p>
    </div>
  );
}
