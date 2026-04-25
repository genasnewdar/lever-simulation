"use client";

import React from "react";
import { X } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalQuestions: number;
  /** Map from question number (1-based) to the student's answer string */
  answers: Record<number, string>;
}

const COLS = 4;

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  totalQuestions,
  answers,
}) => {
  if (!isOpen) return null;

  const rows = Math.ceil(totalQuestions / COLS);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-paper rounded-lg shadow-page w-full max-w-[720px] max-h-[80vh] flex flex-col mx-4 border border-rule">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-paper-2 text-muted hover:text-ink transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-7 pt-7 pb-5 border-b border-rule">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted mb-2">Review</p>
          <h2 className="font-serif text-[1.4rem] font-semibold text-ink tracking-[-0.02em]">Your answers so far</h2>
          <p className="text-[13px] text-ink-soft mt-2">
            Read-only — go back to a question to change your answer.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5">
          <table className="w-full border-collapse">
            <tbody>
              {Array.from({ length: rows }, (_, rowIdx) => (
                <tr key={rowIdx} className="border-b border-rule last:border-b-0">
                  {Array.from({ length: COLS }, (_, colIdx) => {
                    const qNum = rowIdx * COLS + colIdx + 1;
                    if (qNum > totalQuestions) {
                      return <td key={colIdx} className="p-2.5" />;
                    }
                    const answer = answers[qNum];
                    return (
                      <td
                        key={colIdx}
                        className="p-2.5 align-top"
                      >
                        <div className="text-[11px] text-muted tabular-nums">Q{qNum}</div>
                        {answer ? (
                          <div className="text-[13px] font-medium text-ink truncate">{answer}</div>
                        ) : (
                          <div className="text-[13px] text-muted/70">—</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-7 py-4 border-t border-rule flex justify-end">
          <button
            onClick={onClose}
            className="px-5 h-10 bg-ink hover:bg-ink-soft text-paper text-[13px] font-medium tracking-tight rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
