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

export interface ExaminerSpeechTurn extends TurnBase {
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

export interface StudentResponseTurn extends TurnBase {
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

/**
 * What the UI is doing right now — drives the orb and the controls.
 *
 * `awaiting` is the student's turn with the mic armed but not yet capturing:
 * recording only begins once they hold Space (or the on-screen button).
 */
export type SessionPhase =
  | "connecting"
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
