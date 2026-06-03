import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { currentColorOffset } from '../audio/AudioEngine';
import { useVibeStore } from '../store/useVibeStore';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';

export default function BeatGates() {
  const { visualConfig } = useVibeStore();
  
  const gateGroupRef = useRef<THREE.Group>(null);
  const leftGateRef = useRef<THREE.Group>(null);
  const rightGateRef = useRef<THREE.Group>(null);
  
  const lastGateTriggerIndex = useRef(-1);
  const hasSplit = useRef(false);
  const isGateActive = useRef(false);
  
  // Set up gate speed matching tunnel speed
  const gateSpeed = useMemo(() => {
    if (!visualConfig) return 15;
    return visualConfig.tunnel.speed * 8;
  }, [visualConfig]);

  useFrame((_, delta) => {
    if (!visualConfig || !gateGroupRef.current) return;

    const isPlaying = useVibeStore.getState().isPlaying;
    if (!isPlaying) return;

    const { audio, config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    const currentSpeed = gateSpeed + audio.energy * 6 * config.reactivity.energyToSpeed;

    // 1. Detect 32-beat index changes to spawn a gate
    const beatIndex = audio.beatIndex;
    if (
      beatIndex > 0 &&
      beatIndex % (config.preset === 'minimal' ? 64 : 32) === 0 &&
      beatIndex !== lastGateTriggerIndex.current
    ) {
      lastGateTriggerIndex.current = beatIndex;
      
      // Spawn/Reset gate
      isGateActive.current = true;
      hasSplit.current = false;
      gateGroupRef.current.position.z = -70; // Spawn in far distance
      
      // Reset left & right positions (Closed state)
      if (leftGateRef.current && rightGateRef.current) {
        gsap.killTweensOf(leftGateRef.current.position);
        gsap.killTweensOf(rightGateRef.current.position);
        leftGateRef.current.position.x = 0;
        rightGateRef.current.position.x = 0;
      }
    }

    if (!isGateActive.current) return;

    // 2. Translate gate towards the camera
    gateGroupRef.current.position.z += currentSpeed * delta;

    // 3. Trigger split-open animation right before collision (Z = -14)
    if (gateGroupRef.current.position.z > -14 && !hasSplit.current) {
      hasSplit.current = true;
      
      if (leftGateRef.current && rightGateRef.current) {
        // Slide left and right components apart dynamically
        gsap.to(leftGateRef.current.position, {
          x: -7,
          duration: 0.38,
          ease: 'power3.out',
        });
        gsap.to(rightGateRef.current.position, {
          x: 7,
          duration: 0.38,
          ease: 'power3.out',
        });
      }
    }

    // 4. Recycle/disable once passed behind the camera
    if (gateGroupRef.current.position.z > 8) {
      isGateActive.current = false;
    }
  });

  if (!visualConfig) return null;

  // Resolve color dynamically based on palette rotation offset
  const { palette } = visualConfig;
  const colors = [palette.primary, palette.secondary, palette.primary];
  const primaryColor = colors[currentColorOffset % 3];
  const secondaryColor = colors[(currentColorOffset + 1) % 3];

  return (
    <group ref={gateGroupRef} position={[0, 0, -100]}>
      {/* Volumetric atmosphere ambient fog around the gate */}
      <pointLight color={primaryColor} intensity={4} distance={20} decay={1.5} />

      {/* LEFT GATE HALF */}
      <group ref={leftGateRef}>
        {/* Outer neon bar */}
        <mesh position={[-2.8, 0, 0]}>
          <boxGeometry args={[0.2, 5.0, 0.2]} />
          <meshBasicMaterial color={primaryColor} transparent opacity={0.9} />
        </mesh>
        
        {/* Top diagonal brace */}
        <mesh position={[-1.4, 2.5, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[3.0, 0.15, 0.15]} />
          <meshBasicMaterial color={secondaryColor} transparent opacity={0.8} />
        </mesh>

        {/* Bottom diagonal brace */}
        <mesh position={[-1.4, -2.5, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[3.0, 0.15, 0.15]} />
          <meshBasicMaterial color={secondaryColor} transparent opacity={0.8} />
        </mesh>
        
        {/* Horizontal grid bar */}
        <mesh position={[-1.4, 0, 0]}>
          <boxGeometry args={[2.8, 0.1, 0.1]} />
          <meshBasicMaterial color={primaryColor} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* RIGHT GATE HALF */}
      <group ref={rightGateRef}>
        {/* Outer neon bar */}
        <mesh position={[2.8, 0, 0]}>
          <boxGeometry args={[0.2, 5.0, 0.2]} />
          <meshBasicMaterial color={primaryColor} transparent opacity={0.9} />
        </mesh>

        {/* Top diagonal brace */}
        <mesh position={[1.4, 2.5, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[3.0, 0.15, 0.15]} />
          <meshBasicMaterial color={secondaryColor} transparent opacity={0.8} />
        </mesh>

        {/* Bottom diagonal brace */}
        <mesh position={[1.4, -2.5, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[3.0, 0.15, 0.15]} />
          <meshBasicMaterial color={secondaryColor} transparent opacity={0.8} />
        </mesh>

        {/* Horizontal grid bar */}
        <mesh position={[1.4, 0, 0]}>
          <boxGeometry args={[2.8, 0.1, 0.1]} />
          <meshBasicMaterial color={primaryColor} transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  );
}
