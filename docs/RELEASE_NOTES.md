# Version 1.0.0 — York Region pilot

## Completed scope

- Regional evidence explorer with 5,482 application records, nine municipality comparisons, source-status discrepancies, received-date summaries, record comparison and CSV export.
- Eight curated, source-linked official infrastructure project summaries and published completion-year context.
- Vaughan case study with 1,382 original application geometries, five selected construction lines, projected distance bands, fixed 1 km grid, filtered GeoJSON and complete analysis CSV.
- Three-page mapped brief, public findings/portfolio page, source register, data dictionary, reproducible acquisition/analysis and documented refresh procedure.
- Independent QGIS computational cross-check of every Vaughan record, with zero mismatches.
- Keyboard focus improvements, live filter announcements, map alternatives, responsive layouts and automated browser/accessibility checks.

## Data and limits

The frozen source snapshot was retrieved on 25 November 2026 UTC; this is not the publisher's update date. No automatic source refresh is scheduled. Application counts are not unique developments or dwelling totals. Published construction is partial. Administrative boundaries are not utility coverage. Site capacity, allocation, electricity availability, actual serving systems and application-to-capital-project dependencies are unverified.

The statistical grid is descriptive, not a formal hot-spot test. Geometry validity and computational agreement do not measure source positional accuracy. Completion forecasts do not establish commissioning. Accessibility testing is bounded by the checks in ACCESSIBILITY.md.

## Deployment and version tag

The repository's existing GitHub Pages configuration publishes `main` at the repository root. Merge the final reviewed pull request to publish these files. After the validation job passes on main, the `Tag validated release` job creates `v1.0.0` automatically if that tag does not already exist. It does not replace an existing tag. Existing GitHub Pages deployment remains in place.

## Further work outside this release

Authoritative utility capacity and service areas, documented site dependencies, independent positional accuracy checks, unique-development linkage, remote sensing and province-wide expansion require further data and validation. They do not block completion of this bounded pilot.
