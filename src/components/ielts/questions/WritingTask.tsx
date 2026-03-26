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
    <div className="flex flex-col gap-8 p-10 border rounded-3xl bg-white shadow-2xl border-gray-100 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-gray-100 pb-8">
        <div>
          <h2 className="text-3xl font-black text-textprimary tracking-tight mb-2">
            {isTask2 ? "Writing Task 2" : "Writing Task 1"}
          </h2>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.2em]">
            Academic Writing Module
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-blue-600 text-white px-6 py-2 rounded-full font-black text-sm shadow-xl shadow-blue-200">
            {wordCount} Words
          </div>
          {validationRules?.maxWords && (
            <span className="text-[10px] font-black text-gray-400">
              Target: {validationRules.maxWords}+ words
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[500px]">
        {/* Left: Instruction & prompt */}
        <div className="space-y-8 bg-gray-50/50 p-8 rounded-3xl border border-gray-100/50">
          <div className="prose prose-slate prose-lg max-w-none">
            <blockquote className="border-l-8 border-primary bg-white p-6 rounded-r-2xl shadow-sm text-textprimary font-medium leading-relaxed italic">
              {content}
            </blockquote>
          </div>

          {!isTask2 && imageUrl && (
            <div className="relative aspect-square bg-white rounded-2xl border-2 border-gray-100 overflow-hidden group hover:border-blue-200 transition-colors cursor-zoom-in">
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
            <div className="p-6 bg-white rounded-2xl border-2 border-blue-50 space-y-4">
              <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest">
                Key Requirements
              </h4>
              <ul className="space-y-3 text-sm font-medium text-gray-600">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Give reasons for your answer
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Include relevant examples from your own knowledge
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Right: Editor */}
        <div className="relative h-full flex flex-col">
          <div className="flex-grow">
            <textarea
              {...register(id)}
              disabled={disabled}
              placeholder="Begin writing your response here..."
              className={`w-full h-full min-h-[600px] p-8 border-2 rounded-3xl focus:ring-8 focus:ring-primary/20 focus:border-primary outline-none resize-none font-serif text-xl tracking-tight text-textprimary leading-relaxed transition-all ${
                disabled
                  ? "bg-gray-100 cursor-not-allowed border-transparent text-gray-400"
                  : "bg-white border-bordercolor shadow-inner hover:border-primary"
              }`}
            />
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded bg-white shadow-sm border border-gray-200 flex items-center justify-center font-bold text-gray-400 text-xs">
                B
              </div>
              <div className="w-8 h-8 rounded bg-white shadow-sm border border-gray-200 flex items-center justify-center font-serif text-gray-400 italic">
                I
              </div>
              <div className="w-8 h-8 rounded bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-400">
                🔗
              </div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Autosaved at{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingTask;
