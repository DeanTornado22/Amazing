import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { currentColorOffset } from '../audio/AudioEngine';
import { useVibeStore } from '../store/useVibeStore';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';
import { bpmAnchoredSpeed } from '../audio/beatSync';
import { getTunnelPathPoint } from './tunnelPath';

const PANEL_COUNT = 8;
const STRIPS_PER_PANEL = 5;

export default function LEDPanels() {
  const { visualConfig } = useVibeStore();
  const panelRefs = useRef<THREE.Group[]>([]);
  const stripRefs = useRef<THREE.Mesh[]>([]);

  const layout = useMemo(
    () =>
      Array.from({ length: PANEL_COUNT }, (_, idx) => ({
        side: idx % 2 === 0 ? -1 : 1,
        z: -14 - idx * 8.5,
        y: 0.5 + (idx % 3) * 0.42,
      })),
    []
  );

  useFrame((_, delta) => {
    if (!visualConfig) return;

    const isPlaying = useVibeStore.getState().isPlaying;
    if (!isPlaying) return;

    const { audio, config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    const visiblePanels = config.preset === 'minimal' ? 2 : config.preset === 'club' ? 5 : PANEL_COUNT;
    const speed = bpmAnchoredSpeed(audio.bpm, config.tunnel.speed * 0.4, 1) + audio.energy * 2;

    panelRefs.current.forEach((panel, idx) => {
      panel.visible = idx < visiblePanels;
      if (!panel.visible) return;
      const item = layout[idx];
      panel.position.z += speed * delta;
      if (panel.position.z > 9) panel.position.z -= 78;

      const center = getTunnelPathPoint(panel.position.z);
      panel.position.x = center.x + item.side * 6.85;
      panel.position.y = center.y + item.y;
      panel.rotation.y = item.side * -0.42;
    });

    stripRefs.current.forEach((strip, idx) => {
      const panelIndex = Math.floor(idx / STRIPS_PER_PANEL);
      const local = idx % STRIPS_PER_PANEL;
      const band = local < 2 ? audio.bass : local < 4 ? audio.mids : audio.treble;
      strip.scale.x = THREE.MathUtils.lerp(strip.scale.x, 0.35 + band * 1.25, 0.22);

      const material = strip.material as THREE.MeshBasicMaterial;
      strip.visible = panelIndex < visiblePanels;
      if (!strip.visible) return;
      const useGreen = audio.kick && local === 0 && panelIndex % 2 === 0 && config.equalizer.greenAccentThreshold < 0.75;
      material.color.set(
        useGreen
          ? config.palette.accent
          : (local + currentColorOffset) % 2 === 0
            ? config.palette.secondary
            : config.palette.primary
      );
      material.opacity = THREE.MathUtils.lerp(material.opacity, (0.05 + band * 0.18) * (config.preset === 'minimal' ? 0.45 : 0.9), 0.18);
    });
  });

  if (!visualConfig) return null;

  return (
    <group>
      {layout.map((item, panelIdx) => (
        <group
          key={panelIdx}
          ref={(group) => {
            if (group) panelRefs.current[panelIdx] = group;
          }}
          position={[item.side * 6.85, item.y, item.z]}
          rotation={[0, item.side * -0.42, 0]}
        >
          <mesh>
            <boxGeometry args={[1.7, 2.15, 0.08]} />
            <meshBasicMaterial
              color={visualConfig.palette.darkPanel ?? visualConfig.palette.background}
              transparent
              opacity={0.64}
              depthWrite={false}
            />
          </mesh>
          {Array.from({ length: STRIPS_PER_PANEL }).map((_, stripIdx) => {
            const refIndex = panelIdx * STRIPS_PER_PANEL + stripIdx;
            return (
              <mesh
                key={stripIdx}
                ref={(mesh) => {
                  if (mesh) stripRefs.current[refIndex] = mesh;
                }}
                position={[0, -0.72 + stripIdx * 0.36, 0.065]}
              >
                <boxGeometry args={[1.15, 0.055, 0.04]} />
                <meshBasicMaterial
                  color={stripIdx % 2 === 0 ? visualConfig.palette.secondary : visualConfig.palette.primary}
                  transparent
                  opacity={0.28}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}
