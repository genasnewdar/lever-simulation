"use client";

import React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import type { BackendQuestion, LayoutDataCell } from "@/types/ielts-simulation";
import { cn } from "@/lib/utils";

/** Render an array of layout_data cells (text spans + input blanks) */
export function LayoutCells({
  cells,
  questions,
  disabled,
  flashQuestionNumber,
  inputClassName,
}: {
  cells: LayoutDataCell[];
  questions: BackendQuestion[];
  disabled: boolean;
  flashQuestionNumber?: number | null;
  inputClassName?: string;
}) {
  const { register } = useFormContext();
  const qByNum = React.useMemo(() => {
    const map: Record<number, BackendQuestion> = {};
    questions.forEach((q) => { map[q.question_number] = q; });
    return map;
  }, [questions]);

  return (
    <>
      {cells.map((cell, i) => {
        if (cell.type === "text") {
          return <span key={i}>{cell.value}</span>;
        }
        if (cell.type === "input") {
          const q = qByNum[cell.questionNumber];
          if (!q) return <span key={i} className="text-red-400">[?]</span>;
          const reg: UseFormRegisterReturn = register(`questions.${q.id}.answer`);
          return (
            <span
              key={i}
              id={`q-${q.question_number}`}
              className={cn(
                "inline-flex items-center gap-1",
                flashQuestionNumber === q.question_number && "ielts-question-flash rounded p-0.5 -m-0.5",
              )}
            >
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded text-xs font-bold">
                {q.question_number}
              </span>
              <input
                {...reg}
                disabled={disabled}
                placeholder="..."
                className={inputClassName ?? "inline-block min-w-[80px] max-w-[180px] px-2 py-0.5 border-b-2 border-gray-400 bg-transparent focus:bg-blue-50 outline-none font-medium text-gray-900"}
              />
            </span>
          );
        }
        return null;
      })}
    </>
  );
}

/** Group header: renders title + instructions + word_limit_text */
export function GroupHeader({
  title,
  instructions,
  wordLimitText,
}: {
  title?: string | null;
  instructions?: string | null;
  wordLimitText?: string | null;
}) {
  if (!title && !instructions && !wordLimitText) return null;
  return (
    <div className="space-y-2 mb-4">
      {title && (
        <h3 className="text-xl font-bold text-[#2b5a9e]">{title}</h3>
      )}
      {instructions && (
        <p className="text-gray-800 text-base font-medium">{instructions}</p>
      )}
      {wordLimitText && (
        <p className="text-base font-medium">
          Write{" "}
          <span className="font-bold text-red-600 uppercase">
            {wordLimitText}
          </span>{" "}
          for each answer.
        </p>
      )}
    </div>
  );
}

/** Review checkbox for a question */
export function ReviewCheckbox({
  questionNumber,
  reviewSet,
  toggleReview,
}: {
  questionNumber: number;
  reviewSet: Set<number>;
  toggleReview: (n: number) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer">
      <span className="text-[10px] font-bold text-gray-500 uppercase">
        Review
      </span>
      <input
        type="checkbox"
        checked={reviewSet.has(questionNumber)}
        onChange={() => toggleReview(questionNumber)}
        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
      />
    </label>
  );
}
