import type { ThemeId } from '../audio/types';
import type { VisualConfig, VisualPresetId } from './VisualConfig';

type PresetShape = Omit<VisualConfig, 'themeId' | 'themeName'>;

export const MINIMAL_DARK_PRESET: PresetShape = {
  preset: 'minimal',
  palette: {
    background: '#02040A',
    background2: '#050816',
    fog: '#07101E',
    primary: '#00E5FF',
    secondary: '#B14CFF',
    accent: '#FFFFFF',
    warm: '#FFB703',
    danger: '#FF2E63',
    darkPanel: '#070B14',
    panel: '#070B14',
  },
  tunnel: {
    shape: 'rect',
    speed: 0.7,
    frameCount: 34,
    spacing: 3.8,
    pulseScale: 0.08,
    twist: 0.12,
    segmentSpacing: 3.8,
    pulseStrength: 0.08,
    twistAmount: 0.12,
    sectionTurnStrength: 0.05,
    segmentOpacity: 0.42,
    panelOpacity: 0.08,
    depthFadeStrength: 0.7,
  },
  camera: {
    speed: 0.55,
    shake: 0.02,
    fovPulse: 0.8,
    drift: 0.06,
    cameraSpeed: 0.55,
    mouseInfluence: 0.18,
    bassShakeSensitivity: 0.04,
    beatZoomStrength: 0.9,
  },
  particles: {
    count: 280,
    size: 0.018,
    speed: 0.65,
    sparkle: 0.35,
    sparkleStrength: 0.35,
    beatBurstStrength: 0.35,
    beatBurstLifetime: 0.35,
    opacity: 0.32,
    depthRadius: 11,
  },
  lighting: {
    bloom: 0.42,
    intensity: 0.9,
    beatFlash: 0.12,
  },
  effects: {
    glitch: 0,
    fogDensity: 0.026,
    ringFrequency: 0.35,
  },
  floor: {
    brightness: 0.35,
    gridOpacity: 0.18,
    gridSpeed: 0.7,
    railBrightness: 0.45,
    bassPulseStrength: 0.22,
    kickFlashColor: '#00E5FF',
    depthLength: 110,
    gridLineCount: 32,
  },
  lasers: {
    count: 4,
    thickness: 0.012,
    opacity: 0.22,
    speed: 0.25,
    rotationSpeed: 0.08,
    trebleFlickerStrength: 0.25,
    greenAccentFrequency: 0,
    beamLength: 28,
  },
  equalizer: {
    barCount: 18,
    heightMultiplier: 1.7,
    opacity: 0.28,
    bassWeight: 0.7,
    midsWeight: 0.5,
    trebleWeight: 0.35,
    sideDistance: 5.6,
    movementSpeed: 0.35,
    greenAccentThreshold: 0.9,
  },
  postfx: {
    bloomStrength: 0.42,
    bloomRadius: 0.36,
    bloomThreshold: 0.32,
    lightIntensity: 0.9,
    beatFlashStrength: 0.12,
    fogDensity: 0.026,
    glitchAmount: 0,
    screenFlashOpacity: 0.04,
  },
  reactivity: {
    energyToSpeed: 0.85,
    energyToBackground: 0.18,
    bassToPulse: 0.75,
    bassToCamera: 0.55,
    bassToBloom: 0.45,
    midsToTwist: 0.55,
    midsToTurns: 0.3,
    trebleToParticles: 0.6,
    trebleToSparkle: 0.65,
  },
};

