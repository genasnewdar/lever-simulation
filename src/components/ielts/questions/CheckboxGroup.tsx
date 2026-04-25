'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Question } from '../../../types/ielts';
import { Checkbox } from '../../ui/checkbox';

interface CheckboxGroupProps {
  question: Question;
  disabled?: boolean;
  onToggleReview?: (qNum: number) => void;
  isReviewChecked?: (qNum: number) => boolean;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ question, disabled, onToggleReview, isReviewChecked }) => {
  const { control } = useFormContext();
  const { id, options, questionNumber, title, rawData } = question;
  const qNum = questionNumber ?? (rawData && 'question_number' in rawData ? (rawData as { question_number: number }).question_number : 0);

  return (
    <div className="space-y-4 p-6 border rounded-md bg-paper-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {questionNumber && (
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-ink text-paper rounded-md text-sm font-semibold">
              {questionNumber}
            </span>
          )}
          <h3 className="text-xl font-semibold text-textprimary">{title || 'Select all that apply.'}</h3>
        </div>
        {onToggleReview && (
          <label className="flex items-center gap-2 shrink-0 cursor-pointer">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">Review</span>
            <input type="checkbox" checked={isReviewChecked?.(qNum) ?? false} onChange={() => onToggleReview(qNum)} className="w-4 h-4 rounded border-rule text-ink focus:ring-mint" />
          </label>
        )}
      </div>
      
      <div className="space-y-3 pl-12">
        <Controller
          name={id}
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <div className="space-y-3">
              {options?.map((option) => {
                const isChecked = field.value?.includes(option.id);
                
                return (
                  <label
                    key={option.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isChecked
                        ? 'border-ink bg-mint-soft shadow-sm'
                        : 'border-rule hover:border-ink-soft'
                    } ${disabled ? 'opacity-70 cursor-not-allowed shadow-none' : ''}`}
                  >
                    <Checkbox
                      checked={isChecked}
                      disabled={disabled}
                      onCheckedChange={(checked) => {
                        const currentValues = field.value || [];
                        if (checked) {
                          field.onChange([...currentValues, option.id]);
                        } else {
                          field.onChange(currentValues.filter((v: string) => v !== option.id));
                        }
                      }}
                    />
                    <span className="text-ink font-medium">
                      <span className="font-semibold mr-2">{option.id.toUpperCase()}.</span>
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default CheckboxGroup;
