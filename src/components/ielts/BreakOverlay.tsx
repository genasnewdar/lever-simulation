"use client";

import { useEffect, useRef, useState } from "react";
import { Coffee } from "lucide-react";

interface Props {
  /** Length of the break, in seconds. */
  seconds: number;
  /** Called when the break ends — either the countdown hit 0 or the candidate skipped. */
  onDone: () => void;
}

const fmt = (total: number) => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/**
 * Full-screen fixed break shown between skills. Counts down from `seconds` and
 * then calls `onDone`, which loads the next section automatically. While this is
 * mounted, no section timer runs.
 */
export function BreakOverlay({ seconds, onDone }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  // Guard so onDone fires exactly once (countdown-zero and click can't both win).
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          finish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-paper/95 backdrop-blur-sm"
      role="dialog"
      aria-label="Break between sections"
    >
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-rule bg-paper-2 px-12 py-10 shadow-xl">
        <Coffee className="h-10 w-10 text-mint-deep" strokeWidth={1.5} />
        <div className="text-center">
          <div className="text-4xl font-semibold tracking-tight text-ink">
            Завсарлага
          </div>
          <div className="mt-2 font-serif text-5xl font-semibold tabular-nums text-mint-deep">
            {fmt(remaining)}
          </div>
        </div>
        <div className="max-w-xs text-center text-sm text-ink-soft">
          Дараагийн хэсэг автоматаар эхэлнэ.
        </div>
      </div>
    </div>
  );
}
