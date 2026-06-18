"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TimerProps {
  initialSeconds: number;
  onTimeExpire?: () => void;
  /** When provided, the timer displays this value and skips its own setInterval.
   *  Used during Listening so the countdown stays in sync with audio playback. */
  controlledSeconds?: number;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onTimeExpire, controlledSeconds }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    setSeconds(initialSeconds);
    expiredRef.current = false;
  }, [initialSeconds]);

  // Uncontrolled mode: wall-clock setInterval countdown.
  useEffect(() => {
    if (controlledSeconds !== undefined) return;
    if (seconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          onTimeExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds, onTimeExpire, controlledSeconds]);

  // Controlled mode: fire onTimeExpire once when audio-driven time hits 0.
  useEffect(() => {
    if (controlledSeconds === undefined || controlledSeconds > 0) return;
    if (expiredRef.current) return;
    expiredRef.current = true;
    onTimeExpire?.();
  }, [controlledSeconds, onTimeExpire]);

  const display =
    controlledSeconds !== undefined
      ? Math.max(0, Math.round(controlledSeconds))
      : seconds;

  const hours = Math.floor(display / 3600);
  const minutes = Math.floor((display % 3600) / 60);
  const secs = display % 60;
  const pad = (v: number) => v.toString().padStart(2, "0");

  const isLowTime = display <= 600;

  return (
    <div
      role="timer"
      aria-live="polite"
      className={cn(
        "flex items-baseline gap-1 font-serif tabular-nums transition-colors",
        isLowTime ? "text-mint-deep" : "text-ink",
      )}
    >
      <span className="text-[26px] font-semibold leading-none tracking-[-0.02em]">
        {pad(hours)}
      </span>
      <span className="text-[22px] leading-none text-muted">:</span>
      <span className="text-[26px] font-semibold leading-none tracking-[-0.02em]">
        {pad(minutes)}
      </span>
      <span className="text-[22px] leading-none text-muted">:</span>
      <span className="text-[26px] font-semibold leading-none tracking-[-0.02em]">
        {pad(secs)}
      </span>
    </div>
  );
};

export default Timer;
