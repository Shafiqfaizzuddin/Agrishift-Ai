import asyncio
from datetime import datetime, timezone
import math
import time

import httpx
import numpy as np
import pandas as pd

POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
PARAMETERS = ("T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR")
EXPECTED_UNITS = {"T2M": "C", "T2M_MAX": "C", "T2M_MIN": "C", "PRECTOTCORR": "mm/day"}
_CACHE: dict[tuple, tuple[float, dict]] = {}
MAX_CACHE_ENTRIES = 256


class ClimateUnavailable(Exception):
    pass


def parse_power(payload: dict, start_year: int, end_year: int) -> dict:
    try:
        parameters = payload["properties"]["parameter"]
        units = payload["parameters"]
        dates = sorted(set.intersection(*(set(parameters[p]) for p in PARAMETERS)))
        for p in PARAMETERS:
            actual = units[p]["units"].lower().replace(" ", "")
            if actual != EXPECTED_UNITS[p].lower():
                raise ValueError(f"Unexpected {p} units: {actual}")
        records = []
        for day in dates:
            if not (str(start_year) <= day[:4] <= str(end_year)):
                continue
            row = {"date": pd.to_datetime(day, format="%Y%m%d")}
            for p in PARAMETERS:
                value = parameters[p][day]
                row[p] = np.nan if value is None or not math.isfinite(float(value)) or float(value) <= -900 else float(value)
            if not math.isnan(row["PRECTOTCORR"]) and row["PRECTOTCORR"] < 0:
                row["PRECTOTCORR"] = np.nan
            records.append(row)
        if not records:
            raise ValueError("No daily records")
        # Reindex the requested period so missing dates and edge months stay visible.
        frame = (pd.DataFrame.from_records(records).set_index("date").sort_index()
                 .reindex(pd.date_range(f"{start_year}-01-01", f"{end_year}-12-31", freq="D")))
        monthly = []
        for month, group in frame.resample("MS"):
            expected = month.days_in_month
            valid_days = int(group[list(PARAMETERS)].notna().all(axis=1).sum())
            coverage = valid_days / expected
            complete = valid_days == expected
            monthly.append({"year": month.year, "month": month.month, "coverage": round(coverage, 3),
                            "rainfall_mm": round(float(group["PRECTOTCORR"].sum()), 2) if complete else None,
                            "temperature_mean_c": round(float(group["T2M"].mean()), 2) if complete else None,
                            "temperature_max_c": round(float(group["T2M_MAX"].max()), 2) if complete else None,
                            "temperature_min_c": round(float(group["T2M_MIN"].min()), 2) if complete else None})
        valid = [m for m in monthly if m["rainfall_mm"] is not None]
        by_month = []
        for m in range(1, 13):
            rows = [x for x in valid if x["month"] == m]
            by_month.append({"month": m, "years": len(rows),
                             "rainfall_median_mm": round(float(np.median([x["rainfall_mm"] for x in rows])), 2) if rows else None,
                             "temperature_mean_c": round(float(np.mean([x["temperature_mean_c"] for x in rows])), 2) if rows else None})
        years = []
        for year in range(start_year, end_year + 1):
            rows = [x for x in valid if x["year"] == year]
            years.append({"year": year, "complete_months": len(rows),
                          "annual_rainfall_mm": round(sum(x["rainfall_mm"] for x in rows), 2) if len(rows) == 12 else None,
                          "annual_temperature_mean_c": round(float(frame.loc[str(year), "T2M"].mean()), 2) if len(rows) == 12 else None})
        complete = [x for x in years if x["annual_rainfall_mm"] is not None]
        return {"source": "NASA POWER Daily Point API", "source_url": POWER_URL,
                "parameters": list(PARAMETERS), "units": EXPECTED_UNITS, "time_standard": "LST",
                "period": {"start_year": start_year, "end_year": end_year}, "retrieved_at": datetime.now(timezone.utc).isoformat(),
                "monthly": monthly, "monthly_patterns": by_month, "annual": years,
                "usable_years": len(complete), "annual_rainfall_median_mm": round(float(np.median([x["annual_rainfall_mm"] for x in complete])), 2) if complete else None,
                "temperature_mean_c": round(float(np.mean([x["annual_temperature_mean_c"] for x in complete])), 2) if complete else None,
                "annual_rainfall_range_mm": [min(x["annual_rainfall_mm"] for x in complete), max(x["annual_rainfall_mm"] for x in complete)] if complete else None,
                "limitations": ["Historical gridded climate context, not a field measurement or forecast."]}
    except (KeyError, TypeError, ValueError, ZeroDivisionError) as exc:
        raise ClimateUnavailable(f"Invalid NASA POWER response: {exc}") from exc


async def get_climate(lat: float, lon: float, start_year: int, end_year: int) -> dict:
    # Cache only exact requested points; rounding could silently return another farm's data.
    key = (lat, lon, start_year, end_year)
    cached = _CACHE.get(key)
    if cached and time.time() - cached[0] < 86400:
        return {**cached[1], "from_cache": True}
    params = {"latitude": lat, "longitude": lon, "start": f"{start_year}0101", "end": f"{end_year}1231",
              "community": "AG", "format": "JSON", "time-standard": "LST", "parameters": ",".join(PARAMETERS)}
    last_error = None
    async with httpx.AsyncClient(timeout=25) as client:
        for attempt in range(3):
            try:
                response = await client.get(POWER_URL, params=params)
                if response.status_code in (429, 500, 502, 503, 504):
                    last_error = f"NASA POWER HTTP {response.status_code}"
                    if attempt < 2:
                        delay = 2 ** attempt
                        if response.status_code == 429 and response.headers.get("Retry-After"):
                            try:
                                delay = float(response.headers["Retry-After"])
                            except ValueError:
                                break
                            if not math.isfinite(delay) or delay < 0 or delay > 30:
                                break
                        await asyncio.sleep(delay)
                        continue
                    break
                response.raise_for_status()
                result = parse_power(response.json(), start_year, end_year)
                if len(_CACHE) >= MAX_CACHE_ENTRIES:
                    oldest = min(_CACHE, key=lambda item: _CACHE[item][0])
                    _CACHE.pop(oldest)
                _CACHE[key] = (time.time(), result)
                return {**result, "from_cache": False}
            except httpx.HTTPStatusError as exc:
                last_error = f"NASA POWER HTTP {exc.response.status_code}"
                break
            except (httpx.RequestError, ValueError) as exc:
                last_error = str(exc)
                if attempt < 2:
                    await asyncio.sleep(2 ** attempt)
    if cached:
        return {**cached[1], "from_cache": True, "stale_cache": True}
    raise ClimateUnavailable(last_error or "NASA POWER unavailable")
