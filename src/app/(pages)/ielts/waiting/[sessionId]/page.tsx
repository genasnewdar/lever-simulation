"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";

import { useExamCodeStore } from "@/lib/stores/exam-code-store";
import { StatusPill } from "@/components/ielts/waiting/StatusPill";
import { AudioCheckButton } from "@/components/ielts/waiting/AudioCheckButton";
import { RulesCard } from "@/components/ielts/waiting/RulesCard";
import { RosterCard } from "@/components/ielts/waiting/RosterCard";
import { CountdownOverlay } from "@/components/ielts/waiting/CountdownOverlay";
import {
  subscribeToRosterUpdates,
  type RosterPayload,
} from "@/lib/sse/rosterStream";

type SessionStatus =
  | "CREATED"
  | "WAITING"
  | "ACCESS_GRANTED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELLED";

interface WaitingStatus {
  session_id: string;
  session_code: string;
  session_status: SessionStatus;
  my_status: string;
  can_take_test: boolean;
  attempt_id: string | null;
  started_at: string | null;
  user_id?: string | null;
}

const POLL_INTERVAL_MS = 3000;

export default function WaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;
  const { examCode, studentName, testTitle, examDate, setAttempt } =
    useExamCodeStore();

  const [state, setState] = useState<WaitingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterPayload | null>(null);
  const [countingDown, setCountingDown] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!examCode || !sessionId) return;
    try {
      const resp = await axios.post("/api/ielts/session-status", {
        session_id: sessionId,
        code: examCode,
      });
      setState(resp.data);
      setError(null);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(
          typeof detail === "string"
            ? detail
            : detail?.message || "Хүлээлгийн төлөв авахад алдаа гарлаа.",
        );
      } else {
        setError("Сервертэй холбогдоход алдаа гарлаа.");
      }
    }
  }, [examCode, sessionId]);

  useEffect(() => {
    if (!examCode) {
      router.replace("/ielts/mock-exam");
    }
  }, [examCode, router]);

  useEffect(() => {
    if (!examCode || countingDown) return;
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [examCode, fetchStatus, countingDown]);

  useEffect(() => {
    if (!examCode || !sessionId) return;
    const cleanup = subscribeToRosterUpdates(
      sessionId,
      examCode,
      (payload) => setRoster(payload),
      () => {
        // Silent — polling keeps the page useful without roster.
      },
    );
    return cleanup;
  }, [examCode, sessionId]);

  useEffect(() => {
    if (!state) return;
    if (state.can_take_test && state.attempt_id && !countingDown) {
      setCountingDown(true);
    }
  }, [state, countingDown]);

  const handleCountdownComplete = useCallback(async () => {
    if (!state?.attempt_id) return;
    setAttempt(state.attempt_id, "IN_PROGRESS");
    toast.success("Шалгалт эхэллээ!");
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Browser may block without user gesture; ignore.
    }
    router.replace(`/ielts/take-test/${state.attempt_id}`);
  }, [state, setAttempt, router]);

  const pillVariant: "waiting" | "ready" | "starting" | "error" = (() => {
    if (error) return "error";
    if (state?.session_status === "STARTED" || countingDown) return "starting";
    if (state?.session_status === "ACCESS_GRANTED") return "ready";
    return "waiting";
  })();

  const pillLabel: string = (() => {
    if (error) return "Алдаа гарлаа";
    if (countingDown) return "Шалгалт эхэлж байна";
    switch (state?.session_status) {
      case "ACCESS_GRANTED":
        return "Бэлэн боллоо";
      case "STARTED":
        return "Шалгалт эхэллээ";
      case "COMPLETED":
        return "Шалгалт дууссан";
      case "CANCELLED":
        return "Шалгалт цуцлагдсан";
      default:
        return "Шалгалт хүлээгдэж байна";
    }
  })();

  if (!examCode) return null;

  return (
    <>
      {countingDown && <CountdownOverlay onComplete={handleCountdownComplete} />}

      <main className="min-h-screen bg-zinc-50 flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col gap-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <StatusPill variant={pillVariant} label={pillLabel} />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Та бэлэн боллоо
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                Бид удирдагч эхлүүлэхийг хүлээж байна...
              </p>
              {testTitle && (
                <p className="mt-2 text-xs text-zinc-500">
                  {testTitle}
                  {examDate ? ` · ${examDate}` : ""}
                  {studentName ? ` · ${studentName}` : ""}
                </p>
              )}
            </div>
          </div>

          <AudioCheckButton />

          {roster && (
            <RosterCard roster={roster} selfUserId={state?.user_id ?? null} />
          )}

          <RulesCard />

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
