import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { currentColorOffset } from '../audio/AudioEngine';
import { useVibeStore } from '../store/useVibeStore';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';
import { bpmAnchoredSpeed } from '../audio/beatSync';
import { pulseScale as gsapPulseScale } from '../utils/gsapHelpers';
import {
  getBeatTurnVector,
  getSceneMorph,
  shouldTriggerBeatTurn,
  shouldTriggerSceneMorph,
} from './beatTurns';
import { getTunnelPathPoint, getTunnelPathRoll, updateTunnelPath } from './tunnelPath';

const PATH_SEGMENTS = 80;
const CAMERA_PATH_Z = 4.8;
const FRAME_START_Z = 4.0;
const FRAME_RECYCLE_Z = 7.8;

function CenterPathLine() {
  const lineRef = useRef<THREE.Line>(null);

  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PATH_SEGMENTS * 3), 3));
    const material = new THREE.LineBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Line(geometry, material);
  }, []);

  useFrame(() => {
    if (!lineRef.current) return;

    const position = lineRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = position.array as Float32Array;

    for (let i = 0; i < PATH_SEGMENTS; i++) {
      const t = i / (PATH_SEGMENTS - 1);
      const z = CAMERA_PATH_Z - t * 118;
      const point = getTunnelPathPoint(z);
      array[i * 3] = point.x;
      array[i * 3 + 1] = point.y;
      array[i * 3 + 2] = point.z;
    }

    position.needsUpdate = true;
  });

  return <primitive ref={lineRef} object={line} />;
}

