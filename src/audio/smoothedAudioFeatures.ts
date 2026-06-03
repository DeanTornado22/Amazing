import type { GlobalAudioData } from './AudioEngine';

export type VibeState = 'low' | 'medium' | 'high';

export type AudioFeatures = {
  bass: number;
  mids: number;
  treble: number;
  energy: number;
  beat: boolean;
  kick: boolean;
  beatStrength: number;
  bpm: number;
  time: number;
  beatIndex: number;
  vibeState: VibeState;
};

const smoothed = {
  bass: 0,
  mids: 0,
  treble: 0,
  energy: 0,
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function vibeStateForEnergy(energy: number): VibeState {
  if (energy > 0.72) return 'high';
  if (energy > 0.38) return 'medium';
  return 'low';
}

export function getSmoothedAudioFeatures(raw: GlobalAudioData, bpm = 128): AudioFeatures {
  smoothed.bass = lerp(smoothed.bass, raw.bass, 0.08);
  smoothed.mids = lerp(smoothed.mids, raw.mids, 0.06);
  smoothed.treble = lerp(smoothed.treble, raw.treble, 0.12);
  smoothed.energy = lerp(smoothed.energy, raw.energy, 0.05);

  const beatStrength = Math.min(1, Math.max(raw.bass, raw.energy));

  return {
    bass: smoothed.bass,
    mids: smoothed.mids,
    treble: smoothed.treble,
    energy: smoothed.energy,
    beat: raw.hasBeatThisFrame,
    kick: raw.hasKickThisFrame,
    beatStrength,
    bpm,
    time: raw.currentTime,
    beatIndex: raw.beatIndex,
    vibeState: vibeStateForEnergy(smoothed.energy),
  };
}
