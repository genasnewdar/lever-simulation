"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import type { GroupRendererProps } from "./types";
import type { SentencesLayoutData } from "@/types/ielts-simulation";
import { LayoutCells, GroupHeader, ReviewCheckbox } from "./shared";
import { cn } from "@/lib/utils";

export default function SentencesRenderer({
  group,
  reviewSet,
  toggleReview,
  flashQuestionNumber,
  disabled,
}: GroupRendererProps) {
  const { register } = useFormContext();
  const layout = group.layout_data as SentencesLayoutData | null;

  if (layout?.sentences) {
    return (
      <div className="space-y-5">
        <GroupHeader
          title={group.title}
          instructions={group.instructions}
          wordLimitText={group.word_limit_text}
        />
        <div className="space-y-3">
          {layout.sentences.map((sentence, i) => (
            <div key={i} className="flex flex-wrap items-baseline gap-x-1.5 text-base text-gray-800 leading-relaxed">
              <LayoutCells
                cells={sentence.content}
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

  // Fallback: render from question_text with blanks
  return (
    <div className="space-y-5">
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
                "flex flex-wrap items-baseline gap-x-1.5 gap-y-2 text-base text-gray-800 leading-relaxed",
                flashQuestionNumber === q.question_number && "ielts-question-flash rounded-lg bg-blue-50/40 p-2 -mx-2",
              )}
            >
              <span className="font-bold text-gray-900">{q.question_number}.</span>
              {parts.map((part, idx) => (
                <React.Fragment key={idx}>
                  <span>{part}</span>
                  {idx < parts.length - 1 && (
                    <input
                      {...register(regKey)}
                      disabled={disabled}
                      placeholder="..."
                      className="inline-block min-w-[100px] max-w-[180px] mx-0.5 px-2 py-0.5 border-b-2 border-gray-500 bg-transparent focus:bg-blue-50 outline-none font-medium text-gray-900"
                    />
                  )}
                </React.Fragment>
              ))}
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
