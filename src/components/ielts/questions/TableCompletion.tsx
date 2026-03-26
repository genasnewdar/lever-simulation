'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Question } from '../../../types/ielts';

interface TableCompletionProps {
  question: Question;
  disabled?: boolean;
  onToggleReview?: (qNum: number) => void;
  isReviewChecked?: (qNum: number) => boolean;
}

const TableCompletion: React.FC<TableCompletionProps> = ({ question, disabled, onToggleReview, isReviewChecked }) => {
  const { register } = useFormContext();
  const { rawData, validationRules, questionNumber } = question;
  const qNum = questionNumber ?? (rawData && 'question_number' in rawData ? (rawData as { question_number: number }).question_number : 0);

  // Safe Guard: Ensure we have data
  if (!rawData) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
        Missing raw data for Table Completion
      </div>
    );
  }

  // Handle the registration key as requested: questions[id].answer
  const registrationKey = `questions.${question.id}.answer`;

  // Parse the question text for placeholders (e.g. ______)
  const parts = rawData.question_text?.split('______') || [rawData.question_text || ''];

  return (
    <div className="space-y-4 p-6 border-2 border-gray-100 rounded-2xl bg-white shadow-sm hover:border-blue-100 transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg font-black text-sm shrink-0">
            {questionNumber}
          </span>
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
            {rawData.question_context || 'Table Completion'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {validationRules?.maxWords && (
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter">
              Max {validationRules.maxWords} Words
            </span>
          )}
          {onToggleReview && (
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Review</span>
              <input type="checkbox" checked={isReviewChecked?.(qNum) ?? false} onChange={() => onToggleReview(qNum)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
            </label>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-lg font-bold text-gray-700 leading-relaxed">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span>{part}</span>
            {index < parts.length - 1 && (
              <input
                {...register(registrationKey)}
                disabled={disabled}
                placeholder="..."
                className="inline-block min-w-[120px] max-w-[200px] h-10 px-4 bg-foreground border-b-4 border-bordercolor focus:border-primary focus:bg-white outline-none transition-all placeholder:text-textsecondary text-primary font-black text-center rounded-t-lg"
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Demonstrating flexibility: support image nested in data if it existed */}
      {rawData.passage_id && (
        <div className="pt-4 mt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
          <span>Linked to Content ID:</span>
          <code className="bg-gray-50 px-1.5 py-0.5 rounded italic">{rawData.passage_id}</code>
        </div>
      )}
    </div>
  );
};

export default TableCompletion;
