import { useEffect, useRef } from 'react';
import { audioEngine } from '../audio/AudioEngine';

type Props = {
  isPlaying: boolean;
  isRecording: boolean;
};

/**
 * Compact HUD widget that shows:
 *   - a left-to-right scrolling waveform (time domain)
 *   - a 64-bar spectrum (frequency domain, log-scaled)
 *   - a phase-synchronized beat strip below
 *   - a "REC" indicator while MediaRecorder is capturing the canvas
 *
 * Renders into a single 2D canvas — much cheaper than R3F meshes for this
 * kind of read-only debug-style UI.  Pulls data from the audio engine's
 * AnalyserNode via `getFrequencyData()` and `getByteTimeDomainData()`.
 */
export default function WaveformPanel({ isPlaying, isRecording }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const phaseRef = useRef(0);
  const historyRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    // Pre-allocate working buffers so the per-frame hot path is allocation-free.
    const waveformLen = 1024;
    const spectrumLen = 64;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const W = w;
      const H = h;

      // Background fade for the waveform trail effect
      ctx2d.fillStyle = 'rgba(2, 4, 10, 0.32)';
      ctx2d.fillRect(0, 0, W, H);

      // Spectrogram-style baseline
      const halfH = H * 0.5;
      ctx2d.strokeStyle = 'rgba(0, 229, 255, 0.18)';
      ctx2d.lineWidth = 1;
      ctx2d.beginPath();
      ctx2d.moveTo(0, halfH);
      ctx2d.lineTo(W, halfH);
      ctx2d.stroke();

      const analyser = audioEngine.getAnalyser();
      if (analyser && isPlaying) {
        // 1. Waveform (time domain)
        const wave = new Uint8Array(waveformLen);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        analyser.getByteTimeDomainData(wave as any);

        // Pre-compute a downsampled history to keep the trail visible.
        if (!historyRef.current || historyRef.current.length !== W) {
          historyRef.current = new Float32Array(W);
        }
        const hist = historyRef.current;
        // Shift the history one column to the left
        hist.copyWithin(0, 1);
        // Fill the rightmost column with the latest sample
        hist[W - 1] = (wave[waveformLen - 1] - 128) / 128;

        ctx2d.lineWidth = 1.4;
        ctx2d.strokeStyle = 'rgba(0, 229, 255, 0.85)';
        ctx2d.beginPath();
        for (let x = 0; x < W; x++) {
          const y = halfH - hist[x] * (halfH * 0.78);
          if (x === 0) ctx2d.moveTo(x, y);
          else ctx2d.lineTo(x, y);
        }
        ctx2d.stroke();

        // 2. Spectrum (frequency domain) — 64 bars on the right edge
        const freq = new Uint8Array(analyser.frequencyBinCount);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        analyser.getByteFrequencyData(freq as any);
        const binCount = analyser.frequencyBinCount;
        // Log-spaced bins so bass is visible alongside highs.
        const minBin = 1;
        const maxBin = binCount;
        const barW = Math.max(2, Math.floor(W / spectrumLen) - 1);
        for (let i = 0; i < spectrumLen; i++) {
          const t0 = i / spectrumLen;
          const t1 = (i + 1) / spectrumLen;
          const a = minBin * Math.pow(maxBin / minBin, t0);
          const b = minBin * Math.pow(maxBin / minBin, t1);
          let sum = 0;
          let n = 0;
          for (let k = Math.floor(a); k < Math.floor(b); k++) {
            sum += freq[k];
            n++;
          }
          const v = n > 0 ? sum / n / 255 : 0;
          const barH = v * (H * 0.42);
          // Vertical bars rendered on the right edge with a slight gradient
          const grad = ctx2d.createLinearGradient(0, H, 0, H - barH);
          grad.addColorStop(0, 'rgba(0, 229, 255, 0.85)');
          grad.addColorStop(1, 'rgba(255, 0, 170, 0.7)');
          ctx2d.fillStyle = grad;
          ctx2d.fillRect(W - (spectrumLen - i) * (barW + 1), H - barH, barW, barH);
        }

        // 3. Phase cursor — a vertical cyan line that follows the beat phase
        //    so users can verify the metronome is locked.
        const t = (audioEngine as unknown as { audio: HTMLAudioElement }).audio?.currentTime ?? 0;
        const bpm = audioEngine.getBpm();
        const origin = audioEngine.getBeatOrigin();
        const secondsPerBeat = bpm > 0 ? 60 / bpm : 0.5;
        const phase = secondsPerBeat > 0 ? ((t - origin) / secondsPerBeat) % 1 : 0;
        phaseRef.current = phase;
        const px = phase * W;
        ctx2d.strokeStyle = phase < 0.06 || phase > 0.94 ? 'rgba(255, 80, 200, 0.95)' : 'rgba(255, 255, 255, 0.5)';
        ctx2d.lineWidth = 1.5;
        ctx2d.beginPath();
        ctx2d.moveTo(px, 0);
        ctx2d.lineTo(px, H);
        ctx2d.stroke();
      } else {
        // Idle state
        ctx2d.fillStyle = 'rgba(240, 248, 255, 0.4)';
        ctx2d.font = '10px "Orbitron", sans-serif';
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'middle';
        ctx2d.fillText(isPlaying ? 'AWAITING ANALYSER…' : 'PAUSED', W * 0.5, halfH);
      }

      // 4. Recording indicator (top-right corner)
      if (isRecording) {
        const t = performance.now() / 1000;
        const blink = (Math.sin(t * 4) + 1) * 0.5;
        ctx2d.fillStyle = `rgba(255, 50, 80, ${0.6 + blink * 0.4})`;
        ctx2d.beginPath();
        ctx2d.arc(W - 10, 10, 5, 0, Math.PI * 2);
        ctx2d.fill();
        ctx2d.fillStyle = 'rgba(255, 80, 100, 0.95)';
        ctx2d.font = 'bold 9px "Orbitron", sans-serif';
        ctx2d.textAlign = 'right';
        ctx2d.textBaseline = 'top';
        ctx2d.fillText('REC', W - 22, 7);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, isRecording]);

  return (
    <div className="waveform-panel">
      <div className="waveform-panel__head">
        <span>Spectrum + Waveform</span>
        <span className="waveform-panel__legend">
          <span className="legend-swatch legend-swatch--wave" /> Wave
          <span className="legend-swatch legend-swatch--beat" /> Beat phase
          <span className="legend-swatch legend-swatch--spec" /> Spectrum
        </span>
      </div>
      <canvas ref={canvasRef} className="waveform-panel__canvas" />
    </div>
  );
}
