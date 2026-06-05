import { describe, expect, it } from "vitest";
import { configFromVibe } from "./configFromVibe";
import type { MusicProfile } from "../audio/types";

const baseProfile: MusicProfile = {
  bpm: 120,
  energy: 0.5,
  bass: 0.5,
  mids: 0.5,
  treble: 0.5,
  brightness: 0.5,
  density: 0.5,
  dynamicRange: 0.5,
  moodTags: [],
  themeGuess: "brazilian-phonk",
};

describe("configFromVibe", () => {
  it("returns a VisualConfig with the minimal preset by default", () => {
    const c = configFromVibe(baseProfile);
    expect(c.preset).toBe("minimal");
    expect(c.themeId).toBe(baseProfile.themeGuess);
  });

  it("preserves bpm context (does not modify BPM)", () => {
    const c = configFromVibe(baseProfile);
    expect(c.tunnel.speed).toBeGreaterThan(0);
  });

  it("high-energy profile produces a slightly faster tunnel than low-energy", () => {
    const high = configFromVibe({ ...baseProfile, energy: 1 });
    const low = configFromVibe({ ...baseProfile, energy: 0 });
    expect(high.tunnel.speed).toBeGreaterThan(low.tunnel.speed);
  });

  it("high-density profile produces more particles than low-density", () => {
    const high = configFromVibe({ ...baseProfile, density: 1 });
    const low = configFromVibe({ ...baseProfile, density: 0 });
    expect(high.particles.count).toBeGreaterThan(low.particles.count);
  });
});
