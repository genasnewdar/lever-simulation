"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import type { GroupRendererProps } from "./types";
import type { TableLayoutData } from "@/types/ielts-simulation";
import { LayoutCells, GroupHeader, ReviewCheckbox } from "./shared";
import { cn } from "@/lib/utils";

export default function TableGroupRenderer({
  group,
  reviewSet,
  toggleReview,
  flashQuestionNumber,
  disabled,
}: GroupRendererProps) {
  const layout = group.layout_data as TableLayoutData | null;

  // If no layout_data, fall back to simple list rendering
  if (!layout?.headers || !layout?.rows) {
    return <TableFallback group={group} reviewSet={reviewSet} toggleReview={toggleReview} flashQuestionNumber={flashQuestionNumber} disabled={disabled} />;
  }

  return (
    <div className="space-y-4">
      <GroupHeader
        title={group.title}
        instructions={group.instructions}
        wordLimitText={group.word_limit_text}
      />
      <div className="border border-rule rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-paper-3 border-b border-rule">
              {layout.headers.map((header, i) => (
                <th
                  key={i}
                  className={cn(
                    "p-2 text-left font-semibold text-ink",
                    i < layout.headers.length - 1 && "border-r border-rule",
                  )}
                >
                  {header}
                </th>
              ))}
              <th className="p-2 text-left font-semibold text-ink w-[90px]">
                Review
              </th>
            </tr>
          </thead>
          <tbody>
            {layout.rows.map((row, rowIdx) => {
              // Find which question(s) are in this row by checking input cells
              const inputQNums = row.cells.flatMap((cell) =>
                cell.content
                  .filter((c) => c.type === "input")
                  .map((c) => (c as { questionNumber: number }).questionNumber),
              );

              return (
                <tr
                  key={rowIdx}
                  className="border-b border-rule last:border-b-0 hover:bg-paper-2 transition-colors"
                >
                  {row.cells.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className={cn(
                        "p-2 text-base text-ink align-middle",
                        cellIdx < row.cells.length - 1 && "border-r border-rule",
                      )}
                      colSpan={cell.colspan}
                      rowSpan={cell.rowspan}
                    >
                      <span className="flex flex-wrap items-center gap-1">
                        <LayoutCells
                          cells={cell.content}
                          questions={group.questions}
                          disabled={disabled}
                          flashQuestionNumber={flashQuestionNumber}
                        />
                      </span>
                    </td>
                  ))}
                  <td className="p-2 align-middle">
                    <div className="flex flex-col gap-1">
                      {inputQNums.map((qNum) => (
                        <ReviewCheckbox
                          key={qNum}
                          questionNumber={qNum}
                          reviewSet={reviewSet}
                          toggleReview={toggleReview}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Fallback when TABLE group has no layout_data: render questions as simple text inputs */
function TableFallback({
  group,
  reviewSet,
  toggleReview,
  flashQuestionNumber,
  disabled,
}: GroupRendererProps) {
  const { register } = useFormContext();

  return (
    <div className="space-y-4">
      <GroupHeader
        title={group.title}
        instructions={group.instructions}
        wordLimitText={group.word_limit_text}
      />
      <div className="border border-rule rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-paper-2 border-b border-rule">
              <th className="border-r border-rule p-2 text-left font-semibold text-ink">
                Question
              </th>
              <th className="p-2 text-left font-semibold text-ink w-[90px]">
                Review
              </th>
            </tr>
          </thead>
          <tbody>
            {group.questions.map((q) => {
              const parts = (q.question_text ?? "").split(/_{2,}/);
              const regKey = `questions.${q.id}.answer`;
              return (
                <tr
                  key={q.id}
                  id={`q-${q.question_number}`}
                  className={cn(
                    "border-b border-rule hover:bg-paper-2 transition-colors",
                    flashQuestionNumber === q.question_number && "ielts-question-flash bg-mint-soft",
                  )}
                >
                  <td className="border-r border-rule p-2 align-middle text-sm font-medium text-ink">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-ink text-paper rounded-lg text-sm font-semibold">
                        {q.question_number}
                      </span>
                      <span className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
                        {parts.map((part, idx) => (
                          <React.Fragment key={idx}>
                            {part}
                            {idx < parts.length - 1 && (
                              <input
                                {...register(regKey)}
                                disabled={disabled}
                                placeholder="..."
                                autoComplete="off"
                                spellCheck={false}
                                onContextMenu={(e) => e.preventDefault()}
                                className="inline-block min-w-[100px] max-w-[220px] mx-0.5 px-2 py-0.5 border-b border-rule bg-transparent focus:bg-paper-3 outline-none font-medium text-ink"
                              />
                            )}
                          </React.Fragment>
                        ))}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 align-middle">
                    <ReviewCheckbox
                      questionNumber={q.question_number}
                      reviewSet={reviewSet}
                      toggleReview={toggleReview}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
