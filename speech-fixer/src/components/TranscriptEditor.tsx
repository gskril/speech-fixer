"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { TranscriptionWord, WordSelection } from "@/lib/types";

interface TranscriptEditorProps {
  words: TranscriptionWord[];
  currentTime?: number;
  onSelectionChange?: (selection: WordSelection | null) => void;
  selectedIndices?: { start: number; end: number } | null;
}

export function TranscriptEditor({
  words,
  currentTime = 0,
  onSelectionChange,
  selectedIndices,
}: TranscriptEditorProps) {
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute effective selection from both local state and parent prop
  const effectiveSelection = useMemo(() => {
    if (selectedIndices) {
      return { start: selectedIndices.start, end: selectedIndices.end };
    }
    if (selectionStart !== null && selectionEnd !== null) {
      return { 
        start: Math.min(selectionStart, selectionEnd), 
        end: Math.max(selectionStart, selectionEnd) 
      };
    }
    return null;
  }, [selectedIndices, selectionStart, selectionEnd]);

  const handleWordMouseDown = useCallback((index: number) => {
    setIsSelecting(true);
    setSelectionStart(index);
    setSelectionEnd(index);
  }, []);

  const handleWordMouseEnter = useCallback(
    (index: number) => {
      if (isSelecting && selectionStart !== null) {
        setSelectionEnd(index);
      }
    },
    [isSelecting, selectionStart]
  );

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionStart !== null && selectionEnd !== null) {
      const start = Math.min(selectionStart, selectionEnd);
      const end = Math.max(selectionStart, selectionEnd);

      // Find actual word indices (skip punctuation-only selections)
      const selectedWords = words.slice(start, end + 1);
      const hasWords = selectedWords.some((w) => w.type === "word");

      if (hasWords) {
        // Find time range from selected words
        const wordItems = selectedWords.filter((w) => w.type === "word");
        const startTime = wordItems[0]?.start ?? words[start].start;
        const endTime = wordItems[wordItems.length - 1]?.end ?? words[end].end;

        // Build selected text
        const selectedText = selectedWords.map((w) => w.text).join("");

        onSelectionChange?.({
          startIndex: start,
          endIndex: end,
          startTime,
          endTime,
          selectedText,
        });
      }
    }
    setIsSelecting(false);
  }, [isSelecting, selectionStart, selectionEnd, words, onSelectionChange]);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const isWordSelected = (index: number): boolean => {
    if (!effectiveSelection) return false;
    return index >= effectiveSelection.start && index <= effectiveSelection.end;
  };

  const isWordActive = (word: TranscriptionWord): boolean => {
    return currentTime >= word.start && currentTime <= word.end;
  };

  const clearSelection = useCallback(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
    onSelectionChange?.(null);
  }, [onSelectionChange]);

  if (!words || words.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          No transcription available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Transcript
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Click and drag to select words to replace
          </p>
        </div>

        {effectiveSelection && (
          <button
            onClick={clearSelection}
            className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Clear Selection
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className="text-lg leading-relaxed select-none"
        style={{ userSelect: "none" }}
      >
        {words.map((word, index) => {
          const selected = isWordSelected(index);
          const active = isWordActive(word);

          // Don't render spacing items separately, just add space logic
          if (word.type === "spacing") {
            return <span key={index}> </span>;
          }

          return (
            <span
              key={index}
              onMouseDown={() => handleWordMouseDown(index)}
              onMouseEnter={() => handleWordMouseEnter(index)}
              className={`
                ${word.type === "word" ? "cursor-pointer" : ""}
                ${selected ? "bg-blue-200 dark:bg-blue-800 rounded" : ""}
                ${active ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-800 dark:text-gray-200"}
                ${word.type === "word" && !selected ? "hover:bg-gray-100 dark:hover:bg-gray-700 rounded" : ""}
                transition-colors duration-100
              `}
            >
              {word.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
