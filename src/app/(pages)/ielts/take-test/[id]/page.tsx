"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  use,
} from "react";
import { useForm, FormProvider } from "react-hook-form";
import CDIELTSLayout from "@/components/ielts/layout/CDIELTSLayout";
import type { MapSection } from "@/components/ielts/layout/QuestionMap";
import ReadingPassage from "@/components/ielts/ReadingPassage";
import type { PassageHighlight } from "@/components/ielts/ReadingPassage";
import GroupDispatcher from "@/components/ielts/groups/GroupDispatcher";
import { getSelectionCharacterOffsets } from "@/lib/utils";
import { api } from "@/lib";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useMockExamStore } from "@/lib/stores/mock-exam-store";
import { useExamCodeStore } from "@/lib/stores/exam-code-store";
import {
  useExamStore,
  formValuesToAnswers,
  answersToFormValues,
  saveSectionToStorage,
  loadAllSectionsFromStorage,
  splitAnswersBySection,
} from "@/lib/stores/exam-store";

import type {
  BackendQuestion,
  BackendQuestionGroup,
  ContentResponseMeta,
  SectionContent,
  ContentResponse,
} from "@/types/ielts-simulation";
import { normalizeContentResponse } from "@/lib/ielts-test-normalizer";

const DEBUG =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_IELTS_DEBUG === "true";
function debugLog(tag: string, payload?: Record<string, unknown>) {
  if (DEBUG) console.log(`[IELTS ${tag}]`, payload ?? "");
}

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// ─── Debounce hook ──────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ─── Helper: fetch content from student endpoint ───────────────────────────
async function fetchSectionContent(
  attemptId: string,
  section?: string,
): Promise<ContentResponse> {
  const url = section
    ? `/api/student/ielts/test/${attemptId}/content?section=${section}`
    : `/api/student/ielts/test/${attemptId}/content`;
  const res = await api.get(url);
  return normalizeContentResponse(res.data as ContentResponse);
}

