import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { ArrowRight, ChartNoAxesCombined, MapPin, Sprout } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "./components/ui/button";
import {
  evaluate,
  getCatalog,
  getClimate,
  type Catalog,
  type Climate,
  type Evaluation,
  type Farm,
} from "./api";
import "./App.css";

const example: Farm = {
  latitude: 6.12,
  longitude: 100.36,
  area_hectares: 1.5,
  soil_type: "unknown",
  soil_source: "unknown",
  soil_ph: null,
  irrigation: "unknown",
  existing_crop_id: "paddy",
};
const icon = L.divIcon({
  html: '<span style="display:block;width:20px;height:20px;background:#176a4d;border:3px solid white;border-radius:50%;box-shadow:0 2px 9px #143d35"></span>',
  className: "",
  iconSize: [20, 20],
});
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function MapClick({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click: (e) =>
      onPick(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4))),
  });
  return null;
}
function MapView({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
      map.setView([latitude, longitude], map.getZoom());
    }
  }, [latitude, longitude, map]);
  return null;
}
function Header() {
  return (
    <header className="top">
      <Link className="brand" to="/">
        ✳ AgriShift AI
      </Link>
      <nav className="nav">
        <Link to="/">Overview</Link>
        <Link to="/farm">Farm setup</Link>
        <Link to="/climate">Climate</Link>
        <Link to="/planner">Planner</Link>
      </nav>
      <span className="badge">Independent student prototype</span>
    </header>
  );
}
function Head({
  step,
  title,
  subtitle,
}: {
  step: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="pagehead">
      <span>{step}</span>
      <h1>{title}</h1>
      <p className="muted">{subtitle}</p>
    </div>
  );
}
function Home({ catalog }: { catalog: Catalog | null }) {
  const regional = catalog?.regional_context ?? [];
  return (
    <>
      <div className="hero">
        <div>
          <span className="eyebrow">Earth data for better questions</span>
          <h1>Explore Kedah crop systems through historical climate.</h1>
          <p className="lead">
            View NASA POWER climate for a hypothetical Kedah farm and inspect
            sourced regional crop context. Seasonal rotation comparisons are
            available only for the separate exploratory annual catalog.
          </p>
          <div className="actions">
            <Link className="button" to="/farm">
              Analyze a farm <ArrowRight size={17} />
            </Link>
            <a
              className="button alt"
              href="https://power.larc.nasa.gov/docs/services/api/temporal/daily/"
              target="_blank"
              rel="noreferrer"
            >
              NASA POWER source
            </a>
          </div>
          <p className="muted small">
            Starts with a hypothetical farm in Kedah, Malaysia. Replace every
            example input.
          </p>
        </div>
        <div className="visual" role="img" aria-label="Illustrative landscape">
          <span>
            CASE STUDY
            <br />
            Kedah, Malaysia · 6.12°N, 100.36°E
          </span>
        </div>
      </div>
      <h2>From location to evidence</h2>
      <div className="steps">
        <div className="card">
          <MapPin color="#258454" />
          <h3>01 · Set up your farm</h3>
          <p className="muted">
            Choose a point, soil details, irrigation, and a current crop.
          </p>
        </div>
        <div className="card">
          <ChartNoAxesCombined color="#258454" />
          <h3>02 · Read the climate record</h3>
          <p className="muted">
            Explore historical rainfall and temperature with source and
            coverage.
          </p>
        </div>
        <div className="card">
          <Sprout color="#258454" />
          <h3>03 · Compare scenarios</h3>
          <p className="muted">
            Inspect screening criteria, trade-offs, and missing evidence.
          </p>
        </div>
      </div>
      <section
        className="regional-section"
        aria-labelledby="kedah-crops-heading"
      >
        <div className="regional-heading">
          <div>
            <span className="eyebrow">Kedah crop context</span>
            <h2 id="kedah-crops-heading">Staple and industrial crops</h2>
          </div>
          <p className="muted small">
            Regional cultivation does not establish suitability for a particular
            field. Local scientific review is pending.
          </p>
        </div>
        <div className="context-grid">
          {regional.map((crop) => (
            <article className="card context-card" key={crop.id}>
              <span className="pill">
                {crop.planning_horizon === "multi_year"
                  ? "Multi-year crop"
                  : "Managed seasonal crop"}
              </span>
              <h3>{crop.name}</h3>
              <p className="small muted">
                <i>{crop.scientific_name}</i>
              </p>
              <p className="small">{crop.comparison_reason}</p>
              <p className="small muted">
                Context only · scientific review pending
              </p>
              <ul className="context-evidence">
                {crop.evidence.map((item) => (
                  <li key={item.url}>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {item.source_name} ({item.observation_year}) ↗
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
function FarmPage({
  farm,
  setFarm,
  catalog,
}: {
  farm: Farm;
  setFarm: (v: Farm) => void;
  catalog: Catalog | null;
}) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const contextCrop = catalog?.regional_context?.find(
    (crop) => crop.id === farm.existing_crop_id,
  );
  const patch = (v: Partial<Farm>) => setFarm({ ...farm, ...v });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !Number.isFinite(farm.latitude) ||
      Math.abs(farm.latitude) > 90 ||
      !Number.isFinite(farm.longitude) ||
      Math.abs(farm.longitude) > 180 ||
      farm.area_hectares <= 0 ||
      farm.area_hectares > 100000
    ) {
      setError("Check the coordinates and farm area.");
      return;
    }
    if (!catalog) {
      setError(
        "The crop catalog is unavailable. Retry loading it before continuing.",
      );
      return;
    }
    setError("");
    navigate("/climate");
  }
  return (
    <>
      <Head
        step="Step 1 / 4"
        title="Know your field"
        subtitle="Select a location and describe the farm. The Kedah preset is hypothetical, not surveyed."
      />
      <div className="two">
        <section className="panel">
          <h2>Farm location</h2>
          <MapContainer
            center={[farm.latitude, farm.longitude]}
            zoom={9}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[farm.latitude, farm.longitude]} icon={icon} />
            <MapView latitude={farm.latitude} longitude={farm.longitude} />
            <MapClick
              onPick={(latitude, longitude) => patch({ latitude, longitude })}
            />
          </MapContainer>
          <p className="muted small">
            Click the map to place the marker, or type coordinates. Tiles
            require internet.
          </p>
        </section>
        <form className="panel" onSubmit={submit}>
          <h2>Farm profile</h2>
          <div className="fields">
            <label className="field">
              Latitude
              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                required
                value={farm.latitude}
                onChange={(e) => patch({ latitude: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              Longitude
              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                required
                value={farm.longitude}
                onChange={(e) => patch({ longitude: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              Area (ha)
              <input
                type="number"
                step="any"
                min="0.01"
                max="100000"
                required
                value={farm.area_hectares}
                onChange={(e) =>
                  patch({ area_hectares: Number(e.target.value) })
                }
              />
            </label>
            <label className="field">
              Soil texture
              <select
                value={farm.soil_type}
                onChange={(e) =>
                  patch({ soil_type: e.target.value as Farm["soil_type"] })
                }
              >
                <option value="unknown">Unknown</option>
                <option value="clay">Clay</option>
                <option value="loam">Loam</option>
                <option value="sand">Sand</option>
              </select>
            </label>
            <label className="field">
              Soil source
              <select
                value={farm.soil_source}
                onChange={(e) =>
                  patch({ soil_source: e.target.value as Farm["soil_source"] })
                }
              >
                <option value="unknown">Unknown</option>
                <option value="farmer_report">Farmer report</option>
                <option value="lab_test">Lab test</option>
              </select>
            </label>
            <label className="field">
              Soil pH, optional
              <input
                type="number"
                min="0"
                max="14"
                step="0.1"
                placeholder="Unknown"
                value={farm.soil_ph ?? ""}
                onChange={(e) =>
                  patch({
                    soil_ph:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="field">
              Irrigation
              <select
                value={farm.irrigation}
                onChange={(e) =>
                  patch({ irrigation: e.target.value as Farm["irrigation"] })
                }
              >
                <option value="unknown">Unknown</option>
                <option value="none">None</option>
                <option value="limited">Limited</option>
                <option value="available">Available</option>
              </select>
            </label>
            <label className="field">
              Current crop
              <select
                value={farm.existing_crop_id}
                onChange={(e) => patch({ existing_crop_id: e.target.value })}
              >
                <optgroup label="Kedah staple and industrial context">
                  {catalog?.regional_context?.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Exploratory annual comparison">
                  {catalog?.crops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
          </div>
          {contextCrop && (
            <p className="note warn">
              {contextCrop.name} is available for historical climate context.{" "}
              {contextCrop.comparison_reason} No seasonal rotation score will be
              calculated.
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="actions">
            <Button type="submit">
              View climate <ArrowRight size={16} />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
function ClimatePage({
  farm,
  catalog,
  climate,
  setClimate,
}: {
  farm: Farm;
  catalog: Catalog | null;
  climate: Climate | null;
  setClimate: (v: Climate | null) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    getClimate(farm)
      .then((x) => {
        if (active) {
          setClimate(x);
          setError("");
        }
      })
      .catch((e) => {
        if (active) {
          setClimate(null);
          setError(e.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [farm, setClimate, retry]);
  const pattern =
    climate?.monthly_patterns.map((x) => ({
      ...x,
      name: months[x.month - 1],
    })) || [];
  const incompleteMonths =
    climate?.monthly.filter((month) => month.rainfall_mm === null).length ?? 0;
  const contextOnly = catalog?.regional_context?.some(
    (crop) => crop.id === farm.existing_crop_id,
  );
  return (
    <>
      <Head
        step="Step 2 / 4"
        title="Historical climate"
        subtitle="NASA POWER daily data summarized by month. These patterns are not a future forecast."
      />
      {loading && (
        <p className="loading" role="status">
          Retrieving NASA POWER data…
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}{" "}
          <button
            onClick={() => {
              setLoading(true);
              setRetry(retry + 1);
            }}
          >
            Retry
          </button>
        </p>
      )}
      {climate && (
        <>
          <div className="stats">
            <div className="stat">
              <span className="muted small">Record period</span>
              <strong>
                {climate.period.start_year}–{climate.period.end_year}
              </strong>
              <span className="small muted">Local solar time</span>
            </div>
            <div className="stat">
              <span className="muted small">Median annual rain</span>
              <strong>
                {climate.annual_rainfall_median_mm ?? "Unknown"}{" "}
                <small>mm</small>
              </strong>
              <span className="small muted">
                {climate.usable_years} complete years
              </span>
              {climate.annual_rainfall_range_mm && (
                <span className="small muted">
                  Annual range {climate.annual_rainfall_range_mm[0]}–
                  {climate.annual_rainfall_range_mm[1]} mm
                </span>
              )}
            </div>
            <div className="stat">
              <span className="muted small">Mean annual temperature</span>
              <strong>
                {climate.temperature_mean_c ?? "Unknown"} <small>°C</small>
              </strong>
              <span className="small muted">NASA POWER T2M</span>
            </div>
          </div>
          <div className="two">
            <div className="panel">
              <h2>Monthly rainfall</h2>
              <div className="chart">
                <ResponsiveContainer>
                  <BarChart data={pattern}>
                    <CartesianGrid stroke="#e6ece5" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis unit=" mm" />
                    <Tooltip />
                    <Bar
                      dataKey="rainfall_median_mm"
                      name="Median rainfall (mm)"
                      fill="#2e835e"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="small muted">
                Median of complete monthly totals. Gaps indicate missing
                coverage.
              </p>
            </div>
            <div className="panel">
              <h2>Monthly temperature</h2>
              <div className="chart">
                <ResponsiveContainer>
                  <LineChart data={pattern}>
                    <CartesianGrid stroke="#e6ece5" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis unit="°" domain={["auto", "auto"]} />
                    <Tooltip />
                    <Line
                      dataKey="temperature_mean_c"
                      name="Mean temperature (°C)"
                      stroke="#bc9452"
                      strokeWidth={3}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="small muted">
                Mean of valid monthly means across the historical years.
              </p>
            </div>
          </div>
          <div className="note">
            <strong>Source:</strong> {climate.source},{" "}
            {climate.parameters.join(", ")} (temperature {climate.units.T2M},
            rainfall {climate.units.PRECTOTCORR}). Retrieved{" "}
            {new Date(climate.retrieved_at).toLocaleDateString()}.{" "}
            {climate.stale_cache
              ? "Stale cached response after a NASA request failed."
              : climate.from_cache
                ? "Dated cache."
                : "Live retrieval."}{" "}
            <a
              className="source"
              href={climate.source_url}
              target="_blank"
              rel="noreferrer"
            >
              NASA API ↗
            </a>
          </div>
          {incompleteMonths > 0 && (
            <p className="note warn" role="status">
              {incompleteMonths} monthly totals withheld because one or more
              daily values are missing. Gaps are not estimated.
            </p>
          )}
          <div className="actions">
            <Link className="button alt" to="/farm">
              Edit farm
            </Link>
            <Link className="button" to="/planner">
              {contextOnly ? "Review crop evidence" : "Choose crops"}{" "}
              <ArrowRight size={16} />
            </Link>
          </div>
        </>
      )}
    </>
  );
}
function PlannerPage({
  catalog,
  farm,
  selected,
  setSelected,
  priorities,
  setPriorities,
  onEvaluate,
  loading,
  error,
}: {
  catalog: Catalog | null;
  farm: Farm;
  selected: string[];
  setSelected: (v: string[]) => void;
  priorities: Record<string, number>;
  setPriorities: (v: Record<string, number>) => void;
  onEvaluate: () => void;
  loading: boolean;
  error: string;
}) {
  const toggle = (id: string) =>
    setSelected(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  if (!catalog) {
    return (
      <p className="loading" role="status">
        Loading crop catalog…
      </p>
    );
  }
  const contextCrop = catalog.regional_context?.find(
    (crop) => crop.id === farm.existing_crop_id,
  );
  if (contextCrop) {
    return (
      <>
        <Head
          step="Step 3 / 4"
          title="Regional crop evidence"
          subtitle="Historical climate is available; seasonal rotation scoring for this crop awaits local scientific review."
        />
        <section className="panel">
          <span className="pill">
            {contextCrop.planning_horizon === "multi_year"
              ? "Multi-year crop"
              : "Managed seasonal crop"}
          </span>
          <h2>{contextCrop.name}</h2>
          <p className="muted">
            <i>{contextCrop.scientific_name}</i>
          </p>
          <p className="note warn" role="status">
            {contextCrop.comparison_reason} No rotation score or farm-specific
            suitability claim is available.
          </p>
          <h3>Regional evidence</h3>
          <ul>
            {contextCrop.evidence.map((item) => (
              <li key={item.url}>
                {item.claim}{" "}
                <a
                  className="source"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.source_name} ({item.observation_year}) ↗
                </a>
              </li>
            ))}
          </ul>
          <p className="small muted">
            This evidence shows regional occurrence, not suitability for the
            selected field. Review status: pending local scientific review.
          </p>
        </section>
        <div className="actions">
          <Link className="button alt" to="/climate">
            Back to climate
          </Link>
          <Link className="button" to="/farm">
            Edit farm
          </Link>
        </div>
      </>
    );
  }
  return (
    <>
      <Head
        step="Step 3 / 4"
        title="Build a comparison"
        subtitle="Choose two or three crops from the exploratory annual catalog. Your current crop anchors each sequence."
      />
      <section className="panel">
        <h2>Candidate crops</h2>
        <div className="crop-grid">
          {catalog?.crops.map((c) => (
            <label
              key={c.id}
              className={`choice ${selected.includes(c.id) ? "selected" : ""}`}
            >
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={() => toggle(c.id)}
              />{" "}
              <span className="pill">{c.family}</span>
              <h3>{c.name}</h3>
              <p className="small muted">
                <i>{c.scientific_name}</i> · documented cycle{" "}
                {c.duration_days.join("–")} days
              </p>
              <a
                className="source small"
                href={c.source_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                FAO Ecocrop ↗
              </a>
            </label>
          ))}
        </div>
      </section>
      <div className="two">
        <section className="panel">
          <h2>Priorities</h2>
          <p className="small muted">
            Weights are normalized. Water effects and soil-health benefits
            cannot be quantified. A positive water or rotation weight withholds
            ranking; soil weight uses pH only.
          </p>
          {(["climate", "water", "soil", "rotation"] as const).map((k) => (
            <label className="field" key={k} style={{ marginBottom: 12 }}>
              {k} ({priorities[k]})
              <input
                type="range"
                aria-label={`${k} priority`}
                min="0"
                max="10"
                value={priorities[k]}
                onChange={(e) =>
                  setPriorities({ ...priorities, [k]: Number(e.target.value) })
                }
              />
            </label>
          ))}
        </section>
        <section className="panel">
          <h2>What is compared</h2>
          <p className="note">
            Historical temperature and <strong>annual</strong> rainfall are
            screened against published broad species ranges. Farm pH is supplied
            by you. Family diversity is an unvalidated demonstration assumption.
          </p>
          <p className="muted">
            Current crop:{" "}
            {catalog?.crops.find((c) => c.id === farm.existing_crop_id)?.name}.
            Irrigation: {farm.irrigation}. Neither becomes a claimed water
            saving.
          </p>
        </section>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <Link className="button alt" to="/climate">
          Back to climate
        </Link>
        <Button
          onClick={onEvaluate}
          disabled={
            loading ||
            selected.length < 2 ||
            selected.length > 3 ||
            Object.values(priorities).every((v) => v === 0)
          }
        >
          {loading ? "Evaluating…" : "Compare scenarios"}{" "}
          <ArrowRight size={16} />
        </Button>
      </div>
    </>
  );
}
function ResultsPage({
  result,
  catalog,
}: {
  result: Evaluation | null;
  catalog: Catalog | null;
}) {
  if (!result)
    return (
      <>
        <Head
          step="Step 4 / 4"
          title="No comparison yet"
          subtitle="Set up a farm and choose crops first."
        />
        <Link className="button" to="/farm">
          Start analysis
        </Link>
      </>
    );
  const name = (id: string) =>
    catalog?.crops.find((c) => c.id === id)?.name || id;
  return (
    <>
      <Head
        step="Step 4 / 4"
        title="Explore the trade-offs"
        subtitle="Screening scenarios, not validated recommendations or probabilities of success."
      />
      <div className="stats">
        <div className="stat">
          <span className="small muted">Sequences</span>
          <strong>{result.scenarios.length}</strong>
        </div>
        <div className="stat">
          <span className="small muted">Ranking status</span>
          <strong style={{ fontSize: 18 }}>
            {result.ranking_status.replaceAll("_", " ")}
          </strong>
        </div>
        <div className="stat">
          <span className="small muted">Climate coverage</span>
          <strong>{result.climate.usable_years} years</strong>
        </div>
      </div>
      <p className="note warn">{result.method_note}</p>
      {result.climate.stale_cache && (
        <p className="note warn">
          NASA retrieval failed; this comparison used a stale cached response
          from {new Date(result.climate.retrieved_at).toLocaleDateString()}.
        </p>
      )}
      <div className="results">
        {result.scenarios.map((s, i) => (
          <article className="result" key={s.crop_ids.join("-")}>
            <span className="kicker">Scenario {i + 1}</span>
            <h2>{s.crop_ids.map(name).join(" → ")}</h2>
            <p>
              {s.score === null ? (
                <strong>Insufficient evidence for a score</strong>
              ) : (
                <>
                  <span className="score">{s.score}/100</span>{" "}
                  <span className="small muted">
                    climate/pH screening index only
                  </span>
                </>
              )}
            </p>
            <p className="small muted">
              Climate match: {s.criterion_scores.climate ?? "unknown"} · pH
              match: {s.criterion_scores.soil_ph ?? "unknown"} · water: unknown
            </p>
            {(s.evidence_gaps ?? []).length > 0 && (
              <ul className="evidence-gaps">
                {(s.evidence_gaps ?? []).map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            )}
            {s.flags.map((f, j) => (
              <div className="flag" key={`${f.crop_id}-${f.criterion}-${j}`}>
                <span>
                  <b>{name(f.crop_id)}</b> · {f.criterion.replaceAll("_", " ")}
                  <br />
                  <span className="muted">
                    {f.observed ?? "Unknown"} {f.unit}; optimal{" "}
                    {f.optimal.join("–")} {f.unit}
                  </span>
                </span>
                <span>
                  <b>{f.status.replaceAll("_", " ")}</b>
                  <br />
                  <a
                    className="source"
                    href={f.source_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    source ↗
                  </a>
                </span>
              </div>
            ))}
            <p className="small muted">{s.trade_offs.join(" ")}</p>
          </article>
        ))}
      </div>
      {result.scenarios.length === 0 && (
        <p className="error">
          No scenarios remain after the screening rules. Review the excluded
          sequences and inputs, then consult local expertise.
        </p>
      )}
      {result.excluded.length > 0 && (
        <section className="panel" style={{ marginTop: 20 }}>
          <h2>Excluded sequences</h2>
          <ul>
            {result.excluded.map((x, i) => (
              <li key={i}>
                {x.crop_ids.map(name).join(" → ")}: {x.reason}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="panel" style={{ marginTop: 20 }}>
        <h2>Evidence and limitations</h2>
        <ul>
          {result.limitations.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <p className="small muted">
          NASA POWER {result.climate.period.start_year}–
          {result.climate.period.end_year}, {result.climate.time_standard};
          catalog {result.catalog_version}; soil {result.farm.soil_source}.{" "}
          <a className="source" href={result.climate.source_url}>
            NASA source ↗
          </a>
        </p>
      </section>
      <div className="actions">
        <Link className="button alt" to="/planner">
          Change priorities
        </Link>
        <Link className="button" to="/farm">
          Analyze another farm
        </Link>
      </div>
    </>
  );
}
function Content() {
  const [farm, setFarm] = useState<Farm>(example);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [climate, setClimate] = useState<Climate | null>(null);
  const [selected, setSelected] = useState(["mung-bean", "sweet-potato"]);
  const [priorities, setPriorities] = useState<Record<string, number>>({
    climate: 6,
    water: 0,
    soil: 2,
    rotation: 2,
  });
  const [result, setResult] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [catalogRetry, setCatalogRetry] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    getCatalog()
      .then((data) => {
        setCatalog(data);
        setCatalogError("");
      })
      .catch((e) => setCatalogError(e.message));
  }, [catalogRetry]);
  async function onEvaluate() {
    setError("");
    setLoading(true);
    try {
      const x = await evaluate(farm, selected, priorities);
      setResult(x);
      navigate("/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Evaluation failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="shell">
      <Header />
      {!catalog && (
        <p
          className={catalogError ? "error" : "loading"}
          role={catalogError ? "alert" : "status"}
        >
          {catalogError || "Loading crop catalog…"}{" "}
          {catalogError && (
            <button
              onClick={() => {
                setCatalogError("");
                setCatalogRetry((n) => n + 1);
              }}
            >
              Retry
            </button>
          )}
        </p>
      )}
      <main>
        <Routes>
          <Route path="/" element={<Home catalog={catalog} />} />
          <Route
            path="/farm"
            element={
              <FarmPage
                farm={farm}
                setFarm={(v) => {
                  setFarm(v);
                  setClimate(null);
                  setResult(null);
                }}
                catalog={catalog}
              />
            }
          />
          <Route
            path="/climate"
            element={
              <ClimatePage
                farm={farm}
                catalog={catalog}
                climate={climate}
                setClimate={setClimate}
              />
            }
          />
          <Route
            path="/planner"
            element={
              <PlannerPage
                farm={farm}
                catalog={catalog}
                selected={selected}
                setSelected={setSelected}
                priorities={priorities}
                setPriorities={setPriorities}
                onEvaluate={onEvaluate}
                loading={loading}
                error={error}
              />
            }
          />
          <Route
            path="/results"
            element={<ResultsPage result={result} catalog={catalog} />}
          />
        </Routes>
      </main>
      <footer className="footer">
        <span>AgriShift AI · NASA Space Apps Challenge 2026</span>
        <span>Historical context · Independent student prototype</span>
      </footer>
    </div>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Content />
    </BrowserRouter>
  );
}
