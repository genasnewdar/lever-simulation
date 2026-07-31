/**
 * Types for the standalone /speaking flow.
 *
 * Mirrors the payloads from /api/public/ielts/speaking/* in lever-edu. Kept
 * separate from `ielts-simulation.ts` on purpose — the speaking session shares
 * no state with the listening/reading/writing exam.
 */

export type TurnType = "EXAMINER_SPEECH" | "PREP" | "STUDENT_RESPONSE";

interface TurnBase {
  turn_id: string;
  turn_type: TurnType;
  turn_index: number;
  part: number;
  session_complete: false;
}

/**
 * Neural TTS of the line this turn speaks, served from the CDN.
 *
 * Null when lever-edu could not synthesise it in time (cold cache) or has TTS
 * switched off — the browser reads the text aloud instead.
 */
type ExaminerVoice = { examiner_audio_url?: string | null };

export interface ExaminerSpeechTurn extends TurnBase, ExaminerVoice {
  turn_type: "EXAMINER_SPEECH";
  examiner_text: string | null;
  auto_advance: true;
}

export interface PrepTurn extends TurnBase {
  turn_type: "PREP";
  cue_card: string | null;
  prep_time_seconds: number;
  prep_started_at: string;
}

export interface StudentResponseTurn extends TurnBase, ExaminerVoice {
  turn_type: "STUDENT_RESPONSE";
  question_id: string | null;
  question_text: string | null;
  cue_card: string | null;
  time_limit_seconds: number;
  recording_started_at: string;
}

export type SpeakingTurn = ExaminerSpeechTurn | PrepTurn | StudentResponseTurn;

/** Returned by /next-turn once every turn has been consumed. */
export interface SessionCompletePayload {
  session_complete: true;
  total_turns_completed: number;
}

export type NextTurnResponse = SpeakingTurn | SessionCompletePayload;

export interface StartSessionResponse {
  attempt_id: string;
  total_turns: number;
  current_part: number;
  student_name: string | null;
  test_title: string | null;
  adaptive_mode: boolean;
  instructions: string | null;
}

/**
 * The line the mic check plays, and the examiner's recording of it.
 *
 * `audio_url` is null when the server could not synthesise it, in which case
 * `text` is what the browser speaks instead.
 */
export interface VoiceCheckResponse {
  text: string;
  audio_url: string | null;
}

export interface SpeakingStateResponse {
  attempt_id: string;
  current_turn_index: number;
  current_part: number;
  completed_turns: number;
  total_turns: number;
  current_turn: SpeakingTurn | null;
  session_complete: boolean;
}

/** Response to POST /turn/{id}/prep-done — recording is already open. */
export interface PrepDoneResponse {
  recording_starts_at: string;
  time_limit_seconds: number;
  turn_id: string;
  question_text: string | null;
}

export interface SubmitTurnResponse {
  response_id: string;
  turn_completed: boolean;
  next_turn_available: boolean;
  adaptive_followup_injected: boolean;
}

export interface SpeakingCriteria {
  fluency_coherence: number;
  lexical_resource: number;
  grammar_accuracy: number;
  pronunciation: number;
}

export interface SpeakingResponseResult {
  question_text: string | null;
  part: number | null;
  transcript: string | null;
  duration: number | null;
  band_score: number | null;
}

export interface SpeakingResultsPending {
  status: "pending";
  attempt_id: string;
  completed: boolean;
}

export interface SpeakingResultsSuccess {
  status: "success";
  attempt_id: string;
  student_name: string | null;
  /** The band persisted on the attempt — what feeds overall_band elsewhere. */
  overall_band: number;
  /**
   * The band on the evaluation row. Normally identical to `overall_band`; it
   * diverges when the two concurrent graders in `grade_speaking_attempt` race,
   * so it is exposed for diagnosis rather than display.
   */
  evaluation_band?: number;
  criteria: SpeakingCriteria;
  feedback: string;
  detailed_feedback: unknown;
  graded_at: string | null;
  responses: SpeakingResponseResult[];
}

export type SpeakingResults = SpeakingResultsPending | SpeakingResultsSuccess;

