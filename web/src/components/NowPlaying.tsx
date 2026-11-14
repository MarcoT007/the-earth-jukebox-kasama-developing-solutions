import { KID_STORIES } from "../kids";
import type { Visualization } from "../types";

interface Props {
  viz: Visualization | undefined;
  frame: number;
  onSeek: (i: number) => void;
  description: string;
  kids: boolean;
}

export default function NowPlaying({ viz, frame, onSeek, description, kids }: Props) {
  if (!viz) return <p>Loading visualizations…</p>;
  const f = viz.frames[frame];

  return (
    <div className="now-playing">
      <h2>Now playing</h2>
      {f && <img className="cover" src={f.src} alt={`Frame ${frame + 1} of ${viz.title}. ${description}`} />}
      <h3>{viz.title}</h3>
      {kids && KID_STORIES[viz.slug] && (
        <div className="story">
          <span className="eyebrow">What am I hearing?</span>
          <p>{KID_STORIES[viz.slug]}</p>
        </div>
      )}
      <p className="live" aria-live="polite">
        {description}
      </p>
      <label className="scrub">
        <span>
          <span className="eyebrow">{kids ? "Picture" : "Frame"}</span>
          <output>
            {String(frame + 1).padStart(2, "0")} / {viz.frames.length}
          </output>
        </span>
        <input type="range" min={0} max={viz.frames.length - 1} value={frame} onChange={(e) => onSeek(Number(e.target.value))} />
      </label>
      <details>
        <summary>About this visualization</summary>
        <p>{viz.description}</p>
        <a href={viz.sourceUrl} target="_blank" rel="noreferrer">
          Source: NASA Scientific Visualization Studio #{viz.svsId}
        </a>
      </details>
    </div>
  );
}
