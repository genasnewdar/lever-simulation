"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import type { GroupRendererProps } from "./types";
import type { FlowchartLayoutData } from "@/types/ielts-simulation";
import { LayoutCells, GroupHeader, ReviewCheckbox } from "./shared";
import { cn } from "@/lib/utils";

export default function FlowchartRenderer({
  group,
  reviewSet,
  toggleReview,
  flashQuestionNumber,
  disabled,
}: GroupRendererProps) {
  const { register } = useFormContext();
  const layout = group.layout_data as FlowchartLayoutData | null;

  // If structured layout_data exists
  if (layout?.boxes) {
    return (
      <div className="space-y-5">
        <GroupHeader
          title={group.title}
          instructions={group.instructions}
          wordLimitText={group.word_limit_text}
        />
        <div className="border border-rule overflow-hidden">
          {layout.boxes.map((box, i) => (
            <div
              key={i}
              className="border-b border-rule last:border-b-0 px-4 py-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-2 min-h-[44px]"
            >
              <LayoutCells
                cells={box.content}
                questions={group.questions}
                disabled={disabled}
                flashQuestionNumber={flashQuestionNumber}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 pt-1">
          {group.questions.map((q) => (
            <div key={q.id} className="flex items-center gap-1">
              <span className="text-xs text-ink-soft">Q{q.question_number}</span>
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

  // Fallback: render from question_text with "______" blanks
  return (
    <div className="space-y-5">
      <GroupHeader
        title={group.title}
        instructions={group.instructions}
        wordLimitText={group.word_limit_text}
      />
      <div className="border border-rule overflow-hidden">
        {group.questions.map((q) => {
          const text = q.question_text ?? "";
          const parts = text.split("______");
          const regKey = `questions.${q.id}.answer`;
          const isFlash = flashQuestionNumber === q.question_number;
          return (
            <div
              key={q.id}
              id={`q-${q.question_number}`}
              className={cn(
                "border-b border-rule last:border-b-0 px-4 py-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-2 min-h-[44px]",
                isFlash && "ielts-question-flash bg-mint-soft",
              )}
            >
              <span className="flex-1 min-w-0 inline-flex flex-wrap items-baseline gap-x-1.5">
                {parts.length <= 1 ? (
                  text
                ) : (
                  <>
                    <span>{parts[0]}</span>
                    <span className="font-semibold text-ink">
                      {q.question_number}
                    </span>
                    <input
                      type="text"
                      disabled={disabled}
                      {...register(regKey)}
                      className="inline-block min-w-[100px] max-w-[180px] border-b border-rule bg-transparent px-1 py-0.5 font-medium text-ink outline-none focus:border-mint focus:bg-mint-soft/40"
                    />
                    <span>{parts.slice(1).join("______")}</span>
                  </>
                )}
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
