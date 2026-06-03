export type BeatTurnVector = {
  x: number;
  y: number;
  roll: number;
};

export type SceneMorph = {
  wave: number;
  split: number;
  squeeze: number;
  stretch: number;
  spin: number;
  lift: number;
  breathe: number;
  colorShift: number;
};

export type ScenePaletteShift = {
  background: string;
  fog: string;
};

const TURN_SEQUENCE: BeatTurnVector[] = [
  { x: -7.2, y: 1.6, roll: 0.34 },
  { x: 6.4, y: -1.0, roll: -0.32 },
  { x: 1.8, y: 5.4, roll: -0.24 },
  { x: -5.8, y: -4.2, roll: 0.42 },
  { x: 7.4, y: 2.6, roll: -0.48 },
  { x: -1.6, y: 5.8, roll: 0.3 },
  { x: 5.0, y: -5.0, roll: -0.38 },
];

const MORPH_SEQUENCE: SceneMorph[] = [
  { wave: 0.0, split: 0.0, squeeze: 0.0, stretch: 0.0, spin: 0.0, lift: 0.0, breathe: 0.08, colorShift: 0 },
  { wave: 1.4, split: 0.0, squeeze: 0.1, stretch: 0.12, spin: 0.18, lift: 0.3, breathe: 0.14, colorShift: 1 },
  { wave: 0.4, split: 1.6, squeeze: 0.36, stretch: 0.52, spin: -0.26, lift: -0.4, breathe: 0.2, colorShift: 2 },
  { wave: 1.0, split: 0.4, squeeze: -0.18, stretch: -0.08, spin: 0.42, lift: 0.8, breathe: 0.18, colorShift: 0 },
  { wave: 0.7, split: -1.1, squeeze: 0.46, stretch: 0.18, spin: -0.36, lift: -0.9, breathe: 0.22, colorShift: 1 },
];

const PALETTE_SEQUENCE: ScenePaletteShift[] = [
  { background: '#030006', fog: '#180026' },
  { background: '#001121', fog: '#003a50' },
  { background: '#16001e', fog: '#4a0038' },
  { background: '#021609', fog: '#0a4b24' },
  { background: '#170700', fog: '#5a1800' },
];

export function shouldTriggerBeatTurn(beatIndex: number): boolean {
  return beatIndex > 0 && beatIndex % 4 === 0;
}

export function shouldTriggerSceneMorph(beatIndex: number): boolean {
  return beatIndex > 0 && beatIndex % 8 === 0;
}

export function getBeatTurnVector(beatIndex: number, energy: number): BeatTurnVector {
  const phraseIndex = Math.floor(beatIndex / 4);
  const base = TURN_SEQUENCE[phraseIndex % TURN_SEQUENCE.length];
  const intensity = 0.82 + Math.min(1, Math.max(0, energy)) * 0.55;

  return {
    x: base.x * intensity,
    y: base.y * intensity,
    roll: base.roll * intensity,
  };
}

export function getSceneMorph(beatIndex: number, energy: number): SceneMorph {
  const phraseIndex = Math.floor(beatIndex / 8);
  const base = MORPH_SEQUENCE[phraseIndex % MORPH_SEQUENCE.length];
  const intensity = 0.8 + Math.min(1, Math.max(0, energy)) * 0.45;

  return {
    wave: base.wave * intensity,
    split: base.split * intensity,
    squeeze: base.squeeze * intensity,
    stretch: base.stretch * intensity,
    spin: base.spin * intensity,
    lift: base.lift * intensity,
    breathe: base.breathe * intensity,
    colorShift: base.colorShift,
  };
}

export function getScenePaletteShift(beatIndex: number): ScenePaletteShift {
  const phraseIndex = Math.floor(beatIndex / 8);
  return PALETTE_SEQUENCE[phraseIndex % PALETTE_SEQUENCE.length];
}
