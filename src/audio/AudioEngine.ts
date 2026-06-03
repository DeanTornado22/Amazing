import { extractMetrics } from './analyzeFrequency';
import type { LiveAudioMetrics } from './analyzeFrequency';

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
};

export let currentColorOffset = 0;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private audio: HTMLAudioElement;
  private source: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array = new Uint8Array(0);
  private fileUrl: string | null = null;
  
  private bpm = 120;
  private lastBeatIndex = -1;
  private lastKickTime = 0;
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
    this.audio.crossOrigin = 'anonymous';
    this.audio.loop = true;
  }

  public setOnBeat(callback: (index: number) => void) {
    this.onBeatCallback = callback;
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
  }

  public loadFile(file: File): Promise<void> {
    return new Promise((resolve) => {
      if (this.fileUrl) {
        URL.revokeObjectURL(this.fileUrl);
      }
      this.fileUrl = URL.createObjectURL(file);
      this.audio.src = this.fileUrl;
      this.audio.load();

      // Reset metrics and color rotation drops
      this.currentMetrics = { bass: 0, mids: 0, treble: 0, energy: 0, brightness: 0 };
      this.lastBeatIndex = -1;
      this.lastKickTime = 0;
      currentColorOffset = 0;
      
      this.audio.oncanplaythrough = () => {
        resolve();
      };
    });
  }

  private initCtx() {
    if (this.ctx) return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();
    
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.75;
    
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    this.source = this.ctx.createMediaElementSource(this.audio);
    this.source.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public async play(): Promise<void> {
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    await this.audio.play();
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

  public update(): void {
    if (this.audio.paused || !this.analyser) {
      currentAudioData.hasBeatThisFrame = false;
      currentAudioData.hasKickThisFrame = false;
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.analyser.getByteFrequencyData(this.dataArray as any);
    
    // Extract & smooth band metrics
    this.currentMetrics = extractMetrics(this.dataArray, this.currentMetrics, 0.18);
    
    const time = this.audio.currentTime;
    
    // Beat calculations based on constant BPM
    const secondsPerBeat = 60 / this.bpm;
    const beatIndex = Math.floor(time / secondsPerBeat);
    
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

    // Dynamic Kick Transient detection (if bass energy spikes suddenly)
    let isKickFrame = false;
    if (this.currentMetrics.bass > 0.65 && time - this.lastKickTime > 0.22) {
      isKickFrame = true;
      this.lastKickTime = time;
    }

    // Write directly to shared global mutable object
    currentAudioData.bass = this.currentMetrics.bass;
    currentAudioData.mids = this.currentMetrics.mids;
    currentAudioData.treble = this.currentMetrics.treble;
    currentAudioData.energy = this.currentMetrics.energy;
    currentAudioData.brightness = this.currentMetrics.brightness;
    currentAudioData.currentTime = time;
    currentAudioData.beatIndex = beatIndex;
    currentAudioData.hasBeatThisFrame = isBeatFrame;
    currentAudioData.hasKickThisFrame = isKickFrame;
  }

  public getDuration(): number {
    return this.audio.duration || 0;
  }

  public isPaused(): boolean {
    return this.audio.paused;
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

// Global Singleton
export const audioEngine = new AudioEngine();
