import { useEffect, useState, useRef, Suspense, lazy } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useVibeStore } from "./store/useVibeStore";
import { audioEngine, currentAudioData } from "./audio/AudioEngine";
import { beatSurpriseState } from "./audio/beatSurpriseState";
import { sectionTracker } from "./audio/sectionTracker";
import type { SectionId } from "./audio/sectionTracker";
import { analyzeAudioFile } from "./audio/vibeEngine";
import { configFromVibe } from "./visual/configFromVibe";
import type { VisualConfig } from "./visual/VisualConfig";
import type { VisualPresetId } from "./visual/VisualConfig";
import { applyVisualPreset } from "./visual/visualPresets";
import { THEME_DETAILS, isAcceptedAudioFile } from "./utils/themeDetails";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useAutoHide } from "./hooks/useAutoHide";
import ErrorBoundary from "./ui/ErrorBoundary";
import LiveHUD from "./ui/LiveHUD";
import WaveformPanel from "./ui/WaveformPanel";
import TunerPanel from "./ui/TunerPanel";
import ShortcutHelp from "./ui/ShortcutHelp";
import SeekAndVolume from "./ui/SeekAndVolume";
import DebugOverlay from "./ui/DebugOverlay";
import { safeSetJSON } from "./utils/safeLocalStorage";
import "./app/styles.css";

// Lazy-load the heavy 3D canvas so the upload screen ships without
// pulling in Three.js, R3F, postprocessing, and GSAP.
const VibeCanvas = lazy(() => import("./scene/VibeCanvas"));

