/**
 * Beat-driven surprise effects. Shared mutable state written by BeatSurprise
 * and read by CameraRig, PostFX, StrobeFlash, and Shockwave components.
 *
 * Each value is in 0..1 (or -1..1 where signed) and decays naturally via the
 * BeatSurprise update loop.
 */
export type SurpriseState = {
  /** Strength of the additive white strobe flash on the screen. */
  strobe: number;
  /** 3D shockwave progress (0 = just spawned, 1 = fully expanded). */
  shockwaveProgress: number;
  shockwaveStrength: number;
  /** Additive camera roll in radians, applied on top of base bank. */
  cameraRoll: number;
  /** Additive glitch strength. 0 = none, 1 = full. */
  glitchBoost: number;
  /** Additive chromatic aberration offset. */
  chromaOffset: number;
  /** Hard FOV punch on the beat boundary. Decays over ~200ms. */
  fovPunch: number;
  /** Scene color inversion. 0 = normal, 1 = fully inverted. */
  invertAmount: number;
  /** True for ~1 frame when a drop is detected. */
  drop: boolean;
  /** Time of last drop event (audio.currentTime), -1 if none. */
  lastDropTime: number;
  /**
   * 0..1 multiplier applied to all effect amounts.  Photosensitive mode
   * (set externally) drops this to ~0.3 to attenuate strobe/shockwave/
   * glitch/invert without disabling beat-locked motion.
   */
  safetyScale: number;
  /** Intensity multiplier driven by detected section (1 = neutral, <1 = verse, >1 = chorus/drop). */
  sectionScale: number;
};

export const beatSurpriseState: SurpriseState = {
  strobe: 0,
  shockwaveProgress: 1,
  shockwaveStrength: 0,
  cameraRoll: 0,
  glitchBoost: 0,
  chromaOffset: 0,
  fovPunch: 0,
  invertAmount: 0,
  drop: false,
  lastDropTime: -1,
  safetyScale: 1,
  sectionScale: 1,
};
