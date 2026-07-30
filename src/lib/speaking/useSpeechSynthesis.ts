"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The examiner's voice.
 *
 * lever-edu stores examiner turns as text and has no TTS, so the browser speaks
 * them. `level` is a synthesised 0..1 envelope rather than a real analysis —
 * speechSynthesis gives no output stream to measure — driven by word boundary
 * events so the orb pulses roughly in time with the speech.
 */
export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);
  const [level, setLevel] = useState(0);

  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const targetRef = useRef(0);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  /** Prefer a natural en-GB voice — this is an IELTS examiner. */
  const pickVoice = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;

    const score = (v: SpeechSynthesisVoice) => {
      let s = 0;
      if (v.lang?.startsWith("en-GB")) s += 4;
      else if (v.lang?.startsWith("en")) s += 2;
      if (/natural|neural|enhanced|premium/i.test(v.name)) s += 3;
      if (/google/i.test(v.name)) s += 2;
      return s;
    };

    voiceRef.current = [...voices].sort((a, b) => score(b) - score(a))[0] ?? null;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
      window.speechSynthesis.cancel();
    };
  }, [pickVoice]);

  const runEnvelope = useCallback(() => {
    const tick = () => {
      phaseRef.current += 0.14;
      // Two detuned sines read as speech cadence rather than a metronome.
      const wobble =
        0.5 +
        0.32 * Math.sin(phaseRef.current) +
        0.18 * Math.sin(phaseRef.current * 2.7 + 1.1);
      const next = Math.max(0, Math.min(1, wobble * targetRef.current));
      setLevel((prev) => prev + (next - prev) * 0.3);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopEnvelope = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setLevel(0);
  }, []);

  /**
   * Speak `text` and resolve when it finishes, with whether it was actually
   * heard. Resolves immediately if the browser has no speechSynthesis, so a
   * turn can never hang on it — and `false` tells the caller the line went out
   * silently, which now matters: the examiner's words are no longer printed on
   * screen, so a silent turn would leave the student with nothing at all.
   */
  const speak = useCallback(
    (text: string): Promise<boolean> => {
      if (
        typeof window === "undefined" ||
        !window.speechSynthesis ||
        !text.trim()
      ) {
        return Promise.resolve(false);
      }

      window.speechSynthesis.cancel();

      return new Promise<boolean>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        if (voiceRef.current) utterance.voice = voiceRef.current;
        utterance.lang = voiceRef.current?.lang || "en-GB";
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        let settled = false;
        // `onstart` is the only signal that the utterance reached an output
        // device. A voice that errors, or one the browser drops on the floor,
        // never fires it.
        let started = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          targetRef.current = 0;
          stopEnvelope();
          setSpeaking(false);
          resolve(started);
        };

        utterance.onstart = () => {
          started = true;
          setSpeaking(true);
          targetRef.current = 0.75;
          runEnvelope();
        };
        // Each word boundary kicks the envelope so the orb tracks the cadence.
        utterance.onboundary = () => {
          targetRef.current = 0.6 + Math.random() * 0.4;
        };
        utterance.onend = finish;
        utterance.onerror = finish;

        window.speechSynthesis.speak(utterance);

        // Chrome drops long utterances silently; this guarantees the turn
        // advances even if neither onend nor onerror ever fires. Sized well
        // above real speech (~65ms/char at rate 0.95) so it only ever fires
        // when the utterance genuinely stalled.
        const guardMs = 6000 + text.length * 140;
        window.setTimeout(finish, guardMs);
      });
    },
    [runEnvelope, stopEnvelope],
  );

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    targetRef.current = 0;
    stopEnvelope();
    setSpeaking(false);
  }, [stopEnvelope]);

  return { speak, cancel, speaking, level };
}
