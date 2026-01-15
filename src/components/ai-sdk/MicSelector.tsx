"use client";

/**
 * AI SDK Microphone Selector Component
 *
 * Allows users to select from available audio input devices.
 * Enhanced UI for microphone selection with device detection.
 */

import { useState, useEffect } from "react";

interface MicSelectorProps {
  onDeviceChange: (deviceId: string) => void;
  selectedDeviceId?: string;
  className?: string;
}

export function MicSelector({
  onDeviceChange,
  selectedDeviceId,
  className = "",
}: MicSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);

      // Get devices
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = deviceList.filter(
        (device) => device.kind === "audioinput"
      );
      setDevices(audioInputs);

      // Auto-select first device if none selected
      if (!selectedDeviceId && audioInputs.length > 0) {
        onDeviceChange(audioInputs[0].deviceId);
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Microphone access denied. Please grant permission.");
        } else if (err.name === "NotFoundError") {
          setError("No microphone found. Please connect a microphone.");
        } else {
          setError(`Error accessing microphone: ${err.message}`);
        }
      }
    }
  };

  const handleDeviceChange = (deviceId: string) => {
    onDeviceChange(deviceId);
  };

  if (error) {
    return (
      <div className={`mic-selector ${className}`}>
        <div className="card p-4 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-red-400 flex-shrink-0"
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
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!permissionGranted || devices.length === 0) {
    return (
      <div className={`mic-selector ${className}`}>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-themed-tertiary border-t-amber-500 rounded-full animate-spin" />
            <p className="text-sm text-themed-secondary">
              Detecting microphones...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mic-selector ${className}`}>
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-themed-tertiary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <label className="text-xs text-themed-muted block mb-1">
              Microphone
            </label>
            <select
              value={selectedDeviceId || ""}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="input text-sm py-2 w-full"
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadDevices}
            className="btn btn-secondary text-sm"
            title="Refresh devices"
          >
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
          </button>
        </div>
      </div>
    </div>
  );
}
