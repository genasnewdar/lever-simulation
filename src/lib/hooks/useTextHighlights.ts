"use client";

import { useEffect } from "react";

export interface HighlightSpec {
  start: number;
  end: number;
  color: "yellow" | "pink";
}


function rangeFromCharOffsets(
  container: HTMLElement,
  charStart: number,
  charEnd: number,
): Range | null {
  if (charStart === charEnd) return null;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let pos = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const len = node.length;
    const nodeStart = pos;
    const nodeEnd = pos + len;
    if (!startNode && charStart >= nodeStart && charStart <= nodeEnd) {
      startNode = node;
      startOffset = charStart - nodeStart;
    }
    if (charEnd > nodeStart && charEnd <= nodeEnd) {
      endNode = node;
      endOffset = charEnd - nodeStart;
      break;
    }
    pos = nodeEnd;
  }
  if (!startNode || !endNode) return null;
  try {
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  } catch {
    return null;
  }
}

export function isCustomHighlightSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Highlight" in window &&
    "CSS" in window &&
    "highlights" in CSS
  );
}

/**
 * Apply a list of color-coded character-offset highlights to a container using
 * the CSS Custom Highlight API. No DOM mutation — survives React re-renders.
 *
 * Effect re-runs whenever `highlights` or `version` changes. Pass `version`
 * (e.g. the active passage id) to force a re-application after the container's
 * text content is replaced.
 */
export function useTextHighlights(
  ref: React.RefObject<HTMLElement | null>,
  highlights: HighlightSpec[],
  options?: { yellowName?: string; pinkName?: string; version?: string | number },
) {
  const yellowName = options?.yellowName ?? "user-yellow";
  const pinkName = options?.pinkName ?? "user-pink";
  const version = options?.version;

  useEffect(() => {
    if (!isCustomHighlightSupported()) return;
    const el = ref.current;
    if (!el) return;

    const yellowRanges: Range[] = [];
    const pinkRanges: Range[] = [];
    for (const h of highlights) {
      const r = rangeFromCharOffsets(el, h.start, h.end);
      if (!r) continue;
      if (h.color === "yellow") yellowRanges.push(r);
      else pinkRanges.push(r);
    }
    if (yellowRanges.length) {
      CSS.highlights.set(yellowName, new Highlight(...yellowRanges));
    } else {
      CSS.highlights.delete(yellowName);
    }
    if (pinkRanges.length) {
      CSS.highlights.set(pinkName, new Highlight(...pinkRanges));
    } else {
      CSS.highlights.delete(pinkName);
    }
    return () => {
      CSS.highlights.delete(yellowName);
      CSS.highlights.delete(pinkName);
    };
  }, [ref, highlights, yellowName, pinkName, version]);
}
