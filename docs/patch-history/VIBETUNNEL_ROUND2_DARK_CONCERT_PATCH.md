# VibeTunnel Round 2 Visual Redesign Patch

## Goal

The current app is technically improving, but visually it still looks like a bright green neon geometry demo. This patch should transform it into a dark, aggressive, immersive phonk/concert tunnel.

The target feeling:

> A user is flying forward through a dark underground Brazilian phonk concert tunnel. The world is mostly black and deep purple, with magenta tunnel frames, cyan laser cuts, acid-green bass accents, smoky atmosphere, speaker stacks, floor runway, equalizer bars, and obvious beat impact.

Do not add new product features yet. Focus only on visual direction, composition, lighting, depth, rhythm impact, and polish.

---

## Current Problems To Fix

1. The screen is dominated by green.
2. Bloom is too strong and turns the center into a white/cyan blob.
3. The tunnel feels like a flat spiral instead of a 3D space.
4. There is no strong floor, runway, or movement reference.
5. There are no clear concert objects: speakers, LED panels, crowd silhouettes, stage gate, equalizer bars.
6. Lasers are too thick and random, almost like green walls.
7. The scene lacks visual hierarchy.
8. Beat sync is not readable enough.
9. The UI is acceptable but still feels disconnected from the world.
10. The scene needs more darkness. Neon only looks good when surrounded by black.

---

## New Art Direction

Use this ratio:

- 75% darkness: black, deep purple, dark navy
- 15% neon: magenta and cyan
- 10% acid green: only for accents, bass hits, and selected lasers

Avoid large flat green areas.

Use this palette as the new default Brazilian phonk theme:

```ts
export const brazilianPhonkDarkConcert = {
  name: "Brazilian Phonk Dark Concert",
  background: "#020006",
  fog: "#080012",
  floor: "#050009",
  primary: "#ff1ac6",   // magenta
  secondary: "#00e5ff", // cyan
  accent: "#39ff14",    // acid green only for accents
  warm: "#ffcc00",
  danger: "#ff0033"
}
```

---

# Implementation Priority

Apply these changes in order. Keep the app runnable after every step.

---

## 1. Darken The Whole Scene

### Required Change

Replace the green background with a dark foggy concert background.

```ts
scene.background = new THREE.Color("#020006")
scene.fog = new THREE.FogExp2("#080012", 0.035)
```

If using React Three Fiber:

```tsx
<color attach="background" args={["#020006"]} />
<fogExp2 attach="fog" args={["#080012", 0.035]} />
```

### Rules

- Do not use green as background.
- Do not use large green planes.
- Green should only appear as accent flashes or small details.
- Keep the edges of the screen dark.
- The center can glow, but it must not become pure white.

---

## 2. Reduce Bloom And Overexposure

### Problem

The current bloom is too strong. The tunnel center becomes a glowing blob, so the geometry loses detail.

### Required Values

```ts
bloom.strength = 0.65
bloom.radius = 0.45
bloom.threshold = 0.25
```

If still too bright, use:

```ts
bloom.strength = 0.45
bloom.radius = 0.35
bloom.threshold = 0.32
```

### Material Rules

- Avoid emissive intensity above `2.0` for large objects.
- Small particles or thin lines may use `2.5–4.0`.
- Large planes must not glow strongly.
- Never let a large green object fill the viewport.

---

## 3. Rebuild Tunnel As A 3D Corridor, Not A Flat Spiral

### Required Change

Create an endless tunnel made of repeated segments along the Z axis.

Each segment should include:

- outer rectangular neon frame
- inner polygon/ring frame
- side wall hints
- floor connection lines
- slight rotation and scale variation

### Structure

```txt
visual/
  TunnelSegments.tsx
  TunnelFrame.tsx
  TunnelRecycling.ts
```

### Suggested Segment Data

```ts
type TunnelSegment = {
  z: number
  rotationZ: number
  scale: number
  pulseOffset: number
}
```

### Behavior

- Create 36–48 segments.
- Place them from `z = -8` to `z = -180`.
- Move segments toward the camera every frame.
- When a segment passes the camera, recycle it to the far end.
- Far segments should fade into fog.
- Nearest segments should be large enough to extend beyond screen edges.

### Example Logic

```ts
const speed = baseSpeed + audio.energy * 1.4
segment.position.z += delta * speed * 18

if (segment.position.z > 8) {
  segment.position.z = -180
  segment.rotation.z = randomBetween(-0.35, 0.35)
  segment.scale.setScalar(randomBetween(0.85, 1.2))
}
```

### Visual Rule

The user must feel like they are **inside** the tunnel, not staring at a centered mandala.

---

## 4. Add A Neon Floor Runway

### Required Change

Add a dark floor plane and animated neon grid lines under the camera.

Create:

```txt
visual/NeonFloor.tsx
```

### Floor Elements

- dark floor plane
- center lane line
- horizontal grid lines moving toward camera
- left/right edge lines
- occasional small sparks

