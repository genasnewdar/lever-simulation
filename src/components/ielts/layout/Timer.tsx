"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TimerProps {
  initialSeconds: number;
  onTimeExpire?: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onTimeExpire }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
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
  }, [seconds, onTimeExpire]);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (v: number) => v.toString().padStart(2, "0");

  const isLowTime = seconds <= 600; // ≤ 10 min

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
