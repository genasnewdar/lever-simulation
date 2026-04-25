"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import {
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  Check,
  X,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface KeyError {
  original: string;
  correction: string;
  issue: string;
}

interface CriteriaRationales {
  task_response: string | null;
  coherence_cohesion: string | null;
  lexical_resource: string | null;
  grammatical_accuracy: string | null;
}

interface WritingEvaluation {
  task_number: number;
  task_prompt: string | null;
  task_achievement: number;
  coherence_cohesion: number;
  lexical_resource: number;
  grammar_accuracy: number;
  overall_band: number;
  feedback: string;
  criteria_rationales: CriteriaRationales;
  key_errors: KeyError[];
}

interface WritingResponse {
  task_number: number;
  content: string;
  word_count: number;
}

interface ReviewOption {
  id: string;
  label: string | null;
  text: string | null;
}

interface ReviewResponse {
  question_number: number;
  question_text: string | null;
  question_category: string;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  options: ReviewOption[];
  passage_number?: number;
}

interface SkillScore {
  band?: number;
  raw_score?: number;
  descriptor?: string;
  status?: string;
  evaluations?: WritingEvaluation[];
  responses?: WritingResponse[];
  review?: ReviewResponse[];
  evaluation?: Record<string, unknown>;
}

interface Statistics {
  total: number;
  correct: number;
  incorrect: number;
  percentage: number;
}

