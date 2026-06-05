import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { currentColorOffset } from '../audio/AudioEngine';
import { useVibeStore } from '../store/useVibeStore';
import type { VisualConfig } from '../visual/VisualConfig';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';
import { bpmAnchoredSpeed } from '../audio/beatSync';
import { getTunnelPathPoint } from './tunnelPath';

const LASER_COUNT = 14;

function laserColorForIndex(idx: number, palette: VisualConfig['palette']) {
  if (idx % 10 === 0) return palette.accent;
  if (idx % 4 === 0) return palette.primary;
  return palette.secondary;
}

export default function LaserBeams() {
  const { visualConfig } = useVibeStore();
  const groupRef = useRef<THREE.Group>(null);
  const beamRefs = useRef<THREE.Mesh[]>([]);

  const layout = useMemo(
    () =>
      Array.from({ length: LASER_COUNT }, (_, idx) => ({
        z: -8 - idx * 7.5,
        side: idx % 2 === 0 ? -1 : 1,
        x: (idx % 2 === 0 ? -1 : 1) * (4.2 + (idx % 4) * 0.45),
        y: -1.2 + (idx % 5) * 0.78,
        rotZ: (idx % 2 === 0 ? 1 : -1) * (0.58 + (idx % 3) * 0.16),
        rotY: (idx % 2 === 0 ? -1 : 1) * (0.45 + (idx % 4) * 0.08),
        length: 13 + (idx % 4) * 2.2,
      })),
    []
  );

  useFrame((_, delta) => {
    if (!visualConfig || !groupRef.current) return;

    const isPlaying = useVibeStore.getState().isPlaying;
    if (!isPlaying) return;

    const { audio, config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    const speed = bpmAnchoredSpeed(audio.bpm, config.lasers.speed, 1) + audio.energy * 4 * config.reactivity.energyToSpeed;

    beamRefs.current.forEach((beam, idx) => {
      beam.visible = idx < config.lasers.count;
      if (!beam.visible) return;

      const item = layout[idx];
      beam.position.z += speed * delta;

      if (beam.position.z > 10) {
        beam.position.z -= 110;
      }

      const center = getTunnelPathPoint(beam.position.z);
      beam.position.x = center.x + item.x + Math.sin(audio.time * 0.65 + idx) * 0.32;
      beam.position.y = center.y + item.y + Math.cos(audio.time * 0.48 + idx) * 0.18;
      beam.rotation.z += delta * (config.lasers.rotationSpeed + audio.mids * 0.18 * config.reactivity.midsToTwist) * item.side;
      beam.rotation.y = item.rotY + Math.sin(audio.time * 0.7 + idx) * 0.12;

      const material = beam.material as THREE.MeshBasicMaterial;
      material.color.set(laserColorForIndex(idx + currentColorOffset, config.palette));
      material.opacity = THREE.MathUtils.lerp(
        material.opacity,
        Math.min(
          0.55,
          config.lasers.opacity + audio.treble * config.lasers.trebleFlickerStrength + (audio.beat ? 0.04 : 0)
        ),
        0.18
      );
    });
  });

  if (!visualConfig) return null;

  return (
    <group ref={groupRef}>
      {layout.map((item, idx) => (
        <mesh
          key={idx}
          ref={(mesh) => {
            if (mesh) beamRefs.current[idx] = mesh;
          }}
          position={[item.x, item.y, item.z]}
          rotation={[Math.PI / 2, item.rotY, item.rotZ]}
        >
          <cylinderGeometry args={[visualConfig.lasers.thickness, visualConfig.lasers.thickness, visualConfig.lasers.beamLength, 8, 1, true]} />
          <meshBasicMaterial
            color={laserColorForIndex(idx, visualConfig.palette)}
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
