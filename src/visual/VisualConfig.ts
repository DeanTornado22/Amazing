import type { ThemeId } from '../audio/types';

export type VisualPresetId = 'minimal' | 'club' | 'intense';

export type VisualConfig = {
  themeId: ThemeId;
  themeName: string;
  preset: VisualPresetId;
  palette: {
    background: string;
    background2?: string;
    primary: string;
    secondary: string;
    accent: string;
    fog: string;
    warm?: string;
    danger?: string;
    darkPanel?: string;
    panel?: string;
  };
  tunnel: {
    shape: 'rect' | 'circle' | 'triangle' | 'mixed';
    speed: number;
    frameCount: number;
    spacing: number;
    pulseScale: number;
    twist: number;
    segmentSpacing: number;
    pulseStrength: number;
    twistAmount: number;
    sectionTurnStrength: number;
    segmentOpacity: number;
    panelOpacity: number;
    depthFadeStrength: number;
  };
  camera: {
    speed: number;
    shake: number;
    fovPulse: number;
    drift: number;
    cameraSpeed: number;
    mouseInfluence: number;
    bassShakeSensitivity: number;
    beatZoomStrength: number;
  };
  particles: {
    count: number;
    size: number;
    speed: number;
    sparkle: number;
    sparkleStrength: number;
    beatBurstStrength: number;
    beatBurstLifetime: number;
    opacity: number;
    depthRadius: number;
  };
  lighting: {
    bloom: number;
    intensity: number;
    beatFlash: number;
  };
  effects: {
    glitch: number;
    fogDensity: number;
    ringFrequency: number;
  };
  floor: {
    brightness: number;
    gridOpacity: number;
    gridSpeed: number;
    railBrightness: number;
    bassPulseStrength: number;
    kickFlashColor: string;
    depthLength: number;
    gridLineCount: number;
  };
  lasers: {
    count: number;
    thickness: number;
    opacity: number;
    speed: number;
    rotationSpeed: number;
    trebleFlickerStrength: number;
    greenAccentFrequency: number;
    beamLength: number;
  };
  equalizer: {
    barCount: number;
    heightMultiplier: number;
    opacity: number;
    bassWeight: number;
    midsWeight: number;
    trebleWeight: number;
    sideDistance: number;
    movementSpeed: number;
    greenAccentThreshold: number;
  };
  postfx: {
    bloomStrength: number;
    bloomRadius: number;
    bloomThreshold: number;
    lightIntensity: number;
    beatFlashStrength: number;
    fogDensity: number;
    glitchAmount: number;
    screenFlashOpacity: number;
  };
  reactivity: {
    energyToSpeed: number;
    energyToBackground: number;
    bassToPulse: number;
    bassToCamera: number;
    bassToBloom: number;
    midsToTwist: number;
    midsToTurns: number;
    trebleToParticles: number;
    trebleToSparkle: number;
  };
};
