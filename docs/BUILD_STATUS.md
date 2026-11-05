# Build status

**Branch:** `feat/agrishift-mvp`  
**Status:** Audited exploratory MVP on draft PR #15. Local audit checks pass; scientific and public deployment readiness remain open.
**Date:** 2026-11-06 (Malaysia)

This is a factual checkpoint. The Kedah profile is hypothetical, and a displayed scenario is an exploratory screen, not a validated recommendation.

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
| 10. Deployment readiness | Prepared, not deployed | Render blueprint, Vercel rewrite, CORS and API URL instructions. Production origin, cloud service, and private preview need authorized setup and verification. |
| 11. Documentation | Complete for MVP | README, architecture, methodology, data sources, limitations, coding rules, and this status file. Initial preparation documents retained. |
| 12. Quality review | Local audit complete | Local build, tests, lint, formatting, live API, browser workflow, working-tree review, dependency audit, and secret scan performed. Pre-audit push and PR CI passed; see live PR checks for audit commits. Production remains unverified. |

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
4. Verify Vercel/Render settings in an authorized private preview. No deployment or merge has occurred.

Optional imagery, PDF export, localization, and AI explanations were not implemented.
