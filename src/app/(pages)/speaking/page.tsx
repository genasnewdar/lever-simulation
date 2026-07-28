"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { CheckCircle2, Loader2, Mic } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeakingStore } from "@/lib/speaking/store";

/**
 * Entry point for the standalone speaking simulation.
 *
 * Shares nothing with /ielts — its own code store, its own attempt lookup. A
 * code entered here does not put the L/R/W exam pages into a resumable state.
 */
export default function SpeakingEntryPage() {
  const router = useRouter();
  const { setSession, clear } = useSpeakingStore();

  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "verified">("idle");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  const handleStart = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Симуляцийн кодоо оруулна уу.");
      return;
    }

    setStatus("verifying");
    try {
      const { data } = await axios.post("/api/speaking/verify-code", {
        code: trimmed,
      });

      setSession({
        examCode: trimmed,
        attemptId: data.attempt_id,
        studentName: data.student_name,
        testTitle: data.test_title,
      });

      setStatus("verified");
      router.push(`/speaking/session/${data.attempt_id}`);
    } catch (err) {
      setStatus("idle");
      clear();

      let message = "Код шалгахад алдаа гарлаа.";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        const detail = data?.detail;
        message =
          data?.message ||
          (typeof detail === "object" ? detail?.message : detail) ||
          message;
      }
      toast.error(message);
    }
  };

  if (!hydrated) return null;

  const isVerifying = status === "verifying";

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-[440px]">
        <div className="flex items-center gap-2 pb-7 text-[12px] uppercase tracking-[0.2em] text-muted">
          <span className="h-1 w-1 rounded-full bg-mint" />
          IELTS Speaking
        </div>

        <h1 className="font-serif text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.022em] text-ink">
          Ярианы шалгалт эхлүүлэх.
        </h1>
        <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-ink-soft">
          Симуляцийн кодоо оруулаад AI шалгагчтай ярианы шалгалтаа өгнө үү.
          Дуусмагц AI үнэлгээ, санал зөвлөмж, оноог тань шууд харуулна.
        </p>

        <div className="mt-9 space-y-3">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="IELTS-XXXXXX"
            maxLength={12}
            autoFocus
            disabled={isVerifying}
            onKeyDown={(e) => {
              if (e.key === "Enter" && code.trim()) handleStart();
            }}
            className="h-12 rounded-md border border-rule bg-paper-2 text-center font-mono text-[15px] tracking-[0.18em] focus-visible:border-ink-soft focus-visible:ring-1 focus-visible:ring-ink-soft"
          />

          <Button
            onClick={handleStart}
            disabled={isVerifying || !code.trim()}
            className="h-11 w-full rounded-md bg-ink text-[14px] font-medium tracking-tight text-paper transition-all active:scale-[0.99] hover:bg-ink-soft disabled:bg-paper-3 disabled:text-muted"
          >
            {status === "verified" ? (
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-mint" />
                Шилжүүлж байна…
              </span>
            ) : isVerifying ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Шалгаж байна…
              </span>
            ) : (
              "Ярианы шалгалт эхлэх"
            )}
          </Button>
        </div>

        <div className="mt-7 flex items-start gap-2 text-[12px] leading-relaxed text-muted">
          <Mic className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-deep" />
          <p className="max-w-[42ch]">
            Микрофоны зөвшөөрөл шаардлагатай. Чимээгүй өрөөнд, чихэвчтэй өгөхийг
            зөвлөж байна. Chrome хөтөч дээр ярианы бичвэр шууд харагдана.
          </p>
        </div>
      </div>
    </div>
  );
}
