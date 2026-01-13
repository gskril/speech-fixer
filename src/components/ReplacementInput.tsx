"use client";

import { useState } from "react";
import { WordSelection } from "@/lib/types";

interface ReplacementInputProps {
  selection: WordSelection | null;
  onReplace: (newText: string) => void;
  isProcessing?: boolean;
}

export function ReplacementInput({
  selection,
  onReplace,
  isProcessing = false,
}: ReplacementInputProps) {
  const [replacementText, setReplacementText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replacementText.trim() && selection) {
      onReplace(replacementText.trim());
      setReplacementText("");
    }
  };

  if (!selection) {
    return (
      <div className="card p-6 border-dashed">
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-3">
            <svg
              className="w-5 h-5 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
          <p className="text-sm text-slate-500">
            Select words in the transcript to replace them
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
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
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </div>
        <span className="text-sm font-medium text-slate-300">
          Replace Selection
        </span>
      </div>

      {/* Original text display */}
      <div className="mb-4 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
        <div className="flex items-start gap-2">
          <svg
            className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <div>
            <p className="text-sm text-red-400 line-through">
              &ldquo;{selection.selectedText}&rdquo;
            </p>
            <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
              {selection.startTime.toFixed(2)}s - {selection.endTime.toFixed(2)}
              s
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input field */}
        <div>
          <label htmlFor="replacement" className="sr-only">
            Replacement text
          </label>
          <input
            id="replacement"
            type="text"
            value={replacementText}
            onChange={(e) => setReplacementText(e.target.value)}
            placeholder="Type the new words..."
            disabled={isProcessing}
            className="input"
            autoComplete="off"
          />
        </div>

        {/* Preview new text */}
        {replacementText && (
          <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
            <div className="flex items-start gap-2">
              <svg
                className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-sm text-green-400">
                &ldquo;{replacementText}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!replacementText.trim() || isProcessing}
          className="btn btn-primary w-full py-3"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Replace Audio
            </>
          )}
        </button>
      </form>
    </div>
  );
}
