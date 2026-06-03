import { create } from 'zustand';
import type { MusicProfile } from '../audio/types';
import type { VisualConfig } from '../visual/VisualConfig';

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

  setFileName: (name: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setMusicProfile: (profile: MusicProfile | null) => void;
  setVisualConfig: (config: VisualConfig | null) => void;
  setManualBpm: (bpm: number) => void;
  setBpmOverrideActive: (active: boolean) => void;
  setIsDebug: (debug: boolean) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalysisStage: (stage: string | null) => void;
  reset: () => void;
}

export const useVibeStore = create<VibeState>((set) => ({
  fileName: null,
  isPlaying: false,
  musicProfile: null,
  visualConfig: null,
  manualBpm: 128,
  bpmOverrideActive: false,
  isDebug: false,
  isAnalyzing: false,
  analysisStage: null,

  setFileName: (fileName) => set({ fileName }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setMusicProfile: (musicProfile) => set({ musicProfile }),
  setVisualConfig: (visualConfig) => set({ visualConfig }),
  setManualBpm: (manualBpm) => set({ manualBpm }),
  setBpmOverrideActive: (bpmOverrideActive) => set({ bpmOverrideActive }),
  setIsDebug: (isDebug) => set({ isDebug }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisStage: (analysisStage) => set({ analysisStage }),
  reset: () =>
    set({
      fileName: null,
      isPlaying: false,
      musicProfile: null,
      visualConfig: null,
      isAnalyzing: false,
      analysisStage: null,
    }),
}));
