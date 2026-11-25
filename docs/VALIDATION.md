# Municipality analytics validation

## Automated checks

Eight Node tests pass: source snapshot consistency; named/missing references; combined filters; CSV safety; grouped totals; UTC received-year/range semantics and date-bucket totals; deterministic map clustering without omitted/duplicated records; and municipal display boundaries/audit. JavaScript syntax and Python compilation also pass.

Boundary transformation uses Shapely 2.2.0. All 18 source and simplified geometry components passed individual validity checks; no shared-edge topology or positional accuracy certification is claimed. Counts use the source municipality field.

## Browser checks

Chromium 133 was used for desktop (1440 px) and mobile (390 px) checks. Checked source counts, filtering/search, linked municipality/year charts, map-mode switching, application details, comparison, CSV download, empty results/reset, mobile filters and page overflow. No uncaught page errors occurred.

The test browser could not reach the external basemap tiles in this environment. Application clusters and municipality geometry rendered without the basemap, and the application displayed its availability notice. External tile rendering needs a check on the public deployment.

## Interpretation

Municipalities are administrative boundaries, not service areas. No service-area polygons, site-capacity estimates, readiness scores or inferred application-to-infrastructure dependencies are included. Construction is an unfiltered regional context layer. Received-date charts are not a complete historical submissions series.

## Repeat browser checks

Install the optional development dependency with `npm install --no-save --package-lock=false playwright`, then run `npx playwright install chromium` and `node tests/browser-smoke.cjs`. Alternatively set `BROWSER_EXECUTABLE` to an installed compatible Chromium executable. The script starts and closes its own local server, and saves screenshots in the ignored `test-results/` directory. The public frontend needs neither this dependency nor an installation step.
