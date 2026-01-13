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
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Select words in the transcript above to replace them
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Replace Selection
        </h3>
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            <span className="font-medium">Original:</span>{" "}
            <span className="line-through">&ldquo;{selection.selectedText}&rdquo;</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {selection.startTime.toFixed(2)}s - {selection.endTime.toFixed(2)}s
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="replacement"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            New Text
          </label>
          <input
            id="replacement"
            type="text"
            value={replacementText}
            onChange={(e) => setReplacementText(e.target.value)}
            placeholder="Type replacement text..."
            disabled={isProcessing}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all"
          />
        </div>

        {replacementText && (
          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">
              <span className="font-medium">New:</span> &ldquo;{replacementText}&rdquo;
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!replacementText.trim() || isProcessing}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 
                   text-white font-medium rounded-lg
                   hover:from-blue-600 hover:to-purple-700
                   focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
