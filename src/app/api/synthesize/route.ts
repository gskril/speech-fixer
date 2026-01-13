import { NextRequest, NextResponse } from "next/server";
import { elevenlabs } from "@/lib/elevenlabs";

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId, previousText, nextText } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    if (!voiceId) {
      return NextResponse.json(
        { error: "No voice ID provided" },
        { status: 400 }
      );
    }

    // Generate speech using the cloned voice with optimized settings
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text: text,
      modelId: "eleven_english_v2",
      outputFormat: "mp3_44100_128",
      // Provide surrounding text context for natural intonation and pacing
      previousText: previousText || undefined,
      nextText: nextText || undefined,
      voiceSettings: {
        stability: 0.7, // Higher stability for consistent pronunciation
        similarityBoost: 0.9, // High similarity to original voice
        style: 0.2, // Subtle style for natural speech
        useSpeakerBoost: true, // Enhance voice clarity
      },
    });

    // Convert ReadableStream to buffer using getReader()
    const reader = audioStream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    // Combine all chunks into a single buffer
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const audioBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      audioBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Return the audio as a base64 encoded string
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({
      audio: base64Audio,
    });
  } catch (error) {
    console.error("Synthesis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Synthesis failed" },
      { status: 500 }
    );
  }
}
