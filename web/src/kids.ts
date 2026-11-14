/**
 * Kids mode: plain-language labels, explanations and learning missions.
 * Everything here is content, so it is easy to edit or translate.
 */
import { colourTemperature, type MusicalFrame } from "./audio/mapping";
import type { Controls, FrameFeatures } from "./types";

export const KID_KNOBS: Record<keyof Controls, { label: string; hint: string }> = {
  tempo: { label: "Speed", hint: "Faster music makes the planet spin faster" },
  warmth: { label: "Heat", hint: "Turn it up to warm the planet. Turn it down to cool it." },
  density: { label: "Notes", hint: "More notes or fewer notes" },
  space: { label: "Echo", hint: "Makes the sound feel big, like in a cave" },
  volume: { label: "Loud", hint: "How loud the music is" },
};

/** "What am I hearing?" text for each record, keyed by visualization slug. */
export const KID_STORIES: Record<string, string> = {
  "ocean-currents":
    "The ocean never stops moving! Red and orange mean warm water. Blue means cold water. Warm colours make the music sound happy and bright. Cold colours make it sound calm and deep.",
  lightning: "Each tiny flash is lightning seen from the Space Station. Bright flashes turn into sparkly, crackly sounds. Can you hear them?",
  "forest-height": "A laser on the Space Station measured how tall Earth’s forests are. Trees store carbon and help keep our planet cool.",
  "ocean-temperature": "These swirls are giant rivers inside the ocean, called currents. They carry heat around the world like a moving belt.",
  "atmospheric-river": "An atmospheric river is a river in the sky made of water vapour. It can bring lots of rain when it reaches land.",
  "carbon-dioxide": "This is carbon dioxide, a gas that comes from cars, factories and fires. Too much of it makes Earth warmer.",
  "air-quality": "This shows what floats in the air we breathe, like smoke and dust. Cleaner air is healthier for everyone.",
};

export function kidDescribe(f: FrameFeatures, m: MusicalFrame): string {
  const t = colourTemperature(f);
  const colours = t > 0.2 ? "Lots of warm colours here" : t < -0.2 ? "Lots of cool colours here" : "Warm and cool colours are mixed here";
  const mood = m.mode === "major" ? "happy and bright" : "calm and deep";
  const sparkle = m.percussion > 0.35 ? " Listen for the sparkles: they are the brightest spots." : "";
  return `${colours}, so the music sounds ${mood}.${sparkle}`;
}

export interface MissionState {
  playing: boolean;
  slug: string | undefined;
  controls: Controls;
  mode: "major" | "minor" | undefined;
  heard: number; // how many different records were played
}

export interface Mission {
  id: string;
  title: string;
  goal: string;
  learned: string; // shown when the mission is complete
  done: (s: MissionState) => boolean;
}

export const MISSIONS: Mission[] = [
  {
    id: "cool",
    title: "Cool the planet",
    goal: "Press play, then turn the Heat knob down until the music changes its mood.",
    learned: "Cool colours play a calm, deep scale. A cooler planet sounds different!",
    done: (s) => s.playing && s.controls.warmth <= -0.4 && s.mode === "minor",
  },
  {
    id: "storm",
    title: "Find the storm",
    goal: "Find the lightning record and play it.",
    learned: "Every flash of lightning becomes a sparkly sound.",
    done: (s) => s.playing && s.slug === "lightning",
  },
  {
    id: "spin",
    title: "Spin the world",
    goal: "Turn the Speed knob up past 140.",
    learned: "Tempo is how fast music goes. Here it also spins the Earth.",
    done: (s) => s.playing && s.controls.tempo >= 140,
  },
  {
    id: "explorer",
    title: "Sound explorer",
    goal: "Play three different records.",
    learned: "Different pictures of Earth make different music.",
    done: (s) => s.heard >= 3,
  },
];

export const ACTIONS = [
  "Turn off lights and screens you are not using.",
  "Walk, bike or share a ride when you can.",
  "Tell someone what you learned about Earth today.",
];

export const KIDS_LINK = { href: "https://science.nasa.gov/kids/earth/", label: "Explore more at NASA Science for Kids" };
