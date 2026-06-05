import { useFrame } from "@react-three/fiber";
import { getReactiveVisualState } from "./deriveReactiveConfig";
import type { AudioFeatures } from "../audio/smoothedAudioFeatures";
import { useVibeStore } from "../store/useVibeStore";
import type { VisualConfig } from "./VisualConfig";

/**
 * A React hook that re-uses the result of `getReactiveVisualState` across
 * a single frame, so all components see the same audio snapshot.  Call
 * this from exactly one mounted R3F component (we do it from
 * AudioEngineUpdater in VibeCanvas).
 */
type Latest = {
  audio: AudioFeatures | null;
  config: VisualConfig | null;
  frame: number;
};

const latest: Latest = { audio: null, config: null, frame: -1 };

export function primeReactiveFrame() {
  const { visualConfig, musicProfile } = useVibeStore.getState();
  if (!visualConfig) return;
  const bpm = musicProfile?.bpm ?? 128;
  const result = getReactiveVisualState(visualConfig, bpm);
  latest.audio = result.audio;
  latest.config = result.config;
  latest.frame = (latest.frame + 1) | 0;
}

export function getLatestReactive(): Latest {
  return latest;
}

/** R3F component that primes the per-frame reactive state once per frame. */
export function ReactiveFramePrimer() {
  useFrame(() => {
    primeReactiveFrame();
  });
  return null;
}
