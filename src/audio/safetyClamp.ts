import { beatSurpriseState } from './beatSurpriseState';

/**
 * Returns the strobe value attenuated by the global safety scale
 * (set by the photosensitive mode toggle in the HUD).
 */
export function getSafetyAdjustedStrobe(raw: number): number {
  const safety = beatSurpriseState.safetyScale;
  return Math.min(1, raw * safety);
}
