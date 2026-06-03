export type ThemeId =
  | 'brazilian-phonk'
  | 'dead-disco'
  | 'cyber-runner'
  | 'dark-bass'
  | 'dream-neon';

export type MusicProfile = {
  bpm: number;
  energy: number;        // 0..1
  bass: number;          // 0..1
  mids: number;          // 0..1
  treble: number;        // 0..1
  brightness: number;    // 0..1
  density: number;       // 0..1
  dynamicRange: number;  // 0..1
  moodTags: string[];
  themeGuess: ThemeId;
};
