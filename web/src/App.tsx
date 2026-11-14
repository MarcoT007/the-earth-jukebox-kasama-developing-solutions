import { useCallback, useEffect, useRef, useState } from "react";
import Globe, { BASE_TEXTURE } from "./components/Globe";
import Modulator from "./components/Modulator";
import NowPlaying from "./components/NowPlaying";
import { JukeboxEngine } from "./audio/engine";
import { describe, type MusicalFrame } from "./audio/mapping";
import { DEFAULT_CONTROLS, type Controls, type Visualization } from "./types";
import "./App.css";

export default function App() {
  const [catalog, setCatalog] = useState<Visualization[]>([]);
  const [track, setTrack] = useState(0);
  const [frame, setFrame] = useState(0);
  const [music, setMusic] = useState<MusicalFrame | null>(null);
  const [playing, setPlaying] = useState(false);
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
  }, [playing]);

  const selectTrack = useCallback((i: number) => setTrack((i + catalog.length) % catalog.length), [catalog.length]);

  // Keyboard: space = play/pause, N/P = next/previous visualization.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement).closest("input, select, textarea")) return;
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
  const level = useCallback(() => engine.current?.level() ?? 0, []);

  return (
    <div className="app">
      <header className="topbar">
        <h1>The Earth Jukebox</h1>
        <p>Listen to NASA Earth Information Center visualizations</p>
      </header>

      <aside className="panel left" aria-label="Sound modulator">
        <Modulator controls={controls} onChange={setControls} music={music} />
      </aside>

      <main className="stage">
        <Globe textureUrl={textureUrl} controls={controls} energy={music?.energy ?? 0} level={level} />
        <button className="play" onClick={togglePlay} aria-pressed={playing}>
          {playing ? "Pause" : "Play"}
        </button>
      </main>

      <aside className="panel right" aria-label="Now playing and playlist">
        <NowPlaying
          catalog={catalog}
          track={track}
          frame={frame}
          onSelect={selectTrack}
          onSeek={(i) => engine.current?.seek(i)}
          description={current && music ? describe(current, music) : ""}
        />
      </aside>
    </div>
  );
}
