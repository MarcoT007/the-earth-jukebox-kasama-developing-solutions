import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Globe, { BASE_TEXTURE } from "./components/Globe";
import Modulator from "./components/Modulator";
import NowPlaying from "./components/NowPlaying";
import Dock from "./components/Dock";
import { JukeboxEngine } from "./audio/engine";
import { getSpectrum } from "./audio/analysis";
import { describe, type MusicalFrame } from "./audio/mapping";
import { DEFAULT_CONTROLS, type Controls, type FrameFeatures, type Visualization } from "./types";
import "./App.css";

/** The strongest colour of the frame becomes the accent colour of the whole interface. */
function accentOf(f: FrameFeatures | undefined): string {
  if (!f) return "hsl(190 90% 60%)";
  const peak = Math.max(...f.chroma);
  if (peak <= 0) return "hsl(190 90% 60%)";
  const hue = ((f.chroma.indexOf(peak) + 0.5) / 12) * 360;
  return `hsl(${Math.round(hue)} 90% 62%)`;
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function App() {
  const [catalog, setCatalog] = useState<Visualization[]>([]);
  const [track, setTrack] = useState(0);
  const [frame, setFrame] = useState(0);
  const [music, setMusic] = useState<MusicalFrame | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(() => new URLSearchParams(location.search).has("nointro"));
  const [controls, setControls] = useState<Controls>(DEFAULT_CONTROLS);
  const engine = useRef<JukeboxEngine | null>(null);

  useEffect(() => {
    fetch("data/catalog.json")
      .then((r) => r.json())
      .then(setCatalog)
      .catch(() => setCatalog([]));
  }, []);

  useEffect(() => {
    const e = new JukeboxEngine(DEFAULT_CONTROLS);
    e.onFrame((i, m) => {
      setFrame(i);
      setMusic(m);
    });
    engine.current = e;
    return () => e.dispose();
  }, []);

  const viz = catalog[track];
  useEffect(() => {
    if (viz) engine.current?.setFrames(viz.frames, 0);
  }, [viz]);

  useEffect(() => {
    engine.current?.setControls(controls);
  }, [controls]);

  const togglePlay = useCallback(async () => {
    if (!engine.current) return;
    if (playing) engine.current.pause();
    else await engine.current.play();
    setPlaying(!playing);
    setStarted(true);
  }, [playing]);

  const selectTrack = useCallback((i: number) => catalog.length && setTrack((i + catalog.length) % catalog.length), [catalog.length]);

  // Keyboard: space = play/pause, N/P = next/previous visualization.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement).closest("input, select, textarea, button, [role=slider], summary, a")) return;
      if (ev.code === "Space") {
        ev.preventDefault();
        togglePlay();
      } else if (ev.key === "n") selectTrack(track + 1);
      else if (ev.key === "p") selectTrack(track - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, selectTrack, track]);

  const current = viz?.frames[frame];
  const textureUrl = viz?.projection === "equirect" && current ? current.src : BASE_TEXTURE;
  const accent = useMemo(() => accentOf(current), [current]);
  const level = useCallback(() => engine.current?.level() ?? 0, []);
  const step = useCallback(() => engine.current?.currentStep() ?? 0, []);
  const melody = music?.melody ?? [];

  return (
    <div className="app" style={{ "--accent": accent } as CSSProperties}>
      <div className="stage">
        <Globe
          textureUrl={textureUrl}
          controls={controls}
          energy={music?.energy ?? 0}
          level={level}
          spectrum={getSpectrum}
          step={step}
          melody={melody}
          playing={playing}
          accent={accent}
          reducedMotion={reducedMotion}
        />
      </div>

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <h1>
            Earth <span>Jukebox</span>
          </h1>
        </div>
        <p>Listen to NASA’s Earth Information Center</p>
      </header>

      <aside className="panel glass left" aria-label="Sound modulator">
        <Modulator controls={controls} onChange={setControls} music={music} />
      </aside>

      <aside className="panel glass right" aria-label="Now playing">
        <NowPlaying viz={viz} frame={frame} onSeek={(i) => engine.current?.seek(i)} description={current && music ? describe(current, music) : ""} />
      </aside>

      <Dock catalog={catalog} track={track} playing={playing} onSelect={selectTrack} onToggle={togglePlay} />

      <footer className="credits">
        Imagery: NASA Scientific Visualization Studio &amp; GIBS. Independent Space Apps project, not endorsed by NASA.
      </footer>

      {!started && (
        <div className="intro" role="dialog" aria-modal="true" aria-labelledby="intro-title">
          <p className="eyebrow">NASA Space Apps Challenge 2026</p>
          <h2 id="intro-title">What does our planet sound like?</h2>
          <p>
            Every colour, current and flash of lightning in NASA’s Earth visualizations becomes a note. Pick a record, shape the sound, and watch the planet
            answer.
          </p>
          <button className="cta" onClick={togglePlay} autoFocus>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z" /></svg>
            Press play to hear the Earth
          </button>
          <p className="keys">
            <kbd>Space</kbd> play / pause · <kbd>N</kbd> <kbd>P</kbd> next / previous · works with screen readers
          </p>
        </div>
      )}
    </div>
  );
}
