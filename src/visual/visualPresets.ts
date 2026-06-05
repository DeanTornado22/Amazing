import type { ThemeId } from "../audio/types";
import type { VisualConfig, VisualPresetId } from "./VisualConfig";

type PresetShape = Omit<VisualConfig, "themeId" | "themeName">;

export const MINIMAL_DARK_PRESET: PresetShape = {
  preset: "minimal",
  palette: {
    // Much darker background so the scene reads as a "dark immersive"
    // tunnel, not a flat color wash. The fog was way too bright before.
    background: "#020308",
    background2: "#04060c",
    fog: "#03050a",
    primary: "#00E5FF",
    secondary: "#B14CFF",
    accent: "#FFFFFF",
    warm: "#FFB703",
    danger: "#FF2E63",
    darkPanel: "#070B14",
    panel: "#070B14",
  },
  tunnel: {
    shape: "rect",
    speed: 0.5,
    frameCount: 34,
    spacing: 3.8,
    pulseScale: 0.08,
    twist: 0.06, // reduced from 0.12 — less chaotic tunnel rotation
    segmentSpacing: 3.8,
    pulseStrength: 0.08,
    twistAmount: 0.06, // reduced from 0.12
    sectionTurnStrength: 0.02, // reduced from 0.05 — smoother flow
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
    count: 240, // dialed back to a calmer minimal scene
    size: 0.016,
    speed: 0.65,
    sparkle: 0.35,
    sparkleStrength: 0.35,
    beatBurstStrength: 0.45,
    beatBurstLifetime: 0.4,
    opacity: 0.28,
    depthRadius: 9,
  },
  lighting: {
    bloom: 0.32, // reduced from 0.42 — less glow wash
    intensity: 0.9,
    beatFlash: 0.12,
  },
  effects: {
    glitch: 0,
    fogDensity: 0.018, // reduced from 0.026 — less fog wash
    ringFrequency: 0.35,
  },
  floor: {
    brightness: 0.45, // increased from 0.35 — more visible runway
    gridOpacity: 0.28, // increased from 0.18 — more visible grid
    gridSpeed: 0.7,
    railBrightness: 0.55, // increased from 0.45
    bassPulseStrength: 0.22,
    kickFlashColor: "#00E5FF",
    depthLength: 110,
    gridLineCount: 32,
  },
  lasers: {
    count: 2, // sparse — the patches call for control, not chaos
    thickness: 0.01,
    opacity: 0.2,
    speed: 0.25,
    rotationSpeed: 0.08,
    trebleFlickerStrength: 0.25,
    greenAccentFrequency: 0,
    beamLength: 28,
  },
  equalizer: {
    barCount: 10, // halved from 18
    heightMultiplier: 1.5,
    opacity: 0.22,
    bassWeight: 0.7,
    midsWeight: 0.5,
    trebleWeight: 0.35,
    sideDistance: 6.4, // pushed further out so they don't dominate
    movementSpeed: 0.35,
    greenAccentThreshold: 0.9,
  },
  postfx: {
    bloomStrength: 0.32, // reduced from 0.42
    bloomRadius: 0.32,
    bloomThreshold: 0.45, // raised from 0.32 — only the brightest bloom
    lightIntensity: 0.9,
    beatFlashStrength: 0.12,
    fogDensity: 0.018,
    glitchAmount: 0,
    screenFlashOpacity: 0.04,
  },
  reactivity: {
    energyToSpeed: 0.85,
    energyToBackground: 0.18,
    bassToPulse: 0.75,
    bassToCamera: 0.55,
    bassToBloom: 0.45,
    midsToTwist: 0.4, // reduced from 0.55
    midsToTurns: 0.15, // reduced from 0.3
    trebleToParticles: 0.6,
    trebleToSparkle: 0.65,
  },
};

const PRESET_OVERRIDES: Record<VisualPresetId, Partial<PresetShape>> = {
  minimal: {},
  club: {
    preset: "club",
    palette: {
      ...MINIMAL_DARK_PRESET.palette,
      primary: "#35E8FF",
      secondary: "#D04CFF",
      accent: "#FFFFFF",
    },
    tunnel: {
      ...MINIMAL_DARK_PRESET.tunnel,
      speed: 1.0,
      pulseScale: 0.13,
      pulseStrength: 0.13,
      segmentOpacity: 0.5,
      panelOpacity: 0.1,
    },
    particles: {
      ...MINIMAL_DARK_PRESET.particles,
      count: 600,
      speed: 1,
      opacity: 0.42,
    },
    floor: {
      ...MINIMAL_DARK_PRESET.floor,
      brightness: 0.58,
      gridOpacity: 0.32,
      railBrightness: 0.65,
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
      bloom: 0.42,
      intensity: 1.05,
      beatFlash: 0.18,
    },
    postfx: {
      ...MINIMAL_DARK_PRESET.postfx,
      bloomStrength: 0.42,
      lightIntensity: 1.05,
      beatFlashStrength: 0.18,
    },
  },
  intense: {
    preset: "intense",
    palette: {
      ...MINIMAL_DARK_PRESET.palette,
      primary: "#00E5FF",
      secondary: "#FF2EAB",
      accent: "#FFFFFF",
    },
    tunnel: {
      ...MINIMAL_DARK_PRESET.tunnel,
      speed: 1.5,
      frameCount: 40,
      pulseScale: 0.18,
      pulseStrength: 0.18,
      twist: 0.1,
      twistAmount: 0.1,
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
      count: 900,
      speed: 1.4,
      opacity: 0.54,
      sparkle: 0.58,
      sparkleStrength: 0.58,
    },
    floor: {
      ...MINIMAL_DARK_PRESET.floor,
      brightness: 0.7,
      gridOpacity: 0.36,
      gridSpeed: 1.1,
      railBrightness: 0.78,
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
      bloom: 0.55,
      intensity: 1.35,
      beatFlash: 0.26,
    },
    effects: {
      ...MINIMAL_DARK_PRESET.effects,
      ringFrequency: 0.75,
    },
    postfx: {
      ...MINIMAL_DARK_PRESET.postfx,
      bloomStrength: 0.55,
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

export function createVisualConfig(
  themeId: ThemeId,
  themeName: string,
  preset: VisualPresetId = "minimal",
): VisualConfig {
  return {
    themeId,
    themeName,
    ...mergePreset(preset),
  };
}

/**
 * Apply a preset while preserving the themeId and the displayed theme name.
 * Previously this overwrote themeName, hiding the detected theme from the
 * user.  We only fall back to the preset name when no theme name was given.
 */
export function applyVisualPreset(
  config: VisualConfig,
  preset: VisualPresetId,
): VisualConfig {
  const merged = mergePreset(preset);
  const fallback =
    preset === "minimal"
      ? "Minimal Modern Tunnel"
      : preset === "club"
        ? "Modern Club Tunnel"
        : "Intense Modern Tunnel";
  // Only overwrite themeName if it's empty or matches one of the old preset
  // fallbacks (so a previously-saved minimal "Minimal Modern Tunnel" still
  // gets replaced correctly).
  const looksStale =
    !config.themeName ||
    config.themeName === fallback ||
    config.themeName === "Minimal Modern Tunnel" ||
    config.themeName === "Modern Club Tunnel" ||
    config.themeName === "Intense Modern Tunnel";
  return {
    ...config,
    ...merged,
    themeId: config.themeId,
    themeName: looksStale ? fallback : config.themeName,
  };
}
