import { useState, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { useVibeStore } from './store/useVibeStore';
import type { ThemeId } from './audio/types';
import { audioEngine } from './audio/AudioEngine';
import { analyzeAudioFile } from './audio/vibeEngine';
import { configFromVibe } from './visual/configFromVibe';
import type { VisualConfig } from './visual/VisualConfig';
import type { VisualPresetId } from './visual/VisualConfig';
import { applyVisualPreset } from './visual/visualPresets';
import VibeCanvas from './scene/VibeCanvas';
import MetricsPanel from './ui/MetricsPanel';
import './app/styles.css';

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

type ColorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

type TunnelNumberKey = Exclude<keyof VisualConfig['tunnel'], 'shape'>;
type CameraNumberKey = keyof VisualConfig['camera'];
type ParticleNumberKey = keyof VisualConfig['particles'];
type FloorNumberKey = Exclude<keyof VisualConfig['floor'], 'kickFlashColor'>;
type LaserNumberKey = keyof VisualConfig['lasers'];
type PostFxNumberKey = keyof VisualConfig['postfx'];
type ReactivityNumberKey = keyof VisualConfig['reactivity'];

function SliderControl({ label, value, min, max, step, onChange }: SliderProps) {
  return (
    <label className="tuner-control">
      <span className="tuner-control__head">
        <span>{label}</span>
        <span>{Number.isInteger(step) ? Math.round(value) : value.toFixed(2)}</span>
      </span>
      <span className="tuner-control__row">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isInteger(step) ? Math.round(value) : Number(value.toFixed(2))}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </span>
    </label>
  );
}

function ColorControl({ label, value, onChange }: ColorProps) {
  return (
    <label className="tuner-color">
      <span>{label}</span>
      <span className="tuner-color__row">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      </span>
    </label>
  );
}

