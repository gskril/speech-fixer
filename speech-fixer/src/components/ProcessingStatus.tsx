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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center">
          Processing Audio
        </h3>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {step.status === "pending" && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{index + 1}</span>
                  </div>
                )}
                {step.status === "in_progress" && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                )}
                {step.status === "completed" && (
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {step.status === "error" && (
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    step.status === "completed"
                      ? "text-green-600 dark:text-green-400"
                      : step.status === "error"
                      ? "text-red-600 dark:text-red-400"
                      : step.status === "in_progress"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                {step.error && (
                  <p className="text-xs text-red-500 mt-1">{step.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
