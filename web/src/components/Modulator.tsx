import { useEffect, useRef } from "react";
import { getWaveform } from "../audio/analysis";
import type { MusicalFrame } from "../audio/mapping";
import { DEFAULT_CONTROLS, type Controls } from "../types";
import { KID_KNOBS } from "../kids";
import Knob from "./Knob";

interface Props {
  controls: Controls;
  onChange: (c: Controls) => void;
  music: MusicalFrame | null;
  kids: boolean;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const pct = (v: number) => `${Math.round(v * 100)}%`;

const KNOBS: { key: keyof Controls; label: string; hint: string; min: number; max: number; step: number; format?: (v: number) => string }[] = [
  { key: "tempo", label: "Tempo", hint: "Faster music spins the planet faster", min: 50, max: 160, step: 1, format: (v) => `${v} bpm` },
  { key: "warmth", label: "Warmth", hint: "Push the mood toward a warmer, overheated planet", min: -1, max: 1, step: 0.05, format: (v) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)) },
  { key: "density", label: "Density", hint: "How many notes the scanner plays", min: 0, max: 1, step: 0.05, format: pct },
  { key: "space", label: "Space", hint: "Reverb: how big the sound feels", min: 0, max: 1, step: 0.05, format: pct },
  { key: "volume", label: "Volume", hint: "Master volume", min: 0, max: 1, step: 0.05, format: pct },
];

/** Live oscilloscope: shows the sound "as it is". */
function Scope() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;
    const draw = () => {
      const { width: w, height: h } = canvas;
      const data = getWaveform();
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 2;
      ctx.strokeStyle = getComputedStyle(canvas).color;
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * w;
        const y = h / 2 - data[i] * h * 1.6;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="scope" width={480} height={140} aria-hidden="true" />;
}

export default function Modulator({ controls, onChange, music, kids }: Props) {
  return (
    <div className="modulator">
      <h2>{kids ? "Sound machine" : "Modulator"}</h2>
      <div className="readout">
        <div>
          <span className="eyebrow">{kids ? "Mood" : "Key"}</span>
          <strong>{!music ? "—" : kids ? (music.mode === "major" ? "Happy" : "Calm") : `${NOTE_NAMES[music.root]} ${music.mode}`}</strong>
        </div>
        <div>
          <span className="eyebrow">Energy</span>
          <div className="meter" aria-hidden="true">
            <div style={{ width: `${(music?.energy ?? 0) * 100}%` }} />
          </div>
        </div>
      </div>
      <Scope />
      <div className="knobs">
        {KNOBS.map((k) => (
          <Knob
            key={k.key}
            label={kids ? KID_KNOBS[k.key].label : k.label}
            hint={kids ? KID_KNOBS[k.key].hint : k.hint}
            min={k.min}
            max={k.max}
            step={k.step}
            format={k.format}
            value={controls[k.key]}
            defaultValue={DEFAULT_CONTROLS[k.key]}
            onChange={(v) => onChange({ ...controls, [k.key]: v })}
          />
        ))}
      </div>
      <p className="tip">{kids ? "Drag a knob up or down and listen to what changes!" : "Drag a knob up or down, or use the arrow keys. Double-click to reset."}</p>
    </div>
  );
}
