"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import type { GroupRendererProps } from "./types";
import { GroupHeader, ReviewCheckbox } from "./shared";
import { cn } from "@/lib/utils";

/**
 * Fallback renderer for NONE or unknown layout types.
 * Renders each question as a simple text input with question_text.
 */
export default function FallbackRenderer({
  group,
  reviewSet,
  toggleReview,
  flashQuestionNumber,
  disabled,
}: GroupRendererProps) {
  const { register } = useFormContext();

  return (
    <div className="space-y-4">
      <GroupHeader
        title={group.title}
        instructions={group.instructions}
        wordLimitText={group.word_limit_text}
      />
      <div className="space-y-4">
        {group.questions.map((q) => {
          const regKey = `questions.${q.id}.answer`;
          const hasOptions = q.options && q.options.length > 0;
          const isRadio = q.answer_input_type === "RADIO_SINGLE";
          const isCheckbox = q.answer_input_type === "CHECKBOX_MULTIPLE";
          const isTFNG = q.answer_input_type === "TFNG_SELECT";
          const isYNNG = q.answer_input_type === "YNNG_SELECT";
          const isSelect = isTFNG || isYNNG;

          const parts = (q.question_text ?? "").split("______");
          const hasBlank = parts.length > 1;

          return (
            <div
              key={q.id}
              id={`q-${q.question_number}`}
              className={cn(
                "space-y-2 border-b border-rule pb-4 last:border-0 last:pb-0",
                flashQuestionNumber === q.question_number && "ielts-question-flash rounded-md bg-mint-soft p-3 -mx-3",
              )}
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-ink text-paper rounded-lg text-sm font-semibold">
                  {q.question_number}
                </span>

                {/* Text with blank */}
                {hasBlank && !hasOptions && (
                  <span className="flex flex-wrap items-baseline gap-x-1 gap-y-1 text-ink font-medium">
                    {parts.map((part, idx) => (
                      <React.Fragment key={idx}>
                        {part}
                        {idx < parts.length - 1 && (
                          <input
                            {...register(regKey)}
                            disabled={disabled}
                            placeholder="..."
                            className="inline-block min-w-[100px] max-w-[220px] mx-0.5 px-2 py-0.5 border-b border-rule bg-transparent focus:bg-paper-3 outline-none font-medium text-ink"
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </span>
                )}

                {/* Plain text question */}
                {!hasBlank && (
                  <span className="text-ink font-medium leading-relaxed">
                    {q.question_text ?? ""}
                  </span>
                )}
              </div>

              {/* T/F/NG or Y/N/NG select */}
              {isSelect && (
                <div className="ml-10">
                  <select
                    {...register(regKey)}
                    disabled={disabled}
                    className="min-w-[140px] px-3 py-2 border border-rule rounded-lg bg-white font-semibold text-ink focus:ring-2 focus:ring-mint outline-none"
                  >
                    <option value="">Select</option>
                    {isTFNG && (
                      <>
                        <option value="TRUE">TRUE</option>
                        <option value="FALSE">FALSE</option>
                        <option value="NOT GIVEN">NOT GIVEN</option>
                      </>
                    )}
                    {isYNNG && (
                      <>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                        <option value="NOT GIVEN">NOT GIVEN</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Radio/Checkbox options */}
              {hasOptions && (isRadio || isCheckbox) && (
                <div className="ml-10 space-y-2">
                  {q.options.map((opt) => (
                    <label key={opt.id} className="flex items-start gap-3 cursor-pointer hover:bg-paper-2 rounded-lg px-3 py-2 -mx-3">
                      <input
                        type={isCheckbox ? "checkbox" : "radio"}
                        value={opt.label}
                        {...register(regKey)}
                        disabled={disabled}
                        className="mt-0.5 w-4 h-4 border-rule text-ink focus:ring-mint"
                      />
                      <span className="text-base text-ink">
                        <span className="font-semibold">{opt.label}.</span> {opt.text}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Simple text input for short answer without blank in question_text */}
              {!hasBlank && !hasOptions && !isSelect && (
                <div className="ml-10">
                  <input
                    {...register(regKey)}
                    disabled={disabled}
                    placeholder="Your answer..."
                    className="w-full max-w-[300px] px-3 py-2 border border-rule rounded-lg bg-white font-medium text-ink focus:ring-2 focus:ring-mint outline-none"
                  />
                </div>
              )}

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
