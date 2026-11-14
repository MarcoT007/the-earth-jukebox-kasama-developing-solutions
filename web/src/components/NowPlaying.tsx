import type { Visualization } from "../types";

interface Props {
  catalog: Visualization[];
  track: number;
  frame: number;
  onSelect: (i: number) => void;
  onSeek: (i: number) => void;
  description: string;
}

export default function NowPlaying({ catalog, track, frame, onSelect, onSeek, description }: Props) {
  const viz = catalog[track];
  if (!viz) return <p>Loading visualizations… (run the data pipeline if this never loads)</p>;
  const f = viz.frames[frame];

  return (
    <div className="now-playing">
      <h2>Now playing</h2>
      {f && <img className="cover" src={f.src} alt={`Frame ${frame + 1} of ${viz.title}. ${description}`} />}
      <h3>{viz.title}</h3>
      <p className="live" aria-live="polite">
        {description}
      </p>
      <label className="slider">
        <span>
          Frame {frame + 1} / {viz.frames.length}
        </span>
        <input type="range" min={0} max={viz.frames.length - 1} value={frame} onChange={(e) => onSeek(Number(e.target.value))} />
      </label>
      <details>
        <summary>About this visualization</summary>
        <p>{viz.description}</p>
        <a href={viz.sourceUrl} target="_blank" rel="noreferrer">
          {viz.credits}
        </a>
      </details>

      <h2>Jukebox</h2>
      <ol className="playlist">
        {catalog.map((v, i) => (
          <li key={v.slug}>
            <button aria-current={i === track} onClick={() => onSelect(i)}>
              <img src={v.frames[0]?.src} alt="" />
              <span>{v.title}</span>
              {v.projection === "equirect" && <em>on globe</em>}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
