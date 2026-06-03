# VibeTunnel

VibeTunnel is a browser-based audio visualizer built with React, TypeScript, Vite, Three.js, React Three Fiber, GSAP, and Zustand.

Upload an MP3 or WAV file, analyze its musical profile, then enter an audio-reactive neon tunnel driven by BPM, bass, energy, treble, and beat events.

## Features

- MP3/WAV upload with drag and drop
- Client-side audio decoding and rough music profiling
- BPM override for manual beat sync
- Theme selection from detected energy, bass, brightness, and rhythm density
- Real-time Web Audio frequency analysis
- Beat-reactive tunnel frames, particles, lighting, shock rings, gates, bloom, and glitch effects
- Beat-synced unexpected tunnel turns during playback

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## Notes

The current music analysis is intentionally lightweight and runs fully in the browser. BPM and frequency features are useful for visual direction, but they are not studio-grade analysis yet.

Good next improvements are stronger BPM/onset detection, seek and volume controls, preset editing, performance quality modes, and timeline-aware scene changes for drops or breakdowns.
