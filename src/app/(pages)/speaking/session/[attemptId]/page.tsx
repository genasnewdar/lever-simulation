"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { AlertTriangle, Loader2, Mic, MicOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PushToTalk } from "@/components/speaking/PushToTalk";
import { SpeakingOrb } from "@/components/speaking/SpeakingOrb";
import { TranscriptStream } from "@/components/speaking/TranscriptStream";
import {
  completeSession,
  fetchNextTurn,
  markPrepDone,
  startSession,
  submitTurn,
  uploadTurnAudio,
} from "@/lib/speaking/api";
import { useSpeakingStore } from "@/lib/speaking/store";
import { useExaminerVoice } from "@/lib/speaking/useExaminerVoice";
import { useSpeechRecognition } from "@/lib/speaking/useSpeechRecognition";
import { useVoiceRecorder } from "@/lib/speaking/useVoiceRecorder";
import { cn } from "@/lib/utils";
import type {
  SessionPhase,
  SpeakingTurn,
  TranscriptLine,
} from "@/types/speaking";

const PART_LABEL: Record<number, string> = {
  1: "Part 1 · Introduction",
  2: "Part 2 · Long turn",
  3: "Part 3 · Discussion",
};

/** A student turn that has been announced but not yet spoken into. */
interface ArmedTurn {
  turnId: string;
  limitSeconds: number;
  part: number;
}

/**
 * Orb size for the current viewport.
 *
 * The stage does not scroll, so a fixed 320px orb eats the height the
 * transcript needs and pushes the conversation off a laptop screen entirely.
 * Everything around the orb is a fixed cost — header, status, controls — so the
 * orb is what gives way.
 */
