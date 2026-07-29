"use client";

import { cn } from "@/lib/utils";
import type {
  SpeakingAnswerFeedback,
  SpeakingCorrection,
} from "@/types/speaking";

const KIND_LABEL: Record<SpeakingCorrection["kind"], string> = {
  grammar: "Дүрэм",
  vocabulary: "Үгсийн сан",
  collocation: "Үг хэллэг",
  pronunciation: "Дуудлага",
  fluency: "Чөлөөт байдал",
  register: "Хэлний хэв маяг",
};

/**
 * One answer, marked up.
 *
 * The student's own words come first with the mistakes marked in red, then each
 * mistake is spelled out with the fix in green and the reason in Mongolian, and
 * finally their same answer rewritten the way it should have sounded.
 */
export function AnswerFeedback({ answer }: { answer: SpeakingAnswerFeedback }) {
  const segments = markErrors(answer.transcript, answer.corrections);

  return (
    <article className="py-7">
      <div className="flex items-baseline gap-3">
        {answer.part !== null && (
          <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-muted">
            Part {answer.part}
          </span>
        )}
        <h3 className="font-serif text-[1.05rem] leading-snug text-ink">
          {answer.question ?? "—"}
        </h3>
      </div>

      {/* What they actually said, with the mistakes marked in place. */}
      <p className="mt-4 text-[14.5px] leading-[1.85] text-ink-soft">
        {segments.map((segment, i) =>
          segment.error ? (
            <mark
              key={i}
              className="rounded-[3px] bg-red-500/12 px-[3px] text-red-600 underline decoration-red-500/45 decoration-wavy underline-offset-[3px] dark:text-red-400"
            >
              {segment.text}
            </mark>
          ) : (
            <span key={i}>{segment.text}</span>
          ),
        )}
      </p>

      {answer.corrections.length > 0 && (
        <ul className="mt-5 flex flex-col gap-3.5">
          {answer.corrections.map((correction, i) => (
            <li
              key={i}
              className="rounded-md border border-rule bg-paper-2 px-4 py-3.5"
            >
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="text-[14px] text-red-600 line-through decoration-red-500/50 dark:text-red-400">
                  {correction.original}
                </span>
                <span aria-hidden="true" className="text-[13px] text-muted">
                  →
                </span>
                <span className="text-[14px] font-medium text-mint-ink">
                  {correction.corrected}
                </span>
                <span className="ml-auto shrink-0 text-[10px] uppercase tracking-[0.16em] text-muted">
                  {KIND_LABEL[correction.kind] ?? correction.kind}
                </span>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
                {correction.explanation}
              </p>
            </li>
          ))}
        </ul>
      )}

      {answer.improved && (
        <div className="mt-5 border-l-2 border-mint pl-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-mint-deep">
            Ингэж хэлсэн бол
          </p>
          <p className="mt-1.5 font-serif text-[1rem] leading-relaxed text-mint-ink">
            {answer.improved}
          </p>
        </div>
      )}

      {answer.note && (
        <p className="mt-4 text-[13px] leading-relaxed text-muted">
          {answer.note}
        </p>
      )}
    </article>
  );
}

interface Segment {
  text: string;
  error?: boolean;
}

/**
 * Split `text` so each corrected phrase can be marked where it was said.
 *
 * The model is told to quote `original` verbatim, but a phrase it cannot place
 * is simply left unmarked — the correction below still shows it, so a missed
 * match costs emphasis, never information.
 */
export function markErrors(
  text: string,
  corrections: SpeakingCorrection[],
): Segment[] {
  const ranges: Array<{ start: number; end: number }> = [];

  for (const { original } of corrections) {
    const needle = original.trim();
    if (!needle) continue;

    // Take the first occurrence that no earlier correction already claimed, so
    // a phrase repeated across two mistakes marks two different places.
    let from = 0;
    for (;;) {
      const start = text.indexOf(needle, from);
      if (start === -1) break;

      const end = start + needle.length;
      const overlaps = ranges.some((r) => start < r.end && end > r.start);
      if (!overlaps) {
        ranges.push({ start, end });
        break;
      }
      from = start + 1;
    }
  }

  if (!ranges.length) return [{ text }];

  ranges.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const { start, end } of ranges) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start) });
    segments.push({ text: text.slice(start, end), error: true });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });

  return segments;
}

/** Shown while the model is still working, so the section isn't just absent. */
export function FeedbackBuilding({ className }: { className?: string }) {
  return (
    <p className={cn("text-[13px] leading-relaxed text-muted", className)}>
      Алдаа, засварын дэлгэрэнгүй тайланг бэлтгэж байна. Хэдэн секундын дараа
      хуудсаа сэргээхэд гарч ирнэ.
    </p>
  );
}
