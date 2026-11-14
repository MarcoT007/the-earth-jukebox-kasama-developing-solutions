export interface FrameFeatures {
  src: string;
  brightness: number;
  contrast: number;
  saturation: number;
  edges: number;
  hotspots: number;
  chroma: number[]; // 12 hue bins
  grid: number[][]; // 4 rows x 8 cols of brightness
  meanRgb: number[];
  dominantHue: number;
}

export interface Visualization {
  slug: string;
  svsId: number;
  title: string;
  description: string;
  credits: string;
  sourceUrl: string;
  projection: "equirect" | "screen";
  frames: FrameFeatures[];
}

/** User-controlled "modulator" settings. They change the sound AND the planet. */
export interface Controls {
  tempo: number; // BPM
  warmth: number; // -1 (cool / minor) .. 1 (warm / major); 0 = follow the data
  density: number; // 0..1 how many notes the scanner plays
  space: number; // 0..1 reverb amount
  volume: number; // 0..1
}

export const DEFAULT_CONTROLS: Controls = { tempo: 84, warmth: 0, density: 0.6, space: 0.4, volume: 0.8 };