const PRESET_OVERRIDES: Record<VisualPresetId, Partial<PresetShape>> = {
  minimal: {},
  club: {
    preset: 'club',
    palette: {
      ...MINIMAL_DARK_PRESET.palette,
      primary: '#35E8FF',
      secondary: '#D04CFF',
      accent: '#FFFFFF',
    },
    tunnel: {
      ...MINIMAL_DARK_PRESET.tunnel,
      speed: 1.1,
      pulseScale: 0.13,
      pulseStrength: 0.13,
      segmentOpacity: 0.5,
      panelOpacity: 0.1,
    },
    particles: {
      ...MINIMAL_DARK_PRESET.particles,
      count: 460,
      speed: 1,
      opacity: 0.42,
    },
    floor: {
      ...MINIMAL_DARK_PRESET.floor,
      brightness: 0.52,
      gridOpacity: 0.26,
      railBrightness: 0.6,
    },
    lasers: {
      ...MINIMAL_DARK_PRESET.lasers,
      count: 7,
      opacity: 0.28,
      rotationSpeed: 0.12,
      trebleFlickerStrength: 0.35,
    },
    equalizer: {
      ...MINIMAL_DARK_PRESET.equalizer,
      heightMultiplier: 2.2,
      opacity: 0.38,
    },
    lighting: {
      ...MINIMAL_DARK_PRESET.lighting,
      bloom: 0.55,
      intensity: 1.05,
      beatFlash: 0.18,
    },
    postfx: {
      ...MINIMAL_DARK_PRESET.postfx,
      bloomStrength: 0.55,
      lightIntensity: 1.05,
      beatFlashStrength: 0.18,
    },
  },
  intense: {
    preset: 'intense',
    palette: {
      ...MINIMAL_DARK_PRESET.palette,
      primary: '#00E5FF',
      secondary: '#FF2EAB',
      accent: '#FFFFFF',
    },
    tunnel: {
      ...MINIMAL_DARK_PRESET.tunnel,
      speed: 1.6,
      frameCount: 40,
      pulseScale: 0.18,
      pulseStrength: 0.18,
      twist: 0.18,
      twistAmount: 0.18,
      segmentOpacity: 0.56,
      panelOpacity: 0.11,
    },
    camera: {
      ...MINIMAL_DARK_PRESET.camera,
      shake: 0.06,
      fovPulse: 1.4,
      drift: 0.1,
      bassShakeSensitivity: 0.07,
    },
    particles: {
      ...MINIMAL_DARK_PRESET.particles,
      count: 720,
      speed: 1.4,
      opacity: 0.54,
      sparkle: 0.58,
      sparkleStrength: 0.58,
    },
    floor: {
      ...MINIMAL_DARK_PRESET.floor,
      brightness: 0.64,
      gridOpacity: 0.32,
      gridSpeed: 1.1,
      railBrightness: 0.72,
      bassPulseStrength: 0.32,
    },
    lasers: {
      ...MINIMAL_DARK_PRESET.lasers,
      count: 10,
      opacity: 0.34,
      speed: 0.45,
      rotationSpeed: 0.18,
      trebleFlickerStrength: 0.5,
      beamLength: 34,
    },
    equalizer: {
      ...MINIMAL_DARK_PRESET.equalizer,
      barCount: 22,
      heightMultiplier: 2.8,
      opacity: 0.48,
      movementSpeed: 0.55,
    },
    lighting: {
      ...MINIMAL_DARK_PRESET.lighting,
      bloom: 0.72,
      intensity: 1.35,
      beatFlash: 0.26,
    },
    effects: {
      ...MINIMAL_DARK_PRESET.effects,
      ringFrequency: 0.75,
    },
    postfx: {
      ...MINIMAL_DARK_PRESET.postfx,
      bloomStrength: 0.72,
      lightIntensity: 1.35,
      beatFlashStrength: 0.26,
      screenFlashOpacity: 0.08,
    },
  },
};

function mergePreset(preset: VisualPresetId): PresetShape {
  const override = PRESET_OVERRIDES[preset];
  return {
    ...MINIMAL_DARK_PRESET,
    ...override,
    palette: { ...MINIMAL_DARK_PRESET.palette, ...override.palette },
    tunnel: { ...MINIMAL_DARK_PRESET.tunnel, ...override.tunnel },
    camera: { ...MINIMAL_DARK_PRESET.camera, ...override.camera },
    particles: { ...MINIMAL_DARK_PRESET.particles, ...override.particles },
    lighting: { ...MINIMAL_DARK_PRESET.lighting, ...override.lighting },
    effects: { ...MINIMAL_DARK_PRESET.effects, ...override.effects },
    floor: { ...MINIMAL_DARK_PRESET.floor, ...override.floor },
    lasers: { ...MINIMAL_DARK_PRESET.lasers, ...override.lasers },
    equalizer: { ...MINIMAL_DARK_PRESET.equalizer, ...override.equalizer },
    postfx: { ...MINIMAL_DARK_PRESET.postfx, ...override.postfx },
    reactivity: { ...MINIMAL_DARK_PRESET.reactivity, ...override.reactivity },
  };
}

export function createVisualConfig(themeId: ThemeId, themeName: string, preset: VisualPresetId = 'minimal'): VisualConfig {
  return {
    themeId,
    themeName,
    ...mergePreset(preset),
  };
}

export function applyVisualPreset(config: VisualConfig, preset: VisualPresetId): VisualConfig {
  return {
    ...config,
    ...mergePreset(preset),
    themeId: config.themeId,
    themeName: preset === 'minimal' ? 'Minimal Modern Tunnel' : preset === 'club' ? 'Modern Club Tunnel' : 'Intense Modern Tunnel',
  };
}
