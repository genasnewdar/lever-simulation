"use client";

import React, { useState, useEffect, useRef } from "react";
import { FileText, Check, X } from "lucide-react";

export type HighlightColor = "yellow" | "pink";

interface ToolbarProps {
  onHighlight: (color: HighlightColor) => void;
  onSaveNote: (color: HighlightColor, note: string) => void;
  selection: Selection | null;
  /** When provided, the toolbar opens in note-editing mode for this initial value. */
  noteEditor?: { initialNote: string; color: HighlightColor } | null;
  onCloseNoteEditor?: () => void;
  anchorRect?: DOMRect | null;
}

const TOOLBAR_HEIGHT = 44;
const TOOLBAR_GAP = 12;

const FloatingToolbar: React.FC<ToolbarProps> = ({
  onHighlight,
  onSaveNote,
  selection,
  noteEditor,
  onCloseNoteEditor,
  anchorRect,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<"menu" | "note">("menu");
  const [noteText, setNoteText] = useState("");
  const [noteColor, setNoteColor] = useState<HighlightColor>("yellow");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Note-editor mode: open from existing highlight (no live selection needed).
  useEffect(() => {
    if (noteEditor) {
      setMode("note");
      setNoteText(noteEditor.initialNote ?? "");
      setNoteColor(noteEditor.color);
      setShow(true);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [noteEditor]);

  // Position from current selection OR explicit anchor rect. Once the user
  // enters note mode, freeze the position — the textarea will steal focus
  // and collapse the browser selection, but we want the toolbar to stay put.
  useEffect(() => {
    if (mode === "note" && !anchorRect) {
      // Pinned at last known position while user types the note.
      return;
    }

    let rect: DOMRect | null = null;
    if (anchorRect) {
      rect = anchorRect;
    } else if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      rect = selection.getRangeAt(0).getBoundingClientRect();
    }

    if (!rect || (rect.width === 0 && rect.height === 0)) {
      if (!noteEditor && mode !== "note") {
        setShow(false);
        setMode("menu");
      }
      return;
    }

    const viewportW = window.innerWidth;
    const idealTop = rect.top - TOOLBAR_HEIGHT - TOOLBAR_GAP;
    const top = idealTop < 8 ? rect.bottom + TOOLBAR_GAP : idealTop;
    const centerX = rect.left + rect.width / 2;
    const left = Math.max(160, Math.min(viewportW - 160, centerX));

    setPosition({ top, left });
    setShow(true);
  }, [selection, anchorRect, noteEditor, mode]);

  // Reset to menu mode when selection clears (only when not actively editing a note).
  useEffect(() => {
    if (!selection && !noteEditor && mode !== "note") {
      setMode("menu");
      setNoteText("");
    }
  }, [selection, noteEditor, mode]);

  if (!show) return null;

  const close = () => {
    setShow(false);
    setMode("menu");
    setNoteText("");
    onCloseNoteEditor?.();
  };

  const handleStartNote = () => {
    setMode("note");
    setNoteText("");
    setNoteColor("yellow");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleSaveNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) {
      close();
      return;
    }
    onSaveNote(noteColor, trimmed);
    close();
  };

  // Buttons that should NOT clear the user's selection when pressed — they
  // need to keep `savedRangeRef` intact so the highlight applies to the
  // selected range. Inputs (the textarea) MUST receive focus, so we don't
  // swallow mousedown there.
  const keepSelection = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div
      className="fixed z-[100] -translate-x-1/2 select-none"
      style={{ top: position.top, left: position.left }}
    >
      {mode === "menu" ? (
        <div className="flex items-center bg-gray-900 border border-white/20 rounded-lg shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onMouseDown={keepSelection}
            onClick={() => onHighlight("yellow")}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-white rounded transition-colors"
            title="Highlight in yellow"
          >
            <span className="w-4 h-4 rounded-sm bg-yellow-200 border border-yellow-300" />
            <span className="text-xs font-semibold">Yellow</span>
          </button>
          <button
            type="button"
            onMouseDown={keepSelection}
            onClick={() => onHighlight("pink")}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-white rounded transition-colors"
            title="Highlight in pink"
          >
            <span className="w-4 h-4 rounded-sm bg-pink-300 border border-pink-400" />
            <span className="text-xs font-semibold">Pink</span>
          </button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button
            type="button"
            onMouseDown={keepSelection}
            onClick={handleStartNote}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-white rounded transition-colors"
            title="Add a note"
          >
            <FileText className="w-4 h-4 text-mint-deep" />
            <span className="text-xs font-semibold">Note</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 bg-gray-900 border border-white/20 rounded-lg shadow-2xl p-2 w-[280px] animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-white/70">
            <span>Note</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setNoteColor("yellow")}
                className={`w-4 h-4 rounded-sm border ${
                  noteColor === "yellow"
                    ? "ring-2 ring-white"
                    : "border-yellow-300"
                } bg-yellow-200`}
                title="Yellow"
              />
              <button
                type="button"
                onClick={() => setNoteColor("pink")}
                className={`w-4 h-4 rounded-sm border ${
                  noteColor === "pink" ? "ring-2 ring-white" : "border-pink-400"
                } bg-pink-300`}
                title="Pink"
              />
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleSaveNote();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                close();
              }
            }}
            placeholder="Type your note…"
            rows={3}
            className="w-full text-xs px-2 py-1.5 bg-white/10 text-white placeholder-white/40 rounded border border-white/15 focus:border-white/40 outline-none resize-none"
          />
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={close}
              className="flex items-center gap-1 px-2 py-1 text-xs text-white/70 hover:text-white rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNote}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-mint-deep text-white rounded font-semibold hover:opacity-90 transition-opacity"
            >
              <Check className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingToolbar;
