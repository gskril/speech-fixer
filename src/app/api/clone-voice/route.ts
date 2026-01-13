import { NextRequest, NextResponse } from "next/server";
import { elevenlabs } from "@/lib/elevenlabs";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Handle JSON request (used by sendBeacon for cleanup)
    if (contentType.includes("application/json")) {
      const { voiceId } = await request.json();
      if (voiceId) {
        await elevenlabs.voices.delete(voiceId);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json(
        { error: "No voice ID provided" },
        { status: 400 }
      );
    }

    // Handle FormData request (voice cloning)
    const formData = await request.formData();
    const file = formData.get("audio") as File;
    const name = formData.get("name") as string || "Cloned Voice";

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Create instant voice clone using ivc.create
    const result = await elevenlabs.voices.ivc.create({
      name: name,
      files: [file],
      description: "Auto-cloned voice for speech replacement",
    });

    return NextResponse.json({
      voice_id: result.voiceId,
      name: name,
    });
  } catch (error) {
    console.error("Voice cloning error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Voice cloning failed" },
      { status: 500 }
    );
  }
}

// Delete a voice (cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const { voiceId } = await request.json();

    if (!voiceId) {
      return NextResponse.json(
        { error: "No voice ID provided" },
        { status: 400 }
      );
    }

    await elevenlabs.voices.delete(voiceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Voice deletion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Voice deletion failed" },
      { status: 500 }
    );
  }
}
