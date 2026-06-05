import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Tracks how long the user has been idle and reports whether the UI
 * should be visible.  By default, the UI shows for `visibleMs` after
 * any pointer move, key press, or touch, then fades out so the scene
 * gets the full screen.
 *
 * If `enabled` is false the UI is always visible — useful when the
 * parent wants to pin the chrome on screen (e.g. via a keyboard
 * shortcut toggle).
 */
export function useAutoHide({
  visibleMs = 2500,
  enabled = true,
}: { visibleMs?: number; enabled?: boolean } = {}): {
  visible: boolean;
  reset: () => void;
} {
  const [idle, setIdle] = useState(false);
  const timer = useRef<number | null>(null);
  const visibleMsRef = useRef(visibleMs);
  const enabledRef = useRef(enabled);

  // Cancel any pending hide timer.  Cheap and idempotent.
  const cancelTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cancelTimer();
    if (!enabledRef.current) return;
    setIdle(false);
    timer.current = window.setTimeout(
      () => setIdle(true),
      visibleMsRef.current,
    );
  }, [cancelTimer]);

  // Keep the latest values of enabled/visibleMs in refs so the
  // long-lived activity listeners can read them without being
  // re-bound on every render.  No setState — the consumer derives
  // `visible` from `enabled` + `idle` so we don't need a re-render
  // when these props change.
  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) cancelTimer();
  }, [enabled, cancelTimer]);
  useEffect(() => {
    visibleMsRef.current = visibleMs;
  }, [visibleMs]);

  useEffect(() => {
    if (!enabled) return;
    const onActivity = () => reset();
    window.addEventListener("pointermove", onActivity, { passive: true });
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity, { passive: true });
    window.addEventListener("wheel", onActivity, { passive: true });
    // Show the UI once at start so the user can see the controls,
    // then start the idle timer.
    reset();
    return () => {
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("wheel", onActivity);
      cancelTimer();
    };
  }, [enabled, reset, cancelTimer]);

  // visible is "on" whenever auto-hide is disabled, or when we are
  // still within the idle window.
  const visible = !enabled || !idle;
  return { visible, reset };
}
