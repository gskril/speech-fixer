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

    const regions = RegionsPlugin.create();
    regionsRef.current = regions;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#57534e",
      progressColor: "#fbbf24",
      cursorColor: "#f59e0b",
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

    return () => {
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
          <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5 text-slate-400"
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
          <span className="text-sm font-medium text-slate-300">Waveform</span>
        </div>
        <span className="text-xs text-slate-500">
          Drag to select a region
        </span>
      </div>

      {/* Waveform container */}
      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden bg-slate-900/50 border border-slate-800"
      />

      {/* Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          {/* Play/Pause button */}
          <button
            onClick={togglePlayPause}
            disabled={!isReady}
            className="btn btn-icon bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 transition-colors"
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
        <div className="font-mono text-sm text-slate-400 tabular-nums">
          <span className="text-slate-200">{formatTime(currentTime)}</span>
          <span className="mx-1.5 text-slate-600">/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Selection info */}
      {selectedRegion && (
        <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400">
              Selection
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {formatTime(selectedRegion.start)} -{" "}
              {formatTime(selectedRegion.end)}
              <span className="ml-2 text-slate-500">
                ({(selectedRegion.end - selectedRegion.start).toFixed(2)}s)
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
