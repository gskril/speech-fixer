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

export interface WordSelection {
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  selectedText: string;
}