export default function TunnelFrames() {
  const { visualConfig } = useVibeStore();
  const groupRef = useRef<THREE.Group>(null);
  const turnRef = useRef({ x: 0, y: 0, roll: 0 });
  const morphRef = useRef({
    wave: 0,
    split: 0,
    squeeze: 0,
    stretch: 0,
    spin: 0,
    lift: 0,
    breathe: 0.08,
    colorShift: 0,
  });
  const lastTurnBeat = useRef(-1);
  const lastMorphBeat = useRef(-1);

  // Read config settings
  const { frameCount, spacing, shape, twist } = useMemo(() => {
    if (!visualConfig) {
      return { frameCount: 30, spacing: 3, shape: 'circle', twist: 0.1 };
    }
    return {
      frameCount: visualConfig.tunnel.frameCount,
      spacing: visualConfig.tunnel.spacing,
      shape: visualConfig.tunnel.shape,
      twist: visualConfig.tunnel.twist,
    };
  }, [visualConfig]);

  const totalLength = frameCount * spacing;

  // Build the geometries once and cache them
  const geometries = useMemo(() => {
    return {
      circle: new THREE.TorusGeometry(3.5, 0.05, 12, 48),
      rect: new THREE.TorusGeometry(3.6, 0.05, 4, 4), // 4 segments rotated = rect/diamond
      triangle: new THREE.TorusGeometry(3.4, 0.05, 3, 3), // 3 segments = triangle
    };
  }, []);

  // Frame initialization parameters
  const frames = useMemo(() => {
    const arr = [];
    for (let i = 0; i < frameCount; i++) {
      const zPos = FRAME_START_Z - i * spacing;
      
      // Determine shape of this specific frame
      let frameGeom = geometries.circle;
      if (shape === 'rect') {
        frameGeom = geometries.rect;
      } else if (shape === 'triangle') {
        frameGeom = geometries.triangle;
      } else if (shape === 'mixed') {
        const shapeTypes: ('circle' | 'rect' | 'triangle')[] = ['circle', 'rect', 'triangle'];
        const type = shapeTypes[i % 3];
        frameGeom = geometries[type];
      }

      // Alternate colors
      const isEven = i % 2 === 0;

      arr.push({
        z: zPos,
        geom: frameGeom,
        isEven,
        initialRotation: i * twist + Math.sin(i * 1.37) * 0.18,
        scale: 0.9 + ((i * 17) % 9) * 0.035,
      });
    }
    return arr;
  }, [frameCount, spacing, shape, twist, geometries]);

  const customTime = useRef(0);

  useFrame((_, delta) => {
    if (!visualConfig || !groupRef.current) return;

    const isPlaying = useVibeStore.getState().isPlaying;
    const { audio, config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    const { reactivity } = config;
    
    if (!isPlaying) return; // Freeze animation if paused

    customTime.current += delta;

    if (shouldTriggerBeatTurn(audio.beatIndex) && audio.beatIndex !== lastTurnBeat.current) {
      lastTurnBeat.current = audio.beatIndex;
      const nextTurn = getBeatTurnVector(audio.beatIndex, audio.energy);

      gsap.killTweensOf(turnRef.current);
      gsap.to(turnRef.current, {
        x: nextTurn.x * config.tunnel.sectionTurnStrength * reactivity.midsToTurns,
        y: nextTurn.y * config.tunnel.sectionTurnStrength * reactivity.midsToTurns,
        roll: nextTurn.roll * config.tunnel.sectionTurnStrength * reactivity.midsToTurns,
        duration: 0.92,
        ease: 'sine.inOut',
      });
    }

    if (shouldTriggerSceneMorph(audio.beatIndex) && audio.beatIndex !== lastMorphBeat.current) {
      lastMorphBeat.current = audio.beatIndex;
      const nextMorph = getSceneMorph(audio.beatIndex, audio.energy);

      gsap.killTweensOf(morphRef.current);
      gsap.to(morphRef.current, {
        ...nextMorph,
        duration: 1.05,
        ease: 'sine.inOut',
      });
    }

    // Pulse parent tunnel scale group on kicks or beats
    if (audio.kick) {
      gsapPulseScale(groupRef.current, 1 + config.tunnel.pulseStrength * 0.45, 0.08);
    } else if (audio.beat) {
      gsapPulseScale(groupRef.current, 1 + config.tunnel.pulseStrength * 0.22, 0.08);
    }

    const baseSpeed = bpmAnchoredSpeed(audio.bpm, config.tunnel.speed, spacing);
    const currentSpeed = baseSpeed + audio.energy * 5 * reactivity.energyToSpeed;
    const colors = [
      visualConfig.palette.primary,
      visualConfig.palette.secondary,
      visualConfig.palette.primary,
    ];

    updateTunnelPath({
      turn: turnRef.current,
      morph: morphRef.current,
      time: customTime.current,
      totalLength,
    });
    
    groupRef.current.children.forEach((child, idx) => {
      // 1. Move forward
      child.position.z += currentSpeed * delta;
      
      // 2. Recycle Z position
      if (child.position.z > FRAME_RECYCLE_Z) {
        child.position.z -= totalLength;
      }

      // 3. Place every frame center on the shared tunnel path.
      const depth = THREE.MathUtils.clamp((-child.position.z + 8) / totalLength, 0, 1);
      const curve = Math.pow(depth, 1.35);
      const phase = customTime.current * (1.2 + audio.mids * 0.6) + idx * 0.42;
      const pathPoint = getTunnelPathPoint(child.position.z);

      child.position.x = pathPoint.x;
      child.position.y = pathPoint.y;

      // 4. Audio reactivity scale pulse (heavy on bass)
      const scaleFactor = 1 + audio.bass * (config.tunnel.pulseStrength + 0.03) * reactivity.bassToPulse;
      const scaleX = Math.max(
        0.25,
        scaleFactor * (1 + morphRef.current.stretch * curve + Math.sin(phase) * morphRef.current.breathe * depth)
      );
      const scaleY = Math.max(
        0.25,
        scaleFactor * (1 - morphRef.current.squeeze * curve + Math.cos(phase * 0.9) * morphRef.current.breathe * depth)
      );
      child.scale.set(scaleX, scaleY, 1);

      // 5. Subtle rotation wobble based on time/mids and beat-turn banking.
      const staticRot = idx * twist;
      child.rotation.z =
        staticRot +
        getTunnelPathRoll(child.position.z) +
        morphRef.current.spin * customTime.current * 0.18 +
        (Math.sin(customTime.current + idx * 0.1) * 0.05) * audio.mids +
        audio.mids * config.tunnel.twistAmount * reactivity.midsToTwist * curve;

      const colorIndex = (idx + currentColorOffset + Math.round(morphRef.current.colorShift)) % 3;
      const depthFade = 1 - depth * 0.38;
      const targetOpacity = (config.tunnel.segmentOpacity + audio.energy * 0.08 * reactivity.energyToSpeed + Math.abs(morphRef.current.spin) * 0.06) * depthFade;

      child.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;

        const material = node.material as THREE.MeshBasicMaterial;
        const role = node.userData.role;
        const roleColor =
          role === 'secondary'
            ? visualConfig.palette.secondary
            : role === 'accent'
              ? audio.kick
                ? visualConfig.palette.accent
                : visualConfig.palette.secondary
              : colors[colorIndex];

        material.color.set(roleColor);
        material.opacity = THREE.MathUtils.lerp(
          material.opacity,
          role === 'panel' ? config.tunnel.panelOpacity + audio.bass * 0.025 : targetOpacity,
          0.08
        );
      });
    });
  });

  if (!visualConfig) return null;

  const { palette } = visualConfig;
  const colors = [palette.primary, palette.secondary, palette.primary];

  return (
    <>
      <CenterPathLine />
      <group ref={groupRef}>
        {frames.map((frame, idx) => {
          const color = frame.isEven 
            ? colors[currentColorOffset % 3] 
            : colors[(currentColorOffset + 1) % 3];
          
          // Rect needs 45 degrees rotation on Z to look like a clean aligned square
          const zRot = frame.geom === geometries.rect ? Math.PI / 4 : 0;

          return (
            <group
              key={idx}
              position={[0, 0, frame.z]}
              rotation={[0, 0, frame.initialRotation + zRot]}
              scale={[frame.scale, frame.scale, 1]}
            >
              <mesh geometry={frame.geom}>
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={0.64}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>

              <mesh userData={{ role: 'panel' }} position={[0, 0, -0.05]}>
                <boxGeometry args={[8.7, 5.9, 0.025]} />
                <meshBasicMaterial
                  color={palette.background2 ?? palette.background}
                  transparent
                  opacity={0.12}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>

              <mesh userData={{ role: 'secondary' }} position={[-4.75, 0, 0]}>
                <boxGeometry args={[0.08, 5.5, 0.08]} />
                <meshBasicMaterial color={palette.secondary} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
              <mesh userData={{ role: 'secondary' }} position={[4.75, 0, 0]}>
                <boxGeometry args={[0.08, 5.5, 0.08]} />
                <meshBasicMaterial color={palette.secondary} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
              <mesh userData={{ role: 'accent' }} position={[0, 2.95, 0]}>
                <boxGeometry args={[7.8, 0.08, 0.08]} />
                <meshBasicMaterial color={palette.secondary} transparent opacity={0.46} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
              <mesh userData={{ role: 'accent' }} position={[0, -2.95, 0]}>
                <boxGeometry args={[6.3, 0.045, 0.045]} />
                <meshBasicMaterial color={palette.secondary} transparent opacity={0.24} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
            </group>
          );
        })}
      </group>
    </>
  );
}
