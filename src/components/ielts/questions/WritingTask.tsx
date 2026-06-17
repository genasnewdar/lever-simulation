"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useFormContext } from "react-hook-form";
import { Question } from "../../../types/ielts";

interface WritingTaskProps {
  question: Question;
  disabled?: boolean;
}

const WritingTask: React.FC<WritingTaskProps> = ({ question, disabled }) => {
  const { register, watch } = useFormContext();
  const { id, content, validationRules, imageUrl, type } = question;

  const textValue = watch(id) || "";
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const words = textValue
      .trim()
      .split(/\s+/)
      .filter((word: string) => word.length > 0);
    setWordCount(words.length);
  }, [textValue]);

  const isTask2 = type === "WRITING_TASK_2";

  return (
    <div className="flex flex-col gap-10 p-10 max-w-5xl mx-auto">
      <div className="flex items-baseline justify-between border-b border-rule pb-4">
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
            Academic Writing
          </p>
          <h2 className="font-serif text-[1.6rem] font-semibold text-ink tracking-[-0.02em]">
            {isTask2 ? "Writing Task 2" : "Writing Task 1"}
          </h2>
        </div>
        <div className="text-right space-y-0.5">
          <p className="text-[12px] font-medium text-ink-soft tabular-nums">
            {wordCount} words
          </p>
          {validationRules?.maxWords && (
            <p className="text-[11px] text-muted">
              Target {validationRules.maxWords}+
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[500px]">
        {/* Left: Instruction & prompt */}
        <div className="space-y-8">
          <div className="font-serif text-[1.0625rem] leading-[1.7] text-ink max-w-[64ch]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted not-italic mb-3 font-sans">
              Prompt
            </p>
            {content}
          </div>

          {!isTask2 && imageUrl && (
            <div className="relative aspect-square bg-white rounded-lg border border-rule overflow-hidden group hover:border-ink-soft transition-colors cursor-zoom-in">
              <Image
                src={imageUrl}
                alt="Writing Task Graphic"
                fill
                className="object-contain p-6 transform group-hover:scale-105 transition-transform duration-500"
                unoptimized
              />
            </div>
          )}

          {isTask2 && (
            <div className="p-6 bg-white rounded-lg border border-rule space-y-4">
              <h4 className="text-sm font-semibold text-ink uppercase tracking-widest">
                Key Requirements
              </h4>
              <ul className="space-y-3 text-sm font-medium text-ink-soft">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-mint-deep rounded-full" />
                  Give reasons for your answer
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-mint-deep rounded-full" />
                  Include relevant examples from your own knowledge
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="relative h-full flex flex-col gap-3">
          <textarea
            {...register(id)}
            disabled={disabled}
            placeholder="Begin writing here…"
            autoComplete="off"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
            onContextMenu={(e) => e.preventDefault()}
            className={`w-full flex-1 min-h-[560px] p-7 border rounded-md outline-none resize-none font-serif text-[1.0625rem] leading-[1.7] tracking-tight text-ink transition-all ${
              disabled
                ? "bg-paper-3 cursor-not-allowed border-rule text-muted"
                : "bg-paper border-rule focus:border-mint focus:ring-1 focus:ring-mint/30 hover:border-ink-soft"
            }`}
          />
          <p className="text-[11px] text-muted tracking-tight self-end">
            Autosaved at{" "}
            <span className="tabular-nums">
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WritingTask;
