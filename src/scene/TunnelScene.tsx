import CameraRig from './CameraRig';
import LightRig from './LightRig';
import TunnelFrames from './TunnelFrames';
import NeonFloor from './NeonFloor';
import LaserBeams from './LaserBeams';
import EqualizerBars from './EqualizerBars';
import ConcertSilhouettes from './ConcertSilhouettes';
import LEDPanels from './LEDPanels';
import BeatImpactFlash from './BeatImpactFlash';
import BeatRings from './BeatRings';
import BeatBurst from './BeatBurst';
import ParticleField from './ParticleField';
import BeatGates from './BeatGates';
import SceneMutations from './SceneMutations';
import PostFX from './PostFX';
import { useVibeStore } from '../store/useVibeStore';

export default function TunnelScene() {
  const { visualConfig } = useVibeStore();

  if (!visualConfig) return null;

  const { palette } = visualConfig;

  return (
    <group>
      {/* Visual background atmospheric fog */}
      <fogExp2 attach="fog" args={[palette.fog, visualConfig.postfx.fogDensity]} />

      <CameraRig />
      <LightRig />
      <TunnelFrames />
      <NeonFloor />
      <LaserBeams />
      <EqualizerBars />
      <LEDPanels />
      <ConcertSilhouettes />
      <SceneMutations />
      <BeatRings />
      <BeatBurst />
      <ParticleField />
      <BeatGates />
      <BeatImpactFlash />
      
      {/* Bloom and special glitch rendering */}
      <PostFX />
    </group>
  );
}
