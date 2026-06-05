# VibeTunnel Visual Redesign Patch — From Geometry Demo to Blowmind Music Tunnel

Use this file as a **direct instruction document** for Codex, Gemini, Claude Code, Cursor, or any coding agent working on the VibeTunnel project.

The current app technically works, but visually it looks like a flat geometry prototype. This patch explains exactly how to redesign it into a dark, aggressive, neon, beat-synced 3D music tunnel.

---

## 0. Current Problem Summary

The current scene has these issues:

- The background is a flat green color and looks unfinished.
- The tunnel is mostly centered rings and rectangles, so it feels like a simple math animation.
- There is no clear floor, wall, ceiling, stage, club, or concert environment.
- The app does not yet feel fast, deep, immersive, or rhythm-driven.
- Beat sync is too weak or not visible enough.
- There is not enough contrast, fog, glow, lighting, particles, lasers, or camera energy.
- The UI is too disconnected from the visual world.

The goal of this patch is to turn the app into:

> A dark neon phonk concert tunnel where the user feels like they are flying forward through music. The world should pulse, shake, flash, glow, and mutate on every beat.

---

## 1. New Art Direction

The app should feel like a mix of:

- Beat Saber tunnel energy
- Dead as Disco / rhythm concert game
- Brazilian phonk music video
- Underground nightclub
- Cyberpunk runner
- Audio-reactive music visualizer
- Interactive 3D concert stage

Visual keywords:

- dark
- neon
- aggressive
- bass-heavy
- fast
- smoky
- glowing
- glitchy
- immersive
- phonk
- concert tunnel
- rhythm game
- endless forward motion

Do **not** make the scene cute, clean, minimal, soft, or flat.

---

## 2. Target Visual Result

After this patch, the app should look like this:

> The user is flying through a dark underground tunnel. Neon magenta frames rush toward the camera. Acid green and cyan lasers cut across the space. A glowing floor grid moves underneath. Fog hides the far distance. Speaker stacks and equalizer bars sit on both sides. Speed particles fly past the camera. Every bass hit expands the tunnel, shakes the camera, flashes the lights, and bursts particles forward.

The user should immediately understand:

- this is a music experience
- the tunnel is alive
- the beat controls the world
- the website is not just showing shapes, it is creating a concert world

---

## 3. Color Palette Change

Replace the flat green background with a dark neon palette.

Use this base palette:

```ts
export const brazilianPhonkPalette = {
  background: "#030006",
  background2: "#080012",
  fog: "#12001f",
  primary: "#ff1ac6",     // neon magenta
  secondary: "#39ff14",   // acid green
  accent: "#00e5ff",      // cyan
  warm: "#ffcc00",        // hot yellow accent
  danger: "#ff0033",      // red impact flash
  darkPanel: "#07000d"
}
```

Rules:

- Black/deep purple should dominate the screen.
- Magenta should be the main tunnel color.
- Acid green should be an accent, not the whole background.
- Cyan should be used for lasers, UI glow, and highlights.
- Avoid large flat color surfaces.

---

## 4. Scene Structure

Refactor or create the visual engine with this structure:

```txt
src/
  visual/
    TunnelScene.tsx
    TunnelSegments.tsx
    NeonFloor.tsx
    LaserBeams.tsx
    EqualizerBars.tsx
    SpeedParticles.tsx
    ConcertSilhouettes.tsx
    CameraRig.tsx
    BeatEffects.ts
    PostProcessing.tsx
  audio/
    useAudioAnalyzer.ts
    useBeatClock.ts
  config/
    themes.ts
```

If the app is not using React Three Fiber, keep the same conceptual modules as plain Three.js files:

```txt
src/
  visual/
    createTunnelScene.ts
    createTunnelSegments.ts
    createNeonFloor.ts
    createLaserBeams.ts
    createEqualizerBars.ts
    createSpeedParticles.ts
    createCameraRig.ts
    beatEffects.ts
    postProcessing.ts
  audio/
    audioAnalyzer.ts
    beatClock.ts
  config/
    themes.ts
```

Do not put all visual logic into one giant file.

---

## 5. Shared Audio Feature Type

Create or normalize the live audio data into this shape:

```ts
export type AudioFeatures = {
  bass: number       // 0 to 1
  mids: number       // 0 to 1
  treble: number     // 0 to 1
  energy: number     // 0 to 1
  beat: boolean
  beatStrength: number // 0 to 1
  bpm: number
  time: number
}
```

Every visual component should read from this data.

