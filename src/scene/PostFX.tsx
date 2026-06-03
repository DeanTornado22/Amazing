import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Glitch } from '@react-three/postprocessing';
import { Vector2 } from 'three';
import * as THREE from 'three';
import { useVibeStore } from '../store/useVibeStore';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';

export default function PostFX() {
  const { visualConfig } = useVibeStore();
  const [dynamicBloom, setDynamicBloom] = useState(visualConfig?.postfx.bloomStrength ?? 0.42);
  const bloomValue = useRef(dynamicBloom);
  const updateTimer = useRef(0);

  useFrame((_, delta) => {
    if (!visualConfig) return;

    const { config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    const targetBloom = config.postfx.bloomStrength;

    bloomValue.current = THREE.MathUtils.lerp(bloomValue.current, targetBloom, 0.18);
    updateTimer.current += delta;

    if (updateTimer.current > 0.08) {
      updateTimer.current = 0;
      setDynamicBloom(Number(bloomValue.current.toFixed(3)));
    }
  });

  if (!visualConfig) return null;

  const glitchValue = visualConfig.postfx.glitchAmount;

  return (
    <EffectComposer>
      <Bloom
        intensity={dynamicBloom}
        radius={visualConfig.postfx.bloomRadius}
        luminanceThreshold={visualConfig.postfx.bloomThreshold}
        luminanceSmoothing={0.7}
        mipmapBlur
      />
      {glitchValue > 0.2 ? (
        <Glitch
          delay={new Vector2(1.5, 4.5)}
          duration={new Vector2(0.05, 0.25)}
          strength={new Vector2(0.1, glitchValue)}
          ratio={0.4}
        />
      ) : (
        <Glitch
          active={false}
          delay={new Vector2(1.5, 4.5)}
          duration={new Vector2(0.05, 0.25)}
          strength={new Vector2(0, 0)}
          ratio={0}
        />
      )}
    </EffectComposer>
  );
}
