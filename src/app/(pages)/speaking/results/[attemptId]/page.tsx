"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AnswerFeedback,
  FeedbackBuilding,
} from "@/components/speaking/AnswerFeedback";
import { fetchFeedback, fetchResults, sendReport } from "@/lib/speaking/api";
import { useSpeakingStore } from "@/lib/speaking/store";
import { cn } from "@/lib/utils";
import {
  CEFR_LEVELS,
  type SpeakingFeedbackSuccess,
  type SpeakingRepeatedWord,
  type SpeakingResultsSuccess,
  type SpeakingVocabularyProfile,
} from "@/types/speaking";

const POLL_MS = 5000;

const CRITERIA: Array<{
  key: keyof SpeakingResultsSuccess["criteria"];
  label: string;
}> = [
  { key: "fluency_coherence", label: "Fluency & Coherence" },
  { key: "lexical_resource", label: "Lexical Resource" },
  { key: "grammar_accuracy", label: "Grammatical Range" },
  { key: "pronunciation", label: "Pronunciation" },
];

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

  const partObservations = extractPartObservations(result.detailed_feedback);

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

        {/* Overall band */}
        {/* Cyrillic has no small-caps tradition and reads as shouting when it
            is forced upper — so the eyebrow keeps its tracking and drops the
            case change wherever the label is Mongolian. */}
        <div className="flex items-center gap-2 pb-6 text-[12px] tracking-[0.14em] text-muted">
          <span className="h-1 w-1 rounded-full bg-mint" />
          <span className="uppercase tracking-[0.2em]">IELTS Speaking</span> ·
          үнэлгээ
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end gap-5"
        >
          <span className="font-serif text-[4.5rem] font-semibold leading-none tracking-[-0.03em] text-ink">
            {result.overall_band.toFixed(1)}
          </span>
          <div className="pb-2">
            <p className="text-[13px] text-ink-soft">Speaking band</p>
            {(result.student_name || studentName) && (
              <p className="text-[12px] text-muted">
                {result.student_name || studentName}
              </p>
            )}
          </div>
        </motion.div>

        {/* Criteria */}
        <div className="mt-11 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2">
          {CRITERIA.map(({ key, label }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
              className="bg-paper px-5 py-5"
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                {label}
              </p>
              <p className="mt-2 font-serif text-[1.7rem] font-semibold leading-none text-ink">
                {result.criteria[key]?.toFixed(1) ?? "—"}
              </p>
              <BandBar value={result.criteria[key] ?? 0} />
            </motion.div>
          ))}
        </div>

        {/* Feedback */}
        {result.feedback && (
          <section className="mt-12">
            <h2 className="font-serif text-[1.4rem] font-semibold tracking-[-0.015em] text-ink">
              AI шалгагчийн санал
            </h2>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
              {result.feedback}
            </p>
          </section>
        )}

        {partObservations.length > 0 && (
          <section className="mt-11">
            <h2 className="font-serif text-[1.4rem] font-semibold tracking-[-0.015em] text-ink">
              Хэсэг тус бүрийн ажиглалт
            </h2>
            <div className="mt-5 space-y-5">
              {partObservations.map(({ label, text }) => (
                <div key={label} className="border-l-2 border-mint-soft pl-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-mint-deep">
                    {label}
                  </p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Per-answer bands. The words themselves move to the correction
            section below once it arrives, so they are not printed twice. */}
        {result.responses.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-[1.4rem] font-semibold tracking-[-0.015em] text-ink">
              Таны хариултууд
            </h2>
            <div className="mt-5 divide-y divide-rule border-y border-rule">
              {result.responses.map((response, i) => (
                <div key={i} className="py-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-serif text-[1.02rem] leading-snug text-ink">
                      {response.question_text ?? "—"}
                    </p>
                    {response.band_score !== null && (
                      <span className="shrink-0 font-mono text-[12px] text-mint-deep">
                        {response.band_score.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {!feedback && (
                    <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
                      {response.transcript || (
                        <span className="text-muted">Бичвэр бүртгэгдээгүй.</span>
                      )}
                    </p>
                  )}
                  {response.duration !== null && (
                    <p className="mt-2 font-mono text-[11px] text-muted">
                      {response.duration}s
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Corrections */}
        {!feedback && !feedbackUnavailable && (
          <section className="mt-12">
            <h2 className="font-serif text-[1.4rem] font-semibold tracking-[-0.015em] text-ink">
              Алдаа ба засвар
            </h2>
            <FeedbackBuilding className="mt-4" />
          </section>
        )}

        {feedback && (
          <>
            {feedback.summary && (
              <section className="mt-12 rounded-lg border border-rule bg-paper-2 px-6 py-6">
                <h2 className="font-serif text-[1.4rem] font-semibold tracking-[-0.015em] text-ink">
                  Ерөнхий дүгнэлт
                </h2>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
                  {feedback.summary}
                </p>
              </section>
            )}

            {feedback.answers.length > 0 && (
              <section className="mt-12">
                <h2 className="font-serif text-[1.4rem] font-semibold tracking-[-0.015em] text-ink">
                  Алдаа ба засвар
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  <span className="text-red-600 dark:text-red-400">Улаанаар</span>{" "}
                  таны алдсан хэсэг,{" "}
                  <span className="text-mint-ink">ногооноор</span> сайн хэлсэн
                  хэсгийг тэмдэглэв.
                </p>
                <div className="mt-2 divide-y divide-rule border-y border-rule">
                  {feedback.answers.map((answer) => (
                    <AnswerFeedback key={answer.index} answer={answer} />
                  ))}
                </div>
              </section>
            )}

            {feedback.vocabulary_profile && (
              <VocabularyProfile profile={feedback.vocabulary_profile} />
            )}

            {feedback.repeated_words && feedback.repeated_words.length > 0 && (
              <RepeatedWords words={feedback.repeated_words} />
            )}

            {feedback.focus_areas.length > 0 && (
              <section className="mt-12">
                <h2 className="font-serif text-[1.4rem] font-semibold tracking-[-0.015em] text-ink">
                  Цаашид анхаарах
                </h2>
                <ol className="mt-5 flex flex-col gap-5">
                  {feedback.focus_areas.map((area, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="mt-0.5 shrink-0 font-mono text-[12px] text-mint-deep">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-[15px] font-medium text-ink">
                          {area.title}
                        </p>
                        <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">
                          {area.detail}
                        </p>
                        {area.example && (
                          <p className="mt-2 font-serif text-[14px] leading-relaxed text-mint-ink">
                            “{area.example}”
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </>
        )}

        <p className="mt-12 text-[12px] leading-relaxed text-muted">
          Энэ үнэлгээг AI гүйцэтгэсэн бөгөөд албан ёсны IELTS оноо биш болно.
        </p>
      </div>
    </div>
  );
}

/**
 * Which CEFR levels the student's vocabulary actually reached.
 *
 * The words themselves are listed, not just counted: a count on its own is a
 * number to argue with, whereas the words are the evidence for it — and the
 * B2/C1 rows double as the list worth revising.
 */
function VocabularyProfile({
  profile,
}: {
  profile: SpeakingVocabularyProfile;
}) {
  const rows = CEFR_LEVELS.map((level) => ({
    level,
    words: (profile[level] ?? []).filter((word) => word?.trim()),
  })).filter((row) => row.words.length > 0);

  if (!rows.length) return null;

  const widest = Math.max(...rows.map((row) => row.words.length));

  return (
    <section className="mt-12">
      <h2 className="font-serif text-[1.4rem] font-semibold tracking-[-0.015em] text-ink">
        Ашигласан үгсийн түвшин
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        Таны ярианд хэрэглэсэн үг, хэллэгийг CEFR түвшнээр ангилав.
      </p>

      <div className="mt-5 flex flex-col gap-5">
        {rows.map(({ level, words }) => (
          <div key={level}>
            <div className="flex items-baseline gap-3">
              <span className="w-7 shrink-0 font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-ink">
                {level}
              </span>
              <span className="font-mono text-[12px] text-mint-deep">
                {words.length}
              </span>
              <div className="ml-1 h-1 flex-1 overflow-hidden rounded-full bg-paper-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(words.length / widest) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-mint-deep"
                />
              </div>
            </div>
            <div className="ml-10 mt-2 flex flex-wrap gap-1.5">
              {words.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="rounded border border-rule bg-paper-2 px-2 py-0.5 text-[12.5px] text-ink-soft"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {profile.note && (
        <p className="mt-6 text-[14px] leading-relaxed text-ink-soft">
          {profile.note}
        </p>
      )}
    </section>
  );
}

/** Words the student leaned on, with something to reach for instead. */
function RepeatedWords({ words }: { words: SpeakingRepeatedWord[] }) {
  return (
    <section className="mt-12">
      <h2 className="font-serif text-[1.4rem] font-semibold tracking-[-0.015em] text-ink">
        Дахин давтагдсан үг
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        Хэдэн удаа хэлснийг бичвэрээс тоолов.
      </p>

      <ul className="mt-5 flex flex-col gap-4">
        {words.map((entry) => (
          <li
            key={entry.word}
            className="rounded-md border border-rule bg-paper-2 px-4 py-3.5"
          >
            <div className="flex items-baseline gap-2.5">
              <span className="text-[15px] font-medium text-ink">
                {entry.word}
              </span>
              <span className="font-mono text-[12px] text-muted">
                {entry.count}×
              </span>
            </div>

            {entry.alternatives.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {entry.alternatives.map((alternative, i) => (
                  <span
                    key={`${alternative}-${i}`}
                    className="rounded border border-mint-soft bg-mint-soft/40 px-2 py-0.5 text-[13px] text-mint-ink"
                  >
                    {alternative}
                  </span>
                ))}
              </div>
            )}

            {entry.note && (
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
                {entry.note}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function BandBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, (value / 9) * 100));
  return (
    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-paper-3">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={cn("h-full rounded-full bg-mint-deep")}
      />
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

/**
 * Holistic grading stores `{ part_observations: { part_1: "...", ... } }`.
 * Anything else (per-question mode, or a future shape) is skipped rather than
 * guessed at.
 */
function extractPartObservations(
  detailed: unknown,
): Array<{ label: string; text: string }> {
  if (!detailed || typeof detailed !== "object") return [];

  const observations = (detailed as { part_observations?: unknown })
    .part_observations;
  if (!observations || typeof observations !== "object") return [];

  return Object.entries(observations as Record<string, unknown>)
    .filter(([, text]) => typeof text === "string" && text.trim())
    .map(([key, text]) => ({
      // The grader emits `part1`; an earlier shape used `part_1`. Splitting on
      // the digit covers both — without it, `part1` rendered as "Part1".
      label: key
        .replace(/_/g, " ")
        .replace(/([a-z])(\d)/i, "$1 $2")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      text: text as string,
    }));
}
