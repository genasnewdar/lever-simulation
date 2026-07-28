"use client";

import axios from "axios";

import { useSpeakingStore } from "@/lib/speaking/store";
import type {
  NextTurnResponse,
  PrepDoneResponse,
  SpeakingResults,
  SpeakingStateResponse,
  StartSessionResponse,
  SubmitTurnResponse,
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

const base = (attemptId: string) => `/api/public/ielts/speaking/${attemptId}`;

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
