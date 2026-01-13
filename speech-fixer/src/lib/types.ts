export interface TranscriptionWord {
  text: string;
  start: number;
  end: number;
  type: "word" | "punctuation" | "spacing";
  speaker_id?: string;
}

export interface TranscriptionResult {
  text: string;
  words: TranscriptionWord[];
  language_code?: string;
  audio_duration?: number;
}

export interface VoiceCloneResult {
  voice_id: string;
  name: string;
}

export interface SynthesisResult {
  audioUrl: string;
  audioPath: string;
}

export interface SpliceResult {
  audioUrl: string;
  audioPath: string;
}

export interface AudioState {
  originalFile: File | null;
  audioUrl: string | null;
  audioPath: string | null;
  transcription: TranscriptionResult | null;
  voiceId: string | null;
  isTranscribing: boolean;
  isCloningVoice: boolean;
  isSynthesizing: boolean;
  isSplicing: boolean;
  error: string | null;
}

export interface WordSelection {
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  selectedText: string;
}
