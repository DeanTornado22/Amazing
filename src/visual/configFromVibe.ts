import type { MusicProfile } from '../audio/types';
import type { VisualConfig } from './VisualConfig';
import { createVisualConfig } from './visualPresets';

export function configFromVibe(profile: MusicProfile): VisualConfig {
  const config = createVisualConfig(profile.themeGuess, 'Minimal Modern Tunnel', 'minimal');

  return {
    ...config,
    tunnel: {
      ...config.tunnel,
      speed: config.tunnel.speed * (0.9 + profile.energy * 0.18),
      pulseScale: config.tunnel.pulseScale * (0.9 + profile.bass * 0.18),
      pulseStrength: config.tunnel.pulseStrength * (0.9 + profile.bass * 0.18),
    },
    particles: {
      ...config.particles,
      count: Math.round(config.particles.count * (0.9 + profile.density * 0.18)),
    },
    equalizer: {
      ...config.equalizer,
      heightMultiplier: config.equalizer.heightMultiplier * (0.92 + profile.density * 0.18),
    },
  };
}
