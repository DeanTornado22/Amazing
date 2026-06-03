import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useVibeStore } from '../store/useVibeStore';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';

export default function BeatImpactFlash() {
  const { camera } = useThree();
  const { visualConfig } = useVibeStore();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const flash = useRef(0);

  useFrame((_, delta) => {
    if (!visualConfig || !meshRef.current || !materialRef.current) return;

    const isPlaying = useVibeStore.getState().isPlaying;
    if (!isPlaying) {
      materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, 0, 0.2);
      return;
    }

    const { audio, config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    if (audio.kick) {
      flash.current = Math.max(flash.current, config.postfx.screenFlashOpacity + audio.bass * 0.08);
      materialRef.current.color.set(config.palette.primary);
    } else if (audio.beat) {
      flash.current = Math.max(flash.current, config.postfx.screenFlashOpacity * 0.55 + audio.energy * 0.025);
      materialRef.current.color.set(config.palette.secondary);
    }

    flash.current = Math.max(0, flash.current - delta * 4.8);

    meshRef.current.position.copy(camera.position);
    meshRef.current.quaternion.copy(camera.quaternion);
    meshRef.current.translateZ(-1.1);
    materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, flash.current, 0.45);
  });

  if (!visualConfig) return null;

  return (
    <mesh ref={meshRef} renderOrder={1000}>
      <planeGeometry args={[3.9, 2.5]} />
      <meshBasicMaterial
        ref={materialRef}
        color={visualConfig.palette.primary}
        transparent
        opacity={0}
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
