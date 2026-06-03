/* eslint-disable */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVibeStore } from '../store/useVibeStore';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';

interface PooledRing {
  mesh: THREE.Mesh | null;
  material: THREE.MeshBasicMaterial | null;
  active: boolean;
  z: number;
  scale: number;
  maxScale: number;
  speed: number;
}

export default function BeatRings() {
  const { visualConfig } = useVibeStore();
  const ringCount = 8;
  const poolIndex = useRef(0);

  // Cache single geometry for the pool to share
  const geometry = useMemo(() => new THREE.RingGeometry(3.0, 3.2, 32), []);

  // Instantiate the object pool parameters
  const rings = useMemo<PooledRing[]>(() => {
    const list: PooledRing[] = [];
    for (let i = 0; i < ringCount; i++) {
      list.push({
        mesh: null,
        material: null,
        active: false,
        z: -50,
        scale: 0.1,
        maxScale: 6,
        speed: 15,
      });
    }
    return list;
  }, [ringCount]);

  // Hook elements into refs
  const meshesRef = useRef<(THREE.Mesh | null)[]>([]);
  const materialsRef = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useFrame((_, delta) => {
    if (!visualConfig) return;

    const isPlaying = useVibeStore.getState().isPlaying;
    if (!isPlaying) return; // Freeze ring pool if paused

    const { audio, config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    
    // 1. Detect transient kick/beat to spawn a ring from the pool
    if (audio.kick || (audio.beat && Math.random() < config.effects.ringFrequency)) {
      const ring = rings[poolIndex.current];
      
      // Activate and setup
      ring.active = true;
      ring.z = -45; // Spawn depth
      ring.scale = 0.2;
      ring.maxScale = audio.kick ? 6.4 : 4.8; // Kicks trigger larger shockwaves
      ring.speed = 8 + audio.energy * 7; // Speed matching energy
      
      const mesh = meshesRef.current[poolIndex.current];
      const mat = materialsRef.current[poolIndex.current];
      
      if (mesh && mat) {
        mesh.position.z = ring.z;
        mesh.scale.set(ring.scale, ring.scale, 1);
        mat.opacity = (audio.kick ? 0.32 : 0.18) * config.particles.beatBurstStrength;
        mat.color.set(audio.kick ? config.palette.primary : config.palette.secondary);
        mesh.visible = true;
      }

      // Rotate pool index pointer
      poolIndex.current = (poolIndex.current + 1) % ringCount;
    }

    // 2. Animate and update active rings in the pool
    rings.forEach((ring, idx) => {
      if (!ring.active) return;

      const mesh = meshesRef.current[idx];
      const mat = materialsRef.current[idx];

      if (mesh && mat) {
        // Translate Z forward
        ring.z += ring.speed * delta;
        mesh.position.z = ring.z;

        // Exponential scale expansion
        ring.scale += (ring.maxScale - ring.scale) * 4 * delta;
        mesh.scale.set(ring.scale, ring.scale, 1);

        // Linear fade opacity based on distance to camera (passes at Z = 6)
        const progress = (ring.z + 45) / 51; // 0 (far) to 1 (passed)
        mat.opacity = Math.max(0, (audio.kick ? 0.32 : 0.2) * config.particles.beatBurstStrength - progress * 0.38);

        // Deactivate if passed or fully faded
        if (ring.z > 6 || mat.opacity <= 0.01) {
          ring.active = false;
          mesh.visible = false;
        }
      }
    });
  });

  if (!visualConfig) return null;

  const { palette } = visualConfig;

  return (
    <group>
      {Array.from({ length: ringCount }).map((_, idx) => (
        <mesh
          key={idx}
          ref={(el) => { meshesRef.current[idx] = el; }}
          geometry={geometry}
          visible={false}
          position={[0, 0, -50]}
        >
          <meshBasicMaterial
            ref={(el) => { materialsRef.current[idx] = el; }}
            color={palette.primary}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
