# Build status

**Branch:** `20261113_update`
**Status:** User-journey clarity update is deployed and smoke-tested on Vercel. Scientific validation, traffic controls, and broader browser testing remain open.
**Date:** 2026-11-15 (Malaysia)

This is a factual checkpoint. The Kedah profile is hypothetical, and a displayed scenario is an exploratory screen, not a validated recommendation.

## User-journey clarity pass (2026-11-15)

- Clarified on the overview and farm pages that the default paddy path provides climate and regional evidence, not a rotation score. Marked area, soil texture, and irrigation as context-only inputs for the current calculation.
- Added a historical rainfall summary derived from usable monthly NASA POWER patterns, including an explicit no-forecast caveat and a missing-coverage fallback.
- Added a paddy/perennial evidence summary showing known context, unverified farm/scientific inputs, and a next step. Clarified the exploratory annual result when an overall ranking is withheld.
- Frontend verification: Vitest **9 passed**, ESLint passed, Prettier check passed, TypeScript/Vite production build passed, and `git diff --check` passed. The build still warns about an approximately 861 kB JavaScript chunk.
- The UI commit `6abf314` changed no backend algorithm, crop threshold, or NASA adapter. Scientific review is still required before paddy or perennial recommendations.

## Vercel production release: user-journey clarity (2026-11-15)

- After explicit user authorization, deployed feature-branch UI commit `6abf314` with `npx --yes vercel@latest deploy --prod --yes --logs`. Vercel deployment `dpl_98DMCgroWFGpBf4gb3VJhi8B6788` reached **READY** and was aliased to <https://agrishift-ai.vercel.app>. `main` was not merged.
- The Vercel cloud build passed the Vite/TypeScript build and packaged the FastAPI service with Python 3.14. The approximately 861 kB JavaScript chunk warning remains.
- Unauthenticated public HTTP returned 200 for `/`, `/farm`, `/climate`, `/api/health`, and `/api/crops`. The served JavaScript bundle contained the new scope and climate-explanation text. Health returned `status: ok`; the catalog returned 3 exploratory and 5 Kedah context crops.
- The live 2015–2024 NASA POWER climate request for the hypothetical Kedah point returned 120 monthly records, 10 usable years, temperature unit `C`, and precipitation unit `mm/day`. A paddy evaluation returned HTTP 422 with `CROP_CONTEXT_ONLY`.
- Direct browser interaction, mobile layout, failure states, CI for the documentation commit, and sustained traffic were not verified in this release pass. The unrelated untracked preparation report was not included in the commits.

## Vercel hosting preparation (2026-11-15)

- Added repository-root `vercel.json` for Vite and FastAPI services under one origin. Production builds now use same-origin `/api` calls when `VITE_API_BASE_URL` is unset. Added a step-by-step guide in `deploy_vercel.md`.
- Local verification: backend Pytest **19 passed** (outside the restricted filesystem sandbox, where the async harness stalled); frontend Vitest **8 passed**, lint, format check, and production build passed. No `localhost:8000` API URL appears in the production assets. The ~856 kB JavaScript chunk warning remains.
- Official Vercel CLI 65.16.0 detected both services. `vercel dev --local` could not finish on this Windows machine because the CLI cache could not create symlinks (`EPERM`). At this preparation checkpoint, a cloud build and live route test were still needed; see the deployment record below for their outcome.
- The Vercel GitHub app was installed for only this repository. CLI created and linked `shafiq10/agrishift-ai` with root `.` and Services preset, without automatic Git deployment. A dry run found 51 included files and excluded the local token, virtual environments, generated assets, tests, and documentation.
- Vercel rejected a first Preview deployment because a new project's first deployment must target Production. Automatic approval review rejected the public Production deployment command before it ran, citing the need for explicit authorization for this newly disclosed public step. At that point no deployment had occurred; explicit user approval and deployment followed below.

## Vercel deployment (2026-11-15)

