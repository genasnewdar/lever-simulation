"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Question } from "../../../types/ielts";

interface MatchingTaskProps {
  question: Question;
  disabled?: boolean;
  onToggleReview?: (qNum: number) => void;
  isReviewChecked?: (qNum: number) => boolean;
}

const MatchingTask: React.FC<MatchingTaskProps> = ({ question, disabled, onToggleReview, isReviewChecked }) => {
  const { register } = useFormContext();
  const { id, matchingData, title, questionNumber, rawData } = question;
  const qNum = questionNumber ?? (rawData && 'question_number' in rawData ? (rawData as { question_number: number }).question_number : 0);

  if (!matchingData) return null;

  return (
    <div className="space-y-8 p-6 border rounded-md bg-paper-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {(title || question.content) && (
          <h3 className="text-xl font-semibold text-textprimary min-w-0">
            {title || question.content}
          </h3>
        )}
        {onToggleReview && (
          <label className="flex items-center gap-2 shrink-0 cursor-pointer">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">Review</span>
            <input type="checkbox" checked={isReviewChecked?.(qNum) ?? false} onChange={() => onToggleReview(qNum)} className="w-4 h-4 rounded border-rule text-ink focus:ring-mint" />
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Items to match (only when options/items exist) */}
        {matchingData.items.length > 0 && (
          <div className="lg:col-span-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchingData.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-paper-2 rounded-md border-2 border-dashed border-bordercolor text-textprimary flex items-start gap-3"
                >
                  <span className="bg-ink text-paper w-6 h-6 flex items-center justify-center rounded text-xs font-semibold flex-shrink-0 mt-1">
                    {item.id}
                  </span>
                  <span className="font-semibold leading-relaxed">
                    {item.content}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Targets */}
        <div className="lg:col-span-12 space-y-4 pt-10 border-t items-center border-rule">
          <h4 className="text-sm font-semibold text-muted uppercase tracking-widest mb-6">
            {matchingData.items.length > 0
              ? "Match features to the correct scientist/periods"
              : "Write the correct letter for each statement"}
          </h4>
          <div className="space-y-3">
            {matchingData.targets.map((target) => {
              const registrationKey = `questions.${id}.answer_${target.id}`;
              const hasItems = matchingData.items.length > 0;
              return (
                <div
                  key={target.id}
                  className="flex flex-col md:flex-row md:items-center gap-6 p-5 border border-rule rounded-md hover:bg-paper-2 transition-colors"
                >
                  <div className="flex-grow flex items-start gap-4">
                    <span className="bg-ink text-paper w-7 h-7 flex items-center justify-center rounded text-xs font-semibold mt-1 flex-shrink-0">
                      {target.id}
                    </span>
                    <p className="text-lg font-semibold text-textprimary leading-snug">
                      {target.description}
                    </p>
                  </div>
                  <div className="min-w-[140px]">
                    {hasItems ? (
                      <select
                        disabled={disabled}
                        {...register(registrationKey)}
                        className={`w-full p-3 border border-rule rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-center outline-none transition-all ${
                          disabled
                            ? "bg-paper-3 cursor-not-allowed text-muted"
                            : "cursor-pointer hover:border-ink-soft"
                        }`}
                      >
                        <option value="">A - Z</option>
                        {matchingData.items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.id}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled={disabled}
                        {...register(registrationKey)}
                        placeholder="e.g. A"
                        className={`w-full p-3 border border-rule rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-center outline-none transition-all ${
                          disabled
                            ? "bg-paper-3 cursor-not-allowed text-muted"
                            : "hover:border-ink-soft"
                        }`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingTask;
