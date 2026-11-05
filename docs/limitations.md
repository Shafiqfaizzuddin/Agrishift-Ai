# Limitations and interpretation

- This is an independent student prototype, not an official NASA product or a local agronomic advisory service.
- NASA POWER data are historical and gridded; they are not a forecast or field measurement. A point request represents a model grid, which may miss topography and local rainfall.
- The three FAO Ecocrop profiles are broad species ranges, not cultivar-specific Kedah recommendations. Annual rainfall does not represent in-season water demand or waterlogging risk.
- Soil pH, texture, irrigation, and existing crop are farmer supplied. No laboratory validation or farm history is performed. Soil texture and irrigation are displayed but have no numerical effect on ranking.
- The two-crop sequence has no dates, planting calendar, fallow period, or pest/disease-specific interval. Crop-family diversity is an unvalidated demonstration heuristic.
- A displayed screening index is not probability of success. There is no yield, profit, soil-health, or water-saving prediction. Unknown or out-of-range evidence withholds an overall score.
- The in-memory NASA cache is not shared across instances and disappears on restart. The frontend and map require network access. NASA/API outages produce an error rather than invented observations.
- The default Kedah farm is hypothetical. Its coordinates and pH are example inputs, not sampled field measurements.
