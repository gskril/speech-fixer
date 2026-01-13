import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://speech.gregskril.com"),
  title: "Speech Fixer - Fix Words in Audio",
  description:
    "Fix or replace words in audio recordings using AI voice synthesis. Perfect for podcasters and content creators.",
  openGraph: {
    title: "Speech Fixer - Fix Words in Audio",
    description:
      "Fix or replace words in audio recordings using AI voice synthesis. Perfect for podcasters and content creators.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Speech Fixer - Fix Words in Audio",
    description:
      "Fix or replace words in audio recordings using AI voice synthesis.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${fraunces.variable} font-body antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
