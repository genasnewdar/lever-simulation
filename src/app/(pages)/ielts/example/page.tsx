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
      <div className="h-screen flex items-center justify-center bg-paper px-6">
        <div className="w-full max-w-[480px] grid gap-8">
          <div className="flex items-center gap-3 text-ink-soft">
            <span
              aria-hidden
              className="relative inline-flex items-center justify-center h-9 w-[72px] rounded-md bg-ink text-paper font-serif font-semibold tracking-[-0.035em] text-[14px]"
            >
              Lever
              <span
                aria-hidden
                className="absolute right-0 bottom-0 h-2.5 w-2.5"
                style={{
                  background:
                    "linear-gradient(135deg, transparent 50%, var(--mint) 50%)",
                  borderBottomRightRadius: "0.375rem",
                }}
              />
            </span>
            <span className="text-[12px] uppercase tracking-[0.22em]">Mock · Demo</span>
          </div>

          <div className="space-y-3">
            <h1 className="font-serif text-[2.4rem] font-semibold text-ink leading-[1.06] tracking-[-0.022em]">
              A complete walk-through.
            </h1>
            <p className="text-[15px] text-ink-soft leading-relaxed max-w-[44ch]">
              Same conditions as the live exam — without the real one's stakes. Fullscreen will engage on start.
            </p>
          </div>

          <button
            onClick={startTest}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-ink hover:bg-ink-soft text-paper font-medium text-[14px] tracking-tight transition-all active:scale-[0.99] w-fit"
          >
            Start demo
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
            <article
              key={activePassage.id}
              className="relative space-y-10 pb-16 animate-in fade-in duration-300"
            >
              <header className="space-y-5">
                <div className="flex items-baseline gap-4 border-b border-rule pb-3">
                  <span className="font-serif text-[13px] font-medium tracking-tight text-mint-deep">
                    Passage {activePassage.passage_number}
                  </span>
                  <span className="text-[12px] uppercase tracking-[0.18em] text-muted">
                    Reading
                  </span>
                </div>
                <h2 className="font-serif text-[2.6rem] font-semibold text-ink leading-[1.08] tracking-[-0.022em]">
                  {activePassage.title}
                </h2>
              </header>
              <ReadingPassage
                ref={passageRef}
                content={activePassage.content}
                highlights={highlightsByPassageId[activePassage.id] || []}
              />
              <span aria-hidden className="page-curl" />
            </article>
          )}

          {activeTab === "WRITING" && activeWritingPrompt && (
            <article
              key={activeWritingPrompt.id}
              className="space-y-10 pb-16 animate-in fade-in duration-300"
            >
              <header className="space-y-5">
                <div className="flex items-baseline gap-4 border-b border-rule pb-3">
                  <span className="font-serif text-[13px] font-medium tracking-tight text-mint-deep">
                    Task {activeWritingPrompt.task_number}
                  </span>
                  <span className="text-[12px] uppercase tracking-[0.18em] text-muted">
                    Writing
                  </span>
                </div>
                <h2 className="font-serif text-[2.4rem] font-semibold text-ink leading-[1.08] tracking-[-0.022em]">
                  {activeWritingPrompt.title}
                </h2>
              </header>
              <div className="font-serif text-[1.0625rem] leading-[1.7] text-ink max-w-[64ch] whitespace-pre-line">
                {activeWritingPrompt.prompt}
              </div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-mint-deep">
                Suggested · {activeWritingPrompt.suggested_time} min
              </p>
            </article>
          )}
        </div>

        {/* Right Panel: Questions / Essay */}
        <div className="space-y-12 pb-24 h-full">
          {activeTab === "WRITING" ? (
            <div className="flex flex-col h-full gap-3">
              <div className="flex items-baseline justify-between border-b border-rule pb-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
                  Your essay
                </span>
                <span className="text-[12px] font-medium text-ink-soft tabular-nums">
                  {getWordCount(
                    (() => {
                      const v = watchAll[`writing_task_${writingTask}`];
                      return typeof v === "string" ? v : "";
                    })()
                  )}{" "}
                  words
                </span>
              </div>
              <textarea
                {...methods.register(`writing_task_${writingTask}`)}
                className="flex-1 w-full min-h-[460px] p-7 font-serif text-[1.0625rem] leading-[1.7] tracking-tight text-ink bg-paper border border-rule rounded-md focus:border-mint focus:ring-1 focus:ring-mint/30 outline-none resize-none transition-all"
                placeholder="Begin writing here…"
              />
            </div>
          ) : (
            <>
              <div className="space-y-2 pb-2 border-b border-rule">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                  {data.title}
                </p>
                <p className="text-[14px] text-ink-soft leading-relaxed">
                  {activeSectionInstructions || instructions}
                </p>
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
                    <div className="flex items-center justify-between border-b border-rule pb-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        Question {q.question_number}
                      </span>
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <span className="text-[10px] font-semibold text-gray-400 group-hover:text-gray-600 transition-colors uppercase tracking-widest">
                          Review
                        </span>
                        <input
                          type="checkbox"
                          checked={reviewSet.has(q.question_number)}
                          onChange={() => toggleReview(q.question_number)}
                          className="w-4 h-4 rounded border-bordercolor text-ink focus:ring-mint"
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
