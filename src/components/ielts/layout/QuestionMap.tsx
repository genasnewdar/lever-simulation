"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MapSection {
  title: string;
  start: number;
  end: number;
}

interface QuestionMapProps {
  totalQuestions: number;
  currentQuestionIndex: number;
  onQuestionClick: (index: number) => void;
  answeredQuestions: Set<number>;
  reviewQuestions: Set<number>;
  activeTab: "LISTENING" | "READING" | "WRITING";
  writingTask?: number;
  onWritingTaskChange?: (task: number) => void;
  isWritingTaskAnswered?: (task: number) => boolean;
  sections?: MapSection[];
  /** For Listening: which part tab is selected (0–3). If undefined, derived from currentQuestionIndex. */
  activePartIndex?: number;
  /** For Listening: when user clicks a Part tab. */
  onPartChange?: (partIndex: number) => void;
}

const QuestionMap: React.FC<QuestionMapProps> = ({
  totalQuestions,
  currentQuestionIndex,
  onQuestionClick,
  answeredQuestions,
  reviewQuestions,
  activeTab,
  writingTask,
  onWritingTaskChange,
  isWritingTaskAnswered,
  sections = [],
  activePartIndex: controlledPartIndex,
  onPartChange,
}) => {
  const parts =
    sections.length > 0
      ? sections.map((s) => ({ title: s.title, start: s.start, end: s.end }))
      : Array.from({ length: Math.ceil(totalQuestions / 10) }, (_, i) => ({
          title: `Section ${i + 1}`,
          start: i * 10 + 1,
          end: Math.min((i + 1) * 10, totalQuestions),
        }));

  const derivedPartIndex =
    parts.length > 0
      ? parts.findIndex(
          (p) =>
            currentQuestionIndex + 1 >= p.start &&
            currentQuestionIndex + 1 <= p.end
        )
      : 0;
  const activePartIndex =
    controlledPartIndex !== undefined
      ? controlledPartIndex
      : Math.max(0, derivedPartIndex);

  const isTabbedFooter =
    (activeTab === "LISTENING" && parts.length >= 4) ||
    (activeTab === "READING" && parts.length >= 2);

  return (
    <footer
      className={cn(
        "bg-gray-100 border-t border-bordercolor flex items-center justify-between fixed bottom-0 w-full z-50 select-none overflow-hidden",
        isTabbedFooter ? "min-h-[88px] py-2" : "h-[56px]"
      )}
    >
      <div className="flex-shrink-0 flex items-center px-4 border-r border-bordercolor h-full">
        {activeTab !== "WRITING" ? (
          <button
            disabled={currentQuestionIndex === 0}
            onClick={() => onQuestionClick(currentQuestionIndex - 1)}
            className="flex items-center px-4 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed group transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
        ) : (
          <div className="w-20" />
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center h-full overflow-x-auto no-scrollbar scroll-smooth min-w-0">
        {activeTab === "WRITING" ? (
          <div className="w-full flex justify-center gap-3 px-4">
            {[1, 2].map((task) => {
              const isActive = writingTask === task;
              const isAnswered = isWritingTaskAnswered?.(task);
              return (
                <button
                  key={task}
                  onClick={() => onWritingTaskChange?.(task)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-sm font-bold transition-all border-2",
                    isActive
                      ? "bg-primary text-white border-primary shadow-md"
                      : "bg-white text-textprimary border-bordercolor hover:border-gray-400",
                    !isActive &&
                      isAnswered &&
                      "bg-emerald-50 border-emerald-400 text-emerald-700"
                  )}
                >
                  Task {task}
                </button>
              );
            })}
          </div>
        ) : isTabbedFooter ? (
          <div className="w-full flex items-center gap-2 px-2 justify-center flex-nowrap shrink-0">
            {parts.map((part, pIdx) => {
              const partStart = part.start;
              const partEnd = part.end;
              const count = partEnd - partStart + 1;
              const isActivePart = activePartIndex === pIdx;

              return (
                <div
                  key={pIdx}
                  className={cn(
                    "rounded-xl border-2 bg-white flex flex-col items-stretch min-w-0 shrink transition-all",
                    isActivePart
                      ? "border-primary shadow-md py-1.5 px-2"
                      : "border-bordercolor hover:border-gray-400 py-1.5 px-2 rounded-xl"
                  )}
                >
                  {isActivePart ? (
                    <div className="flex items-center gap-1 justify-center flex-wrap max-w-[320px]">
                        {Array.from({ length: count }, (_, i) => {
                          const qNum = partStart + i;
                          const idx = qNum - 1;
                          const isCurrent = idx === currentQuestionIndex;
                          const isAnswered = answeredQuestions.has(qNum);
                          const isReview = reviewQuestions.has(qNum);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => onQuestionClick(idx)}
                              className={cn(
                                "w-7 h-7 flex items-center justify-center text-xs font-bold transition-all border-2 min-w-[28px] rounded-full",
                                isCurrent && "bg-primary text-white border-primary",
                                !isCurrent &&
                                  isAnswered &&
                                  "bg-secondary text-primary border-primary",
                                !isCurrent &&
                                  !isAnswered &&
                                  "bg-gray-100 text-textprimary border-bordercolor hover:border-primary",
                                isReview && "ring-2 ring-amber-500 ring-offset-1"
                              )}
                            >
                              {qNum}
                            </button>
                          );
                        })}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onPartChange?.(pIdx);
                        onQuestionClick(partStart - 1);
                      }}
                      className="flex flex-col items-center justify-center gap-0.5 w-full min-w-[64px] py-1"
                    >
                      <span className="text-textprimary font-bold text-sm">
                        Section {pIdx + 1}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center h-full gap-4 px-4">
            {parts.map((part, pIdx) => {
              const partStart = part.start;
              const partEnd = part.end;
              const count = partEnd - partStart + 1;
              const answeredInPart = Array.from(
                { length: count },
                (_, i) => partStart + i
              ).filter((qNum) => answeredQuestions.has(qNum)).length;
              const isActivePart =
                currentQuestionIndex + 1 >= partStart &&
                currentQuestionIndex + 1 <= partEnd;

              const partTitle = (part as { title?: string }).title ?? `Section ${pIdx + 1}`;
              return (
                <div
                  key={pIdx}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <button
                    onClick={() => onQuestionClick(partStart - 1)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 flex items-center gap-2",
                      isActivePart
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-textprimary border-bordercolor hover:border-gray-300"
                    )}
                    title={partTitle}
                  >
                    <span className="truncate max-w-[140px]">{partTitle}</span>
                    <span className="opacity-90">
                      {answeredInPart}/{count}
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: count }, (_, i) => {
                      const qNum = partStart + i;
                      const idx = qNum - 1;
                      const isCurrent = idx === currentQuestionIndex;
                      const isAnswered = answeredQuestions.has(qNum);
                      const isReview = reviewQuestions.has(qNum);
                      return (
                        <button
                          key={idx}
                          onClick={() => onQuestionClick(idx)}
                          className={cn(
                            "w-8 h-8 flex items-center justify-center text-xs font-bold transition-all border-2 min-w-[32px]",
                            isCurrent &&
                              "bg-primary text-white border-primary",
                            !isCurrent &&
                              isAnswered &&
                              "bg-secondary text-primary border-primary",
                            !isCurrent &&
                              !isAnswered &&
                              "bg-white text-textprimary border-bordercolor hover:border-primary",
                            isReview
                              ? "rounded-full border-2 border-amber-500"
                              : "rounded-lg",
                            !isReview && "rounded-lg"
                          )}
                        >
                          {qNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 flex items-center px-4 border-l border-bordercolor h-full">
        {activeTab !== "WRITING" ? (
          <button
            disabled={currentQuestionIndex === totalQuestions - 1}
            onClick={() => onQuestionClick(currentQuestionIndex + 1)}
            className="flex items-center px-4 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed group transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </button>
        ) : (
          <div className="w-20" />
        )}
      </div>
    </footer>
  );
};

export default QuestionMap;
