"use client";

import React, { useState, useEffect } from "react";
import { FileText } from "lucide-react";

export type HighlightColor = "yellow" | "pink";

interface ToolbarProps {
  onHighlight: (color: HighlightColor) => void;
  onNote: () => void;
  selection: Selection | null;
}

const FloatingToolbar: React.FC<ToolbarProps> = ({
  onHighlight,
  onNote,
  selection,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY - 56,
        left: rect.left + window.scrollX + rect.width / 2,
      });
      setShow(true);
    } else {
      setShow(false);
    }
  }, [selection]);

  if (!show) return null;

  return (
    <div
      className="fixed z-[100] transform -translate-x-1/2 flex items-center bg-gray-900 border border-white/20 rounded-lg shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-200"
      style={{ top: position.top, left: position.left }}
    >
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onHighlight("yellow")}
        className="flex items-center space-x-2 px-3 py-1.5 hover:bg-white/10 text-white rounded transition-colors"
        title="Highlight in yellow"
      >
        <span className="w-4 h-4 rounded-sm bg-yellow-300 border border-yellow-400" />
        <span className="text-xs font-bold">Yellow</span>
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onHighlight("pink")}
        className="flex items-center space-x-2 px-3 py-1.5 hover:bg-white/10 text-white rounded transition-colors"
        title="Highlight in pink"
      >
        <span className="w-4 h-4 rounded-sm bg-pink-300 border border-pink-400" />
        <span className="text-xs font-bold">Pink</span>
      </button>
      <div className="w-px h-4 bg-white/20 mx-1" />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onNote}
        className="flex items-center space-x-2 px-3 py-1.5 hover:bg-white/10 text-white rounded transition-colors"
      >
        <FileText className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-bold">Note</span>
      </button>
    </div>
  );
};

export default FloatingToolbar;
