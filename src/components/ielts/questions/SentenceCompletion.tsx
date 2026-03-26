// "use client";

// import React from "react";
// import { useFormContext } from "react-hook-form";
// import { Question } from "../../../types/ielts";

// interface SentenceCompletionProps {
//   question: Question;
//   disabled?: boolean;
// }

// const SentenceCompletion: React.FC<SentenceCompletionProps> = ({
//   question,
//   disabled,
// }) => {
//   const { register } = useFormContext();
//   const { content, validationRules, rawData, questionNumber } = question;

//   const qNum =
//     questionNumber ??
//     (rawData && "question_number" in rawData
//       ? (rawData as { question_number: number }).question_number
//       : 0);

//   const useRawGaps =
//     rawData &&
//     typeof rawData.question_text === "string" &&
//     rawData.question_text.includes("______");
//   const rawParts = useRawGaps
//     ? (rawData.question_text as string).split("______")
//     : null;

//   const parts = rawParts
//     ? rawParts.flatMap((part, i) =>
//         i < rawParts.length - 1 ? [part, `__GAP_${qNum}_${i}__`] : [part]
//       )
//     : content.split(/(\[\d+\])/g);

//   const isFormCompletion =
//     !!rawData &&
//     (rawData as { question_category?: string }).question_category ===
//       "FORM_COMPLETION";
//   const isFirstFormQuestion = isFormCompletion && qNum === 1;
//   const isLastFormQuestion = isFormCompletion && qNum === 10;

//   const maxWordsText =
//     validationRules?.maxWords != null
//       ? `Write NO MORE THAN ${validationRules.maxWords} WORD${
//           validationRules.maxWords !== 1 ? "S" : ""
//         } AND/OR A NUMBER for each answer.`
//       : null;

//   // Special table-like layout for Listening Part 1 form completion (questions 1–10)
//   if (isFormCompletion) {
//     const label =
//       (typeof rawData?.question_text === "string"
//         ? rawData.question_text.split("______")[0]
//         : content) || "";

//     const rowBorderClasses = isFirstFormQuestion
//       ? "border border-gray-300 rounded-t-lg"
//       : isLastFormQuestion
//         ? "border-x border-b border-gray-300 rounded-b-lg"
//         : "border-x border-b border-gray-300";

//     return (
//       <div className="space-y-0">
//         {isFirstFormQuestion && (
//           <div className="mb-3">
//             <div className="p-3">
//               <p className="text-xs font-black text-red-700 tracking-widest uppercase">
//                 SECTION 1: Questions 1-10
//               </p>
//               <p className="mt-1 text-sm font-semibold text-red-700">
//                 Complete the form below.
//               </p>
//               {maxWordsText && (
//                 <p className="mt-2 text-sm font-bold text-red-600">
//                   {maxWordsText}
//                 </p>
//               )}
//             </div>
//             <div className="px-3 pb-2 text-sm font-bold text-gray-900">
//               Registration Form
//             </div>
//           </div>
//         )}

//         <div
//           className={`grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-stretch bg-white ${rowBorderClasses}`}
//         >
//           <div className="px-4 py-2.5 flex items-center text-sm font-medium text-gray-800">
//             {label.trim()}
//           </div>
//           <div className="px-4 py-2.5 flex items-center gap-2">
//             <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-gray-900 text-white text-xs font-black">
//               {qNum}
//             </span>
//             <input
//               {...register(`gap_${qNum}`)}
//               disabled={disabled}
//               placeholder="..."
//               className="flex-1 border-b-2 border-bordercolor focus:border-primary outline-none px-3 py-1 font-medium text-gray-800 bg-gray-50 rounded-t transition-all"
//             />
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Default sentence-completion layout for other question types
//   return (
//     <div className="p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
//       <div className="flex flex-wrap items-center gap-y-4 gap-x-1 leading-relaxed text-base text-gray-800">
//         {parts.map((part, index) => {
//           const gapMatch = part.match(/^__GAP_(\d+)_(\d+)__$/);
//           const bracketMatch = part.match(/\[(\d+)\]/);
//           if (gapMatch) {
//             const num = gapMatch[1];
//             const sub = gapMatch[2];
//             const inputId = `gap_${num}_${sub}`;
//             return (
//               <div
//                 key={index}
//                 className="inline-flex items-center mx-1 group relative"
//               >
//                 <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
//                   {num}
//                 </span>
//                 <input
//                   {...register(inputId)}
//                   disabled={disabled}
//                   placeholder="..."
//                   className="border-b-2 border-bordercolor focus:border-primary outline-none px-3 py-1 w-32 font-medium text-gray-800 bg-gray-50 rounded-t transition-all"
//                 />
//               </div>
//             );
//           }
//           if (bracketMatch) {
//             const num = bracketMatch[1];
//             const inputId = `gap_${num}`;
//             return (
//               <div
//                 key={index}
//                 className="inline-flex items-center mx-1 group relative"
//               >
//                 <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
//                   {num}
//                 </span>
//                 <input
//                   {...register(inputId)}
//                   disabled={disabled}
//                   placeholder="..."
//                   className="border-b-2 border-bordercolor focus:border-primary outline-none px-3 py-1 w-32 font-medium text-gray-800 bg-gray-50 rounded-t transition-all"
//                 />
//               </div>
//             );
//           }
//           return (
//             <span key={index} className="font-medium">
//               {part}
//             </span>
//           );
//         })}
//       </div>
//       {validationRules?.maxWords && (
//         <div className="mt-4">
//           <p className="text-xs font-bold text-amber-700 uppercase tracking-wide bg-amber-50 px-3 py-1.5 rounded border border-amber-200">
//             Write NO MORE THAN {validationRules.maxWords} WORD
//             {validationRules.maxWords !== 1 ? "S" : ""}
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SentenceCompletion;

