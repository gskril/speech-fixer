import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Speech Fixer - Fix Words in Audio";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1c1917",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, #292524 0%, transparent 50%), radial-gradient(circle at 75% 75%, #292524 0%, transparent 50%)",
        }}
      >
        {/* Waveform visualization */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "48px",
          }}
        >
          {[0.3, 0.5, 0.8, 1, 0.9, 0.6, 0.4, 0.7, 1, 0.85, 0.55, 0.35].map(
            (height, i) => (
              <div
                key={i}
                style={{
                  width: "16px",
                  height: `${height * 120}px`,
                  borderRadius: "8px",
                  background:
                    "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)",
                }}
              />
            )
          )}
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <h1
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "#fafaf9",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Speech Fixer
          </h1>
          <p
            style={{
              fontSize: "32px",
              color: "#a8a29e",
              margin: 0,
              maxWidth: "800px",
              textAlign: "center",
            }}
          >
            Fix or replace words in audio using AI voice synthesis
          </p>
        </div>

      </div>
    ),
    {
      ...size,
    }
  );
}
