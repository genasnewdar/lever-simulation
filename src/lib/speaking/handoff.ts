"use client";

/**
 * Handing a candidate from the written paper to the speaking interview.
 *
 * The speaking flow keeps its own store on purpose — writing the code into
 * `exam-code-storage` would make the L/R/W exam pages believe an exam is in
 * progress. That isolation is right, but it means a candidate who reaches
 * Speaking as part of a sitting arrives with their code in the *exam* store and
 * nothing in the speaking one. Without this, two things happen: the session
 * page's guard bounces them straight back to `/speaking`, and every speaking
 * request goes out with no `X-Exam-Code` header.
 *
 * So the handover is explicit — copy the session across, then navigate. One
 * direction only: the speaking store never writes back.
 */

import { useExamCodeStore } from "@/lib/stores/exam-code-store";
import { useSpeakingStore } from "@/lib/speaking/store";

/**
 * Copy the current exam session into the speaking store.
 *
 * Returns false when there is no code to copy, in which case the caller should
 * not navigate — the session page would only bounce the candidate out again.
 */
export function prepareSpeakingHandoff(attemptId: string): boolean {
  const { examCode, studentName, testTitle } = useExamCodeStore.getState();
  if (!examCode) return false;

  useSpeakingStore.getState().setSession({
    examCode,
    attemptId,
    studentName: studentName ?? null,
    testTitle: testTitle ?? null,
  });
  return true;
}
