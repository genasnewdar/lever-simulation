"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import type { GroupRendererProps } from "./types";
import { GroupHeader, ReviewCheckbox } from "./shared";
import { cn } from "@/lib/utils";

export default function MatchingPanelRenderer({
  group,
  reviewSet,
  toggleReview,
  flashQuestionNumber,
  disabled,
}: GroupRendererProps) {
  const { register } = useFormContext();
  const options = group.options_pool ?? [];

  return (
    <div className="space-y-5">
      <GroupHeader
        title={group.title}
        instructions={group.instructions}
        wordLimitText={group.word_limit_text}
      />

      {/* Options pool box */}
      {options.length > 0 && (
        <div className="border-2 border-gray-300 rounded-xl bg-gray-50 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {options.map((opt) => (
              <div key={opt.id} className="flex items-baseline gap-2 text-base">
                <span className="font-bold text-gray-900 min-w-[20px]">
                  {opt.id}
                </span>
                <span className="text-gray-700">{opt.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions with dropdown selectors */}
      <div className="space-y-3">
        {group.questions.map((q) => {
          const regKey = `questions.${q.id}.answer`;
          return (
            <div
              key={q.id}
              id={`q-${q.question_number}`}
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-gray-100 pb-3 last:border-0 last:pb-0",
                flashQuestionNumber === q.question_number && "ielts-question-flash rounded-lg bg-blue-50/40",
              )}
            >
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg text-sm font-black">
                {q.question_number}
              </span>
              <span className="text-gray-800 font-medium text-base flex-1 min-w-0">
                {q.question_text ?? ""}
              </span>
              {options.length > 0 ? (
                <select
                  {...register(regKey)}
                  disabled={disabled}
                  className="min-w-[80px] px-3 py-2 border-2 border-gray-300 rounded-lg bg-white font-semibold text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  <option value="">—</option>
                  {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.id}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  {...register(regKey)}
                  disabled={disabled}
                  placeholder="..."
                  className="min-w-[100px] max-w-[180px] px-2 py-1 border-b-2 border-gray-400 bg-transparent focus:bg-blue-50 outline-none font-medium text-gray-900"
                />
              )}
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
