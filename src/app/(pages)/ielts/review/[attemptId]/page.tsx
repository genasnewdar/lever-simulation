"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquareHeart, Star, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { api } from "@/lib/axios";

type Category = "SUGGESTION" | "COMPLAINT" | "ERROR";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "SUGGESTION", label: "Санал" },
  { value: "COMPLAINT", label: "Гомдол" },
  { value: "ERROR", label: "Алдаа" },
];

const MIN_REVIEW = 10;

/** Opened from the link in the results email — the review is asked for once
 *  the student has their results, not while they sit waiting for them. The
 *  exam code in the link is the only key this app has. */
export default function ReviewPage() {
  const params = useParams<{ attemptId: string }>();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [category, setCategory] = useState<Category | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState<string | null>(null);

  const reviewReady = rating > 0 && content.trim().length >= MIN_REVIEW;

  const handleSubmit = async () => {
    if (!reviewReady) {
      setError("Од өгч, дор хаяж хэдэн үг сэтгэгдэл бичнэ үү.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const code = new URLSearchParams(window.location.search).get("code") ?? "";
      const res = await api.post(
        `/api/public/ielts/feedback/${params.attemptId}`,
        { rating, category: category ?? undefined, content: content.trim() },
        { headers: { "X-Exam-Code": code } },
      );
      setDiscountCode(res.data.discount_code ?? null);
      setSubmitted(true);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setSubmitted(true); // already reviewed this sitting
      } else if (isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
        setError("Линк буруу байна. И-мэйл дээрх линкээр дахин орно уу.");
      } else {
        setError("Илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        {/* Header */}
        <div className="rounded-full bg-emerald-50 p-4">
          <MessageSquareHeart
            className="h-14 w-14 text-emerald-600"
            strokeWidth={1.5}
          />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Сэтгэгдлээ үлдээгээрэй
          </h1>
          <p className="mt-2 text-base text-zinc-600">
            Simulation шалгалт ямар байсан бэ?
          </p>
        </div>

        {!submitted ? (
          /* ── Feedback form ── */
          <div className="w-full rounded-xl border border-zinc-200 bg-white px-6 py-6 flex flex-col gap-5">
            <div>
              <p className="text-sm font-semibold text-zinc-700 mb-1">
                Таны санал шалгалтыг сайжруулахад тусална
              </p>
              <p className="text-xs text-emerald-700 font-medium">
                Сэтгэгдэл бичвэл дараагийн simulation шалгалтаас 10% хөнгөлөлт авна.
              </p>
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
              placeholder="Шалгалт ямар байсан бэ? Юу таалагдсан, юуг сайжруулах вэ…"
              rows={4}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-zinc-400 resize-none"
            />

            {error && <p className="text-xs text-red-600 -mt-2">{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !reviewReady}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Илгээх
            </button>
          </div>
        ) : (
          /* ── Thanks, and the discount code ── */
          <div className="w-full flex flex-col gap-3">
            <p className="text-center text-sm text-zinc-500">
              Саналыг тань хүлээн авлаа. Баярлалаа!
            </p>
            {discountCode && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
                <p className="text-xs text-emerald-800">
                  Дараагийн simulation захиалахдаа энэ кодыг оруулаад 10% хөнгөлөлт аваарай
                </p>
                <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-emerald-900">
                  {discountCode}
                </p>
                <p className="mt-1 text-[11px] text-emerald-700">
                  Нэг удаа ашиглагдана · и-мэйлээр ч илгээсэн
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
