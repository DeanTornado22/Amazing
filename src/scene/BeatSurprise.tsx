import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useVibeStore } from '../store/useVibeStore';
import { currentAudioData } from '../audio/AudioEngine';
import { beatSurpriseState } from '../audio/beatSurpriseState';
import { sectionTracker } from '../audio/sectionTracker';
import type { SectionId } from '../audio/sectionTracker';

type ScheduledEffect = {
  kind: 'strobe' | 'shockwave' | 'cameraRoll' | 'glitch' | 'punch' | 'invert';
  startTime: number;
  duration: number;
  amount: number;
};

/**
 * Per-section choreography weights.  These tune which effects feel right in
 * each part of the song so the visual mirrors the music's structure instead
 * of just being random.
 */
const SECTION_PROFILES: Record<
  SectionId,
  {
    intensity: number;       // 0..1.5 multiplier on all effect amounts
    strobeFreq: number;      // 0..1 chance of strobe (vs. always)
    glitchFreq: number;
    rollFreq: number;
    invertFreq: number;
    shockwaveFreq: number;
  }
> = {
  intro:     { intensity: 0.45, strobeFreq: 0.25, glitchFreq: 0.05, rollFreq: 0.05, invertFreq: 0.0,  shockwaveFreq: 0.01 },
  verse:     { intensity: 0.7,  strobeFreq: 0.55, glitchFreq: 0.15, rollFreq: 0.10, invertFreq: 0.02, shockwaveFreq: 0.04 },
  build:     { intensity: 1.0,  strobeFreq: 0.85, glitchFreq: 0.35, rollFreq: 0.25, invertFreq: 0.08, shockwaveFreq: 0.10 },
  chorus:    { intensity: 1.25, strobeFreq: 1.0,  glitchFreq: 0.45, rollFreq: 0.30, invertFreq: 0.12, shockwaveFreq: 0.10 },
  breakdown: { intensity: 0.5,  strobeFreq: 0.30, glitchFreq: 0.10, rollFreq: 0.08, invertFreq: 0.03, shockwaveFreq: 0.02 },
  drop:      { intensity: 1.5,  strobeFreq: 1.0,  glitchFreq: 0.60, rollFreq: 0.40, invertFreq: 0.15, shockwaveFreq: 0.20 },
  outro:     { intensity: 0.6,  strobeFreq: 0.40, glitchFreq: 0.20, rollFreq: 0.15, invertFreq: 0.05, shockwaveFreq: 0.05 },
};

const DROP_HANDLED_DEBOUNCE = 1.8; // seconds between drop handlings

/**
 * Beat-driven surprise system. Listens for beat boundaries and rolls a die
 * to trigger random visual events so the visual never feels like the same
 * loop. Effects are scheduled as timed envelopes and folded into the shared
 * beatSurpriseState each frame.
 *
 * Each beat is also colored by the detected section (intro/verse/build/
 * chorus/breakdown/drop/outro) so the visual arc matches the music.
 *
 * Safety: `beatSurpriseState.safetyScale` is applied as a global multiplier
 * to every effect amount, allowing the photosensitive toggle in the HUD
 * to attenuate strobes/shockwaves without disabling beat-locked motion.
 */
