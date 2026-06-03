import * as THREE from 'three';

export type TunnelTurnState = {
  x: number;
  y: number;
  roll: number;
};

export type TunnelMorphState = {
  wave: number;
  split: number;
  squeeze: number;
  stretch: number;
  spin: number;
  lift: number;
  breathe: number;
  colorShift: number;
};

export type TunnelPathState = {
  turn: TunnelTurnState;
  morph: TunnelMorphState;
  time: number;
  totalLength: number;
};

export const currentTunnelPath: TunnelPathState = {
  turn: { x: 0, y: 0, roll: 0 },
  morph: {
    wave: 0,
    split: 0,
    squeeze: 0,
    stretch: 0,
    spin: 0,
    lift: 0,
    breathe: 0.08,
    colorShift: 0,
  },
  time: 0,
  totalLength: 120,
};

export function updateTunnelPath(state: TunnelPathState) {
  currentTunnelPath.turn.x = state.turn.x;
  currentTunnelPath.turn.y = state.turn.y;
  currentTunnelPath.turn.roll = state.turn.roll;
  currentTunnelPath.morph.wave = state.morph.wave;
  currentTunnelPath.morph.split = state.morph.split;
  currentTunnelPath.morph.squeeze = state.morph.squeeze;
  currentTunnelPath.morph.stretch = state.morph.stretch;
  currentTunnelPath.morph.spin = state.morph.spin;
  currentTunnelPath.morph.lift = state.morph.lift;
  currentTunnelPath.morph.breathe = state.morph.breathe;
  currentTunnelPath.morph.colorShift = state.morph.colorShift;
  currentTunnelPath.time = state.time;
  currentTunnelPath.totalLength = state.totalLength;
}

export function getTunnelPathPoint(z: number, state = currentTunnelPath): THREE.Vector3 {
  const depth = THREE.MathUtils.clamp((-z + 8) / state.totalLength, 0, 1);
  const curve = Math.pow(depth, 1.35);
  const phase = state.time * 1.45 + depth * Math.PI * 2.2;
  const waveX = Math.sin(phase) * state.morph.wave * curve;
  const waveY = Math.cos(phase * 0.8) * state.morph.wave * 0.55 * curve;

  return new THREE.Vector3(
    state.turn.x * curve + waveX,
    state.turn.y * curve + waveY + state.morph.lift * curve,
    z
  );
}

export function getTunnelPathRoll(z: number, state = currentTunnelPath): number {
  const depth = THREE.MathUtils.clamp((-z + 8) / state.totalLength, 0, 1);
  const curve = Math.pow(depth, 1.35);
  return state.turn.roll * curve + state.morph.spin * curve;
}

export function getTunnelPathTangent(z: number, state = currentTunnelPath): THREE.Vector3 {
  const a = getTunnelPathPoint(z + 0.8, state);
  const b = getTunnelPathPoint(z - 0.8, state);
  return b.sub(a).normalize();
}
