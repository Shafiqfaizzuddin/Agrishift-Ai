import os
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .catalog import catalog, crops_by_id, regional_context_by_id
from .climate import ClimateUnavailable, get_climate
from .models import CatalogResult, ClimateResult, EvaluateRequest, EvaluationResult
from .rotation import evaluate

app = FastAPI(title="AgriShift AI API", version="0.1.0")
origins = [x.strip() for x in os.getenv("AGRISHIFT_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


@app.exception_handler(ClimateUnavailable)
async def climate_error(_, exc: ClimateUnavailable):
    return JSONResponse(status_code=503, content={"error": {"code": "CLIMATE_UNAVAILABLE", "message": str(exc)}})


@app.exception_handler(HTTPException)
async def http_error(_: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else {"message": str(exc.detail)}
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": detail.get("code", "HTTP_ERROR"), "message": detail.get("message", "Request failed"), "details": detail}})


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError):
    details = [{"loc": list(e["loc"]), "message": e["msg"], "type": e["type"]} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"error": {"code": "INVALID_INPUT", "message": "Check request fields", "details": details}})


@app.get("/api/health")
async def health():
    return {"status": "ok", "catalog_version": catalog()["version"],
            "regional_context_version": catalog()["regional_context_version"]}


@app.get("/api/crops", response_model=CatalogResult)
async def crops():
    return catalog()


@app.get("/api/climate", response_model=ClimateResult)
async def climate(latitude: float = Query(ge=-90, le=90), longitude: float = Query(ge=-180, le=180),
                  start_year: int = Query(default=2015, ge=1981, le=2025), end_year: int = Query(default=2024, ge=1981, le=2025)):
    if end_year < start_year or end_year - start_year > 14:
        raise HTTPException(422, detail={"code": "INVALID_PERIOD", "message": "Choose up to 15 ordered historical years"})
    return await get_climate(latitude, longitude, start_year, end_year)


@app.post("/api/rotations/evaluate", response_model=EvaluationResult)
async def rotations(request: EvaluateRequest):
    known = crops_by_id()
    context = regional_context_by_id()
    requested_ids = request.crop_ids + [request.farm.existing_crop_id]
    unknown = [c for c in requested_ids if c not in known and c not in context]
    if unknown:
        raise HTTPException(422, detail={"code": "UNKNOWN_CROP", "message": "Select crops from the catalog", "crop_ids": unknown})
    context_only = [c for c in requested_ids if c in context]
    if context_only:
        raise HTTPException(422, detail={"code": "CROP_CONTEXT_ONLY",
                                         "message": "These Kedah crops have no reviewed seasonal rotation model.",
                                         "crop_ids": context_only,
                                         "reasons": {c: context[c]["comparison_reason"] for c in context_only}})
    result = await get_climate(request.farm.latitude, request.farm.longitude, request.start_year, request.end_year)
    comparison = evaluate(request.farm, request.crop_ids, request.priorities, result)
    return {"farm": request.farm.model_dump(), "catalog_version": catalog()["version"],
            "climate": result, **comparison,
            "advisory_status": "exploratory_unvalidated",
            "limitations": ["Not an official NASA product or local agronomic recommendation.",
                            "Historical NASA POWER data is not a future forecast.",
                            "Species-level FAO ranges do not establish local crop feasibility."]}
