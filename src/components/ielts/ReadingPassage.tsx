"use client";

import React, { forwardRef, useMemo, useRef, useEffect, useImperativeHandle } from "react";
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

/** Apply a single highlight to a container by walking text nodes */
function applyHighlightToDOM(container: HTMLElement, h: PassageHighlight) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let charPos = 0;
  let node: Text | null;

  while ((node = walker.nextNode() as Text | null)) {
    const nodeStart = charPos;
    const nodeEnd = charPos + node.length;

    if (nodeEnd <= h.start) {
      charPos = nodeEnd;
      continue;
    }
    if (nodeStart >= h.end) break;

    const relStart = Math.max(0, h.start - nodeStart);
    const relEnd = Math.min(node.length, h.end - nodeStart);

    try {
      const range = document.createRange();
      range.setStart(node, relStart);
      range.setEnd(node, relEnd);

      const mark = document.createElement("mark");
      mark.setAttribute("data-hl", "1");
      mark.className =
        h.color === "yellow"
          ? "bg-yellow-200 text-inherit rounded-sm px-0.5"
          : "bg-pink-200 text-inherit rounded-sm px-0.5";

      range.surroundContents(mark);
    } catch {
      // surroundContents can fail for cross-element ranges
    }

    // After wrapping, text nodes are split — re-walk for next highlight
    return;
  }
}

/**
 * Renders reading passage content with persisted highlights (yellow/pink).
 * Supports both plain text and HTML content.
 * Parent should store highlights in state keyed by passage id so they persist when switching tabs.
 */
const ReadingPassage = forwardRef<HTMLDivElement, ReadingPassageProps>(
  ({ content, highlights, className }, ref) => {
    const localRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => localRef.current!);

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

    // For HTML content: apply highlights via DOM manipulation after render
    useEffect(() => {
      const el = localRef.current;
      if (!html || !el || highlights.length === 0) return;

      // Reset to original HTML first (remove old highlights)
      el.innerHTML = content;

      // Apply each highlight from last to first so positions stay valid
      const sorted = [...highlights].sort((a, b) => b.start - a.start);
      for (const h of sorted) {
        applyHighlightToDOM(el, h);
      }
    }, [html, highlights, content]);

    const baseClass = cn(
      "prose prose-xl prose-slate max-w-none text-textprimary leading-relaxed font-normal select-text",
      html ? "[&>p]:mb-4 [&>p:last-child]:mb-0" : "whitespace-pre-wrap",
      className
    );

    // HTML content: render with dangerouslySetInnerHTML
    if (html) {
      return (
        <div
          ref={localRef}
          className={baseClass}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    // Plain text content: render with highlight segments
    return (
      <div ref={localRef} className={baseClass}>
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
