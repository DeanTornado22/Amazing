import type { AudioFeatures } from '../audio/smoothedAudioFeatures';
import { currentAudioData } from '../audio/AudioEngine';
import { getSmoothedAudioFeatures } from '../audio/smoothedAudioFeatures';
import type { VisualConfig } from './VisualConfig';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function deriveReactiveConfig(base: VisualConfig, audio: AudioFeatures): VisualConfig {
  const energy = audio.energy;
  const bass = audio.bass;
  const mids = audio.mids;
  const treble = audio.treble;

  const tunnelSpeed = base.tunnel.speed + energy * 1.2 * base.reactivity.energyToSpeed;
  const pulseStrength = base.tunnel.pulseStrength + bass * 0.16 * base.reactivity.bassToPulse;
  const twistAmount = base.tunnel.twistAmount + mids * 0.22 * base.reactivity.midsToTwist;
  const bloomStrength = clamp(base.postfx.bloomStrength + bass * 0.35 * base.reactivity.bassToBloom, 0.3, 0.85);
  const fogDensity = base.postfx.fogDensity + (1 - energy) * 0.015;

  return {
    ...base,
    tunnel: {
      ...base.tunnel,
      speed: tunnelSpeed,
      pulseScale: pulseStrength,
      pulseStrength,
      twist: twistAmount,
      twistAmount,
      sectionTurnStrength: base.tunnel.sectionTurnStrength + mids * 0.12 * base.reactivity.midsToTurns,
      segmentOpacity: clamp(base.tunnel.segmentOpacity + energy * 0.2, 0.25, 0.7),
    },
    camera: {
      ...base.camera,
      shake: base.camera.shake + bass * base.camera.bassShakeSensitivity,
      fovPulse: base.camera.fovPulse + bass * 1.4 * base.reactivity.bassToCamera,
      speed: base.camera.cameraSpeed + energy * 0.75,
      cameraSpeed: base.camera.cameraSpeed + energy * 0.75,
    },
    floor: {
      ...base.floor,
      brightness: base.floor.brightness + bass * 0.35,
      gridSpeed: base.floor.gridSpeed + energy * 0.9,
      bassPulseStrength: base.floor.bassPulseStrength + bass * 0.28,
    },
    particles: {
      ...base.particles,
      speed: base.particles.speed + energy * 1.4 * base.reactivity.energyToSpeed,
      sparkle: base.particles.sparkleStrength + treble * 0.8 * base.reactivity.trebleToSparkle,
      sparkleStrength: base.particles.sparkleStrength + treble * 0.8 * base.reactivity.trebleToSparkle,
      opacity: clamp(base.particles.opacity + treble * 0.35 * base.reactivity.trebleToParticles, 0.2, 0.75),
    },
    lasers: {
      ...base.lasers,
      opacity: clamp(base.lasers.opacity + treble * 0.28, 0.12, 0.55),
      rotationSpeed: base.lasers.rotationSpeed + treble * 0.25,
      trebleFlickerStrength: base.lasers.trebleFlickerStrength + treble * 0.45,
    },
    equalizer: {
      ...base.equalizer,
      heightMultiplier: base.equalizer.heightMultiplier + energy * 2,
      opacity: clamp(base.equalizer.opacity + energy * 0.25, 0.2, 0.65),
    },
    lighting: {
      ...base.lighting,
      bloom: bloomStrength,
      intensity: base.postfx.lightIntensity + energy * 0.75,
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
      lightIntensity: base.postfx.lightIntensity + energy * 0.75,
      fogDensity,
    },
  };
}

export function getReactiveVisualState(base: VisualConfig, bpm = 128) {
  const audio = getSmoothedAudioFeatures(currentAudioData, bpm);
  const config = deriveReactiveConfig(base, audio);

  return { audio, config };
}
