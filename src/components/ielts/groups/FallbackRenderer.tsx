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
                "space-y-2 border-b border-gray-100 pb-4 last:border-0 last:pb-0",
                flashQuestionNumber === q.question_number && "ielts-question-flash rounded-xl bg-blue-50/30 p-3 -mx-3",
              )}
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg text-sm font-black">
                  {q.question_number}
                </span>

                {/* Text with blank */}
                {hasBlank && !hasOptions && (
                  <span className="flex flex-wrap items-baseline gap-x-1 gap-y-1 text-gray-800 font-medium">
                    {parts.map((part, idx) => (
                      <React.Fragment key={idx}>
                        {part}
                        {idx < parts.length - 1 && (
                          <input
                            {...register(regKey)}
                            disabled={disabled}
                            placeholder="..."
                            className="inline-block min-w-[100px] max-w-[220px] mx-0.5 px-2 py-0.5 border-b-2 border-gray-500 bg-transparent focus:bg-blue-50 outline-none font-medium text-gray-900"
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </span>
                )}

                {/* Plain text question */}
                {!hasBlank && (
                  <span className="text-gray-800 font-medium leading-relaxed">
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
                    className="min-w-[140px] px-3 py-2 border-2 border-gray-300 rounded-lg bg-white font-semibold text-gray-800 focus:ring-2 focus:ring-primary outline-none"
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
                    <label key={opt.id} className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2 -mx-3">
                      <input
                        type={isCheckbox ? "checkbox" : "radio"}
                        value={opt.label}
                        {...register(regKey)}
                        disabled={disabled}
                        className="mt-0.5 w-4 h-4 border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-base text-gray-800">
                        <span className="font-bold">{opt.label}.</span> {opt.text}
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
                    className="w-full max-w-[300px] px-3 py-2 border-2 border-gray-300 rounded-lg bg-white font-medium text-gray-900 focus:ring-2 focus:ring-primary outline-none"
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