"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Question } from "../../../types/ielts";

interface SentenceCompletionProps {
  question: Question;
  disabled?: boolean;
  isReviewMode?: boolean;
  onToggleReview?: (qNum: number) => void;
  isReviewChecked?: (qNum: number) => boolean;
}

const SentenceCompletion: React.FC<SentenceCompletionProps> = ({
  question,
  disabled,
  isReviewMode,
  onToggleReview,
  isReviewChecked,
}) => {
  const { register, watch } = useFormContext();
  const { content, rawData, questionNumber } = question;

  const qNum =
    questionNumber ??
    (rawData && "question_number" in rawData
      ? (rawData as { question_number: number }).question_number
      : 0);

  const isFormCompletion =
    !!rawData &&
    (rawData as { question_category?: string }).question_category ===
      "FORM_COMPLETION";

  // Хэрэглэгчийн бичсэн хариулт болон зөв хариултыг авах (Review mode-д зориулсан)
  const userAnswer = watch(`gap_${qNum}`);
  const correctAnswer = (rawData as { correct_answer?: string })?.correct_answer;
  const isCorrect =
    userAnswer?.toLowerCase().trim() === correctAnswer?.toLowerCase().trim();

  if (isFormCompletion) {
    const label =
      (typeof rawData?.question_text === "string"
        ? rawData.question_text.split("______")[0]
        : content) || "";

    const suffix =
      typeof rawData?.question_text === "string"
        ? rawData.question_text.split("______")[1]
        : "";

    return (
      <div className="w-full font-sans">
        {/* SECTION HEADER: Зөвхөн 1-р асуулт дээр харагдана */}
        {qNum === 1 && (
          <div className="bg-white">
            <h2 className="text-[17px] font-black uppercase mb-0.5">
              SECTION 1:
            </h2>
            <h3 className="text-[#2b5a9e] font-bold text-[17px] mb-1">
              Questions 1-10
            </h3>
            <p className="italic text-gray-800 text-[14px] mb-4 font-medium">
              Complete the form below.
            </p>

            <p className="font-bold italic text-[14px] mb-4">
              Write{" "}
              <span className="text-red-700">
                NO MORE THAN TWO WORDS AND/OR A NUMBER
              </span>{" "}
              for each answer.
            </p>

            <h4 className="text-xl font-bold border-b-2 border-black pb-1 italic mb-0">
              Registration Form
            </h4>

            {/* EXAMPLE SECTION */}
            <div className="grid grid-cols-[1.2fr_2fr] border-x border-b border-black bg-gray-50 italic font-bold">
              <div className="p-2 border-r border-black">Example</div>
              <div className="p-2"></div>
            </div>
            <div className="grid grid-cols-[1.2fr_2fr] border-x border-b border-black">
              <div className="p-2 border-r border-black italic bg-white">
                Type of crime reported:
              </div>
              <div className="p-2 font-black italic bg-white pl-4">robbery</div>
            </div>
          </div>
        )}

        {/* DETAILS HEADER: Хүснэгтийн гол дахь дэд гарчиг */}
        {qNum === 9 && (
          <div className="grid grid-cols-1 border-x border-b border-black bg-white">
            <div className="p-2 font-bold italic">
              Details of lost property:
            </div>
          </div>
        )}

        {/* АСУУЛТЫН МӨР: Тасралтгүй хүснэгт */}
        <div className="grid grid-cols-[1.2fr_2fr] border-x border-b border-black hover:bg-gray-50 transition-colors">
          {/* Зүүн тал: Label */}
          <div className="p-2 border-r border-black bg-white flex items-center italic text-[15px] font-medium min-h-[42px]">
            {label.trim()}
          </div>

          {/* Баруун тал: Цэнхэр дугаар хайрцаг, Input, дараа нь Review checkbox */}
          <div className="p-2 flex items-center gap-2 bg-white relative">
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg text-sm font-black">
              {qNum}
            </span>
            <div className="relative flex-1 flex items-center gap-2">
              <input
                {...register(`gap_${qNum}`)}
                disabled={disabled}
                className={`w-full border-b border-black focus:bg-blue-50 outline-none px-1 py-0 font-medium text-gray-900 ${
                  isReviewMode
                    ? isCorrect
                      ? "text-green-700"
                      : "text-red-700"
                    : ""
                }`}
              />

              {/* REVIEW MODE: Хариултыг input-ийн ард харуулах */}
              {isReviewMode && (
                <div className="flex items-center gap-2 whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                  {isCorrect ? (
                    <span className="text-green-600 font-bold text-sm">✓</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-red-600 font-bold text-sm">✗</span>
                      <span className="bg-green-50 text-green-700 text-xs px-1.5 py-0.5 rounded border border-green-200 font-bold">
                        {correctAnswer}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {suffix && (
              <span className="italic text-[15px] text-gray-700">
                {suffix.trim()}
              </span>
            )}
            {/* Хүснэгтийн дотор, input-ийн ард Review checkbox */}
            {onToggleReview && (
              <label className="flex items-center gap-1.5 shrink-0 cursor-pointer ml-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Review
                </span>
                <input
                  type="checkbox"
                  checked={isReviewChecked?.(qNum) ?? false}
                  onChange={() => onToggleReview(qNum)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </label>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Стандарт Layout (бусад асуултуудад)
  return <div className="py-2">{/* ... стандарт код ... */}</div>;
};

export default SentenceCompletion;
