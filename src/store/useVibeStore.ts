import { create } from "zustand";
import type { MusicProfile } from "../audio/types";
import type { VisualConfig } from "../visual/VisualConfig";
import { DEFAULT_BPM } from "../audio/AudioEngine";

interface VibeState {
  fileName: string | null;
  isPlaying: boolean;
  musicProfile: MusicProfile | null;
  visualConfig: VisualConfig | null;
  manualBpm: number;
  bpmOverrideActive: boolean;
  isDebug: boolean;
  isAnalyzing: boolean;
  analysisStage: string | null;
  tapProgress: number; // 0..4 — how many taps the user has registered
  liveBpm: number; // latest locked BPM, updated continuously
  bpmLocked: boolean; // true once first-kick lock has fired
  /** Photosensitive mode: attenuates strobe/shockwave/glitch/invert */
  photosensitiveMode: boolean;
  /** True while MediaRecorder is capturing the canvas */
  isRecording: boolean;
  /** True for ~3s after the user clicks record, to confirm the indicator */
  recordingArmed: boolean;
  /** Auto-preset mode: automatically switch presets on section change */
  autoPreset: boolean;
  /** 0..1 audio volume (default 0.8) */
  volume: number;
  /** Show the FPS / BPM / lock overlay */
  showDebug: boolean;
  /** Show the keyboard shortcut modal */
  showShortcutHelp: boolean;

  setFileName: (name: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setMusicProfile: (profile: MusicProfile | null) => void;
  setVisualConfig: (config: VisualConfig | null) => void;
  setManualBpm: (bpm: number) => void;
  setBpmOverrideActive: (active: boolean) => void;
  setIsDebug: (debug: boolean) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalysisStage: (stage: string | null) => void;
  setTapProgress: (n: number) => void;
  setLiveBpm: (bpm: number) => void;
  setBpmLocked: (locked: boolean) => void;
  setPhotosensitiveMode: (on: boolean) => void;
  setIsRecording: (on: boolean) => void;
  setRecordingArmed: (on: boolean) => void;
  setAutoPreset: (on: boolean) => void;
  setVolume: (v: number) => void;
  setShowDebug: (on: boolean) => void;
  setShowShortcutHelp: (on: boolean) => void;
  reset: () => void;
}

export const useVibeStore = create<VibeState>((set) => ({
  fileName: null,
  isPlaying: false,
  musicProfile: null,
  visualConfig: null,
  manualBpm: DEFAULT_BPM,
  bpmOverrideActive: false,
  isDebug: false,
  isAnalyzing: false,
  analysisStage: null,
  tapProgress: 0,
  liveBpm: DEFAULT_BPM,
  bpmLocked: false,
  photosensitiveMode: false,
  isRecording: false,
  recordingArmed: false,
  autoPreset: false,
  volume: 0.8,
  showDebug: false,
  showShortcutHelp: false,

  setFileName: (fileName) => set({ fileName }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setMusicProfile: (musicProfile) => set({ musicProfile }),
  setVisualConfig: (visualConfig) => set({ visualConfig }),
  setManualBpm: (manualBpm) => set({ manualBpm }),
  setBpmOverrideActive: (bpmOverrideActive) => set({ bpmOverrideActive }),
  setIsDebug: (isDebug) => set({ isDebug }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisStage: (analysisStage) => set({ analysisStage }),
  setTapProgress: (tapProgress) => set({ tapProgress }),
  setLiveBpm: (liveBpm) => set({ liveBpm }),
  setBpmLocked: (bpmLocked) => set({ bpmLocked }),
  setPhotosensitiveMode: (photosensitiveMode) => set({ photosensitiveMode }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setRecordingArmed: (recordingArmed) => set({ recordingArmed }),
  setAutoPreset: (autoPreset) => set({ autoPreset }),
  setVolume: (volume) => set({ volume }),
  setShowDebug: (showDebug) => set({ showDebug }),
  setShowShortcutHelp: (showShortcutHelp) => set({ showShortcutHelp }),
  reset: () =>
    set({
      fileName: null,
      isPlaying: false,
      musicProfile: null,
      visualConfig: null,
      isAnalyzing: false,
      analysisStage: null,
      tapProgress: 0,
      bpmLocked: false,
      isRecording: false,
      recordingArmed: false,
    }),
}));
