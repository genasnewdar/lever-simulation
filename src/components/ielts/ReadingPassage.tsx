"use client";

import React, { forwardRef, useMemo, useRef, useEffect, useImperativeHandle, useCallback } from "react";
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
  /** Called when the user right-clicks on an existing highlight. Parent should remove it from storage. */
  onRemoveHighlight?: (start: number, end: number) => void;
}

function isHtmlContent(text: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(text);
}

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
      mark.setAttribute("data-hl-start", String(h.start));
      mark.setAttribute("data-hl-end", String(h.end));
      mark.title = "Right-click to remove highlight";
      mark.style.backgroundColor =
        h.color === "yellow"
          ? "color-mix(in oklch, #f5d665 45%, transparent)"
          : "color-mix(in oklch, #f498c4 40%, transparent)";
      mark.className = "cursor-context-menu";
      mark.style.color = "inherit";
      mark.style.padding = "0.05em 0.1em";
      mark.style.borderRadius = "2px";

      range.surroundContents(mark);
    } catch {
      // surroundContents can fail for cross-element ranges
    }

    return;
  }
}

const ReadingPassage = forwardRef<HTMLDivElement, ReadingPassageProps>(
  ({ content, highlights, className, onRemoveHighlight }, ref) => {
    const localRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => localRef.current!);

    const html = useMemo(() => isHtmlContent(content), [content]);

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

    useEffect(() => {
      const el = localRef.current;
      if (!html || !el || highlights.length === 0) return;

      el.innerHTML = content;

      const sorted = [...highlights].sort((a, b) => b.start - a.start);
      for (const h of sorted) {
        applyHighlightToDOM(el, h);
      }
    }, [html, highlights, content]);

    const handleContextMenu = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!onRemoveHighlight) return;
        const target = (e.target as HTMLElement).closest<HTMLElement>(
          "mark[data-hl='1']",
        );
        if (!target) return;
        const start = Number(target.dataset.hlStart);
        const end = Number(target.dataset.hlEnd);
        if (Number.isNaN(start) || Number.isNaN(end)) return;
        e.preventDefault();
        onRemoveHighlight(start, end);
      },
      [onRemoveHighlight],
    );

    const baseClass = cn(
      "passage-prose max-w-none select-text",
      html ? "" : "whitespace-pre-wrap",
      className
    );

    if (html) {
      return (
        <div
          ref={localRef}
          className={baseClass}
          onContextMenu={handleContextMenu}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    return (
      <div ref={localRef} className={baseClass} onContextMenu={handleContextMenu}>
        {segments.map((seg, i) => {
          const text = content.slice(seg.start, seg.end);
          if (seg.color === "yellow" || seg.color === "pink") {
            const bg =
              seg.color === "yellow"
                ? "color-mix(in oklch, #f5d665 45%, transparent)"
                : "color-mix(in oklch, #f498c4 40%, transparent)";
            return (
              <mark
                key={i}
                data-hl="1"
                data-hl-start={seg.start}
                data-hl-end={seg.end}
                title="Right-click to remove highlight"
                className="cursor-context-menu"
                style={{
                  backgroundColor: bg,
                  color: "inherit",
                  padding: "0.05em 0.1em",
                  borderRadius: "2px",
                }}
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
