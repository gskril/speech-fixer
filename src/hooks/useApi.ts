import { useMutation } from "@tanstack/react-query";
import { TranscriptionResult } from "@/lib/types";

// Transcribe audio file
export function useTranscribe() {
  return useMutation({
    mutationFn: async (file: File): Promise<TranscriptionResult> => {
      const formData = new FormData();
      formData.append("audio", file);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Transcription failed");
      }

      return res.json();
    },
  });
}

// Clone voice from audio file
interface CloneVoiceResult {
  voice_id: string;
  name: string;
}

export function useCloneVoice() {
  return useMutation({
    mutationFn: async (file: File): Promise<CloneVoiceResult> => {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("name", `Voice-${Date.now()}`);

      const res = await fetch("/api/clone-voice", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Voice cloning failed");
      }

      return res.json();
    },
  });
}

// Delete cloned voice
export function useDeleteVoice() {
  return useMutation({
    mutationFn: async (voiceId: string): Promise<void> => {
      await fetch("/api/clone-voice", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId }),
      });
    },
  });
}

// Synthesize speech from text using cloned voice
interface SynthesizeParams {
  text: string;
  voiceId: string;
}

interface SynthesizeResult {
  audio: string; // base64
}

export function useSynthesize() {
  return useMutation({
    mutationFn: async ({ text, voiceId }: SynthesizeParams): Promise<SynthesizeResult> => {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Synthesis failed");
      }

      return res.json();
    },
  });
}

// Splice audio - replace a segment with new audio
interface SpliceParams {
  originalAudio: File;
  replacementAudioBase64: string;
  startTime: number;
  endTime: number;
}

interface SpliceResult {
  audio: string; // base64
}

export function useSplice() {
  return useMutation({
    mutationFn: async ({
      originalAudio,
      replacementAudioBase64,
      startTime,
      endTime,
    }: SpliceParams): Promise<SpliceResult> => {
      const formData = new FormData();
      formData.append("originalAudio", originalAudio);
      formData.append("replacementAudio", replacementAudioBase64);
      formData.append("startTime", startTime.toString());
      formData.append("endTime", endTime.toString());

      const res = await fetch("/api/splice", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Splicing failed");
      }

      return res.json();
    },
  });
}

// Combined hook for processing a file (transcribe + clone voice)
export function useProcessAudio() {
  const transcribe = useTranscribe();
  const cloneVoice = useCloneVoice();

  const processAudio = useMutation({
    mutationFn: async (file: File) => {
      // Run transcription and voice cloning in parallel
      const [transcription, voiceData] = await Promise.all([
        transcribe.mutateAsync(file),
        cloneVoice.mutateAsync(file),
      ]);

      return {
        transcription,
        voiceId: voiceData.voice_id,
      };
    },
  });

  return {
    processAudio,
    transcribeStatus: transcribe.status,
    cloneVoiceStatus: cloneVoice.status,
  };
}

// Combined hook for replacing audio (synthesize + splice)
export function useReplaceAudio() {
  const synthesize = useSynthesize();
  const splice = useSplice();

  const replaceAudio = useMutation({
    mutationFn: async ({
      text,
      voiceId,
      originalAudio,
      startTime,
      endTime,
    }: {
      text: string;
      voiceId: string;
      originalAudio: File;
      startTime: number;
      endTime: number;
    }) => {
      // First synthesize the new audio
      const synthResult = await synthesize.mutateAsync({ text, voiceId });

      // Then splice it into the original
      const spliceResult = await splice.mutateAsync({
        originalAudio,
        replacementAudioBase64: synthResult.audio,
        startTime,
        endTime,
      });

      return spliceResult;
    },
  });

  return {
    replaceAudio,
    synthesizeStatus: synthesize.status,
    spliceStatus: splice.status,
  };
}
