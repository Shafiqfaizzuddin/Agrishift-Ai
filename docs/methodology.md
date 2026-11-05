# Scientific and scoring methodology

**Status:** Exploratory species-level screening. This method and its Kedah interpretation have not been reviewed by a local agronomist. The score is not a probability, yield forecast, revenue forecast, irrigation estimate, or recommendation.

## Sources and aggregation

The backend requests daily `T2M`, `T2M_MAX`, `T2M_MIN`, and `PRECTOTCORR` from the [NASA POWER Daily Point API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) for one point, `community=AG`, JSON, and explicit local solar time. The default historical period is 2015–2024. The response's parameter units must equal °C for temperatures and mm/day for precipitation; otherwise processing stops. Values at or below −900 and nonfinite values are missing. A month is usable only if at least 90% of its days have all four parameters. A year is usable only if all 12 months are usable.

For each usable month: precipitation is the **sum** of valid daily mm/day values; mean temperature is the mean of valid daily `T2M`; monthly maximum is the maximum daily `T2M_MAX`; monthly minimum is the minimum daily `T2M_MIN`. The display takes the median of each calendar month's usable precipitation totals and the mean of its usable monthly mean temperatures. Annual precipitation is the sum of 12 usable monthly totals. Annual temperature is the mean of valid daily temperatures in that year, so months are weighted by their day counts. Across complete years, annual precipitation uses a median and range. The score requires at least three complete years.

## Crop catalog

The pilot catalog contains maize (*Zea mays*), mung bean (*Vigna radiata*), and sweet potato (*Ipomoea batatas*) with broad temperature, **annual** rainfall, pH, and crop-cycle ranges from [FAO Ecocrop maize](https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=2175), [mung bean](https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=2150), and [sweet potato](https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=1265). These are species-level ranges, not Kedah cultivar approvals or validated seasonal planting windows. Annual rainfall is compared only to annual rainfall, never to a growing-season sum. Soil texture and irrigation have no quantitative score because suitable local evidence is absent.

## Scenario generation and constraints

For every selected next crop, construct `[existing crop, next crop]`. An identical crop repeat is excluded by an **unvalidated demonstration assumption**, not a proven local rotation rule. A crop with farmer-supplied pH outside an FAO absolute pH range is excluded as a conservative screen; the app does not infer that pH was measured accurately. Same-family repeats are also excluded as an unvalidated diversity heuristic. Other ranges yield criterion flags, including `outside_published_range`, but annual rainfall alone does not hard-exclude a sequence because it does not express seasonal soil moisture or irrigation availability.

For an observed value `x`, a criterion match is 1 if within the published optimal interval, 0.5 if outside optimal but within absolute, 0 if outside absolute, and unknown if observation is missing. Temperature compares historical mean annual `T2M` with species temperature ranges. Rainfall compares median annual precipitation with Ecocrop annual ranges. pH uses user entry. These comparisons are broad screens, and an annual mean can hide damaging extremes.

Let raw nonnegative farmer weights be `w_climate`, `w_water`, `w_soil`, and `w_rotation`; divide each by their positive sum. The climate criterion is the mean of temperature and annual-rainfall matches across both crops. Soil is the mean of pH matches across both crops. Rotation is 1 for a different-family sequence, solely as a labeled diversity heuristic. Water has no numeric model. If any required value is unknown, any criterion lies outside a published absolute range, or water receives positive weight, the overall score is **null** and ranking status is `insufficient_evidence`. Otherwise:

`screening_index = 100 × (w_climate × climate_match + w_soil × pH_match + w_rotation × family_diversity)`

The score is an ordinal display aid under these assumptions. It does not imply a probability or measured benefit. Changing weights can change the ordering of supported comparisons; the API reports normalized weights and criterion details. With the default Kedah case, annual rainfall exceeds absolute ranges for some catalog crops, so the overall ranking is withheld while flags and scenarios remain inspectable.

## Scientific review still required

Local agronomists or extension officers must review the actual Kedah soil/irrigation context, crop varieties, planting windows, season lengths, temperature extremes, waterlogging/drainage, pest and disease rotation intervals, and whether this screening method is meaningful. No numeric water or soil-health benefit should be added without a matching model and data source.
