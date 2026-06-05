import type { MusicProfile, ThemeId } from "./types";

/**
 * Decodes a File to AudioBuffer and analyzes it client-side.
 */
export async function analyzeAudioFile(
  file: File,
  onProgress?: (stage: string, progress: number) => void,
): Promise<MusicProfile> {
  if (onProgress) onProgress("Reading audio file...", 15);
  const arrayBuffer = await file.arrayBuffer();

  if (onProgress) onProgress("Decoding audio channels...", 40);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const tempCtx = new AudioCtx();

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
  } catch (err) {
    tempCtx.close().catch(console.error);
    throw new Error("Could not decode audio data: " + (err as Error).message, {
      cause: err,
    });
  } finally {
    tempCtx.close().catch(console.error);
  }

  if (onProgress) onProgress("Analyzing rhythm and transients...", 65);

  // Extract channel data.  For stereo files we average L+R to mono so the
  // envelope sees both halves of the mix — this usually yields a more
  // stable BPM than picking just one channel.
  const numChannels = audioBuffer.numberOfChannels;
  let channelData: Float32Array;
  if (numChannels >= 2) {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    const len = Math.min(left.length, right.length);
    channelData = new Float32Array(len);
    for (let i = 0; i < len; i++) channelData[i] = (left[i] + right[i]) * 0.5;
  } else {
    channelData = audioBuffer.getChannelData(0);
  }
  const sampleRate = audioBuffer.sampleRate;

  // 1. Analyze BPM via peak detection
  const bpm = estimateBPM(channelData, sampleRate);

  if (onProgress) onProgress("Evaluating energy and frequencies...", 85);

  // 2. Evaluate frequency ranges & average energy
  // Since we don't have FFT on raw samples easily without writing a full DSP pipeline,
  // we can estimate frequency features using simple high-pass/low-pass filters or derivatives on downsampled audio,
  // or we can analyze root-mean-square (RMS) of chunks to estimate energy/dynamic range.
  const { energy, bass, treble, brightness, density, dynamicRange } =
    evaluateAudioBuffer(channelData, sampleRate);

  // 3. Classify Vibe Theme
  const theme = classifyTheme(bpm, energy, bass, brightness);

  // Define mood tags
  const moodsMap: Record<ThemeId, string[]> = {
    "brazilian-phonk": ["aggressive", "dark", "chaotic", "street", "distorted"],
    "dead-disco": ["groovy", "spooky", "stylish", "dancefloor", "neon"],
    "cyber-runner": ["futuristic", "clean", "laser", "high-speed", "synthwave"],
    "dark-bass": ["heavy", "underground", "ritual", "smoky", "sub-bass"],
    "dream-neon": ["floaty", "emotional", "smooth", "dreamy", "ambient"],
  };

  if (onProgress) onProgress("Spawning render engine...", 100);

  return {
    bpm,
    energy,
    bass,
    mids: parseFloat((energy * 0.9).toFixed(2)),
    treble,
    brightness,
    density,
    dynamicRange,
    moodTags: moodsMap[theme],
    themeGuess: theme,
  };
}

/**
 * Estimates BPM via autocorrelation of the onset-strength envelope.
 *
 * Why autocorrelation: the previous peak-interval method biases toward the
 * loudest transient (often the snare, or a busy hi-hat), and confuses
 * on-beat vs off-beat hits. Autocorrelation finds the period that the
 * onset signal repeats at, which is a much closer match to "the beat."
 */
function estimateBPM(data: Float32Array, sampleRate: number): number {
  // 1. Energy envelope at ~200 Hz.
  const envRate = 200;
  const winSize = Math.max(1, Math.floor(sampleRate / envRate));
  const envLen = Math.floor(data.length / winSize);
  if (envLen < 32) return 128;
  const envelope = new Float32Array(envLen);
  for (let i = 0; i < envLen; i++) {
    let max = 0;
    const start = i * winSize;
    const end = Math.min(data.length, start + winSize);
    for (let j = start; j < end; j++) {
      const v = data[j] < 0 ? -data[j] : data[j];
      if (v > max) max = v;
    }
    envelope[i] = max;
  }

  // 2. Onset strength = positive first difference, half-wave rectified,
  //    normalized by local energy. The local normalization suppresses
  //    loud sections so quieter beats still register.
  const onset = new Float32Array(envLen - 1);
  const window = 20; // ~100ms smoothing window
  let localSum = 0;
  for (let i = 0; i < Math.min(window, envLen); i++) localSum += envelope[i];
  for (let i = 0; i < onset.length; i++) {
    if (i >= window) {
      localSum += envelope[i + window] - envelope[i];
    } else if (i + 1 < window) {
      localSum += envelope[i + 1];
    }
    const localAvg = localSum / window;
    const localNorm = localAvg > 0.001 ? localAvg : 0.001;
    const d = envelope[i + 1] - envelope[i];
    onset[i] = d > 0 ? d / localNorm : 0;
  }

  // 3. Autocorrelation over the 60..200 BPM range.
  const minLag = Math.floor((60 / 200) * envRate); // 60 frames at 200Hz
  const maxLag = Math.floor((60 / 60) * envRate); // 200 frames at 200Hz
  let bestLag = minLag;
  let bestScore = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0;
    const limit = onset.length - lag;
    for (let i = 0; i < limit; i++) {
      score += onset[i] * onset[i + lag];
    }
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }

  // 4. Refine via parabolic interpolation around the peak for sub-frame precision.
  if (bestLag > minLag && bestLag < maxLag) {
    let sPrev = 0;
    let sNext = 0;
    for (let i = 0; i < onset.length - (bestLag - 1); i++) {
      sPrev += onset[i] * onset[i + (bestLag - 1)];
    }
    for (let i = 0; i < onset.length - (bestLag + 1); i++) {
      sNext += onset[i] * onset[i + (bestLag + 1)];
    }
    const denom = sPrev - 2 * bestScore + sNext;
    if (denom !== 0) {
      const delta = (0.5 * (sPrev - sNext)) / denom;
      bestLag = bestLag + delta;
    }
  }

  let bpm = (60 * envRate) / bestLag;

  // Normalize into 70..180 range
  while (bpm < 70) bpm *= 2;
  while (bpm > 180) bpm /= 2;

  return Math.round(bpm);
}