// ─── Main Page Component ─────────────────────────────────────────────────────
export default function IeltsTakeTestPage(props: PageProps) {
  const params = use(props.params);
  const router = useRouter();
  const resetMockExamStore = useMockExamStore((s) => s.reset);
  const clearExamCode = useExamCodeStore((s) => s.clear);

  // ── Core state ──────────────────────────────────────────────────────────────
  const [contentMeta, setContentMeta] = useState<ContentResponseMeta | null>(null);
  const [sectionContent, setSectionContent] = useState<SectionContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [sectionTimerSeconds, setSectionTimerSeconds] = useState<number>(0);

  // ── Exam UI state ───────────────────────────────────────────────────────────
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "LISTENING" | "READING" | "WRITING"
  >("LISTENING");
  const [writingTask, setWritingTask] = useState(1);
  const [reviewSet, setReviewSet] = useState<Set<number>>(new Set());
  const [flashQuestionNumber, setFlashQuestionNumber] = useState<number | null>(
    null,
  );
  const [highlightsByPassageId, setHighlightsByPassageId] = useState<
    Record<string, PassageHighlight[]>
  >({});
  const passageRef = useRef<HTMLDivElement>(null);
  const timeExpireCalledRef = useRef(false);
  const contentLoadFailCount = useRef(0);

  // ── Form ────────────────────────────────────────────────────────────────────
  const methods = useForm<Record<string, unknown>>({ defaultValues: {} });
  const watchAll = methods.watch();
  const debouncedWatchAll = useDebounce(watchAll, 1500);
  const prevSubmittedRef = useRef<string>("");

  const sectionStorageKey = `ielts-current-section-${params.id}`;
  const writingTaskStorageKey = `lever-exam-${params.id}-writing-active-task`;
  const currentQIndexStorageKey = `ielts-current-q-${params.id}`;

  const setCurrentExamId = useExamStore((s) => s.setCurrentExamId);
  const setAnswersInStore = useExamStore((s) => s.setAnswers);
  const getAnswersFromStore = useExamStore((s) => s.getAnswers);
  const setHighlightsInStore = useExamStore((s) => s.setHighlights);
  const getHighlightsFromStore = useExamStore((s) => s.getHighlights);
  const clearHighlightsInStore = useExamStore((s) => s.clearHighlights);
  const clearAnswersInStore = useExamStore((s) => s.clearAnswers);
  const hasHydrated = useExamStore((s) => s._hasHydrated);

  const examId = params.id != null ? String(params.id) : "";

  // ── Section mappers for localStorage split ────────────────────────────────
  const sectionMappers = useMemo(() => {
    const idToSectionMap = new Map<string, string>();
    if (sectionContent?.type === "listening") {
      sectionContent.sections.forEach((sec, idx) => {
        sec.questions?.forEach((q) => {
          idToSectionMap.set(q.id, `listening-section${idx + 1}`);
        });
      });
    }
    if (sectionContent?.type === "reading") {
      sectionContent.passages.forEach((p, idx) => {
        p.questions?.forEach((q) => {
          idToSectionMap.set(q.id, `reading-section${idx + 1}`);
        });
      });
    }
    const idToSection = (id: string) => idToSectionMap.get(id) ?? null;
    const gapNumToSection = (n: number) => {
      if (n <= 10) return "listening-section1";
      if (n <= 20) return "listening-section2";
      if (n <= 30) return "listening-section3";
      return "listening-section4";
    };
    return { idToSection, gapNumToSection };
  }, [sectionContent]);

  // ── Set current exam id for Zustand exam store ─
  useEffect(() => {
    if (examId) setCurrentExamId(examId);
    return () => setCurrentExamId(null);
  }, [examId, setCurrentExamId]);

  // ── 1) Fetch content directly using attempt_id — no my-sessions polling needed ─
  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | null = null;

    const loadContent = async () => {
      try {
        // Try fetching with section=listening first (OFFLINE always starts with listening).
        // If the student is on a different section (refresh mid-exam), the backend
        // returns current_section in the response so we can re-fetch the right one.
        const savedSection = typeof window !== "undefined"
          ? sessionStorage.getItem(sectionStorageKey)?.toLowerCase()
          : null;
        const guessSection = savedSection || "listening";

        let response = await fetchSectionContent(params.id, guessSection);

        if (cancelled) return;

        if (response.current_section === "completed") {
          setIsFinished(true);
          setIsLoading(false);
          setContentMeta(response);
          return;
        }

        // If our guess was wrong (backend says we should be on a different section),
        // fetch the correct section
        if (response.current_section !== guessSection || !response.content) {
          response = await fetchSectionContent(params.id, response.current_section);
          if (cancelled) return;
        }

        const section = response.current_section;
        const tab = section.toUpperCase() as "LISTENING" | "READING" | "WRITING";

        setContentMeta(response);
        setSectionContent(response.content ?? null);
        setSectionTimerSeconds(response.section_time_remaining_seconds);
        setActiveTab(tab);
        setIsStarted(true);
        setIsLoading(false);
        contentLoadFailCount.current = 0;

        // Stop polling once content loaded
        if (pollId) {
          clearInterval(pollId);
          pollId = null;
        }

        debugLog("Content loaded", {
          section,
          timeRemaining: response.section_time_remaining_seconds,
        });
      } catch (err: unknown) {
        if (cancelled) return;
        contentLoadFailCount.current += 1;

        // If exam not started yet or attempt not found, keep polling
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 400 || status === 404) {
          debugLog("Exam not ready yet, polling...", { failCount: contentLoadFailCount.current });
          // After many failures, redirect
          if (contentLoadFailCount.current >= 60) {
            router.push("/ielts/mock-exam");
          }
          return; // interval will retry
        }

        // Actual error
        console.error("Failed to fetch content:", err);
        setError("Failed to load exam data. Please try again or contact support.");
        setIsLoading(false);
      }
    };

    loadContent();
    // Poll every 1s until content loads (handles waiting for admin to start)
    pollId = setInterval(loadContent, 1000);

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
    };
  }, [params.id, retryKey, router]);

  // ── 2) Periodic timer sync (every 30s) to keep timer accurate ─
  useEffect(() => {
    if (!isStarted || isFinished || !params.id) return;
    const interval = setInterval(async () => {
      try {
        const overview = await fetchSectionContent(params.id);
        if (overview.current_section === "completed") {
          setIsFinished(true);
          return;
        }
        // Only sync timer if still on same section
        const currentTab = overview.current_section.toUpperCase();
        if (currentTab === activeTab) {
          setSectionTimerSeconds(overview.section_time_remaining_seconds);
        } else {
          // Backend says we should be on a different section — reload
          const section = overview.current_section;
          const response = await fetchSectionContent(params.id, section);
          setContentMeta(response);
          setSectionContent(response.content ?? null);
          setSectionTimerSeconds(response.section_time_remaining_seconds);
          setActiveTab(section.toUpperCase() as "LISTENING" | "READING" | "WRITING");
          setCurrentQIndex(0);
          timeExpireCalledRef.current = false;
        }
      } catch { /* ignore sync failures */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [isStarted, isFinished, params.id, activeTab]);

  // ── Persist current section + question index ─
  useEffect(() => {
    if (!params.id || typeof window === "undefined" || !isStarted) return;
    sessionStorage.setItem(sectionStorageKey, activeTab);
    sessionStorage.setItem(currentQIndexStorageKey, String(currentQIndex));
  }, [activeTab, currentQIndex, params.id, sectionStorageKey, currentQIndexStorageKey, isStarted]);

  // ── Restore answers from localStorage ─
  const [answersRestored, setAnswersRestored] = useState(false);
  const restoredForExamRef = useRef<string | null>(null);

  useEffect(() => {
    setAnswersRestored(false);
    restoredForExamRef.current = null;
  }, [examId]);

  useEffect(() => {
    if (!sectionContent || !examId) return;
    if (typeof window === "undefined") return;
    if (restoredForExamRef.current === examId) return;
    restoredForExamRef.current = examId;

    let stored = loadAllSectionsFromStorage(examId);
    if (Object.keys(stored).length === 0 && hasHydrated) stored = getAnswersFromStore(examId);
    const storedHighlights = getHighlightsFromStore(examId);

    requestAnimationFrame(() => {
      if (Object.keys(stored).length > 0) {
        const formValues = answersToFormValues(stored);
        methods.reset(formValues);
        Object.entries(stored).forEach(([key, value]) => {
          methods.setValue(key, value, { shouldDirty: false });
        });
      }

      // Also restore from server-side saved answers
      if (sectionContent.type === "listening") {
        for (const sec of sectionContent.sections) {
          for (const q of sec.questions) {
            const sa = q.saved_answer;
            if (sa?.text_answer && !stored[`questions.${q.id}.answer`]) {
              methods.setValue(`questions.${q.id}.answer` as string & keyof Record<string, unknown>, sa.text_answer, { shouldDirty: false });
            }
          }
        }
      } else if (sectionContent.type === "reading") {
        for (const p of sectionContent.passages) {
          for (const q of p.questions) {
            const sa = q.saved_answer;
            if (sa?.text_answer && !stored[`questions.${q.id}.answer`]) {
              methods.setValue(`questions.${q.id}.answer` as string & keyof Record<string, unknown>, sa.text_answer, { shouldDirty: false });
            }
          }
        }
      } else if (sectionContent.type === "writing") {
        for (const task of sectionContent.tasks) {
          const key = `writing_task_${task.task_number}`;
          if (task.saved_answer?.content && !stored[key]) {
            methods.setValue(key, task.saved_answer.content, { shouldDirty: false });
          }
        }
      }

      if (Object.keys(storedHighlights).length > 0) {
        setHighlightsByPassageId(storedHighlights as Record<string, PassageHighlight[]>);
      }
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(writingTaskStorageKey);
        const task = saved === "2" ? 2 : 1;
        setWritingTask(task);
      }
      setAnswersRestored(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionContent, examId, hasHydrated, getAnswersFromStore, getHighlightsFromStore, writingTaskStorageKey]);

  // ── Save answers to localStorage on change ─
  useEffect(() => {
    if (!examId || !answersRestored || !sectionContent) return;
    setCurrentExamId(examId);
    const flat = formValuesToAnswers(watchAll as Record<string, unknown>);
    if (Object.keys(flat).length === 0) return;
    setAnswersInStore(flat);
    const bySection = splitAnswersBySection(
      flat,
      sectionMappers.idToSection,
      sectionMappers.gapNumToSection,
    );
    Object.entries(bySection).forEach(([sectionKey, answers]) => {
      if (Object.keys(answers).length > 0) {
        saveSectionToStorage(examId, sectionKey, answers);
      }
    });
  }, [watchAll, examId, answersRestored, sectionContent, sectionMappers, setCurrentExamId, setAnswersInStore]);

  // ── Derived data ────────────────────────────────────────────────────────────
  const allQuestions = useMemo((): BackendQuestion[] => {
    if (!sectionContent) return [];
    if (sectionContent.type === "reading") {
      return sectionContent.passages.flatMap((p) => p.questions) || [];
    }
    if (sectionContent.type === "listening") {
      return sectionContent.sections.flatMap((s) => s.questions) || [];
    }
    return [];
  }, [sectionContent]);

  const listeningSections = useMemo(
    () => (sectionContent?.type === "listening" ? sectionContent.sections : []),
    [sectionContent],
  );
  const listeningQuestionCount = useMemo(
    () => listeningSections.flatMap((s) => s.questions).length,
    [listeningSections],
  );
  const readingPassages = useMemo(
    () => (sectionContent?.type === "reading" ? sectionContent.passages : []),
    [sectionContent],
  );
  const isListeningTabbed =
    activeTab === "LISTENING" &&
    (listeningSections.length >= 4 || listeningQuestionCount === 40);
  const isReadingTabbed =
    activeTab === "READING" && readingPassages.length >= 2;

  const sections = useMemo((): MapSection[] => {
    if (!sectionContent) return [];
    if (activeTab === "READING" && sectionContent.type === "reading") {
      return sectionContent.passages.map((p) => {
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
    if (activeTab === "LISTENING" && sectionContent.type === "listening") {
      const listSections = sectionContent.sections;
      const fromData = listSections.map((s) => {
        const qs = s.questions;
        if (qs.length === 0) return { title: s.title ?? "", start: 1, end: 1 };
        const nums = qs.map((q) => q.question_number);
        return {
          title: s.title ?? "",
          start: Math.min(...nums),
          end: Math.max(...nums),
        };
      });
      if (listSections.length === 4) {
        const needFourParts =
          listeningQuestionCount === 40 ||
          fromData.some((p, i) => i === 3 && p.end - p.start + 1 < 10);
        if (needFourParts) {
          return [
            fromData[0]?.end >= fromData[0]?.start
              ? fromData[0]
              : { title: "Section 1", start: 1, end: 10 },
            fromData[1]?.end >= fromData[1]?.start
              ? fromData[1]
              : { title: "Section 2", start: 11, end: 20 },
            fromData[2]?.end >= fromData[2]?.start
              ? fromData[2]
              : { title: "Section 3", start: 21, end: 30 },
            fromData[3]?.end >= fromData[3]?.start &&
            fromData[3].end - fromData[3].start + 1 >= 10
              ? fromData[3]
              : {
                  title: fromData[3]?.title || "Section 4",
                  start: 31,
                  end: 40,
                },
          ];
        }
      }
      if (listeningQuestionCount === 40 && fromData.length < 4) {
        return [
          { title: "Section 1", start: 1, end: 10 },
          { title: "Section 2", start: 11, end: 20 },
          { title: "Section 3", start: 21, end: 30 },
          { title: "Section 4", start: 31, end: 40 },
        ];
      }
      return fromData;
    }
    return [];
  }, [activeTab, sectionContent, listeningQuestionCount]);

  const listeningPartIndex = useMemo(() => {
    if (!isListeningTabbed) return 0;
    const fromData = listeningSections.map((s) => {
      const qs = s.questions;
      if (qs.length === 0) return { start: 1, end: 1 };
      const nums = qs.map((q) => q.question_number);
      return { start: Math.min(...nums), end: Math.max(...nums) };
    });
    const displayParts =
      listeningSections.length === 4
        ? [
            fromData[0]?.end >= fromData[0]?.start
              ? fromData[0]
              : { start: 1, end: 10 },
            fromData[1]?.end >= fromData[1]?.start
              ? fromData[1]
              : { start: 11, end: 20 },
            fromData[2]?.end >= fromData[2]?.start
              ? fromData[2]
              : { start: 21, end: 30 },
            fromData[3]?.end - fromData[3]?.start + 1 >= 10
              ? fromData[3]!
              : { start: 31, end: 40 },
          ]
        : listeningQuestionCount === 40 && listeningSections.length < 4
          ? [
              { start: 1, end: 10 },
              { start: 11, end: 20 },
              { start: 21, end: 30 },
              { start: 31, end: 40 },
            ]
          : fromData;
    const idx = displayParts.findIndex(
      (p) => currentQIndex + 1 >= p.start && currentQIndex + 1 <= p.end,
    );
    return idx >= 0 ? idx : 0;
  }, [isListeningTabbed, listeningSections, listeningQuestionCount, currentQIndex]);

  const readingPartIndex = useMemo(() => {
    if (!isReadingTabbed || sections.length === 0) return 0;
    const idx = sections.findIndex(
      (s) => currentQIndex + 1 >= s.start && currentQIndex + 1 <= s.end,
    );
    return idx >= 0 ? idx : 0;
  }, [isReadingTabbed, sections, currentQIndex]);

  const activePartIndex =
    activeTab === "LISTENING"
      ? listeningPartIndex
      : activeTab === "READING"
        ? readingPartIndex
        : undefined;

  /** Question groups for the currently active section/passage */
  const groupsToShow = useMemo((): BackendQuestionGroup[] => {
    if (activeTab === "LISTENING" && sectionContent?.type === "listening") {
      const sec = sectionContent.sections[listeningPartIndex];
      if (sec?.question_groups?.length) return sec.question_groups;
      if (sec?.questions?.length) {
        return [{
          id: `synth-${sec.id}`,
          layout_type: "NONE",
          title: null,
          instructions: sec.instructions || null,
          word_limit: null,
          word_limit_text: null,
          number_allowed: true,
          layout_data: null,
          image_url: null,
          image_alt_text: null,
          options_pool: null,
          questions: sec.questions,
        }];
      }
      return [];
    }
    if (activeTab === "READING" && sectionContent?.type === "reading") {
      const passage = sectionContent.passages[readingPartIndex];
      if (passage?.question_groups?.length) return passage.question_groups;
      if (passage?.questions?.length) {
        return [{
          id: `synth-${passage.id}`,
          layout_type: "NONE",
          title: null,
          instructions: null,
          word_limit: null,
          word_limit_text: null,
          number_allowed: true,
          layout_data: null,
          image_url: null,
          image_alt_text: null,
          options_pool: null,
          questions: passage.questions,
        }];
      }
      return [];
    }
    return [];
  }, [activeTab, sectionContent, listeningPartIndex, readingPartIndex]);

  const activePassage = useMemo(() => {
    if (activeTab === "READING" && sectionContent?.type === "reading" && sectionContent.passages.length) {
      const passages = sectionContent.passages;
      const idx =
        isReadingTabbed && sections.length
          ? readingPartIndex
          : passages.findIndex((p) =>
              p.questions.some((q) => q.question_number === currentQIndex + 1),
            );
      const partIdx = idx >= 0 ? idx : 0;
      return passages[partIdx] ?? passages[0];
    }
    return null;
  }, [activeTab, currentQIndex, sectionContent, isReadingTabbed, sections.length, readingPartIndex]);

  const answeredSet = useMemo(() => {
    const answered = new Set<number>();
    if (!watchAll || !sectionContent) return answered;

    if (watchAll.questions && typeof watchAll.questions === "object") {
      Object.entries(watchAll.questions as Record<string, unknown>).forEach(
        ([id, qObj]) => {
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
        },
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
  }, [watchAll, allQuestions, sectionContent]);

  /** Map question number → answer string for the Review modal */
  const reviewAnswers = useMemo(() => {
    const map: Record<number, string> = {};
    if (!watchAll || !sectionContent) return map;

    if (watchAll.questions && typeof watchAll.questions === "object") {
      Object.entries(watchAll.questions as Record<string, unknown>).forEach(
        ([id, qObj]) => {
          const obj = qObj as Record<string, unknown>;
          const answer = obj?.answer;
          if (answer === undefined || answer === null) return;
          const str = Array.isArray(answer) ? answer.join(", ") : String(answer);
          if (str.trim() === "") return;
          const q = allQuestions.find((item) => item.id === id);
          if (q) map[q.question_number] = str;
        },
      );
    }

    Object.keys(watchAll).forEach((key) => {
      if (key === "questions" || key.startsWith("writing_task")) return;
      const value = watchAll[key];
      if (value === undefined || value === null) return;
      const str = typeof value === "string" ? value : Array.isArray(value) ? value.join(", ") : String(value);
      if (str.trim() === "") return;
      if (key.startsWith("gap_")) {
        const rest = key.replace("gap_", "");
        const num = parseInt(rest.split("_")[0], 10);
        if (Number.isFinite(num)) map[num] = str;
        return;
      }
      const q = allQuestions.find((item) => item.id === key);
      if (q) map[q.question_number] = str;
    });

    return map;
  }, [watchAll, allQuestions, sectionContent]);

  const isWritingTaskAnswered = useCallback(
    (taskNum: number) => {
      const key = `writing_task_${taskNum}`;
      const val = watchAll[key];
      return typeof val === "string" && val.trim().length > 0;
    },
    [watchAll],
  );

  const getWordCount = (text: string = "") =>
    text.trim() ? text.trim().split(/\s+/).length : 0;

  const activeWritingPrompt = useMemo(
    () =>
      sectionContent?.type === "writing"
        ? sectionContent.tasks.find((t) => t.task_number === writingTask)
        : null,
    [writingTask, sectionContent],
  );

  const timerInitialSeconds = sectionTimerSeconds;
  const layoutMode = activeTab === "LISTENING" ? "SINGLE" : "SPLIT";
  const totalQuestions = allQuestions.length || 40;

  // ── Callbacks ───────────────────────────────────────────────────────────────
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
  }, []);

  useEffect(() => {
    if (flashQuestionNumber === null) return;
    const t = setTimeout(() => setFlashQuestionNumber(null), 600);
    return () => clearTimeout(t);
  }, [flashQuestionNumber]);

  const handleHighlightText = useCallback(
    (range: Range, color: "yellow" | "pink") => {
      const offsets = getSelectionCharacterOffsets(passageRef.current, range);
      if (!offsets || !activePassage || !examId) return;
      const [start, end] = offsets;
      setHighlightsByPassageId((prev) => {
        const nextList = [
          ...(prev[activePassage!.id] || []),
          { start, end, color },
        ];
        const next = { ...prev, [activePassage!.id]: nextList };
        setHighlightsInStore(examId, activePassage.id, nextList);
        return next;
      });
    },
    [activePassage, examId, setHighlightsInStore],
  );

  // ── Helper: submit current answers ─────────────────────────────────────────
  const submitCurrentAnswers = useCallback(async () => {
    const formValues = methods.getValues() as Record<string, unknown>;
    const attemptId = params.id;

    if (activeTab === "WRITING" && sectionContent?.type === "writing") {
      for (const task of sectionContent.tasks) {
        const key = `writing_task_${task.task_number}`;
        const content = formValues[key];
        if (typeof content === "string" && content.trim().length > 0) {
          const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
          await api.post("/api/student/ielts/test/writing/submit", {
            attempt_id: attemptId, task_id: task.id, content, word_count: wordCount,
          }).catch(() => {});
        }
      }
    } else {
      const endpoint = activeTab === "LISTENING"
        ? "/api/student/ielts/test/listening/batch"
        : "/api/student/ielts/test/reading/batch";
      const questionsObj = (formValues.questions ?? {}) as Record<string, Record<string, unknown>>;
      const sectionQIds = new Set(allQuestions.map((q) => q.id));
      const responses: Array<Record<string, unknown>> = [];
      Object.entries(questionsObj).forEach(([qId, val]) => {
        if (!sectionQIds.has(qId)) return;
        const answer = typeof val === "object" && val !== null
          ? (val as Record<string, unknown>).answer : val;
        if (answer === undefined || answer === null || answer === "") return;
        responses.push({ attempt_id: attemptId, question_id: qId, text_answer: String(answer) });
      });
      if (responses.length > 0) {
        await api.post(endpoint, { attempt_id: attemptId, responses }).catch(() => {});
      }
    }
  }, [activeTab, sectionContent, allQuestions, methods, params.id]);

  // ── Helper: transition to next section after finish ────────────────────────
  const transitionToNextSection = useCallback(async () => {
    try {
      const overview = await fetchSectionContent(params.id);

      if (overview.current_section === "completed") {
        toast.success("Шалгалт дууслаа!");
        setIsFinished(true);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(sectionStorageKey);
          sessionStorage.removeItem(currentQIndexStorageKey);
        }
        return;
      }

      const section = overview.current_section;
      const response = await fetchSectionContent(params.id, section);

      setContentMeta(response);
      setSectionContent(response.content ?? null);
      setSectionTimerSeconds(response.section_time_remaining_seconds);
      setActiveTab(section.toUpperCase() as "LISTENING" | "READING" | "WRITING");
      setCurrentQIndex(0);
      timeExpireCalledRef.current = false;

      if (typeof window !== "undefined") {
        sessionStorage.setItem(sectionStorageKey, section.toUpperCase());
      }

      debugLog("Transitioned to section", { section });
    } catch {
      // Fallback: hardcoded transitions
      if (activeTab === "LISTENING") {
        setActiveTab("READING");
      } else if (activeTab === "READING") {
        setActiveTab("WRITING");
      } else {
        setIsFinished(true);
      }
      setCurrentQIndex(0);
      timeExpireCalledRef.current = false;
    }
  }, [params.id, activeTab, sectionStorageKey, currentQIndexStorageKey]);

  // ── Auto-submit answers on change (debounced) ──────────────────────────────
  useEffect(() => {
    if (!sectionContent || !isStarted || isFinished) return;

    const currentSnapshot = JSON.stringify(debouncedWatchAll);
    if (currentSnapshot === prevSubmittedRef.current) return;
    prevSubmittedRef.current = currentSnapshot;

    const attemptId = params.id;

    const submitAnswers = async () => {
      try {
        const formValues = debouncedWatchAll as Record<string, unknown>;

        if (activeTab === "WRITING" && sectionContent.type === "writing") {
          for (const task of sectionContent.tasks) {
            const key = `writing_task_${task.task_number}`;
            const content = formValues[key];
            if (typeof content === "string" && content.trim().length > 0) {
              const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
              debugLog("writing-submit", { task_id: task.id, word_count: wordCount });
              await api.post("/api/student/ielts/test/writing/submit", {
                attempt_id: attemptId,
                task_id: task.id,
                content: content,
                word_count: wordCount,
              });
            }
          }
        } else {
          const endpoint = activeTab === "LISTENING"
            ? "/api/student/ielts/test/listening/batch"
            : "/api/student/ielts/test/reading/batch";

          const questionsObj = (formValues.questions ?? {}) as Record<string, Record<string, unknown>>;
          const sectionQuestionIds = new Set(allQuestions.map((q) => q.id));
          const responses: Array<Record<string, unknown>> = [];

          Object.entries(questionsObj).forEach(([qId, val]) => {
            if (!sectionQuestionIds.has(qId)) return;
            const answer = typeof val === "object" && val !== null
              ? (val as Record<string, unknown>).answer
              : val;
            if (answer === undefined || answer === null || answer === "") return;
            const textAnswer = typeof answer === "string" ? answer : String(answer);
            responses.push({
              attempt_id: attemptId,
              question_id: qId,
              text_answer: textAnswer,
            });
          });

          if (responses.length > 0) {
            debugLog("batch-submit", { section: activeTab, count: responses.length });
            await api.post(endpoint, {
              attempt_id: attemptId,
              responses,
            });
          }
        }
      } catch (e) {
        console.error("Auto-submit failed:", e);
      }
    };

    submitAnswers();
    if (answersRestored && examId) {
      const flat = formValuesToAnswers(
        debouncedWatchAll as Record<string, unknown>,
      );
      if (Object.keys(flat).length > 0) setAnswersInStore(flat);
    }
  }, [
    debouncedWatchAll,
    activeTab,
    sectionContent,
    isStarted,
    isFinished,
    allQuestions,
    answersRestored,
    examId,
    params.id,
    setAnswersInStore,
  ]);

  // ── Anti-cheat: fullscreen + tab switch warnings ───────────────────────────
  useEffect(() => {
    if (!isStarted || isFinished) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        toast.warning(
          "Анхааруулга: Бүтэн дэлгэцээс гарах нь шалгалтын дүрэм зөрчилд тооцогдоно!",
          { position: "top-center", autoClose: 5000 },
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.warning("Анхааруулга: Шалгалтын үеэр таб солих хориотой!", {
          position: "top-center",
          autoClose: 10000,
        });
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isStarted, isFinished]);

  // ── Reset timeExpireCalledRef when activeTab changes ────────────────────────
  useEffect(() => {
    timeExpireCalledRef.current = false;
  }, [activeTab]);

  // ── Section timer expiry ───────────────────────────────────────────────────
  const handleTimeExpire = useCallback(async () => {
    if (timeExpireCalledRef.current) return;
    timeExpireCalledRef.current = true;

    const sectionName =
      activeTab === "LISTENING" ? "listening" : activeTab === "READING" ? "reading" : "writing";

    // Submit current answers before section ends
    try {
      await submitCurrentAnswers();
    } catch { /* best-effort */ }

    // Notify backend
    fetch("/api/ielts/finish-section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attempt_id: params.id, section: sectionName }),
    }).catch(() => {});

    const label =
      activeTab === "LISTENING" ? "Listening" : activeTab === "READING" ? "Reading" : "Writing";
    if (activeTab === "WRITING") {
      toast.success("Шалгалт дууслаа!");
      setIsFinished(true);
    } else {
      toast.info(`${label} дууслаа. Дараагийн хэсэг рүү шилжиж байна.`);
      await transitionToNextSection();
    }
  }, [activeTab, submitCurrentAnswers, transitionToNextSection, params.id]);


  // ── Render: Loading ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-gray-500 font-medium">Loading exam data...</p>
        </div>
      </div>
    );
  }

  // ── Render: Error ───────────────────────────────────────────────────────────
  if (!isLoading && (error || !sectionContent)) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="max-w-md text-center space-y-6 p-6">
          <h1 className="text-2xl font-bold text-red-600">Алдаа</h1>
          <p className="text-gray-600">{error || "Test not found"}</p>
          <p className="text-sm text-gray-500">
            Хэдхэн секундын дараа дахин оролдоно уу, эсвэл доорх товч дарна уу.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                setRetryKey((k) => k + 1);
              }}
              className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Дахин оролдох
            </button>
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 bg-gray-200 rounded-xl text-gray-800 font-semibold hover:bg-gray-300 transition-colors"
            >
              Буцах
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Exam Finished ───────────────────────────────────────────────────
  if (isFinished) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10">
        <div className="max-w-lg w-full bg-white rounded-3xl p-12 text-center space-y-8 shadow-2xl border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
              Шалгалт дууссан
            </h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
              {contentMeta?.test_title ?? ""}
            </p>
            <p className="text-gray-500 font-medium pt-4 border-t">
              Таны шалгалт амжилттай илгээгдлээ.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              resetMockExamStore();
              clearHighlightsInStore(examId);
              clearAnswersInStore(examId);
              // Don't clear exam code — results page needs it for API auth
              router.push(`/ielts/results/${params.id}`);
            }}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
          >
            Үр дүн харах
          </button>
          <button
            type="button"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              resetMockExamStore();
              clearHighlightsInStore(examId);
              clearAnswersInStore(examId);
              clearExamCode();
              router.push("/ielts");
            }}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-base hover:bg-gray-200 transition-all"
          >
            Нүүр хуудас руу буцах
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Main Exam UI ───────────────────────────────────────────────────
  if (!sectionContent) return null;
  return (
    <FormProvider {...methods}>
      <CDIELTSLayout
        title={contentMeta?.test_title ?? ""}
        totalQuestions={totalQuestions}
        userName="IELTS Candidate"
        initialSeconds={timerInitialSeconds}
        onTimeExpire={handleTimeExpire}
        onQuestionClick={handleQuestionClick}
        answeredQuestions={answeredSet}
        reviewQuestions={reviewSet}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        hideSectionTabs
        examMode
        layoutMode={layoutMode}
        writingTask={writingTask}
        onWritingTaskChange={(task) => {
          setWritingTask(task);
          if (examId && typeof window !== "undefined") {
            try {
              localStorage.setItem(writingTaskStorageKey, String(task));
            } catch {
              // ignore
            }
          }
        }}
        isWritingTaskAnswered={isWritingTaskAnswered}
        sections={sections}
        onHighlightText={
          activeTab === "READING" ? handleHighlightText : undefined
        }
        audioUrl={
          activeTab === "LISTENING" && sectionContent.type === "listening"
            ? (sectionContent.audio_url ??
              sectionContent.sections?.[0]?.audio_url ??
              null)
            : null
        }
        activePartIndex={activePartIndex}
        currentQuestionIndex={currentQIndex}
        onPartChange={(partIndex) => {
          if (sections[partIndex]) {
            setCurrentQIndex(sections[partIndex].start - 1);
          }
        }}
        reviewAnswers={reviewAnswers}
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
              <div className="text-lg font-medium text-gray-700 bg-white p-8 rounded-2xl border-2 border-dashed border-gray-200 shadow-inner leading-relaxed whitespace-pre-line">
                {activeWritingPrompt.prompt}
              </div>
              {activeWritingPrompt.visual_content && (
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                  <img
                    src={activeWritingPrompt.visual_content}
                    alt={`Visual content for ${activeWritingPrompt.title}`}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}
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
                    })(),
                  )}
                </div>
              </div>
              <textarea
                key={`writing_task_${writingTask}`}
                {...methods.register(`writing_task_${writingTask}`)}
                className="flex-1 w-full min-h-[400px] p-8 text-lg font-medium bg-foreground border-2 border-bordercolor rounded-2xl focus:border-primary focus:bg-white transition-all shadow-inner outline-none resize-none"
                placeholder="Type your response here..."
              />
            </div>
          ) : (
            <>
              {/* Dynamic group-based rendering */}
              <div className="space-y-20">
                {groupsToShow.map((group, idx) => (
                  <GroupDispatcher
                    key={group.id ?? idx}
                    group={group}
                    reviewSet={reviewSet}
                    toggleReview={toggleReview}
                    flashQuestionNumber={flashQuestionNumber}
                    disabled={isFinished}
                  />
                ))}
              </div>
            </>
          )}

        </div>
      </CDIELTSLayout>
    </FormProvider>
  );
}
