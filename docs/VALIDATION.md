# Version 1.0 validation

## Automated data and behaviour checks

All **17 Node tests pass**. They cover source snapshot counts and valid display coordinates; named/missing service references; combined filters; safe CSV quoting/formula neutralisation; grouped totals; UTC received-date buckets; clustering without omitted/duplicated records; municipal boundary audits; official project provenance/date precision and filters; construction geometry-class/ID matching; count-label separation; Vaughan source-record/geometry IDs and derived hash; distance-band and line-ID reconciliation; grid counts; case-study filters; and agreement between the QGIS report and every Vaughan record.

The fixed snapshot has 5,482 regional application records, including 1,382 labelled Vaughan. Curated infrastructure evidence contains eight project summaries, separate from the GIS construction-feature inventory. Application records are not unique developments, dwelling totals or infrastructure demand.

JavaScript syntax, Python compilation, local HTML links/assets and git whitespace checks pass. Binary files are declared in .gitattributes. Python analysis uses Shapely 2.2.0 and pyproj 3.8.0. No source application geometries required repair in the Vaughan study. All 18 municipal display components passed individual validity checks; no shared-edge topology or positional-accuracy certification is claimed. Municipality counts use source attributes, not generalized polygons.

## Independent QGIS computation

QGIS 3.40.6 independently selected and recalculated all **1,382 Vaughan records** from hash-matched original inputs. Nearest lines, distance bands and grid assignments agree, with **zero mismatches**. Maximum difference from stored rounded distances: 0.000499630 m. All stored representative points are covered by their application and the Vaughan boundary.

See [the QGIS report](QGIS_VALIDATION.md) and [per-record checks](../data/qgis_validation.json). Both pipelines use GEOS geometry operations; agreement is a computational cross-check, not independent source validation, positional accuracy or a servicing-capacity assessment. CI verifies that this report remains tied to the exact study; it does not download raw sources or run QGIS.

## Browser and accessibility checks

Chromium 133 checks cover desktop (1440 px) and mobile (390 px): regional/case-study counts, filters, search, linked charts, map-mode switching, timeline municipality/year/sector linkage, mapped works, application and cell details, record comparison, empty results/reset, exports and page overflow. Keyboard checks exercise skip links, Enter activation of charts, retained chart focus and focus on selected record headings. No uncaught page errors occurred.

The filtered GeoJSON download is parsed: all 191 records selected by the 0–250 m filter retain the exact original geometry and expected band. The PDF download has the expected filename and PDF signature. CSV download is also checked.

Axe-core 4.14.1 scans all three public pages at **1440, 390 and 320 px**. The final scan reports **zero automated violations** across nine combinations, using WCAG 2 A/AA, 2.1 A/AA and 2.2 AA rule tags. Incomplete checks and testing limits are retained in [accessibility notes](ACCESSIBILITY.md) and [the scan summary](../data/accessibility_audit.json). This does not certify WCAG, screen-reader or PDF/UA conformance.

The isolated local browser could not reach external basemap tiles; application and analysis vectors rendered and fallback notices appeared. The user's deployed-page capture shows the regional basemap loading. A separate live-page browser check returned HTTP 200 and the expected 5,482 regional and 1,382 Vaughan counts. The new portfolio page and release changes still require the final pull request to be merged before appearing publicly.

## Cartographic output and documentation

The three-page brief was rendered and visually reviewed for readable figures/tables, matching map extents, source links, QGIS validation text and page overflow. Maps preserve polygon holes, use projected UTM axes in kilometres, and show grid north up. No online basemap is needed for these figures. The brief is not a tagged PDF; equivalent findings are available in HTML, Markdown and tabular/GIS exports.

Methods document selected construction features, full-polygon distance, thresholds, representative-point assignment, rounding, source hashes and limits. The portfolio narrative includes recommendations and suggested application wording without claiming government adoption or measured public impact.

## Repeat checks and CI

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run test:accessibility
```

Set `BROWSER_EXECUTABLE` to an existing compatible Chromium when needed. The scripts start and close their own local servers. Detailed results and screenshots are saved in ignored `test-results/` and uploaded by CI. Browser dependencies are pinned in package-lock.json; the public static frontend needs no dependency installation.

GitHub Actions runs these checks on pull requests and main. After validation passes on main, its dependent release job tags the package version if absent, without replacing existing tags. GitHub Pages continues to publish from main/root. See [maintenance](MAINTENANCE.md) for the full source-refresh and QGIS revalidation sequence.
