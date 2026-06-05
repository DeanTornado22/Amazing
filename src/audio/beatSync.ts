import { currentAudioData } from './AudioEngine';

/**
 * Quantize a "frames per beat" value to a clean half-integer multiple.
 *
 * Why: the visual feels "in sync" only when an element crosses the camera
 * at an integer beat interval. 0.7 frames/beat drifts; 0.5 or 1.0 locks.
 * We snap to the nearest 0.25 so the user's slider still feels smooth while
 * the actual motion stays on the grid.
 */
export function quantizeFramesPerBeat(value: number): number {
  return Math.max(0.25, Math.round(value * 4) / 4);
}

/**
 * Beat-locked motion in world units per second.
 *
 * The whole scene reads from this so the visual is always snapped to the BPM:
 * a frame crosses the camera exactly on each beat boundary (or every N beats).
 *
 * @param bpm            currently locked BPM
 * @param framesPerBeat  how many elements pass the camera per beat
 *                       (0.5 = one element every 2 beats, 2 = two per beat)
 * @param spacing        world-space distance between elements
 */
export function bpmAnchoredSpeed(
  bpm: number,
  framesPerBeat: number,
  spacing: number,
): number {
  const safeBpm = bpm > 0 ? bpm : 120;
  const beatsPerSec = safeBpm / 60;
  const quantized = quantizeFramesPerBeat(framesPerBeat);
  return beatsPerSec * quantized * spacing;
}

export type BeatPhase = {
  phase: number;             // 0..1 progress through the current beat
  secondsToNextBeat: number; // seconds until the next beat boundary
  beatIndex: number;         // current beat index
  isOnBeat: boolean;         // true within ~30ms of a beat boundary
};

const ON_BEAT_WINDOW = 0.035; // 35ms

export function readBeatPhase(): BeatPhase {
  const bpm = currentAudioData.bpm > 0 ? currentAudioData.bpm : 120;
  const secondsPerBeat = 60 / bpm;
  const t = currentAudioData.currentTime - currentAudioData.beatOrigin;
  const phase = ((t / secondsPerBeat) % 1 + 1) % 1;
  const secondsToNextBeat = secondsPerBeat * (1 - phase);
  return {
    phase,
    secondsToNextBeat,
    beatIndex: currentAudioData.beatIndex,
    isOnBeat: phase < ON_BEAT_WINDOW || phase > 1 - ON_BEAT_WINDOW,
  };
}
