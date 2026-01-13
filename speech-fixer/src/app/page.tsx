"use client";

import { useState, useCallback, useEffect } from "react";
import { AudioUpload } from "@/components/AudioUpload";
import { Waveform } from "@/components/Waveform";
import { TranscriptEditor } from "@/components/TranscriptEditor";
import { ReplacementInput } from "@/components/ReplacementInput";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { TranscriptionResult, WordSelection } from "@/lib/types";

interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "completed" | "error";
  error?: string;
}

export default function Home() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [selection, setSelection] = useState<WordSelection | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{ start: number; end: number } | null>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up audio URL when component unmounts or audio changes
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setAudioFile(file);
    
    // Create object URL for playback
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    // Clear previous state
    setTranscription(null);
    setVoiceId(null);
    setSelection(null);
    setSelectedRegion(null);

    // Start transcription and voice cloning
    setProcessingSteps([
      { id: "transcribe", label: "Transcribing audio...", status: "in_progress" },
      { id: "clone", label: "Creating voice clone...", status: "pending" },
    ]);
    setIsProcessing(true);

    try {
      // Transcribe audio
      const transcribeFormData = new FormData();
      transcribeFormData.append("audio", file);
      
      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: transcribeFormData,
      });

      if (!transcribeRes.ok) {
        const errorData = await transcribeRes.json();
        throw new Error(errorData.error || "Transcription failed");
      }

      const transcriptionData: TranscriptionResult = await transcribeRes.json();
      setTranscription(transcriptionData);

      setProcessingSteps((prev) =>
        prev.map((step) =>
          step.id === "transcribe"
            ? { ...step, status: "completed" }
            : step.id === "clone"
            ? { ...step, status: "in_progress" }
            : step
        )
      );

      // Clone voice
      const cloneFormData = new FormData();
      cloneFormData.append("audio", file);
      cloneFormData.append("name", `Voice-${Date.now()}`);

      const cloneRes = await fetch("/api/clone-voice", {
        method: "POST",
        body: cloneFormData,
      });

      if (!cloneRes.ok) {
        const errorData = await cloneRes.json();
        throw new Error(errorData.error || "Voice cloning failed");
      }

      const cloneData = await cloneRes.json();
      setVoiceId(cloneData.voice_id);

      setProcessingSteps((prev) =>
        prev.map((step) =>
          step.id === "clone" ? { ...step, status: "completed" } : step
        )
      );

      // Hide processing overlay after a short delay
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingSteps([]);
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setProcessingSteps((prev) =>
        prev.map((step) =>
          step.status === "in_progress"
            ? { ...step, status: "error", error: errorMessage }
            : step
        )
      );

      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
    }
  }, []);

  const handleSelectionChange = useCallback((newSelection: WordSelection | null) => {
    setSelection(newSelection);
    if (newSelection) {
      setSelectedRegion({
        start: newSelection.startTime,
        end: newSelection.endTime,
      });
    } else {
      setSelectedRegion(null);
    }
  }, []);

  const handleRegionSelect = useCallback(
    (start: number, end: number) => {
      if (!transcription) return;

      // Find words that fall within this region
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
      if (!selection || !voiceId || !audioFile) return;

      setError(null);
      setProcessingSteps([
        { id: "synthesize", label: "Generating new audio...", status: "in_progress" },
        { id: "splice", label: "Splicing audio...", status: "pending" },
      ]);
      setIsProcessing(true);

      try {
        // Synthesize new audio
        const synthRes = await fetch("/api/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: newText,
            voiceId: voiceId,
          }),
        });

        if (!synthRes.ok) {
          const errorData = await synthRes.json();
          throw new Error(errorData.error || "Synthesis failed");
        }

        const synthData = await synthRes.json();

        setProcessingSteps((prev) =>
          prev.map((step) =>
            step.id === "synthesize"
              ? { ...step, status: "completed" }
              : step.id === "splice"
              ? { ...step, status: "in_progress" }
              : step
          )
        );

        // Splice audio
        const spliceFormData = new FormData();
        spliceFormData.append("originalAudio", audioFile);
        spliceFormData.append("replacementAudio", synthData.audio);
        spliceFormData.append("startTime", selection.startTime.toString());
        spliceFormData.append("endTime", selection.endTime.toString());

        const spliceRes = await fetch("/api/splice", {
          method: "POST",
          body: spliceFormData,
        });

        if (!spliceRes.ok) {
          const errorData = await spliceRes.json();
          throw new Error(errorData.error || "Splicing failed");
        }

        const spliceData = await spliceRes.json();

        // Create new File and URL from spliced audio
        const binaryStr = atob(spliceData.audio);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const newBlob = new Blob([bytes], { type: "audio/mpeg" });
        const newFile = new File([newBlob], audioFile.name, { type: "audio/mpeg" });

        // Revoke old URL
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }

        // Set new audio
        const newUrl = URL.createObjectURL(newBlob);
        setAudioFile(newFile);
        setAudioUrl(newUrl);

        // Update transcription - replace selected words with new text
        if (transcription) {
          const newWords = [...transcription.words];
          
          // Calculate time offset from the replacement
          const originalDuration = selection.endTime - selection.startTime;
          // We don't know the exact new duration, so we estimate based on text length ratio
          const estimatedDuration = originalDuration * (newText.length / selection.selectedText.length);
          const timeOffset = estimatedDuration - originalDuration;

          // Replace selected words with new word
          const newWord = {
            text: newText,
            start: selection.startTime,
            end: selection.startTime + estimatedDuration,
            type: "word" as const,
          };

          // Remove old words and insert new
          newWords.splice(selection.startIndex, selection.endIndex - selection.startIndex + 1, newWord);

          // Adjust timestamps for words after the replacement
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

        setProcessingSteps((prev) =>
          prev.map((step) =>
            step.id === "splice" ? { ...step, status: "completed" } : step
          )
        );

        setTimeout(() => {
          setIsProcessing(false);
          setProcessingSteps([]);
        }, 1000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        setProcessingSteps((prev) =>
          prev.map((step) =>
            step.status === "in_progress"
              ? { ...step, status: "error", error: errorMessage }
              : step
          )
        );

        setTimeout(() => {
          setIsProcessing(false);
        }, 2000);
      }
    },
    [selection, voiceId, audioFile, audioUrl, transcription]
  );

  const handleDownload = useCallback(() => {
    if (!audioUrl || !audioFile) return;
    
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `edited-${audioFile.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [audioUrl, audioFile]);

  const handleReset = useCallback(() => {
    // Cleanup voice on ElevenLabs (optional)
    if (voiceId) {
      fetch("/api/clone-voice", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId }),
      }).catch(() => {}); // Ignore errors
    }

    // Revoke URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    // Reset all state
    setAudioFile(null);
    setAudioUrl(null);
    setTranscription(null);
    setVoiceId(null);
    setSelection(null);
    setSelectedRegion(null);
    setError(null);
  }, [voiceId, audioUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <ProcessingStatus steps={processingSteps} isVisible={isProcessing} />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Speech Fixer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Fix or replace words in audio recordings using AI voice synthesis.
            Upload an MP3, select words to replace, and let AI do the rest.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-500"
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
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Section */}
        {!audioUrl && (
          <AudioUpload onFileSelect={handleFileSelect} isLoading={isProcessing} />
        )}

        {/* Editor Section */}
        {audioUrl && (
          <div className="space-y-6">
            {/* Controls Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {audioFile?.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <Waveform
              audioUrl={audioUrl}
              selectedRegion={selectedRegion}
              onRegionSelect={handleRegionSelect}
              onTimeUpdate={setCurrentTime}
            />

            {/* Transcript */}
            {transcription && (
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
            )}

            {/* Replacement Input */}
            <ReplacementInput
              selection={selection}
              onReplace={handleReplace}
              isProcessing={isProcessing}
            />

            {/* Voice Clone Status */}
            {voiceId && (
              <div className="text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Voice clone ready • ID: {voiceId.slice(0, 8)}...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Powered by Eleven Labs AI Voice Technology
          </p>
        </footer>
      </div>
    </div>
  );
}
