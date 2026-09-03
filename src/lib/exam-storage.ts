/**
 * Clearing one candidate's sitting off a shared machine.
 *
 * These machines are used by one student after another. Everything the exam
 * writes is keyed by attempt id, so a stale key never *loads* into the wrong
 * attempt — but it is still the previous candidate's work sitting in the
 * browser, and the saved-session screen will happily offer to resume it. When a
 * sitting ends, all of it goes.
 */

import { useExamStore } from "@/lib/stores/exam-store";
import { useExamCodeStore } from "@/lib/stores/exam-code-store";
import { useMockExamStore } from "@/lib/stores/mock-exam-store";

/** Keys written per attempt: `lever-exam-{id}-…`, `ielts-audio:{id}`, etc. */
const EXAM_KEY_PREFIXES = [
  "lever-exam-", // answers store + per-section answer backups + writing task
  "ielts-current-section-",
  "ielts-current-q-",
  "ielts-audio:",
];

/** Whole stores that belong to one sitting. */
const EXAM_STORE_KEYS = [
  "mock-exam-storage",
  "speaking-code-storage",
];

/** The exam code store, kept while the results screens still need it for auth. */
const EXAM_CODE_KEY = "exam-code-storage";

function clearMatchingKeys(store: Storage, keepExamCode: boolean): void {
  const doomed: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (!key) continue;
    const isExamKey =
      EXAM_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
      EXAM_STORE_KEYS.includes(key) ||
      (key === EXAM_CODE_KEY && !keepExamCode);
    if (isExamKey) doomed.push(key);
  }
  doomed.forEach((key) => store.removeItem(key));
}

/**
 * Wipe this sitting from the browser.
 *
 * `keepExamCode` holds on to the exam code alone: the feedback and results
 * screens authenticate with it, so it survives until the candidate leaves for
 * the home page. Display preferences (theme, reading font size) are not a
 * candidate's data and stay.
 *
 * The stores are reset before the keys are removed — a persisted store that is
 * still mounted writes itself back out on its next change, so emptying it first
 * is what makes the removal stick.
 */
export function wipeExamData({ keepExamCode = false } = {}): void {
  useExamStore.getState().clearAnswers();
  useExamStore.getState().clearHighlights();
  useExamStore.getState().setCurrentExamId(null);
  useMockExamStore.getState().reset();
  if (!keepExamCode) useExamCodeStore.getState().clear();

  if (typeof window === "undefined") return;
  try {
    clearMatchingKeys(window.localStorage, keepExamCode);
    clearMatchingKeys(window.sessionStorage, keepExamCode);
  } catch {
    // private mode / storage disabled — nothing was written either
  }
}
