# Refresh and maintenance procedure

Version 1.0 is a frozen, dated York Region pilot. No automatic source refresh is scheduled. Preserve the released snapshot and its audit before deliberately refreshing.

## Rebuild in order

1. Download official inputs with `python3 scripts/fetch_york_data.py`. Investigate count, schema, ID or source failures before continuing. Raw GeoJSONs and acquisition audit are written under `data/`; large raw inputs are excluded from git.
2. Install `scripts/requirements-gis.txt`; run `python3 scripts/build_web_data.py` and `python3 scripts/build_boundaries.py`.
3. Run `python3 scripts/analyse_vaughan.py data` to regenerate the Vaughan study, CSV and audit.
4. From a QGIS Python environment, run `QT_QPA_PLATFORM=offscreen /usr/bin/python3 scripts/validate_qgis.py data`. The validator checks source hashes and independently recalculates the study. Resolve discrepancies before release.
5. Install Matplotlib 3.10.8 and ReportLab 4.4.9, and run `python3 scripts/build_vaughan_brief.py`. The brief generator rejects a stale QGIS report when one exists. Copy its `tmp/pdfs/vaughan-analysis-map.png` to `assets/portfolio/vaughan-analysis.png` after reviewing it.
6. Separately review the curated infrastructure-project JSON against its linked official pages. Its published forecasts are not refreshed by downloading GIS features. Retain source date precision and leave commissioning unverified unless documented.
7. Update narrative counts, source register, initial/snapshot audit documentation, findings page, portfolio text, validation expectations and release notes to match the new snapshot. Frozen-snapshot test counts must be intentionally reviewed, not blindly replaced.
8. Run `npm ci`, `npm test`, `npm run test:browser` and `npm run test:accessibility` with an installed Chromium. Review incomplete accessibility checks, maps and PDF pages. Verify hashes, local links, downloads and mobile layouts. Confirm the public basemap after deployment.
9. Bump the package version deliberately, preserve licence notices and open a reviewed pull request. Main-branch merges update the existing GitHub Pages site. After all main-branch validation passes, the release-tag job creates the package version tag if missing; it never replaces an existing tag.

Store exact raw source files matching the recorded hashes if byte-for-byte input reproduction is required. A later download can change. Re-running analysis also changes its run timestamp and derived hash; re-run the QGIS check and regenerate the brief together.

## Hosting and dependencies

Serve the repository root. Leaflet is vendored; application data and scripts are relative paths and require no build. OpenStreetMap tiles require internet access and appropriate use of the community service. If tiles fail, the vector layers and record lists remain usable. Review upstream dependencies before upgrading; run the full checks after changes. Test tooling is pinned in package-lock.json, and third-party terms are listed in THIRD_PARTY_NOTICES.md.

## Evidence required for extensions

A service area requires reusable authoritative polygons; a capacity conclusion requires relevant utility evidence and modelling; an application-to-project dependency requires explicit documentation. Do not substitute administrative boundaries, proximity bands or completion forecasts for that evidence.
