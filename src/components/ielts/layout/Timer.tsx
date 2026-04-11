'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TimerProps {
  initialSeconds: number;
  onTimeExpire?: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onTimeExpire }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  // Update internal seconds if initialSeconds changes (e.g. section change)
  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  // Only fire onTimeExpire when we count down to 0 (not when already 0 after section switch)
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

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [hours, minutes, secs]
      .map((v) => v.toString().padStart(2, '0'))
      .join(':');
  };

  const isLowTime = seconds <= 600; // 10 minutes

  return (
    <div
      className={cn(
        "px-4 py-1.5 rounded bg-white/10 border border-white/20 transition-all min-w-[120px] text-center",
        isLowTime && "bg-red-600 border-red-400 animate-pulse"
      )}
    >
      <span className="text-xl font-bold font-mono tracking-wider tabular-nums text-white">
        {formatTime(seconds)}
      </span>
    </div>
  );
};

export default Timer;
