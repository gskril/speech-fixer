"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { AudioUpload } from "@/components/AudioUpload";
import { Waveform } from "@/components/Waveform";
import { TranscriptEditor } from "@/components/TranscriptEditor";
import { ReplacementInput } from "@/components/ReplacementInput";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { ModeToggle, AppMode } from "@/components/ModeToggle";
import { GenerateMode } from "@/components/GenerateMode";
import { TranscriptionResult, WordSelection } from "@/lib/types";
import {
  useTranscribe,
  useCloneVoice,
  useDeleteVoice,
  useReplaceAudio,
} from "@/hooks/useApi";

interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "completed" | "error";
  error?: string;
}

export default function Home() {
  const [mode, setMode] = useState<AppMode>("fix");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] =
    useState<TranscriptionResult | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [selection, setSelection] = useState<WordSelection | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{
    start: number;
    end: number;
  } | null>(null);

  // React Query mutations
  const transcribeMutation = useTranscribe();
  const cloneVoiceMutation = useCloneVoice();
  const deleteVoiceMutation = useDeleteVoice();
  const { replaceAudio, synthesizeStatus, spliceStatus } = useReplaceAudio();

  // Keep a ref to voiceId for cleanup on page unload
  const voiceIdRef = useRef<string | null>(null);
  useEffect(() => {
    voiceIdRef.current = voiceId;
  }, [voiceId]);

  // Clean up voice on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (voiceIdRef.current) {
        const data = JSON.stringify({ voiceId: voiceIdRef.current });
        navigator.sendBeacon(
          "/api/clone-voice",
          new Blob([data], { type: "application/json" })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (voiceIdRef.current) {
        fetch("/api/clone-voice", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voiceId: voiceIdRef.current }),
        }).catch(() => {});
      }
    };
  }, []);

  // Clean up audio URL when component unmounts or audio changes
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Derive processing state from mutations
  const isProcessing =
    transcribeMutation.isPending ||
    cloneVoiceMutation.isPending ||
    replaceAudio.isPending;

  // Derive error from mutations
  const error = useMemo(() => {
    if (transcribeMutation.error) return transcribeMutation.error.message;
    if (cloneVoiceMutation.error) return cloneVoiceMutation.error.message;
    if (replaceAudio.error) return replaceAudio.error.message;
    return null;
  }, [
    transcribeMutation.error,
    cloneVoiceMutation.error,
    replaceAudio.error,
  ]);

  // Derive processing steps from mutation states
  const processingSteps = useMemo((): ProcessingStep[] => {
    // File processing steps
    if (
      transcribeMutation.isPending ||
      cloneVoiceMutation.isPending ||
      (transcribeMutation.isSuccess && cloneVoiceMutation.isIdle)
    ) {
      return [
        {
          id: "transcribe",
          label: "Transcribing audio...",
          status: transcribeMutation.isPending
            ? "in_progress"
            : transcribeMutation.isSuccess
              ? "completed"
              : transcribeMutation.isError
                ? "error"
                : "pending",
          error: transcribeMutation.error?.message,
        },
        {
          id: "clone",
          label: "Creating voice clone...",
          status: cloneVoiceMutation.isPending
            ? "in_progress"
            : cloneVoiceMutation.isSuccess
              ? "completed"
              : cloneVoiceMutation.isError
                ? "error"
                : "pending",
          error: cloneVoiceMutation.error?.message,
        },
      ];
    }

    // Replace audio steps
    if (replaceAudio.isPending) {
      return [
        {
          id: "synthesize",
          label: "Generating new audio...",
          status:
            synthesizeStatus === "pending"
              ? "in_progress"
              : synthesizeStatus === "success"
                ? "completed"
                : synthesizeStatus === "error"
                  ? "error"
                  : "pending",
        },
        {
          id: "splice",
          label: "Splicing audio...",
          status:
            spliceStatus === "pending"
              ? "in_progress"
              : spliceStatus === "success"
                ? "completed"
                : spliceStatus === "error"
                  ? "error"
                  : "pending",
        },
      ];
    }

    return [];
  }, [
    transcribeMutation.isPending,
    transcribeMutation.isSuccess,
    transcribeMutation.isError,
    transcribeMutation.error,
    cloneVoiceMutation.isPending,
    cloneVoiceMutation.isSuccess,
    cloneVoiceMutation.isError,
    cloneVoiceMutation.error,
    cloneVoiceMutation.isIdle,
    replaceAudio.isPending,
    synthesizeStatus,
    spliceStatus,
  ]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Reset mutations
      transcribeMutation.reset();
      cloneVoiceMutation.reset();
      replaceAudio.reset();

      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);

      // Clear previous state
      setTranscription(null);
      setVoiceId(null);
      setSelection(null);
      setSelectedRegion(null);

      try {
        // Run transcription first, then voice cloning
        const transcriptionData = await transcribeMutation.mutateAsync(file);
        setTranscription(transcriptionData);

        const cloneData = await cloneVoiceMutation.mutateAsync(file);
        setVoiceId(cloneData.voice_id);
      } catch {
        // Error is handled by the mutation state
      }
    },
    [transcribeMutation, cloneVoiceMutation, replaceAudio]
  );

  const handleSelectionChange = useCallback(
    (newSelection: WordSelection | null) => {
      setSelection(newSelection);
      if (newSelection) {
        setSelectedRegion({
          start: newSelection.startTime,
          end: newSelection.endTime,
        });
      } else {
        setSelectedRegion(null);
      }
    },
    []
  );

  const handleRegionSelect = useCallback(
    (start: number, end: number) => {
      if (!transcription) return;

      const words = transcription.words;
      let startIndex = -1;
      let endIndex = -1;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word.type !== "word") continue;

        if (word.start >= start && word.end <= end) {
          if (startIndex === -1) startIndex = i;
          endIndex = i;
        } else if (word.start <= start && word.end >= start) {
          if (startIndex === -1) startIndex = i;
          endIndex = i;
        } else if (word.start <= end && word.end >= end) {
          endIndex = i;
        }
      }

      if (startIndex !== -1 && endIndex !== -1) {
        const selectedWords = words.slice(startIndex, endIndex + 1);
        const selectedText = selectedWords.map((w) => w.text).join("");
        const wordItems = selectedWords.filter((w) => w.type === "word");

        setSelection({
          startIndex,
          endIndex,
          startTime: wordItems[0]?.start ?? start,
          endTime: wordItems[wordItems.length - 1]?.end ?? end,
          selectedText,
        });

        setSelectedRegion({ start, end });
      }
    },
    [transcription]
  );

  const handleReplace = useCallback(
    async (newText: string) => {
      if (!selection || !voiceId || !audioFile || !transcription) return;

      // Extract surrounding text for context (helps with natural intonation)
      const words = transcription.words;

      // Get up to 10 words before the selection
      const beforeWords = words.slice(Math.max(0, selection.startIndex - 10), selection.startIndex);
      const previousText = beforeWords.map(w => w.text).join("");

      // Get up to 10 words after the selection
      const afterWords = words.slice(selection.endIndex + 1, selection.endIndex + 11);
      const nextText = afterWords.map(w => w.text).join("");

      try {
        const result = await replaceAudio.mutateAsync({
          text: newText,
          voiceId,
          originalAudio: audioFile,
          startTime: selection.startTime,
          endTime: selection.endTime,
          previousText: previousText || undefined,
          nextText: nextText || undefined,
        });

        // Create new File and URL from spliced audio
        const response = await fetch(`data:audio/mpeg;base64,${result.audio}`);
        const newBlob = await response.blob();
        const newFile = new File([newBlob], audioFile.name, {
          type: "audio/mpeg",
        });

        // Revoke old URL
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }

        // Set new audio
        const newUrl = URL.createObjectURL(newBlob);
        setAudioFile(newFile);
        setAudioUrl(newUrl);

        // Update transcription
        if (transcription) {
          const newWords = [...transcription.words];
          const originalDuration = selection.endTime - selection.startTime;
          const estimatedDuration =
            originalDuration * (newText.length / selection.selectedText.length);
          const timeOffset = estimatedDuration - originalDuration;

          const newWord = {
            text: newText,
            start: selection.startTime,
            end: selection.startTime + estimatedDuration,
            type: "word" as const,
          };

          newWords.splice(
            selection.startIndex,
            selection.endIndex - selection.startIndex + 1,
            newWord
          );

          for (let i = selection.startIndex + 1; i < newWords.length; i++) {
            newWords[i] = {
              ...newWords[i],
              start: newWords[i].start + timeOffset,
              end: newWords[i].end + timeOffset,
            };
          }

          setTranscription({
            ...transcription,
            words: newWords,
            text: newWords.map((w) => w.text).join(""),
          });
        }

        // Clear selection
        setSelection(null);
        setSelectedRegion(null);
      } catch {
        // Error is handled by the mutation state
      }
    },
    [selection, voiceId, audioFile, audioUrl, transcription, replaceAudio]
  );

  const handleDownload = useCallback(() => {
    if (!audioUrl || !audioFile) return;

    // Output is always MP3, so replace original extension
    const baseName = audioFile.name.replace(/\.[^/.]+$/, "");
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `edited-${baseName}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [audioUrl, audioFile]);

  const handleReset = useCallback(() => {
    // Cleanup voice on ElevenLabs
    if (voiceId) {
      deleteVoiceMutation.mutate(voiceId);
    }

    // Revoke URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    // Reset mutations
    transcribeMutation.reset();
    cloneVoiceMutation.reset();
    replaceAudio.reset();

    // Reset all state
    setAudioFile(null);
    setAudioUrl(null);
    setTranscription(null);
    setVoiceId(null);
    setSelection(null);
    setSelectedRegion(null);
  }, [
    voiceId,
    audioUrl,
    deleteVoiceMutation,
    transcribeMutation,
    cloneVoiceMutation,
    replaceAudio,
  ]);

  return (
    <div className="relative min-h-screen">
      <ProcessingStatus steps={processingSteps} isVisible={isProcessing} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-10 sm:mb-14">
          <div className="flex items-center gap-3 mb-4">
            {/* Logo mark */}
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center glow-amber">
                <svg
                  className="w-5 h-5 text-slate-950"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-themed-primary tracking-tight">
              Speech Fixer
            </h1>
          </div>
          <p className="text-themed-tertiary text-base sm:text-lg max-w-xl text-balance leading-relaxed mb-6">
            {mode === "fix"
              ? "Fix words in your recordings with AI. Upload audio, select what to change, and let voice cloning do the rest."
              : "Generate new audio with your voice. Record a sample, type your script, and let AI create the audio."}
          </p>
          <ModeToggle
            mode={mode}
            onModeChange={setMode}
            disabled={isProcessing || !!audioUrl}
          />
        </header>

        {/* Generate Mode */}
        {mode === "generate" && <GenerateMode />}

        {/* Fix Mode */}
        {mode === "fix" && (
          <>
            {/* Error Display */}
            {error && (
              <div className="mb-6 animate-fade-in">
                <div className="card p-4 border-red-500/30 bg-red-500/5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-400">
                        Something went wrong
                      </p>
                      <p className="text-sm text-red-400/70 mt-0.5">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Section */}
            {!audioUrl && (
              <div className="animate-fade-in">
                <AudioUpload
                  onFileSelect={handleFileSelect}
                  isLoading={isProcessing}
                />
              </div>
            )}

            {/* Editor Section */}
            {audioUrl && (
          <div className="space-y-5 animate-fade-in">
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="tag tag-amber">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Ready
                </div>
                <span className="text-sm text-themed-tertiary truncate">
                  {audioFile?.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDownload} className="btn btn-primary">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </button>
                <button onClick={handleReset} className="btn btn-secondary">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  New File
                </button>
              </div>
            </div>

            {/* Waveform */}
            <div className="animate-slide-up stagger-1 opacity-0">
              <Waveform
                audioUrl={audioUrl}
                selectedRegion={selectedRegion}
                onRegionSelect={handleRegionSelect}
                onTimeUpdate={setCurrentTime}
              />
            </div>

            {/* Transcript */}
            {transcription && (
              <div className="animate-slide-up stagger-2 opacity-0">
                <TranscriptEditor
                  words={transcription.words}
                  currentTime={currentTime}
                  onSelectionChange={handleSelectionChange}
                  selectedIndices={
                    selection
                      ? { start: selection.startIndex, end: selection.endIndex }
                      : null
                  }
                />
              </div>
            )}

            {/* Replacement Input */}
            <div className="animate-slide-up stagger-3 opacity-0">
              <ReplacementInput
                selection={selection}
                onReplace={handleReplace}
                isProcessing={isProcessing}
              />
            </div>

            {/* Voice Clone Status */}
            {voiceId && (
              <div className="flex justify-center animate-fade-in stagger-4 opacity-0">
                <div className="tag">
                  <svg
                    className="w-3 h-3 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 8 8"
                  >
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Voice clone active
                </div>
              </div>
            )}
          </div>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-themed">
          <p className="text-xs text-themed-muted text-center">
            Powered by ElevenLabs voice synthesis
          </p>
        </footer>
      </div>
    </div>
  );
}
