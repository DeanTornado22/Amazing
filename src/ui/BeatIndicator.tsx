import { useEffect, useState } from 'react';
import { currentAudioData } from '../audio/AudioEngine';

type Props = {
  bpm: number;
  bpmLocked: boolean;
  tapProgress: number;
  onTap: () => void;
  onNudge: (deltaMs: number) => void;
};

export default function BeatIndicator({ bpm, bpmLocked, tapProgress, onTap, onNudge }: Props) {
  const [pulse, setPulse] = useState(0);
  const [phasePct, setPhasePct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const t = currentAudioData.currentTime;
      const origin = currentAudioData.beatOrigin;
      const bpmLive = currentAudioData.bpm > 0 ? currentAudioData.bpm : 120;
      const secondsPerBeat = 60 / bpmLive;
      const phase = t > 0 ? (((t - origin) / secondsPerBeat) % 1 + 1) % 1 : 0;
      setPhasePct(Math.round(phase * 100));
      setPulse((p) => {
        const target = phase < 0.06 || phase > 0.94 ? 1 : 0;
        return p + (target - p) * 0.4;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="beat-indicator">
      <div className="beat-indicator__head">
        <span className="beat-indicator__label">BEAT</span>
        <span className={`beat-indicator__lock ${bpmLocked ? 'is-locked' : ''}`}>
          {bpmLocked ? 'LOCKED' : tapProgress > 0 ? `TAP ${tapProgress}/4` : 'TAP TO SYNC'}
        </span>
      </div>
      <div className="beat-indicator__bar">
        <div
          className="beat-indicator__pulse"
          style={{ transform: `scale(${0.6 + pulse * 0.6})`, opacity: 0.4 + pulse * 0.6 }}
        />
        <div className="beat-indicator__phase" style={{ width: `${phasePct}%` }} />
      </div>
      <div className="beat-indicator__row">
        <button
          className="beat-indicator__btn beat-indicator__btn--tap"
          onClick={onTap}
          title="Tap 4 times in time to lock BPM and phase"
        >
          TAP
        </button>
        <button
          className="beat-indicator__btn"
          onClick={() => onNudge(-20)}
          title="Shift beat grid 20ms earlier"
        >
          ◀
        </button>
        <span className="beat-indicator__bpm">{bpm} BPM</span>
        <button
          className="beat-indicator__btn"
          onClick={() => onNudge(20)}
          title="Shift beat grid 20ms later"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
