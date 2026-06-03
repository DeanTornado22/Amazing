import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { currentColorOffset } from '../audio/AudioEngine';
import { useVibeStore } from '../store/useVibeStore';
import { flashLight } from '../utils/gsapHelpers';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';

export default function LightRig() {
  const { visualConfig } = useVibeStore();
  const centerLight = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!visualConfig) return;

    const isPlaying = useVibeStore.getState().isPlaying;
    if (!isPlaying) return; // Freeze light animations if paused

    const { audio, config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    const { reactivity } = config;

    // Resolve color rotation offset
    const { palette } = config;
    const colors = [palette.primary, palette.secondary, palette.primary];
    const centerColor = colors[currentColorOffset % 3];

    // Shift light colors dynamically
    if (centerLight.current) {
      centerLight.current.color.set(audio.kick ? palette.accent : centerColor);
    }

    // Central light flashes on kicks
    if (audio.kick && centerLight.current) {
      flashLight(
        centerLight.current,
        4.5 * config.postfx.lightIntensity * config.postfx.beatFlashStrength * reactivity.bassToBloom,
        0.75 * config.postfx.lightIntensity,
        0.18
      );
    } else if (centerLight.current) {
      centerLight.current.intensity = THREE.MathUtils.lerp(
        centerLight.current.intensity,
        (0.55 + audio.energy * 0.9 * reactivity.energyToBackground + audio.bass * 0.55 * reactivity.bassToBloom) * config.postfx.lightIntensity,
        0.12
      );
    }
  });

  if (!visualConfig) return null;

  const { palette } = visualConfig;

  return (
    <group>
      <ambientLight intensity={0.06} />

      {/* Center ambient glow PointLight */}
      <pointLight
        ref={centerLight}
        color={palette.primary}
        position={[0, 0, 4]}
        distance={28}
        decay={1.8}
        intensity={0.8}
      />
    </group>
  );
}
