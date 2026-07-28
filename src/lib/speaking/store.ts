"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Speaking-only session store.
 *
 * Deliberately its own localStorage key — writing into `exam-code-storage`
 * would make the L/R/W exam pages believe there is an exam in progress.
 * The speaking flow never reads or writes that store.
 */
interface SpeakingCodeState {
  examCode: string | null;
  attemptId: string | null;
  studentName: string | null;
  testTitle: string | null;

  setSession: (data: {
    examCode: string;
    attemptId: string;
    studentName: string | null;
    testTitle: string | null;
  }) => void;
  clear: () => void;
}

export const useSpeakingStore = create<SpeakingCodeState>()(
  persist(
    (set) => ({
      examCode: null,
      attemptId: null,
      studentName: null,
      testTitle: null,

      setSession: (data) => set(data),
      clear: () =>
        set({
          examCode: null,
          attemptId: null,
          studentName: null,
          testTitle: null,
        }),
    }),
    { name: "speaking-code-storage" },
  ),
);
