import { useFps } from "../hooks/useFps";
import { audioEngine, currentAudioData } from "../audio/AudioEngine";

type Props = { visible: boolean };

/**
 * Tiny corner widget that shows live performance numbers.
 * Useful for tuning the visual on a specific device.
 */
export default function DebugOverlay({ visible }: Props) {
  const fps = useFps(visible);

  if (!visible) return null;

  return (
    <div className="debug-overlay" aria-hidden>
      <div>FPS · {fps}</div>
      <div>BPM · {Math.round(currentAudioData.bpm)}</div>
      <div>BEAT · {currentAudioData.beatIndex}</div>
      <div>LOCK · {currentAudioData.bpmConfidence >= 1 ? "yes" : "no"}</div>
      <div>DUR · {audioEngine.getDuration().toFixed(1)}s</div>
    </div>
  );
}
