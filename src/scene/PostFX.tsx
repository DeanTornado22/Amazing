import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Glitch, ChromaticAberration, HueSaturation, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';
import * as THREE from 'three';
import { useVibeStore } from '../store/useVibeStore';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';
import { beatSurpriseState } from '../audio/beatSurpriseState';
import { currentAudioData } from '../audio/AudioEngine';

export default function PostFX() {
  const { visualConfig } = useVibeStore();
  const [dynamicBloom, setDynamicBloom] = useState(visualConfig?.postfx.bloomStrength ?? 0.42);
  const bloomValue = useRef(dynamicBloom);
  const updateTimer = useRef(0);
  const [chroma, setChroma] = useState<[number, number]>([0, 0]);
  const chromaValue = useRef<[number, number]>([0, 0]);
  const [hueShift, setHueShift] = useState(0);
  const hueValue = useRef(0);
  const chromaTimer = useRef(0);

  useFrame((_, delta) => {
    if (!visualConfig) return;

    const { config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    const targetBloom = config.postfx.bloomStrength;

    bloomValue.current = THREE.MathUtils.lerp(bloomValue.current, targetBloom, 0.18);
    updateTimer.current += delta;
    chromaTimer.current += delta;

    // Bloom — refresh 12.5Hz to avoid React thrash
    if (updateTimer.current > 0.08) {
      updateTimer.current = 0;
      setDynamicBloom(Number(bloomValue.current.toFixed(3)));
    }

    // Chromatic aberration — spikes on kick + surprise glitch
    const baseChroma = currentAudioData.hasKickThisFrame ? 0.006 : 0.0008;
    const surpriseChroma = beatSurpriseState.chromaOffset;
    const targetChromaX = Math.min(0.018, baseChroma + surpriseChroma);
    const targetChromaY = Math.min(0.018, baseChroma * 0.6 + surpriseChroma * 0.6);
    chromaValue.current[0] = THREE.MathUtils.lerp(chromaValue.current[0], targetChromaX, 0.35);
    chromaValue.current[1] = THREE.MathUtils.lerp(chromaValue.current[1], targetChromaY, 0.35);

    // Hue shift — surprise color invert pushes hue to 180 (inverts colors)
    const targetHue = beatSurpriseState.invertAmount * 180;
    hueValue.current = THREE.MathUtils.lerp(hueValue.current, targetHue, 0.18);

    if (chromaTimer.current > 0.04) {
      chromaTimer.current = 0;
      setChroma([
        Number(chromaValue.current[0].toFixed(5)),
        Number(chromaValue.current[1].toFixed(5)),
      ]);
      setHueShift(Number(hueValue.current.toFixed(2)));
    }
  });

  if (!visualConfig) return null;

  const glitchValue = visualConfig.postfx.glitchAmount;
  const glitchBoost = beatSurpriseState.glitchBoost;
  const finalGlitch = Math.min(1, glitchValue + glitchBoost);

  return (
    <EffectComposer>
      <Bloom
        intensity={dynamicBloom}
        radius={visualConfig.postfx.bloomRadius}
        luminanceThreshold={visualConfig.postfx.bloomThreshold}
        luminanceSmoothing={0.7}
        mipmapBlur
      />
      <ChromaticAberration
        offset={chroma}
        radialModulation={false}
        modulationOffset={0}
        blendFunction={BlendFunction.NORMAL}
      />
      <HueSaturation hue={hueShift} saturation={0} />
      <Vignette eskil={false} offset={0.15} darkness={0.6} />
      {finalGlitch > 0.15 ? (
        <Glitch
          delay={new Vector2(0.8, 2.2)}
          duration={new Vector2(0.05, 0.2)}
          strength={new Vector2(0.1, finalGlitch)}
          ratio={0.45}
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