/**
 * Analyzes characteristics from raw mono Float32Array channel data.
 */
function evaluateAudioBuffer(data: Float32Array, sampleRate: number) {
  // We can downsample slightly to keep calculations fast
  const step = Math.max(1, Math.floor(data.length / 50000));

  let rmsSum = 0;
  let bassSum = 0;
  let trebleSum = 0;
  let peakRms = 0;
  let sampleCount = 0;

  // We can rough-estimate frequencies:
  // - Bass: difference between adjacent samples is small (low frequency content dominates)
  // - Treble: difference between adjacent samples is large (high frequency transitions)
  for (let i = 1; i < data.length - 1; i += step) {
    const val = data[i];
    const prev = data[i - 1];
    const next = data[i + 1];

    const rms = val * val;
    rmsSum += rms;
    if (rms > peakRms) peakRms = rms;

    // Low frequency derivative (smooth changes)
    const isLowFreq = Math.abs(val - prev) < 0.05;
    if (isLowFreq) {
      bassSum += Math.abs(val);
    }

    // High frequency content (sharp changes)
    const isHighFreq = Math.abs(val - 2 * prev + next) > 0.15;
    if (isHighFreq) {
      trebleSum += Math.abs(val);
    }

    sampleCount++;
  }

  const avgRms = Math.sqrt(rmsSum / Math.max(1, sampleCount));
  const peakRmsVal = Math.sqrt(peakRms);

  // Normalize metrics between 0 and 1
  const energy = Math.min(1, Math.max(0.1, avgRms * 4));
  const bass = Math.min(
    1,
    Math.max(0.1, (bassSum / Math.max(1, sampleCount)) * 5),
  );
  const treble = Math.min(
    1,
    Math.max(0.1, (trebleSum / Math.max(1, sampleCount)) * 7),
  );
  const brightness = Math.min(
    1,
    Math.max(0.1, treble / Math.max(0.01, bass + treble)),
  );

  // Calculate dynamic range (difference between peak and average root-mean-square)
  const dynamicRange = Math.min(1, Math.max(0.1, (peakRmsVal - avgRms) * 2));

  // Estimate rhythm density (number of times signal crosses average envelope threshold)
  let thresholdCrossings = 0;
  const threshold = avgRms * 1.2;
  for (let i = 1; i < data.length; i += step * 5) {
    if (Math.abs(data[i]) > threshold && Math.abs(data[i - 1]) <= threshold) {
      thresholdCrossings++;
    }
  }
  const density = Math.min(
    1,
    Math.max(0.1, thresholdCrossings / (data.length / sampleRate) / 4),
  );

  return {
    energy: parseFloat(energy.toFixed(2)),
    bass: parseFloat(bass.toFixed(2)),
    treble: parseFloat(treble.toFixed(2)),
    brightness: parseFloat(brightness.toFixed(2)),
    density: parseFloat(density.toFixed(2)),
    dynamicRange: parseFloat(dynamicRange.toFixed(2)),
  };
}

/**
 * Classifies the ThemeId from computed properties.
 */
function classifyTheme(
  bpm: number,
  energy: number,
  bass: number,
  brightness: number,
): ThemeId {
  // Brazilian Phonk: Fast, heavy bass, high energy
  if (bpm >= 125 && bass >= 0.55 && energy >= 0.6) {
    return "brazilian-phonk";
  }

  // Cyber Runner: Bright, fast, high energy
  if (bpm >= 125 && brightness >= 0.5 && energy >= 0.55) {
    return "cyber-runner";
  }

  // Dark Bass: High bass, low brightness, medium/high energy
  if (bass >= 0.5 && brightness < 0.45 && energy >= 0.45) {
    return "dark-bass";
  }

  // Dead Disco: Balanced groove, medium energy
  if (bpm >= 102 && energy >= 0.4) {
    return "dead-disco";
  }

  // Dream Neon: Softer, lower energy ambient tracks
  return "dream-neon";
}
