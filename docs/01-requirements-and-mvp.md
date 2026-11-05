# Software requirements specification and MVP

**Document status:** Preparation draft, 5 November 2026  
**Project:** AgriShift AI  
**Challenge:** [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/)  
**Team:** Four students; React/TypeScript/Vite/Tailwind frontend, FastAPI/Python/Pandas backend, Pytest, GitHub.

## 1. Purpose and boundaries

AgriShift AI helps a farmer or extension worker **explore** how a small set of crop rotation scenarios compares under historical climate context, farmer-entered soil conditions, documented crop constraints, and stated priorities. It explains the evidence and unknowns behind each scenario. It does not predict yield, future weather, soil recovery, profit, or a scientifically validated “best” rotation.

The challenge summary asks for NASA Earth observations plus local soil information, crop characteristics, and farmer priorities. The MVP uses NASA POWER for historical meteorological context. NASA describes POWER meteorology as coming from assimilation models, while its solar product is inferred from satellite observations. The team must describe this provenance accurately; it must not call every POWER variable a direct satellite field observation. [NASA POWER data FAQ](https://power.larc.nasa.gov/docs/faqs/data/).

## 2. Users and core journey

**Primary user:** Farmer or agricultural extension worker with a known farm location and at least a rough soil description.  
**Secondary user:** Judge or educator inspecting the evidence and method.

1. Enter a latitude/longitude or choose a clearly labeled pilot location.
2. Enter soil texture and drainage (or mark unknown); optionally enter measured soil pH with its source/date. Enter the current crop or current two-slot rotation.
3. Choose two consecutive growing windows from a region-specific, reviewed calendar and select a priority: lower water exposure, crop-family diversity, or balanced exploration. A priority changes display order only when a scientifically reviewed rule supports it; otherwise it is shown as context.
4. View a baseline and at least two alternative **illustrative** two-slot rotations from a small, reviewed catalog. Compare historical climate summaries, crop/soil rule matches, family sequence, and explicit missing evidence. Inspect source, period, units, and limitations for each result.
5. Change an input and see a new comparison, or receive a clear “insufficient data / no eligible scenarios” result.

## 3. Functional requirements

| ID | Requirement | MVP acceptance evidence |
|---|---|---|
| FR-01 | Accept and validate a single point location within geographic bounds. | Invalid coordinates produce field-level errors; valid coordinates appear with the result. |
| FR-02 | Capture current crop or baseline sequence, soil texture/drainage/pH including unknown values, and farmer priority. | Submitted values and unknowns are echoed in the comparison. No soil value is silently inferred. |
| FR-03 | Obtain historical daily temperature and precipitation from NASA POWER, then summarize the selected month windows over a fixed historical period. | Result cites parameter names, units, time standard, date range, retrieval time, completeness, and NASA source URL. |
| FR-04 | Build baseline plus at least two alternatives from a reviewed pilot catalog and two-slot calendar. | Each scenario identifies crops, crop families, source catalog version, and whether it is eligible for comparison. |
| FR-05 | Show rule-by-rule evidence for climate/soil/sequence compatibility, with `pass`, `caution`, `fail`, or `unknown`. | Each flag has an observed value, threshold or qualitative rule, source reference, and reason; no unsupported numeric score. |
| FR-06 | Represent uncertainty and missing data. | Missing pH or incomplete climate coverage yields `unknown` on affected rules; the UI does not display a definitive recommendation. |
| FR-07 | Compare scenarios and allow input revision. | Mobile and desktop views show the baseline beside alternatives and respond to input changes. |
| FR-08 | Explain data provenance and limitations. | A visible methodology panel distinguishes historical gridded weather, entered soil, curated crop rules, and assumptions. |

## 4. Quality and delivery requirements

| ID | Requirement | Verification |
|---|---|---|
| NFR-01 | One-command local start per service and a short setup guide. | Another teammate can run the demo from the documented steps. |
| NFR-02 | Deterministic comparison given identical inputs and the same cached data/catalog version. | Repeated tests produce the same flags and scenario order. |
| NFR-03 | Graceful external-data failure. | Timeout, 429, malformed data, and missing days yield actionable errors or a clearly labeled dated cache; never fabricate values. |
| NFR-04 | Accessible basic interaction. | Labels, keyboard operation, visible focus, readable contrast, and text alternatives for charts are manually checked. |
| NFR-05 | Traceable source use. | Every climate and crop rule in a result carries a source link or review identifier. |
| NFR-06 | Small-team integration discipline. | GitHub Issues, short branches, review by a second teammate, and a green focused test run before merge. |

## 5. Realistic 48-hour MVP

**Pilot scope:** One agreed region, one latitude/longitude at a time, two consecutive reviewed growing windows, a catalog of three or four locally plausible annual crops, baseline plus two alternatives. Soil comes from farmer entry; no automatic soil map is required. The historical POWER period and window definitions are fixed after scientific review. The UI may use a default pilot farm clearly marked as an example.

**Output:** A comparison of conditions and rule flags with evidence and uncertainty, not optimized agronomic advice. Use simple tables and cards. A map, authentication, AI chat, yield model, market prices, automatic soil lookup, SMAP/ECOSTRESS/GPM fusion, future climate projections, and multi-year optimization are out of scope.

**Scientific release gate:** Before implementing threshold-driven flags, a reviewer must approve crop identities, growth windows, source values, temporal comparability, sequence rules, and wording. If that gate is not met during the event, the demo should show only factual POWER summaries and clearly labeled hypothetical crop sequences, with all agronomic rule outcomes `unknown`. This is still an honest data exploration demo.

## 6. User-visible acceptance scenarios

1. **Happy path:** Given the pilot point, complete soil entry, current sequence, and a valid window, the user sees three scenarios and a historical climate summary. Each flag can be traced to a rule and source.
2. **Unknown soil:** Given no pH, any pH-dependent flag is `unknown`; the app asks for a measured value and does not assume a default.
3. **Unavailable POWER:** Given timeout or throttling, a valid dated cache is labeled as such; without one, the comparison is withheld and the user gets a retry message.
4. **Ineligible crop/window:** The user sees why a crop could not be compared and no invented substitute appears.
5. **Narrow viewport:** Input, comparison, and evidence remain usable at approximately 375 px width with keyboard navigation.

## 7. Success definition and explicit limits

At the end of 48 hours, a teammate can reproduce the demo, explain where each data item came from, and show a comparison without implying that historical averages forecast next season or that a crop rotation has been field validated. No agronomic benefit, water saving, or yield claim is made without a matching reference and review.
