# AgriShift AI

An independent student decision-support prototype for the 2026 NASA Space Apps Challenge, [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/). It shows historical NASA POWER climate for a hypothetical Kedah farm, documents five local staple and industrial crops, and retains a separate exploratory three-crop sequence screen using published FAO Ecocrop species ranges. It does **not** issue validated agronomic recommendations.

## What works

- Five-screen responsive workflow: overview, farm setup, climate analysis, planner, and results.
- Interactive OpenStreetMap location picker with manual coordinate entry.
- NASA POWER daily point retrieval for historical temperature and precipitation, with unit checks, missing-value handling, retries, and in-memory cache.
- Monthly rainfall and temperature charts, source period, completeness, and missing-month warnings from actual retrieved data. The API also returns annual rainfall variability.
- A sourced Kedah context register for paddy, rubber, oil palm, coconut, and Robusta coffee. These crops are not eligible for seasonal scoring. The default paddy example has unknown soil and irrigation inputs and is explicitly hypothetical.
- A separate three-crop exploratory screening catalog: maize, mung bean, and sweet potato.
- Current-crop-anchored two-crop comparisons with criterion flags, transparent screening index when evidence permits, and explicit insufficient-evidence states.
- Backend Pytest tests, frontend Vitest tests, ESLint, TypeScript production build, and GitHub Actions CI.

The screening index is **not a probability**. It does not forecast yield, revenue, water savings, or next-season weather. The default paddy path shows climate and evidence only: no paddy rotation score exists. The separate exploratory annual screen uses climate and pH ranges; positive water or rotation weights withhold ranking because numeric models are unavailable. FAO Ecocrop is an older, broad species database, and local scientific review is required. See [Kedah crop context](docs/kedah_crop_context.md), [methodology](docs/methodology.md), and [limitations](docs/limitations.md).

## Structure

```text
frontend/       React, TypeScript, Vite, Tailwind, shadcn-style Button, React Router, Leaflet, Recharts
backend/app/    FastAPI routes, NASA POWER adapter, Pandas aggregation, catalog, Kedah context, rotation screening
backend/tests/  Pytest synthetic fixtures and unit checks
docs/           Architecture, data sources, methodology, limitations, planning, build status
.github/        CI and collaboration templates
render.yaml     Render blueprint for API
vercel.json     Vercel Services configuration for the frontend and API together
```

## Local development

Prerequisites: Node.js 26 LTS, npm, Python 3.12+ compatible with the listed dependencies, and internet access for NASA POWER and map tiles. On the inspected Windows machine, `python` resolves to a broken WindowsApps alias; use `C:\Users\Shafiq Faizzuddin\AppData\Local\Python\bin\python.exe` or correct the alias. No API key is used for NASA POWER.

### Backend

From repository root, in PowerShell:

```powershell
& 'C:\Users\Shafiq Faizzuddin\AppData\Local\Python\bin\python.exe' -m venv backend/.venv
& backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
Set-Location backend
& .venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Use a working `python` command instead of the machine-specific path on other computers. API docs: `http://127.0.0.1:8000/docs`; health: `http://127.0.0.1:8000/api/health`.

If port 8000 is already occupied, start Uvicorn with `--port 8001` and set `$env:VITE_API_BASE_URL = "http://127.0.0.1:8001"` in the frontend terminal before `npm run dev`. The backend CORS defaults permit the local Vite origin.

### Frontend

In a second terminal:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. Copy `backend/.env.example` and `frontend/.env.example` to local `.env` files only if overriding defaults. Do not commit `.env`. In local development the frontend uses `VITE_API_BASE_URL`, defaulting to `http://localhost:8000`. A production build without that variable calls the same-origin `/api` routes. The backend CORS defaults permit `http://localhost:5173` and `http://127.0.0.1:5173` for local development.

## Verification

```powershell
Set-Location backend
& .venv/Scripts/python.exe -m pytest -q
Set-Location ../frontend
npm run lint
npm run format:check
npm test
npm run build
```

Tests use synthetic fixtures and never present them as NASA observations. A live API smoke test with the Kedah example was performed during development; repeat it when the service is running and network access is available.

## Vercel hosting

The application is hosted at [agrishift-ai.vercel.app](https://agrishift-ai.vercel.app). The repository-root `vercel.json` configures a Vite web service and a FastAPI service on the same origin, so browser requests use `/api` without `VITE_API_BASE_URL`. The first deployment was made from feature branch `20261113_update` after explicit approval; it did not merge `main`. The Vercel project is not yet connected for automatic Git deployments, so subsequent releases require a deliberate deployment. The backend `.python-version` selects Python 3.14. See the [step-by-step Vercel guide](docs/deploy_vercel.md) for verification and update instructions. The older `frontend/vercel.json` and `render.yaml` remain available for a separate frontend/Render deployment if needed.

## Evidence, attribution, and status

See [architecture](docs/architecture.md), [data sources and third-party attribution](docs/data_sources.md), [scientific methodology](docs/methodology.md), [limitations](docs/limitations.md), the [independent audit](docs/05-audit-report-2026-11-06.md), and the current [build status](docs/BUILD_STATUS.md). The initial [requirements](docs/01-requirements-and-mvp.md), [planning architecture](docs/02-architecture-data-and-science.md), and [GitHub backlog](docs/03-issues-and-build-sequence.md) remain as preparation records. The source repository's [MIT license](LICENSE) covers project code; third-party data and libraries retain their own terms. This project is not affiliated with or endorsed by NASA.

For screenshots, capture the farm setup, climate source/coverage view, and a result showing the insufficient-evidence state. Label the hypothetical Kedah inputs and cite the actual NASA retrieval period in any submission materials.
