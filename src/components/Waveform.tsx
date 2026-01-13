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

  // Keep refs up to date with latest callback values
  useEffect(() => {
    onRegionSelectRef.current = onRegionSelect;
  }, [onRegionSelect]);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    // Create regions plugin
    const regions = RegionsPlugin.create();
    regionsRef.current = regions;

    // Create WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#94a3b8",
      progressColor: "#3b82f6",
      cursorColor: "#1d4ed8",
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 128,
      normalize: true,
      plugins: [regions],
    });

    wavesurferRef.current = wavesurfer;

    // Load audio
    wavesurfer.load(audioUrl);

    // Event listeners
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

    // Region events
    regions.on("region-created", (region) => {
      // Remove any existing regions
      if (activeRegionRef.current && activeRegionRef.current.id !== region.id) {
        activeRegionRef.current.remove();
      }
      activeRegionRef.current = region;
    });

    regions.on("region-updated", (region) => {
      onRegionSelectRef.current?.(region.start, region.end);
    });

    // Enable drag selection for creating regions
    regions.enableDragSelection({
      color: "rgba(59, 130, 246, 0.3)",
    });

    return () => {
      wavesurfer.destroy();
      wavesurferRef.current = null;
      regionsRef.current = null;
      activeRegionRef.current = null;
      setIsReady(false);
    };
  }, [audioUrl]);

  // Update region when selectedRegion prop changes
  useEffect(() => {
    if (!regionsRef.current || !isReady) return;

    // Clear existing regions
    regionsRef.current.clearRegions();

    if (selectedRegion) {
      activeRegionRef.current = regionsRef.current.addRegion({
        start: selectedRegion.start,
        end: selectedRegion.end,
        color: "rgba(59, 130, 246, 0.3)",
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Audio Waveform
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Click and drag on the waveform to select a region
        </p>
      </div>

      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900"
      />

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlayPause}
            disabled={!isReady}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {selectedRegion && (
            <button
              onClick={playRegion}
              disabled={!isReady}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play Selection
            </button>
          )}
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {selectedRegion && (
        <div className="mt-3 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Selected: {formatTime(selectedRegion.start)} - {formatTime(selectedRegion.end)}
            <span className="ml-2 text-gray-500">
              ({(selectedRegion.end - selectedRegion.start).toFixed(2)}s)
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
