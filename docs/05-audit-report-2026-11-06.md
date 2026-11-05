# Independent MVP audit — 2026-11-06

**Scope:** `feat/agrishift-mvp`, local implementation and the hypothetical Kedah demonstration. No merge or public deployment was performed. The pre-existing untracked preparation report was left untouched.

**Verdict:** The software works as an **exploratory climate/pH screening prototype**. It is not a scientifically validated crop-rotation advisory tool or a verified production deployment. The [official Field Shift page](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/) returned HTTP 502 during this audit; the indexed official summary was available. Full challenge details and resources still need direct manual verification.

The indexed challenge summary asks for a decision-support tool combining NASA Earth observations, local soil information, crop characteristics, and farmer priorities to explore rotations that could improve soil health and resilience. The application combines those inputs and displays uncertainty. It cannot substantiate a soil-health or water-saving outcome, nor does it model planting dates or seasonal crop succession.

## Subsystem results

| Area | Result | Evidence and qualification |
|---|---|---|
| 1. Full-stack architecture | **PASS** | Monorepo, transient React state, FastAPI adapter/engine split, fixed NASA endpoint, restricted CORS. The service has no persistence. |
| 2. Frontend quality and usability | **PASS** | Desktop farm → climate → planner → results flow and 390 px mobile home/map/nav were visually checked. Loading, errors, empty results, evidence gaps, and source links render. No formal screen-reader study was done. |
| 3. Backend correctness | **PASS** | Validation, structured errors, deterministic aggregation and scoring, response-model checks, and fresh Uvicorn startup passed. |
| 4. NASA POWER integration | **PASS** | Live AG Daily Point request at 6.12°N, 100.36°E for 2015–2024 returned 10 complete years; `T2M`, `T2M_MAX`, `T2M_MIN` were `C`, `PRECTOTCORR` was `mm/day`, and LST was requested. A second evaluation used the genuine cache. |
| 5. Units and missing values | **PASS** | Unit mismatch, missing dates, `-999`, negative precipitation, and incomplete months have deterministic tests. Incomplete monthly rain totals are now withheld; no gap is imputed. |
| 6. Crop provenance | **PASS** | All catalog temperature, annual rainfall, pH, and crop-cycle ranges were matched against the three linked FAO Ecocrop sheets. This verifies transcription, not local suitability or reuse rights. |
| 7. Rotation algorithm correctness | **PASS for implemented screen** | Fixed inputs reproduce the same score and ordering. Hard pH screening cannot be overridden by a score. Out-of-range or missing evidence yields no overall score. No planting calendar or agronomic rotation efficacy is modeled. |
| 8. Scientific assumptions | **FAIL for validated advice** | The family-diversity observation, current-crop repeat rule, annual climate comparisons, and soil pH source are labeled. Water and rotation priorities withhold ranking. Local soil-health, drainage, irrigation, pest, and variety effects remain unvalidated. |
| 9. API contracts | **PASS** | Health, crops, climate, and evaluate return typed JSON; nested Pydantic models appear in OpenAPI. Invalid coordinates, priorities, and crop IDs return structured 422 responses. |
| 10. Error handling | **PASS for tested paths** | Mocked NASA 503 and 429, missing data, bad units, catalog outage/retry, and UI loading state were tested. A stale cache is labeled if refresh fails. |
| 11. Security and dependencies | **FAIL for public service readiness** | No secrets were found in tracked source. `npm audit --omit=dev` and `pip-audit -r` found no known production advisories; full npm audit found 10 moderate development-tool advisories. The unauthenticated climate endpoint lacks traffic controls and could amplify NASA requests. |
| 12. Automated test coverage | **FAIL for comprehensive assurance** | 17 backend and 7 frontend tests pass, including API contracts and deterministic edge fixtures. There is no automated browser E2E suite, load test, accessibility audit, or cross-browser matrix. Manual local E2E was performed. |
| 13. GitHub Actions | **PASS for verified configuration** | The pre-audit branch push and PR runs succeeded. Local equivalents passed for the audit changes; check the draft PR for their latest remote CI result. |
| 14. Documentation accuracy | **PASS after corrections** | Methodology now matches complete-month rainfall and excludes unvalidated water/rotation numeric effects. The full challenge page, source reuse rights, and deployment remain explicit verification gaps. |
| 15. Deployment readiness | **FAIL** | Vercel SPA rewrite and Render blueprint align with current vendor documentation, and Python 3.14 is selected. No cloud preview, production CORS test, upstream traffic limit, or public deployment was performed. |

## Defects found and corrected

1. **Incomplete rain totals were mislabeled as complete.** The parser previously accepted 90% daily coverage and summed only observed days. It now reindexes the full requested period and withholds any month missing a daily value; affected years cannot enter annual summaries or scores.
2. **An unvalidated rotation heuristic inflated scores.** A different crop family previously added a fixed positive score. Family information is now descriptive; any positive rotation or water priority withholds an overall score until supported models exist.
3. **Unknown soil provenance could still yield a score.** An unknown soil source now produces an explicit evidence gap and withholds ranking.
4. **Nonfinite priority values could poison calculations.** API and engine reject nonfinite, negative, and out-of-range weights. Zero total is rejected.
5. **Evidence gaps were implicit.** Each scenario now lists why its score was withheld. The results UI shows those reasons and labels a stale NASA cache.
6. **Mobile navigation disappeared below 800 px.** The navigation remains available and scrollable; the 390 px layout was visually checked.
7. **Farm map did not follow typed coordinates.** Its view now updates when coordinates change. The catalog failure state offers a retry.
8. **Nested API responses were weakly specified.** Climate, catalog, flags, scenarios, and exclusions now use Pydantic response models and generate explicit OpenAPI schemas.
9. **NASA 429 ignored `Retry-After`.** Numeric delays up to 30 seconds are respected; longer or invalid delays stop retries and surface an error. Nontransient HTTP errors are not retried. The process cache is capped at 256 entries.

