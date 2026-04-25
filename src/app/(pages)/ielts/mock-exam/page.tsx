"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { CheckCircle2, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";

import axios from "axios";
import { useExamCodeStore } from "@/lib/stores/exam-code-store";

type PageStatus = "idle" | "verifying" | "verified" | "resuming";

function IeltsMockExamPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { examCode, attemptId, setExamSession, clear } = useExamCodeStore();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<PageStatus>("idle");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const queryCode = searchParams.get("code");
    if (queryCode && !code) {
      setCode(queryCode.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // not supported / denied
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
      const resp = await axios.post("/api/ielts/verify-code", { code: trimmed });
      const data = resp.data;
      if (!data.valid) {
        toast.error(data.error || "Буруу код байна.");
        setStatus("idle");
        return;
      }

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

  if (!isHydrated) return null;

  // Resume existing session
  if (status === "resuming" && examCode && attemptId) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-[440px]">
          <div className="flex items-center gap-2 pb-7 text-[13px] text-mint-deep font-serif">
            <CheckCircle2 className="w-4 h-4" />
            <span>Saved session</span>
          </div>

          <h1 className="font-serif text-[2.1rem] font-semibold text-ink leading-[1.1] tracking-[-0.022em]">
            Pick up where you left off.
          </h1>
          <p className="mt-3 text-[15px] text-ink-soft leading-relaxed">
            Your previous exam is still in progress. You can resume on this device with the same code.
          </p>
          <p className="mt-2 text-[12px] text-muted font-mono tracking-wider">
            {examCode}
          </p>

          <div className="mt-9 flex flex-col gap-3">
            <Button
              onClick={handleResume}
              className="w-full h-11 rounded-md text-[14px] font-medium tracking-tight bg-ink hover:bg-ink-soft text-paper transition-all active:scale-[0.99]"
            >
              Үргэлжлүүлэх
            </Button>
            <Button
              onClick={handleNewCode}
              variant="ghost"
              className="w-full h-11 rounded-md text-[14px] font-medium tracking-tight text-ink-soft hover:text-ink hover:bg-paper-2"
            >
              Шинэ код оруулах
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isVerifying = status === "verifying";
  const isVerified = status === "verified";

  return (
    <div className="min-h-screen bg-paper flex flex-col px-6">
      {/* Back */}
      {status === "idle" && (
        <button
          onClick={() => router.back()}
          className="absolute top-7 left-7 inline-flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium text-ink-soft hover:text-ink rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Буцах
        </button>
      )}

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[440px]">
          <div className="flex items-center gap-2 pb-7 text-[12px] uppercase tracking-[0.2em] text-muted">
            <span className="h-1 w-1 rounded-full bg-mint" />
            IELTS Mock
          </div>

          <h1 className="font-serif text-[2.1rem] font-semibold text-ink leading-[1.08] tracking-[-0.022em]">
            Шалгалтын кодоо оруулна уу.
          </h1>
          <p className="mt-3 text-[15px] text-ink-soft leading-relaxed max-w-[42ch]">
            Имэйлээр илгээсэн 12 оронтой кодыг доор оруулаад шалгалтаа эхлүүлээрэй.
          </p>

          <div className="mt-9 space-y-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="IELTS-XXXXXX"
              maxLength={12}
              autoFocus
              className="h-12 text-center text-[15px] tracking-[0.18em] font-mono bg-paper-2 border border-rule rounded-md focus-visible:ring-1 focus-visible:ring-ink-soft focus-visible:border-ink-soft"
              disabled={!isVerifying ? false : true}
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.trim()) handleVerify();
              }}
            />

            <Button
              onClick={handleVerify}
              disabled={isVerifying || !code.trim()}
              className="w-full h-11 rounded-md text-[14px] font-medium tracking-tight bg-ink hover:bg-ink-soft text-paper disabled:bg-paper-3 disabled:text-muted transition-all active:scale-[0.99]"
            >
              {isVerified ? (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-mint" />
                  Шилжүүлж байна…
                </span>
              ) : isVerifying ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Шалгаж байна…
                </span>
              ) : (
                "Шалгалт эхлэх"
              )}
            </Button>
          </div>

          {!isVerifying && status === "idle" && (
            <p className="mt-7 text-[12px] text-muted leading-relaxed max-w-[42ch]">
              Шалгалтад орсноор та шалгалтын дүрэм болон хяналтын бодлогыг хүлээн зөвшөөрч байна. Бүтэн дэлгэц болон таб хяналт шалгалт эхэлмэгц идэвхжинэ.
            </p>
          )}

          {(isVerifying || isVerified) && (
            <div className="mt-7 inline-flex items-center gap-2 text-[12px] text-ink-soft">
              <AlertTriangle className="w-3.5 h-3.5 text-mint-deep" />
              Бүтэн дэлгэц болон таб хяналт идэвхжсэн.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IeltsMockExamPage() {
  return (
    <Suspense fallback={null}>
      <IeltsMockExamPageInner />
    </Suspense>
  );
}
