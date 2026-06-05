import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { beatSurpriseState } from '../audio/beatSurpriseState';
import { getSafetyAdjustedStrobe } from '../audio/safetyClamp';

/**
 * Fullscreen white strobe flash. Mounted as a child of the camera so it
 * always faces the viewer and sits 1m in front of the near plane.
 * Reads beatSurpriseState.strobe (0..1) and renders an additive plane whose
 * opacity tracks the value. No depth test so it overlays everything.
 */
export default function StrobeFlash() {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const mat = materialRef.current;
    const mesh = meshRef.current;
    if (!mat || !mesh) return;

    // Track camera so the flash always covers the viewport
    mesh.position.copy(camera.position);
    mesh.quaternion.copy(camera.quaternion);
    mesh.translateZ(-0.5);

    // Scale to camera FOV at the flash distance so the rectangle covers
    // the visible frustum (no letterboxing regardless of aspect ratio).
    if (camera instanceof THREE.PerspectiveCamera) {
      const dist = 0.5;
      const vFov = (camera.fov * Math.PI) / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const h = 2 * dist * Math.tan(hFov / 2);
      const v = 2 * dist * Math.tan(vFov / 2);
      mesh.scale.set(h, v, 1);
    }

    const targetOpacity = getSafetyAdjustedStrobe(beatSurpriseState.strobe);
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.6);
  });

  return (
    <mesh ref={meshRef} renderOrder={2000}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#ffffff"
        transparent
        opacity={0}
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}
