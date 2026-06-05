import { describe, expect, it } from "vitest";
import { bpmAnchoredSpeed, quantizeFramesPerBeat } from "./beatSync";

describe("quantizeFramesPerBeat", () => {
  it("snaps to the nearest 0.25", () => {
    expect(quantizeFramesPerBeat(0.7)).toBe(0.75);
    expect(quantizeFramesPerBeat(0.5)).toBe(0.5);
    expect(quantizeFramesPerBeat(0.32)).toBe(0.25);
    expect(quantizeFramesPerBeat(1.1)).toBe(1);
  });

  it("never returns below 0.25", () => {
    expect(quantizeFramesPerBeat(0)).toBe(0.25);
    expect(quantizeFramesPerBeat(0.01)).toBe(0.25);
  });
});

describe("bpmAnchoredSpeed", () => {
  it("uses the safe BPM fallback when bpm <= 0", () => {
    const v = bpmAnchoredSpeed(0, 0.5, 4);
    // 120 BPM = 2 beats/sec * 0.5 quantized * 4 spacing = 4
    expect(v).toBeCloseTo(4, 5);
  });

  it("quantizes the frames-per-beat parameter", () => {
    // 0.7 snaps to 0.75
    const a = bpmAnchoredSpeed(120, 0.7, 4);
    // 0.5 stays 0.5
    const b = bpmAnchoredSpeed(120, 0.5, 4);
    expect(a).toBeGreaterThan(b);
  });

  it("scales linearly with bpm", () => {
    const a = bpmAnchoredSpeed(120, 0.5, 4);
    const b = bpmAnchoredSpeed(240, 0.5, 4);
    expect(b).toBeCloseTo(a * 2, 5);
  });
});
