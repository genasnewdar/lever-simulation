import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Flat map: form field path -> string value (e.g. "questions.abc.answer" or "gap_1") */
export type ExamAnswers = Record<string, string>;

/** Reading passage highlight (persisted per exam so markers survive refresh) */
export interface StoredHighlight {
  start: number;
  end: number;
  color: "yellow" | "pink";
}

interface ExamState {
  /** Per-exam answers so refresh keeps them; key = examId (test id from URL) */
  answersByExam: Record<string, ExamAnswers>;
  /** Per-exam reading highlights: examId -> passageId -> highlights */
  highlightsByExam: Record<string, Record<string, StoredHighlight[]>>;
  /** Set from page when mounting so setAnswer knows which exam to update */
  currentExamId: string | null;
  /** True after persist has rehydrated from localStorage (avoids hydration mismatch) */
  _hasHydrated: boolean;
  setCurrentExamId: (id: string | null) => void;
  setAnswer: (questionId: string, value: string) => void;
  /** Replace all answers for the current exam (e.g. when syncing from form) */
  setAnswers: (answers: ExamAnswers) => void;
  clearAnswers: (examId?: string) => void;
  /** Clear highlights for an exam (or all exams if no id given) */
  clearHighlights: (examId?: string) => void;
  /** Get answers for current exam (or for given examId) */
  getAnswers: (examId?: string) => ExamAnswers;
  /** Set highlights for one passage (adds to existing). Call after user marks text. */
  setHighlights: (examId: string, passageId: string, highlights: StoredHighlight[]) => void;
  /** Get all highlights for an exam (passageId -> highlights). */
  getHighlights: (examId?: string) => Record<string, StoredHighlight[]>;
  _setHasHydrated: (value: boolean) => void;
}

type PersistedState = {
  answersByExam: Record<string, ExamAnswers>;
  highlightsByExam: Record<string, Record<string, StoredHighlight[]>>;
};

/** Safe storage: no-op on server, localStorage on client (avoids SSR issues) */
const examStorage = createJSONStorage<PersistedState>(() => {
  if (typeof window === "undefined") {
    return {
      getItem: (): string | null => null,
      setItem: (): void => {},
      removeItem: (): void => {},
    };
  }
  return localStorage;
});

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      answersByExam: {},
      highlightsByExam: {},
      currentExamId: null,
      _hasHydrated: false,

      setCurrentExamId: (id) => set({ currentExamId: id }),

      setAnswer: (questionId, value) => {
        const { currentExamId, answersByExam } = get();
        const id = currentExamId != null ? String(currentExamId) : null;
        if (!id) return;
        set({
          answersByExam: {
            ...answersByExam,
            [id]: {
              ...(answersByExam[id] ?? answersByExam[currentExamId!] ?? {}),
              [questionId]: value,
            },
          },
        });
      },

      setAnswers: (answers) => {
        const { currentExamId, answersByExam } = get();
        const id = currentExamId != null ? String(currentExamId) : null;
        if (!id) return;
        set({
          answersByExam: {
            ...answersByExam,
            [id]: { ...answers },
          },
        });
      },

      clearAnswers: (examId) => {
        const { answersByExam } = get();
        if (examId != null && examId !== "") {
          const next = { ...answersByExam };
          delete next[String(examId)];
          set({ answersByExam: next });
        } else {
          set({ answersByExam: {} });
        }
      },

      clearHighlights: (examId) => {
        const { highlightsByExam } = get();
        if (examId != null && examId !== "") {
          const next = { ...highlightsByExam };
          delete next[String(examId)];
          set({ highlightsByExam: next });
        } else {
          set({ highlightsByExam: {} });
        }
      },

      getAnswers: (examId) => {
        const raw = examId ?? get().currentExamId;
        if (raw == null || raw === "") return {};
        const id = String(raw);
        return get().answersByExam[id] ?? get().answersByExam[examId as string] ?? {};
      },

      setHighlights: (examId, passageId, highlights) => {
        const { highlightsByExam } = get();
        const id = String(examId);
        set({
          highlightsByExam: {
            ...highlightsByExam,
            [id]: {
              ...(highlightsByExam[id] ?? {}),
              [passageId]: highlights,
            },
          },
        });
      },

      getHighlights: (examId) => {
        const raw = examId ?? get().currentExamId;
        if (raw == null || raw === "") return {};
        const id = String(raw);
        return get().highlightsByExam[id] ?? get().highlightsByExam[examId as string] ?? {};
      },

      _setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "lever-exam-answers",
      storage: examStorage,
      onRehydrateStorage: () => () => {
        useExamStore.getState()._setHasHydrated(true);
      },
      partialize: (state) => ({
        answersByExam: state.answersByExam,
        highlightsByExam: state.highlightsByExam,
      }),
    }
  )
);

