import { extractMetrics } from "./analyzeFrequency";
import type { LiveAudioMetrics } from "./analyzeFrequency";
import { beatSurpriseState } from "./beatSurpriseState";
import { sectionTracker } from "./sectionTracker";

export const DEFAULT_BPM = 120;

export interface GlobalAudioData {
  bass: number;
  mids: number;
  treble: number;
  energy: number;
  brightness: number;
  currentTime: number;
  beatIndex: number;
  hasBeatThisFrame: boolean;
  hasKickThisFrame: boolean;
  bpm: number; // currently locked BPM (smoothed, live-updated)
  beatOrigin: number; // audio.currentTime of beat #0
  beatPhase: number; // 0..1, progress through current beat
  bpmConfidence: number; // 0..1
  hasDropThisFrame: boolean;
}

export const currentAudioData: GlobalAudioData = {
  bass: 0,
  mids: 0,
  treble: 0,
  energy: 0,
  brightness: 0,
  currentTime: 0,
  beatIndex: -1,
  hasBeatThisFrame: false,
  hasKickThisFrame: false,
  bpm: DEFAULT_BPM,
  beatOrigin: 0,
  beatPhase: 0,
  bpmConfidence: 0,
  hasDropThisFrame: false,
};

export let currentColorOffset = 0;

