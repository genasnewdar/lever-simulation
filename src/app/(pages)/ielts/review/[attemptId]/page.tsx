"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Star, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/axios";

type Category = "SUGGESTION" | "COMPLAINT" | "ERROR";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "SUGGESTION", label: "Санал" },
  { value: "COMPLAINT", label: "Гомдол" },
  { value: "ERROR", label: "Алдаа" },
];

export default function FinishedPage() {
  const params = useParams<{ attemptId: string }>();
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [category, setCategory] = useState<Category | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Үнэлгээ өгнө үү.");
      return;
    }
    setError(null);
    setSubmitted(true);
    setSubmitting(true);
    try {
      await api.post("/api/student/ielts/session-feedback", {
        attempt_id: params.attemptId,
        rating,
        category: category ?? undefined,
        content: content.trim() || undefined,
        is_public: false,
      });
      setSubmitted(true);
    } catch {
      setError("Илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        {/* Header */}
        <div className="rounded-full bg-emerald-50 p-4">
          <CheckCircle2
            className="h-14 w-14 text-emerald-600"
            strokeWidth={1.5}
          />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Шалгалт дууслаа
          </h1>
          <p className="mt-2 text-base text-zinc-600">
            Маш сайн хийлээ. Та амьсгалаа аваарай.
          </p>
        </div>

        {!submitted ? (
          /* ── Feedback form ── */
          <div className="w-full rounded-xl border border-zinc-200 bg-white px-6 py-6 flex flex-col gap-5">
            <div>
              <p className="text-sm font-semibold text-zinc-700 mb-1">
                Шалгалтын туршлагаа үнэлнэ үү
              </p>
              <p className="text-xs text-zinc-400">Таны санал бидэнд чухал</p>
            </div>

            {/* Star rating */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                  aria-label={`${star} одтой`}>
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hovered || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-zinc-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Category */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() =>
                    setCategory(category === c.value ? null : c.value)
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    category === c.value
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400"
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Сэтгэгдэл бичих (заавал биш)…"
              rows={3}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-zinc-400 resize-none"
            />

            {error && <p className="text-xs text-red-600 -mt-2">{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Илгээх
            </button>
          </div>
        ) : (
          /* ── Post-feedback: go to results ── */
          <div className="w-full flex flex-col gap-3">
            {rating > 0 && (
              <p className="text-center text-sm text-zinc-500">
                Саналыг тань хүлээн авлаа. Баярлалаа!
              </p>
            )}
            <button
              type="button"
              onClick={() => router.push(`/ielts/results/${params.attemptId}`)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800">
              Үр дүн харах
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
