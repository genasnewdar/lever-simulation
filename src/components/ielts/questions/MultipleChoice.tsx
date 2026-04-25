'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Question } from '../../../types/ielts';

interface MultipleChoiceProps {
  question: Question;
  disabled?: boolean;
  onToggleReview?: (qNum: number) => void;
  isReviewChecked?: (qNum: number) => boolean;
}

const MultipleChoice: React.FC<MultipleChoiceProps> = ({ question, disabled, onToggleReview, isReviewChecked }) => {
  const { register, watch } = useFormContext();
  const { id, options, allowMultiple, questionNumber, title, rawData } = question;

  const qNum = questionNumber ?? (rawData && 'question_number' in rawData ? (rawData as { question_number: number }).question_number : 0);
  const registrationKey = `questions.${id}.answer`;
  const currentValues = watch(registrationKey);

  // Safe Guard: Robust options parsing
  const displayOptions = options || rawData?.options?.map(o => ({ id: o.label.toLowerCase(), label: o.text })) || [];

  return (
    <div className="space-y-4 p-6 border border-rule rounded-lg bg-paper-2 hover:border-rule transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {questionNumber && (
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-ink text-paper rounded-lg text-sm font-semibold">
              {questionNumber}
            </span>
          )}
          <div className="flex flex-col min-w-0">
             <h3 className="text-xl font-semibold text-ink leading-tight">
               {rawData?.question_text || title || 'Select the correct option'}
             </h3>
             <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mt-1">
               {rawData?.instructions || (allowMultiple ? 'Select all that apply' : 'Choose one response')}
             </p>
          </div>
        </div>
        {onToggleReview && (
          <label className="flex items-center gap-2 shrink-0 cursor-pointer">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">Review</span>
            <input
              type="checkbox"
              checked={isReviewChecked?.(qNum) ?? false}
              onChange={() => onToggleReview(qNum)}
              className="w-4 h-4 rounded border-rule text-ink focus:ring-mint"
            />
          </label>
        )}
      </div>
      
      <div className="space-y-3 mt-6">
        {displayOptions.map((option) => {
          const isSelected = allowMultiple 
            ? Array.isArray(currentValues) && currentValues.includes(option.id) 
            : currentValues === option.id;
            
          return (
            <label
              key={option.id}
              className={`flex items-center gap-4 p-4 rounded-md border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-secondary shadow-sm'
                  : 'border-rule bg-background hover:border-ink-soft'
              } ${disabled ? 'opacity-50 cursor-not-allowed grayscale shadow-none' : ''}`}
            >
              <div className={`w-6 h-6 border-2 flex items-center justify-center transition-colors ${
                allowMultiple ? 'rounded-md' : 'rounded-full'
              } ${
                isSelected ? 'bg-primary border-primary' : 'border-bordercolor bg-white'
              }`}>
                {isSelected && (
                  allowMultiple ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )
                )}
              </div>
              <input
                type={allowMultiple ? 'checkbox' : 'radio'}
                value={option.id}
                disabled={disabled}
                {...register(registrationKey)}
                className="hidden"
              />
              <span className="text-ink-soft font-semibold">
                <span className="font-semibold mr-2 opacity-30">{option.id.toUpperCase()}.</span>
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default MultipleChoice;
