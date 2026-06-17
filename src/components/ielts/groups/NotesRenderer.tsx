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
        <div className="border border-rule rounded-md p-5 bg-white space-y-5">
          {layout.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-2">
              <h4 className="font-semibold text-ink text-base">
                {section.heading}
              </h4>
              <ul className="space-y-2 ml-4">
                {section.items.map((item, iIdx) => (
                  <li key={iIdx} className="flex flex-wrap items-baseline gap-x-1.5 text-base text-ink">
                    <span className="text-muted mr-1">&bull;</span>
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
                "flex flex-wrap items-baseline gap-x-2 gap-y-2 border-b border-rule pb-3",
                flashQuestionNumber === q.question_number && "ielts-question-flash rounded-lg bg-mint-soft",
              )}
            >
              <span className="text-muted mr-1">&bull;</span>
              <span className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
                {parts.map((part, idx) => (
                  <React.Fragment key={idx}>
                    {part}
                    {idx < parts.length - 1 && (
                      <>
                        <span className="font-semibold text-ink-soft mx-0.5">{q.question_number}</span>
                        <input
                          {...register(regKey)}
                          disabled={disabled}
                          placeholder="..."
                          autoComplete="off"
                          spellCheck={false}
                          onContextMenu={(e) => e.preventDefault()}
                          className="inline-block min-w-[100px] max-w-[180px] mx-0.5 px-2 py-0.5 border-b border-rule bg-transparent focus:bg-paper-3 outline-none font-medium text-ink"
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
