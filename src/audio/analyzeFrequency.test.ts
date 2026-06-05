import { describe, expect, it } from "vitest";
import { avgRange, extractMetrics } from "./analyzeFrequency";

describe("avgRange", () => {
  it("returns 0 for an all-zero buffer", () => {
    const data = new Uint8Array([0, 0, 0, 0]);
    expect(avgRange(data, 0, data.length)).toBe(0);
  });

  it("returns ~1 for a maxed buffer", () => {
    const data = new Uint8Array([255, 255, 255, 255]);
    expect(avgRange(data, 0, data.length)).toBeCloseTo(1, 5);
  });

  it("clamps to the data length", () => {
    const data = new Uint8Array([255, 128]);
    // Asking for indices beyond length should not throw and should return 0
    expect(avgRange(data, 100, 200)).toBe(0);
  });

  it("averages the requested slice", () => {
    const data = new Uint8Array([0, 128, 255, 0]);
    // Slice [0, 2) -> (0 + 128) / 2 / 255 = 0.2509...
    const v = avgRange(data, 0, 2);
    expect(v).toBeCloseTo(0.2509, 3);
  });
});

describe("extractMetrics", () => {
  it("smooths the previous metrics toward the new raw values", () => {
    const data = new Uint8Array(1024);
    for (let i = 0; i < data.length; i++) data[i] = 255;
    const previous = { bass: 0, mids: 0, treble: 0, energy: 0, brightness: 0 };
    const next = extractMetrics(data, previous, 0.5);
    // Bass and energy use the full smoothing factor (0.5), so they're
    // halfway to the raw value of 1.0. Mids and treble apply a small
    // multiplier to the smoothing factor, so they move a bit less.
    expect(next.bass).toBeCloseTo(0.5, 5);
    expect(next.energy).toBeCloseTo(0.5, 5);
    expect(next.mids).toBeGreaterThan(0.35);
    expect(next.mids).toBeLessThan(0.5);
    expect(next.treble).toBeGreaterThan(0.5);
    expect(next.treble).toBeLessThan(0.65);
  });

  it("is stable after many iterations of a steady signal", () => {
    const data = new Uint8Array(1024).fill(128);
    const previous = { bass: 0, mids: 0, treble: 0, energy: 0, brightness: 0 };
    let cur = previous;
    for (let i = 0; i < 200; i++) cur = extractMetrics(data, cur, 0.18);
    // raw = 128/255 ≈ 0.502; with 200 iterations of 0.18 smoothing it must
    // converge very close to the raw value.
    expect(cur.bass).toBeCloseTo(0.502, 2);
    expect(cur.mids).toBeCloseTo(0.502, 2);
  });
});
