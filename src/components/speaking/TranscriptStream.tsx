"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import type { TranscriptLine } from "@/types/speaking";

interface TranscriptStreamProps {
  lines: TranscriptLine[];
  className?: string;
}

/**
 * The running conversation under the orb.
 *
 * Words animate in one at a time so the live transcript reads as speech being
 * heard rather than text being pasted. Older lines dim and shrink so the eye
 * stays on the current turn without the history disappearing entirely.
 */
export function TranscriptStream({ lines, className }: TranscriptStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll this box directly rather than calling `scrollIntoView` on a marker:
  // that walks up the tree and shifts scrollable ancestors too, which on a
  // short viewport drags the whole stage out of view.
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [lines]);

  // Only the tail is worth rendering — anything older is off-screen anyway.
  const visible = lines.slice(-6);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "w-full max-w-[46rem] overflow-y-auto px-6",
        // Fade the top edge so scrolled-past lines dissolve instead of clipping.
        "[mask-image:linear-gradient(to_bottom,transparent,black_18%,black_100%)]",
        className,
      )}
    >
      <div className="flex flex-col gap-5 py-6">
        <AnimatePresence initial={false}>
          {visible.map((line, index) => {
            const isLast = index === visible.length - 1;
            const isExaminer = line.speaker === "examiner";

            return (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: isLast ? 1 : 0.4, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                {/* The examiner is heard, never printed, so a speaker label
                    would sit above a column of lines that are all the
                    student's. It stays for any line that isn't theirs. */}
                {isExaminer && (
                  <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-mint-deep">
                    Examiner
                  </span>
                )}

                <p
                  className={cn(
                    "text-balance leading-relaxed",
                    isExaminer
                      ? "font-serif text-[1.35rem] text-ink"
                      : "text-[1.05rem] text-ink-soft",
                    isLast && !isExaminer && "text-ink",
                  )}
                >
                  <AnimatedWords
                    text={line.text}
                    animate={isLast}
                    dimTail={line.interim}
                  />
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface AnimatedWordsProps {
  text: string;
  /** Only the active line animates; history renders instantly. */
  animate: boolean;
  /** Interim speech-recognition results render lighter until confirmed. */
  dimTail?: boolean;
}

function AnimatedWords({ text, animate, dimTail }: AnimatedWordsProps) {
  const words = text.split(/\s+/).filter(Boolean);

  if (!animate) return <>{text}</>;

  return (
    <>
      {words.map((word, i) => (
        <motion.span
          // Index-keyed on purpose: transcripts only ever append, so a given
          // index keeps its word and never re-animates on the next update.
          key={`${i}-${word}`}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: dimTail ? 0.55 : 1, filter: "blur(0px)" }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          // inline-block collapses a trailing space, so word gaps are margin.
          className="mr-[0.28em] inline-block"
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}
