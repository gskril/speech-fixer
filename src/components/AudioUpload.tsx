"use client";

import { useCallback, useState } from "react";

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface AudioUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export function AudioUpload({
  onFileSelect,
  isLoading = false,
}: AudioUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = useCallback((file: File): boolean => {
    if (!file.type.includes("audio/") && !file.name.endsWith(".mp3")) {
      alert("Please upload an MP3 audio file.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }
    return true;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (validateFile(file)) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect, validateFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (validateFile(file)) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect, validateFile]
  );

  return (
    <div
      className={`
        relative card p-8 sm:p-12 transition-all duration-300 group
        ${isDragging ? "border-amber-500/50 bg-amber-500/5 glow-amber" : "hover:border-slate-600"}
        ${isLoading ? "opacity-50 pointer-events-none" : "cursor-pointer"}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="audio/mp3,audio/mpeg,.mp3"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />

      <div className="flex flex-col items-center text-center">
        {/* Animated waveform icon */}
        <div className="relative mb-6">
          <div
            className={`
              w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300
              ${isDragging ? "bg-amber-500/20" : "bg-slate-800/80 group-hover:bg-slate-800"}
            `}
          >
            {/* Waveform bars animation */}
            <div className="flex items-center gap-1">
              {[0.4, 0.7, 1, 0.6, 0.8, 0.5, 0.9].map((height, i) => (
                <div
                  key={i}
                  className={`
                    w-1 rounded-full transition-all duration-300
                    ${isDragging ? "bg-amber-400" : "bg-slate-500 group-hover:bg-amber-400/70"}
                  `}
                  style={{
                    height: `${height * 32}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Decorative ring */}
          <div
            className={`
              absolute inset-0 rounded-2xl border-2 transition-all duration-300
              ${isDragging ? "border-amber-400/30 scale-110" : "border-transparent"}
            `}
          />
        </div>

        {/* Text content */}
        <div className="space-y-2 mb-6">
          <p className="text-lg font-medium text-slate-200">
            {isDragging ? "Drop it here" : "Drop your audio file"}
          </p>
          <p className="text-sm text-slate-500">
            or{" "}
            <span className="text-amber-400 underline underline-offset-2">
              browse files
            </span>
          </p>
        </div>

        {/* Format badge */}
        <div className="tag">
          <svg
            className="w-3 h-3"
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
          MP3 up to {MAX_FILE_SIZE_MB}MB
        </div>

        {/* Quality tips */}
        <div className="mt-6 pt-4 border-t border-slate-700/50 w-full max-w-sm">
          <p className="text-xs text-slate-500 mb-2 font-medium">
            For best voice cloning:
          </p>
          <ul className="text-xs text-slate-500 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>Use 1-2 minutes of clear speech</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>Avoid background noise & echo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>Consistent volume throughout</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-300">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