## Reproducible checks

| Check | Result |
|---|---|
| `backend/.venv/Scripts/python.exe -m pytest -q` from `backend` | **17 passed** |
| `npm test` from `frontend` | **7 passed** |
| `npm run lint` | **Passed** |
| `npm run format:check` | **Passed** |
| `npm run build` (TypeScript + Vite) | **Passed**, with a nonfatal ~852 kB JS chunk warning |
| `npm audit --omit=dev` | **0 known advisories** |
| Full `npm audit` | **10 moderate** advisories in development-only ESLint/transitive tooling; no forced major downgrade applied |
| `pip-audit -r requirements.txt` | **No known vulnerabilities** at audit time |
| Secret pattern scan and Git ignore review | **No tracked credential patterns found**; `.env`, virtual environment, `node_modules`, and build output are ignored |
| Fresh local HTTP flow with live NASA response | Health 200; 3 crops; 10 complete years; 2 scenarios; 0 overall scores; 2 explicit evidence-gap reasons; typed OpenAPI scenario schema |
| Browser flow | Farm map and inputs, real climate charts, planner, result cards, evidence gaps, and 390 px mobile navigation observed |

Tests use fixtures labeled as fixtures. The live Kedah API result had median annual rainfall **2446.48 mm** and mean annual temperature **26.58 °C** for 2015–2024. Those are NASA POWER outputs for a hypothetical point, not field measurements or a future forecast. The default two scenarios show `insufficient_evidence`; three criterion flags lie outside published ranges. The application did not invent replacement observations.

## Remaining scientific and operational limits

- [FAO says Ecocrop was discontinued around 2015](https://www.fao.org/geospatial/data-and-tools/data-portals/ecocrop/en). [FAO also warns that some species requirements are sketchy or based on limited literature](https://www.fao.org/land-water/land/land-governance-and-planning/land-resources-planning-toolbox/detail/crop-ecological-requirements-database-%28ecocrop%29/en). The three sheets support the transcribed values but do not validate Kedah cultivars, seasons, or management.
- Annual POWER rainfall is compared with annual Ecocrop species ranges. This cannot represent growing-season rainfall, field moisture, drainage, irrigation demand, or future weather. The pH hard screen is conservative and depends on farmer-supplied accuracy.
- Soil texture and irrigation are recorded but have no numeric effect. No soil-health, yield, revenue, water-saving, pest/disease, or rotation-interval model exists. Positive water or rotation priorities explicitly prevent an overall ranking.
- The bounded in-memory cache is process-local and can return a labeled stale historical response after an upstream failure. It is not a shared production cache or a rate limiter. Exact farm coordinates are sent to NASA POWER; map browsing sends the viewed tile area to the tile provider.
- FAO Ecocrop-specific redistribution terms were not confirmed. [NASA Space Apps participant terms](https://www.spaceappschallenge.org/legal/) require rights and attribution for third-party materials; review licensing before submission.
- The same [2026 participant terms](https://www.spaceappschallenge.org/legal/) state a November 14 event start and describe written approval for a different start day in the same week. The user stated that implementation was authorized; this audit did not inspect written organizer authorization or determine eligibility. Confirm that point with organizers before submitting this pre-event work.
- The official challenge page returned HTTP 502 when opened directly. Recheck the complete challenge statement and resources manually before final claims of challenge compliance.
- Render and Vercel configuration was checked against [Render Python-version guidance](https://render.com/docs/python-version), the [Render Blueprint reference](https://render.com/docs/blueprint-spec), and [Vercel Vite SPA routing guidance](https://vercel.com/docs/frameworks/frontend/vite). No cloud environment or private preview was created.

## Manual verification checklist

1. Have a Kedah agronomist or extension officer review crop varieties, local planting windows, soil pH source, drainage, irrigation, and rotation restrictions.
2. Reopen the full official challenge page, inspect its resource links, and confirm the submission and pre-event authorization rules with organizers.
3. Confirm the reuse license for the exact Ecocrop records and retain source snapshots and attribution in submission materials.
4. In an authorized private preview, configure the exact Vercel origin in `AGRISHIFT_CORS_ORIGINS`, set `VITE_API_BASE_URL` to the Render HTTPS origin, verify all deep links, and confirm `/api/health`.
5. Add production request throttling or a shared bounded cache before a public API launch; verify NASA 429 behavior under load.
6. Run a keyboard and screen-reader review and a browser/device matrix. Check slow-network, upstream-outage, empty-data, and stale-cache presentations.
7. Review and address the development-only npm advisories with a compatible tooling upgrade; avoid a forced downgrade that breaks the passing CI configuration.

**Readiness:** Ready for a **local exploratory MVP demonstration and team review**. Not ready to claim scientifically validated rotation advice, competition eligibility, or public deployment.
