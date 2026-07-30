"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

import { cn } from "@/lib/utils";

interface TalkControlProps {
  /** True while audio is actually being captured. */
  recording: boolean;
  disabled?: boolean;
  /**
   * Seconds until silence ends the answer on its own, or null when nothing is
   * counting down. Shown so an automatic stop is never a surprise.
   */
  autoStopIn: number | null;
  /** Begin capturing. */
  onStart: () => void;
  /** End the turn and submit. */
  onFinish: () => void;
}

/**
 * Start/finish control for a student turn.
 *
 * Press once to start talking, once more to finish — the student's hands are
 * free in between, which is the point: an exam answer runs for up to two
 * minutes, and holding a key down for that is both tiring and fragile (a lost
 * window focus or a slipped finger used to end a turn nobody meant to end).
 * Silence ends the turn too, so forgetting to press finish costs a few seconds
 * rather than the rest of the clock.
 *
 * Space is a shortcut for the same two intents and is handled on `window`
 * rather than through button focus, so it works no matter what was last clicked.
 */
export function TalkControl({
  recording,
  disabled = false,
  autoStopIn,
  onStart,
  onFinish,
}: TalkControlProps) {
  const [isTouch, setIsTouch] = useState(false);

  // Props change between renders and the key handler is subscribed once, so it
  // reads the current values from a ref rather than a closure.
  const stateRef = useRef({ recording, disabled });
  stateRef.current = { recording, disabled };

  useEffect(() => {
    setIsTouch(window.matchMedia?.("(pointer: coarse)").matches ?? false);
  }, []);

  const toggle = useCallback(() => {
    const { recording, disabled } = stateRef.current;
    if (disabled) return;
    if (recording) onFinish();
    else onStart();
  }, [onFinish, onStart]);

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
      // Holding Space repeats the key; one press is one intent.
      if (e.repeat) return;
      toggle();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  const label = recording ? "Хариултаа дуусгах" : "Хариулж эхлэх";

  const hint = recording
    ? autoStopIn !== null
      ? `Чимээгүй байна — ${autoStopIn} секундын дараа автоматаар дуусна.`
      : "Ярьж дуусаад дарна уу. Удаан чимээгүй байвал өөрөө дуусна."
    : isTouch
      ? "Товчийг дараад ярина уу."
      : "Товчийг эсвэл Space дарж эхлүүлнэ.";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-pressed={recording}
        onClick={toggle}
        // Space is handled globally; this stops the native button activation
        // from firing a second, duplicate toggle.
        onKeyDown={(e) => e.preventDefault()}
        onKeyUp={(e) => e.preventDefault()}
        className={cn(
          "inline-flex h-12 select-none items-center gap-2.5 rounded-full px-8",
          "text-[14px] font-medium tracking-tight transition-all",
          "disabled:cursor-not-allowed disabled:bg-paper-3 disabled:text-muted",
          recording
            ? "bg-mint-deep text-paper shadow-[0_0_0_6px_var(--mint-soft)]"
            : "bg-ink text-paper hover:bg-ink-soft active:scale-[0.98]",
        )}
      >
        {recording ? (
          <Square className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {label}
      </button>

      <p
        className={cn(
          "max-w-[34ch] text-center text-[11px] leading-relaxed transition-colors",
          autoStopIn !== null ? "text-mint-deep" : "text-muted",
        )}
      >
        {hint}
      </p>
    </div>
  );
}
