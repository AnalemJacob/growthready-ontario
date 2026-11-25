# Accessibility checks and remaining limits

The release provides application results and charts as alternatives to selecting map features. Every application can be filtered and reached through the paginated results list. Grid cells can be selected using the highest-count cell buttons. CSV and GeoJSON provide additional access to the records.

## Implemented

- Skip links to focusable controls/content; labelled form controls and map regions; native buttons and exposed pressed/expanded states.
- Visible focus styles for controls, links, summaries and programmatically focused content; improved text colours; reduced-motion CSS preferences.
- Polite filter-result announcements; keyboard selection moves focus to the application detail heading. Chart filters retain focus after their buttons are regenerated.
- Text labels and numerical counts alongside colour legends. The source meaning and interpretation limits are available in text.
- Responsive regional dashboard, Vaughan case study and findings/portfolio page, with no horizontal page overflow in tested 320 px, 390 px and 1440 px layouts.

## Verification

`tests/accessibility.cjs` runs axe-core 4.14.1 against all three pages at those three widths using WCAG 2 A/AA, 2.1 A/AA and 2.2 AA rule tags. The final scan found **zero automated violations** across nine page/viewport combinations. Machine-readable summaries are in [data/accessibility_audit.json](../data/accessibility_audit.json); full scan results are saved as CI artifacts.

Browser checks additionally exercise keyboard skip navigation, Enter activation of regional and distance-band charts, focus retention, keyboard record selection, filters and exports. The filtered GeoJSON is parsed and compared against original geometry; the PDF download is checked for its PDF signature. Text contrasts for muted labels, links and cluster labels were reviewed alongside the scan. The regional public basemap is visible in the supplied deployed-page screenshot.

## Limits

Zero automated violations is not a certification of WCAG conformance. Axe reported incomplete checks involving overlapping map controls/labels, Leaflet zoom symbols and attribution text; map overlays and their text require human review. Map canvas features do not expose the full analysis to a screen reader; use the result lists, charts, record details and downloads. No assistive-technology user study or comprehensive screen-reader review was performed. Responsive widths do not establish full browser-zoom or text-spacing conformance.

The PDF is a visually checked cartographic brief and is not a tagged, PDF/UA-certified document. Equivalent findings, methods and record results are available in HTML, Markdown, CSV and GeoJSON. External source sites and the basemap service are outside this project's control.

## Repeat

```sh
npm ci
npx playwright install chromium
npm run test:browser
npm run test:accessibility
```

Set `BROWSER_EXECUTABLE` to an existing compatible Chromium if necessary. The public frontend does not need these development dependencies.
