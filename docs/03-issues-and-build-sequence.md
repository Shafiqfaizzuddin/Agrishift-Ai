# GitHub Issues backlog and 48-hour build sequence

This is an **issue drafting plan**. The table is not itself a set of live GitHub Issues. Create the Issues in the linked GitHub repository when access is available. Each issue below has an owner lane, priority, estimate in focused person-hours, dependency, and testable done condition. Assign named teammates at kickoff.

## 1. Roles and working agreement

| Lane | Initial responsibility |
|---|---|
| A — product/integration | Scope, API contract, demo script, integration, documentation, PR coordination. |
| B — data/backend | POWER adapter, normalization, caching, climate summaries, API reliability. |
| C — science/rules/backend | Crop catalog, scenario generation, rule engine, science review liaison. |
| D — frontend/UX | Farm form, comparison/evidence UI, accessibility and responsive QA. |

Keep one owner and one reviewer per issue. Record science reviewer name and approval separately from code review. Use labels `P0` (must ship), `P1` (strongly desirable), `P2` (stretch), plus `frontend`, `backend`, `data`, `science`, and `integration`. Estimates total about **88 focused person-hours** for P0, leaving some of the theoretical 192 team-hours for sleep, coordination, defects, and submission work.

## 2. Copy-ready issue list

### P0 — MVP

| ID / title | Owner | Est. | Depends on | Acceptance criteria |
|---|---|---:|---|---|
| 01 — Confirm pilot farm, crops, windows, and review gate | A+C | 6h | None | One region, two windows, 3–4 crop IDs, baseline example, source list, reviewer, and explicit approved/pending status recorded; unsupported rules marked unknown. |
| 02 — Freeze API v1 and fixture examples | A+B+D | 4h | 01 | Request/response and errors from architecture doc reviewed by frontend/backend; one happy-path fixture and one incomplete-data fixture agreed. |
| 03 — Establish repo workflow and local run instructions | A | 4h | None | React/Vite and FastAPI project layout, environment instructions, branch/PR convention, and focused test commands documented; teammate can start both services. |
| 04 — POWER adapter and cache | B | 9h | 02 | Point request uses explicit period, AG community, parameters, LST; parses units/missing markers; timeout/429/422 behavior and cache provenance tested with fixtures. |
| 05 — Historical window aggregation | B | 8h | 04, 01 | Pandas aggregates by reviewed window and year; reports median/range/coverage; insufficient years do not produce usable climate flags; edge windows tested. |
| 06 — Versioned crop and soil catalog | C | 6h | 01 | Catalog serves only sourced crops/rules; each rule records source, unit, temporal basis, geography, and review status; unknown soil stays null. |
| 07 — Deterministic scenario and rule evaluator | C | 10h | 05, 06 | Baseline plus two distinct eligible alternatives or explicit no-scenarios error; pass/caution/fail/unknown have reasons and source; no unsupported overall score. |
| 08 — FastAPI catalog/compare/health endpoints | B+C | 8h | 04–07 | OpenAPI matches contract; validation, error codes, provenance, and deterministic response covered by API tests. |
| 09 — Farm input flow | D | 8h | 02, 06 | User can enter point, soil with unknowns, baseline crop IDs, windows, and priority; invalid values surfaced clearly; usable by keyboard and at mobile width. |
| 10 — Comparison and evidence UI | D | 10h | 02, 08 | Shows baseline + alternatives, flags, climate period/units/coverage, source links, limitations, loading and error states; no “validated” or “best” language. |
| 11 — Integration and failure-path QA | A+D | 9h | 08–10 | Full flow works with live POWER or labeled cache; NASA outage, unknown pH, invalid point, and incomplete coverage are checked; defects logged/fixed. |
| 12 — Demo, attribution, and submission pack | A | 6h | 11 | README, data/method citations, scope/limitations, 2-minute walkthrough, and reproducible pilot input reviewed by all four teammates. |

**P0 estimate:** 88 focused person-hours. Parallel ownership does not remove dependencies; 01 and 02 are early gates. If science review is delayed, implement and demo evidence-only mode as described in the SRS, and mark 06/07's agronomic rules pending.

### P1 — Only after P0 is stable

| ID / title | Owner | Est. | Depends on | Acceptance criteria |
|---|---|---:|---|---|
| 13 — Better historical variability view | B+D | 6h | 11 | Shows year-by-year temperature/precipitation context with units and accessible table; no future prediction label. |
| 14 — Local reviewer walkthrough | A+C | 4h | 11 | Reviewer feedback and any rule/copy changes logged with decisions; unresolved claims stay disabled. |

### P2 — Defer beyond the event MVP

Automatic soil sourcing, field-scale remote sensing, forecasts, irrigation estimates, yield/profit modeling, multilingual support, accounts, and advanced optimization. Each requires separate data rights, scientific definition, integration, and testing.

## 3. Prioritized 48-hour sequence

| Clock time | Main work | Gate / deliverable |
|---|---|---|
| 0–4h | Kickoff, pilot region and crop/window choices, issue assignments, source/reviewer contact. A sets workflow; B and D examine API/UI contract. | Gate 1: pilot assumptions and review status written down. |
| 4–8h | Freeze API and fixtures; start repo setup and catalog; B starts POWER adapter. | Frontend and backend can work against the same shape. |
| 8–20h | B finishes ingestion/aggregation; C builds catalog/scenario evaluator; D builds farm input and mock comparison; A checks source traceability. | Gate 2: three-scenario fixture or honest evidence-only fallback. |
| 20–30h | Connect FastAPI and React; focused unit/API tests; first end-to-end walkthrough. | Gate 3: successful pilot path locally. |
| 30–38h | Fix errors; test missing soil and NASA failure; improve responsive and keyboard use. | Gate 4: no silent data substitution or unsupported claim. |
| 38–44h | Freeze features; independent teammate runs setup and demo; science/copy review. | Candidate release with reproducible steps. |
| 44–48h | Submission material, final smoke test, backup demo screenshots/data provenance, submit. | All four can explain method, limits, and their contributions. |

## 4. Scope cuts and stop rules

- If fewer than two reviewed alternatives are available, narrow the pilot crop set or show an explicit incomplete comparison. Do not invent crops or rules.
- If POWER is slow or unavailable, use a previously captured, dated response only if its location, period, parameter set, units, and provenance match the demo. Otherwise show an unavailable state.
- If time is short, cut charts, maps, rankings, and P1 work before cutting provenance, uncertainty, or error handling.
- Stop adding features at hour 38 so the final ten hours can be used for verification and submission.

## 5. Test plan and review checklist

**Pytest unit/API tests:** POWER parser with realistic normal/missing/429 fixtures; seasonal aggregation across year boundary and missing days; deterministic scenario generation; unknown soil rule; invalid coordinate and ID; compare endpoint error shapes.  
**Frontend manual checks:** Keyboard completion, narrow mobile width, loading and retry, unknown fields, source links, three-scenario comparison, and no unsupported recommendation wording.  
**Scientific review:** A reviewer inspects each crop rule and example interpretation against its cited source, with a recorded approve/revise/unknown decision.  
**Integration smoke:** A clean checkout starts both services and completes the pilot journey using live POWER or the labeled cache.

For any claimed agronomic benefit or suitability, the PR must identify the supporting reference and scientific reviewer. In their absence, use `unknown` or descriptive comparison language.
