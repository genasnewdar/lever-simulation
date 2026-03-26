"use client";

import React, { forwardRef, useMemo } from "react";
import { cn } from "@/lib/utils";

export type HighlightColor = "yellow" | "pink";

export interface PassageHighlight {
  start: number;
  end: number;
  color: HighlightColor;
}

interface ReadingPassageProps {
  content: string;
  highlights: PassageHighlight[];
  className?: string;
}

/** Check if content contains HTML tags */
function isHtmlContent(text: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(text);
}

/** Strip HTML tags to get plain text (used for highlight offsets on HTML content) */
function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

/**
 * Renders reading passage content with persisted highlights (yellow/pink).
 * Supports both plain text and HTML content.
 * Parent should store highlights in state keyed by passage id so they persist when switching tabs.
 */
const ReadingPassage = forwardRef<HTMLDivElement, ReadingPassageProps>(
  ({ content, highlights, className }, ref) => {
    const html = useMemo(() => isHtmlContent(content), [content]);

    // For plain text content, use character-based highlight segments
    const segments: { start: number; end: number; color?: HighlightColor }[] =
      [];
    if (!html) {
      const sorted = [...highlights].sort((a, b) => a.start - b.start);
      let pos = 0;
      for (const h of sorted) {
        if (h.start > pos) {
          segments.push({ start: pos, end: h.start });
        }
        if (h.end > h.start) {
          segments.push({ start: h.start, end: h.end, color: h.color });
        }
        pos = Math.max(pos, h.end);
      }
      if (pos < content.length) {
        segments.push({ start: pos, end: content.length });
      }
    }

    const baseClass = cn(
      "prose prose-xl prose-slate max-w-none text-textprimary leading-relaxed font-normal select-text",
      html ? "[&>p]:mb-4 [&>p:last-child]:mb-0" : "whitespace-pre-wrap",
      className
    );

    // HTML content: render with dangerouslySetInnerHTML
    if (html) {
      return (
        <div
          ref={ref}
          className={baseClass}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    // Plain text content: render with highlight segments
    return (
      <div ref={ref} className={baseClass}>
        {segments.map((seg, i) => {
          const text = content.slice(seg.start, seg.end);
          if (seg.color === "yellow") {
            return (
              <mark
                key={i}
                className="bg-yellow-200 text-inherit rounded-sm px-0.5"
              >
                {text}
              </mark>
            );
          }
          if (seg.color === "pink") {
            return (
              <mark
                key={i}
                className="bg-pink-200 text-inherit rounded-sm px-0.5"
              >
                {text}
              </mark>
            );
          }
          return <span key={i}>{text}</span>;
        })}
      </div>
    );
  }
);

ReadingPassage.displayName = "ReadingPassage";

export default ReadingPassage;
