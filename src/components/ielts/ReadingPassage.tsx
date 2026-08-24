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
  | {
      kind: "mark";
      /** Render slice within the passage text. */
      start: number;
      end: number;
      color: HighlightColor;
      /** True where a yellow and a pink highlight overlap this run. */
      overlap: boolean;
      /** Original range of the topmost highlight — used for right-click removal. */
      hlStart: number;
      hlEnd: number;
      hlId?: string;
      /** Note (and its owning highlight range), shown once at the run that ends
       *  at the noted highlight's tail so a split highlight has a single pin. */
      note?: string;
      noteStart?: number;
      noteEnd?: number;
      noteId?: string;
    };

const SegmentRenderer: React.FC<{ seg: Segment; text: string }> = ({ seg, text }) => {
  if (seg.kind === "mark") {
    // The pens are tokens (see globals.css): translucent over light paper,
    // opaque over dark, with their own absolute ink either way.
    const bg = seg.color === "yellow" ? "var(--hl-yellow)" : "var(--hl-pink)";
    const titleText = seg.note
      ? `Note: ${seg.note}\n(Right-click to remove)`
      : "Right-click to remove highlight";
    return (
      <mark
        data-hl="1"
        data-hl-overlap={seg.overlap ? "1" : undefined}
        data-hl-start={seg.hlStart}
        data-hl-end={seg.hlEnd}
        data-hl-id={seg.hlId}
        title={titleText}
        className="cursor-context-menu"
        style={{
          backgroundColor: seg.overlap ? "var(--hl-overlap)" : bg,
          color: "var(--hl-ink)",
          padding: "0.1em 0",
          borderRadius: "2px",
          position: "relative",
        }}
      >
        {text}
        {seg.note && (
          <span
            data-note-pin="1"
            data-hl-start={seg.noteStart}
            data-hl-end={seg.noteEnd}
            data-hl-id={seg.noteId}
            title={seg.note}
            style={{
              position: "absolute",
              top: "-0.7em",
              right: "-0.35em",
              fontSize: "0.7em",
              lineHeight: 1,
              color: "var(--mint-deep)",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            ✎
          </span>
        )}
      </mark>
    );
  }
  return <span>{text}</span>;
};

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
        h.color === "yellow" ? "var(--hl-yellow)" : "var(--hl-pink)";
      mark.className = "cursor-context-menu";
      mark.style.color = "var(--hl-ink)";
      mark.style.padding = "0.1em 0";
      mark.style.borderRadius = "2px";
      mark.style.position = "relative";

      range.surroundContents(mark);

      if (h.note) {
        const pin = document.createElement("span");
        pin.setAttribute("data-note-pin", "1");
        pin.setAttribute("data-hl-start", String(h.start));
        pin.setAttribute("data-hl-end", String(h.end));
        if (h.id) pin.setAttribute("data-hl-id", h.id);
        pin.title = h.note;
        pin.textContent = "✎";
        // Out of the text flow so it never splits a word.
        pin.style.cssText =
          "position:absolute;top:-0.7em;right:-0.35em;font-size:0.7em;line-height:1;color:var(--mint-deep);cursor:pointer;user-select:none;";
        mark.appendChild(pin);
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

    const segments = useMemo(() => {
      const result: Segment[] = [];
      if (html) return result;

      const clamp = (n: number) => Math.max(0, Math.min(content.length, n));
      const valid = highlights
        .map((h) => ({ ...h, start: clamp(h.start), end: clamp(h.end) }))
        .filter((h) => h.end > h.start);

      if (valid.length === 0) {
        if (content.length > 0) result.push({ kind: "text", start: 0, end: content.length });
        return result;
      }

      // Boundary sweep: every highlight edge becomes a cut point so overlapping
      // ranges split into disjoint runs. Each run is then fully covered (or not)
      // by each highlight, which lets us blend colours where two overlap.
      const bounds = new Set<number>([0, content.length]);
      for (const h of valid) {
        bounds.add(h.start);
        bounds.add(h.end);
      }
      const points = [...bounds].sort((a, b) => a - b);

      for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];
        const end = points[i + 1];
        if (end <= start) continue;

        const covers = valid.filter((h) => h.start <= start && h.end >= end);
        if (covers.length === 0) {
          result.push({ kind: "text", start, end });
          continue;
        }

        // Topmost = most recently added highlight (last in the array).
        const top = covers[covers.length - 1];
        const overlap =
          covers.some((c) => c.color === "yellow") &&
          covers.some((c) => c.color === "pink");
        // Show a note pin once, on the run that ends at the noted highlight's tail.
        const noteHl = covers.find((c) => c.note && c.end === end);

        result.push({
          kind: "mark",
          start,
          end,
          color: top.color,
          overlap,
          hlStart: top.start,
          hlEnd: top.end,
          hlId: top.id,
          note: noteHl?.note,
          noteStart: noteHl?.start,
          noteEnd: noteHl?.end,
          noteId: noteHl?.id,
        });
      }
      return result;
    }, [content, highlights, html]);

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
