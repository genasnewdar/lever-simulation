import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ExamCodeState {
  examCode: string | null;
  studentName: string | null;
  attemptId: string | null;
  attemptStatus: string | null;
  testTitle: string | null;
  examDate: string | null;
  deviceToken: string | null;

  setExamSession: (data: {
    examCode: string;
    studentName: string;
    attemptId: string | null;
    attemptStatus: string | null;
    testTitle: string | null;
    examDate: string | null;
  }) => void;
  setAttempt: (attemptId: string, attemptStatus: string) => void;
  setDeviceToken: (token: string | null) => void;
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
      deviceToken: null,

      // Clear the device token whenever we switch sessions — the new attempt
      // will need a fresh claim before any submit will pass verification.
      setExamSession: (data) => set({ ...data, deviceToken: null }),
      setAttempt: (attemptId, attemptStatus) => set({ attemptId, attemptStatus }),
      setDeviceToken: (deviceToken) => set({ deviceToken }),
      clear: () =>
        set({
          examCode: null,
          studentName: null,
          attemptId: null,
          attemptStatus: null,
          testTitle: null,
          examDate: null,
          deviceToken: null,
        }),
    }),
    { name: "exam-code-storage" },
  ),
);
