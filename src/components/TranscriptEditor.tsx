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

  const wordIndices = useMemo(
    () =>
      words.map((w, i) => (w.type === "word" ? i : -1)).filter((i) => i !== -1),
    [words]
  );

  const effectiveSelection = useMemo(() => {
    if (selectedIndices) {
      return { start: selectedIndices.start, end: selectedIndices.end };
    }
    if (selectionStart !== null && selectionEnd !== null) {
      return {
        start: Math.min(selectionStart, selectionEnd),
        end: Math.max(selectionStart, selectionEnd),
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

      const currentWordIndexPos =
        focusedIndex !== null ? wordIndices.indexOf(focusedIndex) : -1;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown": {
          e.preventDefault();
          const nextPos =
            currentWordIndexPos < wordIndices.length - 1
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
          const prevPos = currentWordIndexPos > 0 ? currentWordIndexPos - 1 : 0;
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
      <div className="card p-6">
        <p className="text-themed-muted text-center">No transcription available</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-themed-tertiary flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5 text-themed-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <span className="text-sm font-medium text-themed-secondary">Transcript</span>
        </div>

        {effectiveSelection && (
          <button
            onClick={clearSelection}
            className="tag hover:opacity-80 transition-colors cursor-pointer"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* Instructions */}
      <p className="text-xs text-themed-muted mb-4">
        Click and drag to select words, or use arrow keys + Shift
      </p>

      {/* Transcript text */}
      <div
        ref={containerRef}
        tabIndex={0}
        role="textbox"
        aria-label="Transcript text. Use arrow keys to navigate, Shift+arrows to select, Escape to clear."
        onKeyDown={handleKeyDown}
        className="text-base sm:text-lg leading-relaxed select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] rounded-lg p-3 -m-3 text-themed-secondary"
        style={{ userSelect: "none" }}
      >
        {words.map((word, index) => {
          const selected = isWordSelected(index);
          const active = isWordActive(word);
          const focused = focusedIndex === index;

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
                ${selected ? "bg-amber-500/30 text-themed-accent rounded px-0.5 -mx-0.5" : ""}
                ${active && !selected ? "text-themed-accent" : ""}
                ${word.type === "word" && !selected ? "hover:bg-[var(--bg-tertiary)] rounded" : ""}
                ${focused && word.type === "word" ? "ring-2 ring-amber-400/50 ring-offset-1 ring-offset-[var(--bg-primary)] rounded" : ""}
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
