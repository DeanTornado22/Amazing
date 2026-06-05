# VibeTunnel Round 3 Patch — Minimal Modern Rhythm Visualizer

## Goal

The current version is too loud, too busy, too magenta/green, and still feels like a geometry demo. We need to shift the art direction from “chaotic neon tunnel” to a **minimal, modern, premium music-reactive tunnel**.

Target feeling:

> A clean futuristic music tunnel where the user glides forward through elegant neon architecture. The visuals breathe with the music. The scene is dark, minimal, modern, rhythmic, and premium — not crowded, not overexposed, not random.

Think:

- Apple-style minimal UI
- modern music visualizer
- cyber nightclub architecture
- elegant tunnel motion
- controlled neon accents
- strong rhythm response
- less chaos, more taste

Do not add more random effects. Reduce visual noise and make every object purposeful.

---

## Current Problems

1. The scene is too busy.
2. Huge magenta planes dominate the screen.
3. The tunnel center is overexposed and loses detail.
4. Lasers are too thick and random.
5. The screen has no negative space.
6. The app does not feel modern or premium.
7. Music metrics are displayed, but the visuals do not truly change according to music highs/lows.
8. The same tunnel behavior appears even when energy, bass, mids, or treble change.
9. The UI is okay but should become cleaner and more integrated.
10. The project needs a tunable config system where every visual metric responds to audio.

---

## New Art Direction

Use this direction:

> Minimal dark tunnel. Clean glowing frames. Thin controlled lasers. Subtle fog. Smooth floor runway. Small particles. Audio-reactive changes that are obvious but elegant.

Avoid:

- giant opaque color planes
- full-screen magenta/green overlays
- too many rings
- too much bloom
- random geometry
- random lasers
- thick lines everywhere
- overexposed white center

Use:

- black / deep navy background
- dark transparent panels
- one primary neon color at a time
- small accent color highlights
- thin lines
- subtle bloom
- smooth GSAP pulses
- large empty dark space
- readable tunnel depth

---

## Visual Style Reference

The app should feel closer to:

- a premium WebGL landing page
- a clean cyber music visualizer
- a futuristic club hallway
- an audio-reactive art installation

Not:

- a chaotic rave screensaver
- random Three.js geometry test
- full-screen laser overload
- green/magenta explosion

---

# Priority Fixes

## 1. Create a Minimal Theme System

Create a `visualConfig` object that controls all metrics. Every visual component should read from this config.

```ts
export type VisualConfig = {
  palette: {
    background: string
    background2: string
    fog: string
    primary: string
    secondary: string
    accent: string
    warm: string
    danger: string
    panel: string
  }
  tunnel: {
    shape: 'circle' | 'rect' | 'triangle' | 'mixed'
    speed: number
    frameCount: number
    segmentSpacing: number
    pulseStrength: number
    twistAmount: number
    sectionTurnStrength: number
    segmentOpacity: number
    panelOpacity: number
    depthFadeStrength: number
  }
  camera: {
    shake: number
    fovPulse: number
    drift: number
    cameraSpeed: number
    mouseInfluence: number
    bassShakeSensitivity: number
    beatZoomStrength: number
  }
  floor: {
    brightness: number
    gridOpacity: number
    gridSpeed: number
    railBrightness: number
    bassPulseStrength: number
    kickFlashColor: string
    depthLength: number
    gridLineCount: number
  }
  particles: {
    count: number
    size: number
    speed: number
    sparkleStrength: number
    beatBurstStrength: number
    beatBurstLifetime: number
    opacity: number
    depthRadius: number
  }
  lasers: {
    count: number
    thickness: number
    opacity: number
    speed: number
    rotationSpeed: number
    trebleFlickerStrength: number
    greenAccentFrequency: number
    beamLength: number
  }
  equalizer: {
    barCount: number
    heightMultiplier: number
    opacity: number
    bassWeight: number
    midsWeight: number
    trebleWeight: number
    sideDistance: number
    movementSpeed: number
    greenAccentThreshold: number
  }
  postfx: {
    bloomStrength: number
    bloomRadius: number
    bloomThreshold: number
    lightIntensity: number
    beatFlashStrength: number
    fogDensity: number
    glitchAmount: number
    screenFlashOpacity: number
  }
}
```

Do not hard-code random values inside components. Components should derive from `visualConfig` and `audioFeatures`.

---

## 2. Use a Minimal Default Theme

