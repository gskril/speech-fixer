# Speech Fixer

A web app that allows users to fix or replace specific words/phrases in audio recordings using AI voice synthesis powered by Eleven Labs. Inspired by Descript's text-based editing interface.

## Features

- **Audio Upload**: Drag-and-drop or click to upload MP3 files
- **Waveform Visualization**: Interactive waveform display using WaveSurfer.js
- **Automatic Transcription**: Word-level transcription with timestamps using Eleven Labs Speech-to-Text
- **Text-Based Editing**: Select words directly from the transcript
- **AI Voice Cloning**: Instantly clone the speaker's voice from the uploaded audio
- **In-Place Replacement**: Generate new audio that matches the original speaker
- **Audio Splicing**: Seamlessly replace selected segments using FFmpeg

## Getting Started

### Prerequisites

- Node.js 18+
- FFmpeg installed on your system
- Eleven Labs API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/gskril/speech-fixer.git
cd speech-fixer
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your Eleven Labs API key:
```env
ELEVENLABS_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Upload**: Drop an MP3 file to upload
2. **Transcribe**: The audio is automatically transcribed with word-level timestamps
3. **Clone Voice**: A voice clone is created from the uploaded audio
4. **Select**: Click and drag to select words in the transcript or waveform
5. **Replace**: Type the new text you want to replace the selection with
6. **Process**: AI generates new audio with the cloned voice, and it's spliced into the original
7. **Download**: Download the edited audio file

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: React + Tailwind CSS
- **Audio**: WaveSurfer.js for visualization, FFmpeg for processing
- **AI**: Eleven Labs API (Speech-to-Text, Voice Cloning, Text-to-Speech)
- **Language**: TypeScript

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/transcribe` | POST | Transcribe audio to text with timestamps |
| `/api/clone-voice` | POST | Create an instant voice clone |
| `/api/clone-voice` | DELETE | Delete a cloned voice |
| `/api/synthesize` | POST | Generate speech with a cloned voice |
| `/api/splice` | POST | Replace audio segments |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── clone-voice/route.ts
│   │   ├── splice/route.ts
│   │   ├── synthesize/route.ts
│   │   └── transcribe/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AudioUpload.tsx
│   ├── ProcessingStatus.tsx
│   ├── ReplacementInput.tsx
│   ├── TranscriptEditor.tsx
│   └── Waveform.tsx
└── lib/
    ├── audio-processor.ts
    ├── elevenlabs.ts
    └── types.ts
```

## Notes

- Eleven Labs instant voice cloning works best with 30+ seconds of clear audio
- For best results, use audio with minimal background noise
- Voice clones are cached per session to avoid recreating for each edit

## License

MIT
