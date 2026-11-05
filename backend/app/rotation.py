import math

from .catalog import crops_by_id


def _band(value: float | None, optimal: list[float], absolute: list[float]) -> tuple[str, float | None]:
    if value is None:
        return "unknown", None
    if value < absolute[0] or value > absolute[1]:
        return "outside_published_range", 0.0
    if optimal[0] <= value <= optimal[1]:
        return "within_optimal_range", 1.0
    return "within_absolute_range", 0.5


def evaluate(farm, crop_ids: list[str], priorities: dict, climate: dict) -> dict:
    crops = crops_by_id()
    selected = [crops[c] for c in crop_ids]
    current = crops[farm.existing_crop_id]
    rainfall = climate["annual_rainfall_median_mm"] if climate["usable_years"] >= 3 else None
    temperature = climate["temperature_mean_c"] if climate["usable_years"] >= 3 else None
    weights = {name: float(priorities.get(name, 0)) for name in ("climate", "water", "soil", "rotation")}
    if any(not math.isfinite(v) or v < 0 for v in weights.values()):
        raise ValueError("Priority weights must be finite and nonnegative")
    total = sum(weights.values())
    if total <= 0:
        raise ValueError("At least one priority weight must be positive")
    weights = {k: v / total for k, v in weights.items()}
    scenarios = []
    excluded = []
    for second in selected:
        first = current
        if first["id"] == second["id"]:
            excluded.append({"crop_ids": [first["id"], second["id"]], "reason": "The next crop must differ from the current crop to form a two-crop rotation scenario"})
            continue
        flags = []
        scores = []
        hard_failed = False
        for crop in (first, second):
            for criterion, value, optimal, absolute, unit in (
                ("temperature", temperature, crop["temperature_optimal_c"], crop["temperature_absolute_c"], "°C"),
                ("annual_rainfall", rainfall, crop["annual_rainfall_optimal_mm"], crop["annual_rainfall_absolute_mm"], "mm/year"),
                ("soil_ph", farm.soil_ph, crop["ph_optimal"], crop["ph_absolute"], "pH")):
                status, score = _band(value, optimal, absolute)
                flags.append({"crop_id": crop["id"], "criterion": criterion, "status": status,
                              "observed": value, "optimal": optimal, "absolute": absolute, "unit": unit,
                              "source_url": crop["source_url"],
                              "explanation": "Species-level screening range; local cultivar and management are not validated."})
                if status == "outside_published_range" and criterion == "soil_ph":
                    hard_failed = True
                scores.append((criterion, score))
        if hard_failed:
            excluded.append({"crop_ids": [first["id"], second["id"]], "reason": "Outside an FAO Ecocrop absolute range"})
            continue
        evidence_gaps = []
        if climate["usable_years"] < 3:
            evidence_gaps.append("Fewer than three complete historical years are available.")
        if farm.soil_ph is None:
            evidence_gaps.append("Farm soil pH was not provided.")
        if farm.soil_source == "unknown":
            evidence_gaps.append("The source of the farm soil information is unknown.")
        if any(f["status"] == "outside_published_range" for f in flags):
            evidence_gaps.append("At least one observed value lies outside a published absolute species range.")
        if weights["water"] > 0:
            evidence_gaps.append("Water compatibility has no supported numeric model.")
        if weights["rotation"] > 0:
            evidence_gaps.append("Rotation effects have no supported numeric model.")
        # Soil weight uses pH only; it does not estimate a soil-health benefit.
        supported = not evidence_gaps and all(score is not None for _, score in scores)
        climate_scores = [s for name, s in scores if name in ("temperature", "annual_rainfall")]
        ph_scores = [s for name, s in scores if name == "soil_ph"]
        score = None
        if supported:
            score = round(100 * (weights["climate"] * sum(climate_scores) / len(climate_scores)
                                 + weights["soil"] * sum(ph_scores) / len(ph_scores)), 1)
        scenarios.append({"crop_ids": [first["id"], second["id"]], "flags": flags,
                          "score": score, "score_status": "screening_only" if score is not None else "insufficient_evidence",
                          "evidence_gaps": evidence_gaps,
                          "criterion_scores": {"climate": round(sum(climate_scores) / len(climate_scores), 3) if all(s is not None for s in climate_scores) else None,
                                               "soil_ph": round(sum(ph_scores) / len(ph_scores), 3) if all(s is not None for s in ph_scores) else None,
                                               "water": None, "soil_management": None, "rotation": None},
                          "trade_offs": ["Annual rainfall is compared with annual species ranges as a caution only; this does not quantify irrigation demand.",
                                         "Different crop families are a descriptive diversity indicator, not a measured soil benefit."
                                         if first["family"] != second["family"] else
                                         "These crops share a family; no rotation benefit or penalty is inferred."]})
    scenarios.sort(key=lambda s: (s["score"] is None, -(s["score"] or 0), s["crop_ids"]))
    return {"scenarios": scenarios, "excluded": excluded, "weights": weights,
            "ranking_status": "screening_only" if scenarios and all(s["score"] is not None for s in scenarios) else "insufficient_evidence",
            "method_note": "A screening score, when available, uses published climate and pH range matches only. Water and rotation effects have no validated numeric model, so a positive weight on either withholds ranking. This is not a probability, yield forecast, or recommendation."}