Replace the current loud theme with this modern default:

```ts
export const minimalDarkTheme: VisualConfig = {
  palette: {
    background: '#02040A',
    background2: '#050816',
    fog: '#07101E',
    primary: '#00E5FF',
    secondary: '#B14CFF',
    accent: '#FFFFFF',
    warm: '#FFB703',
    danger: '#FF2E63',
    panel: '#070B14'
  },
  tunnel: {
    shape: 'rect',
    speed: 0.7,
    frameCount: 34,
    segmentSpacing: 3.8,
    pulseStrength: 0.08,
    twistAmount: 0.12,
    sectionTurnStrength: 0.05,
    segmentOpacity: 0.42,
    panelOpacity: 0.08,
    depthFadeStrength: 0.7
  },
  camera: {
    shake: 0.02,
    fovPulse: 0.8,
    drift: 0.06,
    cameraSpeed: 0.55,
    mouseInfluence: 0.18,
    bassShakeSensitivity: 0.04,
    beatZoomStrength: 0.9
  },
  floor: {
    brightness: 0.35,
    gridOpacity: 0.18,
    gridSpeed: 0.7,
    railBrightness: 0.45,
    bassPulseStrength: 0.22,
    kickFlashColor: '#00E5FF',
    depthLength: 110,
    gridLineCount: 32
  },
  particles: {
    count: 280,
    size: 0.018,
    speed: 0.65,
    sparkleStrength: 0.35,
    beatBurstStrength: 0.35,
    beatBurstLifetime: 0.35,
    opacity: 0.32,
    depthRadius: 11
  },
  lasers: {
    count: 4,
    thickness: 0.012,
    opacity: 0.22,
    speed: 0.25,
    rotationSpeed: 0.08,
    trebleFlickerStrength: 0.25,
    greenAccentFrequency: 0.0,
    beamLength: 28
  },
  equalizer: {
    barCount: 18,
    heightMultiplier: 1.7,
    opacity: 0.28,
    bassWeight: 0.7,
    midsWeight: 0.5,
    trebleWeight: 0.35,
    sideDistance: 5.6,
    movementSpeed: 0.35,
    greenAccentThreshold: 0.9
  },
  postfx: {
    bloomStrength: 0.42,
    bloomRadius: 0.36,
    bloomThreshold: 0.32,
    lightIntensity: 0.9,
    beatFlashStrength: 0.12,
    fogDensity: 0.026,
    glitchAmount: 0.0,
    screenFlashOpacity: 0.04
  }
}
```

Important: this should look dark and clean. Neon should be accents, not full-screen paint.

---

## 3. Remove Giant Color Planes

Remove or heavily reduce the giant magenta/cyan/green planes that fill the screen.

Rules:

- No full-screen translucent magenta rectangle.
- No massive color planes crossing the whole camera view.
- Panels may exist, but their opacity must be below `0.08` by default.
- Panels should be dark glass panels, not bright neon blocks.

Replace large planes with:

- thin outline frames
- subtle transparent wall hints
- dark panels with low opacity
- line-based geometry

The scene needs more negative space.

---

## 4. Make the Tunnel Cleaner

Reduce the number of overlapping rings and random polygons.

The tunnel should have a clear architectural rhythm:

- repeated rectangular frames
- occasional circle frame every 4th segment
- subtle twist based on mids
- controlled pulse based on bass
- opacity fading into depth

Pseudo behavior:

```ts
const depthAlpha = 1 - index / frameCount
segment.material.opacity = config.tunnel.segmentOpacity * Math.pow(depthAlpha, config.tunnel.depthFadeStrength)

const bassPulse = 1 + audio.bass * config.tunnel.pulseStrength
segment.scale.setScalar(bassPulse)

segment.rotation.z = baseRotation + audio.mids * config.tunnel.twistAmount
```

Do not stack too many bright circles in the center. Keep the center readable.

---

## 5. Make Music Metrics Actually Drive the Scene

The tunable metrics must change based on music analysis.

Create a derived config function:

