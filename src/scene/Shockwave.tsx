import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { beatSurpriseState } from '../audio/beatSurpriseState';
import { useVibeStore } from '../store/useVibeStore';

/**
 * Giant 3D shockwave sphere that expands outward from the camera on every
 * "shockwave" surprise effect. Renders as an additive wireframe sphere with
 * radial bands, scaling from 0.1 to 12 units over ~700ms.
 */
export default function Shockwave() {
  const { visualConfig } = useVibeStore();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const lastTriggerProgress = useRef(-1);

  // Wireframe sphere geometry with radial bands
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 24, 16), []);

  useFrame((_, delta) => {
    if (!visualConfig) return;
    const mesh = meshRef.current;
    const mat = materialRef.current;
    if (!mesh || !mat) return;

    const progress = beatSurpriseState.shockwaveProgress;
    const strength = beatSurpriseState.shockwaveStrength;

    // Detect a new trigger (progress reset to 0)
    if (progress < lastTriggerProgress.current) {
      // new shockwave — make sure we start at scale 0
      mesh.scale.setScalar(0.1);
    }
    lastTriggerProgress.current = progress;

    if (strength <= 0) {
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, 0.2);
      return;
    }

    // Easing: ease-out cubic for the expansion
    const t = progress;
    const eased = 1 - Math.pow(1 - t, 3);
    const scale = 0.1 + eased * 14;
    mesh.scale.setScalar(scale);

    // Slow spin so the wireframe pattern moves
    mesh.rotation.y += delta * 0.6;
    mesh.rotation.x += delta * 0.3;

    // Opacity rises quickly then fades
    const opacityCurve = Math.sin(t * Math.PI) * strength;
    mat.opacity = opacityCurve * 0.9;
  });

  if (!visualConfig) return null;

  return (
    <mesh ref={meshRef} scale={[0.1, 0.1, 0.1]} renderOrder={1500}>
      <primitive object={geometry} attach="geometry" />
      <meshBasicMaterial
        ref={materialRef}
        color={visualConfig.palette.primary}
        wireframe
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}
