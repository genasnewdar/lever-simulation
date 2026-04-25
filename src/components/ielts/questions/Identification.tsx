'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Question } from '../../../types/ielts';

interface IdentificationProps {
  question: Question;
  disabled?: boolean;
  onToggleReview?: (qNum: number) => void;
  isReviewChecked?: (qNum: number) => boolean;
}

const Identification: React.FC<IdentificationProps> = ({ question, disabled, onToggleReview, isReviewChecked }) => {
  const { register } = useFormContext();
  const { id, questionNumber, content, rawData } = question;
  const qNum = questionNumber ?? (rawData && 'question_number' in rawData ? (rawData as { question_number: number }).question_number : 0);
  const statement = (rawData && "question_text" in rawData ? rawData.question_text : content) ?? content;
  const isTrueFalseNotGiven =
    rawData?.question_category === "TFNG_SELECT" ||
    rawData?.question_category === "TRUE_FALSE_NOT_GIVEN" ||
    (rawData && "answer_input_type" in rawData && (rawData as { answer_input_type?: string }).answer_input_type === "TFNG_SELECT") ||
    (typeof statement === "string" && statement.toLowerCase().includes("true"));
  const options = isTrueFalseNotGiven
    ? ["TRUE", "FALSE", "NOT GIVEN"]
    : ["YES", "NO", "NOT GIVEN"];

  const registrationKey = `questions.${id}.answer`;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border border-rule rounded-lg bg-paper-2 hover:border-rule transition-all">
      <div className="flex items-start gap-4 max-w-2xl min-w-0">
        {questionNumber && (
          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-ink text-paper rounded-lg text-sm font-semibold">
            {questionNumber}
          </span>
        )}
        <p className="text-ink-soft font-semibold text-lg leading-relaxed">
          {typeof statement === "string" ? statement : content}
        </p>
      </div>
      
      <div className="flex items-center gap-4 shrink-0">
        {onToggleReview && (
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">Review</span>
            <input type="checkbox" checked={isReviewChecked?.(qNum) ?? false} onChange={() => onToggleReview(qNum)} className="w-4 h-4 rounded border-rule text-ink focus:ring-mint" />
          </label>
        )}
      <div className="flex gap-2 min-w-[200px]">
        <select
          disabled={disabled}
          {...register(registrationKey)}
          className={`w-full p-3 border border-rule rounded-md focus:ring-1 focus:ring-mint focus:border-mint bg-foreground font-semibold text-primary outline-none transition-all ${
            disabled ? 'bg-paper-3 cursor-not-allowed text-muted opacity-50' : 'cursor-pointer hover:border-ink-soft'
          }`}
        >
          <option value="">Select Option</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      </div>
    </div>
  );
};

export default Identification;
