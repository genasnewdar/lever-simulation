"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RecorderStatus = "idle" | "ready" | "recording" | "denied" | "unsupported";

/**
 * Microphone capture for a speaking turn.
 *
 * Holds one long-lived MediaStream for the whole session — asking for the mic
 * before every question would prompt repeatedly on some browsers and add a
 * visible gap between the examiner's question and the recording window.
 *
 * `level` is a smoothed 0..1 loudness read straight off an AnalyserNode; it is
 * what makes the orb move to the student's actual voice.
 */
export function useVoiceRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [level, setLevel] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const levelRef = useRef(0);

  /** Ask for the mic once and wire up the analyser. Safe to call repeatedly. */
  const prepare = useCallback(async () => {
    if (streamRef.current) {
      setStatus("ready");
      return true;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setStatus("unsupported");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      setStatus("ready");
      return true;
    } catch {
      setStatus("denied");
      return false;
    }
  }, []);

  /** Drive `level` off the analyser while recording. */
  const startMetering = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const buffer = new Uint8Array(analyser.fftSize);

    const tick = () => {
      analyser.getByteTimeDomainData(buffer);

      // RMS around the 128 midpoint → 0..1
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buffer.length);

      // Speech sits low in the RMS range; lift it so the orb reads clearly.
      const scaled = Math.min(1, rms * 3.2);
      // Asymmetric smoothing: snap up on attack, ease down on release.
      const prev = levelRef.current;
      const next = scaled > prev ? prev + (scaled - prev) * 0.45 : prev * 0.88;

      levelRef.current = next;
      setLevel(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopMetering = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    levelRef.current = 0;
    setLevel(0);
  }, []);

  const start = useCallback(async () => {
    const ok = await prepare();
    if (!ok || !streamRef.current) return false;

    // Some browsers suspend the context until a user gesture resolves.
    if (audioCtxRef.current?.state === "suspended") {
      await audioCtxRef.current.resume().catch(() => {});
    }

    chunksRef.current = [];

    const mimeType = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
    ].find((t) => MediaRecorder.isTypeSupported?.(t));

    const recorder = new MediaRecorder(
      streamRef.current,
      mimeType ? { mimeType } : undefined,
    );
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start();

    recorderRef.current = recorder;
    setStatus("recording");
    startMetering();
    return true;
  }, [prepare, startMetering]);

  /** Stop and resolve the recorded audio, or null if nothing was captured. */
  const stop = useCallback(async (): Promise<Blob | null> => {
    stopMetering();

    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setStatus("ready");
      return null;
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      recorder.onstop = () => {
        const chunks = chunksRef.current;
        resolve(
          chunks.length
            ? new Blob(chunks, { type: recorder.mimeType || "audio/webm" })
            : null,
        );
      };
      recorder.stop();
    });

    recorderRef.current = null;
    setStatus("ready");
    return blob;
  }, [stopMetering]);

  /** Release the mic. Called when the session ends or the page unmounts. */
  const release = useCallback(() => {
    stopMetering();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    setStatus("idle");
  }, [stopMetering]);

  useEffect(() => release, [release]);

  return { status, level, prepare, start, stop, release };
}
