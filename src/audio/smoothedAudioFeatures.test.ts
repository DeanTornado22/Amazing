import { describe, expect, it } from "vitest";
import { getSmoothedAudioFeatures } from "./smoothedAudioFeatures";
import type { GlobalAudioData } from "./AudioEngine";

function makeRaw(overrides: Partial<GlobalAudioData> = {}): GlobalAudioData {
  return {
    bass: 0.4,
    mids: 0.4,
    treble: 0.4,
    energy: 0.4,
    brightness: 0.4,
    currentTime: 0,
    beatIndex: 0,
    hasBeatThisFrame: false,
    hasKickThisFrame: false,
    bpm: 120,
    beatOrigin: 0,
    beatPhase: 0,
    bpmConfidence: 0,
    hasDropThisFrame: false,
    ...overrides,
  };
}

describe("getSmoothedAudioFeatures", () => {
  it("returns smoothed values close to the raw values", () => {
    // Many iterations should converge.
    const raw = makeRaw({ bass: 0.7 });
    for (let i = 0; i < 200; i++) {
      getSmoothedAudioFeatures(raw, 120);
    }
    const f = getSmoothedAudioFeatures(raw, 120);
    expect(f.bass).toBeCloseTo(0.7, 1);
  });

  it("maps high energy to the high vibe state", () => {
    const raw = makeRaw({ energy: 0.9 });
    for (let i = 0; i < 200; i++) {
      getSmoothedAudioFeatures(raw, 120);
    }
    const f = getSmoothedAudioFeatures(raw, 120);
    expect(f.vibeState).toBe("high");
  });

  it("maps low energy to the low vibe state", () => {
    const raw = makeRaw({ energy: 0.1 });
    for (let i = 0; i < 200; i++) {
      getSmoothedAudioFeatures(raw, 120);
    }
    const f = getSmoothedAudioFeatures(raw, 120);
    expect(f.vibeState).toBe("low");
  });

  it("preserves the raw beat index and bpm", () => {
    const f = getSmoothedAudioFeatures(
      makeRaw({ bpm: 128, beatIndex: 42, hasBeatThisFrame: true }),
      120,
    );
    expect(f.bpm).toBe(128);
    expect(f.beatIndex).toBe(42);
    expect(f.beat).toBe(true);
  });
});
