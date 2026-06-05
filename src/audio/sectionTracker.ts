import { currentAudioData } from './AudioEngine';

export type SectionId = 'intro' | 'verse' | 'build' | 'chorus' | 'breakdown' | 'drop' | 'outro';

export type SectionState = {
  section: SectionId;
  /** 0..1 confidence of the current classification */
  confidence: number;
  /** Bars since the current section was entered */
  barsInSection: number;
  /** Time of the most recent section change (audio.currentTime), -1 if none */
  lastSectionChange: number;
  /** Last 16 section labels (newest at end) — useful for HUD timeline */
  history: SectionId[];
};

const SECTION_WINDOW_BEATS = 16; // classify over the last 16 beats
const HISTORY_LEN = 16;

class SectionTrackerImpl {
  state: SectionState = {
    section: 'intro',
    confidence: 0,
    barsInSection: 0,
    lastSectionChange: -1,
    history: new Array(HISTORY_LEN).fill('intro'),
  };

  private lastClassifyBeat = -1;
  private lastBeatAtClassify = -1;
  private energyAtClassify: number[] = [];
  private trebleAtClassify: number[] = [];
  private bassAtClassify: number[] = [];

  private push(arr: number[], v: number) {
    arr.push(v);
    if (arr.length > SECTION_WINDOW_BEATS) arr.shift();
  }

  /**
   * Classify the current musical section using a rolling window of audio
   * features.  Called from AudioEngine.update() right after metrics are
   * computed.  Cheap heuristic — not a full ML model — but good enough to
   * pick "quiet" vs "loud" vs "peak" vs "sparse" sections.
   */
  update() {
    const beatIndex = currentAudioData.beatIndex;
    if (beatIndex < 0) return;

    // On every new beat boundary, sample the current features and reclassify.
    if (beatIndex === this.lastClassifyBeat) return;
    this.lastClassifyBeat = beatIndex;

    this.push(this.energyAtClassify, currentAudioData.energy);
    this.push(this.trebleAtClassify, currentAudioData.treble);
    this.push(this.bassAtClassify, currentAudioData.bass);

    if (this.energyAtClassify.length < 4) return;

    const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
    const recent = (a: number[]) => a.slice(-Math.min(4, a.length));
    const older = (a: number[]) => a.slice(0, Math.max(0, a.length - 4));

    const recentEnergy = avg(recent(this.energyAtClassify));
    const olderEnergy = older(this.energyAtClassify).length > 0 ? avg(older(this.energyAtClassify)) : recentEnergy;
    const recentTreble = avg(recent(this.trebleAtClassify));
    const trend = recentEnergy - olderEnergy;

    let next: SectionId = this.state.section;
    let confidence = 0.5;

    if (currentAudioData.hasDropThisFrame) {
      next = 'drop';
      confidence = 0.95;
    } else if (recentEnergy < 0.18) {
      next = 'intro';
      confidence = 0.7;
    } else if (recentEnergy < 0.35 && Math.abs(trend) < 0.05) {
      next = 'verse';
      confidence = 0.6;
    } else if (trend > 0.12) {
      next = 'build';
      confidence = Math.min(0.9, 0.5 + trend);
    } else if (recentEnergy > 0.6 && recentTreble > 0.3) {
      next = 'chorus';
      confidence = Math.min(0.9, 0.5 + recentEnergy * 0.5);
    } else if (recentEnergy < 0.3 && trend < -0.1) {
      next = 'breakdown';
      confidence = 0.65;
    } else if (trend < -0.15) {
      next = 'outro';
      confidence = 0.55;
    }

    // Debounce: only switch sections if confidence beats current by a margin
    // or the candidate has been stable for several beats.
    if (next !== this.state.section) {
      if (this.state.lastSectionChange < 0) {
        this.commit(next, confidence, beatIndex);
      } else {
        // Require >= 1 bar in the previous section before switching
        if (beatIndex - this.lastBeatAtClassify > 4) {
          this.commit(next, confidence, beatIndex);
        }
      }
    }
  }

  private commit(next: SectionId, confidence: number, beatIndex: number) {
    this.state.section = next;
    this.state.confidence = confidence;
    this.state.barsInSection = 0;
    this.state.lastSectionChange = currentAudioData.currentTime;
    this.lastBeatAtClassify = beatIndex;
    this.state.history.push(next);
    if (this.state.history.length > HISTORY_LEN) this.state.history.shift();
  }

  /**
   * Increment barsInSection based on beats elapsed since last commit.
   * Cheaper than update() — call every frame.
   */
  tick() {
    const beatIndex = currentAudioData.beatIndex;
    if (this.lastBeatAtClassify >= 0) {
      this.state.barsInSection = Math.floor((beatIndex - this.lastBeatAtClassify) / 4);
    }
  }

  reset() {
    this.state = {
      section: 'intro',
      confidence: 0,
      barsInSection: 0,
      lastSectionChange: -1,
      history: new Array(HISTORY_LEN).fill('intro'),
    };
    this.lastClassifyBeat = -1;
    this.lastBeatAtClassify = -1;
    this.energyAtClassify = [];
    this.trebleAtClassify = [];
    this.bassAtClassify = [];
  }
}

export const sectionTracker = new SectionTrackerImpl();
