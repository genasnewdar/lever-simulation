"use client";

import { useEffect, useState } from "react";

interface Props {
  onComplete: () => void;
  /** Seconds to count down from. Default 3. */
  seconds?: number;
}

export function CountdownOverlay({ onComplete, seconds = 3 }: Props) {
  const [n, setN] = useState(seconds);

  useEffect(() => {
    if (n <= 0) {
      const t = setTimeout(onComplete, 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN(n - 1), 800);
    return () => clearTimeout(t);
  }, [n, onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 text-white"
      role="alert"
      aria-live="assertive">
      <div
        key={n}
        className="text-center"
        style={{
          animation: "scaleFade 700ms cubic-bezier(0.32, 0.04, 0.18, 1)",
        }}>
        {n > 0 ? (
          <div className="text-9xl font-bold tracking-tight">{n}</div>
        ) : (
          <div className="text-5xl font-semibold tracking-tight">Эхэлье!</div>
        )}
      </div>
      <style>{`
        @keyframes scaleFade {
          0% { opacity: 0; transform: scale(1.4); }
          50% { opacity: 1; transform: scale(1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
