# The Earth Jukebox – KASAMA Developing Solutions

NASA Space Apps Challenge 2026 · Challenge: [The Earth Information Jukebox](https://www.spaceappschallenge.org/2026/challenges/the-earth-information-jukebox/)

An interactive web jukebox that turns NASA Earth Information Center (EIC) visualizations into music.
A 3D Earth sits in the middle, a **modulator** on the left shapes the sound (and the planet reacts),
and the **jukebox** on the right lets you pick a visualization and follow its frames.

## Two versions

| | Folder | Live |
|---|---|---|
| **v1** – dark "mission control" theme | `web/` (git tag `v1`) | <https://marcot007.github.io/the-earth-jukebox-kasama-developing-solutions/> |
| **v2** – daylight theme, playable wave, Climate Time Machine | `web-v2/` | <https://marcot007.github.io/the-earth-jukebox-kasama-developing-solutions/v2/> |

### What is new in v2

- **Play the wave.** Drag the wave up/down to change its energy and left/right to change the tempo, and pick its shape
  (sine, triangle, square, saw). The same controls exist as knobs for keyboard and screen-reader users.
- **Climate Time Machine (real data).** The first record shows land temperature from 1950 to 2100 from NASA's
  NEX-GDDP-CMIP6 dataset ([SVS #5343](https://svs.gsfc.nasa.gov/5343/)): downscaled output of the CMIP6 climate models
  used by the IPCC Sixth Assessment Report. The energy of the wave selects one of the four emissions scenarios
  (SSP1-2.6, SSP2-4.5, SSP3-7.0, SSP5-8.5), so the planet changes according to published model results, not to an
  invented effect. These are scenario-based projections, not forecasts. Built by `pipeline/build_time_machine.py`.
- **Heat you can hear.** A land heat index (0-100, computed from the frames) raises the pitch, turns the harmony minor
  and adds a dissonant note as the land gets hotter.
- **News and kids mode always in view**: a live headline bar and a kids switch in the top bar, colour-coded tabs.

## How it works

1. **Data pipeline** (`pipeline/build_dataset.py`) downloads frames from NASA Scientific Visualization Studio (SVS)
   pages listed in the challenge, through the public SVS API (`https://svs.gsfc.nasa.gov/api/<id>`).
   For each frame it extracts visual features: a 12-bin colour histogram, brightness, contrast, saturation,
   edge density, bright "hotspots" and a 4×8 brightness grid.
2. **Sonification** (`web/src/audio/mapping.ts`) turns those features into music:

   | Visual feature | Sound |
   |---|---|
   | Dominant colour (hue) | Root note (hues mapped on the circle of fifths, so similar colours sound consonant) |
   | Warm vs cool colours | Major vs minor pentatonic scale |
   | 4×8 brightness grid, scanned west → east | Melody: column = time step + stereo position, row = octave (north = high) |
   | Brightness + saturation | Filter brightness (dark images sound muffled) |
   | Hotspots + edge density | Percussion sparkles (lightning, city lights, fine detail) |
   | Frame sequence | One frame per bar: the animation becomes the song |

3. **Sound → planet**: tempo spins the globe, loudness makes the atmosphere pulse, and the *Warmth* slider
   tints the planet from a cool blue to an overheated orange.
4. **Equirectangular sources** (ocean currents, ISS lightning) are wrapped directly onto the 3D globe;
   the other visualizations are shown as "album covers" with the NASA Blue Marble (GIBS) on the globe.

## Kids mode

A switch in the top bar turns the jukebox into a learning tool: plain-language controls (Speed, Heat, Notes, Echo),
a short "What am I hearing?" story for every record, four missions that teach how pictures become sound
(progress is saved in the browser), and simple climate actions with a link to NASA Science for Kids.

## News

The News tab shows Earth stories from the NASA Earth Observatory feed and, outside kids mode, climate headlines
for the region of the planet currently facing the viewer (or a region picked from the list).
Headlines are collected by `pipeline/fetch_news.py`, which GitHub Actions runs four times a day, so the app never
depends on a live news service. Regional headlines come from Google News RSS and link to external sites.

Handy links: add `?kids` to open in kids mode, `?tab=news` to open the news tab.

## Accessibility

- Every frame has an automatically generated plain-language description, announced by screen readers (`aria-live`).
- Full keyboard control: `Space` play/pause, `N` / `P` next/previous visualization, Tab through all controls.
- Labelled sliders with hints, visible focus outlines.

## Run locally

```bash
# 1. data (Python 3.10+, ffmpeg needed for movie sources)
python3 -m venv pipeline/.venv
pipeline/.venv/bin/pip install -r pipeline/requirements.txt
pipeline/.venv/bin/python pipeline/build_dataset.py

# 2. web app
cd web && npm install && npm run dev
```

## NASA data used

- [Earth Information Center content (SVS)](https://svs.gsfc.nasa.gov/gallery/earth-information-center/)
- [Global Sea Surface Currents and Temperature](https://svs.gsfc.nasa.gov/3912/)
- [Lightning Events Detected from the ISS 2017-2023](https://svs.gsfc.nasa.gov/5011/)
- [GEDI Forest Height](https://svs.gsfc.nasa.gov/4950/)
- [Perpetual Ocean 2: Western Boundary Currents](https://svs.gsfc.nasa.gov/5425/)
- [A 3D View of an Atmospheric River](https://svs.gsfc.nasa.gov/4960/)
- [DYAMOND Global Carbon Dioxide](https://svs.gsfc.nasa.gov/5196/)
- [Air Quality Model Runs](https://svs.gsfc.nasa.gov/5533/)
- [NEX GDDP CMIP6 Historical and Predicted Global Maximum Monthly Temperature 1950-2100](https://svs.gsfc.nasa.gov/5343/) (v2)
- [NASA GIBS – Blue Marble Shaded Relief & Bathymetry](https://nasa-gibs.github.io/gibs-api-docs/)

## Use of AI

This project was developed with the assistance of an AI coding assistant (Claude, by Anthropic), which generated
parts of the source code, the data pipeline and documentation. All code was reviewed and directed by the team.
No NASA logos, flags, mission insignia or other NASA brand elements are used.

## Team

KASAMA Developing Solutions – NASA Space Apps Challenge Chihuahua 2026.
