import CameraRig from "./CameraRig";
import LightRig from "./LightRig";
import TunnelFrames from "./TunnelFrames";
import NeonFloor from "./NeonFloor";
import LaserBeams from "./LaserBeams";
import EqualizerBars from "./EqualizerBars";
import ConcertSilhouettes from "./ConcertSilhouettes";
import LEDPanels from "./LEDPanels";
import BeatImpactFlash from "./BeatImpactFlash";
import BeatRings from "./BeatRings";
import BeatBurst from "./BeatBurst";
import ParticleField from "./ParticleField";
import BeatGates from "./BeatGates";
import SceneMutations from "./SceneMutations";
import BeatSurprise from "./BeatSurprise";
import StrobeFlash from "./StrobeFlash";
import Shockwave from "./Shockwave";
import PostFX from "./PostFX";
import { useVibeStore } from "../store/useVibeStore";

export default function TunnelScene() {
  const { visualConfig } = useVibeStore();

  if (!visualConfig) return null;

  const { palette } = visualConfig;

  return (
    <group>
      {/* Explicit scene background so the canvas isn't filled with fog
          colour alone — the dark backdrop gives neon accents something to
          glow against. */}
      <color attach="background" args={[palette.background]} />
      <fogExp2
        attach="fog"
        args={[palette.fog, visualConfig.postfx.fogDensity]}
      />

      <CameraRig />
      <LightRig />
      <BeatSurprise />
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
      <Shockwave />

      {/* Bloom and special glitch rendering */}
      <PostFX />

      {/* StrobeFlash is mounted last so it always renders on top of PostFX */}
      <StrobeFlash />
    </group>
  );
}