/** What kind of mistake a correction points at. */
export type CorrectionKind =
  | "grammar"
  | "vocabulary"
  | "collocation"
  | "pronunciation"
  | "fluency"
  | "register";

/**
 * One mistake and its fix. `original` is copied verbatim out of the student's
 * transcript, which is what lets the UI mark it in place.
 */
export interface SpeakingCorrection {
  original: string;
  corrected: string;
  /** Written in Mongolian — it explains the rule, not just the fix. */
  explanation: string;
  kind: CorrectionKind;
}

/**
 * A note about how the transcript is written down rather than about the
 * English in it — a missing full stop, a lowercase name.
 *
 * Kept apart from `corrections` because nobody speaks punctuation: the student
 * cannot have got it wrong, so it must never read as a mistake or count against
 * the band. It is still shown, quietly, when the point is worth knowing.
 */
export interface SpeakingPolishNote {
  original: string;
  corrected: string;
  /** Written in Mongolian. */
  explanation: string;
}

/** Something the student said well, quoted verbatim from their own answer. */
export interface SpeakingHighlight {
  quote: string;
  /** Why it was good — written in Mongolian. */
  why: string;
}

export interface SpeakingAnswerFeedback {
  index: number;
  part: number | null;
  question: string | null;
  transcript: string;
  corrections: SpeakingCorrection[];
  /** Optional: feedback cached before these fields existed has neither. */
  highlights?: SpeakingHighlight[];
  polish?: SpeakingPolishNote[];
  /** The student's own answer rewritten at band 7.5-8, keeping their ideas. */
  improved: string;
  note: string;
}

/** CEFR level → the words and phrases the student actually used at it. */
export type SpeakingVocabularyProfile = Record<
  "a1" | "a2" | "b1" | "b2" | "c1" | "c2",
  string[]
> & {
  /** How to read the spread — written in Mongolian. */
  note: string;
};

export const CEFR_LEVELS = ["a1", "a2", "b1", "b2", "c1", "c2"] as const;

/**
 * A word the student leaned on, with something to say instead.
 *
 * `count` is measured on the server rather than estimated by the model, so it
 * always matches what a student finds by reading their own transcript.
 */
export interface SpeakingRepeatedWord {
  word: string;
  count: number;
  alternatives: string[];
  /** Written in Mongolian. Says when repeating it is actually fine. */
  note: string;
}

export interface SpeakingFocusArea {
  title: string;
  detail: string;
  example?: string;
}

export interface SpeakingFeedbackSuccess {
  status: "success";
  attempt_id: string;
  answers: SpeakingAnswerFeedback[];
  /** Optional: feedback cached before these fields existed has neither. */
  vocabulary_profile?: SpeakingVocabularyProfile;
  repeated_words?: SpeakingRepeatedWord[];
  focus_areas: SpeakingFocusArea[];
  summary: string;
}

/**
 * `building` means the model is still working — the results page polls. It is
 * served separately from the bands so a slow generation never delays them.
 */
export interface SpeakingFeedbackPending {
  status: "building" | "unavailable";
  attempt_id: string;
}

export type SpeakingFeedback = SpeakingFeedbackSuccess | SpeakingFeedbackPending;

/**
 * What the UI is doing right now — drives the orb and the controls.
 *
 * `awaiting` is the student's turn with the mic armed but not yet capturing:
 * recording only begins once they press the talk control.
 *
 * `considering` is the beat between having the student's answer and speaking
 * again. It is deliberate, not latency: an examiner who replies the instant you
 * stop talking has obviously not listened, and the pause is what makes the turn
 * read as a conversation rather than a form submission.
 */
export type SessionPhase =
  | "connecting"
  | "considering"
  | "examiner_speaking"
  | "prep"
  | "awaiting"
  | "listening"
  | "submitting"
  | "complete"
  | "error";

/** One line in the on-screen conversation. */
export interface TranscriptLine {
  id: string;
  speaker: "examiner" | "student";
  text: string;
  part: number;
  /** True while the student is still talking — renders as live/animating. */
  interim?: boolean;
}