```ts
export function deriveReactiveConfig(
  base: VisualConfig,
  audio: AudioFeatures
): VisualConfig {
  const energy = smooth(audio.energy)
  const bass = smooth(audio.bass)
  const mids = smooth(audio.mids)
  const treble = smooth(audio.treble)

  return {
    ...base,
    tunnel: {
      ...base.tunnel,
      speed: base.tunnel.speed + energy * 1.2,
      pulseStrength: base.tunnel.pulseStrength + bass * 0.16,
      twistAmount: base.tunnel.twistAmount + mids * 0.22,
      sectionTurnStrength: base.tunnel.sectionTurnStrength + mids * 0.12,
      segmentOpacity: clamp(base.tunnel.segmentOpacity + energy * 0.2, 0.25, 0.7)
    },
    camera: {
      ...base.camera,
      shake: base.camera.shake + bass * 0.045,
      fovPulse: base.camera.fovPulse + bass * 1.4,
      cameraSpeed: base.camera.cameraSpeed + energy * 0.75
    },
    floor: {
      ...base.floor,
      brightness: base.floor.brightness + bass * 0.35,
      gridSpeed: base.floor.gridSpeed + energy * 0.9,
      bassPulseStrength: base.floor.bassPulseStrength + bass * 0.28
    },
    particles: {
      ...base.particles,
      speed: base.particles.speed + energy * 1.4,
      sparkleStrength: base.particles.sparkleStrength + treble * 0.8,
      opacity: clamp(base.particles.opacity + treble * 0.35, 0.2, 0.75)
    },
    lasers: {
      ...base.lasers,
      opacity: clamp(base.lasers.opacity + treble * 0.28, 0.12, 0.55),
      rotationSpeed: base.lasers.rotationSpeed + treble * 0.25,
      trebleFlickerStrength: base.lasers.trebleFlickerStrength + treble * 0.45
    },
    equalizer: {
      ...base.equalizer,
      heightMultiplier: base.equalizer.heightMultiplier + energy * 2.0,
      opacity: clamp(base.equalizer.opacity + energy * 0.25, 0.2, 0.65)
    },
    postfx: {
      ...base.postfx,
      bloomStrength: clamp(base.postfx.bloomStrength + bass * 0.35, 0.35, 0.85),
      lightIntensity: base.postfx.lightIntensity + energy * 0.75,
      fogDensity: base.postfx.fogDensity + (1 - energy) * 0.015
    }
  }
}
```

Every frame should use this derived config, not just the static base config.

---

## 6. Add Smoothing So Reactivity Feels Premium

Raw frequency values will feel jittery. Add smoothing.

Use lerp/smooth damp:

```ts
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

smoothed.bass = lerp(smoothed.bass, raw.bass, 0.08)
smoothed.mids = lerp(smoothed.mids, raw.mids, 0.06)
smoothed.treble = lerp(smoothed.treble, raw.treble, 0.12)
smoothed.energy = lerp(smoothed.energy, raw.energy, 0.05)
```

Then use smoothed values for visuals.

Bass should feel punchy but controlled. Treble can flicker faster. Energy should move slowly.

---

## 7. Make High / Low Music States Visually Different

The scene should clearly change depending on the music.

### Low energy section

- slower camera
- fewer particles
- lower bloom
- darker background
- tunnel opacity reduced
- lasers almost hidden
- floor grid dim

### Medium energy section

- normal speed
- visible floor
- soft pulse
- moderate particles
- equalizer bars active

### High energy section

- faster tunnel speed
- stronger floor pulse
- more particle sparkle
- slightly stronger bloom
- more visible lasers
- stronger camera FOV pulse
- section color accent appears

Implement this through thresholds:

```ts
const vibeState =
  energy > 0.72 ? 'high' :
  energy > 0.38 ? 'medium' :
  'low'
```

Then gently transition between states using GSAP or lerp.

Do not jump harshly.

---

## 8. Improve UI Metrics Display

The metrics should visibly update and feel useful.

Top-right panel should show:

- BPM
- ENERGY as percentage
- BASS as percentage
- MIDS as percentage
- TREBLE as percentage
- VIBE STATE: LOW / MEDIUM / HIGH

The values should update smoothly.

Use small animated bars, not just text.

Example:

```txt
ENERGY  ███████░░ 72%
BASS    ████████░ 80%
MIDS    ████░░░░░ 44%
TREBLE  █████░░░░ 55%
STATE   HIGH
```

The UI must prove the music is being analyzed.

---

## 9. Add a Tuning Panel That Actually Changes Config

The TUNE button should open a minimal tuning panel.

User should be able to adjust:

- Bloom strength
- Tunnel speed
- Pulse strength
- Particle amount
- Laser opacity
- Floor brightness
- Camera shake
- Minimal / Concert / Intense mode

These controls should modify `visualConfig` live.

