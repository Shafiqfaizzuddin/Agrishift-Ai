# Kedah staple and industrial crop context

**Status:** Regional evidence register, 13 November 2026. Local scientific review is pending. This register does not establish that any crop is suitable for the hypothetical farm.

The five entries in `backend/app/kedah_crop_context.json` are **context only**. They have no temperature, rainfall, pH, water, yield, or rotation thresholds. The `/api/crops` response separates them from the existing exploratory annual screening catalog. The seasonal evaluation API rejects these IDs before requesting NASA data.

| Crop | Kedah occurrence evidence | Planning boundary |
|---|---|---|
| Paddy (*Oryza sativa*) | [DOSM Kedah Agriculture Census 2024 summary](https://www.dosm.gov.my/uploads/content-downloads/file_20260416173922.pdf) records paddy as a major crop. [MADA's Season 2/2026 statement](https://www.mada.gov.my/?id=228&q=2F02) shows that its managed area follows a planting schedule. | Seasonal crop, but the example point's MADA status, schedule, water control, soil, and rotation rules are unverified. |
| Rubber (*Hevea brasiliensis*) | [DOSM Kedah summary](https://www.dosm.gov.my/uploads/content-downloads/file_20260416173922.pdf) records rubber among major planted crops. | Perennial land-use and replanting questions require a multi-year method. |
| Oil palm (*Elaeis guineensis*) | [DOSM Kedah summary](https://www.dosm.gov.my/uploads/content-downloads/file_20260416173922.pdf) records oil palm among major planted crops. | Perennial land-use and replanting questions require a multi-year method. |
| Coconut (*Cocos nucifera*) | [DOA Industrial Crop Statistics 2024](https://www.doa.gov.my/doa/resources/aktiviti_sumber/sumber_awam/penerbitan/statistik_tanaman/statistik_tanaman_industri_2024.pdf) records coconut planted area in Kedah. | Perennial establishment and management require a multi-year method. |
| Robusta coffee (*Coffea canephora*) | [DOA Industrial Crop Statistics 2024](https://www.doa.gov.my/doa/resources/aktiviti_sumber/sumber_awam/penerbitan/statistik_tanaman/statistik_tanaman_industri_2024.pdf) records coffee in Kedah without identifying variety. [Nestlé's Kedah programme account](https://www.nestle.com.my/stories/kedah-coffee-beans) describes Robusta seedlings in its 2020 pilot. | The Robusta programme is evidence of a local example, not evidence that every Kedah coffee farm grows Robusta or that this farm could. |

Regional occurrence and farm suitability are different questions. DOSM and DOA figures refer to the years and geography of their publications; they are not live field observations. The default location, field size, and paddy selection are hypothetical. Soil pH, texture, irrigation, and applicable managed-area schedule remain unknown until supplied and checked.

## Scientific review gate

Before any of these crops can enter a scored or eligible scenario, a local agronomist or extension officer must review:

1. The actual farm system and whether MADA's schedule applies to the selected point.
2. Paddy variety, planting and harvest windows, field drainage and water control, and available irrigation evidence.
3. The meaning and temporal basis of each proposed crop requirement, with a source URL and units.
4. Whether a proposed sequence is a rotation, repeated cropping, intercropping, replanting, or land conversion.
5. Any proposed hard exclusion, soft criterion, and user-facing benefit claim.

Until then, paddy and the four perennial crops remain evidence-only. A repeated paddy season is not presented as a proven rotation benefit. The existing maize, mung bean, and sweet potato comparison remains a separate exploratory method; see [methodology](methodology.md) and [limitations](limitations.md).
