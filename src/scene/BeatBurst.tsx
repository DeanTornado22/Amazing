import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVibeStore } from '../store/useVibeStore';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';
import { getTunnelPathPoint } from './tunnelPath';
import { readBeatPhase, bpmAnchoredSpeed } from '../audio/beatSync';

const BURST_COUNT = 96;
const FALLBACK_BURST_LIFETIME = 0.35;

export default function BeatBurst() {
  const { visualConfig } = useVibeStore();
  const pointsRef = useRef<THREE.Points>(null);
  const ageRef = useRef(FALLBACK_BURST_LIFETIME + 1);
  const lastBeatRef = useRef(-1);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(BURST_COUNT * 3);
    const vel = new Float32Array(BURST_COUNT * 3);

    for (let i = 0; i < BURST_COUNT; i++) {
      const angle = (i / BURST_COUNT) * Math.PI * 2;
      const radius = 0.6 + ((i * 13) % 17) * 0.08;
      const speed = 7.5 + ((i * 19) % 23) * 0.32;

      vel[i * 3] = Math.cos(angle) * radius * speed;
      vel[i * 3 + 1] = Math.sin(angle) * radius * speed;
      vel[i * 3 + 2] = 7 + (i % 9) * 0.9;
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = -18;
    }

    return [pos, vel];
  }, []);

  useFrame((_, delta) => {
    if (!visualConfig || !pointsRef.current) return;

    const isPlaying = useVibeStore.getState().isPlaying;
    if (!isPlaying) return;

    const { audio, config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    const burstLifetime = config.particles.beatBurstLifetime;
    const shouldSpawn =
      (audio.kick || audio.beat) &&
      audio.beatIndex !== lastBeatRef.current;

    const geometry = pointsRef.current.geometry;
    const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = positionAttribute.array as Float32Array;
    const material = pointsRef.current.material as THREE.PointsMaterial;

    if (shouldSpawn) {
      lastBeatRef.current = audio.beatIndex;
      ageRef.current = 0;

      // Spawn the burst at a Z chosen so it reaches the camera exactly
      // when the next beat boundary arrives. We look up how much time
      // remains until the next beat, then back-calculate the Z distance
      // the camera will travel in that time at the current forward speed.
      const { secondsToNextBeat } = readBeatPhase();
      const camSpeed = bpmAnchoredSpeed(audio.bpm, config.tunnel.speed, 3.8) + audio.energy * 5;
      const spawnZ = -secondsToNextBeat * camSpeed - 4;
      const center = getTunnelPathPoint(spawnZ);
      for (let i = 0; i < BURST_COUNT; i++) {
        array[i * 3] = center.x;
        array[i * 3 + 1] = center.y;
        array[i * 3 + 2] = center.z;
      }

      material.color.set(audio.kick ? config.palette.primary : config.palette.secondary);
      material.opacity = (audio.kick ? 0.34 : 0.18) * config.particles.beatBurstStrength;
    }

    if (ageRef.current > burstLifetime) {
      material.opacity = THREE.MathUtils.lerp(material.opacity, 0, 0.18);
      return;
    }

    ageRef.current += delta;
    const progress = THREE.MathUtils.clamp(ageRef.current / burstLifetime, 0, 1);
    const strength = (audio.kick ? 1.08 : 0.82) * config.particles.beatBurstStrength;

    for (let i = 0; i < BURST_COUNT; i++) {
      array[i * 3] += velocities[i * 3] * delta * strength;
      array[i * 3 + 1] += velocities[i * 3 + 1] * delta * strength;
      array[i * 3 + 2] += velocities[i * 3 + 2] * delta * strength;
    }

    positionAttribute.needsUpdate = true;
    material.opacity = THREE.MathUtils.lerp(material.opacity, (1 - progress) * config.particles.opacity * 0.45, 0.35);
    material.size = THREE.MathUtils.lerp(material.size, config.particles.size * (1 + progress * 0.75), 0.25);
  });

  if (!visualConfig) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={visualConfig.palette.secondary}
        size={visualConfig.particles.size * 1.4}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
