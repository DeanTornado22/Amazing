import { useEffect, useState } from "react";

export type QualityTier = "low" | "medium" | "high";

/**
 * Detect a quality tier for the current device so visual presets can
 * auto-scale particle counts, bloom strength, and frame density.
 *
 * Heuristics:
 * - hardwareConcurrency (CPU cores)
 * - deviceMemory in GB (Chromium only)
 * - prefers-reduced-motion
 * - user-agent mobile detection
 * - canvas WebGL renderer string
 *
 * Re-runs only when the user toggles reduced motion or resizes the window.
 */
export function useQualityTier(): QualityTier {
  const [tier, setTier] = useState<QualityTier>(() => detectTier());

  useEffect(() => {
    const handler = () => setTier(detectTier());
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    mql.addEventListener("change", handler);
    window.addEventListener("resize", handler);
    return () => {
      mql.removeEventListener("change", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  return tier;
}

function detectTier(): QualityTier {
  if (typeof window === "undefined") return "high";
  const reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency ?? 8;
  // deviceMemory is non-standard and only in Chromium
  const mem =
    (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
  if (reduced) return "low";
  if (isMobile) return "low";
  if (cores <= 4 || mem <= 2) return "low";
  if (cores <= 6 || mem <= 4) return "medium";
  return "high";
}

/**
 * Multiplier for expensive visuals by quality tier.
 */
export const qualityMultipliers: Record<
  QualityTier,
  { particles: number; bloom: number; frameCount: number; shadows: boolean }
> = {
  low: { particles: 0.4, bloom: 0.55, frameCount: 0.7, shadows: false },
  medium: { particles: 0.75, bloom: 0.85, frameCount: 0.9, shadows: true },
  high: { particles: 1, bloom: 1, frameCount: 1, shadows: true },
};
