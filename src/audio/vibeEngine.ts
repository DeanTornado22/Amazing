import type { MusicProfile, ThemeId } from './types';

/**
 * Decodes a File to AudioBuffer and analyzes it client-side.
 */
export async function analyzeAudioFile(
  file: File,
  onProgress?: (stage: string, progress: number) => void
): Promise<MusicProfile> {
  if (onProgress) onProgress('Reading audio file...', 15);
  const arrayBuffer = await file.arrayBuffer();

  if (onProgress) onProgress('Decoding audio channels...', 40);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const tempCtx = new AudioCtx();
  
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
  } catch (err) {
    tempCtx.close().catch(console.error);
    throw new Error('Could not decode audio data: ' + (err as Error).message, { cause: err });
  } finally {
    tempCtx.close().catch(console.error);
  }

  if (onProgress) onProgress('Analyzing rhythm and transients...', 65);
  
  // Extract channel data (mix to mono if stereo)
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // 1. Analyze BPM via peak detection
  const bpm = estimateBPM(channelData, sampleRate);

  if (onProgress) onProgress('Evaluating energy and frequencies...', 85);

  // 2. Evaluate frequency ranges & average energy
  // Since we don't have FFT on raw samples easily without writing a full DSP pipeline,
  // we can estimate frequency features using simple high-pass/low-pass filters or derivatives on downsampled audio,
  // or we can analyze root-mean-square (RMS) of chunks to estimate energy/dynamic range.
  const { energy, bass, treble, brightness, density, dynamicRange } = evaluateAudioBuffer(
    channelData,
    sampleRate
  );

  // 3. Classify Vibe Theme
  const theme = classifyTheme(bpm, energy, bass, brightness);

  // Define mood tags
  const moodsMap: Record<ThemeId, string[]> = {
    'brazilian-phonk': ['aggressive', 'dark', 'chaotic', 'street', 'distorted'],
    'dead-disco': ['groovy', 'spooky', 'stylish', 'dancefloor', 'neon'],
    'cyber-runner': ['futuristic', 'clean', 'laser', 'high-speed', 'synthwave'],
    'dark-bass': ['heavy', 'underground', 'ritual', 'smoky', 'sub-bass'],
    'dream-neon': ['floaty', 'emotional', 'smooth', 'dreamy', 'ambient'],
  };

  if (onProgress) onProgress('Spawning render engine...', 100);

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
 * Estimates BPM by finding energy peaks in the time-domain.
 */
function estimateBPM(data: Float32Array, sampleRate: number): number {
  // Downsample to roughly 100Hz for peak envelope detection
  const winSize = Math.floor(sampleRate / 100); 
  const envelope: number[] = [];
  
  for (let i = 0; i < data.length; i += winSize) {
    let max = 0;
    const end = Math.min(data.length, i + winSize);
    for (let j = i; j < end; j++) {
      const abs = Math.abs(data[j]);
      if (abs > max) max = abs;
    }
    envelope.push(max);
  }

  // Find threshold for peaks (e.g. 90th percentile)
  const sorted = [...envelope].sort((a, b) => a - b);
  const threshold = sorted[Math.floor(sorted.length * 0.85)] || 0.1;

  // Detect peak intervals (in terms of frames at 100Hz)
  const peakIndices: number[] = [];
  for (let i = 1; i < envelope.length - 1; i++) {
    if (envelope[i] > threshold && envelope[i] > envelope[i - 1] && envelope[i] > envelope[i + 1]) {
      peakIndices.push(i);
    }
  }

  if (peakIndices.length < 2) return 128; // Fallback

  // Calculate intervals (differences) between peaks
  const intervals: number[] = [];
  for (let i = 1; i < peakIndices.length; i++) {
    intervals.push(peakIndices[i] - peakIndices[i - 1]);
  }

  // Count interval frequencies (quantized to bins)
  const intervalCounts: Record<number, number> = {};
  intervals.forEach((val) => {
    // Quantize intervals slightly to group similar rhythms together
    const quantized = Math.round(val);
    intervalCounts[quantized] = (intervalCounts[quantized] || 0) + 1;
  });

  // Find the most common interval
  let maxCount = 0;
  let dominantInterval = 100; // 1 second interval at 100Hz
  for (const intervalStr in intervalCounts) {
    const val = parseInt(intervalStr);
    if (intervalCounts[val] > maxCount) {
      maxCount = intervalCounts[val];
      dominantInterval = val;
    }
  }

  // Convert interval back to BPM
  // 100 frames per second. 
  // Interval of frames = dominantInterval.
  // Time in seconds = dominantInterval / 100.
  // Beats per minute = 60 / (dominantInterval / 100) = 6000 / dominantInterval
  let bpm = Math.round(6000 / dominantInterval);

  // Normalize BPM to reasonable range (60..180)
  while (bpm < 65) bpm *= 2;
  while (bpm > 185) bpm /= 2;

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
  const bass = Math.min(1, Math.max(0.1, (bassSum / Math.max(1, sampleCount)) * 5));
  const treble = Math.min(1, Math.max(0.1, (trebleSum / Math.max(1, sampleCount)) * 7));
  const brightness = Math.min(1, Math.max(0.1, treble / Math.max(0.01, bass + treble)));
  
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
  const density = Math.min(1, Math.max(0.1, thresholdCrossings / (data.length / sampleRate) / 4));

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
function classifyTheme(bpm: number, energy: number, bass: number, brightness: number): ThemeId {
  // Brazilian Phonk: Fast, heavy bass, high energy
  if (bpm >= 125 && bass >= 0.55 && energy >= 0.6) {
    return 'brazilian-phonk';
  }
  
  // Cyber Runner: Bright, fast, high energy
  if (bpm >= 125 && brightness >= 0.5 && energy >= 0.55) {
    return 'cyber-runner';
  }
  
  // Dark Bass: High bass, low brightness, medium/high energy
  if (bass >= 0.5 && brightness < 0.45 && energy >= 0.45) {
    return 'dark-bass';
  }
  
  // Dead Disco: Balanced groove, medium energy
  if (bpm >= 102 && energy >= 0.4) {
    return 'dead-disco';
  }
  
  // Dream Neon: Softer, lower energy ambient tracks
  return 'dream-neon';
}
