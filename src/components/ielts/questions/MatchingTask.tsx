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
    <div className="space-y-8 p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {(title || question.content) && (
          <h3 className="text-xl font-bold text-textprimary min-w-0">
            {title || question.content}
          </h3>
        )}
        {onToggleReview && (
          <label className="flex items-center gap-2 shrink-0 cursor-pointer">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Review</span>
            <input type="checkbox" checked={isReviewChecked?.(qNum) ?? false} onChange={() => onToggleReview(qNum)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
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
                  className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-bordercolor text-textprimary flex items-start gap-3"
                >
                  <span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded text-xs font-bold flex-shrink-0 mt-1">
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
        <div className="lg:col-span-12 space-y-4 pt-10 border-t items-center border-gray-100">
          <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">
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
                  className="flex flex-col md:flex-row md:items-center gap-6 p-5 border-2 border-gray-50 rounded-xl hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex-grow flex items-start gap-4">
                    <span className="bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded text-xs font-bold mt-1 flex-shrink-0">
                      {target.id}
                    </span>
                    <p className="text-lg font-bold text-textprimary leading-snug">
                      {target.description}
                    </p>
                  </div>
                  <div className="min-w-[140px]">
                    {hasItems ? (
                      <select
                        disabled={disabled}
                        {...register(registrationKey)}
                        className={`w-full p-3 border-2 border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-bold text-center outline-none transition-all ${
                          disabled
                            ? "bg-gray-200 cursor-not-allowed text-gray-400"
                            : "cursor-pointer hover:border-blue-200"
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
                        className={`w-full p-3 border-2 border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-bold text-center outline-none transition-all ${
                          disabled
                            ? "bg-gray-200 cursor-not-allowed text-gray-400"
                            : "hover:border-blue-200"
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
