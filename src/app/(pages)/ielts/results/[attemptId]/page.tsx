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
  LogOut,
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

interface SkillScore {
  band?: number;
  raw_score?: number;
  descriptor?: string;
  status?: string;
  evaluations?: WritingEvaluation[];
  responses?: WritingResponse[];
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
  if (!band) return "text-gray-400";
  if (band >= 7) return "text-green-600";
  if (band >= 5.5) return "text-amber-600";
  return "text-red-600";
}

function bandBg(band: number | undefined): string {
  if (!band) return "bg-gray-50";
  if (band >= 7) return "bg-green-50";
  if (band >= 5.5) return "bg-amber-50";
  return "bg-red-50";
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-gray-500 font-medium">Үр дүн ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md text-center space-y-4 p-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-gray-900">{error}</h1>
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90"
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md text-center space-y-6 p-6">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Дүн гарч байна...</h1>
          <p className="text-gray-500">
            Таны шалгалт засагдаж байна. Хэдэн минутын дараа бэлэн болно.
          </p>
          <p className="text-xs text-gray-400">
            Статус: {data.attempt_status}
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/ielts")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {attempt.test_title}
            </h1>
            <p className="text-xs text-gray-500">
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

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* ── Overall Band ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border text-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Ерөнхий оноо
          </p>
          <p
            className={`text-6xl font-black ${bandColor(scores.overall.band)}`}
          >
            {scores.overall.band ?? "—"}
          </p>
          {scores.overall.descriptor && (
            <p className="text-sm text-gray-500 mt-2">
              {scores.overall.descriptor}
            </p>
          )}
        </div>

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

        {/* ── Writing Feedback ─────────────────────────────── */}
        {scores.writing.evaluations && scores.writing.evaluations.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              Writing — Дэлгэрэнгүй үнэлгээ
            </h2>

            {scores.writing.evaluations.map((ev) => {
              const isExpanded = expandedTask === ev.task_number;
              const essay = getEssayForTask(ev.task_number);
              const essayVisible = showEssay[ev.task_number] ?? false;

              return (
                <div
                  key={ev.task_number}
                  className="bg-white rounded-2xl border shadow-sm overflow-hidden"
                >
                  {/* Task header */}
                  <button
                    onClick={() =>
                      setExpandedTask(isExpanded ? null : ev.task_number)
                    }
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                        Task {ev.task_number}
                      </span>
                      <span className="text-sm text-gray-500 hidden sm:block">
                        {ev.task_prompt
                          ? ev.task_prompt.slice(0, 60) + (ev.task_prompt.length > 60 ? "..." : "")
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-2xl font-black ${bandColor(ev.overall_band)}`}
                      >
                        {ev.overall_band}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
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
                              <p className="text-xs font-medium text-gray-500 mb-1">
                                {criterionLabel(key)}
                              </p>
                              <p
                                className={`text-2xl font-black ${bandColor(score)}`}
                              >
                                {score}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary feedback */}
                      {ev.feedback && (
                        <div className="bg-blue-50 rounded-xl p-4">
                          <p className="text-sm font-semibold text-blue-800 mb-1">
                            Ерөнхий үнэлгээ
                          </p>
                          <p className="text-sm text-blue-700 leading-relaxed whitespace-pre-line">
                            {ev.feedback}
                          </p>
                        </div>
                      )}

                      {/* Per-criterion rationales */}
                      {ev.criteria_rationales && (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-gray-700">
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
                                className="bg-gray-50 rounded-xl p-4"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-semibold text-gray-700">
                                    {criterionLabel(key)}
                                  </p>
                                  <span
                                    className={`text-sm font-bold ${bandColor(score)}`}
                                  >
                                    Band {score}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
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
                          <p className="text-sm font-semibold text-gray-700">
                            Гол алдаанууд
                          </p>
                          <div className="space-y-2">
                            {ev.key_errors.map((err, i) => (
                              <div
                                key={i}
                                className="bg-red-50 rounded-xl p-4 space-y-1"
                              >
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <span className="line-through text-red-500">
                                    {err.original}
                                  </span>
                                  <span className="text-gray-400">→</span>
                                  <span className="font-semibold text-green-700">
                                    {err.correction}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">
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
                            <div className="mt-2 bg-gray-50 rounded-xl p-4">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-xs text-gray-400 font-medium">
                                  Таны бичсэн эссэ
                                </p>
                                <span className="text-xs text-gray-400">
                                  {essay.word_count} үг
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
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

        {/* ── Back + Logout buttons ────────────────────────── */}
        <div className="flex items-center justify-center gap-4 pb-8">
          <button
            onClick={() => router.push("/ielts")}
            className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Нүүр хуудас руу буцах
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/auth/logout?returnTo=/api/auth/login"
            className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Гарах
          </a>
        </div>
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
    <div className="bg-white rounded-2xl p-5 border shadow-sm text-center space-y-2">
      <div className="flex items-center justify-center gap-2 text-gray-500">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <p className={`text-3xl font-black ${bandColor(band)}`}>
        {band ?? "—"}
      </p>
      {stats && (
        <p className="text-xs text-gray-400">
          {stats.correct}/{stats.total} ({stats.percentage}%)
        </p>
      )}
    </div>
  );
}
