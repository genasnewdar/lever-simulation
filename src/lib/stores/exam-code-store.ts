import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ExamCodeState {
  examCode: string | null;
  studentName: string | null;
  attemptId: string | null;
  attemptStatus: string | null;
  testTitle: string | null;
  examDate: string | null;

  setExamSession: (data: {
    examCode: string;
    studentName: string;
    attemptId: string | null;
    attemptStatus: string | null;
    testTitle: string | null;
    examDate: string | null;
  }) => void;
  setAttempt: (attemptId: string, attemptStatus: string) => void;
  clear: () => void;
}

export const useExamCodeStore = create<ExamCodeState>()(
  persist(
    (set) => ({
      examCode: null,
      studentName: null,
      attemptId: null,
      attemptStatus: null,
      testTitle: null,
      examDate: null,

      setExamSession: (data) => set({ ...data }),
      setAttempt: (attemptId, attemptStatus) => set({ attemptId, attemptStatus }),
      clear: () =>
        set({
          examCode: null,
          studentName: null,
          attemptId: null,
          attemptStatus: null,
          testTitle: null,
          examDate: null,
        }),
    }),
    { name: "exam-code-storage" },
  ),
);
