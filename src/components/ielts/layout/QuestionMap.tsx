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

  return (
    <footer className="bg-paper-2 border-t border-rule flex items-center justify-between fixed bottom-0 w-full z-50 select-none overflow-hidden h-[56px]">
      <div className="flex-shrink-0 flex items-center px-4 border-r border-rule h-full">
        {activeTab !== "WRITING" ? (
          <button
            disabled={currentQuestionIndex === 0}
            onClick={() => onQuestionClick(currentQuestionIndex - 1)}
            className="flex items-center px-3 py-1.5 text-[13px] font-medium text-ink-soft hover:text-ink rounded-md disabled:opacity-30 disabled:cursor-not-allowed group transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
        ) : (
          <div className="w-20" />
        )}
      </div>

      <div className="flex-1 flex items-center justify-center h-full gap-3 px-4">
        {activeTab === "WRITING" ? (
          <>
            {[1, 2].map((task) => {
              const isActive = writingTask === task;
              const isAnswered = isWritingTaskAnswered?.(task);
              return (
                <button
                  key={task}
                  onClick={() => onWritingTaskChange?.(task)}
                  className={cn(
                    "px-5 py-1.5 rounded-md text-[13px] font-medium tracking-tight transition-all border",
                    isActive
                      ? "bg-ink text-paper border-ink"
                      : "bg-paper text-ink-soft border-rule hover:border-ink-soft hover:text-ink",
                    !isActive &&
                      isAnswered &&
                      "border-mint text-mint-deep"
                  )}
                >
                  Task {task}
                </button>
              );
            })}
          </>
        ) : (
          <>
            {parts.map((part, pIdx) => {
              const partStart = part.start;
              const partEnd = part.end;
              const count = partEnd - partStart + 1;
              const answeredInPart = Array.from(
                { length: count },
                (_, i) => partStart + i
              ).filter((qNum) => answeredQuestions.has(qNum)).length;
              const isActivePart = activePartIndex === pIdx;

              const partTitle = part.title ?? `Section ${pIdx + 1}`;
              return (
                <button
                  key={pIdx}
                  onClick={() => {
                    onPartChange?.(pIdx);
                    onQuestionClick(partStart - 1);
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-md text-[12px] font-medium transition-all border flex items-center gap-2 tracking-tight",
                    isActivePart
                      ? "bg-ink text-paper border-ink"
                      : "bg-paper text-ink-soft border-rule hover:border-ink-soft hover:text-ink"
                  )}
                  title={partTitle}
                >
                  <span className="truncate max-w-[140px]">{partTitle}</span>
                  <span className={cn("tabular-nums", isActivePart ? "text-paper/80" : "text-muted")}>
                    {answeredInPart}/{count}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </div>

      <div className="flex-shrink-0 flex items-center px-4 border-l border-rule h-full">
        {activeTab !== "WRITING" ? (
          <button
            disabled={currentQuestionIndex === totalQuestions - 1}
            onClick={() => onQuestionClick(currentQuestionIndex + 1)}
            className="flex items-center px-3 py-1.5 text-[13px] font-medium text-ink-soft hover:text-ink rounded-md disabled:opacity-30 disabled:cursor-not-allowed group transition-colors"
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
