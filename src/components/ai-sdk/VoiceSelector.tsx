"use client";

/**
 * AI SDK Voice Selector Component
 *
 * Allows users to select from available voices (e.g., ElevenLabs voices).
 * Provides preview functionality and visual voice cards.
 */

import { useState } from "react";

export interface Voice {
  id: string;
  name: string;
  description?: string;
  previewUrl?: string;
  labels?: Record<string, string>;
}

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoiceId?: string;
  onVoiceChange: (voiceId: string) => void;
  showPreview?: boolean;
  onPreview?: (voiceId: string) => void;
  className?: string;
}

export function VoiceSelector({
  voices,
  selectedVoiceId,
  onVoiceChange,
  showPreview = true,
  onPreview,
  className = "",
}: VoiceSelectorProps) {
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  const handlePreview = async (voiceId: string) => {
    setPreviewingVoice(voiceId);
    onPreview?.(voiceId);

    // Simulate preview duration
    setTimeout(() => {
      setPreviewingVoice(null);
    }, 2000);
  };

  if (voices.length === 0) {
    return (
      <div className={`voice-selector ${className}`}>
        <div className="card p-4">
          <p className="text-sm text-themed-muted text-center">
            No voices available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`voice-selector ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {voices.map((voice) => {
          const isSelected = voice.id === selectedVoiceId;
          const isPreviewing = voice.id === previewingVoice;

          return (
            <div
              key={voice.id}
              className={`
                card p-4 cursor-pointer transition-all duration-200
                ${isSelected ? "border-amber-500 bg-amber-500/5" : "hover:border-themed-tertiary"}
              `}
              onClick={() => onVoiceChange(voice.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-themed-primary truncate">
                      {voice.name}
                    </h4>
                    {isSelected && (
                      <div className="tag tag-amber text-xs">Selected</div>
                    )}
                  </div>

                  {voice.description && (
                    <p className="text-xs text-themed-muted line-clamp-2">
                      {voice.description}
                    </p>
                  )}

                  {voice.labels && Object.keys(voice.labels).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(voice.labels).map(([key, value]) => (
                        <span key={key} className="tag text-xs">
                          {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {showPreview && (voice.previewUrl || onPreview) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(voice.id);
                    }}
                    disabled={isPreviewing}
                    className="btn btn-secondary text-xs py-1 px-2"
                    title="Preview voice"
                  >
                    {isPreviewing ? (
                      <div className="w-3 h-3 border-2 border-themed-tertiary border-t-amber-500 rounded-full animate-spin" />
                    ) : (
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