export default function App() {
  const {
    fileName,
    isPlaying,
    musicProfile,
    visualConfig,
    manualBpm,
    bpmOverrideActive,
    isAnalyzing,
    analysisStage,
    setFileName,
    setIsPlaying,
    setMusicProfile,
    setVisualConfig,
    setManualBpm,
    setBpmOverrideActive,
    setIsAnalyzing,
    setAnalysisStage,
    reset,
  } = useVibeStore();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showTunnel, setShowTunnel] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTuner, setShowTuner] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mappings for theme details
  const themeDetails: Record<ThemeId, { name: string; colors: string[]; moods: string[] }> = {
    'brazilian-phonk': {
      name: 'Brazilian Phonk Dark Concert',
      colors: ['#ff1ac6', '#00e5ff', '#39ff14'],
      moods: ['aggressive', 'dark', 'fast', 'chaotic'],
    },
    'dead-disco': {
      name: 'Dead Disco Club',
      colors: ['#c77dff', '#ffd166', '#00f5d4'],
      moods: ['groovy', 'spooky', 'stylish', 'dancefloor'],
    },
    'cyber-runner': {
      name: 'Cyber Runner',
      colors: ['#00e5ff', '#0066ff', '#ffffff'],
      moods: ['futuristic', 'clean', 'laser', 'high-speed'],
    },
    'dark-bass': {
      name: 'Dark Bass Ritual',
      colors: ['#ff0033', '#6d00ff', '#ff7a00'],
      moods: ['heavy', 'underground', 'ritual', 'smoky'],
    },
    'dream-neon': {
      name: 'Dream Neon Drift',
      colors: ['#80ffdb', '#b8c0ff', '#ffafcc'],
      moods: ['floaty', 'emotional', 'smooth', 'dreamy'],
    },
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (validTypes.includes(file.type) || ['mp3', 'wav'].includes(fileExt || '')) {
      setSelectedFile(file);
      setFileName(file.name);
    } else {
      setErrorMsg('Please upload a valid MP3 or WAV file.');
      setSelectedFile(null);
      setFileName(null);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setErrorMsg(null);

    try {
      // Run browser decoding & peak analysis
      const profile = await analyzeAudioFile(selectedFile, (stage, progress) => {
        setAnalysisStage(stage);
        setAnalysisProgress(progress);
      });

      // Handle override
      if (bpmOverrideActive) {
        profile.bpm = manualBpm;
      } else {
        setManualBpm(profile.bpm);
      }

      // Configure playback structures
      const config = configFromVibe(profile);

      // Load file into Web Audio play source
      await audioEngine.loadFile(selectedFile);
      audioEngine.setBpm(profile.bpm);

      setMusicProfile(profile);
      setVisualConfig(config);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error processing audio file. Make sure it is not corrupted.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStage(null);
    }
  };

  const handleEnterTunnel = () => {
    setShowTunnel(true);
    setIsPlaying(true);
    audioEngine.play().catch((err) => {
      console.error('Audio play failed:', err);
      setIsPlaying(false);
    });
  };

  const handleBackToSetup = () => {
    setShowTunnel(false);
    setShowTuner(false);
    setIsPlaying(false);
    audioEngine.dispose();
    reset();
    setSelectedFile(null);
    setAnalysisProgress(0);
  };

  const handlePlayPause = () => {
    audioEngine.toggle();
    setIsPlaying(!audioEngine.isPaused());
  };

  const updateVisual = (updater: (config: VisualConfig) => VisualConfig) => {
    if (!visualConfig) return;
    setVisualConfig(updater(visualConfig));
  };

  const updatePalette = (key: keyof VisualConfig['palette'], value: string) => {
    updateVisual((config) => ({
      ...config,
      palette: {
        ...config.palette,
        [key]: value,
      },
    }));
  };

  const updateTunnelNumber = (key: TunnelNumberKey, value: number) => {
    updateVisual((config) => ({
      ...config,
      tunnel: {
        ...config.tunnel,
        [key]: value,
      },
    }));
  };

  const updateTunnelPulse = (value: number) => {
    updateVisual((config) => ({
      ...config,
      tunnel: {
        ...config.tunnel,
        pulseScale: value,
        pulseStrength: value,
      },
    }));
  };

  const updateTunnelShape = (shape: VisualConfig['tunnel']['shape']) => {
    updateVisual((config) => ({
      ...config,
      tunnel: {
        ...config.tunnel,
        shape,
      },
    }));
  };

  const updateCameraNumber = (key: CameraNumberKey, value: number) => {
    updateVisual((config) => ({
      ...config,
      camera: {
        ...config.camera,
        [key]: value,
      },
    }));
  };

  const updateParticleNumber = (key: ParticleNumberKey, value: number) => {
    updateVisual((config) => ({
      ...config,
      particles: {
        ...config.particles,
        [key]: value,
      },
    }));
  };

  const updateFloorNumber = (key: FloorNumberKey, value: number) => {
    updateVisual((config) => ({
      ...config,
      floor: {
        ...config.floor,
        [key]: value,
      },
    }));
  };

  const updateLaserNumber = (key: LaserNumberKey, value: number) => {
    updateVisual((config) => ({
      ...config,
      lasers: {
        ...config.lasers,
        [key]: value,
      },
    }));
  };

  const updatePostFxNumber = (key: PostFxNumberKey, value: number) => {
    updateVisual((config) => ({
      ...config,
      postfx: {
        ...config.postfx,
        [key]: value,
      },
    }));
  };

  const updateReactivityNumber = (key: ReactivityNumberKey, value: number) => {
    updateVisual((config) => ({
      ...config,
      reactivity: {
        ...config.reactivity,
        [key]: value,
      },
    }));
  };

  const updatePreset = (preset: VisualPresetId) => {
    updateVisual((config) => applyVisualPreset(config, preset));
  };

  const resetVisualConfig = () => {
    if (!musicProfile) return;
    setVisualConfig(configFromVibe(musicProfile));
  };

  return (
    <div className="app-container">
      <div className="bg-grid"></div>

      {/* Main R3F Canvas mounting section */}
      <div 
        className="canvas-container" 
        style={{ 
          background: visualConfig?.palette.background || '#030108',
          opacity: showTunnel ? 1 : 0,
          transition: 'opacity 1s ease',
          pointerEvents: showTunnel ? 'auto' : 'none'
        }}
      >
        {showTunnel && <VibeCanvas />}
      </div>

      {/* Setup Glass Panel Dashboard */}
      {!showTunnel && (
        <div className="glass-panel">
          <h1 className="title">VibeTunnel</h1>
          <p className="subtitle">Upload a song. Enter the world it creates.</p>

          {!musicProfile && !isAnalyzing && (
            <>
              <div 
                className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
              >
                <input 
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  accept=".mp3,.wav"
                  onChange={handleChange}
                />
                <div className="upload-icon">🎵</div>
                <div className="upload-text">
                  {fileName ? (
                    <span className="file-name">{fileName}</span>
                  ) : (
                    'Drag and drop an MP3/WAV here, or click to browse'
                  )}
                </div>
              </div>

              {errorMsg && <p style={{ color: '#ff4d6d', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{errorMsg}</p>}

              <div className="controls-row">
                <div className="input-group">
                  <label className="input-label">BPM Override</label>
                  <input
                    type="number"
                    className="number-input"
                    value={manualBpm}
                    onChange={(e) => setManualBpm(parseInt(e.target.value) || 128)}
                    disabled={!bpmOverrideActive}
                  />
                </div>
                <div className="input-group" style={{ flex: '0 0 auto', flexDirection: 'row', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <input
                    type="checkbox"
                    id="bpmOverride"
                    checked={bpmOverrideActive}
                    onChange={(e) => setBpmOverrideActive(e.target.checked)}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <label htmlFor="bpmOverride" style={{ fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>Use manual BPM</label>
                </div>
              </div>

              <button 
                className="btn-primary" 
                disabled={!selectedFile}
                onClick={startAnalysis}
              >
                Analyze & Enter
              </button>
            </>
          )}

          {isAnalyzing && (
            <div className="loading-container">
              <div className="loading-stage">{analysisStage}</div>
              <div className="loading-bar-outer">
                <div className="loading-bar-inner" style={{ width: `${analysisProgress}%` }}></div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Analyzing musical features...</p>
            </div>
          )}

          {musicProfile && !isAnalyzing && (
            <div className="vibe-result-card">
              <div className="result-header">
                <span className="result-theme">{themeDetails[musicProfile.themeGuess].name}</span>
                <span className="metric-val" style={{ color: 'var(--primary-glow)', textShadow: '0 0 5px rgba(255,0,170,0.3)' }}>
                  {musicProfile.bpm} BPM
                </span>
              </div>

              <div className="metric-grid">
                <div className="metric-item">
                  <div className="metric-title">Energy</div>
                  <div className="metric-val">{Math.round(musicProfile.energy * 100)}%</div>
                </div>
                <div className="metric-item">
                  <div className="metric-title">Bass response</div>
                  <div className="metric-val">{Math.round(musicProfile.bass * 100)}%</div>
                </div>
                <div className="metric-item">
                  <div className="metric-title">Treble/Brightness</div>
                  <div className="metric-val">{Math.round(musicProfile.treble * 100)}%</div>
                </div>
                <div className="metric-item">
                  <div className="metric-title">Rhythm Density</div>
                  <div className="metric-val">{Math.round(musicProfile.density * 100)}%</div>
                </div>
              </div>

              <div>
                <div className="metric-title">Detected Moods</div>
                <div className="mood-tags">
                  {musicProfile.moodTags.map((mood) => (
                    <span key={mood} className="mood-tag">{mood}</span>
                  ))}
                </div>
              </div>

              <div>
                <div className="metric-title">Visual Swatches</div>
                <div className="swatches">
                  {themeDetails[musicProfile.themeGuess].colors.map((color, idx) => (
                    <div 
                      key={idx} 
                      className="swatch" 
                      style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                    />
                  ))}
                </div>
              </div>

              <button 
                className="btn-primary" 
                style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, var(--secondary-glow) 0%, var(--primary-glow) 100%)', boxShadow: '0 4px 15px rgba(0,245,212,0.3)' }}
                onClick={handleEnterTunnel}
              >
                Enter Visual Tunnel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Minimal HUD overlay inside Visual Tunnel */}
      {showTunnel && (
        <div className="hud-overlay">
          <div className="hud-header hud-item">
            <button className="btn-back" onClick={handleBackToSetup}>← Back</button>
            <div className="hud-theme-badge">
              {visualConfig?.themeName}
            </div>
            <MetricsPanel bpm={musicProfile?.bpm ?? manualBpm} isPlaying={isPlaying} />
          </div>

          <div className="hud-controls hud-item">
            <button className="btn-circle" onClick={handlePlayPause}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="btn-tuner" onClick={() => setShowTuner((open) => !open)}>
              Tune
            </button>
            <button className="btn-tuner" onClick={handleBackToSetup}>
              Upload
            </button>
          </div>

          {showTuner && visualConfig && (
            <div className="tuner-panel hud-item">
              <div className="tuner-panel__header">
                <div>
                  <div className="tuner-title">Tune</div>
                  <div className="tuner-subtitle">Minimal visual metrics</div>
                </div>
                <button className="tuner-close" onClick={() => setShowTuner(false)}>x</button>
              </div>

              <div className="tuner-section">
                <div className="tuner-section__title">Preset</div>
                <div className="preset-switch">
                  {(['minimal', 'club', 'intense'] as VisualPresetId[]).map((preset) => (
                    <button
                      key={preset}
                      className={`preset-switch__button ${visualConfig.preset === preset ? 'is-active' : ''}`}
                      onClick={() => updatePreset(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tuner-section">
                <div className="tuner-section__title">Core Motion</div>
                <label className="tuner-select">
                  <span>Shape</span>
                  <select value={visualConfig.tunnel.shape} onChange={(e) => updateTunnelShape(e.target.value as VisualConfig['tunnel']['shape'])}>
                    <option value="circle">Circle</option>
                    <option value="rect">Rect</option>
                    <option value="triangle">Triangle</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </label>
                <SliderControl label="Tunnel speed" value={visualConfig.tunnel.speed} min={0.2} max={2.4} step={0.05} onChange={(value) => updateTunnelNumber('speed', value)} />
                <SliderControl label="Bass pulse" value={visualConfig.tunnel.pulseStrength} min={0} max={0.28} step={0.01} onChange={updateTunnelPulse} />
                <SliderControl label="Frame density" value={visualConfig.tunnel.frameCount} min={18} max={52} step={1} onChange={(value) => updateTunnelNumber('frameCount', value)} />
              </div>

              <div className="tuner-section">
                <div className="tuner-section__title">Scene Intensity</div>
                <SliderControl label="Bloom strength" value={visualConfig.postfx.bloomStrength} min={0.2} max={0.9} step={0.01} onChange={(value) => updatePostFxNumber('bloomStrength', value)} />
                <SliderControl label="Floor brightness" value={visualConfig.floor.brightness} min={0.05} max={0.9} step={0.01} onChange={(value) => updateFloorNumber('brightness', value)} />
                <SliderControl label="Particle amount" value={visualConfig.particles.count} min={80} max={900} step={20} onChange={(value) => updateParticleNumber('count', value)} />
                <SliderControl label="Laser opacity" value={visualConfig.lasers.opacity} min={0} max={0.5} step={0.01} onChange={(value) => updateLaserNumber('opacity', value)} />
                <SliderControl label="Camera shake" value={visualConfig.camera.shake} min={0} max={0.18} step={0.005} onChange={(value) => updateCameraNumber('shake', value)} />
              </div>

              <div className="tuner-section">
                <div className="tuner-section__title">Palette</div>
                <ColorControl label="Background" value={visualConfig.palette.background} onChange={(value) => updatePalette('background', value)} />
                <ColorControl label="Tunnel neon" value={visualConfig.palette.primary} onChange={(value) => updatePalette('primary', value)} />
                <ColorControl label="Accent neon" value={visualConfig.palette.secondary} onChange={(value) => updatePalette('secondary', value)} />
              </div>

              <div className="tuner-section">
                <div className="tuner-section__title">Audio Links</div>
                <SliderControl label="Energy -> speed" value={visualConfig.reactivity.energyToSpeed} min={0} max={2} step={0.05} onChange={(value) => updateReactivityNumber('energyToSpeed', value)} />
                <SliderControl label="Bass -> pulse" value={visualConfig.reactivity.bassToPulse} min={0} max={2} step={0.05} onChange={(value) => updateReactivityNumber('bassToPulse', value)} />
                <SliderControl label="Mids -> twist" value={visualConfig.reactivity.midsToTwist} min={0} max={2} step={0.05} onChange={(value) => updateReactivityNumber('midsToTwist', value)} />
                <SliderControl label="Treble -> sparkle" value={visualConfig.reactivity.trebleToSparkle} min={0} max={2} step={0.05} onChange={(value) => updateReactivityNumber('trebleToSparkle', value)} />
              </div>

              <button className="tuner-reset" onClick={resetVisualConfig}>
                Reset Minimal
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
