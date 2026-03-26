"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import type { GroupRendererProps } from "./types";
import { GroupHeader, ReviewCheckbox } from "./shared";
import { cn } from "@/lib/utils";

export default function TFNGRenderer({
  group,
  reviewSet,
  toggleReview,
  flashQuestionNumber,
  disabled,
}: GroupRendererProps) {
  const { register } = useFormContext();

  // Determine if this is T/F/NG or Y/N/NG based on question_category
  const isYNNG = group.questions.some(
    (q) => q.question_category === "YES_NO_NOT_GIVEN" || q.question_category === "YNNG_SELECT",
  );

  const optionLabels = isYNNG
    ? [
        { value: "YES", label: "YES", description: "if the statement agrees with the claims of the writer" },
        { value: "NO", label: "NO", description: "if the statement contradicts the claims of the writer" },
        { value: "NOT GIVEN", label: "NOT GIVEN", description: "if it is impossible to say what the writer thinks about this" },
      ]
    : [
        { value: "TRUE", label: "TRUE", description: "if the statement agrees with the information" },
        { value: "FALSE", label: "FALSE", description: "if the statement contradicts the information" },
        { value: "NOT GIVEN", label: "NOT GIVEN", description: "if there is no information on this" },
      ];

  return (
    <div className="space-y-6">
      <GroupHeader
        title={group.title}
        instructions={group.instructions}
        wordLimitText={group.word_limit_text}
      />

      {/* Instruction box */}
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        <table className="w-full border-collapse text-base">
          <tbody>
            {optionLabels.map((opt, i) => (
              <tr key={opt.value} className={i < optionLabels.length - 1 ? "border-b border-gray-300" : ""}>
                <td className="p-3 font-bold text-gray-900 align-top w-[120px]">
                  {opt.label}
                </td>
                <td className="p-3 text-gray-700">{opt.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {group.questions.map((q) => {
          const regKey = `questions.${q.id}.answer`;
          return (
            <div
              key={q.id}
              id={`q-${q.question_number}`}
              className={cn(
                "flex flex-wrap items-baseline gap-x-2 gap-y-2 border-b border-gray-100 pb-4 last:border-0 last:pb-0",
                flashQuestionNumber === q.question_number && "ielts-question-flash rounded-lg bg-blue-50/40",
              )}
            >
              <span className="flex-shrink-0 font-bold text-gray-900">
                {q.question_number}.
              </span>
              <select
                disabled={disabled}
                {...register(regKey)}
                className="flex-shrink-0 min-w-[140px] px-3 py-2 border-2 border-gray-300 rounded-lg bg-white font-semibold text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              >
                <option value="">Select Option</option>
                {optionLabels.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="text-gray-800 font-medium text-base leading-relaxed">
                {q.question_text ?? ""}
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
