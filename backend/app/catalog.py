import json
from functools import lru_cache
from pathlib import Path


@lru_cache
def catalog() -> dict:
    data = json.loads(Path(__file__).with_name("catalog.json").read_text(encoding="utf-8"))
    regional = json.loads(Path(__file__).with_name("kedah_crop_context.json").read_text(encoding="utf-8"))
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
    for crop in regional["crops"]:
        if crop["id"] in ids:
            raise ValueError(f"Duplicate crop ID: {crop['id']}")
        ids.add(crop["id"])
        if crop["comparison_status"] != "context_only" or crop["review_status"] != "pending_local_scientific_review":
            raise ValueError(f"Unreviewed regional crop cannot be evaluated: {crop['id']}")
        if crop["system"] not in ("managed_paddy", "perennial_crop"):
            raise ValueError(f"Unknown crop system: {crop['id']}")
        if crop["planning_horizon"] not in ("seasonal_schedule", "multi_year"):
            raise ValueError(f"Unknown planning horizon: {crop['id']}")
        if not crop["comparison_reason"] or not crop["evidence"]:
            raise ValueError(f"Regional crop needs evidence and a comparison reason: {crop['id']}")
        if any("optimal" in key or "absolute" in key or "threshold" in key for key in crop):
            raise ValueError(f"Unreviewed regional crop has a threshold: {crop['id']}")
        for item in crop["evidence"]:
            if not item["url"].startswith("https://") or not item["source_name"] or not item["claim"] or item["observation_year"] < 1900:
                raise ValueError(f"Invalid regional crop evidence: {crop['id']}")
    data["regional_context_version"] = regional["version"]
    data["regional_context_note"] = regional["note"]
    data["regional_context"] = regional["crops"]
    return data


def crops_by_id() -> dict[str, dict]:
    return {crop["id"]: crop for crop in catalog()["crops"]}


def regional_context_by_id() -> dict[str, dict]:
    return {crop["id"]: crop for crop in catalog()["regional_context"]}
