# Limitations and interpretation

- This is an independent student prototype, not an official NASA product or a local agronomic advisory service.
- NASA POWER data are historical and gridded; they are not a forecast or field measurement. A point request represents a model grid, which may miss topography and local rainfall.
- The three FAO Ecocrop profiles are broad species ranges, not cultivar-specific Kedah recommendations. Annual rainfall does not represent in-season water demand or waterlogging risk.
- Paddy, rubber, oil palm, coconut, and Robusta coffee are sourced **regional context only**. They have no reviewed climate/soil thresholds or seasonal rotation score. Paddy may follow a managed planting schedule; rubber, oil palm, coconut, and coffee require a longer planning horizon than the current two-crop screen. Their presence in Kedah does not establish suitability for the hypothetical farm.
- FAO says Ecocrop was discontinued around 2015 and that some records rely on limited literature. The age and local transferability of each range need agronomic review.
- Soil pH, texture, irrigation, and existing crop are farmer supplied. No laboratory validation or farm history is performed. Soil texture and irrigation are displayed but have no numerical effect on ranking.
- The two-crop sequence has no dates, planting calendar, fallow period, or pest/disease-specific interval. Crop-family diversity is a descriptive observation only; it is not scored.
- A displayed screening index is not probability of success. There is no yield, profit, soil-health, or water-saving prediction. Unknown or out-of-range evidence withholds an overall score.
- The bounded in-memory NASA cache is not shared across instances and disappears on restart. A failed refresh can return a clearly labeled stale cached response. With no cache, NASA/API outages produce an error rather than invented observations. The frontend and map require network access. Coordinates are transmitted to NASA for climate requests, and viewed map areas to the tile provider.
- The public deployment design has no authentication or request throttling. A live service could be used to generate excessive NASA requests; production traffic controls have not been verified.
- The default Kedah farm is hypothetical. Its coordinates and area are example inputs; soil type, soil source, soil pH, and irrigation default to unknown. Its paddy selection does not establish that the point lies within a MADA managed area.
