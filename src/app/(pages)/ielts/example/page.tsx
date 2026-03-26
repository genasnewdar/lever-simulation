"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useForm, FormProvider } from "react-hook-form";
import QuestionFactory from "@/components/ielts/QuestionFactory";
import CDIELTSLayout from "@/components/ielts/layout/CDIELTSLayout";
import type { MapSection } from "@/components/ielts/layout/QuestionMap";
import ReadingPassage from "@/components/ielts/ReadingPassage";
import type { PassageHighlight } from "@/components/ielts/ReadingPassage";
import { MOCK_SIMULATION_DATA } from "./mock-data";
import { mapBackendToQuestion } from "@/lib/ielts-mapper";
import { getSelectionCharacterOffsets } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PageProps = {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Next.js page props; params/searchParams available when needed
export default function IELTSReplicaPage(props: PageProps) {
  const data = MOCK_SIMULATION_DATA;
  const [isStarted, setIsStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "LISTENING" | "READING" | "WRITING"
  >("READING");
  const [writingTask, setWritingTask] = useState(1);
  const [reviewSet, setReviewSet] = useState<Set<number>>(new Set());
  const [flashQuestionNumber, setFlashQuestionNumber] = useState<number | null>(
    null
  );
  const [highlightsByPassageId, setHighlightsByPassageId] = useState<
    Record<string, PassageHighlight[]>
  >({});
  const passageRef = useRef<HTMLDivElement>(null);

  const methods = useForm<Record<string, unknown>>({
    defaultValues: {},
  });

  const watchAll = methods.watch();

  const allQuestions = useMemo(() => {
    if (activeTab === "READING") {
      return data.reading_test?.passages.flatMap((p) => p.questions) || [];
    }
    if (activeTab === "LISTENING") {
      return data.listening_test?.sections.flatMap((s) => s.questions) || [];
    }
    return [];
  }, [activeTab, data]);

  const listeningSections = useMemo(
    () => data.listening_test?.sections ?? [],
    [data.listening_test?.sections]
  );
  const readingPassages = useMemo(
    () => data.reading_test?.passages ?? [],
    [data.reading_test?.passages]
  );
  const isListeningTabbed =
    activeTab === "LISTENING" && listeningSections.length >= 4;
  const isReadingTabbed =
    activeTab === "READING" && readingPassages.length >= 2;

  const sections = useMemo((): MapSection[] => {
    if (activeTab === "READING" && data.reading_test?.passages) {
      return data.reading_test.passages.map((p) => {
        const qs = p.questions;
        if (qs.length === 0) return { title: p.title, start: 1, end: 1 };
        const nums = qs.map((q) => q.question_number);
        return {
          title: p.title,
          start: Math.min(...nums),
          end: Math.max(...nums),
        };
      });
    }
    if (activeTab === "LISTENING" && data.listening_test?.sections) {
      return data.listening_test.sections.map((s) => {
        const qs = s.questions;
        if (qs.length === 0) return { title: s.title, start: 1, end: 1 };
        const nums = qs.map((q) => q.question_number);
        return {
          title: s.title,
          start: Math.min(...nums),
          end: Math.max(...nums),
        };
      });
    }
    return [];
  }, [activeTab, data]);

  const listeningPartIndex = useMemo(() => {
    if (!isListeningTabbed || listeningSections.length === 0) return 0;
    const idx = listeningSections.findIndex((s) => {
      const qs = s.questions;
      if (qs.length === 0) return false;
      const nums = qs.map((q) => q.question_number);
      const start = Math.min(...nums);
      const end = Math.max(...nums);
      return currentQIndex + 1 >= start && currentQIndex + 1 <= end;
    });
    return idx >= 0 ? idx : 0;
  }, [isListeningTabbed, listeningSections, currentQIndex]);

  const readingPartIndex = useMemo(() => {
    if (!isReadingTabbed || sections.length === 0) return 0;
    const idx = sections.findIndex(
      (s) => currentQIndex + 1 >= s.start && currentQIndex + 1 <= s.end
    );
    return idx >= 0 ? idx : 0;
  }, [isReadingTabbed, sections, currentQIndex]);

  const activePartIndex =
    activeTab === "LISTENING"
      ? listeningPartIndex
      : activeTab === "READING"
      ? readingPartIndex
      : undefined;

  const questionsToShow = useMemo(() => {
    if (activeTab === "LISTENING") {
      if (!isListeningTabbed || listeningSections.length === 0)
        return allQuestions;
      const part = listeningSections[listeningPartIndex];
      if (!part) return allQuestions;
      const qs = part.questions;
      if (qs.length === 0) return allQuestions;
      const nums = qs.map((q) => q.question_number);
      const start = Math.min(...nums);
      const end = Math.max(...nums);
      return allQuestions.filter(
        (q) => q.question_number >= start && q.question_number <= end
      );
    }
    if (activeTab === "READING") {
      if (!isReadingTabbed || sections.length === 0) return allQuestions;
      const part = sections[readingPartIndex];
      if (!part) return allQuestions;
      return allQuestions.filter(
        (q) => q.question_number >= part.start && q.question_number <= part.end
      );
    }
    return allQuestions;
  }, [
    activeTab,
    isListeningTabbed,
    isReadingTabbed,
    listeningSections,
    listeningPartIndex,
    sections,
    readingPartIndex,
    allQuestions,
  ]);

  const activePassage = useMemo(() => {
    if (activeTab === "READING" && data.reading_test?.passages?.length) {
      const passages = data.reading_test.passages;
      const idx =
        isReadingTabbed && sections.length
          ? readingPartIndex
          : passages.findIndex((p) =>
              p.questions.some((q) => q.question_number === currentQIndex + 1)
            );
      const partIdx = idx >= 0 ? idx : 0;
      return passages[partIdx] ?? passages[0];
    }
    return null;
  }, [
    activeTab,
    currentQIndex,
    data,
    isReadingTabbed,
    sections.length,
    readingPartIndex,
  ]);

  const answeredSet = useMemo(() => {
    const answered = new Set<number>();
    if (!watchAll) return answered;

    if (watchAll.questions && typeof watchAll.questions === "object") {
      Object.entries(watchAll.questions).forEach(
        ([id, qObj]: [string, unknown]) => {
          const obj = qObj as Record<string, unknown>;
          const hasAnyAnswer = Object.values(obj ?? {}).some((value) => {
            if (value === undefined || value === null) return false;
            if (typeof value === "string") return value.trim() !== "";
            if (Array.isArray(value)) return value.length > 0;
            return true;
          });
          if (hasAnyAnswer) {
            const q = allQuestions.find((item) => item.id === id);
            if (q) answered.add(q.question_number);
          }
        }
      );
    }

    Object.keys(watchAll).forEach((key) => {
      if (key === "questions" || key.startsWith("writing_task")) return;
      const value = watchAll[key];
      if (value === undefined || value === null) return;
      const isNonEmpty =
        typeof value === "string"
          ? value.trim() !== ""
          : Array.isArray(value)
          ? value.length > 0
          : false;
      if (!isNonEmpty) return;
      if (key.startsWith("gap_")) {
        const rest = key.replace("gap_", "");
        const num = parseInt(rest.split("_")[0], 10);
        if (Number.isFinite(num)) answered.add(num);
        return;
      }
      const q = allQuestions.find((item) => item.id === key);
      if (q) answered.add(q.question_number);
    });

    return answered;
  }, [watchAll, allQuestions]);

  const isWritingTaskAnswered = useCallback(
    (taskNum: number) => {
      const key = `writing_task_${taskNum}`;
      const val = watchAll[key];
      return typeof val === "string" && val.trim().length > 0;
    },
    [watchAll]
  );

  const getWordCount = (text: string = "") =>
    text.trim() ? text.trim().split(/\s+/).length : 0;

  const toggleReview = useCallback((qNum: number) => {
    setReviewSet((prev) => {
      const next = new Set(prev);
      if (next.has(qNum)) next.delete(qNum);
      else next.add(qNum);
      return next;
    });
  }, []);

  const handleQuestionClick = useCallback((idx: number) => {
    setCurrentQIndex(idx);
    const qNum = idx + 1;
    setFlashQuestionNumber(qNum);
    const el = document.getElementById(`q-${qNum}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    const t = setTimeout(() => setFlashQuestionNumber(null), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (flashQuestionNumber === null) return;
    const t = setTimeout(() => setFlashQuestionNumber(null), 600);
    return () => clearTimeout(t);
  }, [flashQuestionNumber]);

  const handleHighlightText = useCallback(
    (range: Range, color: "yellow" | "pink") => {
      const offsets = getSelectionCharacterOffsets(passageRef.current, range);
      if (!offsets || !activePassage) return;
      const [start, end] = offsets;
      setHighlightsByPassageId((prev) => ({
        ...prev,
        [activePassage.id]: [
          ...(prev[activePassage.id] || []),
          { start, end, color },
        ],
      }));
    },
    [activePassage]
  );

  const startTest = () => {
    document.documentElement
      .requestFullscreen()
      .catch((e) => console.error("Fullscreen failed:", e));
    setIsStarted(true);
  };

  const activeWritingPrompt = useMemo(
    () => data.writing_test?.tasks.find((t) => t.task_number === writingTask),
    [writingTask, data]
  );

  const activeSectionInstructions = useMemo(() => {
    if (activeTab === "LISTENING" && data.listening_test?.sections?.length) {
      const idx = isListeningTabbed ? listeningPartIndex : 0;
      const section = data.listening_test.sections[idx];
      return section?.instructions ?? data.listening_test.instructions ?? "";
    }
    if (activeTab === "READING" && data.reading_test)
      return data.reading_test.instructions ?? "";
    return "";
  }, [
    activeTab,
    data.listening_test,
    data.reading_test,
    isListeningTabbed,
    listeningPartIndex,
  ]);

  const instructions =
    activeTab === "READING"
      ? data.reading_test?.instructions
      : activeTab === "LISTENING"
      ? data.listening_test?.instructions
      : "";

  if (!isStarted) {
    return (
      <div className="h-screen flex items-center justify-center bg-primary text-white">
        <div className="max-w-md w-full bg-white rounded-3xl p-12 text-center space-y-8 shadow-2xl">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto rotate-3">
            <span className="text-white font-black text-4xl italic">L</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">
              CD IELTS Replica
            </h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
              Official Mock Environment
            </p>
            <p className="text-gray-500 font-medium pt-4 border-t">
              Please ensure you are ready to begin the official mock exam. The
              test will start in fullscreen mode.
            </p>
          </div>
          <button
            onClick={startTest}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
          >
            Start Test
          </button>
        </div>
      </div>
    );
  }

  const initialSeconds = (data.duration_minutes ?? 120) * 60;
  const layoutMode = activeTab === "LISTENING" ? "SINGLE" : "SPLIT";
  const totalQuestions = allQuestions.length || 40;

  return (
    <FormProvider {...methods}>
      <CDIELTSLayout
        title={data.title}
        totalQuestions={totalQuestions}
        userName="IELTS Candidate"
        initialSeconds={initialSeconds}
        onQuestionClick={handleQuestionClick}
        answeredQuestions={answeredSet}
        reviewQuestions={reviewSet}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        layoutMode={layoutMode}
        writingTask={writingTask}
        onWritingTaskChange={(task) => setWritingTask(task)}
        isWritingTaskAnswered={isWritingTaskAnswered}
        sections={sections}
        onHighlightText={
          activeTab === "READING" ? handleHighlightText : undefined
        }
        audioUrl={
          activeTab === "LISTENING"
            ? data.listening_test?.audio_url ??
              data.listening_test?.sections?.[0]?.audio_url ??
              null
            : null
        }
        activePartIndex={activePartIndex}
        currentQuestionIndex={currentQIndex}
        onPartChange={(partIndex) => {
          if (activeTab === "LISTENING" && listeningSections[partIndex]) {
            const part = listeningSections[partIndex];
            const qs = part.questions;
            const start = qs.length
              ? Math.min(...qs.map((q) => q.question_number))
              : 1;
            setCurrentQIndex(start - 1);
            return;
          }
          if (activeTab === "READING" && sections[partIndex]) {
            const part = sections[partIndex];
            setCurrentQIndex(part.start - 1);
          }
        }}
      >
        {/* Left Panel: Content (Reading/Writing) */}
        <div className="space-y-12">
          {activeTab === "READING" && activePassage && (
            <div
              key={activePassage.id}
              className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="space-y-6">
                <span className="text-xs font-black text-white bg-primary px-4 py-1.5 rounded-full uppercase tracking-widest">
                  Passage {activePassage.passage_number}
                </span>
                <h2 className="text-5xl font-black text-gray-900 leading-[1.1] tracking-tighter">
                  {activePassage.title}
                </h2>
              </div>
              <ReadingPassage
                ref={passageRef}
                content={activePassage.content}
                highlights={highlightsByPassageId[activePassage.id] || []}
              />
            </div>
          )}

          {activeTab === "WRITING" && activeWritingPrompt && (
            <div
              key={activeWritingPrompt.id}
              className="space-y-12 animate-in fade-in slide-in-from-left-2 duration-300"
            >
              <div className="space-y-6">
                <span className="text-xs font-black text-white bg-primary px-4 py-1.5 rounded-full uppercase tracking-widest text-center">
                  Writing Task {activeWritingPrompt.task_number}
                </span>
                <h2 className="text-4xl font-black text-gray-900 leading-[1.1] tracking-tighter">
                  {activeWritingPrompt.title}
                </h2>
              </div>
              <div className="text-lg font-medium text-gray-700 bg-white p-8 rounded-2xl border-2 border-dashed border-gray-200 shadow-inner leading-relaxed">
                {activeWritingPrompt.prompt}
              </div>
              <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded text-blue-700 font-bold uppercase text-xs tracking-widest">
                Suggested Time: {activeWritingPrompt.suggested_time} Minutes
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Questions / Essay */}
        <div className="space-y-12 pb-24 h-full">
          {activeTab === "WRITING" ? (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Your Essay
                </span>
                <div className="bg-primary text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Word Count:{" "}
                  {getWordCount(
                    (() => {
                      const v = watchAll[`writing_task_${writingTask}`];
                      return typeof v === "string" ? v : "";
                    })()
                  )}
                </div>
              </div>
              <textarea
                {...methods.register(`writing_task_${writingTask}`)}
                className="flex-1 w-full min-h-[400px] p-8 text-lg font-medium bg-foreground border-2 border-bordercolor rounded-2xl focus:border-primary focus:bg-white transition-all shadow-inner outline-none resize-none"
                placeholder="Type your response here..."
              />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="bg-primary text-white px-6 py-3 rounded-t-xl">
                  <h2 className="text-base font-black uppercase tracking-tight">
                    {data.title}
                  </h2>
                </div>
                <div className="bg-background p-6 border-l-[6px] border-primary rounded-b-xl rounded-r-xl shadow-sm">
                  <p className="text-sm font-bold text-gray-700 leading-relaxed">
                    {activeSectionInstructions || instructions}
                  </p>
                </div>
              </div>

              <div className="space-y-20">
                {questionsToShow.map((q) => (
                  <div
                    key={q.id}
                    id={`q-${q.question_number}`}
                    className={cn(
                      "scroll-mt-24 space-y-4 transition-colors",
                      flashQuestionNumber === q.question_number &&
                        "ielts-question-flash rounded-xl"
                    )}
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Question {q.question_number}
                      </span>
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors uppercase tracking-widest">
                          Review
                        </span>
                        <input
                          type="checkbox"
                          checked={reviewSet.has(q.question_number)}
                          onChange={() => toggleReview(q.question_number)}
                          className="w-4 h-4 rounded border-bordercolor text-primary focus:ring-primary"
                        />
                      </label>
                    </div>
                    <QuestionFactory question={mapBackendToQuestion(q)} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CDIELTSLayout>
    </FormProvider>
  );
}
