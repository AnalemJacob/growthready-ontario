# GrowthReady Ontario — portfolio case study

**Jacob Analem · Independent open-data GIS project · York Region pilot, version 1.0**

- [Live regional dashboard](https://analemjacob.github.io/growthready-ontario/)
- [Live Vaughan case study](https://analemjacob.github.io/growthready-ontario/vaughan.html)
- [Public findings and portfolio page](https://analemjacob.github.io/growthready-ontario/about.html)
- [Mapped findings brief](../output/pdf/GrowthReady_Vaughan_Brief.pdf)
- [Methods](VAUGHAN_METHODS.md), [source register](source_register.csv), [QGIS validation](QGIS_VALIDATION.md)

## Problem and intended use

A development application, named servicing reference and nearby infrastructure project provide different kinds of evidence. GrowthReady Ontario brings them into one auditable explorer to help identify records and locations for further planning review, while keeping unverified capacity and dependencies visible.

The completed release covers York Region and a detailed Vaughan study. It does not claim province-wide completeness, unique development counts, utility coverage, hydraulic capacity or a predictive readiness score.

## Work delivered

The repository documents acquisition from authoritative York Region REST services, stable source identifiers, original and derived data hashes, reference completeness, source-status disagreements and interpretation limits. The regional interface links filters, map clusters, municipality counts, received-date charts, project timelines, record comparison and safe CSV export.

For Vaughan, the workflow preserves original application boundaries; transforms geometry into NAD83 / UTM zone 17N; calculates minimum polygon-to-line distances; compares screening thresholds; and assigns an interior point per record to a fixed 1 km grid. Results are available through interactive polygons/grid cells, record details, CSV, filtered GeoJSON and a static mapped brief.

## Findings and recommendations

The regional snapshot contains 5,482 application records and 245 disagreements between source status fields. The Vaughan analysis contains 1,382 records, measured against five line features with four distinct source names. There are 191 records within 250 m, 230 within 500 m and 323 within 1,000 m. The grid contains 227 occupied cells; the largest has 43 records, including source addresses on Interchange Way, Doughton Road and Maplecrete Road.

Use these results to define manageable review sets, not to quantify housing demand. Review overlapping applications before counting distinct sites. Seek current utility allocations, actual serving systems and explicit capital-project dependencies before assessing readiness. Track missing references and status disagreements as evidence gaps. A record over 1 km from this partial construction inventory is not necessarily unserved.

## Quality assurance and delivery

QGIS independently recalculated every Vaughan record from hash-matched original inputs: all nearest lines, distance bands and grid assignments agreed, with zero mismatches. The maximum difference from stored rounded distances was approximately 0.000500 m. Both QGIS and Shapely use GEOS; this is a computational cross-check, not positional-accuracy certification.

The release includes automated data/model tests, desktop/mobile browser checks, keyboard regression checks, automated accessibility checks, original-geometry export verification, source documentation and reproducible analysis/PDF scripts. See the validation reports for the exact tested scope and limitations. Accessibility checks are not a claim of full conformance or testing with assistive-technology users.

## Skills demonstrated against the target role

| Role requirement | Evidence in the project |
| --- | --- |
| Referencing systems and spatial integration | Source-to-WGS84 handling; projected EPSG:26917 measurement; original/display geometry distinction |
| Geospatial analysis and map production | Full-geometry distances, screening bands, fixed-grid aggregation, interactive maps and mapped PDF |
| QA/QC and error analysis | Source hashes, reconciliation, geometry checks, status conflicts and independent QGIS comparison |
| Information management | Source/licence register, data dictionary, reproducible refresh, formula-safe CSV and documented limits |
| Research and troubleshooting | Separating partial published works from serving infrastructure; preserving uncertainty rather than inferring capacity |
| Technical communication and project delivery | Findings page, methodological report, bounded release scope, documented checks and change history |

This project demonstrates the work listed above. It does not by itself demonstrate remote-sensing classification, formal statistical sampling, survey accuracy or stakeholder adoption.

## Suggested application wording

Use wording that accurately reflects work you can explain and reproduce. Describe the project as AI-assisted where relevant to your application or interview; do not claim tasks you have not personally reviewed.

**Project summary:** “Developed an AI-assisted open-data GIS portfolio project integrating 5,482 York Region development application records with documented infrastructure evidence. Built a Vaughan case study using original polygons, projected proximity analysis and a fixed 1 km grid, supported by an independent QGIS computational cross-check of 1,382 records.”

**Resume bullets:**

- Integrated authoritative York Region geospatial datasets into an interactive evidence explorer with linked filters, source-status comparisons, municipal analytics and downloadable records.
- Applied EPSG:26917 full-geometry distance analysis and representative-point grid aggregation to 1,382 Vaughan application records; documented methods, thresholds, data provenance and interpretation limits.
- Delivered a reproducible QA workflow, QGIS cross-check, interactive GIS exports and mapped findings brief while keeping unverified servicing capacity and project dependencies explicit.

**Short demonstration:** Open the regional dashboard, filter Vaughan and inspect conflicting source statuses. Open the case study, compare polygon/grid views and change a distance band. Inspect a record's nearest source line, export the filtered boundaries, and finish with the QGIS report and the limits of proximity analysis. Be prepared to explain why application records are not unique developments and why nearby works do not establish capacity.

## Suggested application wording

Resume bullets (adapt the wording to accurately describe your own contribution):

- Developed an interactive York Region GIS evidence explorer integrating 5,482 authoritative application records, municipality analytics, source-quality flags and documented infrastructure timelines.
- Produced a reproducible Vaughan study using projected polygon-to-line distances and a 1 km grid; independently cross-checked all 1,382 records in QGIS with zero mismatches and delivered mapped findings and GIS exports.

Cover-letter example:

> My GrowthReady Ontario portfolio demonstrates geospatial data integration, projected spatial analysis, quality assurance and technical communication. I used authoritative York Region open data to develop a regional evidence explorer and a detailed Vaughan case study. The analysis preserves original application geometry, measures proximity to published construction lines and documents uncertainty. An independent QGIS cross-check reconciled all 1,382 Vaughan records. The repository includes methods, source hashes, automated checks and a mapped findings brief, showing how I approach reproducible, reviewable geospatial deliverables.

This wording describes portfolio work, not employment with York Region or the Ontario Public Service. Do not claim operational adoption, reduced delays, improved housing delivery or measured public impact without evidence.
