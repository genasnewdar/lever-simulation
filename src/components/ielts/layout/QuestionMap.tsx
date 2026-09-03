"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SectionTab } from "@/types/ielts-simulation";

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
  activeTab: SectionTab;
  writingTask?: number;
  onWritingTaskChange?: (task: number) => void;
  isWritingTaskAnswered?: (task: number) => boolean;
  sections?: MapSection[];
  /** For Listening: which part tab is selected (0–3). If undefined, derived from currentQuestionIndex. */
  activePartIndex?: number;
  /** For Listening: when user clicks a Part tab. */
  onPartChange?: (partIndex: number) => void;
}

/**
 * The navigation bar of the computer-delivered test, and it follows that one
 * closely because candidates learn it before they sit the real exam:
 *
 * - every question number in the section is on screen at once, grouped by part,
 *   and any of them can be clicked to jump straight there;
 * - a question that has been answered carries a line under its number;
 * - a question ticked for Review turns from a square into a circle, so the ones
 *   to come back to are picked out at a glance;
 * - the question being worked on is the inked box.
 */
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

  const goToQuestion = (partIndex: number, questionNumber: number) => {
    // A number in another part: bring that part up first, then land on the
    // question itself — the part change alone would stop at its first question.
    if (partIndex !== activePartIndex) onPartChange?.(partIndex);
    onQuestionClick(questionNumber - 1);
  };

  return (
    <footer className="bg-paper-2 border-t border-rule flex items-center justify-between fixed bottom-0 w-full z-50 select-none h-[56px]">
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

      <div className="flex-1 flex items-center justify-center h-full gap-3 px-4 overflow-x-auto custom-scrollbar">
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
              const count = part.end - part.start + 1;
              const numbersInPart = Array.from(
                { length: count },
                (_, i) => part.start + i
              );
              const isActivePart = activePartIndex === pIdx;
              const partTitle = part.title ?? `Section ${pIdx + 1}`;

              return (
                <div
                  key={pIdx}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <button
                    onClick={() => goToQuestion(pIdx, part.start)}
                    className={cn(
                      "px-1.5 py-1 rounded text-[12px] tracking-tight whitespace-nowrap transition-colors",
                      isActivePart
                        ? "text-ink font-semibold"
                        : "text-muted font-medium hover:text-ink"
                    )}
                    title={partTitle}
                  >
                    <span className="truncate max-w-[120px] inline-block align-bottom">
                      {partTitle}
                    </span>
                  </button>

                  <div className="flex items-center gap-1">
                    {numbersInPart.map((qNum) => {
                      const isCurrent = qNum === currentQuestionIndex + 1;
                      const isAnswered = answeredQuestions.has(qNum);
                      const isFlagged = reviewQuestions?.has(qNum);
                      return (
                        <button
                          key={qNum}
                          onClick={() => goToQuestion(pIdx, qNum)}
                          aria-current={isCurrent ? "true" : undefined}
                          aria-label={`Question ${qNum}${
                            isAnswered ? ", answered" : ""
                          }${isFlagged ? ", marked for review" : ""}`}
                          title={`Question ${qNum}${
                            isFlagged ? " — marked for review" : ""
                          }`}
                          className={cn(
                            "grid h-[26px] min-w-[26px] place-content-center border text-[12px] tabular-nums transition-all",
                            // Square by default; a circle once it is flagged.
                            isFlagged ? "rounded-full" : "rounded-[3px]",
                            isCurrent
                              ? "bg-ink text-paper border-ink font-semibold"
                              : "border-transparent text-ink-soft hover:border-rule hover:text-ink",
                            isFlagged &&
                              !isCurrent &&
                              "border-[var(--flag)] bg-[var(--flag-tint)] text-ink",
                            isFlagged && isCurrent && "border-[var(--flag)]"
                          )}
                        >
                          {/* The line under an answered number is the real
                              test's "this one is done" mark. */}
                          <span
                            className={cn(
                              "leading-none px-0.5",
                              isAnswered && "border-b-2 border-current"
                            )}
                          >
                            {qNum}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
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
