export function avgRange(data: Uint8Array, start: number, end: number): number {
  let sum = 0;
  const startIdx = Math.max(0, start);
  const endIdx = Math.min(data.length, end);
  for (let i = startIdx; i < endIdx; i++) {
    sum += data[i];
  }
  return sum / Math.max(1, endIdx - startIdx) / 255;
}

export type LiveAudioMetrics = {
  bass: number;
  mids: number;
  treble: number;
  energy: number;
  brightness: number;
};

export function extractMetrics(
  data: Uint8Array,
  previous: LiveAudioMetrics,
  smoothing = 0.15
): LiveAudioMetrics {
  const len = data.length;
  const rawBass = avgRange(data, 1, Math.floor(len * 0.12));
  const rawMids = avgRange(data, Math.floor(len * 0.12), Math.floor(len * 0.45));
  const rawTreble = avgRange(data, Math.floor(len * 0.45), len);
  const rawEnergy = avgRange(data, 1, len);
  
  const rawBrightness = rawTreble / Math.max(0.001, rawBass + rawMids + rawTreble);
  
  return {
    bass: previous.bass + (rawBass - previous.bass) * smoothing,
    mids: previous.mids + (rawMids - previous.mids) * (smoothing * 0.8), // smooth mids slightly more
    treble: previous.treble + (rawTreble - previous.treble) * (smoothing * 1.2), // treble can react faster
    energy: previous.energy + (rawEnergy - previous.energy) * smoothing,
    brightness: previous.brightness + (rawBrightness - previous.brightness) * smoothing,
  };
}
