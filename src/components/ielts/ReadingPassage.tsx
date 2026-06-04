"use client";

import React, { forwardRef, useMemo, useRef, useEffect, useImperativeHandle, useCallback } from "react";
import { cn } from "@/lib/utils";

export type HighlightColor = "yellow" | "pink";

export interface PassageHighlight {
  start: number;
  end: number;
  color: HighlightColor;
  /** Optional sticky note attached to this highlight */
  note?: string;
  /** Stable id so notes can be edited/removed without ambiguity when ranges overlap */
  id?: string;
}

interface ReadingPassageProps {
  content: string;
  highlights: PassageHighlight[];
  className?: string;
  /** Called when the user right-clicks on an existing highlight. Parent should remove it from storage. */
  onRemoveHighlight?: (start: number, end: number) => void;
  /** Called when the user clicks an existing note pin to view/edit the attached note. */
  onOpenNote?: (highlight: PassageHighlight) => void;
}

function isHtmlContent(text: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(text);
}

type Segment =
  | { kind: "text"; start: number; end: number }
  | { kind: "mark"; start: number; end: number; color: HighlightColor; note?: string; id?: string };

const SegmentRenderer = React.memo<{
  seg: Segment;
  text: string;
}>(({ seg, text }) => {
  if (seg.kind === "mark") {
    const bg =
      seg.color === "yellow"
        ? "color-mix(in oklch, #f5d665 45%, transparent)"
        : "color-mix(in oklch, #f498c4 40%, transparent)";
    const titleText = seg.note
      ? `Note: ${seg.note}\n(Right-click to remove)`
      : "Right-click to remove highlight";
    return (
      <React.Fragment>
        <mark
          data-hl="1"
          data-hl-start={seg.start}
          data-hl-end={seg.end}
          data-hl-id={seg.id}
          title={titleText}
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
        {seg.note && (
          <span
            data-note-pin="1"
            data-hl-start={seg.start}
            data-hl-end={seg.end}
            data-hl-id={seg.id}
            title={seg.note}
            style={{
              display: "inline-block",
              marginLeft: 2,
              fontSize: "0.75em",
              color: "var(--mint-deep)",
              cursor: "pointer",
              userSelect: "none",
              verticalAlign: "super",
            }}
          >
            ✎
          </span>
        )}
      </React.Fragment>
    );
  }
  return <span>{text}</span>;
}, (prevProps, nextProps) => {
  // Deep compare seg object
  const seg1 = prevProps.seg;
  const seg2 = nextProps.seg;
  
  if (seg1.kind !== seg2.kind) return false;
  if (prevProps.text !== nextProps.text) return false;
  
  if (seg1.kind === "mark" && seg2.kind === "mark") {
    return (
      seg1.start === seg2.start &&
      seg1.end === seg2.end &&
      seg1.color === seg2.color &&
      seg1.note === seg2.note &&
      seg1.id === seg2.id
    );
  }
  
  return seg1.start === seg2.start && seg1.end === seg2.end;
});

SegmentRenderer.displayName = "SegmentRenderer";

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
      if (h.id) mark.setAttribute("data-hl-id", h.id);
      mark.title = h.note
        ? `Note: ${h.note}\n(Right-click to remove)`
        : "Right-click to remove highlight";
      mark.style.backgroundColor =
        h.color === "yellow"
          ? "color-mix(in oklch, #f5d665 45%, transparent)"
          : "color-mix(in oklch, #f498c4 40%, transparent)";
      mark.className = "cursor-context-menu";
      mark.style.color = "inherit";
      mark.style.padding = "0.05em 0.1em";
      mark.style.borderRadius = "2px";

      range.surroundContents(mark);

      if (h.note) {
        const pin = document.createElement("span");
        pin.setAttribute("data-note-pin", "1");
        pin.setAttribute("data-hl-start", String(h.start));
        pin.setAttribute("data-hl-end", String(h.end));
        if (h.id) pin.setAttribute("data-hl-id", h.id);
        pin.title = h.note;
        pin.textContent = "✎";
        pin.style.cssText =
          "display:inline-block;margin-left:2px;font-size:0.75em;color:var(--mint-deep);cursor:pointer;user-select:none;vertical-align:super;";
        mark.insertAdjacentElement("afterend", pin);
      }
    } catch {
      // surroundContents can fail for cross-element ranges
    }

    return;
  }
}