/** Flatten form values to store shape: { [questionId: string]: string } */
export function formValuesToAnswers(formValues: Record<string, unknown>): ExamAnswers {
  const flat: ExamAnswers = {};
  if (formValues.questions && typeof formValues.questions === "object") {
    const q = formValues.questions as Record<string, unknown>;
    for (const [id, obj] of Object.entries(q)) {
      if (obj && typeof obj === "object" && "answer" in obj) {
        const v = (obj as { answer: unknown }).answer;
        flat[`questions.${id}.answer`] = v != null ? String(v) : "";
      }
    }
  }
  for (const [k, v] of Object.entries(formValues)) {
    if (
      (k.startsWith("gap_") || k.startsWith("writing_task_")) &&
      v != null
    ) {
      flat[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
  }
  return flat;
}

/** Build react-hook-form defaultValues from flat store answers */
export function answersToFormValues(answers: ExamAnswers): Record<string, unknown> {
  const form: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(answers)) {
    const match = key.match(/^questions\.([^.]+)\.answer$/);
    if (match) {
      const [, id] = match;
      if (!form.questions) form.questions = {} as Record<string, unknown>;
      (form.questions as Record<string, unknown>)[id] = { answer: value };
    } else {
      form[key] = value;
    }
  }
  return form;
}

// ─── Section-based localStorage (lever-exam-{examId}-listening-section1, etc.) ───

const SECTION_KEYS = [
  "listening-section1",
  "listening-section2",
  "listening-section3",
  "listening-section4",
  "reading-section1",
  "reading-section2",
  "reading-section3",
  "writing-task1",
  "writing-task2",
] as const;

export function getSectionStorageKey(examId: string, sectionKey: string): string {
  return `lever-exam-${examId}-${sectionKey}`;
}

export function saveSectionToStorage(
  examId: string,
  sectionKey: string,
  answers: ExamAnswers,
): void {
  if (typeof window === "undefined") return;
  try {
    const key = getSectionStorageKey(examId, sectionKey);
    localStorage.setItem(key, JSON.stringify(answers));
  } catch {
    // ignore quota / private mode
  }
}

export function loadSectionFromStorage(
  examId: string,
  sectionKey: string,
): ExamAnswers {
  if (typeof window === "undefined") return {};
  try {
    const key = getSectionStorageKey(examId, sectionKey);
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as ExamAnswers;
    }
  } catch {
    // ignore
  }
  return {};
}

/** Load all section keys for an exam and merge into one ExamAnswers object */
export function loadAllSectionsFromStorage(examId: string): ExamAnswers {
  const merged: ExamAnswers = {};
  for (const sectionKey of SECTION_KEYS) {
    const section = loadSectionFromStorage(examId, sectionKey);
    Object.assign(merged, section);
  }
  return merged;
}

/**
 * Split flat answers by section for storage.
 * - idToSection: question id -> section key (for questions.${id}.answer)
 * - gapNumToSection: gap number 1-40 -> section key (Listening: 1-10->section1, 11-20->section2, ...)
 */
export function splitAnswersBySection(
  flat: ExamAnswers,
  idToSection: (questionId: string) => string | null,
  gapNumToSection: (gapNum: number) => string,
): Record<string, ExamAnswers> {
  const bySection: Record<string, ExamAnswers> = {};
  for (const [key, value] of Object.entries(flat)) {
    let sectionKey: string | null = null;
    if (key === "writing_task_1") sectionKey = "writing-task1";
    else if (key === "writing_task_2") sectionKey = "writing-task2";
    else if (key.startsWith("gap_")) {
      const n = parseInt(key.replace("gap_", ""), 10);
      if (!Number.isNaN(n)) sectionKey = gapNumToSection(n);
    } else {
      const match = key.match(/^questions\.([^.]+)\.answer$/);
      if (match) sectionKey = idToSection(match[1]);
    }
    if (sectionKey) {
      if (!bySection[sectionKey]) bySection[sectionKey] = {};
      bySection[sectionKey][key] = value;
    }
  }
  return bySection;
}
