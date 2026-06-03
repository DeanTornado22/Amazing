import { useEffect, useState } from 'react';
import { currentAudioData } from '../audio/AudioEngine';
import { getSmoothedAudioFeatures } from '../audio/smoothedAudioFeatures';
import type { AudioFeatures } from '../audio/smoothedAudioFeatures';

type MetricsPanelProps = {
  bpm: number;
  isPlaying: boolean;
};

const METRICS: Array<{ key: 'energy' | 'bass' | 'mids' | 'treble'; label: string }> = [
  { key: 'energy', label: 'ENERGY' },
  { key: 'bass', label: 'BASS' },
  { key: 'mids', label: 'MIDS' },
  { key: 'treble', label: 'TREBLE' },
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

export default function MetricsPanel({ bpm, isPlaying }: MetricsPanelProps) {
  const [metrics, setMetrics] = useState<AudioFeatures>(() => getSmoothedAudioFeatures(currentAudioData, bpm));

  useEffect(() => {
    let frameId = 0;
    let lastUpdate = 0;

    const update = (time: number) => {
      if (time - lastUpdate > 80) {
        lastUpdate = time;
        setMetrics({ ...getSmoothedAudioFeatures(currentAudioData, bpm) });
      }
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [bpm]);

  return (
    <div className="hud-metrics">
      <div className="hud-metrics__top">
        <span>BPM {Math.round(bpm)}</span>
        <span>{isPlaying ? 'PLAYING' : 'PAUSED'}</span>
      </div>
      {METRICS.map((metric) => (
        <MetricBar key={metric.key} label={metric.label} value={metrics[metric.key]} />
      ))}
      <div className={`hud-metrics__state hud-metrics__state--${metrics.vibeState}`}>
        STATE {metrics.vibeState.toUpperCase()}
      </div>
    </div>
  );
}
