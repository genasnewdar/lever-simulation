"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, Mic, MicOff, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Level a voice has to clear to count as speech rather than room noise. */
const SPEECH_LEVEL = 0.12;
/** How long it has to stay there. Long enough that a door slam is not a voice. */
const SPEECH_MS = 400;

type Stage = "intro" | "connecting" | "checking" | "ready" | "denied";

interface MicCheckProps {
  /** Open the mic and start metering. Resolves false if permission is refused. */
  onConnect: () => Promise<boolean>;
  /** Current input level, 0..1, read straight off the analyser. */
  getLevel: () => number;
  /** Play a line in the examiner's voice so output can be checked too. */
  onTestVoice: () => Promise<void>;
  /** Everything works — start the exam. */
  onBegin: () => void;
  recognitionSupported: boolean;
}

/**
 * The gate in front of the exam.
 *
 * It used to ask for the microphone and take permission as proof it worked,
 * which it is not: a muted input, the wrong default device, or a dead headset
 * all grant permission and then record silence for the whole test. Nothing here
 * unlocks until the student's own voice has actually moved the meter.
 */
export function MicCheck({
  onConnect,
  getLevel,
  onTestVoice,
  onBegin,
  recognitionSupported,
}: MicCheckProps) {
  const [stage, setStage] = useState<Stage>("intro");
  const [level, setLevel] = useState(0);
  const [voiceTested, setVoiceTested] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);

  const rafRef = useRef<number | null>(null);
  const aboveSinceRef = useRef<number | null>(null);

  const connect = useCallback(async () => {
    setStage("connecting");
    const ok = await onConnect();
    setStage(ok ? "checking" : "denied");
  }, [onConnect]);

  // Watch the meter until a real voice shows up, then stop watching for it —
  // `ready` is a one-way door, so a student who stops talking to read the
  // screen does not fall back to "we cannot hear you".
  useEffect(() => {
    if (stage !== "checking") return;

    const tick = () => {
      const current = getLevel();
      setLevel(current);

      if (current >= SPEECH_LEVEL) {
        const since = aboveSinceRef.current ?? Date.now();
        aboveSinceRef.current = since;
        if (Date.now() - since >= SPEECH_MS) {
          setStage("ready");
          return;
        }
      } else {
        aboveSinceRef.current = null;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [getLevel, stage]);

  // Keep the meter alive once ready, so the bar still answers to their voice
  // while they run the speaker test.
  useEffect(() => {
    if (stage !== "ready") return;

    const tick = () => {
      setLevel(getLevel());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [getLevel, stage]);

  const testVoice = useCallback(async () => {
    setVoicePlaying(true);
    try {
      await onTestVoice();
    } finally {
      setVoicePlaying(false);
      setVoiceTested(true);
    }
  }, [onTestVoice]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-[440px]">
        <div className="flex items-center gap-2 pb-7 text-[12px] tracking-[0.14em] text-muted">
          <span className="h-1 w-1 rounded-full bg-mint" />
          Бэлтгэл
        </div>

        <h1 className="font-serif text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.022em] text-ink">
          Эхлэхэд бэлэн үү?
        </h1>
        <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-ink-soft">
          Шалгагч асуултаа асууна, дараа нь таны ээлж ирнэ. Товч дараад хариулж
          эхэлж, ярьж дуусаад дахин дарна. Эхлээд микрофоноо шалгая.
        </p>

        {stage === "intro" && (
          <Button
            onClick={connect}
            className="mt-9 h-11 w-full rounded-md bg-ink text-[14px] font-medium tracking-tight text-paper hover:bg-ink-soft active:scale-[0.99]"
          >
            <Mic className="mr-2 h-4 w-4" />
            Микрофон шалгах
          </Button>
        )}

        {stage === "connecting" && (
          <p className="mt-9 inline-flex items-center gap-2 text-[13px] text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Микрофон холбож байна…
          </p>
        )}

        {stage === "denied" && (
          <div className="mt-9">
            <p className="inline-flex items-start gap-2 text-[13px] leading-relaxed text-red-500">
              <MicOff className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Микрофоны зөвшөөрөл олгогдсонгүй. Хөтчийн хаягийн мөрөнд байгаа
                түгжээний тэмдгээс микрофоныг зөвшөөрөөд дахин оролдоно уу.
              </span>
            </p>
            <Button
              onClick={connect}
              variant="ghost"
              className="mt-5 h-10 rounded-md px-5 text-[13px] text-ink-soft hover:bg-paper-2 hover:text-ink"
            >
              Дахин оролдох
            </Button>
          </div>
        )}

        {(stage === "checking" || stage === "ready") && (
          <div className="mt-9">
            <LevelMeter level={level} passed={stage === "ready"} />

            <p
              className={cn(
                "mt-4 inline-flex items-center gap-2 text-[13.5px] leading-relaxed",
                stage === "ready" ? "text-mint-ink" : "text-ink-soft",
              )}
            >
              {stage === "ready" ? (
                <>
                  <Check className="h-4 w-4 shrink-0" />
                  Микрофон хэвийн ажиллаж байна.
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 shrink-0 animate-pulse" />
                  Хэвийн дуугаараа “Hello, my name is …” гэж хэлээрэй.
                </>
              )}
            </p>

            {stage === "ready" && (
              <>
                <div className="mt-7 border-t border-rule pt-6">
                  <p className="text-[13.5px] leading-relaxed text-ink-soft">
                    Шалгагчийн дуу сонсогдож байгааг бас шалгая.
                  </p>
                  <Button
                    onClick={testVoice}
                    disabled={voicePlaying}
                    variant="ghost"
                    className="mt-3 h-10 rounded-md border border-rule px-5 text-[13px] text-ink-soft hover:bg-paper-2 hover:text-ink"
                  >
                    {voicePlaying ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : voiceTested ? (
                      <Check className="mr-2 h-3.5 w-3.5 text-mint-deep" />
                    ) : (
                      <Volume2 className="mr-2 h-3.5 w-3.5" />
                    )}
                    {voiceTested ? "Дахин сонсох" : "Дууг шалгах"}
                  </Button>
                  {voiceTested && (
                    <p className="mt-3 text-[12px] leading-relaxed text-muted">
                      Сонсогдоогүй бол чанга яригчийн дууг нэмээд дахин
                      шалгаарай.
                    </p>
                  )}
                </div>

                <Button
                  onClick={onBegin}
                  className="mt-8 h-11 w-full rounded-md bg-ink text-[14px] font-medium tracking-tight text-paper hover:bg-ink-soft active:scale-[0.99]"
                >
                  Шалгалт эхлүүлэх
                </Button>
              </>
            )}
          </div>
        )}

        {!recognitionSupported && (
          <p className="mt-7 max-w-[42ch] text-[12px] leading-relaxed text-muted">
            Энэ хөтөч дээр яриа тань дэлгэц дээр шууд бичигдэж харагдахгүй.
            Шалгалт хэвийн үргэлжилж, бичлэгийг сервер дээр хөрвүүлж дүгнэнэ.
          </p>
        )}
      </div>
    </div>
  );
}

/** Input level as a bar, with the line a voice has to cross marked on it. */
function LevelMeter({ level, passed }: { level: number; passed: boolean }) {
  const width = Math.min(100, Math.round(level * 100));

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-paper-3">
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-75",
          passed || level >= SPEECH_LEVEL ? "bg-mint-deep" : "bg-ink-soft",
        )}
        style={{ width: `${width}%` }}
      />
      {!passed && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 w-px bg-rule"
          style={{ left: `${SPEECH_LEVEL * 100}%` }}
        />
      )}
    </div>
  );
}
