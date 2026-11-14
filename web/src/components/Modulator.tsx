import type { MusicalFrame } from "../audio/mapping";
import type { Controls } from "../types";

interface Props {
  controls: Controls;
  onChange: (c: Controls) => void;
  music: MusicalFrame | null;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const SLIDERS: { key: keyof Controls; label: string; hint: string; min: number; max: number; step: number }[] = [
  { key: "tempo", label: "Tempo", hint: "Faster music spins the planet faster", min: 50, max: 160, step: 1 },
  { key: "warmth", label: "Warmth", hint: "Push the mood toward a warmer, overheated planet", min: -1, max: 1, step: 0.05 },
  { key: "density", label: "Density", hint: "How many notes the scanner plays", min: 0, max: 1, step: 0.05 },
  { key: "space", label: "Space", hint: "Reverb: how big the sound feels", min: 0, max: 1, step: 0.05 },
  { key: "volume", label: "Volume", hint: "", min: 0, max: 1, step: 0.05 },
];

export default function Modulator({ controls, onChange, music }: Props) {
  return (
    <div className="modulator">
      <h2>Modulator</h2>
      {SLIDERS.map((s) => (
        <label key={s.key} className="slider">
          <span>
            {s.label} <output>{controls[s.key].toFixed(s.step < 1 ? 2 : 0)}</output>
          </span>
          <input
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={controls[s.key]}
            aria-describedby={s.hint ? `hint-${s.key}` : undefined}
            onChange={(e) => onChange({ ...controls, [s.key]: Number(e.target.value) })}
          />
          {s.hint && <small id={`hint-${s.key}`}>{s.hint}</small>}
        </label>
      ))}

      {music && (
        <div className="scope" aria-hidden="true">
          <div className="key">
            {NOTE_NAMES[music.root]} {music.mode}
          </div>
          <div className="steps">
            {music.melody.map((n, i) => (
              <span key={i} className={n ? "on" : ""} title={n ?? "rest"}>
                {n ?? "·"}
              </span>
            ))}
          </div>
          <div className="energy">
            <div style={{ width: `${music.energy * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
