# Municipality analytics validation

## Automated checks

Twelve Node tests pass: source snapshot consistency; named/missing references; combined filters; CSV safety; grouped totals; UTC received-year/range semantics and date-bucket totals; deterministic map clustering without omitted/duplicated records; and municipal display boundaries/audit. JavaScript syntax and Python compilation also pass.

Boundary transformation uses Shapely 2.2.0. All 18 source and simplified geometry components passed individual validity checks; no shared-edge topology or positional accuracy certification is claimed. Counts use the source municipality field.

## Browser checks

Chromium 133 was used for desktop (1440 px) and mobile (390 px) checks. Checked source counts, filtering/search, linked municipality/year charts, map-mode switching, application details, comparison, CSV download, empty results/reset, mobile filters and page overflow. No uncaught page errors occurred.

The test browser could not reach the external basemap tiles in this environment. Application clusters and municipality geometry rendered without the basemap, and the application displayed its availability notice. External tile rendering needs a check on the public deployment.

## Interpretation

Municipalities are administrative boundaries, not service areas. No service-area polygons, site-capacity estimates, readiness scores or inferred application-to-infrastructure dependencies are included. Construction is an unfiltered regional context layer. Received-date charts are not a complete historical submissions series.

## Repeat browser checks

Install the optional development dependency with `npm install --no-save --package-lock=false playwright`, then run `npx playwright install chromium` and `node tests/browser-smoke.cjs`. Alternatively set `BROWSER_EXECUTABLE` to an installed compatible Chromium executable. The script starts and closes its own local server, and saves screenshots in the ignored `test-results/` directory. The public frontend needs neither this dependency nor an installation step.

## Infrastructure and map update

Four additional automated tests validate official project provenance/date precision, municipality/sector filters, construction geometry-class plus ID matching, and separation of cluster count labels. Browser checks include project-year selection, municipality linkage, sector selection and locating mapped works. The opening view fits application locations with fractional zoom, and grid count labels have a maximum 48-pixel diameter in 54-pixel cells.

## Vaughan spatial case study

The complete suite now has 16 passing Node tests. Four case-study tests verify the derived file against its audit hash, reconcile the 1,382 Vaughan IDs to the regional snapshot, check geometry-repair/outside-point audit flags, reconcile the five included construction line IDs and four distance bands, reconcile all grid assignments (227 occupied cells, maximum 43 records), and exercise combined filters and empty summaries.

Desktop and 390 px mobile browser checks additionally cover both case-study map modes, distance filtering, empty results/reset, grid-cell and application details, GeoJSON and PDF downloads, and horizontal overflow. Screenshots and uncaught-page-error checks are included in `tests/browser-smoke.cjs`. As with the regional explorer, external basemap tiles were unavailable in the isolated test environment; application and analysis vector layers rendered.

The three-page PDF was rendered and visually checked for legibility, map extents, tables, source links and page overflow. Python scripts compile. See [Vaughan methods](VAUGHAN_METHODS.md) for the projected distance method, threshold sensitivity, snapshot results and interpretation limits. Source application geometry is retained for display; validity and representative-point checks do not certify positional accuracy.
