from typing import Literal
from pydantic import BaseModel, Field, model_validator


class Farm(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    area_hectares: float = Field(gt=0, le=100000)
    soil_type: Literal["clay", "loam", "sand", "unknown"]
    soil_source: Literal["lab_test", "farmer_report", "unknown"]
    soil_ph: float | None = Field(default=None, ge=0, le=14)
    irrigation: Literal["none", "limited", "available", "unknown"]
    existing_crop_id: str


class EvaluateRequest(BaseModel):
    farm: Farm
    crop_ids: list[str] = Field(min_length=2, max_length=3)
    priorities: dict[Literal["climate", "water", "soil", "rotation"], float]
    start_year: int = Field(ge=1981, le=2025)
    end_year: int = Field(ge=1981, le=2025)

    @model_validator(mode="after")
    def valid_period(self):
        if self.end_year < self.start_year or self.end_year - self.start_year > 14:
            raise ValueError("Choose an ordered historical period of at most 15 years")
        if len(set(self.crop_ids)) != len(self.crop_ids):
            raise ValueError("Select distinct crop IDs")
        if any(v < 0 for v in self.priorities.values()) or sum(self.priorities.values()) <= 0:
            raise ValueError("Priorities must be nonnegative with a positive total")
        return self


class ClimateResult(BaseModel):
    source: str
    source_url: str
    parameters: list[str]
    units: dict[str, str]
    time_standard: str
    period: dict[str, int]
    retrieved_at: str
    from_cache: bool
    stale_cache: bool = False
    monthly: list[dict]
    monthly_patterns: list[dict]
    annual: list[dict]
    usable_years: int
    annual_rainfall_median_mm: float | None
    temperature_mean_c: float | None
    annual_rainfall_range_mm: list[float] | None
    limitations: list[str]


class CatalogResult(BaseModel):
    version: str
    note: str
    crops: list[dict]


class EvaluationResult(BaseModel):
    farm: Farm
    catalog_version: str
    climate: ClimateResult
    scenarios: list[dict]
    excluded: list[dict]
    weights: dict[str, float]
    ranking_status: str
    method_note: str
    advisory_status: str
    limitations: list[str]
