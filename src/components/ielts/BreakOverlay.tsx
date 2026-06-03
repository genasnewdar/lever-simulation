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
 * then calls `onDone`, which loads the next section. The candidate may end the
 * break early with the button. While this is mounted, no section timer runs.
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm"
      role="dialog"
      aria-label="Break between sections"
    >
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-zinc-200 bg-white px-12 py-10 shadow-xl">
        <Coffee className="h-10 w-10 text-emerald-600" strokeWidth={1.5} />
        <div className="text-center">
          <div className="text-4xl font-semibold tracking-tight text-zinc-900">
            Завсарлага
          </div>
          <div className="mt-2 font-serif text-5xl font-semibold tabular-nums text-emerald-600">
            {fmt(remaining)}
          </div>
        </div>
        <div className="max-w-xs text-center text-sm text-zinc-600">
          Дараагийн хэсэг автоматаар эхэлнэ. Бэлэн бол доорх товчийг дарж үргэлжлүүлж болно.
        </div>
        <button
          type="button"
          onClick={finish}
          className="mt-2 rounded-lg border border-zinc-300 px-5 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Үргэлжлүүлэх →
        </button>
      </div>
    </div>
  );
}
