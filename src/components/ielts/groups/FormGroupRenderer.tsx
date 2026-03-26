"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import type { GroupRendererProps } from "./types";
import type { FormLayoutData } from "@/types/ielts-simulation";
import { LayoutCells, GroupHeader, ReviewCheckbox } from "./shared";
import { cn } from "@/lib/utils";

export default function FormGroupRenderer({
  group,
  reviewSet,
  toggleReview,
  flashQuestionNumber,
  disabled,
}: GroupRendererProps) {
  const { register } = useFormContext();
  const layout = group.layout_data as FormLayoutData | null;

  // If layout_data exists, use it for structured form rendering
  if (layout?.rows) {
    return (
      <div className="space-y-4">
        <GroupHeader
          title={group.title}
          instructions={group.instructions}
          wordLimitText={group.word_limit_text}
        />
        {layout.title && (
          <h4 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-2">
            {layout.title}
          </h4>
        )}
        <div className="border border-black rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <tbody>
              {layout.rows.map((row, rowIdx) => {
                const inputQNums = row.content
                  .filter((c) => c.type === "input")
                  .map((c) => (c as { questionNumber: number }).questionNumber);

                return (
                  <tr key={rowIdx} className="border-b border-black last:border-b-0 hover:bg-gray-50/50">
                    <td className="border-r border-black p-2 text-sm font-semibold text-gray-700 w-[160px] align-middle">
                      {row.label}
                    </td>
                    <td className="border-r border-black p-2 text-sm text-gray-800 align-middle">
                      <span className="flex flex-wrap items-center gap-1">
                        <LayoutCells
                          cells={row.content}
                          questions={group.questions}
                          disabled={disabled}
                          flashQuestionNumber={flashQuestionNumber}
                        />
                      </span>
                    </td>
                    <td className="p-2 align-middle w-[90px]">
                      {inputQNums.map((qNum) => (
                        <ReviewCheckbox
                          key={qNum}
                          questionNumber={qNum}
                          reviewSet={reviewSet}
                          toggleReview={toggleReview}
                        />
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Fallback: render questions as labeled text inputs
  return (
    <div className="space-y-4">
      <GroupHeader
        title={group.title}
        instructions={group.instructions}
        wordLimitText={group.word_limit_text}
      />
      <div className="space-y-3">
        {group.questions.map((q) => {
          const parts = (q.question_text ?? "").split("______");
          const regKey = `questions.${q.id}.answer`;
          return (
            <div
              key={q.id}
              id={`q-${q.question_number}`}
              className={cn(
                "flex flex-wrap items-baseline gap-x-2 gap-y-2 border-b border-gray-200 pb-3",
                flashQuestionNumber === q.question_number && "ielts-question-flash rounded-lg bg-blue-50/40",
              )}
            >
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg text-sm font-black">
                {q.question_number}
              </span>
              <span className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
                {parts.map((part, idx) => (
                  <React.Fragment key={idx}>
                    {part}
                    {idx < parts.length - 1 && (
                      <input
                        {...register(regKey)}
                        disabled={disabled}
                        placeholder="..."
                        className="inline-block min-w-[100px] max-w-[220px] mx-0.5 px-2 py-0.5 border-b-2 border-gray-500 bg-transparent focus:bg-blue-50 outline-none font-medium text-gray-900"
                      />
                    )}
                  </React.Fragment>
                ))}
              </span>
              <ReviewCheckbox
                questionNumber={q.question_number}
                reviewSet={reviewSet}
                toggleReview={toggleReview}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
