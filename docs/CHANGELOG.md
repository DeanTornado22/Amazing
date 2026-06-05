# VibeTunnel — Project Improvements Changelog

> A complete record of all changes made to the VibeTunnel project during the
> multi-stage review and improvement cycle in June 2026. This file
> complements the historical design-patch documents under
> [`docs/patch-history/`](./patch-history/).

---

## 0. Initial Analysis

When the project was first examined, the codebase had already been
modified by **three rounds of AI-driven redesigns** (Brazilian Phonk
concert → dark concert → minimal modern), but several structural and
UX issues had piled up:

| #   | Issue found                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Production bundle was **1.3 MB** monolithic — no code splitting, no lazy loading                                                                                             |
| 2   | App.tsx was **742 lines** with the entire Tune panel inlined                                                                                                                 |
| 3   | **Zero test coverage** on a project with significant DSP code                                                                                                                |
| 4   | **No CI/CD** despite a Vercel auto-deploy hook in the git log                                                                                                                |
| 5   | **Default BPM inconsistent** between `AudioEngine` (120) and `useVibeStore` (128)                                                                                            |
| 6   | **Duplicate config fields** in `VisualConfig` (`pulseScale`/`pulseStrength`, `twist`/`twistAmount`, `speed`/`cameraSpeed`) — kept in sync manually in `deriveReactiveConfig` |
| 7   | **`getReactiveVisualState` called 4× per frame** by R3F components — same work done four times                                                                               |
| 8   | Per-frame `new Matrix4()` allocations in `CameraRig`                                                                                                                         |
| 9   | The detected theme name was **overwritten by the preset name** on every preset change                                                                                        |
| 10  | The HUD **dominated the screen** with a large metrics card + a large control dock + a full-width waveform panel                                                              |
| 11  | Bass reactivity was weak (multipliers like `0.16`, `0.35`) so kick drums barely affected the scene                                                                           |
| 12  | The scene was visually noisy (420 particles, 4 lasers, 18 equalizer bars all fighting for attention)                                                                         |
| 13  | `as any` casts in `AudioEngine` for the Web Audio analyser node                                                                                                              |
| 14  | `useVibeStore` had unused setters (`isDebug`, `recordingArmed`)                                                                                                              |
| 15  | Historical patch-pack files lived in the repo root (`vibetunnel_patch_pack/`) instead of `docs/`                                                                             |

---

## 1. High-impact Performance Wins

### 1.1 Code splitting (bundle 1.3 MB → 224 KB main)

- **Configurable `manualChunks`** in `vite.config.ts` so Three.js, R3F, postprocessing, and GSAP each ship in their own lazy chunk
- **Lazy `VibeCanvas`** via `React.lazy(() => import('./scene/VibeCanvas'))` wrapped in `<Suspense>` and `<ErrorBoundary>`
- **Result**: the upload screen now ships **224 kB** (down from 1.3 MB). The 970 kB Three.js chunk loads only when the user enters the tunnel.

### 1.2 Per-frame reactive state is now memoized

- New `src/visual/reactiveFrame.ts` exports a `ReactiveFramePrimer` R3F component that runs **once per frame** and caches the smoothed features + derived config in a module-level singleton
- Every other R3F component (TunnelFrames, CameraRig, BeatBurst, PostFX) reads from the cache instead of recomputing
- **Result**: ~4× less per-frame work for the DSP/reactive pipeline

### 1.3 CameraRig no longer allocates `new Matrix4()` per frame

- The look-at `Matrix4` is now created in the component scope, not inside `useFrame`
- The bank `Quaternion` is similarly hoisted

---

## 2. UX Overhaul — "UI no longer interferes with the scene"

### 2.1 Auto-hide HUD (`useAutoHide`)

- New `src/hooks/useAutoHide.ts` — tracks pointer/keyboard/wheel/touch activity, hides the HUD after **2.2s** of idleness
- Fade transition (opacity + transform + blur)
- **`H` key** toggles force-show (pinned) mode
- **`W` key** toggles the waveform/spectrum panel (hidden by default)
- A small **"press H for HUD"** hint appears in the bottom-right when the UI is hidden

