'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Question } from '../../../types/ielts';

interface NoteCompletionProps {
  question: Question;
  disabled?: boolean;
  onToggleReview?: (qNum: number) => void;
  isReviewChecked?: (qNum: number) => boolean;
}

const NoteCompletion: React.FC<NoteCompletionProps> = ({ question, disabled, onToggleReview, isReviewChecked }) => {
  const { register } = useFormContext();
  const { noteData, title, validationRules, questionNumber, rawData } = question;
  const qNum = questionNumber ?? (rawData && 'question_number' in rawData ? (rawData as { question_number: number }).question_number : 0);

  if (!noteData) return null;

  return (
    <div className="space-y-6 p-8 border rounded-md bg-foreground shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-4 border-b pb-4 border-rule">
        <h3 className="text-xl font-semibold text-textprimary tracking-tight min-w-0">{title || 'Note Completion'}</h3>
        <div className="flex items-center gap-2 shrink-0">
          {validationRules?.maxWords && (
            <span className="text-[10px] font-semibold text-mint-deep bg-mint-soft border border-rule px-3 py-1.5 rounded-full uppercase">
              Max {validationRules.maxWords} words
            </span>
          )}
          {onToggleReview && (
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">Review</span>
              <input type="checkbox" checked={isReviewChecked?.(qNum) ?? false} onChange={() => onToggleReview(qNum)} className="w-4 h-4 rounded border-rule text-ink focus:ring-mint" />
            </label>
          )}
        </div>
      </div>

      <div className="bg-paper-2 p-6 rounded-lg space-y-6">
        {noteData.title && (
          <h4 className="font-serif text-[1.05rem] font-semibold text-ink tracking-tight">{noteData.title}</h4>
        )}
        
        <ul className="space-y-6">
          {noteData.points.map((point, idx) => {
            const parts = point.split(/(\[\d+\])/g);
            return (
              <li key={idx} className="flex gap-4 items-start pl-2">
                <span className="w-2 h-2 mt-2.5 bg-mint-deep rounded-full flex-shrink-0" />
                <div className="flex flex-wrap items-center gap-y-4 text-ink-soft leading-relaxed font-medium text-lg">
                  {parts.map((part, pIdx) => {
                    const match = part.match(/\[(\d+)\]/);
                    if (match) {
                      const num = match[1];
                      return (
                        <div key={pIdx} className="inline-flex items-center mx-2 group relative">
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-ink text-paper text-[10px] px-2 py-0.5 rounded font-semibold">
                                {num}
                            </span>
                            <input
                                {...register(`gap_${num}`)}
                                disabled={disabled}
                                className={`border-b-2 border-rule/10 focus:border-ink outline-none px-4 py-1 w-36 font-semibold text-ink-soft bg-white rounded-t-lg transition-all ${
                                    disabled ? 'bg-paper-3 cursor-not-allowed opacity-70 border-b-transparent' : 'hover:bg-mint-soft'
                                }`}
                            />
                        </div>
                      );
                    }
                    return <span key={pIdx}>{part}</span>;
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default NoteCompletion;