### Color Rules

- Floor base: almost black
- Main grid: magenta/cyan
- Acid green only on kick flash

### Behavior

- Grid lines move toward camera and recycle.
- Bass increases brightness and line thickness.
- Beat triggers a fast magenta/cyan pulse.

### Example

```ts
line.material.opacity = 0.25 + audio.bass * 0.55
line.material.emissiveIntensity = 0.8 + audio.bass * 1.5
line.position.z += delta * speed
```

### Why This Matters

The floor creates scale, depth, and motion. Without it, the scene feels like floating geometry.

---

## 5. Replace Random Giant Lasers With Controlled Stage Lasers

### Required Change

Create a `LaserBeams.tsx` component.

Lasers should be thin, intentional, and stage-like.

### Laser Rules

- 70% cyan
- 20% magenta
- 10% acid green
- opacity: `0.18–0.55`
- thin beams only
- diagonal crossings from left/right
- pulse on beat
- never cover the whole screen

### Avoid

- giant green planes
- thick full-screen laser walls
- random lasers with no composition

### Suggested Implementation

Use thin cylinders or line geometries.

```ts
laser.material.opacity = baseOpacity + audio.treble * 0.25
laser.scale.x = 1 + audio.bass * 0.15
```

---

## 6. Add Concert Identity Objects

The scene needs objects that say “concert,” not just abstract geometry.

Create these components:

```txt
visual/SpeakerStacks.tsx
visual/EqualizerBars.tsx
visual/CrowdSilhouettes.tsx
visual/StageGate.tsx
visual/LEDPanels.tsx
```

### Speaker Stacks

Place on left and right sides near the floor.

Use simple geometry:

- black boxes
- neon circular speaker cones
- bass pulse scales the cones

```ts
speakerCone.scale.setScalar(1 + audio.bass * 0.25)
```

### Equalizer Bars

Place along side walls or bottom left/right.

- 12–24 bars per side
- scale with frequency bins
- use cyan/magenta mostly
- green only on high energy

```ts
bar.scale.y = 0.15 + frequencyValue * 3.2
bar.material.emissiveIntensity = 0.5 + frequencyValue * 2.0
```

### Crowd Silhouettes

Add dark silhouettes at the bottom edges.

Keep them subtle:

- black shapes
- tiny neon rim light
- hands/heads bob on beat

Do not make them detailed.

### Stage Gate

At far center, add a glowing rectangular/polygon gate.

- It gives the user something to fly toward.
- It can flash on chorus/drop.
- Use magenta/cyan outline.

### LED Panels

Add side panels that pulse with abstract patterns.

- Do not make them huge green rectangles.
- Use dark panels with small neon moving bars.

---

## 7. Improve Beat Impact

The music reaction must be obvious.

Create or refactor:

```txt
visual/BeatEffects.ts
```

On every beat/kick:

1. Tunnel frames expand quickly and return.
2. Camera FOV pulses.
3. Floor grid flashes.
4. Speaker cones scale up.
5. Particles burst from center.
6. A short cyan/magenta light flash occurs.

### GSAP Example

```ts
export function triggerBeatPulse({ camera, tunnelGroup, floorGroup, strength }) {
  gsap.fromTo(
    camera,
    { fov: 74 },
    {
      fov: 80 + strength * 4,
      duration: 0.055,
      yoyo: true,
      repeat: 1,
      ease: "power3.out",
      onUpdate: () => camera.updateProjectionMatrix()
    }
  )

  gsap.fromTo(
    tunnelGroup.scale,
    { x: 1, y: 1 },
    {
      x: 1 + strength * 0.08,
      y: 1 + strength * 0.08,
      duration: 0.08,
      yoyo: true,
      repeat: 1,
      ease: "power3.out"
    }
  )

  gsap.fromTo(
    floorGroup.scale,
    { x: 1 },
    {
      x: 1 + strength * 0.04,
      duration: 0.06,
      yoyo: true,
      repeat: 1,
      ease: "power2.out"
    }
  )
}
```

### Important

The beat should punch. Subtle is not enough.

---

## 8. Improve Camera Motion

Create:

```txt
visual/CameraRig.tsx
```

Camera behavior:

- slight forward rush illusion
- mouse/parallax look
- slow sway
- bass shake
- FOV pulse on beat

### Example

```ts
camera.position.x = mouse.x * 0.55 + Math.sin(time * 0.7) * 0.14
camera.position.y = 0.2 + mouse.y * 0.28 + Math.sin(time * 1.1) * 0.06
camera.rotation.z = mouse.x * -0.045 + Math.sin(time * 0.9) * 0.012
```

On bass:

```ts
const shake = audio.bass * audio.energy * 0.065
camera.position.x += (Math.random() - 0.5) * shake
camera.position.y += (Math.random() - 0.5) * shake
```

### Rule

