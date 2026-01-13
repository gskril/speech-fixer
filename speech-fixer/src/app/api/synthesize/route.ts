import { NextRequest, NextResponse } from "next/server";
import { elevenlabs } from "@/lib/elevenlabs";
import path from "path";
import fs from "fs/promises";
import os from "os";

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId } = await request.json();

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

    // Generate speech using the cloned voice
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text: text,
      modelId: "eleven_turbo_v2_5", // Fast, high-quality model
      outputFormat: "mp3_44100_128",
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

    // Save to temp file
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "synth-"));
    const tempPath = path.join(tempDir, "synthesized.mp3");
    await fs.writeFile(tempPath, audioBuffer);

    // Return the audio as a base64 encoded string along with the temp path
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({
      audio: base64Audio,
      audioPath: tempPath,
      mimeType: "audio/mpeg",
    });
  } catch (error) {
    console.error("Synthesis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Synthesis failed" },
      { status: 500 }
    );
  }
}
