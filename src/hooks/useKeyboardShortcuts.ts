import { useEffect } from "react";

export type ShortcutMap = Record<string, () => void>;

/**
 * Register global keyboard shortcuts.  Ignores key events fired while
 * typing into form fields so the upload inputs and BPM override stay usable.
 *
 * The map's keys are case-insensitive single characters or special names:
 *   "space", "escape", "arrowleft", "arrowright", "tab"
 */
export function useKeyboardShortcuts(map: ShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      const key = normalizeKey(e);
      const cb = map[key];
      if (cb) {
        e.preventDefault();
        cb();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [map]);
}

function normalizeKey(e: KeyboardEvent): string {
  if (e.key === " ") return "space";
  if (e.key === "Escape") return "escape";
  if (e.key === "Tab") return "tab";
  if (e.key === "ArrowLeft") return "arrowleft";
  if (e.key === "ArrowRight") return "arrowright";
  if (e.key === "ArrowUp") return "arrowup";
  if (e.key === "ArrowDown") return "arrowdown";
  if (e.key.length === 1) return e.key.toLowerCase();
  return e.key.toLowerCase();
}
