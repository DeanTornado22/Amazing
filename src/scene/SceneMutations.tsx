/* eslint-disable react-hooks/immutability */
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { currentColorOffset } from '../audio/AudioEngine';
import { useVibeStore } from '../store/useVibeStore';
import { getReactiveVisualState } from '../visual/deriveReactiveConfig';
import { shouldTriggerBeatTurn, shouldTriggerSceneMorph } from './beatTurns';
import { getTunnelPathPoint, getTunnelPathRoll } from './tunnelPath';

type PhaseState = {
  vortex: number;
  shards: number;
  portals: number;
  walls: number;
  orbit: number;
  aurora: number;
};

const PHASES: PhaseState[] = [
  { vortex: 0.12, shards: 0.0, portals: 0.0, walls: 0.0, orbit: 0.12, aurora: 0.0 },
  { vortex: 0.38, shards: 0.0, portals: 0.2, walls: 0.0, orbit: 0.18, aurora: 0.16 },
  { vortex: 0.18, shards: 0.35, portals: 0.32, walls: 0.0, orbit: -0.26, aurora: 0.22 },
  { vortex: 0.28, shards: 0.18, portals: 0.54, walls: 0.2, orbit: 0.34, aurora: 0.32 },
  { vortex: 0.52, shards: 0.42, portals: 0.72, walls: 0.34, orbit: 0.46, aurora: 0.45 },
];

function beatReveal(beatIndex: number, start: number, end: number): number {
  const beat = Math.max(0, beatIndex);
  const t = THREE.MathUtils.clamp((beat - start) / Math.max(1, end - start), 0, 1);
  return t * t * (3 - 2 * t);
}

function makeSpiralGeometry(offset: number) {
  const points: THREE.Vector3[] = [];
  const turns = 5.5;
  const steps = 220;

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const angle = t * Math.PI * 2 * turns + offset;
    const radius = 1.4 + t * 3.8;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        -t * 58
      )
    );
  }

  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 220, 0.018, 6, false);
}

