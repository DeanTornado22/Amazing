import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVibeStore } from '../store/useVibeStore';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';
import { bpmAnchoredSpeed } from '../audio/beatSync';

const LINE_COUNT = 34;
const SIDE_LINE_COUNT = 7;
const FAR_Z = -150;
const NEAR_Z = 10;
const DEPTH = NEAR_Z - FAR_Z;

export default function NeonFloor() {
  const { visualConfig } = useVibeStore();
  const floorRef = useRef<THREE.Group>(null);
  const lineRefs = useRef<THREE.Mesh[]>([]);
  const sideRefs = useRef<THREE.Mesh[]>([]);
  const railRefs = useRef<THREE.Mesh[]>([]);
  const floorMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  const lineLayout = useMemo(
    () =>
      Array.from({ length: LINE_COUNT }, (_, idx) => ({
        z: FAR_Z + (idx / LINE_COUNT) * DEPTH,
        width: idx % 4 === 0 ? 17 : 13.5,
      })),
    []
  );

  const sideLayout = useMemo(
    () =>
      Array.from({ length: SIDE_LINE_COUNT * 2 }, (_, idx) => {
        const sideIndex = idx % SIDE_LINE_COUNT;
        const side = idx < SIDE_LINE_COUNT ? -1 : 1;
        return {
          x: side * (2.4 + sideIndex * 1.15),
          opacity: 0.13 + sideIndex * 0.018,
        };
      }),
    []
  );

  useFrame((_, delta) => {
    if (!visualConfig || !floorRef.current) return;

    const isPlaying = useVibeStore.getState().isPlaying;
    if (!isPlaying) return;

    const { audio, config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    // Floor grid motion locked to BPM. At speed=1, a new line crosses the
    // camera exactly on each beat. energy adds a small additional surge.
    const speed = bpmAnchoredSpeed(audio.bpm, config.tunnel.speed * 1.2, 1) + config.floor.gridSpeed * 4;
    const beatFlash = audio.kick ? 1 : audio.beat ? 0.45 : 0;
    const pulse = config.floor.brightness + audio.bass * config.floor.bassPulseStrength + beatFlash * 0.12;

    lineRefs.current.forEach((line, idx) => {
      line.position.z += speed * delta;
      if (line.position.z > NEAR_Z) {
        line.position.z -= DEPTH;
      }

      const material = line.material as THREE.MeshBasicMaterial;
      const depthFade = THREE.MathUtils.clamp((NEAR_Z - line.position.z) / DEPTH, 0, 1);
      material.opacity = THREE.MathUtils.lerp(
        material.opacity,
        (config.floor.gridOpacity + pulse * 0.32) * (0.4 + depthFade * 0.72),
        0.18
      );
      line.scale.x = THREE.MathUtils.lerp(line.scale.x, 1 + audio.bass * 0.05, 0.18);

      if (idx % 8 === 0) {
        material.color.set(audio.kick ? config.floor.kickFlashColor : visualConfig.palette.secondary);
      } else {
        material.color.set(idx % 2 === 0 ? visualConfig.palette.secondary : visualConfig.palette.primary);
      }
    });

    sideRefs.current.forEach((line) => {
      const material = line.material as THREE.MeshBasicMaterial;
      material.opacity = THREE.MathUtils.lerp(material.opacity, 0.05 + pulse * 0.18, 0.12);
      material.color.set(audio.kick && audio.bass > 0.68 ? config.floor.kickFlashColor : visualConfig.palette.secondary);
    });

    railRefs.current.forEach((rail, idx) => {
      const material = rail.material as THREE.MeshBasicMaterial;
      material.opacity = THREE.MathUtils.lerp(material.opacity, config.floor.railBrightness + pulse * 0.22, 0.18);
      material.color.set(idx === 0 ? visualConfig.palette.primary : visualConfig.palette.secondary);
      rail.scale.z = THREE.MathUtils.lerp(rail.scale.z, 1 + audio.bass * 0.04, 0.18);
    });

    if (floorMaterialRef.current) {
      floorMaterialRef.current.opacity = THREE.MathUtils.lerp(
        floorMaterialRef.current.opacity,
        0.08 + audio.bass * 0.08,
        0.12
      );
      floorMaterialRef.current.color.set(visualConfig.palette.background2 ?? visualConfig.palette.background);
    }
  });

  if (!visualConfig) return null;

  const { palette } = visualConfig;

  return (
    <group ref={floorRef} position={[0, -2.85, -34]}>
      <mesh position={[0, -0.03, -32]}>
        <boxGeometry args={[24, 0.03, 162]} />
        <meshBasicMaterial
          ref={floorMaterialRef}
          color={palette.background2 ?? palette.background}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>

      {lineLayout.map((line, idx) => (
        <mesh
          key={`cross-${idx}`}
          ref={(mesh) => {
            if (mesh) lineRefs.current[idx] = mesh;
          }}
          position={[0, 0.02, line.z]}
        >
          <boxGeometry args={[line.width, 0.026, 0.035]} />
          <meshBasicMaterial
            color={idx % 2 === 0 ? palette.secondary : palette.primary}
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {sideLayout.map((line, idx) => (
        <mesh
          key={`side-${idx}`}
          ref={(mesh) => {
            if (mesh) sideRefs.current[idx] = mesh;
          }}
          position={[line.x, 0.04, -70]}
        >
          <boxGeometry args={[0.025, 0.025, 155]} />
          <meshBasicMaterial
            color={palette.secondary}
            transparent
            opacity={line.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {[-1, 1].map((side, idx) => (
        <mesh
          key={`rail-${side}`}
          ref={(mesh) => {
            if (mesh) railRefs.current[idx] = mesh;
          }}
          position={[side * 7.2, 0.08, -70]}
        >
          <boxGeometry args={[0.16, 0.06, 158]} />
          <meshBasicMaterial
            color={idx === 0 ? palette.primary : palette.secondary}
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