- After explicit user approval, Vercel CLI deployed the checked-out feature branch to Production. Deployment `dpl_8F6XKFDnF7a91J9VyV5FnnUim8VW` is **Ready** at <https://agrishift-ai.vercel.app>. Git is not connected for automatic deployment, and `main` was not merged.
- The cloud build installed frontend dependencies, passed the TypeScript/Vite build, and built the Python 3.14 FastAPI service. The frontend retains an ~856 kB JavaScript chunk warning.
- Public HTTP returned 200 for `/`, `/farm`, `/api/health`, and `/api/crops`. The catalog contained 3 exploratory and 5 context-only Kedah crops. A live NASA POWER request for 2015–2024 returned 120 monthly records and 10 usable years with source metadata; a one-year request returned the documented `C` and `mm/day` units.
- The public API rejected paddy evaluation with 422 `CROP_CONTEXT_ONLY`. An exploratory request returned 2 scenarios with `insufficient_evidence`. Browser navigation showed the regional evidence cards, hypothetical farm profile, live climate charts, and paddy evidence view with no scoring action.
- An authenticated Vercel CLI check unexpectedly created an automation bypass secret. It was revoked; the public Production URL was independently confirmed reachable without credentials. Browser mobile layout, all failure states, and sustained traffic remain unverified.

## Kedah crop-context update (2026-11-13)

| Stage | Status | Verification and remaining work |
|---|---|---|
| 1. Regional evidence and backend contract | Complete | Five context-only crops (paddy, rubber, oil palm, coconut, Robusta coffee) have cited Kedah evidence, year, planning horizon, and explicit review status. No agronomic thresholds were added. `/api/crops` exposes them; `/api/rotations/evaluate` rejects them before a NASA request. Focused backend suite: **19 passed**. |
| 2. Frontend context and guardrails | Complete | Overview shows the five sourced regional crops; farm setup accepts them as current-crop context. The hypothetical default is paddy with soil and irrigation unknown. The planner shows evidence and no evaluation action for context-only crops. Frontend: **8 tests passed**, lint and production build passed; build retains an ~856 kB chunk warning. Windows Prettier line-ending configuration added and formatting check passed. |
| 3. Documentation and full verification | Complete for code scope | README, architecture, methodology, data sources, limitations, and the Kedah evidence register updated. Backend: **19 passed**. Frontend: **8 passed**, lint, formatting, and production build passed. Local HTTP: `/api/health` returned 200, `/api/crops` returned 3 exploratory and 5 regional crops, frontend returned 200, and its configured API URL pointed to port 8001. The ~856 kB build chunk warning remains. Local agronomy review and any seasonal paddy or perennial model remain pending. |

## Phase record

| Phase | Status | Evidence and remaining work |
|---|---|---|
| 1. Foundation | Complete | React/TypeScript/Vite frontend, FastAPI backend, routing, CORS, typed fetch client, environment examples, ignore rules, tests, and CI. Both apps started locally. |
| 2. NASA POWER | Complete for exploratory MVP | AG daily point adapter, four verified parameters and units, complete-month aggregation, retry, timeout, `Retry-After` handling, and 24-hour in-memory cache. Live 2015–2024 Kedah request returned 10 complete years. Cache does not persist across restarts. |
| 3. Farm profile | Complete for MVP | Leaflet/OSM map, manual coordinates, area, soil source/type/pH, irrigation, current crop; client and server validation. The preset is labeled hypothetical. |
| 4. Crop catalog | Complete for limited pilot | Three FAO Ecocrop species sheets are linked in each profile. Local variety, soil texture, planting-window, and rotation evidence is not established. |
| 5. Rotation engine | Exploratory MVP | Current-crop-anchored two-crop sequences, pH hard screen, published-range flags, normalized weights, criterion detail, explicit evidence gaps, and withheld scores when evidence is inadequate. Family diversity is descriptive and unscored. No water, rotation-effect, or soil-health benefit model. |
| 6. Backend API | Complete for MVP | Health, climate, crops, and evaluate endpoints with Pydantic validation, structured errors, provenance, and OpenAPI. All four endpoints returned HTTP 200 in a local smoke test. |
| 7. Frontend | Complete for MVP | Five responsive screens, charts, map, inputs, scenario cards, source links, loading, error, and empty states. The workflow was visually checked in the local browser. |
| 8. Integration | Complete for MVP | Farm → climate → planner → results exercised with live NASA data. Default Kedah run returned two exploratory scenarios and `insufficient_evidence`, not a fabricated score. |
| 9. Testing | Passing, with gaps | Backend tests cover aggregation, missing values, unit mismatch, NASA failures/429, cache isolation, range constraints, scoring, and typed API contracts. Frontend tests cover setup validation, loading, stale data, catalog retry, API errors, and basic navigation. Automated browser E2E and accessibility tests are absent. |
| 10. Deployment readiness | Deployed with follow-up work | Public Vercel deployment is Ready; homepage, catalog, live climate, context-only guard, and exploratory API passed smoke tests. Automatic Git deployments are disconnected. Traffic controls, broader browser testing, and operational monitoring remain open. |
| 11. Documentation | Complete for MVP | README, architecture, methodology, data sources, limitations, coding rules, and this status file. Initial preparation documents retained. |
| 12. Quality review | Local audit complete; production smoke test added | Local build, tests, lint, formatting, live API, browser workflow, working-tree review, dependency audit, and secret scan performed. Pre-audit push and PR CI passed; see live PR checks for audit commits. The 2026-11-15 Vercel smoke test is recorded above; a broader production audit remains open. |

