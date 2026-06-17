"use client";

import { useEffect, useState } from "react";
import { Headphones, BookOpen, PenLine } from "lucide-react";

type SectionId = "listening" | "reading" | "writing";

interface Props {
  section: SectionId;
  durationSeconds: number;
  onDismiss: () => void;
  /** Auto-dismiss after this many milliseconds. Default 3500. */
  autoDismissMs?: number;
}

const COPY: Record<SectionId, { label: string; cue: string; Icon: typeof Headphones }> = {
  listening: {
    label: "Listening",
    cue: "Чихэвчээ бэлэн байлгана уу",
    Icon: Headphones,
  },
  reading: {
    label: "Reading",
    cue: "Гурван хэсэгтэй",
    Icon: BookOpen,
  },
  writing: {
    label: "Writing",
    cue: "Хоёр даалгавартай",
    Icon: PenLine,
  },
};

export function SectionIntroCard({
  section,
  durationSeconds,
  onDismiss,
  autoDismissMs = 3500,
}: Props) {
  const [visible, setVisible] = useState(true);
  const minutes = Math.round(durationSeconds / 60);
  const { label, cue, Icon } = COPY[section];

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismissMs]);

  // After fade-out finishes, notify parent so the overlay unmounts.
  useEffect(() => {
    if (visible) return;
    const t = setTimeout(onDismiss, 300);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-white/95 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-label={`${label} section starting`}
    >
      <div
        className="flex flex-col items-center gap-6 rounded-2xl border border-zinc-200 bg-white px-12 py-10 shadow-xl"
        style={{
          transition: "transform 350ms cubic-bezier(0.32, 0.04, 0.18, 1)",
          transform: visible ? "scale(1)" : "scale(0.96)",
        }}
      >
        <Icon className="h-10 w-10 text-emerald-600" strokeWidth={1.5} />
        <div className="text-center">
          <div className="text-4xl font-semibold tracking-tight text-zinc-900">{label}</div>
          <div className="mt-1 text-lg text-zinc-500">{minutes} мин</div>
        </div>
        <div className="text-sm text-zinc-600">{cue}</div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="mt-2 rounded-lg border border-zinc-300 px-5 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Үргэлжлүүлэх →
        </button>
      </div>
    </div>
  );
}
