"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import type { GroupRendererProps } from "./types";
import type { SummaryLayoutData } from "@/types/ielts-simulation";
import { LayoutCells, GroupHeader, ReviewCheckbox } from "./shared";
import { cn } from "@/lib/utils";

export default function SummaryRenderer({
  group,
  reviewSet,
  toggleReview,
  flashQuestionNumber,
  disabled,
}: GroupRendererProps) {
  const { register } = useFormContext();
  const layout = group.layout_data as SummaryLayoutData | null;

  // If we have structured layout_data with paragraphs, use it
  if (layout?.paragraphs) {
    return (
      <div className="space-y-5">
        <GroupHeader
          title={group.title}
          instructions={group.instructions}
          wordLimitText={group.word_limit_text}
        />
        <div className="border border-gray-300 rounded-xl p-5 bg-white space-y-4">
          {layout.paragraphs.map((para, i) => (
            <p key={i} className="text-gray-800 text-[15px] leading-relaxed">
              <LayoutCells
                cells={para.content}
                questions={group.questions}
                disabled={disabled}
                flashQuestionNumber={flashQuestionNumber}
              />
            </p>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 pt-1">
          {group.questions.map((q) => (
            <div key={q.id} className="flex items-center gap-1">
              <span className="text-xs text-gray-600">Q{q.question_number}</span>
              <ReviewCheckbox
                questionNumber={q.question_number}
                reviewSet={reviewSet}
                toggleReview={toggleReview}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback: render using question_text with "______" blanks
  return (
    <div className="space-y-5">
      <GroupHeader
        title={group.title}
        instructions={group.instructions}
        wordLimitText={group.word_limit_text}
      />

      {/* Word bank from options_pool if available */}
      {group.options_pool && group.options_pool.length > 0 && (
        <div className="border-2 border-gray-300 rounded-xl bg-gray-50 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {group.options_pool.map((opt) => (
              <div key={opt.id} className="flex items-baseline gap-2 text-sm">
                <span className="font-bold text-gray-900 min-w-[20px]">{opt.id}</span>
                <span className="text-gray-700">{opt.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border border-gray-300 rounded-xl p-5 bg-white">
        <div className="text-gray-800 text-[15px] leading-[2]">
          {group.questions.map((q) => {
            const parts = (q.question_text ?? "").split("______");
            const regKey = `questions.${q.id}.answer`;
            return (
              <span
                key={q.id}
                id={`q-${q.question_number}`}
                className={cn(
                  flashQuestionNumber === q.question_number && "ielts-question-flash rounded bg-blue-50/40 px-1",
                )}
              >
                {parts.map((part, idx) => (
                  <React.Fragment key={idx}>
                    {part}
                    {idx < parts.length - 1 && (
                      <>
                        <span className="font-bold text-blue-700 mx-0.5">
                          {q.question_number}
                        </span>
                        {group.options_pool && group.options_pool.length > 0 ? (
                          <select
                            {...register(regKey)}
                            disabled={disabled}
                            className="inline min-w-[80px] px-2 py-0.5 border-b-2 border-gray-400 bg-transparent font-semibold text-gray-800 outline-none focus:border-primary"
                          >
                            <option value="">—</option>
                            {group.options_pool.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.id}. {opt.text}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            {...register(regKey)}
                            disabled={disabled}
                            placeholder="..."
                            className="inline-block min-w-[100px] max-w-[180px] mx-0.5 px-2 py-0.5 border-b-2 border-gray-500 bg-transparent focus:bg-blue-50 outline-none font-medium text-gray-900"
                          />
                        )}
                      </>
                    )}
                  </React.Fragment>
                ))}
                {" "}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 pt-1">
        {group.questions.map((q) => (
          <div key={q.id} className="flex items-center gap-1">
            <span className="text-xs text-gray-600">Q{q.question_number}</span>
            <ReviewCheckbox
              questionNumber={q.question_number}
              reviewSet={reviewSet}
              toggleReview={toggleReview}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
