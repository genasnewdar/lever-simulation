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
    <div className="space-y-4 p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {questionNumber && (
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-md text-sm font-bold">
              {questionNumber}
            </span>
          )}
          <h3 className="text-xl font-bold text-textprimary">{title || 'Select all that apply.'}</h3>
        </div>
        {onToggleReview && (
          <label className="flex items-center gap-2 shrink-0 cursor-pointer">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Review</span>
            <input type="checkbox" checked={isReviewChecked?.(qNum) ?? false} onChange={() => onToggleReview(qNum)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
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
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                        : 'border-gray-100 hover:border-blue-200'
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
                    <span className="text-gray-800 font-medium">
                      <span className="font-bold mr-2">{option.id.toUpperCase()}.</span>
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
