import { afterEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TileLayer: () => null,
  Marker: () => null,
  useMapEvents: () => null,
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
      json: async () => ({ version: "test", note: "fixture", crops: [] }),
    }),
  );
  render(<App />);
  expect(
    screen.getByRole("heading", { name: /plan the next season/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/hypothetical farm in Kedah/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /analyze a farm/i })).toHaveAttribute(
    "href",
    "/farm",
  );
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
