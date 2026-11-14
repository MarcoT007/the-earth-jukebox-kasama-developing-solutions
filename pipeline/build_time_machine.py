"""
Builds the "Climate Time Machine" record for Earth Jukebox v2.

Source: NASA SVS #5343, "NEX GDDP CMIP6 Historical and Predicted Global Maximum
Monthly Temperature from 1950 - 2100". Each movie has one frame per year
(151 frames, 1950..2100) for one emissions scenario (SSP). We sample every
5 years for the four scenarios, compute the same visual features as
build_dataset.py, and write web-v2/public/data/time-machine.json.

The source maps only cover land (oceans are black), so for display we fill the
oceans with a NASA Blue Marble. Features are computed on the original
frame, so the music is driven by the data only.

    pipeline/.venv/bin/python pipeline/build_time_machine.py
"""

from __future__ import annotations

import io
import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import requests
from PIL import Image

from build_dataset import HEADERS, ROOT, features

SVS_ID = 5343
BASE = "https://svs.gsfc.nasa.gov/vis/a000000/a005300/a005343"
OUT = ROOT / "web-v2" / "public" / "data"
YEARS = list(range(1950, 2101, 5))
WIDTH = 1024

SCENARIOS = [
    ("ssp126", "SSP1-2.6", "Low emissions", "The world cuts greenhouse gas emissions quickly and reaches net zero after 2050."),
    ("ssp245", "SSP2-4.5", "Intermediate emissions", "Emissions stay near today's levels until mid-century, then slowly fall."),
    ("ssp370", "SSP3-7.0", "High emissions", "Emissions keep rising and roughly double by 2100."),
    ("ssp585", "SSP5-8.5", "Very high emissions", "Fossil fuel use grows fast; emissions roughly double by 2050."),
]


def main() -> None:
    ocean = Image.open(ROOT / "web-v2" / "public" / "textures" / "blue-marble.jpg").convert("RGB").resize((WIDTH, WIDTH // 2), Image.LANCZOS)
    ocean = (np.asarray(ocean, dtype=np.float32) * 0.95).astype(np.float32)
    folder = OUT / "time-machine"
    folder.mkdir(parents=True, exist_ok=True)

    scenarios = []
    with tempfile.TemporaryDirectory() as tmp:
        for sid, code, label, blurb in SCENARIOS:
            print(f"== {sid}")
            movie = Path(tmp) / f"{sid}.mp4"
            movie.write_bytes(requests.get(f"{BASE}/monthly_max_{sid}_max12_8192_1024x512.mp4", headers=HEADERS, timeout=300).content)
            frames = []
            for year in YEARS:
                png = subprocess.check_output(
                    ["ffmpeg", "-v", "error", "-i", str(movie), "-vf", f"select=eq(n\\,{year - 1950})", "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"]
                )
                img = Image.open(io.BytesIO(png)).convert("RGB").resize((WIDTH, WIDTH // 2), Image.LANCZOS)
                data = np.asarray(img, dtype=np.float32)
                land = (data.max(-1, keepdims=True) > 28).astype(np.float32)  # near-black = no data (ocean)
                shown = Image.fromarray((data * land + ocean * (1 - land)).astype(np.uint8))
                name = f"{sid}_{year}.jpg"
                shown.save(folder / name, quality=82)
                lum = data @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
                mask = land[..., 0] > 0
                # darker red = hotter, white = snow/cold: invert land luminance to get a raw heat value
                raw_heat = float(255 - lum[mask].mean())
                frames.append({"src": f"data/time-machine/{name}", "year": year, "heat": raw_heat, **features(img)})
            scenarios.append({"id": sid, "code": code, "label": label, "blurb": blurb, "frames": frames})

    # Normalise heat to 0..1 across every year and scenario, so it is comparable between them.
    heats = [f["heat"] for s in scenarios for f in s["frames"]]
    lo, hi = min(heats), max(heats)
    for s in scenarios:
        for f in s["frames"]:
            f["heat"] = round((f["heat"] - lo) / (hi - lo), 4)

    entry = {
        "slug": "time-machine",
        "svsId": SVS_ID,
        "title": "Climate Time Machine: 1950 – 2100",
        "description": (
            "Yearly maximum of monthly maximum temperature over land, 1950-2100, from NASA's NEX-GDDP-CMIP6 dataset: "
            "downscaled results of the CMIP6 global climate models used in the IPCC Sixth Assessment Report. "
            "Years up to 2014 are the models' historical runs; later years follow one of four emissions scenarios (SSPs). "
            "These are scenario-based model projections, not forecasts."
        ),
        "credits": f"NASA Scientific Visualization Studio - https://svs.gsfc.nasa.gov/{SVS_ID}/",
        "sourceUrl": f"https://svs.gsfc.nasa.gov/{SVS_ID}/",
        "projection": "equirect",
        "years": YEARS,
        "scenarios": scenarios,
        "frames": scenarios[1]["frames"],
    }
    (OUT / "time-machine.json").write_text(json.dumps(entry, indent=1))
    print(f"wrote {OUT / 'time-machine.json'}")


if __name__ == "__main__":
    main()