export default function SceneMutations() {
  const { visualConfig } = useVibeStore();
  const { scene } = useThree();
  const phaseRef = useRef<PhaseState>({
    vortex: 0,
    shards: 0,
    portals: 0,
    walls: 0,
    orbit: 0.08,
    aurora: 0,
  });
  const lastMorphBeat = useRef(-1);
  const lastAccentBeat = useRef(-1);
  const lastSectionBeat = useRef(-1);
  const backgroundColor = useRef(new THREE.Color(visualConfig?.palette.background ?? '#030006'));
  const fogColor = useRef(new THREE.Color(visualConfig?.palette.fog ?? '#180026'));
  const beatAccent = useRef({ value: 0 });
  const sectionPunch = useRef({ value: 0 });

  const vortexGroup = useRef<THREE.Group>(null);
  const shardGroup = useRef<THREE.Group>(null);
  const portalGroup = useRef<THREE.Group>(null);
  const wallGroup = useRef<THREE.Group>(null);
  const auroraMaterial = useRef<THREE.ShaderMaterial>(null);

  const shardMeshes = useRef<THREE.Mesh[]>([]);
  const portalMeshes = useRef<THREE.Mesh[]>([]);
  const wallMeshes = useRef<THREE.Mesh[]>([]);
  const vortexMaterials = useRef<THREE.MeshBasicMaterial[]>([]);
  const shardMaterials = useRef<THREE.MeshBasicMaterial[]>([]);
  const portalMaterials = useRef<THREE.MeshBasicMaterial[]>([]);
  const wallMaterials = useRef<THREE.MeshBasicMaterial[]>([]);

  const spiralGeometries = useMemo(
    () => [
      makeSpiralGeometry(0),
      makeSpiralGeometry((Math.PI * 2) / 3),
      makeSpiralGeometry((Math.PI * 4) / 3),
    ],
    []
  );

  const shardLayout = useMemo(() => {
    return Array.from({ length: 42 }, (_, idx) => {
      const angle = idx * 2.399;
      const radius = 4.0 + (idx % 7) * 1.25;
      return {
        angle,
        radius,
        z: -6 - idx * 1.45,
        rotation: [
          idx * 0.37,
          idx * 0.61,
          idx * 0.19,
        ] as [number, number, number],
        scale: 0.45 + (idx % 4) * 0.16,
      };
    });
  }, []);

  const portalLayout = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => ({
      z: -idx * 5.2 - 3,
      rotation: (idx * Math.PI) / 8,
      scale: 1 + idx * 0.08,
    }));
  }, []);

  const wallLayout = useMemo(() => {
    return Array.from({ length: 14 }, (_, idx) => ({
      z: -idx * 5.5 - 2,
      side: idx % 2 === 0 ? -1 : 1,
      y: -0.1 + Math.sin(idx) * 0.8,
    }));
  }, []);

  useFrame((_, delta) => {
    if (!visualConfig) return;

    const isPlaying = useVibeStore.getState().isPlaying;
    const { audio, config } = getReactiveVisualState(visualConfig, useVibeStore.getState().musicProfile?.bpm);
    const { reactivity } = config;
    const colors = [
      config.palette.primary,
      config.palette.secondary,
      config.palette.primary,
    ];
    const cyan = config.palette.secondary;
    const greenAccent = config.palette.accent;

    if (isPlaying && shouldTriggerSceneMorph(audio.beatIndex) && audio.beatIndex !== lastMorphBeat.current) {
      lastMorphBeat.current = audio.beatIndex;
      const phraseIndex = Math.floor(audio.beatIndex / 8);
      const phase = PHASES[phraseIndex % PHASES.length];

      gsap.killTweensOf(phaseRef.current);
      gsap.to(phaseRef.current, {
        ...phase,
        duration: 1.15,
        ease: 'sine.inOut',
      });
    }

    if (isPlaying && shouldTriggerBeatTurn(audio.beatIndex) && audio.beatIndex !== lastAccentBeat.current) {
      lastAccentBeat.current = audio.beatIndex;
      gsap.killTweensOf(beatAccent.current);
      gsap.fromTo(
        beatAccent.current,
        { value: 1 },
        { value: 0, duration: 0.42, ease: 'power2.out' }
      );
    }

    if (
      isPlaying &&
      audio.beatIndex > 0 &&
      audio.beatIndex % 32 === 0 &&
      audio.beatIndex !== lastSectionBeat.current
    ) {
      lastSectionBeat.current = audio.beatIndex;
      gsap.killTweensOf(sectionPunch.current);
      gsap.fromTo(
        sectionPunch.current,
        { value: 1 },
        { value: 0, duration: 1.25, ease: 'power3.out' }
      );
    }

    const energy = isPlaying ? audio.energy : 0.12;
    const minimalFactor = config.preset === 'minimal' ? 0.2 : config.preset === 'club' ? 0.5 : 0.75;
    const bassKick = audio.kick ? 0.06 : 0;
    const accent = beatAccent.current.value;
    const section = sectionPunch.current.value;
    const vortexReveal = beatReveal(audio.beatIndex, 4, 16);
    const portalReveal = beatReveal(audio.beatIndex, 8, 28);
    const shardReveal = beatReveal(audio.beatIndex, 16, 40);
    const wallReveal = beatReveal(audio.beatIndex, 28, 56);
    const auroraReveal = beatReveal(audio.beatIndex, 12, 48);

    const backgroundTarget = new THREE.Color(config.palette.background)
      .lerp(new THREE.Color(config.palette.primary), energy * 0.04 * reactivity.energyToBackground)
      .lerp(new THREE.Color(cyan), audio.bass * 0.05 * reactivity.energyToBackground)
      .lerp(new THREE.Color(config.palette.danger ?? config.palette.primary), section * 0.08);
    const fogTarget = new THREE.Color(config.palette.fog)
      .lerp(new THREE.Color(cyan), audio.treble * 0.08 * reactivity.energyToBackground + section * 0.1);

    backgroundColor.current.lerp(backgroundTarget, 0.08);
    fogColor.current.lerp(fogTarget, 0.08);

    scene.background = backgroundColor.current;
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(fogColor.current);
      scene.fog.density = THREE.MathUtils.lerp(
        scene.fog.density,
        config.postfx.fogDensity * (1 + phaseRef.current.aurora * 0.2 + accent * 0.12 + section * 0.2),
        0.08
      );
    } else if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(fogColor.current);
      scene.fog.near = 8 - accent * 2;
      scene.fog.far = 52 + phaseRef.current.aurora * 18;
    }

    if (vortexGroup.current) {
      const vortexCenter = getTunnelPathPoint(-28);
      vortexGroup.current.position.copy(vortexCenter);
      vortexGroup.current.rotation.z += delta * (0.28 + energy * 0.75 * reactivity.energyToSpeed + phaseRef.current.orbit + section * 1.4);
      vortexGroup.current.rotation.x =
        Math.sin(audio.time * 0.55) * phaseRef.current.vortex * 0.14 * vortexReveal * reactivity.midsToTwist +
        accent * 0.08 * vortexReveal;
    }

    if (shardGroup.current) {
      shardGroup.current.rotation.z -= delta * (0.16 + Math.abs(phaseRef.current.orbit) * 1.4);
      shardGroup.current.rotation.y = Math.sin(audio.time * 0.35) * phaseRef.current.shards * 0.24 * minimalFactor;
      const scale = 1 + phaseRef.current.shards * 0.16 * shardReveal + bassKick * shardReveal + accent * 0.1 * shardReveal;
      shardGroup.current.scale.setScalar(scale);
    }

    if (portalGroup.current) {
      portalGroup.current.rotation.z += delta * phaseRef.current.orbit * 1.15;
      portalGroup.current.scale.setScalar(1 + phaseRef.current.portals * 0.08 * portalReveal + bassKick * portalReveal + section * 0.18);
    }

    if (wallGroup.current) {
      wallGroup.current.position.x = Math.sin(audio.time * 0.95) * phaseRef.current.walls * (0.45 + accent * 0.35) * minimalFactor;
      wallGroup.current.position.y = Math.cos(audio.time * 0.75) * phaseRef.current.walls * (0.22 + accent * 0.2) * minimalFactor;
      wallGroup.current.rotation.z = Math.sin(audio.time * 0.6) * phaseRef.current.walls * 0.08 * minimalFactor;
    }

    shardLayout.forEach((item, idx) => {
      const mesh = shardMeshes.current[idx];
      if (!mesh) return;

      const center = getTunnelPathPoint(item.z);
      const orbit = item.angle + audio.time * (0.18 + phaseRef.current.orbit * 0.12) * minimalFactor;
      mesh.position.set(
        center.x + Math.cos(orbit) * item.radius,
        center.y + Math.sin(orbit) * item.radius,
        item.z
      );
      mesh.rotation.z += delta * (0.4 + phaseRef.current.shards);
    });

    portalLayout.forEach((item, idx) => {
      const mesh = portalMeshes.current[idx];
      if (!mesh) return;

      const center = getTunnelPathPoint(item.z);
      mesh.position.set(center.x, center.y, item.z);
      mesh.rotation.z = item.rotation + getTunnelPathRoll(item.z) + audio.time * phaseRef.current.orbit * 0.14;
    });

    wallLayout.forEach((item, idx) => {
      const mesh = wallMeshes.current[idx];
      if (!mesh) return;

      const center = getTunnelPathPoint(item.z);
      mesh.position.set(
        center.x + item.side * (5.2 + accent * 0.8),
        center.y + item.y,
        item.z
      );
      mesh.rotation.set(0, item.side * Math.PI * 0.5, getTunnelPathRoll(item.z) * 0.45);
    });

    vortexMaterials.current.forEach((material, idx) => {
      material.color.set(colors[(idx + currentColorOffset) % colors.length]);
      material.opacity =
        minimalFactor * vortexReveal * (phaseRef.current.vortex * (0.18 + energy * 0.12 * reactivity.energyToBackground) + accent * 0.08);
    });

    shardMaterials.current.forEach((material, idx) => {
      material.color.set(colors[(idx + currentColorOffset + 1) % colors.length]);
      if (config.themeId === 'brazilian-phonk' && (idx + currentColorOffset) % 9 === 0 && audio.energy < 0.75) {
        material.color.set(cyan);
      }
      material.opacity =
        minimalFactor * shardReveal * (phaseRef.current.shards * (0.14 + audio.treble * 0.18 * reactivity.trebleToParticles + energy * 0.08) + accent * 0.05);
    });

    portalMaterials.current.forEach((material, idx) => {
      material.color.set(colors[(idx + currentColorOffset + 2) % colors.length]);
      material.opacity =
        minimalFactor * portalReveal * (phaseRef.current.portals * (0.14 + energy * 0.12 * reactivity.midsToTurns) + accent * 0.05);
    });

    wallMaterials.current.forEach((material, idx) => {
      material.color.set(colors[(idx + currentColorOffset) % colors.length]);
      material.opacity = minimalFactor * wallReveal * phaseRef.current.walls * (0.06 + energy * 0.08 * reactivity.energyToBackground);
    });

    if (auroraMaterial.current) {
      auroraMaterial.current.uniforms.time.value = audio.time;
      auroraMaterial.current.uniforms.energy.value = energy * (0.5 + reactivity.energyToBackground * 0.5);
      auroraMaterial.current.uniforms.phase.value =
        minimalFactor * auroraReveal * (phaseRef.current.aurora + accent * 0.12 + section * 0.18) * (0.22 + reactivity.energyToBackground * 0.45);
      auroraMaterial.current.uniforms.primary.value.set(colors[currentColorOffset % colors.length]);
      auroraMaterial.current.uniforms.secondary.value.set(
        audio.kick ? greenAccent : cyan
      );
    }
  });

  if (!visualConfig) return null;

  const { palette } = visualConfig;

  return (
    <group>
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[44, 64, 32]} />
        <shaderMaterial
          ref={auroraMaterial}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          uniforms={{
            time: { value: 0 },
            energy: { value: 0.2 },
            phase: { value: 0.5 },
            primary: { value: new THREE.Color(palette.primary) },
            secondary: { value: new THREE.Color(palette.secondary) },
          }}
          vertexShader={`
            varying vec3 vPos;

            void main() {
              vPos = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float time;
            uniform float energy;
            uniform float phase;
            uniform vec3 primary;
            uniform vec3 secondary;
            varying vec3 vPos;

            float stripe(float value, float width) {
              return smoothstep(width, 0.0, abs(fract(value) - 0.5));
            }

            void main() {
              vec3 p = normalize(vPos);
              float bands = stripe(p.y * (5.0 + phase * 8.0) + sin(p.x * 5.0 + time * 0.65), 0.22);
              float swirl = stripe(atan(p.y, p.x) * 0.85 + p.z * 2.6 + time * (0.18 + energy * 0.5), 0.18);
              float horizon = smoothstep(-0.45, 0.75, p.y);
              float alpha = (bands * 0.16 + swirl * 0.12) * phase * (0.75 + energy * 0.9) * horizon;
              vec3 color = mix(primary, secondary, bands + swirl * 0.5);

              gl_FragColor = vec4(color, alpha);
            }
          `}
        />
      </mesh>

      <group ref={vortexGroup}>
        {spiralGeometries.map((geometry, idx) => (
          <mesh key={idx} geometry={geometry}>
            <meshBasicMaterial
              ref={(material) => {
                if (material) vortexMaterials.current[idx] = material;
              }}
              color={idx === 0 ? palette.primary : idx === 1 ? palette.secondary : palette.primary}
              transparent
              opacity={0.45}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <group ref={shardGroup}>
        {shardLayout.map((item, idx) => (
          <mesh
            key={idx}
            ref={(mesh) => {
              if (mesh) shardMeshes.current[idx] = mesh;
            }}
            position={[0, 0, item.z]}
            rotation={item.rotation}
            scale={item.scale}
          >
            <tetrahedronGeometry args={[1, 0]} />
            <meshBasicMaterial
              ref={(material) => {
                if (material) shardMaterials.current[idx] = material;
              }}
              color={palette.secondary}
              transparent
              opacity={0.15}
              wireframe
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <group ref={portalGroup}>
        {portalLayout.map((item, idx) => (
          <mesh
            key={idx}
            ref={(mesh) => {
              if (mesh) portalMeshes.current[idx] = mesh;
            }}
            position={[0, 0, item.z]}
            rotation={[0, 0, item.rotation]}
            scale={[item.scale, item.scale * (idx % 2 === 0 ? 0.72 : 1.28), 1]}
          >
            <torusGeometry args={[4.2, 0.025, 6, idx % 2 === 0 ? 4 : 3]} />
            <meshBasicMaterial
              ref={(material) => {
                if (material) portalMaterials.current[idx] = material;
              }}
              color={palette.secondary}
              transparent
              opacity={0.25}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <group ref={wallGroup}>
        {wallLayout.map((item, idx) => (
          <mesh
            key={idx}
            ref={(mesh) => {
              if (mesh) wallMeshes.current[idx] = mesh;
            }}
            position={[item.side * 5.2, item.y, item.z]}
            rotation={[0, item.side * Math.PI * 0.5, 0]}
          >
            <planeGeometry args={[5.5, 4.4, 1, 1]} />
            <meshBasicMaterial
              ref={(material) => {
                if (material) wallMaterials.current[idx] = material;
              }}
              color={palette.primary}
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
