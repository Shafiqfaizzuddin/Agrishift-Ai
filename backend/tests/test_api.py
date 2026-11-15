"""Deterministic API contract checks; all climate values below are test fixtures."""

from fastapi.testclient import TestClient

from app import main
from app.climate import ClimateUnavailable


def climate_fixture():
    return {
        "source": "TEST FIXTURE, not NASA observations",
        "source_url": "https://power.larc.nasa.gov/api/temporal/daily/point",
        "parameters": ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR"],
        "units": {"T2M": "C", "T2M_MAX": "C", "T2M_MIN": "C", "PRECTOTCORR": "mm/day"},
        "time_standard": "LST",
        "period": {"start_year": 2020, "end_year": 2020},
        "retrieved_at": "2026-11-06T00:00:00+00:00",
        "from_cache": False,
        "monthly": [],
        "monthly_patterns": [],
        "annual": [],
        "usable_years": 4,
        "annual_rainfall_median_mm": 800,
        "temperature_mean_c": 27,
        "annual_rainfall_range_mm": [700, 900],
        "limitations": ["Test fixture only"],
    }


def evaluation_payload():
    return {
        "farm": {
            "latitude": 6.12, "longitude": 100.36, "area_hectares": 1.5,
            "soil_type": "loam", "soil_source": "farmer_report", "soil_ph": 6.5,
            "irrigation": "limited", "existing_crop_id": "maize",
        },
        "crop_ids": ["mung-bean", "sweet-potato"],
        "priorities": {"climate": 7, "water": 0, "soil": 3, "rotation": 0},
        "start_year": 2020, "end_year": 2020,
    }


def test_api_contracts_and_validation(monkeypatch):
    async def fake_climate(*_):
        return climate_fixture()

    monkeypatch.setattr(main, "get_climate", fake_climate)
    with TestClient(main.app) as client:
        assert client.get("/api/health").json()["status"] == "ok"
        crop_response = client.get("/api/crops").json()
        assert len(crop_response["crops"]) == 3
        assert len(crop_response["regional_context"]) == 5
        assert crop_response["regional_context"][0]["comparison_status"] == "context_only"
        response = client.get("/api/climate", params={"latitude": 6.12, "longitude": 100.36})
        assert response.status_code == 200
        assert response.json()["source"].startswith("TEST FIXTURE")
        invalid_point = client.get("/api/climate", params={"latitude": 91, "longitude": 100.36})
        assert invalid_point.status_code == 422
        assert invalid_point.json()["error"]["code"] == "INVALID_INPUT"
        schema = client.get("/openapi.json").json()["components"]["schemas"]
        assert schema["ClimateResult"]["properties"]["monthly"]["items"]["$ref"] == "#/components/schemas/ClimateMonth"
        assert schema["EvaluationResult"]["properties"]["scenarios"]["items"]["$ref"] == "#/components/schemas/Scenario"
        assert schema["CatalogResult"]["properties"]["regional_context"]["items"]["$ref"] == "#/components/schemas/RegionalCropProfile"
        result = client.post("/api/rotations/evaluate", json=evaluation_payload())
        assert result.status_code == 200
        assert result.json()["ranking_status"] == "screening_only"
        assert all(s["score_status"] == "screening_only" for s in result.json()["scenarios"])

        invalid = evaluation_payload()
        invalid["priorities"]["climate"] = -1
        response = client.post("/api/rotations/evaluate", json=invalid)
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "INVALID_INPUT"
        unknown = evaluation_payload()
        unknown["crop_ids"] = ["mung-bean", "not-in-catalog"]
        response = client.post("/api/rotations/evaluate", json=unknown)
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "UNKNOWN_CROP"


def test_nasa_failure_and_cors_contract(monkeypatch):
    async def unavailable(*_):
        raise ClimateUnavailable("Test NASA outage")

    monkeypatch.setattr(main, "get_climate", unavailable)
    with TestClient(main.app) as client:
        response = client.get("/api/climate", params={"latitude": 6.12, "longitude": 100.36})
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "CLIMATE_UNAVAILABLE"
        response = client.options("/api/crops", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"})
        assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
        response = client.options("/api/crops", headers={"Origin": "https://untrusted.example", "Access-Control-Request-Method": "GET"})
        assert "access-control-allow-origin" not in response.headers


def test_context_only_crops_are_rejected_before_climate_request(monkeypatch):
    async def climate_must_not_be_called(*_):
        raise AssertionError("Unsupported crop must not trigger NASA retrieval")

    monkeypatch.setattr(main, "get_climate", climate_must_not_be_called)
    with TestClient(main.app) as client:
        for crop_id in ("paddy", "rubber", "oil-palm", "coconut", "coffee-robusta"):
            payload = evaluation_payload()
            payload["farm"]["existing_crop_id"] = crop_id
            response = client.post("/api/rotations/evaluate", json=payload)
            assert response.status_code == 422
            assert response.json()["error"]["code"] == "CROP_CONTEXT_ONLY"
            assert crop_id in response.json()["error"]["details"]["crop_ids"]
        payload = evaluation_payload()
        payload["crop_ids"] = ["mung-bean", "rubber"]
        response = client.post("/api/rotations/evaluate", json=payload)
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "CROP_CONTEXT_ONLY"
