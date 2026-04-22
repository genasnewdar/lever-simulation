"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { Loader2, Users, Clock, CheckCircle2 } from "lucide-react";

import { useExamCodeStore } from "@/lib/stores/exam-code-store";

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

  // Redirect to mock-exam if no exam code in store
  useEffect(() => {
    if (!examCode) {
      router.replace("/ielts/mock-exam");
    }
  }, [examCode, router]);

  // Initial fetch + polling
  useEffect(() => {
    if (!examCode) return;
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [examCode, fetchStatus]);

  // When admin starts, transition to the exam page
  useEffect(() => {
    if (!state) return;
    if (state.can_take_test && state.attempt_id) {
      setAttempt(state.attempt_id, "IN_PROGRESS");
      toast.success("Шалгалт эхэллээ!");
      // Request fullscreen (best-effort) before navigating
      (async () => {
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
          }
        } catch {
          // Ignore — browser may block without user gesture.
        }
        router.replace(`/ielts/take-test/${state.attempt_id}`);
      })();
    }
  }, [state, router, setAttempt]);

  const statusLabel = (() => {
    switch (state?.session_status) {
      case "CREATED":
      case "WAITING":
        return "Админ шалгалт эхлүүлэхийг хүлээж байна";
      case "ACCESS_GRANTED":
        return "Хандалт нээгдлээ — удахгүй эхэлнэ";
      case "STARTED":
        return "Шалгалт эхэллээ, шилжүүлж байна...";
      case "COMPLETED":
        return "Шалгалт дууссан байна";
      case "CANCELLED":
        return "Шалгалт цуцлагдсан байна";
      default:
        return "Төлөв хүлээж байна...";
    }
  })();

  if (!examCode) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-bordercolor shadow-sm">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
            {state?.session_status === "STARTED" ? (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            ) : (
              <Clock className="w-8 h-8 text-blue-500" />
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-textprimary">
              Хүлээлгийн өрөө
            </h1>
            <p className="text-textsecondary text-sm">{statusLabel}</p>
            {testTitle && (
              <p className="text-xs text-textsecondary">
                {testTitle}
                {examDate ? ` · ${examDate}` : ""}
              </p>
            )}
          </div>

          <div className="w-full space-y-3 text-sm">
            <InfoRow label="Нэр" value={studentName || "—"} />
            <InfoRow label="Код" value={examCode} mono />
            <InfoRow
              label="Сессийн код"
              value={state?.session_code || "—"}
              mono
            />
            <InfoRow label="Миний төлөв" value={state?.my_status || "—"} />
          </div>

          <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-xl text-xs font-semibold w-full justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Автоматаар шилжүүлнэ — энэ хуудсаа битгий хаагаарай.</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-xs font-semibold w-full justify-center">
              <Users className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs text-textsecondary text-center max-w-md">
        Админ бүх оролцогч бэлэн болсныг шалгаж, шалгалтыг нэгэн зэрэг
        эхлүүлнэ.
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-bordercolor/50">
      <span className="text-textsecondary">{label}</span>
      <span
        className={`font-semibold text-textprimary ${
          mono ? "font-mono tracking-wider" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
