from typing import Literal
import math
from pydantic import BaseModel, Field, model_validator


class Farm(BaseModel):
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)
    area_hectares: float = Field(gt=0, le=100000, allow_inf_nan=False)
    soil_type: Literal["clay", "loam", "sand", "unknown"]
    soil_source: Literal["lab_test", "farmer_report", "unknown"]
    soil_ph: float | None = Field(default=None, ge=0, le=14, allow_inf_nan=False)
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
        if (any(not math.isfinite(v) or v < 0 or v > 10 for v in self.priorities.values())
                or not math.isfinite(sum(self.priorities.values()))
                or sum(self.priorities.values()) <= 0):
            raise ValueError("Priorities must be finite values from 0 to 10 with a positive total")
        return self


class Period(BaseModel):
    start_year: int
    end_year: int


class ClimateMonth(BaseModel):
    year: int
    month: int
    coverage: float
    rainfall_mm: float | None
    temperature_mean_c: float | None
    temperature_max_c: float | None
    temperature_min_c: float | None


class MonthlyPattern(BaseModel):
    month: int
    years: int
    rainfall_median_mm: float | None
    temperature_mean_c: float | None


class AnnualSummary(BaseModel):
    year: int
    complete_months: int
    annual_rainfall_mm: float | None
    annual_temperature_mean_c: float | None


class ClimateResult(BaseModel):
    source: str
    source_url: str
    parameters: list[str]
    units: dict[str, str]
    time_standard: str
    period: Period
    retrieved_at: str
    from_cache: bool
    stale_cache: bool = False
    monthly: list[ClimateMonth]
    monthly_patterns: list[MonthlyPattern]
    annual: list[AnnualSummary]
    usable_years: int
    annual_rainfall_median_mm: float | None
    temperature_mean_c: float | None
    annual_rainfall_range_mm: list[float] | None
    limitations: list[str]


class CatalogResult(BaseModel):
    version: str
    note: str
    crops: list["CropProfile"]
    regional_context_version: str
    regional_context_note: str
    regional_context: list["RegionalCropProfile"]


class RegionalEvidence(BaseModel):
    claim: str
    source_name: str
    observation_year: int
    url: str


class RegionalCropProfile(BaseModel):
    id: str
    name: str
    scientific_name: str
    system: Literal["managed_paddy", "perennial_crop"]
    planning_horizon: Literal["seasonal_schedule", "multi_year"]
    comparison_status: Literal["context_only"]
    comparison_reason: str
    review_status: Literal["pending_local_scientific_review"]
    evidence: list[RegionalEvidence]


class CropProfile(BaseModel):
    id: str
    name: str
    scientific_name: str
    family: str
    duration_days: tuple[int, int]
    temperature_optimal_c: tuple[float, float]
    temperature_absolute_c: tuple[float, float]
    annual_rainfall_optimal_mm: tuple[float, float]
    annual_rainfall_absolute_mm: tuple[float, float]
    ph_optimal: tuple[float, float]
    ph_absolute: tuple[float, float]
    soil_texture: list[str] | None
    source_url: str
    quality_note: str


class CriterionFlag(BaseModel):
    crop_id: str
    criterion: Literal["temperature", "annual_rainfall", "soil_ph"]
    status: Literal["unknown", "outside_published_range", "within_optimal_range", "within_absolute_range"]
    observed: float | None
    optimal: tuple[float, float]
    absolute: tuple[float, float]
    unit: str
    source_url: str
    explanation: str


class Scenario(BaseModel):
    crop_ids: list[str]
    flags: list[CriterionFlag]
    score: float | None
    score_status: Literal["screening_only", "insufficient_evidence"]
    evidence_gaps: list[str]
    criterion_scores: dict[str, float | None]
    trade_offs: list[str]


class ExcludedSequence(BaseModel):
    crop_ids: list[str]
    reason: str


class EvaluationResult(BaseModel):
    farm: Farm
    catalog_version: str
    climate: ClimateResult
    scenarios: list[Scenario]
    excluded: list[ExcludedSequence]
    weights: dict[str, float]
    ranking_status: Literal["screening_only", "insufficient_evidence"]
    method_note: str
    advisory_status: str
    limitations: list[str]
