import { useEffect, useState } from "react";
import { currentAudioData } from "../audio/AudioEngine";
import { getSmoothedAudioFeatures } from "../audio/smoothedAudioFeatures";
import type { AudioFeatures } from "../audio/smoothedAudioFeatures";

type Props = {
  bpm: number;
  bpmLocked: boolean;
  tapProgress: number;
  isPlaying: boolean;
  onTap: () => void;
  onNudge: (deltaMs: number) => void;
  /** When true, render a tiny pill instead of the full panel. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

const METRICS: Array<{
  key: "energy" | "bass" | "mids" | "treble";
  label: string;
}> = [
  { key: "energy", label: "ENERGY" },
  { key: "bass", label: "BASS" },
  { key: "mids", label: "MIDS" },
  { key: "treble", label: "TREBLE" },
];

function MetricBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="metric-bar">
      <div className="metric-bar__head">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="metric-bar__track">
        <div className="metric-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * Compact "metrics + beat indicator + transport" HUD widget.
 * Renders as a small, unobtrusive card that can be collapsed to a pill
 * so the scene gets the full screen.
 */
export default function LiveHUD({
  bpm,
  bpmLocked,
  tapProgress,
  isPlaying,
  onTap,
  onNudge,
  collapsed = false,
  onToggleCollapsed,
}: Props) {
  const [metrics, setMetrics] = useState<AudioFeatures>(() =>
    getSmoothedAudioFeatures(currentAudioData, bpm),
  );
  const [pulse, setPulse] = useState(0);
  const [phasePct, setPhasePct] = useState(0);

  useEffect(() => {
    let frameId = 0;
    let lastUpdate = 0;

    const update = (time: number) => {
      if (time - lastUpdate > 80) {
        lastUpdate = time;
        setMetrics({ ...getSmoothedAudioFeatures(currentAudioData, bpm) });
        const t = currentAudioData.currentTime;
        const origin = currentAudioData.beatOrigin;
        const bpmLive = currentAudioData.bpm > 0 ? currentAudioData.bpm : 120;
        const secondsPerBeat = 60 / bpmLive;
        const phase =
          t > 0 ? ((((t - origin) / secondsPerBeat) % 1) + 1) % 1 : 0;
        setPhasePct(Math.round(phase * 100));
        setPulse((p) => {
          const target = phase < 0.06 || phase > 0.94 ? 1 : 0;
          return p + (target - p) * 0.4;
        });
      }
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [bpm]);

  if (collapsed) {
    return (
      <button
        className="hud-pill"
        onClick={onToggleCollapsed}
        title="Show metrics"
      >
        <span className="hud-pill__bpm">{Math.round(bpm)}</span>
        <span className="hud-pill__dot" />
        <span className="hud-pill__label">
          {isPlaying ? "PLAYING" : "PAUSED"}
        </span>
      </button>
    );
  }

  return (
    <div className="hud-metrics hud-metrics--compact">
      <div className="hud-metrics__top">
        <span>BPM {Math.round(bpm)}</span>
        <button
          className="hud-collapse-btn"
          onClick={onToggleCollapsed}
          title="Collapse to pill"
          aria-label="Collapse HUD"
        >
          −
        </button>
      </div>

      <div
        className="beat-indicator__bar"
        style={{ margin: "0.2rem 0 0.5rem" }}
      >
        <div
          className="beat-indicator__pulse"
          style={{
            transform: `scale(${0.6 + pulse * 0.6})`,
            opacity: 0.4 + pulse * 0.6,
          }}
        />
        <div
          className="beat-indicator__phase"
          style={{ width: `${phasePct}%` }}
        />
      </div>

      {METRICS.slice(0, 2).map((metric) => (
        <MetricBar
          key={metric.key}
          label={metric.label}
          value={metrics[metric.key]}
        />
      ))}

      <div
        className={`hud-metrics__state hud-metrics__state--${metrics.vibeState}`}
        style={{ marginBottom: "0.4rem" }}
      >
        STATE {metrics.vibeState.toUpperCase()}
      </div>

      <div className="beat-indicator__row">
        <button
          className="beat-indicator__btn beat-indicator__btn--tap"
          onClick={onTap}
          title="Tap 4 times in time to lock BPM"
        >
          TAP
        </button>
        <button
          className="beat-indicator__btn"
          onClick={() => onNudge(-20)}
          title="Nudge beat earlier"
        >
          ◀
        </button>
        <span
          className={`beat-indicator__lock ${bpmLocked ? "is-locked" : ""}`}
        >
          {bpmLocked
            ? "LOCKED"
            : tapProgress > 0
              ? `TAP ${tapProgress}/4`
              : "SYNC"}
        </span>
        <button
          className="beat-indicator__btn"
          onClick={() => onNudge(20)}
          title="Nudge beat later"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
