# AI SDK Components

This directory contains enhanced UI components inspired by Vercel's AI SDK Elements. These components provide a polished, modern interface for audio recording, playback, and voice selection features.

## Components

### AudioPlayer
Enhanced audio player with:
- Play/pause controls
- Seek bar with visual progress
- Volume control
- Time display (current/total)
- Responsive design with warm amber accent

**Usage:**
```tsx
import { AudioPlayer } from '@/components/ai-sdk';

<AudioPlayer
  src="/path/to/audio.mp3"
  autoPlay={false}
  onEnded={() => console.log('Playback finished')}
/>
```

### MicSelector
Microphone device selector with:
- Auto-detection of available audio input devices
- Permission handling
- Device switching
- Refresh functionality

**Usage:**
```tsx
import { MicSelector } from '@/components/ai-sdk';

const [deviceId, setDeviceId] = useState('');

<MicSelector
  onDeviceChange={setDeviceId}
  selectedDeviceId={deviceId}
/>
```

### VoiceSelector
Voice selection interface with:
- Grid layout of voice cards
- Voice preview functionality
- Visual selection state
- Voice metadata display (name, description, labels)

**Usage:**
```tsx
import { VoiceSelector, type Voice } from '@/components/ai-sdk';

const voices: Voice[] = [
  {
    id: 'voice-1',
    name: 'Natural Voice',
    description: 'Warm and friendly',
    labels: { accent: 'American', gender: 'Female' }
  }
];

<VoiceSelector
  voices={voices}
  selectedVoiceId={selectedId}
  onVoiceChange={setSelectedId}
  showPreview={true}
  onPreview={(id) => previewVoice(id)}
/>
```

## Integration with AI SDK

These components are designed to be compatible with `@ai-sdk/react` and the Vercel AI SDK. When the official AI SDK packages are installed, you can:

1. Keep these components as wrappers
2. Or replace them with native AI SDK components

The API surface is designed to match common patterns in the AI SDK ecosystem, making the transition seamless.

## Design System

All components follow the Speech Fixer design system:
- Warm amber accents (`--color-amber-500`)
- Semantic color utilities (`text-themed-*`, `bg-themed-*`)
- Card-based layout with consistent spacing
- Responsive breakpoints
- Light/dark mode support via CSS custom properties

## Dependencies

Current implementation uses:
- React 19+ (hooks, client components)
- Browser APIs (MediaDevices, MediaRecorder, Audio)
- Next.js 16 (client-side rendering)

Future integration will use:
- `ai` package
- `@ai-sdk/react` package

## Testing

Test these components with:
1. Different audio devices (microphone selection)
2. Various audio formats (MP3, WAV, WebM)
3. Light and dark modes
4. Mobile and desktop viewports
5. Different browsers (Chrome, Firefox, Safari)

## Future Enhancements

Potential additions when integrating with full AI SDK:
- Real-time transcription display
- Speech-to-text input
- Voice cloning preview
- Waveform visualization
- Audio effects/filters