---

## 6. Add Real Tunnel Depth

The current tunnel feels like flat rings. Replace or upgrade it into an endless tunnel system.

### Requirements

Create 32–48 tunnel segments placed along negative Z.

Each segment should include:

- rectangular neon frame
- optional circular or octagon inner ring
- side wall line accents
- ceiling strip light
- slight rotation offset
- slight scale variation

Segments should move toward the camera and recycle after passing it.

### Pseudocode

```ts
const SEGMENT_COUNT = 42
const SEGMENT_SPACING = 5
const SPEED = 18

for (let i = 0; i < SEGMENT_COUNT; i++) {
  const segment = createTunnelSegment(i)
  segment.position.z = -i * SEGMENT_SPACING
  tunnelGroup.add(segment)
}

function updateTunnel(delta: number, audio: AudioFeatures) {
  const speed = SPEED * (0.65 + audio.energy * 0.9)

  tunnelSegments.forEach((segment, index) => {
    segment.position.z += delta * speed
    segment.rotation.z += delta * (0.08 + audio.treble * 0.25)

    const beatScale = 1 + audio.bass * 0.08
    segment.scale.setScalar(beatScale)

    if (segment.position.z > 8) {
      segment.position.z -= SEGMENT_COUNT * SEGMENT_SPACING
      segment.rotation.z = Math.random() * Math.PI
    }
  })
}
```

### Segment style

- use line geometry or thin box geometry for neon edges
- avoid solid filled shapes unless they are dark transparent panels
- use emissive materials
- add bloom so the edges glow

---

## 7. Replace Flat Background With Fog + Gradient

Add atmospheric background.

### Three.js fog

```ts
scene.background = new THREE.Color("#030006")
scene.fog = new THREE.FogExp2("#080012", 0.035)
```

### Add large dark gradient planes

Add 2–3 huge transparent planes in the far background with dark purple/black materials.

Do not make the whole background green.

---

## 8. Add Neon Floor Grid / Runway

The scene needs a ground plane so the user feels inside a world.

### Requirements

Add a floor grid below the camera:

- position Y around -2.2 to -3.0
- extend into distance
- horizontal grid lines moving toward camera
- side rails with magenta/cyan glow
- kick/bass pulses the floor brightness

### Visual behavior

- Bass increases emissive intensity.
- Grid lines scroll toward the camera.
- On beat, floor briefly expands or flashes.

### Pseudocode

```ts
function updateFloor(delta: number, audio: AudioFeatures) {
  gridLines.forEach((line) => {
    line.position.z += delta * (14 + audio.energy * 16)
    if (line.position.z > 8) line.position.z = -160
  })

  floorMaterial.emissiveIntensity = 0.6 + audio.bass * 2.4
}
```

---

## 9. Add Bloom / Postprocessing

Neon without bloom looks dead.

Use postprocessing.

### Required passes

- RenderPass
- UnrealBloomPass
- optional glitch pass later
- optional chromatic aberration later

Suggested values:

```ts
bloomPass.strength = 1.35
bloomPass.radius = 0.65
bloomPass.threshold = 0.12
```

Mobile fallback:

```ts
bloomPass.strength = isMobile ? 0.75 : 1.35
```

Do not overdo bloom so much that the whole scene becomes white/pink.

---

## 10. Strong Beat Effects

Beat impact must be obvious.

On every beat/kick:

- tunnel expands outward
- camera FOV punches in/out
- camera shakes
- lights flash
- floor brightness spikes
- particles burst from center
- maybe screen flash overlay appears for 50ms

### GSAP beat function

```ts
import gsap from "gsap"

export function triggerBeatPulse({
  camera,
  tunnelGroup,
  floorGroup,
  lights,
  strength
}: {
  camera: THREE.PerspectiveCamera
  tunnelGroup: THREE.Group
  floorGroup: THREE.Group
  lights: THREE.Light[]
  strength: number
}) {
  const s = Math.min(1, Math.max(0, strength))

  gsap.fromTo(
    camera,
    { fov: 74 },
    {
      fov: 82 + s * 6,
      duration: 0.055,
      yoyo: true,
      repeat: 1,
      ease: "power3.out",
      onUpdate: () => camera.updateProjectionMatrix()
    }
  )

  gsap.fromTo(
    tunnelGroup.scale,
    { x: 1, y: 1, z: 1 },
    {
      x: 1 + s * 0.12,
      y: 1 + s * 0.12,
      z: 1,
      duration: 0.08,
      yoyo: true,
      repeat: 1,
      ease: "power4.out"
    }
  )

  gsap.fromTo(
    floorGroup.scale,
    { x: 1, y: 1, z: 1 },
    {
      x: 1 + s * 0.08,
      y: 1,
      z: 1 + s * 0.04,
      duration: 0.08,
      yoyo: true,
      repeat: 1,
      ease: "power4.out"
    }
  )

  lights.forEach((light) => {
    const baseIntensity = light.userData.baseIntensity ?? light.intensity
    gsap.fromTo(
      light,
      { intensity: baseIntensity },
      {
        intensity: baseIntensity + s * 6,
        duration: 0.045,
        yoyo: true,
        repeat: 1,
        ease: "power2.out"
      }
    )
  })
}
```