Keep the panel minimal, dark, and modern.

Do not show 80 sliders at once. Show 6–8 useful controls first.

---

## 10. Create Three Presets

Create 3 clean presets instead of one chaotic theme:

### Minimal Mode

- very dark
- low bloom
- cyan primary
- few lasers
- subtle particles
- premium visualizer feel

### Club Mode

- slightly more magenta
- visible floor grid
- more equalizer bars
- mild lasers
- stronger beat pulse

### Intense Mode

- stronger speed
- more bloom
- more particles
- more camera shake
- faster laser flicker
- still no giant opaque planes

Preset names:

```ts
'minimal' | 'club' | 'intense'
```

Default should be `minimal`, not intense.

---

## 11. Make Beat Effects Minimal But Impactful

Current beat effects feel like everything is glowing at once.

Use controlled beat effects:

On beat:

- tunnel scales up by only 3–8%
- floor rail flashes briefly
- camera FOV increases by 0.5–1.5 degrees
- a thin ring expands from the center
- particles brighten slightly

Do not blast the whole screen.

GSAP example:

```ts
function onBeat(strength: number) {
  const s = clamp(strength, 0, 1)

  gsap.fromTo(beatRing.scale,
    { x: 0.7, y: 0.7, z: 0.7 },
    { x: 1.45, y: 1.45, z: 1.45, duration: 0.32, ease: 'power3.out' }
  )

  gsap.fromTo(beatRing.material,
    { opacity: 0.38 * s },
    { opacity: 0, duration: 0.32, ease: 'power2.out' }
  )

  gsap.fromTo(camera,
    { fov: baseFov },
    {
      fov: baseFov + reactiveConfig.camera.fovPulse * s,
      duration: 0.07,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
      onUpdate: () => camera.updateProjectionMatrix()
    }
  )
}
```

---

## 12. Composition Rules

Use this composition:

- 60% dark negative space
- 25% tunnel architecture
- 10% particles/lasers
- 5% UI

Center should be clear, not a white blob.

The viewer should understand:

1. I am inside a tunnel.
2. The tunnel is moving forward.
3. The music controls the world.
4. The UI metrics match the visual changes.

---

# Required File Structure

Refactor or add these files:

```txt
src/config/visualConfig.ts
src/config/presets.ts
src/audio/useSmoothedAudioFeatures.ts
src/audio/deriveReactiveConfig.ts
src/visual/MinimalTunnel.tsx
src/visual/NeonFloor.tsx
src/visual/MinimalLasers.tsx
src/visual/EqualizerRails.tsx
src/visual/SpeedParticles.tsx
src/visual/BeatRing.tsx
src/visual/CameraRig.tsx
src/ui/MetricsPanel.tsx
src/ui/TuningPanel.tsx
```

If the project already has similar files, update them instead of duplicating.

---

# Implementation Order

Do this in order. Keep the app runnable after every step.

## Step 1
Remove giant color planes and reduce bloom.

## Step 2
Add `visualConfig`, `minimalDarkTheme`, and preset system.

## Step 3
Make tunnel read from `visualConfig`.

## Step 4
Implement smoothed audio features.

## Step 5
Implement `deriveReactiveConfig()`.

## Step 6
Connect energy/bass/mids/treble to tunnel, floor, particles, lasers, camera, and bloom.

## Step 7
Add metrics UI with live bars.

## Step 8
Add tuning panel for 6–8 main controls.

## Step 9
Add Minimal / Club / Intense preset switch.

## Step 10
Polish composition so it looks premium and minimal.

---

# Acceptance Criteria

The fix is successful only if:

- The scene is mostly dark, not full-screen magenta/green.
- The visual style feels modern and minimal.
- Bloom no longer destroys details.
- Music metrics visibly change the scene.
- Low-energy music looks calmer.
- High-energy music looks faster/brighter/more active.
- Bass makes tunnel/floor pulse.
- Mids affect twist/turn movement.
- Treble affects particles/lasers.
- The UI metrics update live.
- The TUNE panel actually changes visual parameters.
- The app feels like a premium audio-reactive WebGL experience, not a random geometry demo.

---

# Final Direction

Do not make it more chaotic.
Make it more intentional.

Do not add more objects.
Make fewer objects feel better.

Do not make everything glow.
Make only important things glow.

The target is:

> Minimal modern dark tunnel + tasteful neon + smooth audio reactivity + clear tunable metrics.
