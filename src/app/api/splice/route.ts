import { NextRequest, NextResponse } from "next/server";
import { spliceAudio } from "@/lib/audio-processor";
import path from "path";
import fs from "fs/promises";
import os from "os";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const originalAudio = formData.get("originalAudio") as File;
    const replacementAudioBase64 = formData.get("replacementAudio") as string;
    const startTime = parseFloat(formData.get("startTime") as string);
    const endTime = parseFloat(formData.get("endTime") as string);

    if (!originalAudio) {
      return NextResponse.json(
        { error: "No original audio provided" },
        { status: 400 }
      );
    }

    if (!replacementAudioBase64) {
      return NextResponse.json(
        { error: "No replacement audio provided" },
        { status: 400 }
      );
    }

    if (isNaN(startTime) || isNaN(endTime)) {
      return NextResponse.json(
        { error: "Invalid start or end time" },
        { status: 400 }
      );
    }

    // Save original audio to temp file
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "splice-op-"));
    const originalPath = path.join(tempDir, "original.mp3");
    const replacementPath = path.join(tempDir, "replacement.mp3");
    const outputPath = path.join(tempDir, "output.mp3");

    // Write original audio to temp file
    const originalBuffer = Buffer.from(await originalAudio.arrayBuffer());
    await fs.writeFile(originalPath, originalBuffer);

    // Decode and write replacement audio
    const replacementBuffer = Buffer.from(replacementAudioBase64, "base64");
    await fs.writeFile(replacementPath, replacementBuffer);

    // Perform the splice
    await spliceAudio({
      originalAudioPath: originalPath,
      replacementAudioPath: replacementPath,
      startTime,
      endTime,
      outputPath,
    });

    // Read the output and return as base64
    const outputBuffer = await fs.readFile(outputPath);
    const base64Output = outputBuffer.toString("base64");

    // Cleanup temp directory (don't wait for it)
    fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

    return NextResponse.json({
      audio: base64Output,
      mimeType: "audio/mpeg",
    });
  } catch (error) {
    console.error("Splice error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Audio splicing failed" },
      { status: 500 }
    );
  }
}