### 2.2 New top-row layout

- The back button, theme badge, and metrics now share a single `.hud-top-row` flex container so they sit on the **same horizontal line**: back on the **left**, badge in the **center**, metrics pill on the **right**
- A previous bug where the theme badge was stretched to full screen width has been fixed by adding `align-items: center` to the parent and explicit `align-self` rules to each child

### 2.3 LiveHUD is now compact + collapsible

- New `src/ui/LiveHUD.tsx` replaces the stacked `MetricsPanel` + `BeatIndicator` pair
- Compact mode (`hud-metrics--compact`) renders **only 2 of the 4 metric bars** (Energy + Bass — the most musically relevant) inside a **150 px wide** card
- **Collapsed mode** renders a single **40 px tall pill** showing just the BPM and a play-state dot
- The user toggles between modes with a small `−` button on the card or by clicking the pill

### 2.4 Central control dock is minimal

- The dock buttons (`Pause`, `Tune`, `Up`, `Rec`, `Photosensitive`, `?`) are now **28 px tall** with **8 px font** and **no text wrapping** (using `TUNE` / `UP` instead of "Tune" / "Upload")
- Wrapped in a single rounded pill (`.hud-controls--minimal`) so it reads as one widget

### 2.5 Bottom waveform panel hidden by default

- The 72 px tall waveform/spectrum strip no longer steals the entire bottom of the screen
- When shown (via `W` key) it shrinks to **48 px** tall and uses smaller typography

---

## 3. Bass-Reactive Scene — "more synchronized with the beat, especially bass"

In `src/visual/deriveReactiveConfig.ts` the bass multipliers are now roughly **2× stronger** so kick drums visibly punch the world:

| Effect                | Before                        | After                                 | Boost              |
| --------------------- | ----------------------------- | ------------------------------------- | ------------------ |
| Tunnel pulse strength | `bass * 0.16`                 | `bass * 0.32`                         | **2.0×**           |
| Bloom strength        | `bass * 0.35`                 | `bass * 0.6`                          | **1.7×**           |
| Camera shake          | `bass * bassShakeSensitivity` | `bass * bassShakeSensitivity * 2.4`   | **2.4×**           |
| FOV pulse             | `bass * 1.4`                  | `bass * 2.4`                          | **1.7×**           |
| Floor brightness      | `bass * 0.35`                 | `bass * 0.55`                         | **1.6×**           |
| Floor bass pulse      | `bass * 0.28`                 | `bass * 0.45`                         | **1.6×**           |
| Light intensity       | `energy * 0.75`               | `energy * 0.75 + bass * 0.4`          | new bass term      |
| Equalizer height      | `energy * 2`                  | `energy * 2 + bass * 0.6`             | new bass term      |
| Laser opacity         | `treble * 0.28`               | `treble * 0.28 + bass * 0.08`         | bass added         |
| Fog density           | `+ (1-energy) * 0.012`        | `+ (1-energy) * 0.012 - bass * 0.005` | bass thins the fog |

The "minimal" preset's beat-burst strength was also raised from `0.35` → `0.45` and its lifetime from `0.35s` → `0.4s` so the per-kick explosion lasts a touch longer.

---

## 4. Scene Minimalism

The `MINIMAL_DARK_PRESET` was tuned for the "intentional, not chaotic" vibe:

| Knob                    | Before    | After                           |
| ----------------------- | --------- | ------------------------------- |
| Tunnel twist            | 0.12      | **0.06**                        |
| Section turn strength   | 0.05      | **0.02**                        |
| Particle count          | 420       | **240**                         |
| Laser count             | 4         | **2**                           |
| Laser thickness         | 0.012     | **0.01**                        |
| Equalizer bars          | 18        | **10**                          |
| Equalizer side distance | 5.6       | **6.4** (pushed out)            |
| Bloom strength          | 0.42      | **0.32**                        |
| Bloom threshold         | 0.32      | **0.45** (only brightest glows) |
| Fog density             | 0.026     | **0.018**                       |
| Background color        | `#02040A` | **`#020308`** (even darker)     |
| Fog color               | `#07101E` | **`#03050a`** (darker)          |
| Floor brightness        | 0.35      | **0.45**                        |
| Floor grid opacity      | 0.18      | **0.28**                        |
| Rail brightness         | 0.45      | **0.55**                        |

