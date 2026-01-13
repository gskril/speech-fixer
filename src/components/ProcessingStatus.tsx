"use client";

interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "completed" | "error";
  error?: string;
}

interface ProcessingStatusProps {
  steps: ProcessingStep[];
  isVisible: boolean;
}

export function ProcessingStatus({ steps, isVisible }: ProcessingStatusProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative glass rounded-2xl p-8 max-w-sm w-full mx-4 animate-scale-in">
        {/* Animated icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center glow-amber">
              {/* Waveform bars */}
              <div className="flex items-center gap-0.5">
                {[0.4, 0.7, 1, 0.6, 0.8].map((height, i) => (
                  <div
                    key={i}
                    className="w-1 bg-[var(--bg-primary)] rounded-full animate-pulse"
                    style={{
                      height: `${height * 24}px`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/30 animate-pulse-ring" />
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display text-lg font-semibold text-themed-primary text-center mb-6">
          Processing Audio
        </h3>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center gap-3 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Status indicator */}
              <div className="flex-shrink-0">
                {step.status === "pending" && (
                  <div className="w-7 h-7 rounded-full bg-themed-tertiary border border-themed flex items-center justify-center">
                    <span className="text-xs font-medium text-themed-muted">
                      {index + 1}
                    </span>
                  </div>
                )}
                {step.status === "in_progress" && (
                  <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {step.status === "completed" && (
                  <div className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                {step.status === "error" && (
                  <div className="w-7 h-7 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    step.status === "completed"
                      ? "text-green-400"
                      : step.status === "error"
                        ? "text-red-400"
                        : step.status === "in_progress"
                          ? "text-amber-400"
                          : "text-themed-muted"
                  }`}
                >
                  {step.label}
                </p>
                {step.error && (
                  <p className="text-xs text-red-400/70 mt-0.5 truncate">
                    {step.error}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-1 bg-themed-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 ease-out"
            style={{
              width: `${(steps.filter((s) => s.status === "completed").length / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
