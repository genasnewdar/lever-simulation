"use client";

import { useEffect, useRef } from "react";

/**
 * The candidate's own answer boxes are the one place the clipboard stays alive:
 * the real computer-delivered test lets a candidate cut, copy and paste inside
 * the answer they are writing (that is how you move a sentence in Task 2), and
 * nowhere else. Everything outside them — the passage, the questions, the
 * transcript of instructions — is exam material and must not leave the screen.
 */
function isAnswerField(node: EventTarget | null): boolean {
  const el =
    node instanceof HTMLElement
      ? node
      : node instanceof Node
        ? node.parentElement
        : null;
  return !!el?.closest("input, textarea, [contenteditable='true']");
}

/** True when the live selection is entirely inside one answer field. */
function selectionIsInsideAnswerField(): boolean {
  const active = document.activeElement;
  if (!isAnswerField(active)) return false;
  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement
  ) {
    return active.selectionStart !== active.selectionEnd;
  }
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return false;
  return isAnswerField(sel.anchorNode) && isAnswerField(sel.focusNode);
}

/** Ctrl/Cmd shortcuts that would hand the candidate a way out of the exam. */
const BLOCKED_MODIFIER_KEYS = new Set([
  "f", // browser find — searching the passage for a keyword is not reading it
  "g", // find again
  "p", // print
  "s", // save page
  "u", // view source
]);

/** Clipboard shortcuts: allowed inside an answer field, blocked outside it. */
const CLIPBOARD_KEYS = new Set(["c", "x", "v", "a"]);

/**
 * Exam lockdown for the test screen: no copying the paper out, no browser find,
 * no printing or saving the page, no native context menu, and no pasting an
 * answer that was written somewhere else.
 *
 * This is a candidate-facing guard, not a security boundary — someone with
 * devtools open can undo any of it. It exists so the ordinary ways of lifting
 * text off the screen (Ctrl+C, right-click → Copy, drag the selection out) and
 * of shortcutting the reading (Ctrl+F) are simply not there during the sitting.
 */
export function useExamLockdown(enabled: boolean = true): void {
  // Paste is allowed only when the clipboard was filled by a copy/cut we
  // ourselves permitted — i.e. from inside an answer box. Anything the
  // candidate copied in another tab before the exam stays out.
  const clipboardIsOurs = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const onCopyOrCut = (e: ClipboardEvent) => {
      if (selectionIsInsideAnswerField()) {
        clipboardIsOurs.current = true;
        return;
      }
      e.preventDefault();
    };

    const onPaste = (e: ClipboardEvent) => {
      if (!isAnswerField(e.target) || !clipboardIsOurs.current) {
        e.preventDefault();
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      // The native menu carries Copy, "Search with…" and Translate. The exam's
      // own right-click action (erasing a highlight) runs on its container and
      // is unaffected — preventDefault does not stop propagation.
      e.preventDefault();
    };

    const onDragStart = (e: DragEvent) => {
      if (!isAnswerField(e.target)) e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F3") {
        e.preventDefault();
        return;
      }
      if (!e.ctrlKey && !e.metaKey) return;
      const key = e.key.toLowerCase();
      if (CLIPBOARD_KEYS.has(key)) {
        if (isAnswerField(e.target) || isAnswerField(document.activeElement)) {
          // Track our own copy/cut here too: the keyboard path fires the copy
          // event as well, but Ctrl+X on an empty selection would not.
          if (key === "c" || key === "x") clipboardIsOurs.current = true;
          return;
        }
        e.preventDefault();
        return;
      }
      if (BLOCKED_MODIFIER_KEYS.has(key)) {
        e.preventDefault();
      }
    };

    document.addEventListener("copy", onCopyOrCut, true);
    document.addEventListener("cut", onCopyOrCut, true);
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart, true);
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("copy", onCopyOrCut, true);
      document.removeEventListener("cut", onCopyOrCut, true);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [enabled]);
}