Together these make the scene darker, calmer, less twitchy, and less visually noisy while still reacting strongly to bass.

---

## 5. New Components & Files

### 5.1 New hooks (`src/hooks/`)

| File                      | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `useAutoHide.ts`          | Auto-fade HUD after idleness, with `H` key force-toggle         |
| `useFps.ts`               | Live FPS counter for the debug overlay                          |
| `useKeyboardShortcuts.ts` | Global keydown handler that ignores form inputs                 |
| `usePersistedConfig.ts`   | Debounced localStorage persistence of the visual config         |
| `useQualityTier.ts`       | Detects mobile / low-RAM / reduced-motion → quality multipliers |

### 5.2 New UI widgets (`src/ui/`)

| File                | Purpose                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| `DebugOverlay.tsx`  | FPS / BPM / beat / lock / duration overlay (D key)                     |
| `ErrorBoundary.tsx` | Catches R3F + WebGL runtime exceptions so the app doesn't white-screen |
| `LiveHUD.tsx`       | Combined compact + collapsible metrics + beat indicator + transport    |
| `SeekAndVolume.tsx` | Inline seek bar + volume slider + mute button                          |
| `ShortcutHelp.tsx`  | `?`-key modal listing all keyboard shortcuts                           |

### 5.3 New utilities (`src/utils/`)

| File                  | Purpose                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `safeLocalStorage.ts` | `safeGetJSON` / `safeSetJSON` / `safeRemove` wrappers that gracefully handle private mode + quota |
| `themeDetails.ts`     | Centralized `THEME_DETAILS` map + `isAcceptedAudioFile` helper + supported extensions list        |

### 5.4 New visual helpers

| File                          | Purpose                                                             |
| ----------------------------- | ------------------------------------------------------------------- |
| `src/visual/reactiveFrame.ts` | Per-frame reactive state cache + `<ReactiveFramePrimer/>` component |

### 5.5 New audio capability

- `src/audio/AudioEngine.ts` now exposes `setVolume(v)`, `getVolume()`, `seek(time)`, `getCurrentTime()` for the new Seek/Volume widget
- `DEFAULT_BPM` constant exported and used consistently across `AudioEngine` and `useVibeStore`
- Stereo files are now summed to mono (`L + R`) before BPM estimation, giving a more stable tempo read

### 5.6 CI + Tests

- **`.github/workflows/ci.yml`** — runs `npm ci && npm run lint && npm run build` on Node 20 + 22
- **`vitest.config.ts`** — test runner config
- **5 test files / 24 tests** covering:
  - `analyzeFrequency.ts` — `avgRange` and `extractMetrics` smoothing
  - `beatSync.ts` — `quantizeFramesPerBeat` and `bpmAnchoredSpeed`
  - `smoothedAudioFeatures.ts` — convergence and vibe-state thresholds
  - `visualPresets.ts` — preset differences and overrides
  - `configFromVibe.ts` — energy/density reactivity

### 5.7 Documentation

- `docs/patch-history/` — the three historical AI redesign patch documents, preserved as reference
- `docs/patch-history/README.md` — index explaining the rounds
- `docs/CHANGELOG.md` — this file

### 5.8 Deprecations

- `src/ui/MetricsPanel.tsx` and `src/ui/BeatIndicator.tsx` are no longer wired into the HUD; `LiveHUD` supersedes them. The files are kept in case external tooling imports them.
- The `vibetunnel_patch_pack/` folder was moved to `docs/patch-history/`.

---

## 6. Keyboard Shortcuts (added to the `?` modal)

