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
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get indices of actual words (not spacing/punctuation)
  const wordIndices = useMemo(
    () => words.map((w, i) => (w.type === "word" ? i : -1)).filter((i) => i !== -1),
    [words]
  );

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

  const commitSelection = useCallback(
    (start: number, end: number) => {
      const selectedWords = words.slice(start, end + 1);
      const hasWords = selectedWords.some((w) => w.type === "word");

      if (hasWords) {
        const wordItems = selectedWords.filter((w) => w.type === "word");
        const startTime = wordItems[0]?.start ?? words[start].start;
        const endTime = wordItems[wordItems.length - 1]?.end ?? words[end].end;
        const selectedText = selectedWords.map((w) => w.text).join("");

        onSelectionChange?.({
          startIndex: start,
          endIndex: end,
          startTime,
          endTime,
          selectedText,
        });
      }
    },
    [words, onSelectionChange]
  );

  const handleWordMouseDown = useCallback((index: number) => {
    setIsSelecting(true);
    setSelectionStart(index);
    setSelectionEnd(index);
    setFocusedIndex(index);
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
      commitSelection(start, end);
    }
    setIsSelecting(false);
  }, [isSelecting, selectionStart, selectionEnd, commitSelection]);

  const clearSelection = useCallback(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setFocusedIndex(null);
    onSelectionChange?.(null);
  }, [onSelectionChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (wordIndices.length === 0) return;

      const currentWordIndexPos = focusedIndex !== null
        ? wordIndices.indexOf(focusedIndex)
        : -1;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown": {
          e.preventDefault();
          const nextPos = currentWordIndexPos < wordIndices.length - 1
            ? currentWordIndexPos + 1
            : currentWordIndexPos;
          const nextIndex = nextPos >= 0 ? wordIndices[nextPos] : wordIndices[0];
          setFocusedIndex(nextIndex);

          if (e.shiftKey && selectionStart !== null) {
            setSelectionEnd(nextIndex);
            commitSelection(
              Math.min(selectionStart, nextIndex),
              Math.max(selectionStart, nextIndex)
            );
          } else if (e.shiftKey) {
            setSelectionStart(nextIndex);
            setSelectionEnd(nextIndex);
          }
          break;
        }
        case "ArrowLeft":
        case "ArrowUp": {
          e.preventDefault();
          const prevPos = currentWordIndexPos > 0
            ? currentWordIndexPos - 1
            : 0;
          const prevIndex = wordIndices[prevPos] ?? wordIndices[0];
          setFocusedIndex(prevIndex);

          if (e.shiftKey && selectionStart !== null) {
            setSelectionEnd(prevIndex);
            commitSelection(
              Math.min(selectionStart, prevIndex),
              Math.max(selectionStart, prevIndex)
            );
          } else if (e.shiftKey) {
            setSelectionStart(prevIndex);
            setSelectionEnd(prevIndex);
          }
          break;
        }
        case "Enter":
        case " ": {
          e.preventDefault();
          if (focusedIndex !== null) {
            if (selectionStart === null) {
              setSelectionStart(focusedIndex);
              setSelectionEnd(focusedIndex);
              commitSelection(focusedIndex, focusedIndex);
            }
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          clearSelection();
          break;
        }
      }
    },
    [focusedIndex, wordIndices, selectionStart, commitSelection, clearSelection]
  );

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
            Click and drag, or use arrow keys + Shift to select
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
        tabIndex={0}
        role="textbox"
        aria-label="Transcript text. Use arrow keys to navigate, Shift+arrows to select, Escape to clear."
        onKeyDown={handleKeyDown}
        className="text-lg leading-relaxed select-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2 -m-2"
        style={{ userSelect: "none" }}
      >
        {words.map((word, index) => {
          const selected = isWordSelected(index);
          const active = isWordActive(word);
          const focused = focusedIndex === index;

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
                ${focused && word.type === "word" ? "ring-2 ring-blue-400 ring-offset-1" : ""}
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
