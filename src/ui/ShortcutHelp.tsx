import { useVibeStore } from "../store/useVibeStore";

const SHORTCUTS: { key: string; description: string }[] = [
  { key: "Space", description: "Play / pause" },
  { key: "← / →", description: "Nudge beat ±20 ms" },
  { key: "H", description: "Force-show HUD" },
  { key: "W", description: "Toggle waveform panel" },
  { key: "T", description: "Toggle the tune panel" },
  { key: "M", description: "Mute / unmute" },
  { key: "D", description: "Toggle the debug overlay" },
  { key: "?", description: "Show this help" },
  { key: "Esc", description: "Close panels" },
];

/**
 * Modal listing keyboard shortcuts.  Triggered by the "?" key.
 */
export default function ShortcutHelp() {
  const show = useVibeStore((s) => s.showShortcutHelp);
  const setShow = useVibeStore((s) => s.setShowShortcutHelp);
  if (!show) return null;
  return (
    <div
      className="shortcut-help"
      role="dialog"
      aria-modal="true"
      onClick={() => setShow(false)}
    >
      <div
        className="shortcut-help__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcut-help__header">
          <h3>Keyboard shortcuts</h3>
          <button
            className="tuner-close"
            onClick={() => setShow(false)}
            aria-label="Close shortcuts"
          >
            x
          </button>
        </div>
        <ul className="shortcut-help__list">
          {SHORTCUTS.map(({ key, description }) => (
            <li key={key}>
              <kbd>{key}</kbd>
              <span>{description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
