"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { CheckCircle2, Loader2, AlertTriangle, Maximize } from "lucide-react";

import axios from "axios";
import { useExamCodeStore } from "@/lib/stores/exam-code-store";

type PageStatus = "idle" | "verifying" | "verified" | "resuming";

export default function IeltsMockExamPage() {
  const router = useRouter();
  const { examCode, attemptId, setExamSession, clear } = useExamCodeStore();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<PageStatus>("idle");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // If store already has an active attempt, offer to resume
  useEffect(() => {
    if (!isHydrated) return;
    if (examCode && attemptId) {
      setStatus("resuming");
    }
  }, [isHydrated, examCode, attemptId]);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // Fullscreen not supported or denied
      }
    }
  }, []);

  const handleVerify = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Шалгалтын код оруулна уу.");
      return;
    }

    setStatus("verifying");
    try {
      const resp = await axios.post("/api/ielts/verify-code", {
        code: trimmed,
      });

      const data = resp.data;
      if (!data.valid) {
        toast.error(data.error || "Буруу код байна.");
        setStatus("idle");
        return;
      }

      // Store exam session info
      setExamSession({
        examCode: trimmed,
        studentName: data.student_name,
        attemptId: data.attempt_id,
        attemptStatus: data.attempt_status,
        testTitle: data.test_title,
        examDate: data.exam_date,
      });

      setStatus("verified");

      if (data.status === "WAITING") {
        toast.info("Хүлээлгийн өрөөнд шилжиж байна...");
        router.push(`/ielts/waiting/${data.session_id}`);
        return;
      }

      toggleFullscreen();

      if (data.status === "RESUME") {
        toast.info("Шалгалт үргэлжлүүлж байна...");
      } else {
        toast.success("Шалгалт эхэллээ!");
      }

      router.push(`/ielts/take-test/${data.attempt_id}`);
    } catch (err) {
      setStatus("idle");
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        const detail = err.response.data.detail;
        const message = typeof detail === "object" ? detail.message : detail;
        toast.error(message || "Код шалгахад алдаа гарлаа.");
      } else {
        toast.error("Код шалгахад алдаа гарлаа.");
      }
    }
  };

  const handleResume = () => {
    toggleFullscreen();
    router.push(`/ielts/take-test/${attemptId}`);
  };

  const handleNewCode = () => {
    clear();
    setStatus("idle");
    setCode("");
  };

  // Anti-cheat: fullscreen + visibility tracking
  useEffect(() => {
    if (status === "idle") return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        toast.warning(
          "Анхааруулга: Бүтэн дэлгэцээс гарах нь шалгалтын дүрэм зөрчилд тооцогдоно!",
          { position: "top-center", autoClose: 5000 },
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.warning("Анхааруулга: Шалгалтын үеэр таб солих хориотой!", {
          position: "top-center",
          autoClose: 10000,
        });
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [status]);

  const statusInfo = (() => {
    switch (status) {
      case "verifying":
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin text-blue-500" />,
          label: "Код шалгаж байна...",
          color: "text-blue-500",
        };
      case "verified":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
          label: "Шалгалт эхэллээ! Шилжүүлж байна...",
          color: "text-green-500",
        };
      default:
        return null;
    }
  })();

  if (!isHydrated) return null;

  // Resume existing session
  if (status === "resuming" && examCode && attemptId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-bordercolor shadow-sm">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-textprimary">
                Шалгалт үргэлжлүүлэх
              </h1>
              <p className="text-textsecondary text-sm">
                Таны өмнөх шалгалт хадгалагдсан байна.
              </p>
              <p className="text-xs font-mono text-textsecondary">
                Код: {examCode}
              </p>
            </div>

            <div className="w-full space-y-3">
              <Button
                onClick={handleResume}
                className="w-full h-12 rounded-xl text-base font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all active:scale-95"
              >
                Үргэлжлүүлэх
              </Button>
              <Button
                onClick={handleNewCode}
                variant="outline"
                className="w-full h-12 rounded-xl text-base font-semibold"
              >
                Шинэ код оруулах
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Code entry form
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      {/* Back Button */}
      {status === "idle" && (
        <button
          onClick={() => router.back()}
          className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 bg-white border border-bordercolor rounded-xl text-sm font-semibold text-textprimary shadow-sm hover:bg-gray-50 transition-all active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Буцах
        </button>
      )}

      {/* Main UI */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-bordercolor shadow-sm">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
            <Maximize className="w-8 h-8 text-blue-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-textprimary">
              IELTS Mock Exam
            </h1>
            <p className="text-textsecondary text-sm">
              Шалгалтын кодоо оруулна уу.
            </p>
          </div>

          <div className="w-full space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-textsecondary uppercase tracking-wider">
                Шалгалтын код
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: IELTS-XXXXXX"
                maxLength={12}
                className="text-center text-lg font-mono tracking-widest bg-gray-50 border-none h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500"
                disabled={status !== "idle"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code.trim()) handleVerify();
                }}
              />
            </div>

            {statusInfo && (
              <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 border border-bordercolor animate-in fade-in zoom-in duration-300">
                {statusInfo.icon}
                <span className={`text-sm font-semibold ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            )}

            <Button
              onClick={handleVerify}
              disabled={status !== "idle" || !code.trim()}
              className={`w-full h-12 rounded-xl text-base font-bold shadow-lg transition-all active:scale-95 ${
                status !== "idle" || !code.trim()
                  ? "bg-gray-100 text-gray-400"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {status === "idle" ? "Шалгалт эхлэх" : "Шалгаж байна..."}
            </Button>
          </div>

          {status !== "idle" && (
            <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-xl text-xs font-semibold">
              <AlertTriangle className="w-4 h-4" />
              Анхааруулга: Бүтэн дэлгэц болон таб хяналт идэвхжсэн.
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs text-textsecondary text-center">
        Шалгалтад орсноор та шалгалтын дүрэм болон хяналтын бодлогыг хүлээн
        зөвшөөрч байна.
      </p>

      {/* Exit Fullscreen Button */}
      {/* <button
        onClick={async () => {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
            toast.warning(
              "Анхааруулга: Бүтэн дэлгэцээс гарах нь шалгалтын дүрэм зөрчилд тооцогдоно!",
              { position: "bottom-right", autoClose: 5000 },
            );
          }
        }}
        className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-sm font-semibold text-red-600 shadow-sm transition-all active:scale-95"
      >
        <Maximize className="w-4 h-4" />
        Бүтэн дэлгэцээс гарах
      </button> */}
    </div>
  );
}
