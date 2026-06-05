import type { ThemeId } from "../audio/types";

export type ThemeDetail = {
  name: string;
  colors: string[];
  moods: string[];
};

/**
 * Static description of each detected theme — used by the result card and
 * by the per-preset theme name fallback.  Centralized here so the result
 * card and the per-preset naming stay in sync.
 */
export const THEME_DETAILS: Record<ThemeId, ThemeDetail> = {
  "brazilian-phonk": {
    name: "Brazilian Phonk Dark Concert",
    colors: ["#ff1ac6", "#00e5ff", "#39ff14"],
    moods: ["aggressive", "dark", "fast", "chaotic"],
  },
  "dead-disco": {
    name: "Dead Disco Club",
    colors: ["#c77dff", "#ffd166", "#00f5d4"],
    moods: ["groovy", "spooky", "stylish", "dancefloor"],
  },
  "cyber-runner": {
    name: "Cyber Runner",
    colors: ["#00e5ff", "#0066ff", "#ffffff"],
    moods: ["futuristic", "clean", "laser", "high-speed"],
  },
  "dark-bass": {
    name: "Dark Bass Ritual",
    colors: ["#ff0033", "#6d00ff", "#ff7a00"],
    moods: ["heavy", "underground", "ritual", "smoky"],
  },
  "dream-neon": {
    name: "Dream Neon Drift",
    colors: ["#80ffdb", "#b8c0ff", "#ffafcc"],
    moods: ["floaty", "emotional", "smooth", "dreamy"],
  },
};

export const SUPPORTED_FILE_EXTENSIONS = [
  "mp3",
  "wav",
  "m4a",
  "aac",
  "ogg",
  "flac",
  "oga",
  "opus",
] as const;

export function isAcceptedAudioFile(file: File): boolean {
  const acceptedMimes = new Set([
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
    "audio/ogg",
    "audio/flac",
    "audio/x-flac",
  ]);
  if (acceptedMimes.has(file.type)) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return false;
  return (SUPPORTED_FILE_EXTENSIONS as readonly string[]).includes(ext);
}
