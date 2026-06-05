import { describe, expect, it } from "vitest";
import {
  applyVisualPreset,
  createVisualConfig,
  MINIMAL_DARK_PRESET,
} from "./visualPresets";

describe("visualPresets", () => {
  it("createVisualConfig returns a full config with the right preset id", () => {
    const c = createVisualConfig("cyber-runner", "Test", "club");
    expect(c.preset).toBe("club");
    expect(c.themeId).toBe("cyber-runner");
    expect(c.themeName).toBe("Test");
  });

  it("applyVisualPreset overwrites the preset but preserves the themeId", () => {
    const c = createVisualConfig("dark-bass", "Keep me", "minimal");
    const next = applyVisualPreset(c, "intense");
    expect(next.preset).toBe("intense");
    expect(next.themeId).toBe("dark-bass");
  });

  it("intense preset has faster speed than minimal", () => {
    const minimal = createVisualConfig("dream-neon", "X", "minimal");
    const intense = createVisualConfig("dream-neon", "X", "intense");
    expect(intense.tunnel.speed).toBeGreaterThan(minimal.tunnel.speed);
  });

  it("intense preset has more particles than minimal", () => {
    const minimal = createVisualConfig("dream-neon", "X", "minimal");
    const intense = createVisualConfig("dream-neon", "X", "intense");
    expect(intense.particles.count).toBeGreaterThan(minimal.particles.count);
  });

  it("MINIMAL_DARK_PRESET defaults are sane", () => {
    expect(MINIMAL_DARK_PRESET.tunnel.speed).toBeGreaterThan(0);
    expect(MINIMAL_DARK_PRESET.postfx.bloomStrength).toBeGreaterThan(0);
    expect(MINIMAL_DARK_PRESET.postfx.bloomStrength).toBeLessThan(1);
  });
});
