import { NextRequest, NextResponse } from "next/server";
import { elevenlabs } from "@/lib/elevenlabs";
import { TranscriptionResult, TranscriptionWord } from "@/lib/types";

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.includes("audio/") && !file.name.endsWith(".mp3")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an MP3 file." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    // Call Eleven Labs speech-to-text API
    const result = await elevenlabs.speechToText.convert({
      file: file,
      modelId: "scribe_v1", // Latest available model
    });

    // The result can be SpeechToTextChunkResponseModel, MultichannelSpeechToTextResponseModel, 
    // or SpeechToTextWebhookResponseModel. We handle the chunk response which has words.
    interface WordResponse {
      text: string;
      start: number;
      end: number;
      type?: string;
      speakerId?: string;
    }

    // Check if result has words property (SpeechToTextChunkResponseModel)
    const resultData = result as {
      text?: string;
      words?: WordResponse[];
      languageCode?: string;
    };

    // Transform the result to our format
    const words: TranscriptionWord[] = (resultData.words || []).map((word) => ({
      text: word.text,
      start: word.start,
      end: word.end,
      type: (word.type as "word" | "punctuation" | "spacing") || "word",
      speaker_id: word.speakerId,
    }));

    const transcription: TranscriptionResult = {
      text: resultData.text || words.map(w => w.text).join(""),
      words: words,
      language_code: resultData.languageCode,
    };

    return NextResponse.json(transcription);
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Transcription failed" },
      { status: 500 }
    );
  }
}
