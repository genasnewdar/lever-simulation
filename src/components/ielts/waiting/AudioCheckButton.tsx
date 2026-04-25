"use client";

import { useRef, useState } from "react";
import { Headphones, Check } from "lucide-react";

interface Props {
  src?: string;
}

export function AudioCheckButton({ src = "/audio/audio-check.mp3" }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<"idle" | "playing" | "confirmed">("idle");

  const play = async () => {
    setState("playing");
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.addEventListener("ended", () => setState((s) => (s === "playing" ? "idle" : s)));
      audioRef.current.addEventListener("error", () => {
        setState("idle");
      });
    }
    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch {
      setState("idle");
    }
  };

  const confirm = () => setState("confirmed");

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">
        Audio Check
      </div>
      <div className="mb-1 text-sm font-medium text-zinc-900">Чихэвчээ шалгана уу</div>
      <div className="mb-3 text-xs text-zinc-600">Дуу сонсогдоход баталгаажуулна уу</div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={play}
          disabled={state === "confirmed"}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          <Headphones className="h-4 w-4" strokeWidth={1.5} />
          {state === "playing" ? "Тоглож байна..." : "Тест дуу тоглуулах"}
        </button>

        {state !== "idle" && (
          <button
            type="button"
            onClick={confirm}
            disabled={state === "confirmed"}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              state === "confirmed"
                ? "border border-emerald-300 bg-white text-emerald-700"
                : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {state === "confirmed" ? (
              <>
                <Check className="h-4 w-4" strokeWidth={1.5} /> Сонссон
              </>
            ) : (
              "Сонссон"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