| Key       | Action                                                |
| --------- | ----------------------------------------------------- |
| `Space`   | Play / pause                                          |
| `←` / `→` | Nudge beat ±20 ms                                     |
| `H`       | Force-show / pin the HUD on (so it doesn't auto-hide) |
| `W`       | Toggle the waveform/spectrum panel                    |
| `T`       | Toggle the tune panel                                 |
| `M`       | Mute / unmute                                         |
| `D`       | Toggle the debug overlay                              |
| `?`       | Show the shortcut help modal                          |
| `Esc`     | Close the help / tune panel                           |

---

## 7. Other Smaller Fixes

- **`applyVisualPreset`** now preserves the detected theme name (it only falls back to the preset name when the theme name is empty or matches a stale preset fallback)
- **`isAcceptedAudioFile`** in `utils/themeDetails.ts` accepts MP3, WAV, M4A, AAC, OGG, FLAC, and OPUS (was only MP3/WAV)
- **`AudioEngine`** is no longer lazily initialized on `play()` — it now stores `this.analyser`, `this.dataArray`, and `this.source` as nullable instance fields, removed all `as any` casts
- **`Store`** gained `volume`, `showDebug`, and `showShortcutHelp` fields with the corresponding setters
- **CSS** in `src/app/extra.css` adds styles for the new HUD widgets (`.hud-pill`, `.hud-collapse-btn`, `.hud-metrics--compact`, `.hud-controls--minimal`, `.btn-tuner--sm`, `.btn-circle--sm`, `.hud-hint`, etc.)

---

## 8. Final Verification

```
$ npm run build
✓ built in 348ms
dist/assets/index-*.js   223.46 kB (gzip: 70.41 kB)   ← was 1.3 MB
dist/assets/three-*.js   970.61 kB (gzip: 257.60 kB)   ← lazy chunk
dist/assets/gsap-*.js     69.56 kB (gzip:  27.28 kB)   ← lazy chunk
dist/assets/VibeCanvas-*.js  49.15 kB                   ← lazy chunk

$ npm run lint
(eslint clean — 0 errors, 0 warnings)

$ npm run test
Test Files  5 passed (5)
     Tests  24 passed (24)
```

---

## 9. Files Touched (Summary)

### Created

- `docs/CHANGELOG.md`, `docs/patch-history/README.md`
- `.github/workflows/ci.yml`
- `vitest.config.ts`
- `src/hooks/{useAutoHide,useFps,useKeyboardShortcuts,usePersistedConfig,useQualityTier}.ts`
- `src/ui/{DebugOverlay,ErrorBoundary,LiveHUD,SeekAndVolume,ShortcutHelp}.tsx`
- `src/utils/{safeLocalStorage,themeDetails}.ts`
- `src/visual/reactiveFrame.ts`
- `src/app/extra.css`
- `src/audio/{analyzeFrequency,beatSync,smoothedAudioFeatures}.test.ts`
- `src/visual/{configFromVibe,visualPresets}.test.ts`

### Modified (key ones)

- `vite.config.ts` — manual chunks
- `src/App.tsx` — full HUD rewire (auto-hide, lazy VibeCanvas, error boundary, persisted config, H/W shortcuts, top-row layout)
- `src/audio/AudioEngine.ts` — DEFAULT_BPM, setVolume/seek/getCurrentTime, removed `as any`
- `src/audio/vibeEngine.ts` — stereo L+R mixing
- `src/visual/deriveReactiveConfig.ts` — bass multipliers ~2× stronger
- `src/visual/visualPresets.ts` — darker background, less bloom/fog, fewer particles/lasers/equalizer bars, applies preserved theme name
- `src/scene/VibeCanvas.tsx` — uses `ReactiveFramePrimer` and `lazy`
- `src/scene/TunnelScene.tsx` — explicit scene background
- `src/store/useVibeStore.ts` — volume, showDebug, showShortcutHelp; uses DEFAULT_BPM
- `src/app/styles.css` — reformatted to 2-space / double-quote style
- `package.json` — adds `vitest`, `jsdom`, `@vitest/coverage-v8` + test scripts

### Moved

- `vibetunnel_patch_pack/` → `docs/patch-history/`
