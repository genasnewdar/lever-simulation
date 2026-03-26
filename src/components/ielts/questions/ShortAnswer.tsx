'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Question } from '../../../types/ielts';

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
    <div className="p-6 border-2 border-gray-100 rounded-2xl bg-white shadow-sm hover:border-blue-100 transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4 min-w-0">
          {questionNumber && (
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg text-sm font-black">
              {questionNumber}
            </span>
          )}
          <p className="text-gray-800 font-bold text-lg leading-relaxed">
            {typeof prompt === "string" ? prompt : content}
          </p>
        </div>
        {onToggleReview && (
          <label className="flex items-center gap-2 shrink-0 cursor-pointer">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Review</span>
            <input type="checkbox" checked={isReviewChecked?.(qNum) ?? false} onChange={() => onToggleReview(qNum)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
          </label>
        )}
      </div>

      <div className="pl-12 space-y-2">
        <input
            {...register(`questions.${id}.answer`)}
            disabled={disabled}
            placeholder="Write your answer..."
            className={`w-full max-w-lg p-4 border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-blue-700 text-lg ${
                disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500 border-gray-200' : 'bg-gray-50/50 hover:border-blue-200'
            }`}
        />
        {validationRules?.maxWords && (
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Limit: {validationRules.maxWords} words max
            </p>
        )}
      </div>
    </div>
  );
};

export default ShortAnswer;
