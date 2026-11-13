export type Farm = {
  latitude: number;
  longitude: number;
  area_hectares: number;
  soil_type: "clay" | "loam" | "sand" | "unknown";
  soil_source: "lab_test" | "farmer_report" | "unknown";
  soil_ph: number | null;
  irrigation: "none" | "limited" | "available" | "unknown";
  existing_crop_id: string;
};
export type Crop = {
  id: string;
  name: string;
  scientific_name: string;
  family: string;
  duration_days: [number, number];
  temperature_optimal_c: [number, number];
  annual_rainfall_optimal_mm: [number, number];
  ph_optimal: [number, number];
  source_url: string;
  quality_note: string;
};
export type RegionalCrop = {
  id: string;
  name: string;
  scientific_name: string;
  system: "managed_paddy" | "perennial_crop";
  planning_horizon: "seasonal_schedule" | "multi_year";
  comparison_status: "context_only";
  comparison_reason: string;
  review_status: "pending_local_scientific_review";
  evidence: {
    claim: string;
    source_name: string;
    observation_year: number;
    url: string;
  }[];
};
export type Catalog = {
  version: string;
  note: string;
  crops: Crop[];
  regional_context_version: string;
  regional_context_note: string;
  regional_context: RegionalCrop[];
};
export type Climate = {
  source: string;
  source_url: string;
  parameters: string[];
  units: Record<string, string>;
  time_standard: string;
  period: { start_year: number; end_year: number };
  retrieved_at: string;
  from_cache: boolean;
  stale_cache?: boolean;
  monthly: {
    year: number;
    month: number;
    coverage: number;
    rainfall_mm: number | null;
    temperature_mean_c: number | null;
    temperature_max_c: number | null;
    temperature_min_c: number | null;
  }[];
  monthly_patterns: {
    month: number;
    years: number;
    rainfall_median_mm: number | null;
    temperature_mean_c: number | null;
  }[];
  annual: { year: number; annual_rainfall_mm: number | null }[];
  usable_years: number;
  annual_rainfall_median_mm: number | null;
  temperature_mean_c: number | null;
  annual_rainfall_range_mm: [number, number] | null;
  limitations: string[];
};
export type Flag = {
  crop_id: string;
  criterion: string;
  status: string;
  observed: number | null;
  optimal: [number, number];
  absolute: [number, number];
  unit: string;
  source_url: string;
  explanation: string;
};
export type Scenario = {
  crop_ids: string[];
  flags: Flag[];
  score: number | null;
  score_status: string;
  evidence_gaps: string[];
  criterion_scores: Record<string, number | null>;
  trade_offs: string[];
};
export type Evaluation = {
  farm: Farm;
  catalog_version: string;
  climate: Climate;
  scenarios: Scenario[];
  excluded: { crop_ids: string[]; reason: string }[];
  weights: Record<string, number>;
  ranking_status: string;
  method_note: string;
  advisory_status: string;
  limitations: string[];
};
const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
  } catch {
    throw new Error("Cannot reach the API. Check that the backend is running.");
  }
  const data = await r.json().catch(() => null);
  if (!r.ok)
    throw new Error(
      data?.error?.message ||
        data?.detail?.message ||
        `Request failed (${r.status})`,
    );
  return data as T;
}
export const getCatalog = () => request<Catalog>("/api/crops");
export const getClimate = (farm: Farm) =>
  request<Climate>(
    `/api/climate?latitude=${farm.latitude}&longitude=${farm.longitude}&start_year=2015&end_year=2024`,
  );
export const evaluate = (
  farm: Farm,
  crop_ids: string[],
  priorities: Record<string, number>,
) =>
  request<Evaluation>("/api/rotations/evaluate", {
    method: "POST",
    body: JSON.stringify({
      farm,
      crop_ids,
      priorities,
      start_year: 2015,
      end_year: 2024,
    }),
  });
