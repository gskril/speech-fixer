"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ElevenLabs supported formats
const SUPPORTED_AUDIO_EXTENSIONS = [".aac", ".aiff", ".ogg", ".mp3", ".opus", ".wav", ".flac", ".m4a", ".webm"];

// Script designed to capture varied speech patterns in ~45-60 seconds
const VOICE_SAMPLE_SCRIPT = `Hello! Welcome to my voice sample recording. I'm going to read a short passage to help create my voice clone.

The weather today is quite nice, isn't it? I really enjoy sunny days like this one. Sometimes I wonder what makes the sky so blue.

Let me count to five: one, two, three, four, five. Now let me express some emotions. I'm so excited about this! Oh no, that's terrible news. Well, that's interesting.

In conclusion, this recording should capture enough of my voice for a good clone. Thank you for listening!`;

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing?: boolean;
}

export function VoiceRecorder({
  onRecordingComplete,
  isProcessing = false,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isFromUpload, setIsFromUpload] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        setAudioBlob(blob);

        // Revoke old URL if exists
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          setPermissionError(
            "Microphone access denied. Please allow microphone access in your browser settings."
          );
        } else if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError"
        ) {
          setPermissionError(
            "No microphone found. Please connect a microphone and try again."
          );
        } else {
          setPermissionError(`Recording error: ${error.message}`);
        }
      }
    }
  }, [audioUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, audioUrl]);

  const handleRetake = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setIsFromUpload(false);
    setUploadedFileName(null);
    setUploadError(null);
  }, [audioUrl]);

  const validateFile = useCallback((file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const hasValidExtension = SUPPORTED_AUDIO_EXTENSIONS.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = file.type.includes("audio/");

    if (!hasValidExtension && !hasValidMimeType) {
      setUploadError("Please upload an audio file (MP3, WAV, M4A, etc.)");
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }
    setUploadError(null);
    return true;
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        // Revoke old URL if exists
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }

        setAudioBlob(file);
        const url = URL.createObjectURL(file);
        setAudioUrl(url);
        setIsFromUpload(true);
        setUploadedFileName(file.name);
        setRecordingTime(0); // We don't know the duration yet, will be set when audio loads
      }
    }
    // Reset the input so the same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  }, [audioUrl, validateFile]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUseRecording = useCallback(() => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  }, [audioBlob, onRecordingComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="card p-6 sm:p-8">
      {/* Script Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-xs font-bold text-amber-400">1</span>
          </div>
          <h3 className="text-sm font-medium text-themed-secondary">
            Read this script aloud
          </h3>
        </div>
        <div className="relative p-4 rounded-xl bg-themed-tertiary border border-themed">
          <p className="text-sm text-themed-secondary leading-relaxed whitespace-pre-line">
            {VOICE_SAMPLE_SCRIPT}
          </p>
          <div className="absolute bottom-2 right-2">
            <span className="tag text-xs">~45-60 seconds</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-themed-muted">
          Read naturally at your normal pace. Avoid background noise for best
          results.
        </p>
      </div>

      {/* Recording Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-xs font-bold text-amber-400">2</span>
          </div>
          <h3 className="text-sm font-medium text-themed-secondary">
            Record your voice
          </h3>
        </div>

        {/* Permission Error */}
        {permissionError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{permissionError}</p>
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{uploadError}</p>
          </div>
        )}

        {/* Recording UI */}
        <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-themed-tertiary border border-themed">
          {/* Recording indicator */}
          <div className="relative">
            <div
              className={`
                w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
                ${isRecording ? "bg-red-500/20" : audioUrl ? "bg-green-500/20" : "bg-themed-secondary"}
              `}
            >
              {isRecording ? (
                <>
                  <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                  <svg
                    className="w-8 h-8 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                </>
              ) : audioUrl ? (
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-8 h-8 text-themed-tertiary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Timer */}
          <div className="text-2xl font-mono text-themed-primary">
            {formatTime(recordingTime)}
          </div>

          {/* Status text */}
          <p className="text-sm text-themed-tertiary">
            {isRecording
              ? "Recording... Click stop when finished"
              : audioUrl
                ? isFromUpload
                  ? `File uploaded: ${uploadedFileName}`
                  : "Recording complete!"
                : "Record or upload a voice sample"}
          </p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.aiff,.opus,.webm"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isProcessing || isRecording}
          />

          {/* Controls */}
          <div className="flex items-center gap-3">
            {!audioUrl ? (
              <>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`
                    btn ${isRecording ? "bg-red-500 hover:bg-red-600 text-white" : "btn-primary"}
                    ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {isRecording ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <rect x="6" y="6" width="12" height="12" rx="1" />
                      </svg>
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="6" />
                      </svg>
                      Record
                    </>
                  )}
                </button>
                {!isRecording && (
                  <button
                    onClick={handleUploadClick}
                    disabled={isProcessing}
                    className={`
                      btn btn-secondary
                      ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Upload File
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handlePlayPause}
                  disabled={isProcessing}
                  className="btn btn-secondary"
                >
                  {isPlaying ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                      Pause
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Play
                    </>
                  )}
                </button>
                <button
                  onClick={handleRetake}
                  disabled={isProcessing}
                  className="btn btn-secondary"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {isFromUpload ? "Try Again" : "Retake"}
                </button>
              </>
            )}
          </div>

          {/* Hidden audio element for playback */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onLoadedMetadata={(e) => {
                // For uploaded files, set the duration once loaded
                if (isFromUpload && e.currentTarget.duration) {
                  setRecordingTime(Math.floor(e.currentTarget.duration));
                }
              }}
            />
          )}
        </div>

        {/* Recording quality tips */}
        {!audioUrl && !isRecording && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="tag text-xs">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Quiet environment
            </span>
            <span className="tag text-xs">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Speak clearly
            </span>
            <span className="tag text-xs">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Natural pace
            </span>
          </div>
        )}
      </div>

      {/* Use Recording Button */}
      {audioUrl && (isFromUpload || recordingTime >= 10) && (
        <button
          onClick={handleUseRecording}
          disabled={isProcessing}
          className={`
            w-full btn btn-primary py-3
            ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              {isFromUpload ? "Use This File" : "Use This Recording"}
            </>
          )}
        </button>
      )}

      {/* Warning for short recordings (only for recorded audio, not uploads) */}
      {audioUrl && !isFromUpload && recordingTime < 10 && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-400">
            Recording is too short ({formatTime(recordingTime)}). Please record
            at least 10 seconds for a quality voice clone.
          </p>
        </div>
      )}

      {/* Info for uploaded files */}
      {audioUrl && isFromUpload && recordingTime > 0 && recordingTime < 10 && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-400">
            This file is quite short ({formatTime(recordingTime)}). For best voice cloning results, use at least 10 seconds of audio.
          </p>
        </div>
      )}
    </div>
  );
}
