import type { VisualConfig, VisualPresetId } from "../visual/VisualConfig";
import { applyVisualPreset } from "../visual/visualPresets";

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

type TunnelNumberKey = Exclude<keyof VisualConfig["tunnel"], "shape">;
type CameraNumberKey = keyof VisualConfig["camera"];
type ParticleNumberKey = keyof VisualConfig["particles"];
type FloorNumberKey = Exclude<keyof VisualConfig["floor"], "kickFlashColor">;
type LaserNumberKey = keyof VisualConfig["lasers"];
type PostFxNumberKey = keyof VisualConfig["postfx"];
type ReactivityNumberKey = keyof VisualConfig["reactivity"];

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: SliderProps) {
  return (
    <label className="tuner-control">
      <span className="tuner-control__head">
        <span>{label}</span>
        <span>
          {Number.isInteger(step) ? Math.round(value) : value.toFixed(2)}
        </span>
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
          value={
            Number.isInteger(step)
              ? Math.round(value)
              : Number(value.toFixed(2))
          }
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
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </span>
    </label>
  );
}

type Props = {
  config: VisualConfig;
  onClose: () => void;
  onUpdate: (updater: (config: VisualConfig) => VisualConfig) => void;
  onReset: () => void;
};

export default function TunerPanel({
  config,
  onClose,
  onUpdate,
  onReset,
}: Props) {
  const updatePalette = (key: keyof VisualConfig["palette"], value: string) => {
    onUpdate((c) => ({
      ...c,
      palette: { ...c.palette, [key]: value },
    }));
  };

  const updateTunnelNumber = (key: TunnelNumberKey, value: number) => {
    onUpdate((c) => ({
      ...c,
      tunnel: { ...c.tunnel, [key]: value },
    }));
  };

  const updateTunnelShape = (shape: VisualConfig["tunnel"]["shape"]) => {
    onUpdate((c) => ({ ...c, tunnel: { ...c.tunnel, shape } }));
  };

  const updateTunnelPulse = (value: number) => {
    onUpdate((c) => ({
      ...c,
      tunnel: { ...c.tunnel, pulseScale: value, pulseStrength: value },
    }));
  };

  const updateCameraNumber = (key: CameraNumberKey, value: number) => {
    onUpdate((c) => ({ ...c, camera: { ...c.camera, [key]: value } }));
  };

  const updateParticleNumber = (key: ParticleNumberKey, value: number) => {
    onUpdate((c) => ({
      ...c,
      particles: { ...c.particles, [key]: value },
    }));
  };

  const updateFloorNumber = (key: FloorNumberKey, value: number) => {
    onUpdate((c) => ({ ...c, floor: { ...c.floor, [key]: value } }));
  };

  const updateLaserNumber = (key: LaserNumberKey, value: number) => {
    onUpdate((c) => ({ ...c, lasers: { ...c.lasers, [key]: value } }));
  };

  const updatePostFxNumber = (key: PostFxNumberKey, value: number) => {
    onUpdate((c) => ({ ...c, postfx: { ...c.postfx, [key]: value } }));
  };

  const updateReactivityNumber = (key: ReactivityNumberKey, value: number) => {
    onUpdate((c) => ({
      ...c,
      reactivity: { ...c.reactivity, [key]: value },
    }));
  };

  const updatePreset = (preset: VisualPresetId) => {
    onUpdate((c) => applyVisualPreset(c, preset));
  };

  return (
    <div className="tuner-panel hud-item">
      <div className="tuner-panel__header">
        <div>
          <div className="tuner-title">Tune</div>
          <div className="tuner-subtitle">Minimal visual metrics</div>
        </div>
        <button
          className="tuner-close"
          onClick={onClose}
          aria-label="Close tuner"
        >
          x
        </button>
      </div>

      <div className="tuner-section">
        <div className="tuner-section__title">Preset</div>
        <div className="preset-switch">
          {(["minimal", "club", "intense"] as VisualPresetId[]).map(
            (preset) => (
              <button
                key={preset}
                className={`preset-switch__button ${config.preset === preset ? "is-active" : ""}`}
                onClick={() => updatePreset(preset)}
              >
                {preset}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="tuner-section">
        <div className="tuner-section__title">Core Motion</div>
        <label className="tuner-select">
          <span>Shape</span>
          <select
            value={config.tunnel.shape}
            onChange={(e) =>
              updateTunnelShape(
                e.target.value as VisualConfig["tunnel"]["shape"],
              )
            }
          >
            <option value="circle">Circle</option>
            <option value="rect">Rect</option>
            <option value="triangle">Triangle</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
        <SliderControl
          label="Tunnel speed"
          value={config.tunnel.speed}
          min={0.25}
          max={3}
          step={0.25}
          onChange={(value) => updateTunnelNumber("speed", value)}
        />
        <SliderControl
          label="Bass pulse"
          value={config.tunnel.pulseStrength}
          min={0}
          max={0.28}
          step={0.01}
          onChange={updateTunnelPulse}
        />
        <SliderControl
          label="Frame density"
          value={config.tunnel.frameCount}
          min={18}
          max={52}
          step={1}
          onChange={(value) => updateTunnelNumber("frameCount", value)}
        />
      </div>

      <div className="tuner-section">
        <div className="tuner-section__title">Scene Intensity</div>
        <SliderControl
          label="Bloom strength"
          value={config.postfx.bloomStrength}
          min={0.2}
          max={0.9}
          step={0.01}
          onChange={(value) => updatePostFxNumber("bloomStrength", value)}
        />
        <SliderControl
          label="Floor brightness"
          value={config.floor.brightness}
          min={0.05}
          max={0.9}
          step={0.01}
          onChange={(value) => updateFloorNumber("brightness", value)}
        />
        <SliderControl
          label="Particle amount"
          value={config.particles.count}
          min={80}
          max={900}
          step={20}
          onChange={(value) => updateParticleNumber("count", value)}
        />
        <SliderControl
          label="Laser opacity"
          value={config.lasers.opacity}
          min={0}
          max={0.5}
          step={0.01}
          onChange={(value) => updateLaserNumber("opacity", value)}
        />
        <SliderControl
          label="Camera shake"
          value={config.camera.shake}
          min={0}
          max={0.18}
          step={0.005}
          onChange={(value) => updateCameraNumber("shake", value)}
        />
      </div>

      <div className="tuner-section">
        <div className="tuner-section__title">Palette</div>
        <ColorControl
          label="Background"
          value={config.palette.background}
          onChange={(value) => updatePalette("background", value)}
        />
        <ColorControl
          label="Tunnel neon"
          value={config.palette.primary}
          onChange={(value) => updatePalette("primary", value)}
        />
        <ColorControl
          label="Accent neon"
          value={config.palette.secondary}
          onChange={(value) => updatePalette("secondary", value)}
        />
      </div>

      <div className="tuner-section">
        <div className="tuner-section__title">Audio Links</div>
        <SliderControl
          label="Energy -> speed"
          value={config.reactivity.energyToSpeed}
          min={0}
          max={2}
          step={0.05}
          onChange={(value) => updateReactivityNumber("energyToSpeed", value)}
        />
        <SliderControl
          label="Bass -> pulse"
          value={config.reactivity.bassToPulse}
          min={0}
          max={2}
          step={0.05}
          onChange={(value) => updateReactivityNumber("bassToPulse", value)}
        />
        <SliderControl
          label="Mids -> twist"
          value={config.reactivity.midsToTwist}
          min={0}
          max={2}
          step={0.05}
          onChange={(value) => updateReactivityNumber("midsToTwist", value)}
        />
        <SliderControl
          label="Treble -> sparkle"
          value={config.reactivity.trebleToSparkle}
          min={0}
          max={2}
          step={0.05}
          onChange={(value) => updateReactivityNumber("trebleToSparkle", value)}
        />
      </div>

      <button className="tuner-reset" onClick={onReset}>
        Reset Minimal
      </button>
    </div>
  );
}
