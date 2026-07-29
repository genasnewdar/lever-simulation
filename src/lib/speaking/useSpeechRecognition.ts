"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Live transcription via the Web Speech API.
 *
 * The backend grades speaking from transcripts, and this is what produces them.
 * Chromium ships the API; Safari and Firefox do not. When it is missing the
 * session still runs and still uploads audio — lever-edu transcribes the
 * recording server-side before grading — but there is no on-screen live text,
 * which `supported` lets the UI explain.
 */

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

/**
 * Errors that mean transcription is not going to work at all, as opposed to
 * `no-speech` / `aborted`, which fire routinely during a normal turn.
 */
const FATAL_ERRORS = new Set([
  "not-allowed",
  "service-not-allowed",
  "audio-capture",
  "network",
  "language-not-supported",
]);
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  /**
   * Set when transcription has genuinely broken — the browser blocked the mic,
   * or it cannot reach the speech service. Swallowing these was why an empty
   * transcript looked like a student who had said nothing.
   */
  const [fatalError, setFatalError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  // The tail of an answer is often still interim when the turn ends; keeping it
  // here means stopping mid-sentence doesn't drop those words from the graded
  // transcript.
  const interimRef = useRef("");
  // The API stops on its own after a pause; while we want the turn to stay
  // open we restart it. This flag distinguishes that from a real stop.
  const wantActiveRef = useRef(false);

  useEffect(() => {
    setSupported(getCtor() !== null);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return false;

    finalRef.current = "";
    interimRef.current = "";
    setFinalText("");
    setInterimText("");
    setFatalError(null);
    wantActiveRef.current = true;

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalRef.current = `${finalRef.current} ${text}`.trim();
        } else {
          interim += text;
        }
      }
      interimRef.current = interim.trim();
      setFinalText(finalRef.current);
      setInterimText(interimRef.current);
    };

    recognition.onerror = (event) => {
      // no-speech / aborted fire routinely; onend decides whether to resume.
      if (!FATAL_ERRORS.has(event.error)) return;

      setFatalError(event.error);
      console.warn(
        `[speaking] speech recognition failed (${event.error}) — the recording ` +
          `is still uploaded and transcribed server-side`,
      );
    };

    recognition.onend = () => {
      if (wantActiveRef.current) {
        try {
          recognition.start();
        } catch {
          // Already restarting — ignore.
        }
      }
    };

    try {
      recognition.start();
    } catch {
      return false;
    }

    recognitionRef.current = recognition;
    return true;
  }, []);

  /** Stop listening and return everything heard during this turn. */
  const stop = useCallback((): string => {
    wantActiveRef.current = false;
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // Already stopped.
      }
    }
    recognitionRef.current = null;

    const combined = `${finalRef.current} ${interimRef.current}`.trim();
    interimRef.current = "";
    setInterimText("");
    return combined;
  }, []);

  useEffect(() => {
    return () => {
      wantActiveRef.current = false;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  return { supported, fatalError, finalText, interimText, start, stop };
}
