import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { currentColorOffset } from '../audio/AudioEngine';
import { useVibeStore } from '../store/useVibeStore';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';
import { getTunnelPathPoint } from './tunnelPath';

const BAR_COUNT_PER_SIDE = 22;

function bandValue(index: number, bass: number, mids: number, treble: number, energy: number) {
  const t = index / (BAR_COUNT_PER_SIDE - 1);
  if (t < 0.3) return bass * (0.82 + t * 0.6);
  if (t < 0.72) return mids * (0.75 + Math.sin(t * Math.PI) * 0.35);
  return treble * (0.75 + energy * 0.25);
}

export default function EqualizerBars() {
  const { visualConfig } = useVibeStore();
  const barRefs = useRef<THREE.Mesh[]>([]);

  const layout = useMemo(
    () =>
      Array.from({ length: BAR_COUNT_PER_SIDE * 2 }, (_, idx) => {
        const local = idx % BAR_COUNT_PER_SIDE;
        const side = idx < BAR_COUNT_PER_SIDE ? -1 : 1;
        return {
          side,
          local,
          z: -7 - local * 4.35,
          x: side * 6.1,
        };
      }),
    []
  );

  useFrame((_, delta) => {
    if (!visualConfig) return;

    const isPlaying = useVibeStore.getState().isPlaying;
    if (!isPlaying) return;

    const { audio, config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    const speed = 3 + config.equalizer.movementSpeed * 10 + audio.energy * 5;

    barRefs.current.forEach((bar, idx) => {
      const item = layout[idx];
      bar.visible = item.local < config.equalizer.barCount;
      if (!bar.visible) return;

      bar.position.z += speed * delta;
      if (bar.position.z > 9) {
        bar.position.z -= 86;
      }

      const center = getTunnelPathPoint(bar.position.z);
      const value = bandValue(
        item.local,
        audio.bass * config.equalizer.bassWeight,
        audio.mids * config.equalizer.midsWeight,
        audio.treble * config.equalizer.trebleWeight,
        audio.energy
      );
      const height = 0.18 + value * config.equalizer.heightMultiplier;

      bar.position.x = center.x + item.side * config.equalizer.sideDistance;
      bar.position.y = center.y - 2.45 + height * 0.5;
      bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, height, 0.24);

      const material = bar.material as THREE.MeshBasicMaterial;
      const useGreenAccent = audio.energy > config.equalizer.greenAccentThreshold && item.local % 7 === 0;
      material.color.set(
        useGreenAccent
          ? visualConfig.palette.accent
          : (item.local + currentColorOffset) % 3 === 0
            ? visualConfig.palette.primary
            : visualConfig.palette.secondary
      );
      material.opacity = THREE.MathUtils.lerp(material.opacity, config.equalizer.opacity + value * 0.24, 0.2);
    });
  });

  if (!visualConfig) return null;

  return (
    <group>
      {layout.map((item, idx) => (
        <mesh
          key={idx}
          ref={(mesh) => {
            if (mesh) barRefs.current[idx] = mesh;
          }}
          position={[item.x, -2.2, item.z]}
          scale={[1, 0.5, 1]}
        >
          <boxGeometry args={[0.14, 1, 0.18]} />
          <meshBasicMaterial
            color={visualConfig.palette.secondary}
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
