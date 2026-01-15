"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { VoiceRecorder } from "./VoiceRecorder";
import { ProcessingStatus } from "./ProcessingStatus";
import { AudioPlayer } from "./ai-sdk";
import { useGenerateAudio, useDeleteVoice } from "@/hooks/useApi";

interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "completed" | "error";
  error?: string;
}

export function GenerateMode() {
  const [voiceSample, setVoiceSample] = useState<File | null>(null);
  const [scriptText, setScriptText] = useState("");
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(
    null
  );
  const [voiceId, setVoiceId] = useState<string | null>(null);

  const voiceIdRef = useRef<string | null>(null);

  const { generateAudio, cloneVoiceStatus, synthesizeStatus } =
    useGenerateAudio();
  const deleteVoiceMutation = useDeleteVoice();

  // Keep voiceId ref updated for cleanup
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

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (generatedAudioUrl) {
        URL.revokeObjectURL(generatedAudioUrl);
      }
    };
  }, [generatedAudioUrl]);

  const isProcessing = generateAudio.isPending;

  const error = useMemo(() => {
    if (generateAudio.error) return generateAudio.error.message;
    return null;
  }, [generateAudio.error]);

  const processingSteps = useMemo((): ProcessingStep[] => {
    if (!generateAudio.isPending) return [];

    return [
      {
        id: "clone",
        label: "Creating voice clone...",
        status:
          cloneVoiceStatus === "pending"
            ? "in_progress"
            : cloneVoiceStatus === "success"
              ? "completed"
              : cloneVoiceStatus === "error"
                ? "error"
                : "pending",
      },
      {
        id: "synthesize",
        label: "Generating audio...",
        status:
          synthesizeStatus === "pending"
            ? "in_progress"
            : synthesizeStatus === "success"
              ? "completed"
              : synthesizeStatus === "error"
                ? "error"
                : "pending",
      },
    ];
  }, [generateAudio.isPending, cloneVoiceStatus, synthesizeStatus]);

  const handleRecordingComplete = useCallback((audioBlob: Blob) => {
    const file = new File([audioBlob], "voice-sample.webm", {
      type: audioBlob.type,
    });
    setVoiceSample(file);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!voiceSample || !scriptText.trim()) return;

    try {
      const result = await generateAudio.mutateAsync({
        voiceSample,
        scriptText: scriptText.trim(),
      });

      setVoiceId(result.voiceId);

      // Create audio URL from base64
      const response = await fetch(`data:audio/mpeg;base64,${result.audio}`);
      const blob = await response.blob();

      if (generatedAudioUrl) {
        URL.revokeObjectURL(generatedAudioUrl);
      }

      const url = URL.createObjectURL(blob);
      setGeneratedAudioUrl(url);
    } catch {
      // Error handled by mutation state
    }
  }, [voiceSample, scriptText, generateAudio, generatedAudioUrl]);

  const handleDownload = useCallback(() => {
    if (!generatedAudioUrl) return;

    const link = document.createElement("a");
    link.href = generatedAudioUrl;
    link.download = "generated-audio.mp3";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generatedAudioUrl]);

  const handleReset = useCallback(() => {
    // Cleanup voice on ElevenLabs
    if (voiceId) {
      deleteVoiceMutation.mutate(voiceId);
    }

    // Revoke URL
    if (generatedAudioUrl) {
      URL.revokeObjectURL(generatedAudioUrl);
    }

    // Reset mutations
    generateAudio.reset();

    // Reset state
    setVoiceSample(null);
    setScriptText("");
    setGeneratedAudioUrl(null);
    setVoiceId(null);
  }, [voiceId, generatedAudioUrl, deleteVoiceMutation, generateAudio]);

  return (
    <div className="relative">
      <ProcessingStatus steps={processingSteps} isVisible={isProcessing} />

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

      {/* Generated Audio Result */}
      {generatedAudioUrl ? (
        <div className="space-y-5 animate-fade-in">
          {/* Success Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="tag tag-amber">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Generated
              </div>
              <span className="text-sm text-themed-tertiary">
                Your voice clone audio is ready
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Start Over
              </button>
            </div>
          </div>

          {/* Audio Player with AI SDK Component */}
          <div className="animate-slide-up">
            <AudioPlayer
              src={generatedAudioUrl}
              autoPlay={false}
            />

            {/* Script Preview */}
            <div className="card p-4 mt-4">
              <p className="text-xs text-themed-muted mb-2">Generated from script:</p>
              <p className="text-sm text-themed-secondary line-clamp-3">
                {scriptText}
              </p>
            </div>
          </div>

          {/* Voice Clone Status */}
          {voiceId && (
            <div className="flex justify-center animate-fade-in">
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
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Step 1 & 2: Voice Recording */}
          {!voiceSample ? (
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              isProcessing={isProcessing}
            />
          ) : (
            <div className="space-y-6">
              {/* Voice Sample Confirmed */}
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-400"
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
                    </div>
                    <div>
                      <p className="text-sm font-medium text-themed-secondary">
                        Voice sample recorded
                      </p>
                      <p className="text-xs text-themed-muted">
                        Ready for voice cloning
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setVoiceSample(null)}
                    disabled={isProcessing}
                    className="btn btn-secondary text-sm"
                  >
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Re-record
                  </button>
                </div>
              </div>

              {/* Step 3: Script Input */}
              <div className="card p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-amber-400">3</span>
                  </div>
                  <h3 className="text-sm font-medium text-themed-secondary">
                    Enter your script
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <textarea
                      value={scriptText}
                      onChange={(e) => setScriptText(e.target.value)}
                      placeholder="Type or paste the text you want to generate as audio..."
                      disabled={isProcessing}
                      className="input w-full h-40 resize-none"
                    />
                    <div className="flex justify-between mt-2">
                      <p className="text-xs text-themed-muted">
                        Write what you want your voice clone to say
                      </p>
                      <p className="text-xs text-themed-muted">
                        {scriptText.length} characters
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={
                      isProcessing || !scriptText.trim() || !voiceSample
                    }
                    className={`
                      w-full btn btn-primary py-3
                      ${isProcessing || !scriptText.trim() ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
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
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Generate Audio
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
