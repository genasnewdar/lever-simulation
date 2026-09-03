"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SpeakingReport } from "@/components/speaking/SpeakingReport";
import { fetchFeedback, fetchResults, sendReport } from "@/lib/speaking/api";
import { useSpeakingStore } from "@/lib/speaking/store";
import {
  type SpeakingFeedbackSuccess,
  type SpeakingResultsSuccess,
} from "@/types/speaking";

const POLL_MS = 5000;

export default function SpeakingResultsPage() {
  const router = useRouter();
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;

  const { studentName, clear } = useSpeakingStore();

  const [result, setResult] = useState<SpeakingResultsSuccess | null>(null);
  const [feedback, setFeedback] = useState<SpeakingFeedbackSuccess | null>(null);
  const [feedbackUnavailable, setFeedbackUnavailable] = useState(false);
  const [failed, setFailed] = useState(false);

  const resultDoneRef = useRef(false);
  const feedbackDoneRef = useRef(false);
  const reportSentRef = useRef(false);
  // Unmounting has to stop the polling without looking like both halves
  // settled: marking them done was enough to make a poll that was still in
  // flight mail the report with no corrections in it, and the server stores
  // that PDF as the only one the student ever gets.
  const cancelledRef = useRef(false);

  /**
   * Bands and detailed feedback are generated separately and land at different
   * times, so each is polled until it settles rather than waiting on the pair.
   */
  const poll = useCallback(async () => {
    if (!resultDoneRef.current) {
      try {
        const data = await fetchResults(attemptId);
        if (data.status === "success") {
          resultDoneRef.current = true;
          setResult(data);
        }
      } catch {
        resultDoneRef.current = true;
        feedbackDoneRef.current = true;
        setFailed(true);
        return;
      }
    }

    if (!feedbackDoneRef.current) {
      try {
        const data = await fetchFeedback(attemptId);
        if (data.status === "success") {
          feedbackDoneRef.current = true;
          setFeedback(data);
        } else if (data.status === "unavailable") {
          feedbackDoneRef.current = true;
          setFeedbackUnavailable(true);
        }
      } catch {
        // Supplementary to the band — keep polling, never fail the page on it.
      }
    }

    // Mail the PDF once both halves have settled, so the report carries the
    // corrections rather than the bands alone. The server is idempotent; this
    // guard just avoids the extra round trips.
    if (cancelledRef.current) return;
    if (resultDoneRef.current && feedbackDoneRef.current && !reportSentRef.current) {
      reportSentRef.current = true;
      sendReport(attemptId).catch(() => {
        // The student has their results on screen either way.
      });
    }
  }, [attemptId]);

  useEffect(() => {
    cancelledRef.current = false;
    resultDoneRef.current = false;
    feedbackDoneRef.current = false;
    poll();

    const interval = window.setInterval(() => {
      if (resultDoneRef.current && feedbackDoneRef.current) {
        window.clearInterval(interval);
        return;
      }
      poll();
    }, POLL_MS);

    return () => {
      cancelledRef.current = true;
      window.clearInterval(interval);
    };
  }, [poll]);

  const handleExit = () => {
    clear();
    router.push("/speaking");
  };

  if (failed) {
    return (
      <Centered>
        <h1 className="font-serif text-[1.8rem] font-semibold text-ink">
          Үр дүнг ачаалж чадсангүй.
        </h1>
        <p className="mt-3 text-[15px] text-ink-soft">
          Түр хүлээгээд хуудсаа сэргээнэ үү.
        </p>
        <Button
          onClick={handleExit}
          variant="ghost"
          className="mt-8 h-11 rounded-md px-6 text-[14px] text-ink-soft hover:bg-paper-2 hover:text-ink"
        >
          Буцах
        </Button>
      </Centered>
    );
  }

  if (!result) {
    return (
      <Centered>
        <Loader2 className="h-5 w-5 animate-spin text-mint-deep" />
        <h1 className="mt-6 font-serif text-[1.8rem] font-semibold text-ink">
          AI дүгнэж байна…
        </h1>
        <p className="mt-3 max-w-[38ch] text-[15px] leading-relaxed text-ink-soft">
          Таны ярианы шалгалтыг үнэлж байна. Энэ хуудсыг хаахгүй байна уу — үр
          дүн гармагц шууд харагдана.
        </p>
      </Centered>
    );
  }

  return (
    <div className="min-h-screen bg-paper px-6 py-14">
      <div className="mx-auto w-full max-w-[46rem]">
        <button
          onClick={handleExit}
          className="mb-10 inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Дуусгах
        </button>

        {/* Cyrillic has no small-caps tradition and reads as shouting when it
            is forced upper — so the eyebrow keeps its tracking and drops the
            case change wherever the label is Mongolian. */}
        <div className="flex items-center gap-2 pb-6 text-[12px] tracking-[0.14em] text-muted">
          <span className="h-1 w-1 rounded-full bg-mint" />
          <span className="uppercase tracking-[0.2em]">IELTS Speaking</span> ·
          үнэлгээ
        </div>

        <SpeakingReport
          result={result}
          feedback={feedback}
          feedbackUnavailable={feedbackUnavailable}
          studentName={studentName}
        />
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      {children}
    </div>
  );
}
