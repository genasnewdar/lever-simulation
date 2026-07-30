"use client";

import { cn } from "@/lib/utils";
import type {
  SpeakingAnswerFeedback,
  SpeakingCorrection,
  SpeakingHighlight,
} from "@/types/speaking";

const KIND_LABEL: Record<string, string> = {
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
 * The student's own words come first with the mistakes marked in red and the
 * phrases they got right in green, then each mistake is spelled out with the
 * fix and the reason in Mongolian, what they did well is quoted back, and
 * finally their same answer rewritten the way it should have sounded.
 */
export function AnswerFeedback({ answer }: { answer: SpeakingAnswerFeedback }) {
  const highlights = answer.highlights ?? [];
  const polish = answer.polish ?? [];
  const segments = markTranscript(
    answer.transcript,
    answer.corrections,
    highlights,
  );

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

      {/* What they actually said, marked in place. */}
      <p className="mt-4 text-[14.5px] leading-[1.85] text-ink-soft">
        {segments.map((segment, i) => {
          if (segment.tone === "error") {
            return (
              <mark
                key={i}
                className="rounded-[3px] bg-red-500/12 px-[3px] text-red-600 underline decoration-red-500/45 decoration-wavy underline-offset-[3px] dark:text-red-400"
              >
                {segment.text}
              </mark>
            );
          }
          if (segment.tone === "good") {
            return (
              <mark
                key={i}
                className="rounded-[3px] bg-mint-soft px-[3px] text-mint-ink"
              >
                {segment.text}
              </mark>
            );
          }
          return <span key={i}>{segment.text}</span>;
        })}
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
                <span className="ml-auto shrink-0 text-[11px] tracking-[0.06em] text-muted">
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

      {highlights.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] tracking-[0.08em] text-mint-deep">
            Сайн хэлсэн
          </p>
          <ul className="mt-2 flex flex-col gap-2.5">
            {highlights.map((highlight, i) => (
              <li
                key={i}
                className="rounded-md border border-mint-soft bg-mint-soft/40 px-4 py-3"
              >
                <p className="font-serif text-[14.5px] leading-relaxed text-mint-ink">
                  “{highlight.quote}”
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                  {highlight.why}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {answer.improved && (
        <div className="mt-5 border-l-2 border-mint pl-4">
          <p className="text-[11px] tracking-[0.08em] text-mint-deep">
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

      {polish.length > 0 && (
        // Deliberately the quietest block on the card: nothing here cost a
        // band, because none of it is something a speaker can get wrong.
        <div className="mt-5 rounded-md border border-dashed border-rule px-4 py-3">
          <p className="text-[11px] tracking-[0.08em] text-muted">
            Бичвэрийн өнгөлгөө · оноонд нөлөөлөөгүй
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {polish.map((note, i) => (
              <li key={i}>
                <p className="text-[13.5px] text-ink-soft">
                  <span className="text-muted">{note.original}</span>
                  <span aria-hidden="true" className="mx-2 text-muted">
                    →
                  </span>
                  <span>{note.corrected}</span>
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                  {note.explanation}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

interface Segment {
  text: string;
  tone?: "error" | "good";
}

/**
 * Split `text` so each quoted phrase can be marked where it was said.
 *
 * The model is told to quote `original` and `quote` verbatim, but a phrase it
 * cannot place is simply left unmarked — both lists are shown below either way,
 * so a missed match costs emphasis, never information. Corrections claim their
 * span first: where the two overlap, the mistake is the more useful mark.
 */
export function markTranscript(
  text: string,
  corrections: SpeakingCorrection[],
  highlights: SpeakingHighlight[] = [],
): Segment[] {
  const ranges: Array<{ start: number; end: number; tone: "error" | "good" }> =
    [];

  const claim = (phrase: string, tone: "error" | "good") => {
    const needle = phrase.trim();
    if (!needle) return;

    // Take the first occurrence nothing earlier already claimed, so a phrase
    // repeated across two entries marks two different places.
    let from = 0;
    for (;;) {
      const start = text.indexOf(needle, from);
      if (start === -1) return;

      const end = start + needle.length;
      const overlaps = ranges.some((r) => start < r.end && end > r.start);
      if (!overlaps) {
        ranges.push({ start, end, tone });
        return;
      }
      from = start + 1;
    }
  };

  for (const { original } of corrections) claim(original, "error");
  for (const { quote } of highlights) claim(quote, "good");

  if (!ranges.length) return [{ text }];

  ranges.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const { start, end, tone } of ranges) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start) });
    segments.push({ text: text.slice(start, end), tone });
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
