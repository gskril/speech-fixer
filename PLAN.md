# Speech Fixer - Audio Word Replacement Web App

## Overview
Build a web app that allows users to fix or replace specific words/phrases in audio recordings using Eleven Labs AI voice synthesis. Inspired by Descript's text-based editing interface.

## Core Requirements
- **Tech Stack**: Next.js (full-stack React framework)
- **Audio Format**: MP3 uploads
- **Workflow**: Iterative in-place replacement (one edit at a time)
- **Use Case**: Office recordings (clean audio, no heavy background noise)
- **Security**: Not required (home server use only)

## Key Features
1. Audio file upload (MP3)
2. Waveform visualization
3. Automatic transcription with word-level timestamps
4. Text-based editing interface (Descript-inspired)
5. Select words/phrases to replace
6. Type new replacement text
7. AI voice generation matching original speaker
8. In-place audio splicing
9. Updated waveform display

## Technical Approach

### API Integration (Eleven Labs)
**API Key**: `sk_b022d98ec9dbeda413b344d857b75ad66e1e1625c295c78f`

#### Three Core APIs:
1. **Speech-to-Text** (`POST /v1/speech-to-text`)
   - Transcribe uploaded audio
   - Get word-level timestamps
   - Model: Use latest available (e.g., "elevenlabs_native_4")
   - Returns: text, words array with start/end times, speaker info

2. **Instant Voice Clone** (`POST /v1/voices/ivc.create`)
   - Create voice clone from original audio
   - Requires: audio file(s), voice name
   - Returns: voice_id for use in TTS

3. **Text-to-Speech** (`POST /v1/text-to-speech/:voice_id`)
   - Generate replacement audio with cloned voice
   - Input: replacement text, voice_id from clone
   - Output: audio segment in MP3 format

### Frontend Components
1. **Upload Component**
   - Drag-and-drop or file picker
   - MP3 file validation

2. **Waveform Visualizer**
   - Library options: WaveSurfer.js (most popular)
   - Display full audio waveform
   - Interactive selection of regions
   - Playback controls

3. **Transcript Editor**
   - Display transcribed text
   - Word-level selection
   - Inline text editing
   - Highlight selected regions on waveform

4. **Processing UI**
   - Loading states for transcription, voice cloning, synthesis
   - Progress indicators

### Backend (Next.js API Routes)
1. **`/api/upload`** - Handle audio file upload, store temporarily
2. **`/api/transcribe`** - Call Eleven Labs speech-to-text API
3. **`/api/clone-voice`** - Create instant voice clone
4. **`/api/synthesize`** - Generate replacement audio via TTS
5. **`/api/splice`** - Audio processing to replace segments

### Audio Processing
- **Library**: FFmpeg or Web Audio API
- **Operations**:
  1. Extract segment to replace (using timestamps)
  2. Generate replacement audio from TTS
  3. Splice new audio at exact position
  4. Maintain audio format/quality
  5. Return updated audio file

### Data Flow
```
1. User uploads MP3 → Store in /tmp or memory
2. Send to Eleven Labs speech-to-text → Get transcript + timestamps
3. Display waveform + transcript to user
4. User selects words, types replacement
5. Create voice clone from full audio (cache voice_id)
6. Generate TTS audio for replacement text with cloned voice
7. Splice generated audio into original at timestamp positions
8. Update waveform, allow playback
9. Repeat steps 4-8 for additional edits
```

## Implementation Plan

### Phase 1: Project Setup
- [ ] Initialize Next.js project with TypeScript
- [ ] Install dependencies: wavesurfer.js, @elevenlabs/elevenlabs-js
- [ ] Set up project structure (components, API routes, utils)
- [ ] Configure environment variables for API key

### Phase 2: Audio Upload & Transcription
- [ ] Build upload component with file validation
- [ ] Create `/api/transcribe` endpoint
- [ ] Integrate Eleven Labs speech-to-text API
- [ ] Display transcript with word-level data

### Phase 3: Waveform Visualization
- [ ] Integrate WaveSurfer.js
- [ ] Display uploaded audio waveform
- [ ] Sync transcript words with waveform positions
- [ ] Implement region selection on waveform
- [ ] Add playback controls

### Phase 4: Text-Based Editing Interface
- [ ] Build transcript editor component
- [ ] Enable word/phrase selection
- [ ] Add inline text replacement input
- [ ] Highlight selected region on waveform

### Phase 5: Voice Cloning & Synthesis
- [ ] Create `/api/clone-voice` endpoint
- [ ] Implement voice clone creation (cache voice_id)
- [ ] Create `/api/synthesize` endpoint
- [ ] Generate replacement audio via TTS

### Phase 6: Audio Splicing
- [ ] Set up audio processing (FFmpeg or Web Audio API)
- [ ] Create `/api/splice` endpoint
- [ ] Implement audio segment replacement
- [ ] Return updated audio file

### Phase 7: Integration & Polish
- [ ] Connect all components end-to-end
- [ ] Add loading states and error handling
- [ ] Implement audio download functionality
- [ ] Test with various audio files
- [ ] Add basic styling

## Critical Files & Technologies

### Dependencies
- `next` - Framework
- `react` - UI
- `@elevenlabs/elevenlabs-js` - API client
- `wavesurfer.js` - Waveform visualization
- `fluent-ffmpeg` or Web Audio API - Audio processing

### File Structure
```
/app
  /page.tsx - Main upload/editor interface
  /api
    /transcribe/route.ts
    /clone-voice/route.ts
    /synthesize/route.ts
    /splice/route.ts
/components
  /AudioUpload.tsx
  /Waveform.tsx
  /TranscriptEditor.tsx
/lib
  /elevenlabs.ts - API client setup
  /audio-processor.ts - Audio manipulation utils
```

## Confirmed Decisions
- ~~Tech stack preference~~ ✓ Next.js
- ~~Replacement workflow~~ ✓ In-place replacement
- ~~Multi-replacement support~~ ✓ Iterative (one at a time)
- ~~Voice clone timing~~ ✓ **Once per upload** - Create immediately after upload, cache voice_id for all replacements
- ~~Audio processing~~ ✓ **Server-side with FFmpeg** - Better reliability and format support

## Testing Strategy
1. Upload sample office recording
2. Verify transcription accuracy
3. Select word, type replacement
4. Verify voice clone sounds natural
5. Verify spliced audio maintains quality and sync
6. Test multiple iterative replacements

## Notes
- Eleven Labs instant voice cloning works best with 30+ seconds of audio
- Speech-to-speech API has 5-minute limit per segment
- Billing: 1000 characters per minute of audio processed
- Consider caching voice_id to avoid recreating for each edit
