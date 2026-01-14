# CLAUDE.md - Codebase Patterns & Guidelines

## Project Overview
Speech Fixer is a Next.js web app with two modes:
1. **Fix Mode**: Replace words in audio recordings using AI voice cloning. Upload audio, select words from the transcript, and replace them with AI-generated speech.
2. **Generate Mode**: Create new audio from scratch. Record a voice sample, write a script, and generate audio in that voice.

## Quick Start
```bash
npm install
npm run dev
# Requires ELEVENLABS_API_KEY in .env.local
```

## Deployment (Railway)

Railway uses Railpack for builds. Set these environment variables:
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key
- `RAILPACK_DEPLOY_APT_PACKAGES=ffmpeg` - Installs FFmpeg via apt

The `audio-processor.ts` uses `execFileSync("which", ["ffmpeg"])` to find system binaries.

## Architecture Patterns

### API Layer (React Query)
All API calls use React Query mutations defined in `src/hooks/useApi.ts`:
- `useTranscribe` - Transcribe audio to text with timestamps
- `useCloneVoice` - Create voice clone from audio
- `useDeleteVoice` - Delete a cloned voice from ElevenLabs
- `useSynthesize` - Generate TTS audio
- `useSplice` - Splice replacement audio into original
- `useReplaceAudio` - Orchestrates synthesize + splice (Fix mode)
- `useGenerateAudio` - Orchestrates clone + synthesize (Generate mode)

Usage pattern:
```typescript
const transcribe = useTranscribe();
const result = await transcribe.mutateAsync({ audio: file });
```

### Server-Side Audio Processing
Audio splicing uses FFmpeg via `fluent-ffmpeg` in `src/lib/audio-processor.ts`.

**Critical**: When concatenating audio segments, all must have identical encoding parameters. The `spliceAudio` function normalizes all segments to:
- Codec: libmp3lame (MP3)
- Sample rate: 44100 Hz
- Bitrate: 128kbps
- Channels: 2 (stereo)

### Component Structure
- `page.tsx` - Main orchestrator, manages state and mode switching
- `ModeToggle.tsx` - Toggle between Fix and Generate modes
- `ProcessingStatus.tsx` - Loading overlay with step progress (indeterminate animation)

**Fix Mode Components:**
- `AudioUpload.tsx` - Drag-and-drop file upload
- `Waveform.tsx` - WaveSurfer.js visualization with region selection
- `TranscriptEditor.tsx` - Word-level text selection (click-drag or shift+arrows)
- `ReplacementInput.tsx` - Text input for replacement + replace button

**Generate Mode Components:**
- `GenerateMode.tsx` - Orchestrates voice recording and script synthesis
- `VoiceRecorder.tsx` - Browser-based audio recording with sample script

### State Flow

**Fix Mode:**
1. User uploads MP3 → triggers transcription + voice cloning sequentially
2. Transcript displays with word spans, waveform renders
3. User selects words → `WordSelection` object with start/end times + indices
4. User types replacement → calls `handleReplace`:
   - Synthesize new audio via ElevenLabs TTS
   - Splice into original using FFmpeg
   - Update transcript timestamps (estimated based on text length ratio)
   - Reload waveform with new audio

**Generate Mode:**
1. User records voice sample using browser MediaRecorder
2. User previews and confirms recording
3. User types script text
4. On generate → clone voice from sample, then synthesize script
5. Audio plays back and can be downloaded

### TypeScript Types (`src/lib/types.ts`)
```typescript
interface Word {
  text: string;
  start: number;  // seconds
  end: number;    // seconds
  type: "word" | "punctuation" | "spacing";
}

interface WordSelection {
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  selectedText: string;
}
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/transcribe` | POST | Speech-to-text via ElevenLabs |
| `/api/clone-voice` | POST | Create instant voice clone |
| `/api/synthesize` | POST | Text-to-speech with cloned voice |
| `/api/splice` | POST | FFmpeg audio segment replacement |

All routes accept FormData and return JSON with base64-encoded audio where applicable.

## Common Gotchas

### FFmpeg Concat Format Mismatch
If spliced audio has distortion or playback stops, check that all segments are normalized to the same format before concatenation. Never use `-c copy` without format normalization.

### Transcript Timing After Replacement
After replacing audio, transcript timestamps are estimated based on text length ratios. This is imperfect but works for most cases. The actual audio duration may differ slightly from the estimate.

### WaveSurfer React Strict Mode
The `AbortError: signal is aborted without reason` in console during development is from React Strict Mode double-invoking effects. This is expected and doesn't affect functionality.

### Voice Clone Caching
Voice clone is created once per upload and cached. The `voiceId` is stored in component state and reused for all replacements in that session.

## File Naming Conventions
- Components: PascalCase (`TranscriptEditor.tsx`)
- Hooks: camelCase with `use` prefix (`useApi.ts`)
- API routes: kebab-case directories (`clone-voice/route.ts`)
- Lib utilities: kebab-case (`audio-processor.ts`)

## Testing Locally

**Fix Mode:**
1. Use an MP3 file with clear speech (30+ seconds recommended for voice cloning)
2. Select words in transcript by clicking and dragging
3. Type replacement text and click "Replace Audio"
4. Use "Play Selection" to verify the splice
5. Download to verify the final file

**Generate Mode:**
1. Click "Generate Voice" tab
2. Record 30-60 seconds reading the sample script (or improvise)
3. Preview recording and confirm
4. Type script text to generate
5. Click "Generate Audio" and wait for processing
6. Play back and download the result

## Theming

### Design System
- **Fonts**: DM Sans (body), Fraunces (display) - loaded via `next/font/google`
- **Theme**: "Studio Warm" aesthetic with warm amber accents
- **Colors**: Defined as CSS custom properties in `globals.css`

### Light/Dark Mode
Uses CSS `prefers-color-scheme` media query. Theme variables are defined in `:root` (light) and overridden in `@media (prefers-color-scheme: dark)`.

**Semantic color utilities** (defined in `globals.css`):
- `text-themed-primary` - Main text color
- `text-themed-secondary` - Secondary text
- `text-themed-tertiary` - Tertiary text
- `text-themed-muted` - Muted/disabled text
- `text-themed-accent` - Accent color (amber)
- `bg-themed-primary/secondary/tertiary` - Background colors
- `border-themed` - Border color

**WaveSurfer**: Waveform colors adapt dynamically using `window.matchMedia("(prefers-color-scheme: dark)")` listener in `Waveform.tsx`.

## Voice Quality Settings

The `/api/synthesize` route uses these ElevenLabs settings for best quality:
- **Model**: `eleven_multilingual_v2` (higher quality than turbo)
- **Voice Settings**:
  - `stability`: 0.5
  - `similarityBoost`: 0.9
  - `style`: 0.3
  - `useSpeakerBoost`: true

For best voice cloning results, use 1-2 minutes of clear speech without background noise.
