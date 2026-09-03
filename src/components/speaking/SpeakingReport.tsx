"use client";

import { motion } from "framer-motion";

import { AnswerFeedback, FeedbackBuilding } from "@/components/speaking/AnswerFeedback";
import { cn } from "@/lib/utils";
import {
  CEFR_LEVELS,
  type SpeakingFeedbackSuccess,
  type SpeakingRepeatedWord,
  type SpeakingResultsSuccess,
  type SpeakingVocabularyProfile,
} from "@/types/speaking";

const CRITERIA: Array<{
  key: keyof SpeakingResultsSuccess["criteria"];
  label: string;
}> = [
  { key: "fluency_coherence", label: "Fluency & Coherence" },
  { key: "lexical_resource", label: "Lexical Resource" },
  { key: "grammar_accuracy", label: "Grammatical Range" },
  { key: "pronunciation", label: "Pronunciation" },
];

/**
 * The whole speaking verdict: bands, the examiner's prose, the answers, and
 * the correction-level feedback once it lands.
 *
 * One component because a candidate's speaking result is the same result
 * whichever door they came in by — a speaking-only sitting shows it on its own
 * page, a four-skill sitting shows it under Listening, Reading and Writing, and
 * the mailed PDF carries the same material. Two renderings of it drifted apart
 * once already: the sitting's results page showed a band number and nothing
 * else, so the feedback a student had just been graded on reached them only by
 * email.
 */
export function SpeakingReport({
  result,
  feedback,
  feedbackUnavailable = false,
  showBand = true,
  studentName,
  className,
}: {
  result: SpeakingResultsSuccess;
  feedback: SpeakingFeedbackSuccess | null;
  /** True once the server has said corrections will not be coming. */
  feedbackUnavailable?: boolean;
  /** Off where the page already carries the band in its own summary. */
  showBand?: boolean;
  studentName?: string | null;
  className?: string;
}) {
  const partObservations = extractPartObservations(result.detailed_feedback);
  const name = result.student_name || studentName;

  return (
    <div className={className}>
      {showBand && (
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
            {name && <p className="text-[12px] text-muted">{name}</p>}
          </div>
        </motion.div>
      )}

      {/* Criteria */}
      <div
        className={cn(
          "grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2",
          showBand ? "mt-11" : "mt-0",
        )}
      >
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
        className="h-full rounded-full bg-mint-deep"
      />
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

export default SpeakingReport;
