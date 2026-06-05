import type { AudioFeatures } from "../audio/smoothedAudioFeatures";
import { currentAudioData } from "../audio/AudioEngine";
import { getSmoothedAudioFeatures } from "../audio/smoothedAudioFeatures";
import type { VisualConfig } from "./VisualConfig";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Derives a per-frame reactive config from the current audio features.
 *
 * Bass is the dominant driver: the user wants the scene to PUNCH on
 * bass hits, so the bass multiplier is ~2x larger than it was before.
 * That means bigger tunnel scale, bigger bloom, harder camera shake,
 * brighter floor on every kick.  Energy contributes the slower-drift
 * changes (speed, particle density, fog falloff).
 */
export function deriveReactiveConfig(
  base: VisualConfig,
  audio: AudioFeatures,
): VisualConfig {
  const energy = audio.energy;
  const bass = audio.bass;
  const mids = audio.mids;
  const treble = audio.treble;

  // Bass-driven punch: roughly 2x stronger than before so kick drums
  // visibly hit the world instead of gently nudging it.
  const tunnelSpeed =
    base.tunnel.speed + energy * 1.2 * base.reactivity.energyToSpeed;
  const pulseStrength =
    base.tunnel.pulseStrength + bass * 0.32 * base.reactivity.bassToPulse;
  const twistAmount =
    base.tunnel.twistAmount + mids * 0.22 * base.reactivity.midsToTwist;
  const bloomStrength = clamp(
    base.postfx.bloomStrength + bass * 0.6 * base.reactivity.bassToBloom,
    0.25,
    0.9,
  );
  const fogDensity =
    base.postfx.fogDensity + (1 - energy) * 0.012 - bass * 0.005;

  return {
    ...base,
    tunnel: {
      ...base.tunnel,
      speed: tunnelSpeed,
      pulseScale: pulseStrength,
      pulseStrength,
      twist: twistAmount,
      twistAmount,
      sectionTurnStrength:
        base.tunnel.sectionTurnStrength +
        mids * 0.12 * base.reactivity.midsToTurns,
      segmentOpacity: clamp(
        base.tunnel.segmentOpacity + energy * 0.2 + bass * 0.1,
        0.25,
        0.75,
      ),
    },
    camera: {
      ...base.camera,
      // Bass kicks push shake and fov punch much harder.
      shake: base.camera.shake + bass * base.camera.bassShakeSensitivity * 2.4,
      fovPulse:
        base.camera.fovPulse + bass * 2.4 * base.reactivity.bassToCamera,
      speed: base.camera.cameraSpeed + energy * 0.75,
      cameraSpeed: base.camera.cameraSpeed + energy * 0.75,
    },
    floor: {
      ...base.floor,
      brightness: base.floor.brightness + bass * 0.55,
      gridSpeed: base.floor.gridSpeed + energy * 0.9,
      bassPulseStrength: base.floor.bassPulseStrength + bass * 0.45,
    },
    particles: {
      ...base.particles,
      speed:
        base.particles.speed + energy * 1.4 * base.reactivity.energyToSpeed,
      sparkle:
        base.particles.sparkleStrength +
        treble * 0.8 * base.reactivity.trebleToSparkle,
      sparkleStrength:
        base.particles.sparkleStrength +
        treble * 0.8 * base.reactivity.trebleToSparkle,
      opacity: clamp(
        base.particles.opacity +
          treble * 0.35 * base.reactivity.trebleToParticles +
          bass * 0.1,
        0.2,
        0.8,
      ),
    },
    lasers: {
      ...base.lasers,
      opacity: clamp(
        base.lasers.opacity + treble * 0.28 + bass * 0.08,
        0.12,
        0.6,
      ),
      rotationSpeed: base.lasers.rotationSpeed + treble * 0.25,
      trebleFlickerStrength: base.lasers.trebleFlickerStrength + treble * 0.45,
    },
    equalizer: {
      ...base.equalizer,
      heightMultiplier:
        base.equalizer.heightMultiplier + energy * 2 + bass * 0.6,
      opacity: clamp(
        base.equalizer.opacity + energy * 0.25 + bass * 0.1,
        0.2,
        0.7,
      ),
    },
    lighting: {
      ...base.lighting,
      bloom: bloomStrength,
      intensity: base.postfx.lightIntensity + energy * 0.75 + bass * 0.4,
      beatFlash: base.postfx.beatFlashStrength,
    },
    effects: {
      ...base.effects,
      fogDensity,
      glitch: base.postfx.glitchAmount,
    },
    postfx: {
      ...base.postfx,
      bloomStrength,
      lightIntensity: base.postfx.lightIntensity + energy * 0.75 + bass * 0.4,
      fogDensity,
    },
  };
}

export function getReactiveVisualState(base: VisualConfig, bpm = 128) {
  const audio = getSmoothedAudioFeatures(currentAudioData, bpm);
  const config = deriveReactiveConfig(base, audio);

  return { audio, config };
}
