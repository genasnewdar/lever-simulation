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
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [speedLabel, setSpeedLabel] = useState("1");

  const updateTime = useCallback(() => {
    const el = audioRef.current;
    if (el) setCurrentTime(el.currentTime);
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onLoadedMetadata = () => setDuration(el.duration);
    const onEnded = () => setIsPlaying(false);
    el.addEventListener("timeupdate", updateTime);
    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", updateTime);
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("ended", onEnded);
    };
  }, [updateTime]);

  useEffect(() => {
    if (!audioUrl) return;
    const el = audioRef.current;
    if (el) {
      el.src = audioUrl;
      setCurrentTime(0);
      setDuration(0);
    }
  }, [audioUrl]);

  // Auto-play in exam mode when audio is loaded
  useEffect(() => {
    if (!examMode || !audioUrl) return;
    const el = audioRef.current;
    if (!el) return;

    const tryAutoPlay = () => {
      el.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Browser blocked autoplay — retry on first user interaction
        const resume = () => {
          el.play().then(() => setIsPlaying(true)).catch(() => {});
          document.removeEventListener("click", resume);
          document.removeEventListener("keydown", resume);
        };
        document.addEventListener("click", resume, { once: true });
        document.addEventListener("keydown", resume, { once: true });
      });
    };

    if (el.readyState >= 2) {
      tryAutoPlay();
    } else {
      el.addEventListener("canplay", tryAutoPlay, { once: true });
    }
  }, [examMode, audioUrl]);

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
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
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
          "flex items-center gap-3 w-full bg-white border-b border-gray-200 px-4 py-2 shadow-sm",
          !hasAudio && "opacity-80",
          className
        )}
      >
        <audio ref={audioRef} preload="auto" />
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <div className="flex items-center gap-1">
              <span className="w-1 h-3 bg-teal-500 rounded-full animate-pulse" />
              <span className="w-1 h-2 bg-teal-400 rounded-full animate-pulse [animation-delay:150ms]" />
              <span className="w-1 h-4 bg-teal-500 rounded-full animate-pulse [animation-delay:300ms]" />
            </div>
          ) : (
            <Volume2 className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
            {isPlaying ? "Playing" : hasAudio ? "Ready" : "No audio"}
          </span>
        </div>
        <div className="flex-1 relative h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-teal-500 rounded-full transition-all duration-300"
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
            className="w-20 h-1.5 rounded-full appearance-none bg-gray-200 accent-teal-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    );
  }

  // Normal mode: full controls
  return (
    <div
      className={cn(
        "flex items-center gap-4 w-full bg-white border-b border-gray-200 px-4 py-3 shadow-sm",
        !hasAudio && "opacity-80",
        className
      )}
    >
      <audio ref={audioRef} preload="metadata" />
      <button
        type="button"
        onClick={rewind}
        disabled={!hasAudio}
        className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-gray-200 text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={`Rewind ${stepSeconds}s`}
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={togglePlay}
        disabled={!hasAudio}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-500 text-white hover:bg-teal-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
        className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-gray-200 text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={`Forward ${stepSeconds}s`}
      >
        <RotateCw className="w-4 h-4" />
      </button>
      <span className="text-sm font-mono font-semibold text-gray-700 min-w-[48px]">
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
          className="flex-1 h-2 rounded-full appearance-none bg-gray-200 accent-teal-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="w-20 h-1.5 rounded-full appearance-none bg-gray-200 accent-teal-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <button
        type="button"
        onClick={cycleSpeed}
        disabled={!hasAudio}
        className="px-3 py-1.5 rounded-md border border-gray-200 text-sm font-semibold text-gray-700 hover:border-teal-500 hover:text-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
