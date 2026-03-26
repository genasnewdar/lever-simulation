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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[700px] max-h-[80vh] flex flex-col mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 text-center">
          <h2 className="text-xl font-bold text-gray-900">Review your answers</h2>
          <p className="text-sm text-gray-500 mt-1">
            * This window is to review your answers only, you cannot change the answers in here
          </p>
        </div>

        {/* Answer grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <table className="w-full border-collapse">
            <tbody>
              {Array.from({ length: rows }, (_, rowIdx) => (
                <tr key={rowIdx} className="border-b border-gray-200 last:border-b-0">
                  {Array.from({ length: COLS }, (_, colIdx) => {
                    const qNum = rowIdx * COLS + colIdx + 1;
                    if (qNum > totalQuestions) {
                      return <td key={colIdx} className="p-2.5" />;
                    }
                    const answer = answers[qNum];
                    return (
                      <td
                        key={colIdx}
                        className="p-2.5 border-r border-gray-200 last:border-r-0"
                      >
                        <span className="text-sm text-gray-500">Q{qNum}: </span>
                        {answer ? (
                          <span className="text-sm font-bold text-gray-900">{answer}</span>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-center">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-[#2d6a4f] hover:bg-[#245a42] text-white font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
