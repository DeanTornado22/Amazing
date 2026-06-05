/* eslint-disable react-hooks/immutability */
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useVibeStore } from '../store/useVibeStore';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';
import { beatSurpriseState } from '../audio/beatSurpriseState';
import { currentTunnelPath, getTunnelPathPoint, getTunnelPathRoll } from './tunnelPath';

const CAMERA_PATH_Z = 4.8;
const LOOK_AHEAD_Z = -28;
const FAR_LOOK_AHEAD_Z = -46;

export default function CameraRig() {
  const { camera, pointer } = useThree();
  const { visualConfig } = useVibeStore();
  const targetPos = useRef(new THREE.Vector3(0, 0, 6));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, -28));
  const targetQuat = useRef(new THREE.Quaternion());
  
  const customTime = useRef(0);

  useFrame((_, delta) => {
    if (!visualConfig) return;

    const isPlaying = useVibeStore.getState().isPlaying;
    if (!isPlaying) return; // Freeze camera updates if paused

    customTime.current += delta;

    const { audio, config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    const { reactivity } = config;

    const cameraPathPoint = getTunnelPathPoint(CAMERA_PATH_Z);
    const lookPathPoint = getTunnelPathPoint(LOOK_AHEAD_Z);
    const farPathPoint = getTunnelPathPoint(FAR_LOOK_AHEAD_Z);
    const pathRoll = getTunnelPathRoll(LOOK_AHEAD_Z);
    const morphIntensity =
      Math.abs(currentTunnelPath.morph.wave) +
      Math.abs(currentTunnelPath.morph.spin) +
      Math.abs(currentTunnelPath.morph.lift);

    // Keep the viewer exactly on the centerline so travel reads as moving through the tunnel.
    const sway = config.camera.drift;
    const bassShake = audio.bass > 0.62 ? audio.bass * config.camera.bassShakeSensitivity * reactivity.bassToCamera : 0;
    const shakeX = audio.kick ? (Math.random() - 0.5) * bassShake : 0;
    const shakeY = audio.kick ? (Math.random() - 0.5) * bassShake : 0;

    targetPos.current.x =
      cameraPathPoint.x +
      pointer.x * config.camera.mouseInfluence * sway +
      Math.sin(customTime.current * 0.72) * 0.08 * sway +
      shakeX;
    targetPos.current.y =
      cameraPathPoint.y +
      pointer.y * config.camera.mouseInfluence * 0.65 * sway +
      Math.sin(customTime.current * 1.08) * 0.045 * sway +
      shakeY;
    
    // Z kick back slightly on bass hit
    const targetZ = cameraPathPoint.z + audio.bass * (config.camera.fovPulse * 0.04) * reactivity.bassToCamera;
    targetPos.current.z = targetZ;

    // 3. Lerp positions for smooth transitions
    camera.position.lerp(targetPos.current, 0.11);
    
    // Perform camera shake on kick/beat
    if (audio.kick || audio.beat) {
      const shakeAmt = audio.kick 
        ? config.camera.shake * 0.035 * reactivity.bassToCamera
        : config.camera.shake * 0.018 * reactivity.bassToCamera;
        
      camera.position.z += (Math.random() - 0.5) * shakeAmt;
    }

    targetLookAt.current.set(
      lookPathPoint.x + (farPathPoint.x - lookPathPoint.x) * 0.22,
      lookPathPoint.y + (farPathPoint.y - lookPathPoint.y) * 0.22,
      lookPathPoint.z
    );
    const lookMatrix = new THREE.Matrix4().lookAt(camera.position, targetLookAt.current, camera.up);
    targetQuat.current.setFromRotationMatrix(lookMatrix);

    const bank = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      pathRoll - lookPathPoint.x * 0.035 - pointer.x * 0.025 * sway + Math.sin(customTime.current * 0.9) * 0.012 + beatSurpriseState.cameraRoll
    );
    targetQuat.current.multiply(bank);
    camera.quaternion.slerp(targetQuat.current, 0.1);

    // Dynamic FOV pulse + sharp transient beat zooms
    const fovBase = 78;
    const fovPulse = audio.bass * 1.4 * config.camera.fovPulse * reactivity.bassToCamera;

    // Beat-synced "breathing" — a soft sinusoidal FOV nudge on the beat phase
    // so every beat boundary produces a tiny in/out motion, even at low energy.
    const phaseFov = Math.sin(audio.beatPhase * Math.PI * 2) * 0.6 * config.camera.fovPulse;

    // Add additional sharp zoom contraction on beats
    let beatFov = 0;
    if (audio.kick) {
      beatFov = config.camera.beatZoomStrength * audio.beatStrength;
    } else if (audio.beat) {
      beatFov = config.camera.beatZoomStrength * 0.45 * audio.beatStrength;
    }

    // Beat-surprise FOV punch — sharp inward zoom on the beat boundary.
    // This is what makes every beat feel like the camera "hits" something.
    const punchFov = beatSurpriseState.fovPunch * 9;

    const targetFov =
      fovBase + fovPulse + phaseFov + beatFov + punchFov +
      morphIntensity * 2.2 * (0.5 + reactivity.midsToTurns * 0.5);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.28);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
