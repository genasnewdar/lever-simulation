"use client";

import axios from "axios";

import { useSpeakingStore } from "@/lib/speaking/store";
import type {
  NextTurnResponse,
  PrepDoneResponse,
  SpeakingFeedback,
  SpeakingResults,
  SpeakingStateResponse,
  StartSessionResponse,
  SubmitTurnResponse,
  VoiceCheckResponse,
} from "@/types/speaking";

/**
 * Dedicated client for the public speaking endpoints.
 *
 * Separate from `@/lib/axios` so the speaking flow carries its own exam code
 * and can never disturb the exam session's headers or interceptors.
 */
const speakingApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

speakingApi.interceptors.request.use((config) => {
  const code = useSpeakingStore.getState().examCode;
  if (code && config.headers) {
    config.headers["X-Exam-Code"] = code;
  }
  return config;
});

/**
 * A code that does not own this attempt is a dead end — don't leave the
 * candidate sitting in one.
 *
 * The store is persisted and an exam-room machine is used by one candidate
 * after another, so a code left over from an earlier sitting gets paired with
 * the attempt in the URL and every request comes back 403. The candidate is
 * then shown "This exam code does not own that attempt", in English, on a
 * screen whose only button returns them to the same broken state. Re-entering
 * the code clears it, so do exactly that for them: drop the stale session and
 * ask for the code again.
 */
speakingApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 403 && typeof window !== "undefined") {
      useSpeakingStore.getState().clear();
      window.location.assign("/speaking");
    }
    return Promise.reject(error);
  },
);

const base = (attemptId: string) => `/api/public/ielts/speaking/${attemptId}`;

/**
 * The examiner's own recording of the mic-check line.
 *
 * Its own endpoint because the mic check runs before `/start`, so there is no
 * turn to carry `examiner_audio_url` yet — and without it the speaker test
 * played the browser's robotic voice, which is the opposite of what a student
 * is being asked to judge. Worth fetching early: a line the CDN has never been
 * asked for takes seconds to synthesise.
 */
export async function fetchVoiceCheck(attemptId: string) {
  const { data } = await speakingApi.get<VoiceCheckResponse>(
    `${base(attemptId)}/voice-check`,
  );
  return data;
}

export async function startSession(attemptId: string) {
  const { data } = await speakingApi.post<StartSessionResponse>(
    `${base(attemptId)}/start`,
  );
  return data;
}

export async function fetchNextTurn(attemptId: string) {
  const { data } = await speakingApi.post<NextTurnResponse>(
    `${base(attemptId)}/next-turn`,
  );
  return data;
}

export async function markPrepDone(attemptId: string, turnId: string) {
  const { data } = await speakingApi.post<PrepDoneResponse>(
    `${base(attemptId)}/turn/${turnId}/prep-done`,
  );
  return data;
}

export async function submitTurn(
  attemptId: string,
  turnId: string,
  payload: { transcript: string | null; duration: number | null },
) {
  const { data } = await speakingApi.post<SubmitTurnResponse>(
    `${base(attemptId)}/turn/${turnId}/submit`,
    { ...payload, audio_url: null },
  );
  return data;
}

/**
 * Ship the recording. Fire-and-forget by design — a failed upload must never
 * stall the conversation, since grading runs off the transcript.
 */
export async function uploadTurnAudio(
  attemptId: string,
  turnId: string,
  blob: Blob,
) {
  const form = new FormData();
  const ext = blob.type.includes("ogg") ? "ogg" : "webm";
  form.append("file", blob, `${turnId}.${ext}`);

  const { data } = await speakingApi.post(
    `${base(attemptId)}/turn/${turnId}/audio`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

export async function fetchState(attemptId: string) {
  const { data } = await speakingApi.get<SpeakingStateResponse>(
    `${base(attemptId)}/state`,
  );
  return data;
}

export async function completeSession(attemptId: string) {
  const { data } = await speakingApi.post(`${base(attemptId)}/complete`);
  return data;
}

export async function fetchResults(attemptId: string) {
  const { data } = await speakingApi.get<SpeakingResults>(
    `${base(attemptId)}/results`,
  );
  return data;
}

/**
 * Build the PDF report and email it to the student and every admin.
 *
 * Idempotent server-side, so calling it whenever results finish is safe — the
 * first call sends and the rest return `already_sent`.
 */
export async function sendReport(attemptId: string) {
  const { data } = await speakingApi.post<{ status: string }>(
    `/api/public/ielts/report/${attemptId}`,
  );
  return data;
}

/**
 * Correction-level feedback — the mistakes, their fixes, and what to practise.
 *
 * Generated on the pro model, so it lands after the bands do; the caller polls
 * while `status` is `building`.
 */
export async function fetchFeedback(attemptId: string) {
  const { data } = await speakingApi.get<SpeakingFeedback>(
    `${base(attemptId)}/feedback`,
  );
  return data;
}
