import { useEffect, useState } from "react";
import { audioEngine } from "../audio/AudioEngine";

/**
 * Inline seek bar + volume slider that updates from the live audio element.
 * Mounts only inside the tunnel HUD.
 */
export default function SeekAndVolume() {
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(audioEngine.getVolume());

  useEffect(() => {
    const id = window.setInterval(() => {
      setCurrent(audioEngine.getCurrentTime());
      setDuration(audioEngine.getDuration());
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    audioEngine.seek(v);
    setCurrent(v);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    audioEngine.setVolume(v);
    setVolume(v);
  };

  const fmt = (t: number) => {
    if (!Number.isFinite(t) || t < 0) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="seek-volume">
      <span className="seek-volume__time">{fmt(current)}</span>
      <input
        className="seek-volume__seek"
        type="range"
        min={0}
        max={Math.max(0.001, duration)}
        step={0.01}
        value={current}
        onChange={handleSeek}
        aria-label="Seek"
      />
      <span className="seek-volume__time">{fmt(duration)}</span>
      <button
        className={`seek-volume__mute ${volume === 0 ? "is-muted" : ""}`}
        onClick={() => {
          if (volume > 0) {
            audioEngine.setVolume(0);
            setVolume(0);
          } else {
            audioEngine.setVolume(0.8);
            setVolume(0.8);
          }
        }}
        title={volume === 0 ? "Unmute" : "Mute"}
        aria-label={volume === 0 ? "Unmute" : "Mute"}
      >
        {volume === 0 ? "🔇" : volume < 0.4 ? "🔈" : "🔊"}
      </button>
      <input
        className="seek-volume__vol"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={handleVolume}
        aria-label="Volume"
      />
    </div>
  );
}
