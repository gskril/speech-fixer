# CLAUDE.md - Codebase Patterns & Guidelines

## Project Overview
Speech Fixer is a Next.js web app for replacing words in audio recordings using ElevenLabs AI voice synthesis. Users upload MP3 files, select words from the transcript, and replace them with AI-generated speech that matches the original speaker's voice.

## Quick Start
```bash
npm install
npm run dev
# Requires ELEVENLABS_API_KEY in .env.local
```

## Architecture Patterns

### API Layer (React Query)
All API calls use React Query mutations defined in `src/hooks/useApi.ts`:
- `useTranscribe` - Transcribe audio to text with timestamps
- `useCloneVoice` - Create voice clone from audio
- `useSynthesize` - Generate TTS audio
- `useSplice` - Splice replacement audio into original
- `useReplaceAudio` - Orchestrates synthesize + splice

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
- `page.tsx` - Main orchestrator, manages state for audio/transcript/selection
- `AudioUpload.tsx` - Drag-and-drop file upload
- `Waveform.tsx` - WaveSurfer.js visualization with region selection
- `TranscriptEditor.tsx` - Word-level text selection (click-drag or shift+arrows)
- `ReplacementInput.tsx` - Text input for replacement + replace button
- `ProcessingStatus.tsx` - Loading overlay during API calls

### State Flow
1. User uploads MP3 → triggers transcription + voice cloning in parallel
2. Transcript displays with word spans, waveform renders
3. User selects words → `WordSelection` object with start/end times + indices
4. User types replacement → calls `handleReplace`:
   - Synthesize new audio via ElevenLabs TTS
   - Splice into original using FFmpeg
   - Update transcript timestamps (estimated based on text length ratio)
   - Reload waveform with new audio

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
1. Use an MP3 file with clear speech (30+ seconds recommended for voice cloning)
2. Select words in transcript by clicking and dragging
3. Type replacement text and click "Replace Audio"
4. Use "Play Selection" to verify the splice
5. Download to verify the final file
