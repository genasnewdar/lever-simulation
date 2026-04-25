"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

const IeltsPageInner = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStartMock = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // proceed regardless
    }
    const code = searchParams.get("code");
    router.push(
      code
        ? `/ielts/mock-exam?code=${encodeURIComponent(code)}`
        : "/ielts/mock-exam",
    );
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-[640px] grid gap-12">
        {/* Brand mark */}
        <div className="flex items-center gap-3 text-ink-soft">
          <span
            aria-hidden
            className="relative inline-flex items-center justify-center h-10 w-[78px] rounded-md bg-ink text-paper font-serif font-semibold tracking-[-0.035em] text-[15px]"
          >
            Lever
            <span
              aria-hidden
              className="absolute right-0 bottom-0 h-3 w-3"
              style={{
                background:
                  "linear-gradient(135deg, transparent 50%, var(--mint) 50%)",
                borderBottomRightRadius: "0.375rem",
              }}
            />
          </span>
          <span className="text-[12px] uppercase tracking-[0.22em]">Mock</span>
        </div>

        <div className="space-y-7">
          <h1 className="font-serif text-[clamp(2.4rem,5vw,3.6rem)] font-semibold leading-[1.04] tracking-[-0.024em] text-ink max-w-[14ch]">
            A calmer rehearsal of the real exam.
          </h1>
          <p className="text-[1.0625rem] leading-relaxed text-ink-soft max-w-[52ch]">
            Three hours, four sections, the same conditions you'll meet on test day —
            without the anxiety. Bring your code. We've got the room.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 pt-2">
          <button
            onClick={handleStartMock}
            className="group inline-flex items-center gap-2.5 h-12 px-6 rounded-md bg-ink text-paper font-medium text-[15px] tracking-tight transition-all hover:bg-ink-soft active:scale-[0.98]"
          >
            Begin
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <span className="text-[13px] text-muted">
            Fullscreen will engage on start.
          </span>
        </div>
      </div>
    </div>
  );
};

export default function IeltsPage() {
  return (
    <Suspense fallback={null}>
      <IeltsPageInner />
    </Suspense>
  );
}
