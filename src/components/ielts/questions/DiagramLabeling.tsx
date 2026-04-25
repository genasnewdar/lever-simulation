"use client";

import React from "react";
import Image from "next/image";
import { useFormContext } from "react-hook-form";
import { Question } from "../../../types/ielts";

interface DiagramLabelingProps {
  question: Question;
  disabled?: boolean;
  onToggleReview?: (qNum: number) => void;
  isReviewChecked?: (qNum: number) => boolean;
}

const DiagramLabeling: React.FC<DiagramLabelingProps> = ({
  question,
  disabled,
  onToggleReview,
  isReviewChecked,
}) => {
  const { register } = useFormContext();
  const { imageUrl, title, validationRules, questionNumber, rawData } = question;
  const qNum = questionNumber ?? (rawData && 'question_number' in rawData ? (rawData as { question_number: number }).question_number : 0);

  // For mock purpose, we assume inputs are gap_IDs provided in content or meta
  // Let's assume content contains placeholders for diagram labels
  const inputs = [7, 8, 9]; // Static for example, in real use we'd parse this

  return (
    <div className="space-y-6 p-8 border rounded-lg bg-paper-2">
      <div className="flex items-start justify-between gap-4 mb-8">
        <h3 className="text-xl font-semibold text-textprimary min-w-0">
          {title || "Label the Diagram"}
        </h3>
        {onToggleReview && (
          <label className="flex items-center gap-2 shrink-0 cursor-pointer">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">Review</span>
            <input type="checkbox" checked={isReviewChecked?.(qNum) ?? false} onChange={() => onToggleReview(qNum)} className="w-4 h-4 rounded border-rule text-ink focus:ring-mint" />
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
        {/* Mock Diagram */}
        <div className="relative aspect-video bg-paper-3 rounded-3xl overflow-hidden border border-rule flex items-center justify-center group">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Diagram"
              fill
              className="object-contain p-8"
              unoptimized
            />
          ) : (
            <div className="text-muted font-semibold text-center">
              <div className="w-20 h-20 bg-paper-3 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">🖼️</span>
              </div>
              DIAGRAM PREVIEW
              <div className="text-[10px] mt-2 opacity-60">
                Wait for actual image asset
              </div>
            </div>
          )}

          {/* Mock numbered markers on the diagram */}
          <div className="absolute top-[20%] left-[30%] w-10 h-10 bg-ink rounded-full flex items-center justify-center text-white shadow-xl ring-4 ring-white ring-opacity-20 flex-shrink-0 font-semibold scale-75">
            7
          </div>
          <div className="absolute bottom-[30%] left-[60%] w-10 h-10 bg-ink rounded-full flex items-center justify-center text-white shadow-xl ring-4 ring-white ring-opacity-20 flex-shrink-0 font-semibold scale-75">
            8
          </div>
          <div className="absolute top-[50%] right-[10%] w-10 h-10 bg-ink rounded-full flex items-center justify-center text-white shadow-xl ring-4 ring-white ring-opacity-20 flex-shrink-0 font-semibold scale-75">
            9
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-6">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-widest pl-2">
            Complete the labels below
          </h4>
          <div className="bg-paper-2 p-6 rounded-lg space-y-4">
            {inputs.map((num) => (
              <div key={num} className="flex items-center gap-4 group">
                <span className="w-10 h-10 bg-ink text-paper rounded-md flex items-center justify-center font-semibold shadow-lg shadow-ink/10 group-focus-within:bg-mint-deep transition-colors uppercase">
                  {num}
                </span>
                <input
                  {...register(`gap_${num}`)}
                  disabled={disabled}
                  placeholder={`Enter label ${num}`}
                  className={`flex-grow p-4 border-2 border-transparent rounded-md focus:ring-4 focus:ring-blue-500/10 focus:border-ink outline-none transition-all font-semibold text-ink-soft ${
                    disabled
                      ? "bg-paper-3 cursor-not-allowed border-transparent"
                      : "bg-white hover:border-rule"
                  }`}
                />
              </div>
            ))}
          </div>
          {validationRules?.maxWords && (
            <p className="text-[10px] font-semibold text-mint-deep bg-mint-soft inline-block px-3 py-1 rounded">
              Limit: {validationRules.maxWords} word(s)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagramLabeling;
