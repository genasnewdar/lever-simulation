"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { AlertTriangle, Loader2, MicOff, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MicCheck } from "@/components/speaking/MicCheck";
import { SpeakingOrb } from "@/components/speaking/SpeakingOrb";
import { TalkControl } from "@/components/speaking/TalkControl";
import { TranscriptStream } from "@/components/speaking/TranscriptStream";
import {
  completeSession,
  fetchNextTurn,
  fetchVoiceCheck,
  markPrepDone,
  startSession,
  submitTurn,
  uploadTurnAudio,
} from "@/lib/speaking/api";
import { useSpeakingStore } from "@/lib/speaking/store";
import { useExamCodeStore } from "@/lib/stores/exam-code-store";
import { useExaminerVoice } from "@/lib/speaking/useExaminerVoice";
import { useSpeechRecognition } from "@/lib/speaking/useSpeechRecognition";
import { useVoiceRecorder } from "@/lib/speaking/useVoiceRecorder";
import { cn } from "@/lib/utils";
import type {
  SessionPhase,
  SpeakingTurn,
  TranscriptLine,
  VoiceCheckResponse,
} from "@/types/speaking";

const PART_LABEL: Record<number, string> = {
  1: "Part 1 · Introduction",
  2: "Part 2 · Long turn",
  3: "Part 3 · Discussion",
};

/** Line the examiner speaks when the student asks to hear the question again. */
const REPEAT_PREFIX = "Of course. ";

/**
 * What the mic check says if the examiner's own recording cannot be had.
 *
 * The server sends its copy of this line down with the audio, and that is the
 * one normally spoken; this exists so a failed request still says something
 * sensible rather than leaving the speaker test silent.
 */
const VOICE_CHECK_FALLBACK =
  "Hello. Can you hear me clearly? Let's begin your speaking test.";

/**
 * Shortest answer that is treated as an answer.
 *
 * Below this the student has not said anything gradable — they tapped by
 * mistake, or started before they were ready. Submitting it would spend the
 * question on a second of silence, so the take is thrown away and the same
 * question is handed straight back instead.
 */
const MIN_ANSWER_MS = 1000;

/** Above this the student is speaking. */
const SPEECH_LEVEL = 0.1;
/** Below this the room is quiet. The gap between the two stops flapping. */
const SILENCE_LEVEL = 0.05;
/** How long the quiet has to hold before the answer is submitted for them. */
const SILENCE_MS = 3500;
/** When to start warning that it is about to happen. */
const SILENCE_WARN_MS = 2000;

/**
 * How long a student mid-sentence gets after their time is up.
 *
 * Cutting on the exact second takes the end off the answer, and the end of an
 * answer is where the complex sentence usually is — the candidate is marked
 * down for a machine's punctuality. So the clock running out while they are
 * still talking buys them one grace period: the silence detector ends the turn
 * the moment they finish, and this is the hard stop if they do not.
 *
 * Ten seconds because that is exactly what the server already allows — the turn
 * timeout task fires at the limit plus the same grace, so an answer submitted
 * inside it is still accepted. Changing this number without changing
 * `grace_seconds` in queue_scheduler.schedule_turn_timeout would start losing
 * answers the student was told they could give.
 */
const GRACE_MS = 10_000;

/**
 * The pause before the examiner speaks.
 *
 * Deliberate, and the only added wait in the whole flow. A reply that starts
 * the instant the student stops talking reads as a machine that was never
 * listening; three quarters of a second of the orb visibly working reads as
 * someone who heard the answer and is responding to it. It sits between turns,
 * never inside one, so it costs the student no speaking time.
 */
const CONSIDER_MS = 750;

const beat = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A student turn that has been announced but not yet spoken into. */
interface ArmedTurn {
  turnId: string;
  limitSeconds: number;
  part: number;
  questionText: string | null;
  audioUrl: string | null;
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
  const [repeating, setRepeating] = useState(false);
  const [autoStopIn, setAutoStopIn] = useState<number | null>(null);
  /** Bumped when an answer is captured, to fire the orb's acknowledgement. */
  const [pulse, setPulse] = useState(0);
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

  /** Whether this turn has already had its overtime. One per turn. */
  const graceUsedRef = useRef(false);