const PERSIST_KEY = "vibetunnel:visualConfig:v2";

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
    tapProgress,
    liveBpm,
    bpmLocked,
    photosensitiveMode,
    isRecording,
    autoPreset,
    showDebug,
    showShortcutHelp,
    setFileName,
    setIsPlaying,
    setMusicProfile,
    setVisualConfig,
    setManualBpm,
    setBpmOverrideActive,
    setIsAnalyzing,
    setAnalysisStage,
    setTapProgress,
    setLiveBpm,
    setBpmLocked,
    setPhotosensitiveMode,
    setIsRecording,
    setShowDebug,
    setShowShortcutHelp,
    reset,
  } = useVibeStore();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showTunnel, setShowTunnel] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTuner, setShowTuner] = useState(false);
  const [currentSection, setCurrentSection] = useState<SectionId>("intro");
  const [barsInSection, setBarsInSection] = useState(0);
  // HUD chrome: back button stays always-visible. Everything else auto-hides.
  const [hudCollapsed, setHudCollapsed] = useState(true);
  const [waveformVisible, setWaveformVisible] = useState(false);
  const [hudForced, setHudForced] = useState(false); // `H` key toggles
  const hud = useAutoHide({ visibleMs: 2200, enabled: !hudForced });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived: is the HUD currently visible to the user?
  const isHudVisible = hudForced || hud.visible;

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);
    if (isAcceptedAudioFile(file)) {
      setSelectedFile(file);
      setFileName(file.name);
    } else {
      setErrorMsg(
        "Please upload a valid audio file (MP3, WAV, M4A, AAC, OGG, or FLAC).",
      );
      setSelectedFile(null);
      setFileName(null);
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
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
      const profile = await analyzeAudioFile(
        selectedFile,
        (stage, progress) => {
          setAnalysisStage(stage);
          setAnalysisProgress(progress);
        },
      );

      if (bpmOverrideActive) {
        profile.bpm = manualBpm;
      } else {
        setManualBpm(profile.bpm);
      }

      const config = configFromVibe(profile);

      await audioEngine.loadFile(selectedFile);
      audioEngine.setBpm(profile.bpm);
      audioEngine.setDetectedBpm(profile.bpm);

      setMusicProfile(profile);
      setVisualConfig(config);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        "Error processing audio file. Make sure it is not corrupted.",
      );
    } finally {
      setIsAnalyzing(false);
      setAnalysisStage(null);
    }
  };

  const handleEnterTunnel = () => {
    setShowTunnel(true);
    setIsPlaying(true);
    audioEngine.play().catch((err) => {
      console.error("Audio play failed:", err);
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

  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      window.dispatchEvent(new CustomEvent("vibetunnel:stop-record"));
    } else {
      setIsRecording(true);
      window.dispatchEvent(new CustomEvent("vibetunnel:start-record"));
    }
  };

  const handleTogglePhotosensitive = () => {
    setPhotosensitiveMode(!photosensitiveMode);
  };

  const handleTap = () => {
    const t = currentAudioData.currentTime;
    const now = performance.now() / 1000;
    const result = audioEngine.tap(t, now);
    if (result) {
      setManualBpm(result.bpm);
      setLiveBpm(result.bpm);
      const next = Math.min(4, tapProgress + 1);
      setTapProgress(next);
      if (next >= 4) setBpmLocked(true);
    } else {
      setTapProgress(1);
    }
  };

  const handleNudge = (deltaMs: number) => {
    audioEngine.nudgeBeatOrigin(deltaMs);
  };

  const updateVisual = (updater: (config: VisualConfig) => VisualConfig) => {
    if (!visualConfig) return;
    const next = updater(visualConfig);
    setVisualConfig(next);
    safeSetJSON(PERSIST_KEY, next);
  };

  const resetVisualConfig = () => {
    if (!musicProfile) return;
    const next = configFromVibe(musicProfile);
    setVisualConfig(next);
    safeSetJSON(PERSIST_KEY, next);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      const bpm = currentAudioData.bpm;
      if (bpm > 0) setLiveBpm(Math.round(bpm));
      setBpmLocked(currentAudioData.bpmConfidence >= 1);
    }, 200);
    return () => window.clearInterval(id);
  }, [isPlaying, setLiveBpm, setBpmLocked]);

  useEffect(() => {
    beatSurpriseState.safetyScale = photosensitiveMode ? 0.3 : 1;
  }, [photosensitiveMode]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      const next = sectionTracker.state.section;
      if (next !== currentSection) {
        setCurrentSection(next);
        if (autoPreset && visualConfig) {
          const target: VisualPresetId =
            next === "drop" || next === "chorus"
              ? "intense"
              : next === "build"
                ? "club"
                : next === "intro" || next === "breakdown" || next === "outro"
                  ? "minimal"
                  : "club";
          if (target !== visualConfig.preset) {
            setVisualConfig(applyVisualPreset(visualConfig, target));
          }
        }
      }
      setBarsInSection(sectionTracker.state.barsInSection);
    }, 250);
    return () => window.clearInterval(id);
  }, [isPlaying, currentSection, autoPreset, visualConfig, setVisualConfig]);

  // Keyboard shortcuts: space=play/pause, T=tuner, M=mute, D=debug, ?=help,
  // ← →=nudge, H=force HUD, W=toggle waveform panel.
  useKeyboardShortcuts({
    space: handlePlayPause,
    t: () => setShowTuner((v) => !v),
    m: () => audioEngine.setVolume(audioEngine.getVolume() > 0 ? 0 : 0.8),
    d: () => setShowDebug(!showDebug),
    "?": () => setShowShortcutHelp(!showShortcutHelp),
    h: () => setHudForced((v) => !v),
    w: () => setWaveformVisible((v) => !v),
    escape: () => {
      setShowTuner(false);
      setShowShortcutHelp(false);
    },
    arrowleft: () => handleNudge(-20),
    arrowright: () => handleNudge(20),
  });

  return (
    <div className="app-container">
      <div className="bg-grid" />

      <div
        className="canvas-container"
        style={{
          background: visualConfig?.palette.background || "#000000",
          opacity: showTunnel ? 1 : 0,
          transition: "opacity 1s ease",
          pointerEvents: showTunnel ? "auto" : "none",
        }}
      >
        {showTunnel && (
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="canvas-loading">
                  <div className="canvas-loading__spinner" />
                  <div className="canvas-loading__text">
                    Loading visualizer…
                  </div>
                </div>
              }
            >
              <VibeCanvas />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>

      <DebugOverlay visible={showDebug && showTunnel} />

      {!showTunnel && (
        <div className="glass-panel">
          <h1 className="title">VibeTunnel</h1>
          <p className="subtitle">Upload a song. Enter the world it creates.</p>

          {!musicProfile && !isAnalyzing && (
            <>
              <div
                className={`upload-zone ${dragActive ? "drag-active" : ""}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: "none" }}
                  accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,.oga,.opus"
                  onChange={handleChange}
                />
                <div className="upload-icon">🎵</div>
                <div className="upload-text">
                  {fileName ? (
                    <span className="file-name">{fileName}</span>
                  ) : (
                    "Drag and drop an audio file, or click to browse"
                  )}
                </div>
              </div>

              {errorMsg && (
                <p
                  style={{
                    color: "#ff4d6d",
                    fontSize: "0.85rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  {errorMsg}
                </p>
              )}

              <div className="controls-row">
                <div className="input-group">
                  <label className="input-label">BPM Override</label>
                  <input
                    type="number"
                    className="number-input"
                    value={manualBpm}
                    onChange={(e) =>
                      setManualBpm(parseInt(e.target.value) || 120)
                    }
                    disabled={!bpmOverrideActive}
                  />
                </div>
                <div
                  className="input-group"
                  style={{
                    flex: "0 0 auto",
                    flexDirection: "row",
                    gap: "0.5rem",
                    marginTop: "1.5rem",
                  }}
                >
                  <input
                    type="checkbox"
                    id="bpmOverride"
                    checked={bpmOverrideActive}
                    onChange={(e) => setBpmOverrideActive(e.target.checked)}
                    style={{ cursor: "pointer", width: "18px", height: "18px" }}
                  />
                  <label
                    htmlFor="bpmOverride"
                    style={{
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    Use manual BPM
                  </label>
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
                <div
                  className="loading-bar-inner"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Analyzing musical features...
              </p>
            </div>
          )}

          {musicProfile && !isAnalyzing && (
            <div className="vibe-result-card">
              <div className="result-header">
                <span className="result-theme">
                  {THEME_DETAILS[musicProfile.themeGuess].name}
                </span>
                <span
                  className="metric-val"
                  style={{
                    color: "var(--primary-glow)",
                    textShadow: "0 0 5px rgba(255,0,170,0.3)",
                  }}
                >
                  {musicProfile.bpm} BPM
                </span>
              </div>

              <div className="metric-grid">
                <div className="metric-item">
                  <div className="metric-title">Energy</div>
                  <div className="metric-val">
                    {Math.round(musicProfile.energy * 100)}%
                  </div>
                </div>
                <div className="metric-item">
                  <div className="metric-title">Bass response</div>
                  <div className="metric-val">
                    {Math.round(musicProfile.bass * 100)}%
                  </div>
                </div>
                <div className="metric-item">
                  <div className="metric-title">Treble/Brightness</div>
                  <div className="metric-val">
                    {Math.round(musicProfile.treble * 100)}%
                  </div>
                </div>
                <div className="metric-item">
                  <div className="metric-title">Rhythm Density</div>
                  <div className="metric-val">
                    {Math.round(musicProfile.density * 100)}%
                  </div>
                </div>
              </div>

              <div>
                <div className="metric-title">Detected Moods</div>
                <div className="mood-tags">
                  {musicProfile.moodTags.map((mood) => (
                    <span key={mood} className="mood-tag">
                      {mood}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="metric-title">Visual Swatches</div>
                <div className="swatches">
                  {THEME_DETAILS[musicProfile.themeGuess].colors.map(
                    (color, idx) => (
                      <div
                        key={idx}
                        className="swatch"
                        style={{
                          backgroundColor: color,
                          boxShadow: `0 0 8px ${color}`,
                        }}
                      />
                    ),
                  )}
                </div>
              </div>

              <button
                className="btn-primary"
                style={{
                  marginTop: "1.5rem",
                  background:
                    "linear-gradient(135deg, var(--secondary-glow) 0%, var(--primary-glow) 100%)",
                  boxShadow: "0 4px 15px rgba(0,245,212,0.3)",
                }}
                onClick={handleEnterTunnel}
              >
                Enter Visual Tunnel
              </button>
            </div>
          )}
        </div>
      )}

      {showTunnel && (
        <div
          className={`hud-overlay ${isHudVisible ? "" : "is-hidden"}`}
          aria-hidden={!isHudVisible}
        >
          {/* Top row: back (left) | badge (center) | metrics (right) */}
          <div className="hud-top-row">
            <button
              className="btn-back btn-back--always"
              onClick={handleBackToSetup}
            >
              ← Back
            </button>

            <div
              className={`hud-theme-badge ${isHudVisible ? "" : "is-fading"}`}
            >
              {visualConfig?.themeName}
              <span className="hud-section-pill" data-section={currentSection}>
                {currentSection.toUpperCase()} · {barsInSection} BAR
                {barsInSection === 1 ? "" : "S"}
              </span>
            </div>

            <div
              className={`hud-right-stack ${isHudVisible ? "" : "is-fading"}`}
            >
              <LiveHUD
                bpm={liveBpm || (musicProfile?.bpm ?? manualBpm)}
                bpmLocked={bpmLocked}
                tapProgress={tapProgress}
                isPlaying={isPlaying}
                onTap={handleTap}
                onNudge={handleNudge}
                collapsed={hudCollapsed}
                onToggleCollapsed={() => setHudCollapsed((v) => !v)}
              />
            </div>
          </div>

          {/* Central minimal control dock — tiny, auto-hides */}
          <div
            className={`hud-controls hud-controls--minimal ${
              isHudVisible ? "" : "is-fading"
            }`}
          >
            <button
              className="btn-circle btn-circle--sm"
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              className="btn-tuner btn-tuner--sm"
              onClick={() => setShowTuner((open) => !open)}
              title="Tune"
            >
              TUNE
            </button>
            <button
              className="btn-tuner btn-tuner--sm"
              onClick={handleBackToSetup}
              title="Upload a new song"
            >
              UP
            </button>
            <button
              className={`btn-tuner btn-tuner--sm ${
                isRecording ? "is-recording" : ""
              }`}
              onClick={handleToggleRecord}
              title="Record"
            >
              {isRecording ? "■" : "●"}
            </button>
            <button
              className={`btn-tuner btn-tuner--sm ${
                photosensitiveMode ? "is-safe" : ""
              }`}
              onClick={handleTogglePhotosensitive}
              title="Photosensitive mode"
            >
              {photosensitiveMode ? "✓" : "🛡"}
            </button>
            <button
              className="btn-tuner btn-tuner--sm"
              onClick={() => setShowShortcutHelp(true)}
              title="Shortcuts (?)"
            >
              ?
            </button>
          </div>

          {/* Bottom waveform panel — only when explicitly shown (W key) */}
          {waveformVisible && (
            <div className="hud-bottom">
              <SeekAndVolume />
              <WaveformPanel isPlaying={isPlaying} isRecording={isRecording} />
            </div>
          )}

          {showTuner && visualConfig && (
            <TunerPanel
              config={visualConfig}
              onClose={() => setShowTuner(false)}
              onUpdate={updateVisual}
              onReset={resetVisualConfig}
            />
          )}
        </div>
      )}

      {/* Tiny "press H for HUD" hint, only shown on the very first load */}
      {showTunnel && !hudForced && !isHudVisible && (
        <div className="hud-hint" aria-hidden>
          <kbd>H</kbd> show controls · <kbd>W</kbd> show waveform
        </div>
      )}

      <ShortcutHelp />
    </div>
  );
}
