"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useSpeechSynthesis } from "@/lib/speaking/useSpeechSynthesis";

/**
 * The examiner's voice.
 *
 * lever-edu synthesises each examiner line with neural TTS and returns a CDN
 * URL on the turn (`examiner_audio_url`). This plays it through the Web Audio
 * API, which — unlike `speechSynthesis` — gives a real output stream, so the
 * orb is driven by the actual waveform rather than a guessed envelope.
 *
 * `useSpeechSynthesis` stays as the fallback for any turn that arrives without
 * audio (cold cache, TTS misconfigured, a browser that blocks playback). A
 * worse voice is better than a silent examiner.
 *
 * Fetched rather than assigned to an `<audio>` element on purpose: the CDN
 * serves these as `application/octet-stream`, which some browsers refuse to
 * play, while `decodeAudioData` reads the bytes and ignores the content type.
 */
export function useExaminerVoice() {
  const fallback = useSpeechSynthesis();

  const [playing, setPlaying] = useState(false);
  const [level, setLevel] = useState(0);

  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  /** Bumped by `cancel()` so a play that is already in flight abandons itself. */
  const generationRef = useRef(0);

  /**
   * The context is created on first speech, which only happens after the
   * student has pressed "start" — autoplay policy requires that gesture.
   */
  const getContext = useCallback((): AudioContext | null => {
    if (contextRef.current) return contextRef.current;
    if (typeof window === "undefined") return null;

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;

    contextRef.current = new Ctor();
    return contextRef.current;
  }, []);

  const stopMeter = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setLevel(0);
  }, []);

  /** Follow the real waveform: RMS of the time domain, smoothed for the orb. */
  const runMeter = useCallback((analyser: AnalyserNode) => {
    const samples = new Uint8Array(analyser.fftSize);

    const tick = () => {
      analyser.getByteTimeDomainData(samples);

      let sum = 0;
      for (let i = 0; i < samples.length; i += 1) {
        const centred = (samples[i] - 128) / 128;
        sum += centred * centred;
      }
      // Speech RMS sits well below 1; lift it into the orb's usable range.
      const next = Math.min(1, Math.sqrt(sum / samples.length) * 3.2);

      setLevel((prev) => prev + (next - prev) * 0.35);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  /**
   * Play `url` to completion. Resolves `false` if it could not be played at
   * all, which is the caller's cue to fall back to browser speech.
   */
  const playUrl = useCallback(
    async (url: string, generation: number): Promise<boolean> => {
      const context = getContext();
      if (!context) return false;

      // Not cached in memory: each line is spoken once per session, and a
      // decoded buffer is far larger than the file it came from. A replay
      // after reconnecting re-fetches, which the CDN serves from its edge.
      let buffer: AudioBuffer;
      try {
        const response = await fetch(url);
        if (!response.ok) return false;
        buffer = await context.decodeAudioData(await response.arrayBuffer());
      } catch {
        return false;
      }
      // Cancelled while fetching — this turn is over, but it did have audio.
      if (generation !== generationRef.current) return true;

      try {
        // Suspended contexts are normal on a fresh page; resume needs the
        // gesture that already happened upstream.
        if (context.state === "suspended") await context.resume();

        const source = context.createBufferSource();
        source.buffer = buffer;

        const analyser = context.createAnalyser();
        analyser.fftSize = 512;

        source.connect(analyser);
        analyser.connect(context.destination);

        sourceRef.current = source;
        setPlaying(true);
        runMeter(analyser);

        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
          source.start();
        });
      } catch {
        return false;
      } finally {
        sourceRef.current = null;
        stopMeter();
        setPlaying(false);
      }

      return true;
    },
    [getContext, runMeter, stopMeter],
  );

  /**
   * Speak a line and resolve when it finishes: the synthesised audio when the
   * turn carries it, the browser's own voice otherwise.
   */
  const speak = useCallback(
    async (text: string, audioUrl?: string | null): Promise<void> => {
      const generation = generationRef.current;

      if (audioUrl) {
        const played = await playUrl(audioUrl, generation);
        if (played) return;
      }
      if (generation !== generationRef.current) return;

      await fallback.speak(text);
    },
    [fallback, playUrl],
  );

  const cancel = useCallback(() => {
    generationRef.current += 1;

    const source = sourceRef.current;
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // Already stopped — nothing to unwind.
      }
      sourceRef.current = null;
    }

    stopMeter();
    setPlaying(false);
    fallback.cancel();
  }, [fallback, stopMeter]);

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      contextRef.current?.close().catch(() => {});
      contextRef.current = null;
    };
    // Unmount-only cleanup — it touches refs alone, so it has no dependencies.
  }, []);

  return {
    speak,
    cancel,
    speaking: playing || fallback.speaking,
    level: playing ? level : fallback.level,
  };
}