Camera shake should be felt on strong bass, but not make the app nauseating.

---

## 9. Add Speed Particles And Spark Bursts

Create:

```txt
visual/SpeedParticles.tsx
visual/BeatBurst.tsx
```

### Speed Particles

- small glowing squares/dots/streaks
- move from far Z toward camera
- recycle behind the tunnel
- mostly cyan/magenta
- occasional green accent

### Beat Burst

On kick/beat:

- spawn a ring burst from the tunnel center
- particles fly outward for 0.3–0.6s
- fade out quickly

### Particle Count

- desktop: 700–1200
- mobile: 250–500

Use buffer geometry or instancing. Do not create/destroy hundreds of objects every frame.

---

## 10. Fix Visual Hierarchy

The current scene has everything at the same intensity. Fix the hierarchy.

### Target Layering

1. **Background:** dark fog, distant gate, faint panels
2. **Midground:** tunnel frames, floor runway, speakers, equalizer bars
3. **Foreground:** speed particles, occasional frame edges passing camera
4. **Beat impact:** quick flashes and pulse, then return to darkness

### Brightness Rules

- Center tunnel should be bright but not white.
- Side lasers should be visible but not dominate.
- Floor should guide the eye forward.
- Corners should stay dark.
- Green should not dominate.

---

## 11. Improve UI To Match The World

The UI can stay minimal, but make it feel connected to the concert theme.

### UI Style

- dark glass panel
- cyan/magenta neon border
- slight blur
- small animated equalizer icon
- compact stats top-right
- bottom control dock

### Required UI Elements

Top center:

```txt
Brazilian Phonk Dark Concert
```

Top right:

```txt
BPM 128
ENERGY 92%
BASS 88%
STATE PAUSED/PLAYING
```

Bottom center:

```txt
Play/Pause | Tune | Upload
```

### Rule

UI should not cover the tunnel center.

---

# Component Refactor Target

Refactor toward this structure:

```txt
src/
  config/
    themes.ts
  audio/
    useAudioAnalyzer.ts
    useBeatClock.ts
  visual/
    TunnelScene.tsx
    CameraRig.tsx
    TunnelSegments.tsx
    NeonFloor.tsx
    LaserBeams.tsx
    SpeedParticles.tsx
    BeatBurst.tsx
    SpeakerStacks.tsx
    EqualizerBars.tsx
    CrowdSilhouettes.tsx
    StageGate.tsx
    LEDPanels.tsx
    BeatEffects.ts
  ui/
    VisualizerHUD.tsx
    ControlDock.tsx
```

Do not over-refactor if the current project is small, but separate the major visual systems enough so the code does not become one giant file.

---

# Audio Reaction Mapping

Use this mapping:

```ts
audio.bass -> floor pulse, speaker cones, camera shake, tunnel scale
audio.mids -> tunnel rotation, wall panels, stage gate brightness
audio.treble -> particles, laser flicker, small sparks
audio.energy -> speed, bloom boost, density, global intensity
audio.beat -> GSAP punch effects
```

---

# Specific Things To Remove Or Reduce

Remove/reduce:

- large green background
- large green transparent planes
- overexposed white center
- giant uncontrolled lasers
- too many similar centered rings
- flat full-screen glow
- random shapes with no concert purpose

Replace with:

- dark background
- fog depth
- floor grid
- repeated tunnel corridor
- speaker stacks
- equalizer bars
- controlled lasers
- speed particles
- beat flashes
- stage gate

---

# Acceptance Criteria

The upgrade is successful only if these are true:

1. The app no longer looks mostly green.
2. The scene feels dark, neon, and concert-like.
3. There is a clear floor/runway.
4. The tunnel feels deep and 3D.
5. The user feels forward motion.
6. Beat pulses are obvious.
7. Bloom glows but does not destroy detail.
8. Green is only an accent color.
9. There are at least 3 concert elements: speakers, lasers, equalizer bars, crowd silhouettes, LED panels, or stage gate.
10. The UI matches the dark neon theme.

---

# Work Plan For The Agent

Do the work in this order:

## Step 1
Darken scene, fix palette, reduce bloom.

## Step 2
Rebuild tunnel segments along Z depth.

## Step 3
Add neon floor runway.

## Step 4
Replace uncontrolled lasers with controlled stage lasers.

## Step 5
Add speaker stacks and equalizer bars.

## Step 6
Add speed particles and beat burst.

## Step 7
Improve camera rig and beat impact.

## Step 8
Polish UI.

After each step, run the app and make sure it still works.

---

# Final Prompt Summary

Make VibeTunnel stop looking like a bright green geometry screensaver. Turn it into a dark, immersive, aggressive Brazilian phonk concert tunnel. Use darkness as the base, magenta/cyan as the main neon, and acid green only as accent. Add floor, depth, fog, controlled lasers, speakers, equalizer bars, speed particles, beat pulses, and camera movement. Focus on visual impact and rhythm immersion only.