export default function BeatSurprise() {
  const { visualConfig } = useVibeStore();
  const lastBeatRef = useRef(-1);
  const lastDropHandled = useRef(-10);
  const queue = useRef<ScheduledEffect[]>([]);

  useFrame(() => {
    if (!visualConfig) return;
    const isPlaying = useVibeStore.getState().isPlaying;
    const s = beatSurpriseState;
    const time = currentAudioData.currentTime;
    const beatIndex = currentAudioData.beatIndex;
    const audio = {
      beat: currentAudioData.hasBeatThisFrame,
      kick: currentAudioData.hasKickThisFrame,
      bass: currentAudioData.bass,
      energy: currentAudioData.energy,
    };
    const section = sectionTracker.state.section;
    const profile = SECTION_PROFILES[section] || SECTION_PROFILES.verse;
    // Publish the current section scale to the shared state so other
    // components (chromatic aberration, FOV punch) can read it.
    s.sectionScale = profile.intensity;

    // Roll surprises on beat boundaries
    if (isPlaying && audio.beat && beatIndex !== lastBeatRef.current && beatIndex >= 0) {
      lastBeatRef.current = beatIndex;
      const isKick = audio.kick;
      const isDownbeat = beatIndex % 4 === 0;
      const isPhrase = beatIndex % 8 === 0;
      const isBigPhrase = beatIndex % 16 === 0 && beatIndex > 0;

      // Always: FOV punch — every beat is visibly felt
      queue.current.push({
        kind: 'punch',
        startTime: time,
        duration: 0.18,
        amount: profile.intensity * (isKick ? 1 : isDownbeat ? 0.7 : 0.45),
      });

      // Strobe: section-aware frequency
      if (Math.random() < profile.strobeFreq) {
        queue.current.push({
          kind: 'strobe',
          startTime: time,
          duration: isKick ? 0.13 : 0.08,
          amount: profile.intensity * (isKick ? 0.95 : 0.35),
        });
      }

      // Glitch burst
      if (Math.random() < profile.glitchFreq) {
        queue.current.push({
          kind: 'glitch',
          startTime: time,
          duration: 0.22 + Math.random() * 0.18,
          amount: profile.intensity * (0.6 + Math.random() * 0.4),
        });
      }

      // Camera roll
      if (Math.random() < profile.rollFreq) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        queue.current.push({
          kind: 'cameraRoll',
          startTime: time,
          duration: 0.4 + Math.random() * 0.3,
          amount: dir * profile.intensity * (0.4 + Math.random() * 0.6),
        });
      }

      // Color invert
      if (Math.random() < profile.invertFreq) {
        queue.current.push({
          kind: 'invert',
          startTime: time,
          duration: 0.2 + Math.random() * 0.2,
          amount: profile.intensity * (0.6 + Math.random() * 0.4),
        });
      }

      // 3D shockwave
      if (Math.random() < profile.shockwaveFreq) {
        queue.current.push({
          kind: 'shockwave',
          startTime: time,
          duration: 0.7,
          amount: profile.intensity * (0.7 + Math.random() * 0.3),
        });
      }

      // Phrase boundary (every 8 beats) gets a guaranteed surprise burst
      if (isPhrase) {
        queue.current.push({
          kind: 'shockwave',
          startTime: time,
          duration: 0.9,
          amount: profile.intensity,
        });
        queue.current.push({
          kind: 'cameraRoll',
          startTime: time,
          duration: 0.6,
          amount: (Math.random() < 0.5 ? -1 : 1) * profile.intensity,
        });
      }

      // Big-phrase (every 16 beats) = the chorus/drop "money shot"
      if (isBigPhrase) {
        queue.current.push({
          kind: 'shockwave',
          startTime: time,
          duration: 1.2,
          amount: profile.intensity * 1.4,
        });
        queue.current.push({
          kind: 'invert',
          startTime: time,
          duration: 0.4,
          amount: profile.intensity,
        });
        queue.current.push({
          kind: 'punch',
          startTime: time,
          duration: 0.32,
          amount: profile.intensity * 1.3,
        });
      }
    }

    // Drop: full money shot
    if (
      isPlaying &&
      currentAudioData.hasDropThisFrame &&
      time - lastDropHandled.current > DROP_HANDLED_DEBOUNCE
    ) {
      lastDropHandled.current = time;
      queue.current.push({ kind: 'punch', startTime: time, duration: 0.4, amount: 1.5 });
      queue.current.push({ kind: 'strobe', startTime: time, duration: 0.25, amount: 1.0 });
      queue.current.push({ kind: 'shockwave', startTime: time, duration: 1.2, amount: 1.5 });
      queue.current.push({ kind: 'invert', startTime: time, duration: 0.35, amount: 1.0 });
      queue.current.push({
        kind: 'glitch',
        startTime: time,
        duration: 0.5,
        amount: 1.0,
      });
      queue.current.push({
        kind: 'cameraRoll',
        startTime: time,
        duration: 0.7,
        amount: Math.random() < 0.5 ? -1.4 : 1.4,
      });
    }

    // Process the queue into the shared state, applying safetyScale.
    const safety = s.safetyScale;
    let fovPunch = 0;
    let strobe = 0;
    let cameraRoll = 0;
    let glitchBoost = 0;
    let invertAmount = 0;
    let shockwaveStart = -1;
    let shockwaveAmt = 0;

    queue.current = queue.current.filter((eff) => {
      const t = (time - eff.startTime) / eff.duration;
      if (t < 0 || t > 1) return false;
      // Sharp attack, exponential decay envelope
      const env = Math.exp(-t * 4.5);
      const a = eff.amount * safety;
      switch (eff.kind) {
        case 'punch':
          fovPunch = Math.max(fovPunch, env * a);
          break;
        case 'strobe':
          strobe = Math.max(strobe, env * a);
          break;
        case 'cameraRoll':
          cameraRoll += env * a;
          break;
        case 'glitch':
          glitchBoost = Math.max(glitchBoost, env * a);
          break;
        case 'invert':
          invertAmount = Math.max(invertAmount, env * a);
          break;
        case 'shockwave': {
          if (t < 0.05 && shockwaveStart < 0) {
            shockwaveStart = eff.startTime;
            shockwaveAmt = a;
          }
          break;
        }
      }
      return true;
    });

    // Compose the shared state. Camera roll uses instantaneous value so it
    // overshoots, then snaps back. Other values lerp for smoothness.
    s.fovPunch = fovPunch;
    s.strobe = Math.max(s.strobe * 0.6, strobe);
    s.glitchBoost = Math.max(s.glitchBoost * 0.7, glitchBoost);
    s.invertAmount = Math.max(s.invertAmount * 0.7, invertAmount);
    s.cameraRoll = cameraRoll; // raw envelope
    s.chromaOffset = Math.max(
      s.chromaOffset * 0.6,
      glitchBoost * 0.008 + (audio.kick ? 0.004 : 0)
    );

    // Spawn shockwave if a new one just started this frame
    if (shockwaveStart >= 0) {
      s.shockwaveProgress = 0;
      s.shockwaveStrength = shockwaveAmt;
    } else if (s.shockwaveProgress < 1) {
      // The Shockwave component is responsible for advancing progress; we
      // just need a sensible fallback so the value never stalls.
      s.shockwaveProgress = Math.min(1, s.shockwaveProgress + 0.016);
      if (s.shockwaveProgress >= 1) s.shockwaveStrength = 0;
    }
  });

  return null;
}
