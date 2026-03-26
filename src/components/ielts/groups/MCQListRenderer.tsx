"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import type { GroupRendererProps } from "./types";
import { GroupHeader, ReviewCheckbox } from "./shared";
import { cn } from "@/lib/utils";

export default function MCQListRenderer({
  group,
  reviewSet,
  toggleReview,
  flashQuestionNumber,
  disabled,
}: GroupRendererProps) {
  const { register } = useFormContext();

  return (
    <div className="space-y-5">
      <GroupHeader
        title={group.title}
        instructions={group.instructions}
        wordLimitText={group.word_limit_text}
      />
      <div className="space-y-6">
        {group.questions.map((q) => {
          const regKey = `questions.${q.id}.answer`;
          const isMultiple =
            q.answer_input_type === "CHECKBOX_MULTIPLE" ||
            q.question_category === "MCQ_MULTIPLE";

          return (
            <div
              key={q.id}
              id={`q-${q.question_number}`}
              className={cn(
                "space-y-3 border-b border-gray-100 pb-5 last:border-0 last:pb-0",
                flashQuestionNumber === q.question_number && "ielts-question-flash rounded-xl bg-blue-50/30 p-3 -mx-3",
              )}
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg text-sm font-black mt-0.5">
                  {q.question_number}
                </span>
                <span className="text-gray-900 font-medium text-base leading-relaxed">
                  {q.question_text ?? ""}
                </span>
              </div>

              <div className="ml-10 space-y-2">
                {q.options.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2 -mx-3 transition-colors"
                  >
                    {isMultiple ? (
                      <input
                        type="checkbox"
                        value={opt.label}
                        {...register(regKey)}
                        disabled={disabled}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    ) : (
                      <input
                        type="radio"
                        value={opt.label}
                        {...register(regKey)}
                        disabled={disabled}
                        className="mt-0.5 w-4 h-4 border-gray-300 text-primary focus:ring-primary"
                      />
                    )}
                    <span className="text-base text-gray-800">
                      <span className="font-bold">{opt.label}.</span> {opt.text}
                    </span>
                  </label>
                ))}
              </div>

              <div className="ml-10">
                <ReviewCheckbox
                  questionNumber={q.question_number}
                  reviewSet={reviewSet}
                  toggleReview={toggleReview}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
