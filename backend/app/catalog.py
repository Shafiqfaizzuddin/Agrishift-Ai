import json
from functools import lru_cache
from pathlib import Path


@lru_cache
def catalog() -> dict:
    data = json.loads(Path(__file__).with_name("catalog.json").read_text(encoding="utf-8"))
    ids = set()
    for crop in data["crops"]:
        if crop["id"] in ids:
            raise ValueError(f"Duplicate crop ID: {crop['id']}")
        ids.add(crop["id"])
        if not crop["source_url"].startswith("https://"):
            raise ValueError(f"Missing HTTPS source for {crop['id']}")
        for key in ("temperature_optimal_c", "temperature_absolute_c", "annual_rainfall_optimal_mm", "annual_rainfall_absolute_mm", "ph_optimal", "ph_absolute", "duration_days"):
            low, high = crop[key]
            if low >= high:
                raise ValueError(f"Invalid {key} for {crop['id']}")
        for dimension in ("temperature", "annual_rainfall", "ph"):
            suffix = "_c" if dimension == "temperature" else "_mm" if dimension == "annual_rainfall" else ""
            optimal = crop[f"{dimension}_optimal{suffix}"]
            absolute = crop[f"{dimension}_absolute{suffix}"]
            if not (absolute[0] <= optimal[0] < optimal[1] <= absolute[1]):
                raise ValueError(f"Optimal {dimension} outside absolute range for {crop['id']}")
    return data


def crops_by_id() -> dict[str, dict]:
    return {crop["id"]: crop for crop in catalog()["crops"]}
