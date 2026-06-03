import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVibeStore } from '../store/useVibeStore';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';
import { getTunnelPathPoint } from './tunnelPath';

const SPEAKER_ZS = [-11, -29, -47];
const CROWD_COUNT = 18;

export default function ConcertSilhouettes() {
  const { visualConfig } = useVibeStore();
  const speakerRefs = useRef<THREE.Group[]>([]);
  const coneRefs = useRef<THREE.Mesh[]>([]);
  const crowdRefs = useRef<THREE.Mesh[]>([]);
  const dancerRef = useRef<THREE.Group>(null);
  const stageRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!visualConfig) return;

    const isPlaying = useVibeStore.getState().isPlaying;
    if (!isPlaying) return;

    const { audio, config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    const minimalFactor = config.preset === 'minimal' ? 0.22 : config.preset === 'club' ? 0.6 : 0.85;
    const coneScale = 1 + audio.bass * 0.12 * config.reactivity.bassToBloom + (audio.kick ? 0.05 : 0);
    const speakerSpeed = 3.5 + config.tunnel.speed * 2.8 + audio.energy * 5;

    speakerRefs.current.forEach((speaker, idx) => {
      speaker.position.z += speakerSpeed * delta;
      if (speaker.position.z > 8) {
        speaker.position.z -= 72;
      }

      const center = getTunnelPathPoint(speaker.position.z);
      const side = idx % 2 === 0 ? -1 : 1;
      speaker.position.x = center.x + side * 7.7;
      speaker.position.y = center.y - 1.2;
      speaker.rotation.y = side * -0.2;
      speaker.visible = config.preset !== 'minimal' || idx < 2;
    });

    coneRefs.current.forEach((cone, idx) => {
      cone.scale.setScalar(THREE.MathUtils.lerp(cone.scale.x, coneScale * (idx % 2 === 0 ? 1 : 0.86), 0.25));
      const material = cone.material as THREE.MeshBasicMaterial;
      material.opacity = THREE.MathUtils.lerp(material.opacity, minimalFactor * (0.12 + audio.bass * 0.16), 0.2);
      material.color.set(
        audio.kick && idx % 3 === 1
          ? config.palette.accent
          : idx % 3 === 0
            ? config.palette.primary
            : config.palette.secondary
      );
    });

    crowdRefs.current.forEach((crowd, idx) => {
      crowd.visible = config.preset !== 'minimal';
      if (!crowd.visible) return;
      const bump = audio.beat ? 0.06 + (idx % 4) * 0.012 : Math.sin(audio.time * 2.4 + idx) * 0.015;
      crowd.scale.y = THREE.MathUtils.lerp(crowd.scale.y, 0.85 + bump + audio.bass * 0.18, 0.18);
      const material = crowd.material as THREE.MeshBasicMaterial;
      material.opacity = THREE.MathUtils.lerp(material.opacity, minimalFactor * (0.18 + audio.energy * 0.12), 0.12);
    });

    if (dancerRef.current) {
      dancerRef.current.visible = config.preset !== 'minimal';
      const center = getTunnelPathPoint(-36);
      dancerRef.current.position.set(center.x, center.y - 0.95, -36);
      dancerRef.current.scale.y = THREE.MathUtils.lerp(
        dancerRef.current.scale.y,
        1 + audio.bass * 0.1 + (audio.beat ? 0.04 : 0),
        0.18
      );
      dancerRef.current.rotation.z = Math.sin(audio.time * 2.2) * 0.05;
    }

    if (stageRef.current) {
      stageRef.current.visible = config.preset !== 'minimal';
      const center = getTunnelPathPoint(-58);
      stageRef.current.position.set(center.x, center.y - 0.1, -58);
      stageRef.current.rotation.z += delta * (0.08 + audio.mids * 0.22);
      stageRef.current.scale.setScalar(1 + audio.bass * 0.035);
    }
  });

  if (!visualConfig) return null;

  const { palette } = visualConfig;
  const speakerStacks = SPEAKER_ZS.flatMap((z) => [
    { z, side: -1 },
    { z: z - 9, side: 1 },
  ]);

  return (
    <group>
      {speakerStacks.map((speaker, speakerIdx) => (
        <group
          key={`speaker-${speakerIdx}`}
          ref={(group) => {
            if (group) speakerRefs.current[speakerIdx] = group;
          }}
          position={[speaker.side * 7.7, -1.2, speaker.z]}
        >
          <mesh>
            <boxGeometry args={[1.25, 2.65, 0.52]} />
            <meshBasicMaterial color={palette.darkPanel ?? '#050008'} transparent opacity={0.86} />
          </mesh>
          {[0.74, 0, -0.74].map((y, coneIdx) => {
            const globalConeIdx = speakerIdx * 3 + coneIdx;
            return (
              <mesh
                key={y}
                ref={(mesh) => {
                  if (mesh) coneRefs.current[globalConeIdx] = mesh;
                }}
                position={[0, y, 0.28]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <ringGeometry args={[0.2, 0.39, 28]} />
                <meshBasicMaterial
                  color={coneIdx === 1 ? palette.secondary : palette.primary}
                  transparent
                  opacity={0.42}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            );
          })}
          <mesh position={[0, 1.47, 0.31]}>
            <boxGeometry args={[1.45, 0.08, 0.08]} />
            <meshBasicMaterial color={palette.secondary} transparent opacity={0.58} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh position={[0, -1.47, 0.31]}>
            <boxGeometry args={[1.45, 0.08, 0.08]} />
            <meshBasicMaterial color={palette.secondary} transparent opacity={0.34} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      ))}

      {Array.from({ length: CROWD_COUNT }).map((_, idx) => {
        const side = idx < CROWD_COUNT / 2 ? -1 : 1;
        const local = idx % (CROWD_COUNT / 2);
        return (
          <mesh
            key={`crowd-${idx}`}
            ref={(mesh) => {
              if (mesh) crowdRefs.current[idx] = mesh;
            }}
            position={[side * (2.1 + local * 0.58), -2.72 + (idx % 3) * 0.05, -5 - local * 2.2]}
          >
            <coneGeometry args={[0.28 + (idx % 3) * 0.04, 0.9 + (idx % 4) * 0.16, 4]} />
            <meshBasicMaterial color={palette.darkPanel ?? '#020006'} transparent opacity={0.5} depthWrite={false} />
          </mesh>
        );
      })}

      <group ref={dancerRef} position={[0, -0.95, -36]}>
        <mesh position={[0, 0.62, 0]}>
          <sphereGeometry args={[0.18, 14, 10]} />
          <meshBasicMaterial color={palette.darkPanel ?? '#010006'} transparent opacity={0.92} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.34, 0.82, 0.08]} />
          <meshBasicMaterial color={palette.darkPanel ?? '#010006'} transparent opacity={0.92} />
        </mesh>
        <mesh position={[-0.33, 0.25, 0]} rotation={[0, 0, 0.55]}>
          <boxGeometry args={[0.12, 0.9, 0.06]} />
          <meshBasicMaterial color={palette.primary} transparent opacity={0.48} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh position={[0.34, 0.26, 0]} rotation={[0, 0, -0.7]}>
          <boxGeometry args={[0.12, 0.95, 0.06]} />
          <meshBasicMaterial color={palette.secondary} transparent opacity={0.36} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>

      <group ref={stageRef} position={[0, -0.1, -58]}>
        <mesh>
          <torusGeometry args={[4.8, 0.045, 8, 6]} />
          <meshBasicMaterial color={palette.warm ?? palette.accent} transparent opacity={0.42} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <pointLight color={palette.warm ?? palette.secondary} intensity={1.0} distance={18} decay={1.8} />
      </group>
    </group>
  );
}
