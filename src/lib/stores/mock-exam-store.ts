import { create } from "zustand";
import { persist } from "zustand/middleware";

type MockExamStatus =
  | "idle"
  | "joined"
  | "waiting"
  | "preparing"
  | "ready"
  | "started";

interface MockExamState {
  code: string;
  status: MockExamStatus;
  sessionId: string | null;
  testId: string | null;
  attemptId: string | null;
  setCode: (code: string) => void;
  setStatus: (status: MockExamStatus) => void;
  setSessionId: (id: string | null) => void;
  setTestId: (id: string | null) => void;
  setAttemptId: (id: string | null) => void;
  reset: () => void;
}

export const useMockExamStore = create<MockExamState>()(
  persist(
    (set) => ({
      code: "",
      status: "idle",
      sessionId: null,
      testId: null,
      attemptId: null,
      setCode: (code) => set({ code }),
      setStatus: (status) => set({ status }),
      setSessionId: (sessionId) => set({ sessionId }),
      setTestId: (testId) => set({ testId }),
      setAttemptId: (attemptId) => set({ attemptId }),
      reset: () =>
        set({ code: "", status: "idle", sessionId: null, testId: null, attemptId: null }),
    }),
    {
      name: "mock-exam-storage",
    }
  )
);
