import { useEffect, useRef, useState } from "react";

/**
 * Tracks frames-per-second via a sliding 1-second window.  Returns the
 * current FPS as an integer, updated ~5 times per second.
 */
export function useFps(active = true): number {
  const [fps, setFps] = useState(0);
  const lastUpdateRef = useRef(0);
  const framesRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const tick = (t: number) => {
      framesRef.current++;
      if (t - lastUpdateRef.current >= 200) {
        const dt = (t - lastUpdateRef.current) / 1000;
        const next = Math.round(framesRef.current / dt);
        setFps(next);
        framesRef.current = 0;
        lastUpdateRef.current = t;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      framesRef.current = 0;
      lastUpdateRef.current = 0;
    };
  }, [active]);

  return fps;
}
