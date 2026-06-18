"use client";

import React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import type { BackendQuestion, LayoutDataCell } from "@/types/ielts-simulation";
import { cn } from "@/lib/utils";

type RenderItem =
  | { kind: "text"; value: string }
  | { kind: "input"; q: BackendQuestion };

/** Render an array of layout_data cells (text spans + input blanks).
 *  Text cells containing 2+ underscores are split and each blank gets the next
 *  unmatched question (i.e. questions without an explicit input cell). */
export function LayoutCells({
  cells,
  questions,
  disabled,
  flashQuestionNumber,
  inputClassName,
}: {
  cells: LayoutDataCell[];
  questions: BackendQuestion[];
  disabled: boolean;
  flashQuestionNumber?: number | null;
  inputClassName?: string;
}) {
  const { register } = useFormContext();

  const qByNum = React.useMemo(() => {
    const map: Record<number, BackendQuestion> = {};
    questions.forEach((q) => { map[q.question_number] = q; });
    return map;
  }, [questions]);

  // Questions without an explicit input cell — assigned to ___ blanks in text cells.
  const unmatchedQuestions = React.useMemo(() => {
    const covered = new Set<number>();
    cells.forEach((c) => { if (c.type === "input") covered.add(c.questionNumber); });
    return questions
      .filter((q) => !covered.has(q.question_number))
      .sort((a, b) => a.question_number - b.question_number);
  }, [cells, questions]);

  // Expand cells into flat render items, filling ___ with unmatched questions.
  const items = React.useMemo((): RenderItem[] => {
    let unmatchedIdx = 0;
    const result: RenderItem[] = [];
    for (const cell of cells) {
      if (cell.type === "input") {
        const q = qByNum[cell.questionNumber];
        if (q) result.push({ kind: "input", q });
      } else {
        const parts = cell.value.split(/_{2,}/);
        for (let pi = 0; pi < parts.length; pi++) {
          if (parts[pi]) result.push({ kind: "text", value: parts[pi] });
          if (pi < parts.length - 1) {
            const q = unmatchedQuestions[unmatchedIdx++];
            result.push(q ? { kind: "input", q } : { kind: "text", value: "___" });
          }
        }
      }
    }
    return result;
  }, [cells, qByNum, unmatchedQuestions]);

  return (
    <>
      {items.map((item, i) => {
        if (item.kind === "text") {
          return <span key={i}>{item.value}</span>;
        }
        const { q } = item;
        const reg: UseFormRegisterReturn = register(`questions.${q.id}.answer`);
        return (
          <span
            key={i}
            id={`q-${q.question_number}`}
            className={cn(
              "inline-flex items-center gap-1",
              flashQuestionNumber === q.question_number && "ielts-question-flash rounded p-0.5 -m-0.5",
            )}
          >
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-ink text-paper rounded text-xs font-semibold">
              {q.question_number}
            </span>
            <input
              {...reg}
              disabled={disabled}
              placeholder="..."
              autoComplete="off"
              spellCheck={false}
              onContextMenu={(e) => e.preventDefault()}
              className={inputClassName ?? "inline-block min-w-[80px] max-w-[180px] px-2 py-0.5 border-b border-rule bg-transparent focus:bg-paper-3 outline-none font-medium text-ink"}
            />
          </span>
        );
      })}
    </>
  );
}

/** Group header: renders title + instructions + word_limit_text */
export function GroupHeader({
  title,
  instructions,
  wordLimitText,
}: {
  title?: string | null;
  instructions?: string | null;
  wordLimitText?: string | null;
}) {
  if (!title && !instructions && !wordLimitText) return null;
  return (
    <div className="space-y-2 mb-4">
      {title && (
        <h3 className="text-xl font-semibold text-[#2b5a9e]">{title}</h3>
      )}
      {instructions && (
        <p className="text-ink text-base font-medium">{instructions}</p>
      )}
      {wordLimitText && (
        <p className="text-base font-medium">
          Write{" "}
          <span className="font-semibold text-mint-deep uppercase">
            {wordLimitText}
          </span>{" "}
          for each answer.
        </p>
      )}
    </div>
  );
}

/** Review checkbox for a question. Renders nothing when toggleReview is omitted. */
export function ReviewCheckbox({
  questionNumber,
  reviewSet,
  toggleReview,
}: {
  questionNumber: number;
  reviewSet: Set<number>;
  toggleReview?: (n: number) => void;
}) {
  if (!toggleReview) return null;
  return (
    <label className="flex items-center gap-1.5 cursor-pointer">
      <span className="text-[10px] font-semibold text-muted uppercase">
        Review
      </span>
      <input
        type="checkbox"
        checked={reviewSet.has(questionNumber)}
        onChange={() => toggleReview(questionNumber)}
        className="w-4 h-4 rounded border-rule text-ink focus:ring-mint"
      />
    </label>
  );
}
