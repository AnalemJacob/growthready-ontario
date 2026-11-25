# GrowthReady Ontario

## Infrastructure evidence for housing and industrial growth

**Pilot:** York Region, Ontario  
**Project lead:** Jacob Analem  
**Prepared:** 24 November 2026  
**Milestone:** public-data feasibility and project definition

## The decision we will support

Where do development proposals overlap with documented infrastructure service areas, constraints, and investment plans, and what additional evidence is needed to evaluate growth readiness?

The intended users are municipal planners, economic-development teams, infrastructure analysts, and development stakeholders. They need to compare locations, understand project dependencies, and identify missing evidence before making investment decisions.

The first version is a screening and evidence application. It must not issue engineering capacity determinations, utility connection approvals, or site-specific development permissions.

## Why York Region

York publishes development-application geography and status, drinking-water reporting tables, and water/wastewater capital-program maps. In September 2026, Regional Council directed staff to report in 2027 on infrastructure considerations relating to data centres. That provides a current local question connecting industrial development, housing, and infrastructure planning.

Source: [York Regional Council highlights, September 2026](https://www.york.ca/newsroom/council-highlights/york-regional-council-highlights-thursday-september-24-2026).

The pilot should cover York Region's nine local municipalities; First Nation lands must retain their correct separate administrative and jurisdictional representation. Start analysis on a manageable selection of documented development and infrastructure cases rather than promise province-wide precision.

## What has been verified

| Evidence | Finding | Consequence |
|---|---|---|
| York development services | Authoritative OpenData MapServer accessible; alternate hosted copies also found | Use the authoritative endpoint; hosted copies have older edit metadata and different record totals |
| Misleading field label | `UNITS` contains Yes/No values in the inspected hosted copy, not dwelling counts | Do not use it for housing totals; source-defined meaning requires confirmation |
| Official municipal-boundary service | York-owned catalogue item and source service found | Use this source rather than a third-party copy with restrictive distribution terms |
| Active water/wastewater construction | Public point and line services expose project names, categories, status, and links | Candidate project layer; proximity is not a hydraulic dependency |
| 2025 drinking-water tables | Public tables cover supply volume, production, and system descriptions | Useful system context; they do not establish unallocated site capacity |
| 2025 drinking-water report | Public tables include system, annual supply, annual production, monthly supply/flow, and approval information | Supports system-level context; spare capacity for a parcel is not established |
| 2026 ten-year capital maps | Water and wastewater PDFs are public | Timelines shown are construction-start years; do not treat them as operational dates |
| OEB electricity map | Official information page accessible; launch page reported technical difficulties during this audit | Electricity capacity remains unknown; do not scrape around an outage or invent values |
| Exact spare wastewater capacity by development site | Not established | Requires explicit allocation/capacity evidence before numeric readiness assessment |

Measured snapshot counts and field-completeness statistics, where available, are in `data/data_audit.json`. Retrieval time and source-update time are separate. A legacy hosted copy had 6,773 features, a September 24, 2025 last-edit timestamp, and 191 disagreements between its two status fields. It must not be presented as a current authoritative layer. Its separate audit is retained as a QA example, not as the recommended application source.

## First map experience

Use a map-first layout inspired by HealthyPlan's clarity, with original branding and content:

1. **Left panel:** municipality, source-defined application type/status, evidence theme, and search by application reference/address.
2. **Central map:** development boundaries; optional official municipal boundaries and infrastructure project layers.
3. **Right panel:** selected application or infrastructure project, associated documents, available service-area references, evidence dates, and unresolved questions.
4. **Linked summaries:** application-feature counts by municipality and source status; field completeness; infrastructure categories; known versus unknown evidence.
5. **Comparison tray:** up to three selected cases, compared field by field rather than reduced to an unsupported universal score.

Initial map modes:

- **Development:** source application geography, type, status, and description.
- **Infrastructure:** verified current projects and referenced capital-program documents.
- **Evidence coverage:** which cases have usable supporting evidence and where evidence is absent.
- **Scenario comparison:** introduced only after explicit project-to-area dependencies and commissioning assumptions are validated.

Electricity should initially be an official-source link with an unavailable/verification-needed status, not a coloured capacity layer. A missing connection to electricity evidence is not evidence of insufficient electricity.

## Distinctive analytical contribution

Existing York dashboards show application status, and OEB provides electricity information. GrowthReady's proposed contribution is to connect development cases to infrastructure evidence, expose missing links, and compare documented future dependencies in one place.

We do not claim this is the first such concept or that no comparable tool exists. Its value will depend on the quality and usefulness of the linked evidence and analysis.

## Analysis rules

- Count source features as **application features**, not unique sites or housing projects.
- Review application status before using the label active; source titles alone are insufficient.
- Reconcile alternative source columns before choosing an authoritative status/type field.
- Preserve original `UNITS` flags; do not interpret them as dwelling counts. Any future housing-count source must be independently documented. Do not sum counts across related applications, phases, overlapping polygons, or revisions without documented deduplication and interpretation.
- Do not infer zoning permission, market availability, or utility connection rights from an application boundary.
- Treat water/wastewater service-area names as source attributes until their definitions and geography are verified.
- Do not treat distance to a watermain, sewer, or electrical asset as available service capacity.
- Do not subtract annual average flows from nominal design capacity and call the difference developable headroom. Peak demand, allocation, operating limits, network bottlenecks, and reserves matter.
- Keep electricity MW, water ML/day, wastewater ML/day, housing units, money, and dates as separate quantities with explicit units.
- Show construction start, anticipated completion, and commissioning dates separately. Leave missing dates blank/unknown.
- Source update, retrieval, review, and forecast dates are separate metadata fields.
- Separate observed source data, derived spatial relationships, and user-specified hypothetical scenarios.

## Evidence model

Use five linked tables or feature classes:

| Entity | Minimum fields |
|---|---|
| Development application | Stable source ID, source type/status, municipality, geometry, description, source/update/retrieval timestamps; dwelling counts only from a separately verified source |
| Infrastructure project | Project ID/name, category, verified geography, documented purpose, start/completion/commissioning dates where available, project URL |
| Service area | Area ID/name, utility type, authoritative boundary, effective dates, source |
| Evidence link | Application/project/area IDs, relationship type, document URL/page, supporting statement, reviewer, confidence and review date |
| Scenario | Scenario ID, selected cases/projects, explicit assumptions, changed dates or quantities, results, unresolved dependencies |

Use relationship labels such as **source-referenced**, **spatial intersection**, and **documented dependency**. Never silently convert the first two into the third.

## Quality assessment

The reproducible download checks counts and feature IDs. The next GIS checks should cover geometry validity, consistent coordinate systems, duplicate/overlapping application records, missing service references, status-field disagreement, and source currency.

For detailed case verification, select a stratified sample across municipalities, application types, and evidence-completeness classes. Review source documents independently of the automated linking method. Report incorrect links and unresolved cases; use a second review where feasible. Do not present a single invented accuracy percentage.

Use a suitable metre-based CRS for local measurements and WGS84 for web delivery, recording all transformations. Native development service metadata currently identifies NAD83 / UTM zone 17N (EPSG:26917).

## Delivery milestones and acceptance gates

| Milestone | Concrete output | Acceptance gate |
|---|---|---|
| 1. Public-data foundation | Source register, development snapshot, field audit, project definition | Reproducible download and explicit limitations |
| 2. Working evidence map | Filterable development map, source links, evidence dashboard, comparison tray | Totals match the included snapshot; unknowns remain unknown |
| 3. Infrastructure linking | Selected capital projects, service-area relationships, reviewed document links | Location relationships and actual dependencies are distinguished |
| 4. Defensible scenarios | Small number of documented infrastructure/development cases | Commissioning and allocation assumptions stated; no fabricated capacity |
| 5. Portfolio release | Hosted application, methods, QA report, reproducible source and short demonstration | Clear independent-project identity, accessible controls, reliable citations |

These are delivery stages, not promised completion dates. Numeric site-capacity scoring remains outside scope until appropriate evidence is available.

## How this demonstrates geospatial skills

The project demonstrates reference-system handling, spatial integration, reproducible Python processing, GIS database design, quality assessment, map production, interactive visualisation, and clear technical reporting. Add remote sensing only where it answers a defined question, such as independently assessing land-cover change; satellite imagery cannot reveal spare utility capacity.

## Immediate next implementation task

Build the working evidence map using the authoritative development snapshot and source-defined status/type fields. First resolve duplicate IDs, status differences, and completeness. Use authoritative municipal boundaries and current capital-project geography. Include project evidence and external electricity reference links, then validate a small set of case-study relationships before adding scenarios.