  /** Latest mic level reader, so the countdown can ask without re-subscribing:
   *  putting the recorder in the interval's deps would restart the clock on
   *  every tick's render, and it would never fire again. */
  const levelRef = useRef<() => number>(() => 0);

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
      // Slow on purpose: the server transcribes every recording from its audio
      // before it will grade them, and the student's screen says so.
      await completeSession(attemptId);
    } catch {
      // The session is over either way; results will report if grading failed.
      toast.warning("Дүгнэлт эхлүүлэхэд саатал гарлаа. Үр дүнг шалгана уу.");
    }

    // Speaking can be a test on its own, or the last section of a sitting that
    // also had Listening/Reading/Writing. The exam store still holds that
    // sitting's attempt, so it tells us which results page is the right one —
    // the speaking-only page would hide the bands they just sat for.
    const partOfSitting =
      useExamCodeStore.getState().attemptId === attemptId;
    router.push(
      partOfSitting
        ? `/ielts/results/${attemptId}`
        : `/speaking/results/${attemptId}`,
    );
  }, [attemptId, recorder, router, voice]);

  /**
   * Hand the turn to the student without opening the mic.
   *
   * Recording is theirs to start — the clock only runs while they are actually
   * answering, so thinking time is never charged against the answer.
   */
  const armTurn = useCallback((armed: ArmedTurn) => {
    armedTurnRef.current = armed;
    setRemaining(armed.limitSeconds);
    deadlineRef.current = null;
    setAutoStopIn(null);
    setPhase("awaiting");
  }, []);

  /** The student pressed start — begin capturing. */
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
    graceUsedRef.current = false;
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
        setPhase("considering");
        await beat(CONSIDER_MS);
        setPhase("examiner_speaking");
        // Spoken, not printed — reading the examiner's lines off the screen is
        // not what the exam tests, and it is not what the real room offers.
        const text = turn.examiner_text ?? "";
        const heard = await voice.speak(text, turn.examiner_audio_url);
        // Unless nothing came out of the speakers, in which case a printed line
        // is the difference between a hard test and an impossible one.
        if (!heard && text) {
          pushLine({ speaker: "examiner", text, part: turn.part });
        }
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
      setPhase("considering");
      await beat(CONSIDER_MS);
      setPhase("examiner_speaking");
      const question = turn.question_text ?? "";
      if (question) {
        const heard = await voice.speak(question, turn.examiner_audio_url);
        if (!heard) pushLine({ speaker: "examiner", text: question, part: turn.part });
      }

      armTurn({
        turnId: turn.turn_id,
        limitSeconds:
          turn.time_limit_seconds > 0 ? turn.time_limit_seconds : 45,
        part: turn.part,
        questionText: turn.question_text,
        audioUrl: turn.examiner_audio_url ?? null,
      });
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

    const armed = armedTurnRef.current;
    const elapsedMs = Date.now() - recordingStartRef.current;

    busyRef.current = true;
    deadlineRef.current = null;
    setAutoStopIn(null);

    const transcript = recognition.stop();
    const blob = await recorder.stop();
    const lineId = studentLineIdRef.current;
    studentLineIdRef.current = null;

    // Too short to be an answer — drop the take, hand the question back.
    if (elapsedMs < MIN_ANSWER_MS && armed) {
      setLines((prev) => prev.filter((line) => line.id !== lineId));
      busyRef.current = false;
      armTurn(armed);
      toast.info("Хэт богино байна. Бэлэн болмогцоо дахин ярина уу.");
      return;
    }

    armedTurnRef.current = null;
    setRemaining(null);
    // "Got it" — fired on the real answer only, never on a discarded take.
    setPulse((n) => n + 1);
    setPhase("submitting");

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

    try {
      await submitTurn(attemptId, turn.turn_id, {
        transcript: transcript || null,
        duration: Math.round(elapsedMs / 1000),
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
      // One failed submit must not end the exam. The server frequently has the
      // answer already — it saves the response and completes the turn before
      // anything else it does can throw — so ask it rather than assume:
      // advancing only succeeds when the turn really is resolved, and `advance`
      // fails the session itself when the answer is genuinely missing.
      if (blob) {
        uploadTurnAudio(attemptId, turn.turn_id, blob).catch(() => {});
      }
      await advance();
    }
  }, [advance, armTurn, attemptId, recognition, recorder]);

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
      armTurn({
        turnId: result.turn_id,
        limitSeconds:
          result.time_limit_seconds > 0 ? result.time_limit_seconds : 45,
        part: turn.part,
        questionText: result.question_text,
        audioUrl: null,
      });
    } catch {
      busyRef.current = false;
      failSession("Бэлтгэл дуусгахад алдаа гарлаа.");
    }
  }, [armTurn, attemptId, failSession]);

  flowRef.current = { advance, startSpeaking, endTurn, endPrep };
  levelRef.current = recorder.getLevel;

  // Stable identities: TalkControl keeps a window key listener keyed to these,
  // so inline arrows would resubscribe on every render.
  const handleTalkStart = useCallback(() => {
    flowRef.current.startSpeaking();
  }, []);
  const handleTalkFinish = useCallback(() => {
    flowRef.current.endTurn();
  }, []);

  /**
   * Say the question again.
   *
   * Nothing is written on screen any more, so this is what replaces re-reading
   * it — the same thing a candidate is allowed to ask for in Part 1 and 3.
   */
  const repeatQuestion = useCallback(async () => {
    const armed = armedTurnRef.current;
    if (!armed?.questionText || repeating) return;

    setRepeating(true);
    try {
      // Spoken fresh rather than replaying the cached audio: the audio file is
      // the question alone, and "Of course." is what makes it a reply.
      await voice.speak(`${REPEAT_PREFIX}${armed.questionText}`);
    } finally {
      setRepeating(false);
    }
  }, [repeating, voice]);

  // ── Countdown ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "listening" && phase !== "prep") return;

    const interval = window.setInterval(() => {
      const deadline = deadlineRef.current;
      if (!deadline) return;

      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      // The clock sits at zero through the overtime rather than jumping back up
      // to ten: their time really is up, they are only being allowed to land
      // the sentence.
      setRemaining(graceUsedRef.current ? 0 : left);

      if (left > 0) return;

      // Still mid-sentence when the time ran out: let them land it. The silence
      // detector is what actually ends the turn — this is only the hard stop
      // for a candidate who keeps going.
      if (
        phase === "listening" &&
        !graceUsedRef.current &&
        levelRef.current() >= SPEECH_LEVEL
      ) {
        graceUsedRef.current = true;
        deadlineRef.current = Date.now() + GRACE_MS;
        return;
      }

      deadlineRef.current = null;
      if (phase === "prep") flowRef.current.endPrep();
      else flowRef.current.endTurn();
    }, 250);

    return () => window.clearInterval(interval);
  }, [phase]);

  // ── Silence detection ─────────────────────────────────────────────────────

  const getLevel = recorder.getLevel;

  /**
   * End the turn once the student has stopped talking.
   *
   * The clock only starts after they have said something: a candidate who takes
   * four seconds to begin is thinking, not finished. Once it does start, the
   * control counts down out loud, so the submission is never a surprise.
   */
  useEffect(() => {
    if (phase !== "listening") {
      setAutoStopIn(null);
      return;
    }

    let spoke = false;
    let quietSince: number | null = null;

    const interval = window.setInterval(() => {
      const level = getLevel();

      if (level >= SPEECH_LEVEL) {
        spoke = true;
        quietSince = null;
        setAutoStopIn(null);
        return;
      }
      // Between the two thresholds is neither speech nor silence — hold.
      if (!spoke || level >= SILENCE_LEVEL) return;

      quietSince ??= Date.now();
      const left = SILENCE_MS - (Date.now() - quietSince);

      if (left <= 0) {
        flowRef.current.endTurn();
        return;
      }
      setAutoStopIn(left <= SILENCE_WARN_MS ? Math.ceil(left / 1000) : null);
    }, 200);

    return () => window.clearInterval(interval);
  }, [getLevel, phase]);

  // ── Boot ──────────────────────────────────────────────────────────────────

  /**
   * The examiner's recording of the mic-check line, fetched once.
   *
   * Asked for when the microphone is connected rather than when the speaker
   * test is pressed: a line the CDN has not been asked for before takes several
   * seconds to synthesise, and the student spends about that long saying
   * "Hello, my name is…" into the meter first.
   */
  const voiceCheckRef = useRef<Promise<VoiceCheckResponse | null> | null>(null);

  const primeVoiceCheck = useCallback(() => {
    voiceCheckRef.current ??= fetchVoiceCheck(attemptId).catch(() => {
      // Cleared rather than cached, so pressing the button again retries
      // instead of pinning the session to the browser voice over one lost
      // request.
      voiceCheckRef.current = null;
      return null;
    });
    return voiceCheckRef.current;
  }, [attemptId]);

  /** Mic check step one: open audio both ways so the student can test them. */
  const handleConnect = useCallback(async () => {
    // Before any await, while this click still counts as the gesture that
    // lets audio play.
    voice.prime();
    primeVoiceCheck();
    return recorder.monitor();
  }, [primeVoiceCheck, recorder, voice]);

  /**
   * Play the speaker test in the examiner's real voice.
   *
   * It used to call `speak` with text alone, which meant the browser's
   * `speechSynthesis` read it — so the screen whose whole job is to let the
   * student confirm the audio sounds right was the only one in the flow that
   * never played the voice they were about to hear.
   */
  const handleTestVoice = useCallback(async () => {
    const check = await primeVoiceCheck();
    await voice.speak(check?.text ?? VOICE_CHECK_FALLBACK, check?.audio_url);
  }, [primeVoiceCheck, voice]);

  const handleBegin = useCallback(async () => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    setStarted(true);
    recorder.stopMonitor();

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
  }, [advance, attemptId, failSession, recorder]);

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
      : phase === "considering"
        ? "gathering"
        : phase === "listening" || phase === "awaiting"
          ? "student"
          : phase === "submitting" ||
              phase === "connecting" ||
              phase === "complete"
            ? "thinking"
            : "idle";

  const orbLevel =
    phase === "listening"
      ? recorder.level
      : phase === "examiner_speaking"
        ? voice.level
        : 0;

  const showTalkControl = phase === "awaiting" || phase === "listening";
  // Part 2 hands out a cue card and the candidate keeps it for the whole long
  // turn. Hiding it the moment they started speaking took away the one thing
  // they were meant to be speaking from.
  const showCueCard =
    Boolean(cueCard) &&
    (phase === "prep" || phase === "awaiting" || phase === "listening");

  if (!started) {
    return (
      <MicCheck
        onConnect={handleConnect}
        getLevel={recorder.getLevel}
        onTestVoice={handleTestVoice}
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
          <SpeakingOrb
            level={orbLevel}
            mode={orbMode}
            pulse={pulse}
            size={orbSize}
          />

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
          {showCueCard && (
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
            className={cn(
              "mt-2 min-h-[6rem]",
              showCueCard ? "max-h-[20vh]" : "max-h-[32vh]",
            )}
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

        {showTalkControl && (
          <TalkControl
            recording={phase === "listening"}
            disabled={repeating}
            autoStopIn={autoStopIn}
            onStart={handleTalkStart}
            onFinish={handleTalkFinish}
          />
        )}

        {phase === "awaiting" && armedTurnRef.current?.questionText && (
          <button
            type="button"
            onClick={repeatQuestion}
            disabled={repeating}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] text-muted transition-colors hover:text-ink disabled:opacity-60"
          >
            <Volume2 className="h-3.5 w-3.5" />
            {repeating ? "Уншиж байна…" : "Асуултыг дахин сонсох"}
          </button>
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

        {!showTalkControl && (
          <MicIndicator denied={recorder.status === "denied"} phase={phase} />
        )}
      </footer>
    </div>
  );
}

// ── Sub-views ───────────────────────────────────────────────────────────────

function StatusLabel({ phase }: { phase: SessionPhase }) {
  const label: Record<SessionPhase, string> = {
    connecting: "Холбогдож байна…",
    considering: "Бодож байна…",
    examiner_speaking: "Шалгагч ярьж байна",
    prep: "Бэлтгэх хугацаа",
    awaiting: "Таны ээлж",
    listening: "Сонсож байна",
    submitting: "Хариултыг илгээж байна…",
    complete: "Хариултуудыг боловсруулж байна…",
    error: "Алдаа гарлаа",
  };

  return (
    <p className="mt-6 h-5 text-[12.5px] tracking-[0.1em] text-muted">
      {label[phase]}
    </p>
  );
}

/** Ambient status shown only when the talk control is not on screen. */
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

  if (phase === "error") return null;

  return (
    <span className="inline-flex items-center gap-2 text-[11px] text-muted">
      <Loader2 className="h-3 w-3 animate-spin" />
      {phase === "complete"
        ? "Бичлэгүүдийг бичвэр рүү хөрвүүлж байна. Хуудсаа хаахгүй байна уу."
        : "Хүлээнэ үү"}
    </span>
  );
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
