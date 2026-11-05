import { afterEach, describe, expect, it, vi } from "vitest";
import { getClimate, request, type Farm } from "./api";
const farm: Farm = {
  latitude: 6.12,
  longitude: 100.36,
  area_hectares: 1,
  soil_type: "loam",
  soil_source: "farmer_report",
  soil_ph: 6,
  irrigation: "limited",
  existing_crop_id: "maize",
};
afterEach(() => vi.unstubAllGlobals());
describe("API client", () => {
  it("preserves coordinates and historical period", async () => {
    const mock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ source: "test" }) });
    vi.stubGlobal("fetch", mock);
    await getClimate(farm);
    expect(mock.mock.calls[0][0]).toContain("latitude=6.12");
    expect(mock.mock.calls[0][0]).toContain("start_year=2015");
  });
  it("surfaces API and network errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: { message: "NASA unavailable" } }),
      }),
    );
    await expect(request("/api/climate")).rejects.toThrow("NASA unavailable");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(request("/api/climate")).rejects.toThrow(
      "Cannot reach the API",
    );
  });
});