const PLL_LOCK_WINDOW = 0.06; // ±60ms: an onset this close to predicted beat locks to it
const PLL_RESYNC_THRESHOLD = 0.18; // if drift exceeds this, recenter
const KICK_DEBOUNCE = 0.18; // 180ms minimum gap between kick onsets
const BASS_ONSET_DELTA = 0.12; // how far above moving avg to count as an onset
const DROP_THRESHOLD = 1.55; // energy / long-window-avg ratio that counts as a "drop"
const DROP_COOLDOWN = 1.8; // seconds between drop events
const LONG_WINDOW_FRAMES = 240; // ~4s of 60fps frames for the long-window average
const FIRST_KICK_TIMEOUT = 4.0; // if no onset in N seconds after load, fall back to detected BPM
const BPM_DRIFT_SAMPLES = 6; // consecutive onset samples to trigger an adaptive BPM update
const BPM_DRIFT_THRESHOLD = 0.04; // 40ms average drift before considering a tempo change

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private audio: HTMLAudioElement;
  private source: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> = new Uint8Array(
    new ArrayBuffer(0),
  );
  private fileUrl: string | null = null;

  private bpm = DEFAULT_BPM;
  private detectedBpm = DEFAULT_BPM; // initial BPM from vibeEngine; used for fallback
  private lastBeatIndex = -1;
  private lastKickTime = -10;
  private lastOnsetTime = -10;
  private beatOrigin = 0;
  private firstKickLocked = false;
  private playbackStartTime = 0;
  private driftSamples: number[] = []; // recent on-beat drift samples for adaptive BPM
  private bassHistory: number[] = [];
  private bassHistoryIdx = 0;
  private bassHistoryFilled = 0;
  private energyHistory: number[] = [];
  private energyHistoryIdx = 0;
  private energyHistoryFilled = 0;
  private lastDropTime = -10;
  private onBeatCallback: ((index: number) => void) | null = null;

  private currentMetrics: LiveAudioMetrics = {
    bass: 0,
    mids: 0,
    treble: 0,
    energy: 0,
    brightness: 0,
  };

  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = "anonymous";
    this.audio.loop = true;
  }

  public setOnBeat(callback: (index: number) => void) {
    this.onBeatCallback = callback;
  }

  public setBpm(bpm: number) {
    if (!Number.isFinite(bpm) || bpm <= 0) return;
    this.bpm = bpm;
    this.detectedBpm = bpm;
    currentAudioData.bpm = bpm;
    // Re-anchor the beat grid to the current time so the new tempo lands cleanly.
    if (!this.firstKickLocked && this.audio && !this.audio.paused) {
      this.beatOrigin = this.audio.currentTime;
      this.lastBeatIndex = -1;
    }
  }

  /**
   * Stores the pre-detected BPM from `vibeEngine` so we can fall back to it
   * if no onset fires within FIRST_KICK_TIMEOUT seconds of playback starting
   * (e.g. ambient intros).  Doesn't override the live BPM unless called
   * explicitly with `setBpm`.
   */
  public setDetectedBpm(bpm: number) {
    if (Number.isFinite(bpm) && bpm > 0) this.detectedBpm = bpm;
  }

  /**
   * Re-anchor the beat metronome to an arbitrary audio time. The next beat
   * boundary will occur at `time + secondsPerBeat` from the new origin.
   */
  public setBeatOrigin(time: number, bpm?: number) {
    if (bpm && bpm > 0) this.bpm = bpm;
    this.beatOrigin = time;
    this.lastBeatIndex = -1;
    this.firstKickLocked = true;
  }

  /**
   * Apply a phase nudge in milliseconds. Positive shifts the beat grid later,
   * negative shifts it earlier. Used by the HUD nudge buttons.
   */
  public nudgeBeatOrigin(deltaMs: number) {
    this.beatOrigin += deltaMs / 1000;
  }

  /**
   * Tap-tempo entry point. Call with the audio currentTime at each tap.
   * After 2+ taps, the average interval sets the BPM and the most recent tap
   * is taken as the beat origin. After 4+ taps, locks in.
   */
  private tapTimes: number[] = [];
  public tap(t: number, now: number): { bpm: number; locked: boolean } | null {
    // Drop taps older than 3 seconds — user stopped tapping.
    this.tapTimes = this.tapTimes.filter((tt) => now - tt < 3);
    this.tapTimes.push(now);
    if (this.tapTimes.length < 2) return null;
    const intervals: number[] = [];
    for (let i = 1; i < this.tapTimes.length; i++) {
      intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = Math.round(60 / avgInterval);
    // Clamp to a sane range
    let clamped = bpm;
    while (clamped < 70) clamped *= 2;
    while (clamped > 180) clamped /= 2;
    this.setBpm(clamped);
    // Treat the most recent tap as the beat origin
    this.setBeatOrigin(t);
    return { bpm: clamped, locked: this.tapTimes.length >= 4 };
  }

  public loadFile(file: File): Promise<void> {
    return new Promise((resolve) => {
      if (this.fileUrl) {
        URL.revokeObjectURL(this.fileUrl);
      }
      this.fileUrl = URL.createObjectURL(file);
      this.audio.src = this.fileUrl;
      this.audio.load();

      this.currentMetrics = {
        bass: 0,
        mids: 0,
        treble: 0,
        energy: 0,
        brightness: 0,
      };
      this.lastBeatIndex = -1;
      this.lastKickTime = -10;
      this.lastOnsetTime = -10;
      this.firstKickLocked = false;
      this.beatOrigin = 0;
      this.playbackStartTime = 0;
      this.driftSamples = [];
      this.bassHistory = new Array(60).fill(0);
      this.bassHistoryIdx = 0;
      this.bassHistoryFilled = 0;
      this.energyHistory = new Array(LONG_WINDOW_FRAMES).fill(0);
      this.energyHistoryIdx = 0;
      this.energyHistoryFilled = 0;
      this.lastDropTime = -10;
      this.tapTimes = [];
      currentColorOffset = 0;
      // Reset section classifier alongside beat state
      sectionTracker.reset();

      this.audio.oncanplaythrough = () => {
        resolve();
      };
    });
  }

  private initCtx() {
    if (this.ctx) return;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new AudioCtx();

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.75;

    this.dataArray = new Uint8Array(
      new ArrayBuffer(this.analyser.frequencyBinCount),
    );

    this.source = this.ctx.createMediaElementSource(this.audio);
    this.source.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public async play(): Promise<void> {
    this.initCtx();
    if (this.ctx && this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    await this.audio.play();
    if (this.playbackStartTime === 0) {
      this.playbackStartTime = this.audio.currentTime;
    }
  }

  public pause(): void {
    this.audio.pause();
  }

  public toggle(): void {
    if (this.audio.paused) {
      this.play().catch(console.error);
    } else {
      this.pause();
    }
  }

  /** Set volume in [0, 1]. */
  public setVolume(v: number) {
    this.audio.volume = Math.max(0, Math.min(1, v));
  }

  public getVolume(): number {
    return this.audio.volume;
  }

  /** Seek to a time in seconds. Clamps to [0, duration]. */
  public seek(time: number) {
    const dur = this.audio.duration;
    if (!Number.isFinite(dur) || dur <= 0) return;
    this.audio.currentTime = Math.max(0, Math.min(dur, time));
  }

  public getCurrentTime(): number {
    return this.audio.currentTime;
  }

  public update(): void {
    if (this.audio.paused || !this.analyser) {
      currentAudioData.hasBeatThisFrame = false;
      currentAudioData.hasKickThisFrame = false;
      currentAudioData.hasDropThisFrame = false;
      currentAudioData.beatPhase = 0;
      currentAudioData.bpm = this.bpm;
      currentAudioData.beatOrigin = this.beatOrigin;
      beatSurpriseState.drop = false;
      return;
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    this.currentMetrics = extractMetrics(
      this.dataArray,
      this.currentMetrics,
      0.18,
    );

    const time = this.audio.currentTime;
    const secondsPerBeat = 60 / this.bpm;

    // Maintain a 60-frame (~1s) moving average of bass to detect onsets
    if (this.bassHistory.length === 0) {
      this.bassHistory = new Array(60).fill(0);
    }
    this.bassHistory[this.bassHistoryIdx] = this.currentMetrics.bass;
    this.bassHistoryIdx = (this.bassHistoryIdx + 1) % this.bassHistory.length;
    this.bassHistoryFilled = Math.min(
      this.bassHistory.length,
      this.bassHistoryFilled + 1,
    );
    let bassSum = 0;
    const count = this.bassHistoryFilled || this.bassHistory.length;
    for (let i = 0; i < count; i++) bassSum += this.bassHistory[i];
    const bassAvg = bassSum / count;
    const bassOnset = this.currentMetrics.bass - bassAvg;

    // Long-window energy average for drop detection (~4s)
    this.energyHistory[this.energyHistoryIdx] = this.currentMetrics.energy;
    this.energyHistoryIdx =
      (this.energyHistoryIdx + 1) % this.energyHistory.length;
    this.energyHistoryFilled = Math.min(
      this.energyHistory.length,
      this.energyHistoryFilled + 1,
    );
    let energySum = 0;
    const energyCount = this.energyHistoryFilled || this.energyHistory.length;
    for (let i = 0; i < energyCount; i++) energySum += this.energyHistory[i];
    const longEnergyAvg = energySum / energyCount;

    // Drop detection: sudden energy spike well above the long-window average
    let isDrop = false;
    if (
      longEnergyAvg > 0.15 &&
      this.currentMetrics.energy > longEnergyAvg * DROP_THRESHOLD &&
      time - this.lastDropTime > DROP_COOLDOWN
    ) {
      isDrop = true;
      this.lastDropTime = time;
      beatSurpriseState.lastDropTime = time;
    }

    // Onset detection: bass significantly above moving average, with debounce.
    // Strong onset (true kick) requires absolute bass to be loud too — this
    // prevents the metronome from locking to hi-hat transients.
    const isOnset =
      bassOnset > BASS_ONSET_DELTA &&
      this.currentMetrics.bass > 0.5 &&
      time - this.lastOnsetTime > KICK_DEBOUNCE;
    if (isOnset) this.lastOnsetTime = time;

    // First-kick lock: when we see the first strong onset after playback starts,
    // anchor beatOrigin to it. This is the single biggest fix for "misses the beat".
    if (!this.firstKickLocked && isOnset) {
      this.beatOrigin = time;
      this.firstKickLocked = true;
      this.lastBeatIndex = -1;
    }

    // First-kick timeout fallback: if we still haven't locked after N seconds
    // (quiet intros, ambient tracks, etc.), use the detected BPM by snapping
    // the grid to the nearest beat-aligned offset.
    if (
      !this.firstKickLocked &&
      this.detectedBpm > 0 &&
      this.playbackStartTime > 0 &&
      time - this.playbackStartTime > FIRST_KICK_TIMEOUT
    ) {
      const detSbp = 60 / this.detectedBpm;
      const detBeatPos = (time - this.playbackStartTime) / detSbp;
      const detNearest = Math.round(detBeatPos);
      this.beatOrigin = time - detNearest * detSbp;
      this.firstKickLocked = true;
      this.lastBeatIndex = -1;
    }

    // Phase-locked loop: if an onset lands close to a predicted beat boundary,
    // gently recenter the grid so it stays locked even when BPM detection is off.
    if (this.firstKickLocked) {
      const beatPos = (time - this.beatOrigin) / secondsPerBeat;
      const nearestBeat = Math.round(beatPos);
      const drift = (beatPos - nearestBeat) * secondsPerBeat;
      if (isOnset && Math.abs(drift) < PLL_LOCK_WINDOW) {
        // nudge origin by the drift amount
        this.beatOrigin += drift;
        // Record drift sample for adaptive BPM
        this.driftSamples.push(drift);
        if (this.driftSamples.length > BPM_DRIFT_SAMPLES)
          this.driftSamples.shift();
        // If drift is consistently in the same direction, the BPM is off
        if (this.driftSamples.length >= BPM_DRIFT_SAMPLES) {
          const mean =
            this.driftSamples.reduce((a, b) => a + b, 0) /
            this.driftSamples.length;
          if (Math.abs(mean) > BPM_DRIFT_THRESHOLD) {
            // Estimate a new BPM that would zero out the drift
            const correction = -mean * (this.bpm / 60);
            const nextBpm = Math.round(this.bpm + correction);
            if (
              nextBpm > 0 &&
              nextBpm !== this.bpm &&
              nextBpm >= 60 &&
              nextBpm <= 200
            ) {
              this.bpm = nextBpm;
              this.driftSamples = [];
            }
          }
        }
      } else if (Math.abs(drift) > PLL_RESYNC_THRESHOLD) {
        // Big drift — recenter on the onset
        if (isOnset) this.beatOrigin = time - nearestBeat * secondsPerBeat;
        this.driftSamples = [];
      }
    }

    // Compute beat index + phase from (possibly updated) beatOrigin
    const beatPos = (time - this.beatOrigin) / secondsPerBeat;
    const beatIndex = Math.floor(beatPos);
    const beatPhase = beatPos - beatIndex;
    const phase = beatPhase < 0 ? beatPhase + 1 : beatPhase;

    let isBeatFrame = false;
    if (beatIndex !== this.lastBeatIndex && beatIndex >= 0) {
      isBeatFrame = true;
      this.lastBeatIndex = beatIndex;
      if (this.onBeatCallback) {
        this.onBeatCallback(beatIndex);
      }
      if (beatIndex % 16 === 0 && beatIndex > 0) {
        currentColorOffset = (currentColorOffset + 1) % 3;
      }
    }

    // Kick transient: only count as "kick" if it coincides (or is near) a beat
    // boundary. Stray onsets in the middle of beats don't get the kick flash.
    let isKickFrame = false;
    const isOnBeat = phase < 0.2 || phase > 0.8;
    if (isOnset && isOnBeat && time - this.lastKickTime > 0.22) {
      isKickFrame = true;
      this.lastKickTime = time;
    }

    currentAudioData.bass = this.currentMetrics.bass;
    currentAudioData.mids = this.currentMetrics.mids;
    currentAudioData.treble = this.currentMetrics.treble;
    currentAudioData.energy = this.currentMetrics.energy;
    currentAudioData.brightness = this.currentMetrics.brightness;
    currentAudioData.currentTime = time;
    currentAudioData.beatIndex = beatIndex;
    currentAudioData.beatOrigin = this.beatOrigin;
    currentAudioData.beatPhase = phase;
    currentAudioData.bpm = this.bpm;
    currentAudioData.bpmConfidence = this.firstKickLocked ? 1 : 0.3;
    currentAudioData.hasBeatThisFrame = isBeatFrame;
    currentAudioData.hasKickThisFrame = isKickFrame;
    currentAudioData.hasDropThisFrame = isDrop;
    beatSurpriseState.drop = isDrop;

    // Run section classification AFTER metrics + beat index are settled.
    sectionTracker.update();
    sectionTracker.tick();
  }

  public getDuration(): number {
    return this.audio.duration || 0;
  }

  public isPaused(): boolean {
    return this.audio.paused;
  }

  /** Expose the AnalyserNode for external widgets (waveform / spectrum). */
  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getBpm(): number {
    return this.bpm;
  }

  public getBeatOrigin(): number {
    return this.beatOrigin;
  }

  public dispose(): void {
    this.audio.pause();
    if (this.fileUrl) {
      URL.revokeObjectURL(this.fileUrl);
      this.fileUrl = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(console.error);
      this.ctx = null;
    }
    this.analyser = null;
    this.source = null;
  }
}

export const audioEngine = new AudioEngine();
