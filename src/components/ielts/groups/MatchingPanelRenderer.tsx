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
        <div className="border border-rule rounded-md bg-paper-2 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {options.map((opt) => (
              <div key={opt.id} className="flex items-baseline gap-2 text-base">
                <span className="font-semibold text-ink min-w-[20px]">
                  {opt.id}
                </span>
                <span className="text-ink-soft">{opt.text}</span>
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
                "flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-rule pb-3 last:border-0 last:pb-0",
                flashQuestionNumber === q.question_number && "ielts-question-flash rounded-lg bg-mint-soft",
              )}
            >
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-ink text-paper rounded-lg text-sm font-semibold">
                {q.question_number}
              </span>
              <span className="text-ink font-medium text-base flex-1 min-w-0">
                {q.question_text ?? ""}
              </span>
              {options.length > 0 ? (
                <select
                  {...register(regKey)}
                  disabled={disabled}
                  className="min-w-[80px] px-3 py-2 border border-rule rounded-lg bg-white font-semibold text-ink focus:ring-1 focus:ring-mint focus:border-mint outline-none"
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
                  className="min-w-[100px] max-w-[180px] px-2 py-1 border-b border-rule bg-transparent focus:bg-paper-3 outline-none font-medium text-ink"
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