## Verification

- Python 3.14.7 virtual environment: `python -m pytest -q` → **17 passed** on 2026-11-06 (run outside the Windows filesystem sandbox because its network restrictions stalled the async test harness).
- Frontend: `npm test` → **7 passed**; `npm run lint`, `npm run format:check`, and `npm run build` pass on 2026-11-06.
- NASA POWER: official daily API returned `T2M`, `T2M_MAX`, `T2M_MIN` in `C` and `PRECTOTCORR` in `mm/day` for a short 2024 Kedah sample. A 2015–2024 request at 6.12°N, 100.36°E returned 10 complete years, median annual precipitation 2446.48 mm, and mean annual temperature about 26.58 °C. These are API results for a hypothetical point, not farm measurements.
- Local HTTP smoke test: `GET /api/health`, `GET /api/crops`, `GET /api/climate`, and `POST /api/rotations/evaluate` returned 200. UI traversal reached results and displayed source/limitation details.
- `npm audit --omit=dev` and `pip-audit -r requirements.txt` reported no known production dependency advisories on 2026-11-06. Full `npm audit` reported 10 moderate advisories in development-only ESLint/transitive packages; do not force incompatible upgrades without review.
- Production frontend build emits a non-fatal warning for an approximately 851 kB JavaScript chunk. Route-level splitting is a later performance improvement.
- Draft [PR #15](https://github.com/Shafiqfaizzuddin/Agrishift-Ai/pull/15) was opened from this feature branch. Both the [push CI](https://github.com/Shafiqfaizzuddin/Agrishift-Ai/actions/runs/42049871780) and [PR CI](https://github.com/Shafiqfaizzuddin/Agrishift-Ai/actions/runs/42049944974) runs completed successfully for implementation commit `809fae5`.
- The [independent audit](05-audit-report-2026-11-06.md) records corrections, PASS/FAIL by subsystem, live evidence, and unresolved scientific/operational risks.

## Open scientific and operational work

1. Ask a local agronomist or extension officer to review crop variety choice, planting seasons, drainage, waterlogging, pest/disease rotations, and the meaning of the family-diversity heuristic for Kedah.
2. Validate actual farm soil pH, texture, irrigation, and history before interpreting any scenario. Soil texture and irrigation currently have no numeric effect.
3. Confirm FAO Ecocrop reuse terms and capture dated source snapshots before public presentation. FAO says the database was discontinued around 2015; species ranges alone do not establish local feasibility.
4. Monitor Vercel function usage and NASA request volume. Recheck public routes and error handling after changes. Connect Git only after deciding how `main` should become the production source; no merge has occurred.

Optional imagery, PDF export, localization, and AI explanations were not implemented.