Important: Do not trigger a new GSAP timeline every frame. Trigger only when the beat state changes from false to true.

---

## 11. Camera Rig Upgrade

The camera is currently too static. Add movement that feels like flying through music.

### Requirements

- constant forward rush illusion from tunnel recycling
- mouse/parallax movement
- subtle side sway
- bass shake
- FOV pulse on beat
- slight roll/tilt

### Pseudocode

```ts
function updateCamera(camera, mouse, time, audio) {
  const bassShake = audio.bass > 0.72 ? audio.bass * 0.05 : 0

  camera.position.x = mouse.x * 0.55 + Math.sin(time * 0.7) * 0.14 + (Math.random() - 0.5) * bassShake
  camera.position.y = mouse.y * 0.32 + Math.sin(time * 1.1) * 0.08 + (Math.random() - 0.5) * bassShake
  camera.position.z = 8

  camera.rotation.x = mouse.y * -0.035
  camera.rotation.y = mouse.x * -0.045
  camera.rotation.z = mouse.x * -0.04 + Math.sin(time * 0.9) * 0.015
}
```

Avoid making the shake nauseating.

---

## 12. Add Laser Beams

Add concert lasers to make the space feel alive.

### Requirements

- 8–16 beams
- cyan, magenta, acid green
- cross diagonally through the tunnel
- rotate slowly
- pulse opacity/intensity on treble and beat

Implementation choices:

- thin cylinders
- Line2 if available
- transparent plane strips

Simple version: use thin cylinders with emissive material.

```ts
laser.material.opacity = 0.25 + audio.treble * 0.55
laser.rotation.z += delta * (0.15 + audio.mids * 0.5)
```

---

## 13. Add Equalizer Bars

Add audio-reactive bars on the left and right sides.

### Requirements

- 16 bars on left
- 16 bars on right
- placed along side walls or near floor
- scale Y with frequency bands
- emissive intensity changes with audio

### Pseudocode

```ts
bars.forEach((bar, i) => {
  const value = frequencyBands[i] ?? 0
  bar.scale.y = 0.2 + value * 4.0
  bar.material.emissiveIntensity = 0.4 + value * 2.8
})
```

This will make the app clearly music-reactive even when beat detection is imperfect.

---

## 14. Add Speed Particles

Particles should make the user feel fast movement.

### Requirements

- 400–900 particles for desktop
- 150–350 particles for mobile
- small glowing squares/dots/streaks
- move from far Z toward camera
- recycle after passing camera
- more speed when energy is high

### Pseudocode

```ts
function updateParticles(delta, audio) {
  const speed = 22 + audio.energy * 45

  particles.forEach((p) => {
    p.position.z += delta * speed
    p.position.x += Math.sin(p.userData.seed + time) * 0.002

    if (p.position.z > 10) {
      p.position.z = -180
      p.position.x = randomRange(-18, 18)
      p.position.y = randomRange(-10, 10)
    }
  })
}
```

On beat, spawn or activate a short burst from the center.

---

## 15. Add Concert Silhouettes / Stage Shapes

Do not use complex character models yet. Use simple silhouettes.

Add:

- dark crowd shapes at bottom left/right
- dancer silhouettes far in the tunnel
- speaker stacks on both sides
- circular speaker cones pulsing with bass
- distant stage gate glowing at center

### Speaker stack idea

- black box mesh
- two or three circular speaker cones
- cones pulse scale on bass
- magenta/cyan edge glow

### Dancer silhouette idea

- black plane/shape with neon outline
- bounce scale Y slightly on beat
- move arms/parts later if needed

---

## 16. Add Section-Based Visual Changes

Even before advanced song analysis, change the tunnel over time.

Every 16 or 32 beats:

