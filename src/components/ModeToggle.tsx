"use client";

export type AppMode = "fix" | "generate";

interface ModeToggleProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  disabled?: boolean;
}

export function ModeToggle({ mode, onModeChange, disabled }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-themed-tertiary">
      <button
        onClick={() => onModeChange("fix")}
        disabled={disabled}
        className={`
          relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${
            mode === "fix"
              ? "bg-themed-primary text-themed-primary shadow-sm"
              : "text-themed-tertiary hover:text-themed-secondary"
          }
        `}
      >
        <span className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Fix Audio
        </span>
      </button>
      <button
        onClick={() => onModeChange("generate")}
        disabled={disabled}
        className={`
          relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${
            mode === "generate"
              ? "bg-themed-primary text-themed-primary shadow-sm"
              : "text-themed-tertiary hover:text-themed-secondary"
          }
        `}
      >
        <span className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
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
          Generate Voice
        </span>
      </button>
    </div>
  );
}