interface ResultsData {
  status: string;
  message?: string;
  attempt_status?: string;
  attempt?: {
    id: string;
    test_title: string;
    mode: string;
    started_at: string;
    submitted_at: string;
    attempt_number: number;
  };
  scores?: {
    listening: SkillScore;
    reading: SkillScore;
    writing: SkillScore;
    speaking: SkillScore;
    overall: { band: number; descriptor: string | null };
  };
  statistics?: {
    listening: Statistics;
    reading: Statistics;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function bandColor(band: number | undefined): string {
  if (!band) return "text-muted";
  if (band >= 7) return "text-mint-deep";
  return "text-ink";
}

function bandBg(band: number | undefined): string {
  if (!band) return "bg-paper-2";
  if (band >= 7) return "bg-mint-soft";
  return "bg-paper-2";
}

function criterionLabel(key: string): string {
  const labels: Record<string, string> = {
    task_response: "Task Achievement",
    coherence_cohesion: "Coherence & Cohesion",
    lexical_resource: "Lexical Resource",
    grammatical_accuracy: "Grammatical Range & Accuracy",
  };
  return labels[key] || key;
}

function criterionScoreKey(key: string): string {
  const map: Record<string, string> = {
    task_response: "task_achievement",
    coherence_cohesion: "coherence_cohesion",
    lexical_resource: "lexical_resource",
    grammatical_accuracy: "grammar_accuracy",
  };
  return map[key] || key;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<number | null>(1);
  const [showEssay, setShowEssay] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!attemptId) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout>;

    const fetchResults = async () => {
      try {
        const res = await api.get(`/api/student/ielts/results/${attemptId}`);
        if (cancelled) return;

        if (res.data.status === "pending") {
          // Not graded yet — poll every 5s
          pollTimer = setTimeout(fetchResults, 5000);
          setData(res.data);
          setLoading(false);
          return;
        }

        setData(res.data);
        setLoading(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        if (cancelled) return;
        setError("Үр дүн ачааллахад алдаа гарлаа.");
        setLoading(false);
      }
    };

    fetchResults();

    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
    };
  }, [attemptId]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-7 h-7 animate-spin text-ink-soft" />
          <p className="text-[13px] text-ink-soft tracking-tight">Үр дүн ачааллаж байна…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-6">
        <div className="max-w-md text-center space-y-5">
          <AlertTriangle className="w-9 h-9 text-mint-deep mx-auto" />
          <h1 className="font-serif text-[1.6rem] font-semibold text-ink leading-tight">{error}</h1>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center h-10 px-5 bg-ink text-paper rounded-md text-[13px] font-medium tracking-tight hover:bg-ink-soft transition-colors"
          >
            Буцах
          </button>
        </div>
      </div>
    );
  }

  // ── Pending grading ──
  if (data?.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-6">
        <div className="max-w-md text-center space-y-5">
          <Loader2 className="w-7 h-7 animate-spin text-ink-soft mx-auto" />
          <h1 className="font-serif text-[1.6rem] font-semibold text-ink leading-tight">
            Дүн гарч байна…
          </h1>
          <p className="text-[14px] text-ink-soft leading-relaxed">
            Таны шалгалт засагдаж байна. Хэдэн минутын дараа бэлэн болно.
          </p>
          <p className="text-[11px] text-muted tracking-wider uppercase">
            {data.attempt_status}
          </p>
        </div>
      </div>
    );
  }

  if (!data?.scores || !data.attempt) return null;

  const { scores, attempt, statistics } = data;

  // Match evaluations to responses by task_number
  const getEssayForTask = (taskNum: number): WritingResponse | undefined =>
    scores.writing.responses?.find((r) => r.task_number === taskNum);

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="bg-paper/90 backdrop-blur border-b border-rule sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/ielts")}
            className="inline-flex items-center gap-2 p-1.5 -ml-1.5 rounded-md text-ink-soft hover:text-ink hover:bg-paper-2 transition-colors"
            aria-label="Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="font-serif text-[16px] font-semibold text-ink leading-tight tracking-tight truncate">
              {attempt.test_title}
            </h1>
            <p className="text-[11px] text-muted uppercase tracking-[0.18em] mt-0.5">
              {attempt.submitted_at
                ? new Date(attempt.submitted_at).toLocaleDateString("mn-MN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* ── Overall Band — editorial, no card chrome ── */}
        <section className="grid gap-3 pt-4 pb-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
            Ерөнхий оноо · Overall band
          </p>
          <p
            className={`font-serif font-semibold leading-none tracking-[-0.04em] ${bandColor(scores.overall.band)}`}
            style={{ fontSize: "clamp(5rem, 14vw, 9rem)", fontFeatureSettings: "'lnum'" }}
          >
            {scores.overall.band ?? "—"}
          </p>
          {scores.overall.descriptor && (
            <p className="text-[15px] text-ink-soft leading-relaxed max-w-[58ch]">
              {scores.overall.descriptor}
            </p>
          )}
        </section>

        <hr className="border-rule" />

        {/* ── Skill Bands Grid ─────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SkillCard
            icon={<Headphones className="w-5 h-5" />}
            label="Listening"
            band={scores.listening.band}
            stats={statistics?.listening}
          />
          <SkillCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Reading"
            band={scores.reading.band}
            stats={statistics?.reading}
          />
          <SkillCard
            icon={<PenLine className="w-5 h-5" />}
            label="Writing"
            band={scores.writing.band}
          />
          <SkillCard
            icon={<Mic className="w-5 h-5" />}
            label="Speaking"
            band={scores.speaking.band}
          />
        </div>

        {/* ── Listening Review ─────────────────────────────── */}
        {scores.listening.review && scores.listening.review.length > 0 && (
          <AnswerReviewSection
            icon={<Headphones className="w-5 h-5" />}
            title="Listening — Хариултын задаргаа"
            review={scores.listening.review}
          />
        )}

        {/* ── Reading Review ───────────────────────────────── */}
        {scores.reading.review && scores.reading.review.length > 0 && (
          <AnswerReviewSection
            icon={<BookOpen className="w-5 h-5" />}
            title="Reading — Хариултын задаргаа"
            review={scores.reading.review}
            groupByPassage
          />
        )}

        {/* ── Writing Feedback ─────────────────────────────── */}
        {scores.writing.evaluations && scores.writing.evaluations.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-ink">
              Writing — Дэлгэрэнгүй үнэлгээ
            </h2>

            {scores.writing.evaluations.map((ev) => {
              const isExpanded = expandedTask === ev.task_number;
              const essay = getEssayForTask(ev.task_number);
              const essayVisible = showEssay[ev.task_number] ?? false;

              return (
                <div
                  key={ev.task_number}
                  className="bg-paper-2 rounded-lg border border-rule overflow-hidden"
                >
                  {/* Task header */}
                  <button
                    onClick={() =>
                      setExpandedTask(isExpanded ? null : ev.task_number)
                    }
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-paper-2 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                        Task {ev.task_number}
                      </span>
                      <span className="text-sm text-muted hidden sm:block">
                        {ev.task_prompt
                          ? ev.task_prompt.slice(0, 60) + (ev.task_prompt.length > 60 ? "..." : "")
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-2xl font-semibold ${bandColor(ev.overall_band)}`}
                      >
                        {ev.overall_band}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-5 border-t">
                      {/* Criterion scores */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                        {(
                          [
                            "task_response",
                            "coherence_cohesion",
                            "lexical_resource",
                            "grammatical_accuracy",
                          ] as const
                        ).map((key) => {
                          const scoreKey = criterionScoreKey(key);
                          const score = (ev as unknown as Record<string, number>)[
                            scoreKey
                          ];
                          return (
                            <div
                              key={key}
                              className={`rounded-xl p-3 text-center ${bandBg(score)}`}
                            >
                              <p className="text-xs font-medium text-muted mb-1">
                                {criterionLabel(key)}
                              </p>
                              <p
                                className={`text-2xl font-semibold ${bandColor(score)}`}
                              >
                                {score}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary feedback */}
                      {ev.feedback && (
                        <div className="bg-paper-3 rounded-xl p-4">
                          <p className="text-sm font-semibold text-ink mb-1">
                            Ерөнхий үнэлгээ
                          </p>
                          <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line">
                            {ev.feedback}
                          </p>
                        </div>
                      )}

                      {/* Per-criterion rationales */}
                      {ev.criteria_rationales && (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-ink-soft">
                            Шалгуур тус бүрийн тайлбар
                          </p>
                          {(
                            [
                              "task_response",
                              "coherence_cohesion",
                              "lexical_resource",
                              "grammatical_accuracy",
                            ] as const
                          ).map((key) => {
                            const rationale =
                              ev.criteria_rationales[key];
                            if (!rationale) return null;
                            const scoreKey = criterionScoreKey(key);
                            const score = (ev as unknown as Record<string, number>)[
                              scoreKey
                            ];
                            return (
                              <div
                                key={key}
                                className="bg-paper-2 rounded-xl p-4"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-semibold text-ink-soft">
                                    {criterionLabel(key)}
                                  </p>
                                  <span
                                    className={`text-sm font-semibold ${bandColor(score)}`}
                                  >
                                    Band {score}
                                  </span>
                                </div>
                                <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line">
                                  {rationale}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Key errors */}
                      {ev.key_errors && ev.key_errors.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-ink-soft">
                            Гол алдаанууд
                          </p>
                          <div className="space-y-2">
                            {ev.key_errors.map((err, i) => (
                              <div
                                key={i}
                                className="bg-paper-3 rounded-xl p-4 space-y-1"
                              >
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <span className="line-through text-mint-deep">
                                    {err.original}
                                  </span>
                                  <span className="text-muted">→</span>
                                  <span className="font-semibold text-mint-deep">
                                    {err.correction}
                                  </span>
                                </div>
                                <p className="text-xs text-muted">
                                  {err.issue}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Student's essay (collapsible) */}
                      {essay && (
                        <div>
                          <button
                            onClick={() =>
                              setShowEssay((prev) => ({
                                ...prev,
                                [ev.task_number]: !prev[ev.task_number],
                              }))
                            }
                            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            {essayVisible ? "Эссэ нуух" : "Миний эссэ харах"}
                            {essayVisible ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          {essayVisible && (
                            <div className="mt-2 bg-paper-2 rounded-xl p-4">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-xs text-muted font-medium">
                                  Таны бичсэн эссэ
                                </p>
                                <span className="text-xs text-muted">
                                  {essay.word_count} үг
                                </span>
                              </div>
                              <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">
                                {essay.content}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        <div className="flex items-center justify-center gap-4 pb-8">
          <button
            onClick={() => router.push("/ielts")}
            className="px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Нүүр хуудас руу буцах
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AnswerReviewSection ──────────────────────────────────────────────────────

function formatAnswerDisplay(
  raw: string,
  options: ReviewOption[],
): string {
  if (!raw) return "—";
  if (!options.length) return raw;

  const byId = new Map(options.map((o) => [o.id, o]));
  const byLabel = new Map(
    options.filter((o) => o.label).map((o) => [o.label as string, o]),
  );

  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const resolved = parts.map((p) => {
    const opt = byId.get(p) || byLabel.get(p);
    if (!opt) return p;
    const label = opt.label ?? "";
    const text = opt.text ?? "";
    if (label && text) return `${label}. ${text}`;
    return text || label || p;
  });

  return resolved.join(", ");
}

function AnswerReviewSection({
  icon,
  title,
  review,
  groupByPassage = false,
}: {
  icon: React.ReactNode;
  title: string;
  review: ReviewResponse[];
  groupByPassage?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [incorrectOnly, setIncorrectOnly] = useState(false);

  const total = review.length;
  const correctCount = review.filter((r) => r.is_correct).length;
  const incorrectCount = total - correctCount;

  const visible = incorrectOnly
    ? review.filter((r) => !r.is_correct)
    : review;

  const groups = groupByPassage
    ? Array.from(
        visible.reduce<Map<number | null, ReviewResponse[]>>((acc, r) => {
          const key = r.passage_number ?? null;
          const arr = acc.get(key) ?? [];
          arr.push(r);
          acc.set(key, arr);
          return acc;
        }, new Map()),
      ).sort(([a], [b]) => (a ?? 0) - (b ?? 0))
    : [[null, visible] as const];

  return (
    <section className="bg-paper-2 rounded-lg border border-rule overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-paper-2 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-muted shrink-0">{icon}</span>
          <h2 className="text-base font-semibold text-ink truncate">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-mint-deep bg-mint-soft px-2.5 py-1 rounded-full tabular-nums">
            {correctCount} зөв
          </span>
          <span className="text-xs font-semibold text-ink bg-paper-3 px-2.5 py-1 rounded-full tabular-nums">
            {incorrectCount} буруу
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-muted" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t">
          {/* Filter toggle */}
          <div className="px-6 py-3 border-b bg-paper-2 flex items-center justify-between">
            <p className="text-xs text-muted">
              {incorrectOnly
                ? `Зөвхөн буруу хариултууд (${incorrectCount})`
                : `Бүх асуулт (${total})`}
            </p>
            <div className="inline-flex rounded-md bg-paper-2 border border-rule overflow-hidden text-xs font-semibold">
              <button
                onClick={() => setIncorrectOnly(false)}
                className={`px-3 py-1.5 transition-colors ${
                  !incorrectOnly
                    ? "bg-primary text-white"
                    : "text-ink-soft hover:bg-paper-2"
                }`}
              >
                Бүгд
              </button>
              <button
                onClick={() => setIncorrectOnly(true)}
                className={`px-3 py-1.5 transition-colors ${
                  incorrectOnly
                    ? "bg-primary text-white"
                    : "text-ink-soft hover:bg-paper-2"
                }`}
              >
                Зөвхөн буруу
              </button>
            </div>
          </div>

          {/* Review list */}
          <div className="divide-y">
            {groups.map(([passageNum, rows]) => (
              <div key={passageNum ?? "all"}>
                {groupByPassage && passageNum != null && (
                  <div className="px-6 py-2 bg-paper-2 text-xs font-semibold text-muted uppercase tracking-wide">
                    Passage {passageNum}
                  </div>
                )}
                {rows.length === 0 ? (
                  <div className="px-6 py-6 text-sm text-muted text-center">
                    Буруу хариулт алга.
                  </div>
                ) : (
                  rows.map((r) => (
                    <ReviewRow key={r.question_number} item={r} />
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ReviewRow({ item }: { item: ReviewResponse }) {
  const studentDisplay = formatAnswerDisplay(item.student_answer, item.options);
  const correctDisplay = formatAnswerDisplay(item.correct_answer, item.options);

  return (
    <div
      className={`px-6 py-4 flex gap-4 ${
        item.is_correct ? "bg-white" : "bg-paper-3"
      }`}
    >
      <div className="flex flex-col items-center gap-1 shrink-0 w-10">
        <span className="text-xs font-semibold text-muted tabular-nums">
          {item.question_number}
        </span>
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center ${
            item.is_correct
              ? "bg-green-100 text-mint-deep"
              : "bg-paper-3 text-ink"
          }`}
          aria-label={item.is_correct ? "Зөв" : "Буруу"}
        >
          {item.is_correct ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
        </span>
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {item.question_text && (
          <p className="text-sm text-ink-soft leading-snug">
            {item.question_text}
          </p>
        )}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className="bg-paper-2 rounded-lg px-3 py-2">
            <dt className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-0.5">
              Таны хариулт
            </dt>
            <dd
              className={`font-medium break-words ${
                item.is_correct ? "text-ink" : "text-ink"
              }`}
            >
              {studentDisplay}
            </dd>
          </div>
          <div className="bg-mint-soft rounded-lg px-3 py-2">
            <dt className="text-[11px] font-semibold text-mint-deep uppercase tracking-wide mb-0.5">
              Зөв хариулт
            </dt>
            <dd className="font-medium text-mint-ink break-words">
              {correctDisplay}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

// ── SkillCard ────────────────────────────────────────────────────────────────

function SkillCard({
  icon,
  label,
  band,
  stats,
}: {
  icon: React.ReactNode;
  label: string;
  band?: number;
  stats?: Statistics;
}) {
  return (
    <div className="bg-paper-2 rounded-lg p-5 border border-rule">
      <div className="flex items-center gap-2 text-muted mb-3">
        <span className="text-ink-soft">{icon}</span>
        <span className="text-[11px] uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p
        className={`font-serif font-semibold leading-none tracking-[-0.022em] ${bandColor(band)}`}
        style={{ fontSize: "2.4rem" }}
      >
        {band ?? "—"}
      </p>
      {stats && (
        <p className="text-[12px] text-muted mt-2 tabular-nums">
          {stats.correct}/{stats.total} <span className="opacity-60">·</span> {stats.percentage}%
        </p>
      )}
    </div>
  );
}