const ReadingPassage = React.memo(forwardRef<HTMLDivElement, ReadingPassageProps>(
  ({ content, highlights, className, onRemoveHighlight, onOpenNote }, ref) => {
    const localRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => localRef.current!);

    const html = useMemo(() => isHtmlContent(content), [content]);

    type Segment =
      | { kind: "text"; start: number; end: number }
      | { kind: "mark"; start: number; end: number; color: HighlightColor; note?: string; id?: string };
    
    const segments = useMemo(() => {
      const result: Segment[] = [];
      if (!html) {
        const sorted = [...highlights].sort((a, b) => a.start - b.start);
        let pos = 0;
        for (const h of sorted) {
          if (h.start > pos) {
            result.push({ kind: "text", start: pos, end: h.start });
          }
          if (h.end > h.start) {
            result.push({
              kind: "mark",
              start: h.start,
              end: h.end,
              color: h.color,
              note: h.note,
              id: h.id,
            });
          }
          pos = Math.max(pos, h.end);
        }
        if (pos < content.length) {
          result.push({ kind: "text", start: pos, end: content.length });
        }
      }
      return result;
    }, [content, highlights, html])

    useEffect(() => {
      const el = localRef.current;
      if (!html || !el) return;

      el.innerHTML = content;
      if (highlights.length === 0) return;

      const sorted = [...highlights].sort((a, b) => b.start - a.start);
      for (const h of sorted) {
        applyHighlightToDOM(el, h);
      }
    }, [html, highlights, content]);

    const findHighlight = useCallback(
      (target: HTMLElement): PassageHighlight | null => {
        const start = Number(target.dataset.hlStart);
        const end = Number(target.dataset.hlEnd);
        if (Number.isNaN(start) || Number.isNaN(end)) return null;
        const id = target.dataset.hlId;
        return highlights.find((h) => {
          if (id && h.id) return h.id === id;
          return h.start === start && h.end === end;
        }) ?? null;
      },
      [highlights],
    );

    const handleContextMenu = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!onRemoveHighlight) return;
        const target = (e.target as HTMLElement).closest<HTMLElement>(
          "mark[data-hl='1'], span[data-note-pin='1']",
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

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!onOpenNote) return;
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) return;
        const target = (e.target as HTMLElement).closest<HTMLElement>(
          "[data-note-pin='1'], mark[data-hl='1']",
        );
        if (!target) return;
        const h = findHighlight(target);
        if (!h) return;
        e.stopPropagation();
        onOpenNote(h);
      },
      [onOpenNote, findHighlight],
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
          onClick={handleClick}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    return (
      <div
        ref={localRef}
        className={baseClass}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
      >
        {segments.map((seg) => {
          const text = content.slice(seg.start, seg.end);
          return <SegmentRenderer key={`${seg.start}-${seg.end}`} seg={seg} text={text} />;
        })}
      </div>
    );
  }
), (prevProps, nextProps) => {
  if (prevProps.content !== nextProps.content) return false;
  if (prevProps.className !== nextProps.className) return false;

  if (prevProps.highlights.length !== nextProps.highlights.length) return false;
  for (let i = 0; i < prevProps.highlights.length; i++) {
    const p = prevProps.highlights[i];
    const n = nextProps.highlights[i];
    if (
      p.start !== n.start ||
      p.end !== n.end ||
      p.color !== n.color ||
      p.note !== n.note ||
      p.id !== n.id
    ) {
      return false;
    }
  }

  return true;
});

ReadingPassage.displayName = "ReadingPassage";

export default ReadingPassage;
