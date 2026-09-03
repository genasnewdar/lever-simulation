"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * The real computer-delivered test puts a "Review" tick-box beside every
 * question; ticking it turns that number in the bottom navigation bar from a
 * square into a circle, so the questions to come back to are picked out at a
 * glance. Renders nothing when there is nothing to toggle.
 */
export function ReviewCheckbox({
  questionNumber,
  checked,
  onToggle,
}: {
  questionNumber: number;
  checked: boolean;
  onToggle?: (n: number) => void;
}) {
  if (!onToggle) return null;
  return (
    <label
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 cursor-pointer rounded px-1.5 py-0.5 text-[11px] transition-colors",
        checked ? "text-ink font-semibold" : "text-muted hover:text-ink-soft",
      )}
      title={`Mark question ${questionNumber} for review`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(questionNumber)}
        tabIndex={-1}
        aria-label={`Mark question ${questionNumber} for review`}
        className="w-3.5 h-3.5 rounded-[3px] border-rule accent-[var(--flag)] cursor-pointer"
      />
      <span>Review</span>
    </label>
  );
}

export default ReviewCheckbox;
