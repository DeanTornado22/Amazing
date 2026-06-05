import { useEffect, useState } from "react";

const STORAGE_KEY = "vibetunnel:visualConfig";

/**
 * Persist a serializable visual config to localStorage and rehydrate it
 * on next visit.  Writes are debounced via a 300ms timeout so rapid
 * slider drags don't hammer the storage API.
 */
export function usePersistedConfig<T extends object>(
  current: T | null,
): [T | null, (next: T) => void] {
  const [rehydrated, setRehydrated] = useState<T | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!current) return;
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      } catch {
        // quota or private mode — silently ignore
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [current]);

  return [rehydrated, setRehydrated];
}

export function clearPersistedConfig() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
