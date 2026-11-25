# First data audit

This is the authoritative York OpenData application-feature snapshot, not a count of unique developments or housing units.

Retrieved (UTC): 2026-11-25T05:16:23.004793+00:00

Application features: **5,482**. Features with geometry: **5,482**.

## Municipality labels

| Source label | Features |
|---|---:|
| Vaughan | 1,382 |
| Markham | 1,236 |
| Richmond Hill | 1,103 |
| Whitchurch-Stouffville | 365 |
| Georgina | 313 |
| King | 307 |
| Aurora | 299 |
| Newmarket | 236 |
| East Gwillimbury | 236 |
| Other/Outside York Region | 5 |

## Source Salesforce status field

These categories are preserved from the source and are not a project readiness classification.

| Source status | Features |
|---|---:|
| In Progress | 5,088 |
| Appealed | 171 |
| On Hold | 76 |
| Awaiting Approval | 60 |
| Awaiting Mandatory Docs | 28 |
| Awaiting Fees | 24 |
| Awaiting External Signature | 20 |
| Appealed Regional Interests | 15 |

## Completeness

Nonblank service-area text is not proof of spare capacity. Text such as 'No' is nonblank but not a usable area reference.

| Field | Nonblank records |
|---|---:|
| UNITS | 891 |
| WSERVAREA | 4,521 |
| WWSERVAREA | 4,521 |
| SEWERSHED | 4,519 |

Disagreements between the two source status fields: **245**.

## Interpretation and source selection

- `UNITS` is not a numeric housing-unit count in the inspected data.
- The source's hosted alternatives returned different totals and 2025 editing timestamps. They are not interchangeable with this authoritative query.
- The authoritative MapServer does not expose editingInfo in the inspected metadata. Retrieval time must not be described as source last-update time.
- Related applications and repeated geometry must be reconciled before counting unique developments.
- Public electricity access was blocked by a technical-difficulties notice at the official map landing page. Numeric electricity capacity has not been ingested.
- Capital programme map years refer to construction starts; they are not commissioning dates.

## Supporting layers

- municipal_boundaries: 47 features
- water_wastewater_construction_lines: 6 features
- water_wastewater_construction_points: 30 features

## Verification completed

Record-count and unique source-ID checks; archive input checksums; source-field profiling; comparison of alternate development sources; item licence review for the official sources; restricted third-party boundary copy excluded.

No site-capacity model or readiness score has been calculated.
