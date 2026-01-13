"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin, { Region } from "wavesurfer.js/dist/plugins/regions.js";

interface WaveformProps {
  audioUrl: string | null;
  onRegionSelect?: (start: number, end: number) => void;
  selectedRegion?: { start: number; end: number } | null;
  onTimeUpdate?: (currentTime: number) => void;
}

export function Waveform({
  audioUrl,
  onRegionSelect,
  selectedRegion,
  onTimeUpdate,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const activeRegionRef = useRef<Region | null>(null);
  const onRegionSelectRef = useRef(onRegionSelect);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    onRegionSelectRef.current = onRegionSelect;
  }, [onRegionSelect]);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    // Detect color scheme for waveform colors
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const waveColor = isDark ? "#57534e" : "#a8a29e";
    const progressColor = isDark ? "#fbbf24" : "#d97706";
    const cursorColor = isDark ? "#f59e0b" : "#b45309";

    const regions = RegionsPlugin.create();
    regionsRef.current = regions;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      cursorColor,
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 100,
      normalize: true,
      plugins: [regions],
    });

    wavesurferRef.current = wavesurfer;
    wavesurfer.load(audioUrl);

    wavesurfer.on("ready", () => {
      setDuration(wavesurfer.getDuration());
      setIsReady(true);
    });

    wavesurfer.on("play", () => setIsPlaying(true));
    wavesurfer.on("pause", () => setIsPlaying(false));

    wavesurfer.on("timeupdate", (time) => {
      setCurrentTime(time);
      onTimeUpdateRef.current?.(time);
    });

    regions.on("region-created", (region) => {
      if (activeRegionRef.current && activeRegionRef.current.id !== region.id) {
        activeRegionRef.current.remove();
      }
      activeRegionRef.current = region;
    });

    regions.on("region-updated", (region) => {
      onRegionSelectRef.current?.(region.start, region.end);
    });

    regions.enableDragSelection({
      color: "rgba(251, 191, 36, 0.2)",
    });

    // Listen for color scheme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const newWaveColor = e.matches ? "#57534e" : "#a8a29e";
      const newProgressColor = e.matches ? "#fbbf24" : "#d97706";
      const newCursorColor = e.matches ? "#f59e0b" : "#b45309";
      wavesurfer.setOptions({
        waveColor: newWaveColor,
        progressColor: newProgressColor,
        cursorColor: newCursorColor,
      });
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      wavesurfer.destroy();
      wavesurferRef.current = null;
      regionsRef.current = null;
      activeRegionRef.current = null;
      setIsReady(false);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (!regionsRef.current || !isReady) return;

    regionsRef.current.clearRegions();

    if (selectedRegion) {
      activeRegionRef.current = regionsRef.current.addRegion({
        start: selectedRegion.start,
        end: selectedRegion.end,
        color: "rgba(251, 191, 36, 0.2)",
        drag: true,
        resize: true,
      });
    }
  }, [selectedRegion, isReady]);

  const togglePlayPause = useCallback(() => {
    wavesurferRef.current?.playPause();
  }, []);

  const playRegion = useCallback(() => {
    if (activeRegionRef.current) {
      activeRegionRef.current.play();
    }
  }, []);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!audioUrl) {
    return null;
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-themed-tertiary flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5 text-themed-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <span className="text-sm font-medium text-themed-secondary">Waveform</span>
        </div>
        <span className="text-xs text-themed-muted">
          Drag to select a region
        </span>
      </div>

      {/* Waveform container */}
      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden bg-themed-secondary border border-themed"
      />

      {/* Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          {/* Play/Pause button */}
          <button
            onClick={togglePlayPause}
            disabled={!isReady}
            className="btn btn-icon bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 ml-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Play Selection button */}
          {selectedRegion && (
            <button
              onClick={playRegion}
              disabled={!isReady}
              className="btn btn-secondary text-sm py-2 px-3"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              Play Selection
            </button>
          )}
        </div>

        {/* Time display */}
        <div className="font-mono text-sm text-themed-tertiary tabular-nums">
          <span className="text-themed-primary">{formatTime(currentTime)}</span>
          <span className="mx-1.5 text-themed-muted">/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Selection info */}
      {selectedRegion && (
        <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-themed-accent">
              Selection
            </span>
            <span className="text-xs text-themed-tertiary font-mono tabular-nums">
              {formatTime(selectedRegion.start)} -{" "}
              {formatTime(selectedRegion.end)}
              <span className="ml-2 text-themed-muted">
                ({(selectedRegion.end - selectedRegion.start).toFixed(2)}s)
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