- rotate tunnel direction slightly
- switch accent color
- increase/decrease laser count
- add a flash transition
- change ring shape from rectangle to octagon/circle

### Pseudocode

```ts
const sectionIndex = Math.floor(beatCount / 32)

if (sectionIndex !== lastSectionIndex) {
  triggerSectionTransition(sectionIndex)
  lastSectionIndex = sectionIndex
}
```

Section transitions make the app feel like a music video instead of a static loop.

---

## 17. UI Redesign

The UI should feel like part of the concert system.

### Required UI elements

- top center theme badge: `Brazilian Phonk Tunnel`
- top right stats: BPM, energy, bass
- bottom center control dock: play/pause, tune, upload
- optional left panel: vibe detected summary

### Style

Use dark glass UI:

```css
.control-panel {
  background: rgba(4, 0, 12, 0.62);
  border: 1px solid rgba(0, 229, 255, 0.35);
  box-shadow: 0 0 18px rgba(255, 26, 198, 0.22), inset 0 0 12px rgba(0, 229, 255, 0.08);
  backdrop-filter: blur(14px);
  border-radius: 999px;
}
```

UI text should use cyan/magenta glow lightly.

Avoid huge panels that cover the visual experience.

---

## 18. Visual Config System

Create a config file so themes are easy to tune.

```ts
export type VisualTheme = {
  id: string
  name: string
  palette: {
    background: string
    fog: string
    primary: string
    secondary: string
    accent: string
    warm?: string
  }
  tunnel: {
    segmentCount: number
    spacing: number
    speed: number
    rotationSpeed: number
    pulseStrength: number
  }
  camera: {
    fov: number
    shake: number
    sway: number
    mouseInfluence: number
  }
  effects: {
    bloomStrength: number
    particleCount: number
    laserCount: number
    fogDensity: number
  }
}

export const brazilianPhonkTheme: VisualTheme = {
  id: "brazilian-phonk",
  name: "Brazilian Phonk Tunnel",
  palette: {
    background: "#030006",
    fog: "#10001d",
    primary: "#ff1ac6",
    secondary: "#39ff14",
    accent: "#00e5ff",
    warm: "#ffcc00"
  },
  tunnel: {
    segmentCount: 42,
    spacing: 5,
    speed: 18,
    rotationSpeed: 0.12,
    pulseStrength: 0.14
  },
  camera: {
    fov: 74,
    shake: 0.08,
    sway: 0.14,
    mouseInfluence: 0.55
  },
  effects: {
    bloomStrength: 1.35,
    particleCount: 720,
    laserCount: 14,
    fogDensity: 0.035
  }
}
```

All visual components should read from the selected theme.

---

## 19. Performance Rules

Follow these rules:

- Reuse geometries and materials.
- Use InstancedMesh for many repeated simple objects when possible.
- Do not create objects inside the animation loop.
- Do not create new GSAP timelines every frame.
- Cap particle count.
- Use lower bloom/particle count on mobile.
- Dispose geometries, materials, render targets, and event listeners on unmount.

---

## 20. First Upgrade Priority Order

Implement in this exact order:

1. Replace flat background with dark background + fog.
2. Add bloom/postprocessing.
3. Create endless tunnel segments with depth and recycling.
4. Add neon floor grid/runway.
5. Add camera movement and bass shake.
6. Add strong GSAP beat pulse.
7. Add speed particles.
8. Add laser beams.
9. Add equalizer bars.
10. Add speaker/crowd/dancer silhouettes.
11. Redesign UI as dark glass neon control dock.
12. Add section transitions every 32 beats.

Do not add new upload/AI features until the visual engine looks impressive.

---

## 21. Acceptance Criteria

The patch is successful only if:

- The app no longer has a flat green background.
- The scene feels dark, neon, and immersive.
- There is a visible floor or runway.
- There is obvious forward motion through a tunnel.
- Beat pulses are immediately visible.
- The camera reacts to music.
- Particles/speed lines make the scene feel fast.
- The app looks like a music concert/rhythm tunnel, not a geometry demo.
- The UI looks integrated with the world.
- The app remains smooth and does not crash.

---

## 22. Final Instruction to Coding Agent

Refactor the current visual scene using this patch. Do not rebuild unrelated app features. Do not add backend, authentication, database, or export features yet.

Focus only on making the current 3D visualizer look dramatically better.

The final result should feel aggressive, immersive, dark, neon, bass-heavy, and rhythm-synced.

The user should feel like they are inside the music.
