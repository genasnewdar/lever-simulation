"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, RotateCw, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl: string | null;
  className?: string;
  /** Rewind/forward step in seconds */
  stepSeconds?: number;
  /** Exam mode: auto-plays, hides all controls (play/pause/seek/speed/rewind/forward). Only shows progress and time. */
  examMode?: boolean;
  /** When set, the playback position is persisted to localStorage under this key so refreshes resume mid-audio. */
  storageKey?: string | null;
  /** Fired once when the audio finishes playing to its end. */
  onEnded?: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5];

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  className,
  stepSeconds = 5,
  examMode = false,
  storageKey = null,
  onEnded,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [speedLabel, setSpeedLabel] = useState("1");

  // Use storageKey alone (not including audioUrl) — signed URLs rotate on each page load,
  // so including the URL in the key would make the saved position unrecoverable after refresh.
  const persistKey = storageKey ?? null;

  // Whether audio reached its natural end — suppresses auto-resume logic.
  const isEndedRef = useRef(false);
  // Mirrors isPlaying state in a ref so event handlers always see the current value.
  const isPlayingRef = useRef(false);

  const setPlaying = useCallback((v: boolean) => {
    isPlayingRef.current = v;
    setIsPlaying(v);
  }, []);

  const updateTime = useCallback(() => {
    const el = audioRef.current;
    if (el) setCurrentTime(el.currentTime);
  }, []);

  // ── Persist position every 2s and on page unload ──────────────────────────
  useEffect(() => {
    if (!persistKey) return;
    const el = audioRef.current;
    if (!el) return;
    const save = () => {
      try {
        if (el.currentTime > 0 && !isEndedRef.current) {
          localStorage.setItem(persistKey, String(el.currentTime));
        }
      } catch {
        // ignore quota / disabled storage
      }
    };
    const interval = window.setInterval(save, 2000);
    window.addEventListener("beforeunload", save);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("beforeunload", save);
    };
  }, [persistKey]);

  // ── Core audio event listeners ────────────────────────────────────────────
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onLoadedMetadata = () => setDuration(el.duration);
    const handleEnded = () => {
      isEndedRef.current = true;
      setPlaying(false);
      // Clear saved position so the next student starts from the beginning.
      if (persistKey) {
        try { localStorage.removeItem(persistKey); } catch { /* ignore */ }
      }
      onEnded?.();
    };
    el.addEventListener("timeupdate", updateTime);
    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("ended", handleEnded);
    return () => {
      el.removeEventListener("timeupdate", updateTime);
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("ended", handleEnded);
    };
  }, [updateTime, onEnded, persistKey, setPlaying]);

  // ── Exam mode: auto-resume on unexpected pause (device kill / interruption) ──
  useEffect(() => {
    if (!examMode) return;
    const el = audioRef.current;
    if (!el) return;

    let resumeTimer: ReturnType<typeof setTimeout> | null = null;

    const handleUnexpectedPause = () => {
      // Only auto-resume if audio was actually playing when the pause hit.
      if (isEndedRef.current || !isPlayingRef.current) return;
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        if (el.paused && !isEndedRef.current) {
          el.play().catch(() => {});
        }
      }, 300);
    };

    // Stalled = browser can't get audio data. Reload from current position and resume.
    const handleStalled = () => {
      if (isEndedRef.current) return;
      const pos = el.currentTime;
      el.addEventListener(
        "canplay",
        () => {
          el.currentTime = pos;
          el.play().then(() => setPlaying(true)).catch(() => {});
        },
        { once: true },
      );
      el.load();
    };

    el.addEventListener("pause", handleUnexpectedPause);
    el.addEventListener("stalled", handleStalled);
    return () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      el.removeEventListener("pause", handleUnexpectedPause);
      el.removeEventListener("stalled", handleStalled);
    };
  }, [examMode, setPlaying]);

  // ── Exam mode: resume when tab becomes visible again ─────────────────────
  useEffect(() => {
    if (!examMode) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const el = audioRef.current;
        if (el && el.paused && !isEndedRef.current) {
          el.play().then(() => setPlaying(true)).catch(() => {});
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [examMode, setPlaying]);

  // ── Load audio, restore position, then auto-play in exam mode ─────────────
  useEffect(() => {
    if (!audioUrl) return;
    const el = audioRef.current;
    if (!el) return;

    isEndedRef.current = false;
    el.src = audioUrl;
    setDuration(0);

    // Read saved position before async metadata loads.
    let saved = 0;
    if (persistKey) {
      try {
        const raw = localStorage.getItem(persistKey);
        if (raw) saved = parseFloat(raw) || 0;
      } catch {
        // ignore
      }
    }
    setCurrentTime(saved);

    const seekAndPlay = () => {
      if (saved > 0 && el.duration && saved < el.duration - 1) {
        el.currentTime = saved;
      }
      if (!examMode) return;
      el.play()
        .then(() => setPlaying(true))
        .catch(() => {
          // Browser blocked autoplay — retry on first user interaction.
          const resume = () => {
            el.play().then(() => setPlaying(true)).catch(() => {});
            document.removeEventListener("click", resume);
            document.removeEventListener("keydown", resume);
          };
          document.addEventListener("click", resume, { once: true });
          document.addEventListener("keydown", resume, { once: true });
        });
    };

    if (el.readyState >= 1) {
      seekAndPlay();
    } else {
      el.addEventListener("loadedmetadata", seekAndPlay, { once: true });
    }
  }, [audioUrl, persistKey, examMode, setPlaying]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = playbackRate;
    setSpeedLabel(playbackRate === 1 ? "1" : playbackRate.toString());
  }, [playbackRate]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const rewind = () => {
    const el = audioRef.current;
    if (el) {
      el.currentTime = Math.max(0, el.currentTime - stepSeconds);
      updateTime();
    }
  };

  const forward = () => {
    const el = audioRef.current;
    if (el) {
      el.currentTime = Math.min(el.duration, el.currentTime + stepSeconds);
      updateTime();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    const el = audioRef.current;
    if (el) {
      el.currentTime = v;
      setCurrentTime(v);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    const el = audioRef.current;
    if (el) el.volume = v;
  };

  const cycleSpeed = () => {
    if (!audioUrl) return;
    const idx = SPEED_OPTIONS.indexOf(playbackRate);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setPlaybackRate(next);
  };

  const hasAudio = Boolean(audioUrl);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Exam mode: minimal UI — playing indicator + thin progress bar, no time
  if (examMode) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 w-full bg-paper border-b border-rule px-4 py-2",
          !hasAudio && "opacity-80",
          className
        )}
      >
        <audio ref={audioRef} preload="auto" />
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <div className="flex items-center gap-1">
              <span className="w-1 h-3 bg-mint rounded-full animate-pulse" />
              <span className="w-1 h-2 bg-mint rounded-full animate-pulse [animation-delay:150ms]" />
              <span className="w-1 h-4 bg-mint rounded-full animate-pulse [animation-delay:300ms]" />
            </div>
          ) : (
            <Volume2 className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-[10px] font-semibold text-mint-deep uppercase tracking-wider">
            {isPlaying ? "Playing" : hasAudio ? "Ready" : "No audio"}
          </span>
        </div>
        <div className="flex-1 relative h-1 bg-paper-3 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-mint rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Volume2 className="w-4 h-4 text-gray-500" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolume}
            disabled={!hasAudio}
            className="w-20 h-1.5 rounded-full appearance-none bg-paper-3 accent-mint cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    );
  }

  // Normal mode: full controls
  return (
    <div
      className={cn(
        "flex items-center gap-4 w-full bg-paper border-b border-rule px-4 py-3",
        !hasAudio && "opacity-80",
        className
      )}
    >
      <audio ref={audioRef} preload="metadata" />
      <button
        type="button"
        onClick={rewind}
        disabled={!hasAudio}
        className="flex items-center justify-center w-9 h-9 rounded-full border border-rule text-ink-soft hover:border-mint hover:text-mint-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={`Rewind ${stepSeconds}s`}
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={togglePlay}
        disabled={!hasAudio}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-ink text-paper hover:bg-ink-soft transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="w-6 h-6" />
        ) : (
          <Play className="w-6 h-6 ml-0.5" />
        )}
      </button>
      <button
        type="button"
        onClick={forward}
        disabled={!hasAudio}
        className="flex items-center justify-center w-9 h-9 rounded-full border border-rule text-ink-soft hover:border-mint hover:text-mint-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={`Forward ${stepSeconds}s`}
      >
        <RotateCw className="w-4 h-4" />
      </button>
      <span className="text-sm font-mono font-semibold text-ink-soft min-w-[48px]">
        {formatTime(currentTime)}
      </span>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          disabled={!hasAudio}
          className="flex-1 h-2 rounded-full appearance-none bg-paper-3 accent-mint cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex items-center gap-2">
        <Volume2 className="w-5 h-5 text-gray-500 flex-shrink-0" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={handleVolume}
          disabled={!hasAudio}
          className="w-20 h-1.5 rounded-full appearance-none bg-paper-3 accent-mint cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <button
        type="button"
        onClick={cycleSpeed}
        disabled={!hasAudio}
        className="px-3 py-1.5 rounded-md border border-rule text-sm font-semibold text-ink-soft hover:border-mint hover:text-mint-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Playback speed"
      >
        {speedLabel}x
      </button>
      {!hasAudio && (
        <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
          No audio
        </span>
      )}
    </div>
  );
};

export default AudioPlayer;
