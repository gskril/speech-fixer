import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";
import os from "os";

export interface SpliceParams {
  originalAudioPath: string;
  replacementAudioPath: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  outputPath: string;
}

/**
 * Splice audio by replacing a segment with new audio
 * Uses FFmpeg to:
 * 1. Extract the part before the replacement
 * 2. Extract the part after the replacement
 * 3. Concatenate: before + replacement + after
 */
export async function spliceAudio(params: SpliceParams): Promise<string> {
  const { originalAudioPath, replacementAudioPath, startTime, endTime, outputPath } = params;

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "splice-"));
  const beforePath = path.join(tempDir, "before.mp3");
  const afterPath = path.join(tempDir, "after.mp3");
  const normalizedReplacementPath = path.join(tempDir, "replacement_normalized.mp3");
  const listPath = path.join(tempDir, "list.txt");

  try {
    // Get original audio duration
    const duration = await getAudioDuration(originalAudioPath);

    const promises: Promise<void>[] = [];

    // Extract before segment (if there's content before startTime)
    if (startTime > 0) {
      promises.push(extractSegment(originalAudioPath, 0, startTime, beforePath));
    }

    // Extract after segment (if there's content after endTime)
    if (endTime < duration) {
      promises.push(extractSegment(originalAudioPath, endTime, duration, afterPath));
    }

    // Normalize replacement audio to match the same format
    promises.push(normalizeAudio(replacementAudioPath, normalizedReplacementPath));

    await Promise.all(promises);

    // Create concat list
    const files: string[] = [];
    if (startTime > 0) {
      files.push(`file '${beforePath}'`);
    }
    files.push(`file '${normalizedReplacementPath}'`);
    if (endTime < duration) {
      files.push(`file '${afterPath}'`);
    }

    await fs.writeFile(listPath, files.join("\n"));

    // Concatenate all segments
    await concatenateAudio(listPath, outputPath);

    return outputPath;
  } finally {
    // Cleanup temp files
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

function extractSegment(
  inputPath: string,
  startTime: number,
  endTime: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .audioCodec("libmp3lame")
      .audioFrequency(44100)
      .audioBitrate("128k")
      .audioChannels(2)
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

function normalizeAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("libmp3lame")
      .audioFrequency(44100)
      .audioBitrate("128k")
      .audioChannels(2)
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

function concatenateAudio(listPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .audioCodec("libmp3lame")
      .audioFrequency(44100)
      .audioBitrate("128k")
      .audioChannels(2)
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata.format.duration || 0);
    });
  });
}
