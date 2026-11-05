from datetime import date, timedelta
import asyncio
import time

import httpx

import pytest

from app.catalog import catalog
from app import climate as climate_module
from app.climate import ClimateUnavailable, parse_power
from app.models import EvaluateRequest, Farm
from app.rotation import evaluate


def fixture_power(year=2020, missing_day=None):
    """Synthetic fixture only; these are not NASA observations."""
    values = {p: {} for p in ("T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR")}
    current = date(year, 1, 1)
    while current.year == year:
        key = current.strftime("%Y%m%d")
        for p, value in (("T2M", 27), ("T2M_MAX", 31), ("T2M_MIN", 23), ("PRECTOTCORR", 2)):
            values[p][key] = -999 if current == missing_day else value
        current += timedelta(days=1)
    return {"properties": {"parameter": values}, "parameters": {p: {"units": "mm/day" if p == "PRECTOTCORR" else "C"} for p in values}}


def farm(ph=6):
    return Farm(latitude=6.12, longitude=100.36, area_hectares=1.5, soil_type="loam", soil_source="farmer_report", soil_ph=ph, irrigation="limited", existing_crop_id="maize")


def test_catalog_has_referenced_ranges():
    assert len(catalog()["crops"]) == 3
    assert all(c["source_url"].startswith("https://ecocrop.apps.fao.org/") for c in catalog()["crops"])


def test_power_monthly_and_annual_aggregation():
    result = parse_power(fixture_power(), 2020, 2020)
    assert result["usable_years"] == 1
    assert result["annual_rainfall_median_mm"] == 732
    assert result["monthly"][0]["rainfall_mm"] == 62
    assert result["monthly"][0]["temperature_max_c"] == 31
    assert result["monthly"][0]["temperature_min_c"] == 23


def test_missing_day_and_units():
    result = parse_power(fixture_power(missing_day=date(2020, 1, 1)), 2020, 2020)
    assert result["monthly"][0]["coverage"] < 1
    assert result["monthly"][0]["rainfall_mm"] is None
    assert result["usable_years"] == 0
    bad = fixture_power()
    bad["parameters"]["T2M"]["units"] = "K"
    with pytest.raises(ClimateUnavailable):
        parse_power(bad, 2020, 2020)


def test_incomplete_month_excludes_year():
    payload = fixture_power()
    for day in range(1, 6):
        key = f"202001{day:02d}"
        payload["properties"]["parameter"]["PRECTOTCORR"][key] = -999
    result = parse_power(payload, 2020, 2020)
    assert result["monthly"][0]["rainfall_mm"] is None
    assert result["usable_years"] == 0
    assert result["annual_rainfall_median_mm"] is None


def test_missing_dates_and_negative_precipitation_are_visible():
    payload = fixture_power()
    for parameter in payload["properties"]["parameter"].values():
        parameter.pop("20200101")
    result = parse_power(payload, 2020, 2020)
    assert len(result["monthly"]) == 12
    assert result["monthly"][0]["rainfall_mm"] is None
    payload = fixture_power()
    payload["properties"]["parameter"]["PRECTOTCORR"]["20200101"] = -0.1
    assert parse_power(payload, 2020, 2020)["monthly"][0]["rainfall_mm"] is None


def test_nasa_failure_does_not_invent_data(monkeypatch):
    climate_module._CACHE.clear()
    calls = []

    class Client:
        def __init__(self, **_):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return None

        async def get(self, url, params):
            calls.append((url, params))
            return httpx.Response(503, json={"message": "unavailable"})

    monkeypatch.setattr(climate_module.httpx, "AsyncClient", Client)

    async def no_wait(_):
        return None

    monkeypatch.setattr(climate_module.asyncio, "sleep", no_wait)
    with pytest.raises(ClimateUnavailable):
        asyncio.run(climate_module.get_climate(6.12, 100.36, 2020, 2020))
    assert len(calls) == 3


def test_rate_limit_respects_retry_after(monkeypatch):
    climate_module._CACHE.clear()
    calls = []
    delays = []

    class Client:
        def __init__(self, **_):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return None

        async def get(self, url, params):
            calls.append((url, params))
            request = httpx.Request("GET", url, params=params)
            if len(calls) == 1:
                return httpx.Response(429, headers={"Retry-After": "2"}, request=request)
            return httpx.Response(200, json=fixture_power(), request=request)

    async def record_delay(delay):
        delays.append(delay)

    monkeypatch.setattr(climate_module.httpx, "AsyncClient", Client)
    monkeypatch.setattr(climate_module.asyncio, "sleep", record_delay)
    result = asyncio.run(climate_module.get_climate(6.12, 100.36, 2020, 2020))
    assert result["usable_years"] == 1
    assert delays == [2]
    assert len(calls) == 2


