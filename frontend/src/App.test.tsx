import { afterEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";

const regionalFixture = {
  id: "paddy",
  name: "Paddy (rice)",
  scientific_name: "Oryza sativa",
  system: "managed_paddy",
  planning_horizon: "seasonal_schedule",
  comparison_status: "context_only",
  comparison_reason: "A local planting schedule and field rules need review.",
  review_status: "pending_local_scientific_review",
  evidence: [
    {
      claim: "Paddy is grown in Kedah (test fixture).",
      source_name: "TEST FIXTURE SOURCE",
      observation_year: 2023,
      url: "https://example.org/test-fixture",
    },
  ],
};
const catalogFixture = {
  version: "test",
  note: "fixture",
  crops: [{ id: "maize", name: "Maize" }],
  regional_context_version: "test",
  regional_context_note: "fixture",
  regional_context: [regionalFixture],
};

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TileLayer: () => null,
  Marker: () => null,
  useMapEvents: () => null,
  useMap: () => ({ setView: () => null, getZoom: () => 9 }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

it("introduces the evidence-based workflow and example status", async () => {
  window.history.pushState({}, "", "/");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => catalogFixture,
    }),
  );
  render(<App />);
  expect(
    screen.getByRole("heading", { name: /explore kedah crop systems/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/hypothetical farm in Kedah/i)).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /know what this example can answer/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /analyze a farm/i })).toHaveAttribute(
    "href",
    "/farm",
  );
  expect(
    await screen.findByRole("heading", { name: "Paddy (rice)" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /TEST FIXTURE SOURCE/i }),
  ).toHaveAttribute("href", "https://example.org/test-fixture");
});

it("does not offer seasonal scoring for the default paddy example", async () => {
  window.history.pushState({}, "", "/planner");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => catalogFixture }),
  );
  render(<App />);
  expect(
    await screen.findByRole("heading", { name: /regional crop evidence/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/no rotation score or farm-specific/i),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /what we know/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /what we cannot verify/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/filling in this form alone/i)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /compare scenarios/i }),
  ).not.toBeInTheDocument();
});

it("rejects an invalid farm area before climate retrieval", () => {
  window.history.pushState({}, "", "/farm");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        version: "test",
        note: "fixture",
        crops: [{ id: "maize", name: "Maize" }],
      }),
    }),
  );
  render(<App />);
  fireEvent.change(screen.getByRole("spinbutton", { name: /area/i }), {
    target: { value: "0" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: /view climate/i }).closest("form")!,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    /check the coordinates and farm area/i,
  );
});

it("shows a loading state while climate retrieval is pending", () => {
  window.history.pushState({}, "", "/climate");
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      url.includes("/api/climate")
        ? new Promise(() => {})
        : Promise.resolve({
            ok: true,
            json: async () => ({ version: "test", note: "fixture", crops: [] }),
          }),
    ),
  );
  render(<App />);
  expect(screen.getByText(/retrieving nasa power data/i)).toBeInTheDocument();
});

it("offers a retry when the crop catalog request fails", async () => {
  window.history.pushState({}, "", "/");
  const fetchMock = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue({
      ok: true,
      json: async () => ({ version: "test", note: "fixture", crops: [] }),
    });
  vi.stubGlobal("fetch", fetchMock);
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /cannot reach the api/i,
  );
  fireEvent.click(screen.getByRole("button", { name: /retry/i }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
  );
});

it("labels stale climate data and withheld monthly totals", async () => {
  window.history.pushState({}, "", "/climate");
  const fixture = {
    source: "TEST FIXTURE, not NASA observations",
    source_url: "https://power.larc.nasa.gov/api/temporal/daily/point",
    parameters: ["T2M", "PRECTOTCORR"],
    period: { start_year: 2020, end_year: 2020 },
    units: { T2M: "C", PRECTOTCORR: "mm/day" },
    retrieved_at: "2026-11-06T00:00:00Z",
    from_cache: true,
    stale_cache: true,
    monthly: [{ year: 2020, month: 1, coverage: 0.97, rainfall_mm: null }],
    monthly_patterns: [],
    usable_years: 0,
    annual_rainfall_median_mm: null,
    temperature_mean_c: null,
  };
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve({
        ok: true,
        json: async () =>
          url.includes("/api/climate")
            ? fixture
            : { version: "test", note: "fixture", crops: [] },
      }),
    ),
  );
  render(<App />);
  expect(await screen.findByText(/stale cached response/i)).toBeInTheDocument();
  expect(screen.getByText(/1 monthly totals withheld/i)).toBeInTheDocument();
  expect(
    screen.getByText(/too few complete monthly rainfall records/i),
  ).toBeInTheDocument();
});

it("explains observed rainfall highs and lows without implying a forecast", async () => {
  window.history.pushState({}, "", "/climate");
  const fixture = {
    source: "TEST FIXTURE, not NASA observations",
    source_url: "https://power.larc.nasa.gov/api/temporal/daily/point",
    parameters: ["T2M", "PRECTOTCORR"],
    period: { start_year: 2020, end_year: 2021 },
    units: { T2M: "C", PRECTOTCORR: "mm/day" },
    retrieved_at: "2026-11-06T00:00:00Z",
    from_cache: false,
    monthly: [],
    monthly_patterns: [
      { month: 1, years: 2, rainfall_median_mm: 100, temperature_mean_c: 25 },
      { month: 2, years: 2, rainfall_median_mm: 250, temperature_mean_c: 26 },
    ],
    usable_years: 2,
    annual_rainfall_median_mm: null,
    temperature_mean_c: 25.5,
  };
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve({
        ok: true,
        json: async () =>
          url.includes("/api/climate")
            ? fixture
            : { version: "test", note: "fixture", crops: [] },
      }),
    ),
  );
  render(<App />);
  expect(
    await screen.findByText(
      /highest in Feb \(250 mm\) and lowest in Jan \(100 mm\)/i,
    ),
  ).toBeInTheDocument();
  expect(screen.getByText(/not field measurements/i)).toBeInTheDocument();
});
