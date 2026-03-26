import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Get the first text node inside a node, or the node itself if it is a text node. */
function getFirstTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) return node as Text;
  for (let i = 0; i < node.childNodes.length; i++) {
    const t = getFirstTextNode(node.childNodes[i]);
    if (t) return t;
  }
  return null;
}

/** Get the last text node inside a node, or the node itself if it is a text node. */
function getLastTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) return node as Text;
  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const t = getLastTextNode(node.childNodes[i]);
    if (t) return t;
  }
  return null;
}

/**
 * Get character offsets [start, end] of a DOM Range within a container element.
 * Walks text nodes in tree order and counts characters.
 * If start/end containers are elements, uses their first/last text node for offset.
 */
export function getSelectionCharacterOffsets(
  container: HTMLElement | null,
  range: Range
): [number, number] | null {
  if (!container) return null;
  let current = 0;
  let startOffset: number | null = null;
  let endOffset: number | null = null;

  const startNode =
    range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer
      : getFirstTextNode(range.startContainer);
  const endNode =
    range.endContainer.nodeType === Node.TEXT_NODE
      ? range.endContainer
      : getLastTextNode(range.endContainer);
  const startOff =
    range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startOffset
      : 0;
  const endOff =
    range.endContainer.nodeType === Node.TEXT_NODE
      ? range.endOffset
      : (endNode?.textContent?.length ?? 0);

  function walk(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = (node.textContent || "").length;
      const nodeStart = current;
      const nodeEnd = current + len;
      if (node === startNode) startOffset = nodeStart + startOff;
      if (node === endNode) endOffset = nodeStart + endOff;
      current = nodeEnd;
      if (startOffset != null && endOffset != null) return true;
    } else if (
      node.nodeType === Node.ELEMENT_NODE ||
      node.nodeType === Node.DOCUMENT_FRAGMENT_NODE
    ) {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (walk(node.childNodes[i])) return true;
      }
    }
    return false;
  }

  walk(container);
  if (startOffset != null && endOffset != null) return [startOffset, endOffset];
  return null;
}
