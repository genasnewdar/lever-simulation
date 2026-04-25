"use client";

import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";

const STATS: Array<{ label: string; value: number }> = [
  { label: "Listening", value: 40 },
  { label: "Reading", value: 40 },
  { label: "Writing", value: 2 },
];

export default function FinishedPage() {
  const params = useParams<{ attemptId: string }>();
  const router = useRouter();

  const goToResults = () => router.push(`/ielts/results/${params.attemptId}`);
  const goHome = () => router.push("/ielts");

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <div className="rounded-full bg-emerald-50 p-4">
          <CheckCircle2
            className="h-14 w-14 text-emerald-600"
            strokeWidth={1.5}
            aria-hidden
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

        <div className="grid w-full grid-cols-3 rounded-xl border border-zinc-200 bg-white">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center gap-1 px-3 py-4 ${
                i > 0 ? "border-l border-zinc-200" : ""
              }`}
            >
              <span className="text-2xl font-semibold text-zinc-900">{s.value}</span>
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <Clock className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          <span>
            Хариу <strong className="font-semibold">~5 минутын дараа</strong> бэлэн болно
          </span>
        </div>

        <div className="flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={goToResults}
            className="w-full rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Хариу үзэх →
          </button>
          <button
            type="button"
            onClick={goHome}
            className="w-full rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Гарах
          </button>
        </div>
      </div>
    </main>
  );
}
