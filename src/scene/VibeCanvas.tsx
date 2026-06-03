import { Canvas, useFrame } from '@react-three/fiber';
import { useVibeStore } from '../store/useVibeStore';
import { audioEngine } from '../audio/AudioEngine';
import TunnelScene from './TunnelScene';

function AudioEngineUpdater() {
  // Sync frame loops: compute Web Audio analysers before R3F meshes update
  useFrame(() => {
    audioEngine.update();
  });
  return null;
}

export default function VibeCanvas() {
  const { visualConfig } = useVibeStore();

  if (!visualConfig) return null;

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 70, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <AudioEngineUpdater />
      <TunnelScene />
    </Canvas>
  );
}