function useOrbSize() {
  // 320 matches the design on a full-height window; the hook only shrinks it.
  const [size, setSize] = useState(320);

  useEffect(() => {
    const measure = () => {
      const height = window.innerHeight;
      if (height >= 900) setSize(320);
      else if (height >= 800) setSize(280);
      else if (height >= 700) setSize(240);
      else setSize(200);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return size;
}

export default function SpeakingSessionPage() {
  const router = useRouter();
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;

  const { examCode, attemptId: storedAttemptId } = useSpeakingStore();

  const recorder = useVoiceRecorder();
  const recognition = useSpeechRecognition();
  const voice = useExaminerVoice();
  const orbSize = useOrbSize();

  const [phase, setPhase] = useState<SessionPhase>("connecting");
  const [started, setStarted] = useState(false);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [part, setPart] = useState(1);
  const [progress, setProgress] = useState({ index: 0, total: 0 });
  const [cueCard, setCueCard] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Session data the async flow reads — refs, not state, so an in-flight turn
  // never acts on a stale render.
  const activeTurnRef = useRef<SpeakingTurn | null>(null);
  const armedTurnRef = useRef<ArmedTurn | null>(null);
  const recordingStartRef = useRef<number>(0);
  const studentLineIdRef = useRef<string | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const finishedRef = useRef(false);
  const bootedRef = useRef(false);

  /** Latest flow callbacks, so timers and key handlers never call a stale one. */
  const flowRef = useRef({
    advance: async () => {},
    startSpeaking: async () => {},
    endTurn: async () => {},
    endPrep: async () => {},
  });

  useEffect(() => {
    if (!examCode || storedAttemptId !== attemptId) {
      router.replace("/speaking");
    }
  }, [examCode, storedAttemptId, attemptId, router]);

  // ── Transcript helpers ────────────────────────────────────────────────────

  const pushLine = useCallback((line: Omit<TranscriptLine, "id">) => {
    const id = `${line.speaker}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
    setLines((prev) => [...prev, { ...line, id }]);
    return id;
  }, []);

  // Mirror live recognition into the student's current line.
  useEffect(() => {
    const lineId = studentLineIdRef.current;
    if (phase !== "listening" || !lineId) return;

    const text = [recognition.finalText, recognition.interimText]
      .filter(Boolean)
      .join(" ")
      .trim();

    setLines((prev) =>
      prev.map((line) =>
        line.id === lineId
          ? { ...line, text, interim: Boolean(recognition.interimText) }
          : line,
      ),
    );
  }, [recognition.finalText, recognition.interimText, phase]);

  // ── Turn flow ─────────────────────────────────────────────────────────────

  const failSession = useCallback((message: string) => {
    setPhase("error");
    setErrorMessage(message);
    deadlineRef.current = null;
    setRemaining(null);
  }, []);

  const finishSession = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    deadlineRef.current = null;
    setRemaining(null);
    setPhase("complete");
    voice.cancel();
    recorder.release();

    try {
      await completeSession(attemptId);
    } catch {
      // The session is over either way; results will report if grading failed.
      toast.warning("Дүгнэлт эхлүүлэхэд саатал гарлаа. Үр дүнг шалгана уу.");
    }
    router.push(`/speaking/results/${attemptId}`);
  }, [attemptId, recorder, router, voice]);

  /**
   * Hand the turn to the student without opening the mic.
   *
   * Recording is theirs to start — the clock only runs while they actually
   * hold the control, so thinking time is never charged against the answer.
   */
  const armTurn = useCallback(
    (turnId: string, timeLimitSeconds: number, turnPart: number) => {
      armedTurnRef.current = {
        turnId,
        limitSeconds: timeLimitSeconds > 0 ? timeLimitSeconds : 45,
        part: turnPart,
      };
      setLocked(false);
      setRemaining(armedTurnRef.current.limitSeconds);
      deadlineRef.current = null;
      setPhase("awaiting");
    },
    [],
  );

  /** The student pressed and held — start capturing. */
  const startSpeaking = useCallback(async () => {
    const armed = armedTurnRef.current;
    if (!armed || busyRef.current) return;

    const ok = await recorder.start();
    if (!ok) {
      failSession(
        "Микрофон ажиллахгүй байна. Зөвшөөрлөө шалгаад дахин оролдоно уу.",
      );
      return;
    }
    recognition.start();

    recordingStartRef.current = Date.now();
    studentLineIdRef.current = pushLine({
      speaker: "student",
      text: "",
      part: armed.part,
      interim: true,
    });

    deadlineRef.current = Date.now() + armed.limitSeconds * 1000;
    setRemaining(armed.limitSeconds);
    setPhase("listening");
  }, [failSession, pushLine, recognition, recorder]);

  const handleTurn = useCallback(
    async (turn: SpeakingTurn) => {
      activeTurnRef.current = turn;
      setPart(turn.part);
      setProgress((prev) => ({ ...prev, index: turn.turn_index }));

      if (turn.turn_type === "EXAMINER_SPEECH") {
        setCueCard(null);
        setRemaining(null);
        setPhase("examiner_speaking");
        const text = turn.examiner_text ?? "";
        if (text) pushLine({ speaker: "examiner", text, part: turn.part });
        await voice.speak(text, turn.examiner_audio_url);
        await flowRef.current.advance();
        return;
      }

      if (turn.turn_type === "PREP") {
        setPhase("prep");
        setCueCard(turn.cue_card);
        deadlineRef.current = Date.now() + turn.prep_time_seconds * 1000;
        setRemaining(turn.prep_time_seconds);
        return;
      }

      // STUDENT_RESPONSE — the question text lives on the turn itself, so the
      // examiner reads it here before handing over.
      setCueCard(turn.cue_card);
      setRemaining(null);
      setPhase("examiner_speaking");
      const question = turn.question_text ?? "";
      if (question) {
        pushLine({ speaker: "examiner", text: question, part: turn.part });
        await voice.speak(question, turn.examiner_audio_url);
      }
      armTurn(turn.turn_id, turn.time_limit_seconds, turn.part);
    },
    [armTurn, pushLine, voice],
  );

  const advance = useCallback(async () => {
    if (finishedRef.current) return;
    try {
      const next = await fetchNextTurn(attemptId);
      if ("session_complete" in next && next.session_complete) {
        await finishSession();
        return;
      }
      await handleTurn(next as SpeakingTurn);
    } catch {
      failSession("Шалгалтыг үргэлжлүүлэхэд алдаа гарлаа.");
    }
  }, [attemptId, failSession, finishSession, handleTurn]);

  /** Close the mic, submit the answer, move on. */
  const endTurn = useCallback(async () => {
    if (busyRef.current) return;
    const turn = activeTurnRef.current;
    if (!turn || turn.turn_type !== "STUDENT_RESPONSE") return;

    busyRef.current = true;
    armedTurnRef.current = null;
    deadlineRef.current = null;
    setRemaining(null);
    setLocked(false);
    setPhase("submitting");

    const transcript = recognition.stop();
    const blob = await recorder.stop();
    const duration = Math.round((Date.now() - recordingStartRef.current) / 1000);

    const lineId = studentLineIdRef.current;
    if (lineId) {
      setLines((prev) =>
        prev.map((line) =>
          line.id === lineId
            ? {
                ...line,
                interim: false,
                // An empty transcript is not a lost answer: the recording is
                // uploaded either way and lever-edu transcribes it before
                // grading. Say that, rather than implying nothing was heard.
                text:
                  transcript ||
                  line.text ||
                  "(бичлэг хадгалагдсан — бичвэр рүү сервер дээр хөрвүүлэгдэнэ)",
              }
            : line,
        ),
      );
    }
    studentLineIdRef.current = null;

    try {
      await submitTurn(attemptId, turn.turn_id, {
        transcript: transcript || null,
        duration,
      });

      // Audio is evidence, not the grading input — never block the next
      // question on it. lever-edu transcribes it server-side if needed.
      if (blob) {
        uploadTurnAudio(attemptId, turn.turn_id, blob).catch(() => {});
      }

      busyRef.current = false;
      await advance();
    } catch {
      busyRef.current = false;
      failSession("Хариултыг илгээхэд алдаа гарлаа.");
    }
  }, [advance, attemptId, failSession, recognition, recorder]);

  /** Part 2 — prep is over (tapped early or ran out), hand over the turn. */
  const endPrep = useCallback(async () => {
    if (busyRef.current) return;
    const turn = activeTurnRef.current;
    if (!turn || turn.turn_type !== "PREP") return;

    busyRef.current = true;
    deadlineRef.current = null;
    setRemaining(null);

    try {
      const result = await markPrepDone(attemptId, turn.turn_id);

      // prep-done activates the response turn server-side; adopt it directly
      // instead of calling next-turn, which would skip past it.
      activeTurnRef.current = {
        turn_id: result.turn_id,
        turn_type: "STUDENT_RESPONSE",
        turn_index: turn.turn_index + 1,
        part: turn.part,
        session_complete: false,
        question_id: null,
        question_text: result.question_text,
        cue_card: turn.cue_card,
        time_limit_seconds: result.time_limit_seconds,
        recording_started_at: result.recording_starts_at,
      };

      busyRef.current = false;
      armTurn(result.turn_id, result.time_limit_seconds, turn.part);
    } catch {
      busyRef.current = false;
      failSession("Бэлтгэл дуусгахад алдаа гарлаа.");
    }
  }, [armTurn, attemptId, failSession]);

  flowRef.current = { advance, startSpeaking, endTurn, endPrep };

  // Stable identities: PushToTalk keeps window key listeners keyed to these, so
  // inline arrows would resubscribe on every render.
  const handleTalkStart = useCallback(() => {
    flowRef.current.startSpeaking();
  }, []);
  const handleTalkLock = useCallback(() => setLocked(true), []);
  const handleTalkFinish = useCallback(() => {
    flowRef.current.endTurn();
  }, []);

  // ── Countdown ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "listening" && phase !== "prep") return;

    const interval = window.setInterval(() => {
      const deadline = deadlineRef.current;
      if (!deadline) return;

      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);

      if (left === 0) {
        deadlineRef.current = null;
        if (phase === "prep") flowRef.current.endPrep();
        else flowRef.current.endTurn();
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [phase]);

  // ── Boot ──────────────────────────────────────────────────────────────────

  const handleBegin = useCallback(async () => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    setStarted(true);

    // Before any await, while this click still counts as the gesture that
    // lets audio play.
    voice.prime();

    const micReady = await recorder.prepare();
    if (!micReady) {
      failSession(
        "Микрофоны зөвшөөрөл олгогдоогүй байна. Хөтчийн тохиргоог шалгаад дахин оролдоно уу.",
      );
      return;
    }

    try {
      const session = await startSession(attemptId);
      setProgress({ index: 0, total: session.total_turns });
      await advance();
    } catch (err) {
      const detail =
        typeof err === "object" && err && "response" in err
          ? ((err as { response?: { data?: { detail?: string } } }).response
              ?.data?.detail ?? null)
          : null;
      failSession(detail || "Ярианы шалгалт эхлүүлэх боломжгүй байна.");
    }
  }, [advance, attemptId, failSession, recorder, voice]);

  useEffect(() => {
    return () => {
      voice.cancel();
      recorder.release();
    };
    // Unmount-only cleanup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  const orbMode =
    phase === "examiner_speaking"
      ? "examiner"
      : phase === "listening" || phase === "awaiting"
        ? "student"
        : phase === "submitting" || phase === "connecting"
          ? "thinking"
          : "idle";

  const orbLevel =
    phase === "listening"
      ? recorder.level
      : phase === "examiner_speaking"
        ? voice.level
        : 0;

  const showPushToTalk = phase === "awaiting" || phase === "listening";

  if (!started) {
    return (
      <ReadyGate
        onBegin={handleBegin}
        recognitionSupported={recognition.supported}
      />
    );
  }

  // The stage deliberately carries no `overflow-hidden`: it silently clipped
  // whatever did not fit instead of letting the page scroll, which is how the
  // conversation disappeared on a short window.
  return (
    <div className="relative flex min-h-screen flex-col bg-paper">
      {/* Header */}
      <header className="flex items-center justify-between px-7 py-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted">
          <span className="h-1 w-1 rounded-full bg-mint" />
          {PART_LABEL[part] ?? `Part ${part}`}
        </div>

        {progress.total > 0 && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: progress.total }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 w-1 rounded-full transition-colors",
                  i <= progress.index ? "bg-mint-deep" : "bg-rule",
                )}
              />
            ))}
          </div>
        )}
      </header>

      {/* Stage */}
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <div className="relative flex shrink-0 items-center justify-center">
          <SpeakingOrb level={orbLevel} mode={orbMode} size={orbSize} />

          <AnimatePresence>
            {remaining !== null && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === "awaiting" ? 0.65 : 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "absolute font-mono text-[13px] tracking-[0.16em]",
                  phase === "prep" ? "text-ink" : "text-paper",
                  phase === "listening" && remaining <= 5 && "text-red-500",
                )}
              >
                {formatClock(remaining)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <StatusLabel phase={phase} />

        <AnimatePresence>
          {phase === "prep" && cueCard && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-7 w-full max-w-[36rem] rounded-lg border border-rule bg-paper-2 px-7 py-6"
            >
              <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-muted">
                Cue card
              </p>
              <p className="whitespace-pre-line font-serif text-[1.05rem] leading-relaxed text-ink">
                {cueCard}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {phase !== "prep" && (
          // The floor replaces `min-height: auto`, which would otherwise refuse
          // to shrink below the content and push the conversation off a short
          // viewport — the page does not scroll. Two lines always remain, so a
          // tight window costs history, never the line being spoken.
          <TranscriptStream
            lines={lines}
            className="mt-2 min-h-[6rem] max-h-[32vh]"
          />
        )}

        {phase === "error" && errorMessage && (
          <div className="mt-6 flex max-w-[34rem] items-start gap-2 rounded-md border border-rule bg-paper-2 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}
      </main>

      {/* Controls */}
      <footer className="flex flex-col items-center gap-3 px-6 pb-10 pt-4">
        {phase === "prep" && (
          <Button
            onClick={() => flowRef.current.endPrep()}
            className="h-11 rounded-md bg-ink px-8 text-[14px] font-medium tracking-tight text-paper hover:bg-ink-soft active:scale-[0.99]"
          >
            Бэлэн боллоо
          </Button>
        )}

        {showPushToTalk && (
          <PushToTalk
            recording={phase === "listening"}
            locked={locked}
            onStart={handleTalkStart}
            onLock={handleTalkLock}
            onFinish={handleTalkFinish}
          />
        )}

        {phase === "error" && (
          <Button
            onClick={() => router.push("/speaking")}
            variant="ghost"
            className="h-11 rounded-md px-8 text-[14px] text-ink-soft hover:bg-paper-2 hover:text-ink"
          >
            Буцах
          </Button>
        )}

        {!showPushToTalk && (
          <MicIndicator denied={recorder.status === "denied"} phase={phase} />
        )}
      </footer>
    </div>
  );
}

// ── Sub-views ───────────────────────────────────────────────────────────────

function ReadyGate({
  onBegin,
  recognitionSupported,
}: {
  onBegin: () => void;
  recognitionSupported: boolean;
}) {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia?.("(pointer: coarse)").matches ?? false);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-[440px]">
        <div className="flex items-center gap-2 pb-7 text-[12px] uppercase tracking-[0.2em] text-muted">
          <span className="h-1 w-1 rounded-full bg-mint" />
          Бэлтгэл
        </div>

        <h1 className="font-serif text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.022em] text-ink">
          Эхлэхэд бэлэн үү?
        </h1>
        <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-ink-soft">
          Шалгагч асуултаа асуусны дараа таны ээлж ирнэ.{" "}
          {isTouch
            ? "Товчийг дараад бариад хариулна уу, тавихад хариулт илгээгдэнэ."
            : "Space товчийг дараад бариад хариулна уу, тавихад хариулт илгээгдэнэ."}{" "}
          Богино дарж тавибал бичлэг үргэлжилж, гараа чөлөөлж болно.
        </p>

        <Button
          onClick={onBegin}
          className="mt-9 h-11 w-full rounded-md bg-ink text-[14px] font-medium tracking-tight text-paper hover:bg-ink-soft active:scale-[0.99]"
        >
          <Mic className="mr-2 h-4 w-4" />
          Микрофон холбож эхлэх
        </Button>

        {!recognitionSupported && (
          <p className="mt-6 max-w-[42ch] text-[12px] leading-relaxed text-muted">
            Энэ хөтөч дээр ярианы бичвэр шууд харагдахгүй. Шалгалт хэвийн
            үргэлжилж, бичлэгийг сервер дээр хөрвүүлж дүгнэнэ. Chrome ашиглавал
            бичвэрээ шууд харах боломжтой.
          </p>
        )}
      </div>
    </div>
  );
}

function StatusLabel({ phase }: { phase: SessionPhase }) {
  const label: Record<SessionPhase, string> = {
    connecting: "Холбогдож байна…",
    examiner_speaking: "Шалгагч ярьж байна",
    prep: "Бэлтгэх хугацаа",
    awaiting: "Таны ээлж",
    listening: "Сонсож байна",
    submitting: "Хариултыг илгээж байна…",
    complete: "Шалгалт дууслаа",
    error: "Алдаа гарлаа",
  };

  return (
    <p className="mt-6 h-5 text-[12px] uppercase tracking-[0.22em] text-muted">
      {label[phase]}
    </p>
  );
}

/** Ambient status shown only when the push-to-talk control is not on screen. */
function MicIndicator({
  denied,
  phase,
}: {
  denied: boolean;
  phase: SessionPhase;
}) {
  if (denied) {
    return (
      <span className="inline-flex items-center gap-2 text-[11px] text-red-500">
        <MicOff className="h-3.5 w-3.5" />
        Микрофон хаалттай
      </span>
    );
  }

  if (phase === "error" || phase === "complete") return null;

  return (
    <span className="inline-flex items-center gap-2 text-[11px] text-muted">
      <Loader2 className="h-3 w-3 animate-spin" />
      Хүлээнэ үү
    </span>
  );
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
