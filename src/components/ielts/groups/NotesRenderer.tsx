"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import type { GroupRendererProps } from "./types";
import type { NotesLayoutData } from "@/types/ielts-simulation";
import { LayoutCells, GroupHeader, ReviewCheckbox } from "./shared";
import { cn } from "@/lib/utils";

export default function NotesRenderer({
  group,
  reviewSet,
  toggleReview,
  flashQuestionNumber,
  disabled,
}: GroupRendererProps) {
  const { register } = useFormContext();
  const layout = group.layout_data as NotesLayoutData | null;

  if (layout?.sections) {
    return (
      <div className="space-y-5">
        <GroupHeader
          title={group.title}
          instructions={group.instructions}
          wordLimitText={group.word_limit_text}
        />
        <div className="border border-gray-300 rounded-xl p-5 bg-white space-y-5">
          {layout.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-2">
              <h4 className="font-bold text-gray-900 text-base">
                {section.heading}
              </h4>
              <ul className="space-y-2 ml-4">
                {section.items.map((item, iIdx) => (
                  <li key={iIdx} className="flex flex-wrap items-baseline gap-x-1.5 text-base text-gray-800">
                    <span className="text-gray-400 mr-1">&bull;</span>
                    <LayoutCells
                      cells={item.content}
                      questions={group.questions}
                      disabled={disabled}
                      flashQuestionNumber={flashQuestionNumber}
                    />
                  </li>
                ))}
              </ul>
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

  // Fallback: render as simple text inputs
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
                "flex flex-wrap items-baseline gap-x-2 gap-y-2 border-b border-gray-200 pb-3",
                flashQuestionNumber === q.question_number && "ielts-question-flash rounded-lg bg-blue-50/40",
              )}
            >
              <span className="text-gray-400 mr-1">&bull;</span>
              <span className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
                {parts.map((part, idx) => (
                  <React.Fragment key={idx}>
                    {part}
                    {idx < parts.length - 1 && (
                      <>
                        <span className="font-bold text-blue-700 mx-0.5">{q.question_number}</span>
                        <input
                          {...register(regKey)}
                          disabled={disabled}
                          placeholder="..."
                          className="inline-block min-w-[100px] max-w-[180px] mx-0.5 px-2 py-0.5 border-b-2 border-gray-500 bg-transparent focus:bg-blue-50 outline-none font-medium text-gray-900"
                        />
                      </>
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
