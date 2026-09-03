'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Question } from '../../../types/ielts';
import { ReviewCheckbox } from "@/components/ielts/ReviewCheckbox";

interface ShortAnswerProps {
  question: Question;
  disabled?: boolean;
  onToggleReview?: (qNum: number) => void;
  isReviewChecked?: (qNum: number) => boolean;
}

const ShortAnswer: React.FC<ShortAnswerProps> = ({ question, disabled, onToggleReview, isReviewChecked }) => {
  const { register } = useFormContext();
  const { id, content, questionNumber, validationRules, rawData } = question;
  const qNum = questionNumber ?? (rawData && 'question_number' in rawData ? (rawData as { question_number: number }).question_number : 0);
  const prompt = (rawData && "question_text" in rawData ? rawData.question_text : content) ?? content;

  return (
    <div className="p-6 border border-rule rounded-lg bg-paper-2 hover:border-rule transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4 min-w-0">
          {questionNumber && (
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-ink text-paper rounded-lg text-sm font-semibold">
              {questionNumber}
            </span>
          )}
          <p className="text-ink font-semibold text-lg leading-relaxed">
            {typeof prompt === "string" ? prompt : content}
          </p>
        </div>
        <ReviewCheckbox
          questionNumber={qNum}
          checked={isReviewChecked?.(qNum) ?? false}
          onToggle={onToggleReview}
        />
      </div>

      <div className="pl-12 space-y-2">
        <input
            {...register(`questions.${id}.answer`)}
            disabled={disabled}
            placeholder="Write your answer..."
            autoComplete="off"
            spellCheck={false}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-full max-w-lg p-4 border border-rule rounded-md focus:ring-4 focus:ring-blue-500/10 focus:border-ink outline-none transition-all font-semibold text-ink-soft text-lg ${
                disabled ? 'bg-paper-3 cursor-not-allowed text-muted border-rule' : 'bg-paper-2 hover:border-ink-soft'
            }`}
        />
        {validationRules?.maxWords && (
            <p className="text-[10px] font-semibold text-muted uppercase tracking-widest pl-1">
                Limit: {validationRules.maxWords} words max
            </p>
        )}
      </div>
    </div>
  );
};

export default ShortAnswer;
