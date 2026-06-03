/* eslint-disable */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVibeStore } from '../store/useVibeStore';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';
import { getTunnelPathPoint } from './tunnelPath';

export default function ParticleField() {
  const { visualConfig } = useVibeStore();
  const pointsRef = useRef<THREE.Points>(null);
  
  const count = visualConfig?.particles.count ?? 1000;
  const depthRadius = visualConfig?.particles.depthRadius ?? 11;
  const maxDepth = 150;

  // Initialize random particle positions in a hollow cylinder shell around tunnel
  const [positions, initialSpeeds, angles, radii] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const particleAngles = new Float32Array(count);
    const particleRadii = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.4 + Math.random() * depthRadius;
      const z = -Math.random() * maxDepth;
      const center = getTunnelPathPoint(z);
      
      pos[i * 3] = center.x + Math.cos(angle) * radius;
      pos[i * 3 + 1] = center.y + Math.sin(angle) * radius;
      pos[i * 3 + 2] = z;

      // Random speed offset for parallax depth layering
      speeds[i] = 0.5 + Math.random() * 1.5;
      particleAngles[i] = angle;
      particleRadii[i] = radius;
    }
    return [pos, speeds, particleAngles, particleRadii];
  }, [count, depthRadius]);

  useFrame((_, delta) => {
    if (!pointsRef.current || !visualConfig) return;

    const isPlaying = useVibeStore.getState().isPlaying;
    if (!isPlaying) return; // Freeze particles if paused

    const { audio, config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    const { reactivity } = config;
    const geometry = pointsRef.current.geometry;
    const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = positionAttribute.array as Float32Array;

    const baseSpeed = 8 + config.particles.speed * 12;
    const beatBurst = audio.kick ? 8 * config.particles.beatBurstStrength : audio.beat ? 3 * config.particles.beatBurstStrength : 0;
    const currentSpeed = baseSpeed + audio.energy * 22 * reactivity.energyToSpeed + beatBurst;

    for (let i = 0; i < count; i++) {
      const xIdx = i * 3;
      const yIdx = i * 3 + 1;
      const zIdx = i * 3 + 2;
      
      // Move particle forward (increase Z)
      array[zIdx] += currentSpeed * initialSpeeds[i] * delta;

      // Wrap if passed the camera (Z > 8)
      if (array[zIdx] > 8) {
        array[zIdx] = -maxDepth;
      }

      const orbit = angles[i] + audio.time * (0.12 + initialSpeeds[i] * 0.05);
      const center = getTunnelPathPoint(array[zIdx]);
      const inwardPulse = audio.kick ? 0.96 : 1;
      array[xIdx] = center.x + Math.cos(orbit) * radii[i] * inwardPulse;
      array[yIdx] = center.y + Math.sin(orbit) * radii[i] * inwardPulse;
    }

    // Flag buffer to update GPU memory
    positionAttribute.needsUpdate = true;

    // React to high-frequencies by altering size
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    if (mat) {
      const reveal = THREE.MathUtils.clamp((audio.beatIndex - 8) / 32, 0, 1);
      // Treble transient controls particle size and brightness
      const particleBaseSize = config.particles.size;
      mat.size = THREE.MathUtils.lerp(
        mat.size,
        particleBaseSize * (0.6 + reveal * 0.4) +
          audio.treble * 0.035 * config.particles.sparkleStrength * reactivity.trebleToSparkle +
          (audio.kick ? 0.008 : 0),
        0.2
      );
      mat.opacity = THREE.MathUtils.lerp(
        mat.opacity,
        Math.min(config.particles.opacity, reveal * (0.12 + audio.treble * 0.28 * reactivity.trebleToParticles + audio.energy * 0.08)),
        0.2
      );
    }
  });

  if (!visualConfig) return null;

  const { palette } = visualConfig;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={palette.secondary}
        size={visualConfig.particles.size}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