def test_stale_cache_is_explicit_after_nasa_failure(monkeypatch):
    climate_module._CACHE.clear()
    key = (6.12, 100.36, 2020, 2020)
    climate_module._CACHE[key] = (time.time() - 90000, parse_power(fixture_power(), 2020, 2020))

    class Client:
        def __init__(self, **_):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return None

        async def get(self, url, params):
            return httpx.Response(503)

    async def no_wait(_):
        return None

    monkeypatch.setattr(climate_module.httpx, "AsyncClient", Client)
    monkeypatch.setattr(climate_module.asyncio, "sleep", no_wait)
    result = asyncio.run(climate_module.get_climate(*key))
    assert result["from_cache"] is True
    assert result["stale_cache"] is True
    assert result["annual_rainfall_median_mm"] == 732


def test_cache_keeps_nearby_points_distinct(monkeypatch):
    climate_module._CACHE.clear()
    monkeypatch.setattr(climate_module, "MAX_CACHE_ENTRIES", 2)
    calls = []

    class Client:
        def __init__(self, **_):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return None

        async def get(self, url, params):
            calls.append((url, params))
            return httpx.Response(200, json=fixture_power(), request=httpx.Request("GET", url, params=params))

    monkeypatch.setattr(climate_module.httpx, "AsyncClient", Client)
    first = asyncio.run(climate_module.get_climate(6.121, 100.36, 2020, 2020))
    second = asyncio.run(climate_module.get_climate(6.124, 100.36, 2020, 2020))
    assert first["from_cache"] is False
    assert second["from_cache"] is False
    assert len(calls) == 2
    asyncio.run(climate_module.get_climate(6.127, 100.36, 2020, 2020))
    assert len(climate_module._CACHE) == 2


def test_rotation_insufficient_evidence_and_hard_constraint():
    climate = {"usable_years": 4, "annual_rainfall_median_mm": 800, "temperature_mean_c": 27}
    result = evaluate(farm(ph=None), ["maize", "mung-bean", "sweet-potato"], {"climate": .7, "rotation": .3}, climate)
    assert result["ranking_status"] == "insufficient_evidence"
    assert all(s["score"] is None for s in result["scenarios"])
    result = evaluate(farm(ph=12), ["maize", "mung-bean"], {"climate": 1}, climate)
    assert result["scenarios"] == []
    assert len(result["excluded"]) == 2


def test_rotation_scoring_and_weights():
    climate = {"usable_years": 4, "annual_rainfall_median_mm": 800, "temperature_mean_c": 27}
    result = evaluate(farm(ph=6.5), ["maize", "mung-bean"], {"climate": 7, "soil": 3}, climate)
    assert result["weights"]["climate"] == pytest.approx(.7)
    assert len(result["scenarios"]) == 1
    assert result["scenarios"][0]["score"] == 92.5
    assert result["ranking_status"] == "screening_only"
    assert evaluate(farm(ph=6.5), ["maize", "mung-bean"], {"climate": 7, "soil": 3}, climate) == result


def test_unvalidated_priorities_withhold_ranking():
    climate = {"usable_years": 4, "annual_rainfall_median_mm": 800, "temperature_mean_c": 27}
    for criterion in ("water", "rotation"):
        result = evaluate(farm(), ["mung-bean", "sweet-potato"], {"climate": 7, criterion: 3}, climate)
        assert result["ranking_status"] == "insufficient_evidence"
        assert all(s["score"] is None for s in result["scenarios"])
        assert all(s["criterion_scores"]["rotation"] is None for s in result["scenarios"])


def test_unknown_soil_source_withholds_ranking():
    climate = {"usable_years": 4, "annual_rainfall_median_mm": 800, "temperature_mean_c": 27}
    uncertain_farm = farm().model_copy(update={"soil_source": "unknown"})
    result = evaluate(uncertain_farm, ["mung-bean", "sweet-potato"], {"climate": 7, "soil": 3}, climate)
    assert result["ranking_status"] == "insufficient_evidence"
    assert all(any("soil information" in gap for gap in s["evidence_gaps"]) for s in result["scenarios"])


def test_outside_annual_rainfall_withholds_ranking():
    climate = {"usable_years": 10, "annual_rainfall_median_mm": 2446, "temperature_mean_c": 27}
    result = evaluate(farm(), ["maize", "mung-bean", "sweet-potato"], {"climate": 6, "soil": 2, "rotation": 2}, climate)
    assert len(result["scenarios"]) == 2
    assert result["ranking_status"] == "insufficient_evidence"
    assert all(s["score"] is None for s in result["scenarios"])


def test_health_and_coordinate_validation():
    from pydantic import ValidationError
    assert catalog()["version"]
    with pytest.raises(ValidationError):
        Farm(latitude=91, longitude=100, area_hectares=1, soil_type="loam", soil_source="unknown", irrigation="none", existing_crop_id="maize")
    with pytest.raises(ValidationError):
        EvaluateRequest(farm=farm(), crop_ids=["maize", "mung-bean"], priorities={"climate": float("inf")}, start_year=2020, end_year=2020)
    with pytest.raises(ValueError):
        evaluate(farm(), ["mung-bean"], {"climate": float("nan")}, {"usable_years": 4, "annual_rainfall_median_mm": 800, "temperature_mean_c": 27})
