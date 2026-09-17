"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";

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
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[640px] grid gap-12">
        {/* Brand mark */}
        <div className="flex items-center gap-3 text-ink-soft">
          <Logo size={40} priority />
          <span className="text-[12px] uppercase tracking-[0.22em]">Simulation</span>
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
