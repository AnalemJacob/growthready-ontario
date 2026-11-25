# Initial explorer validation

- Four automated checks pass: snapshot count/IDs/coordinates/status disagreements against the source audit; missing and named water-reference partitioning; combined filters/search; CSV escaping and formula protection.
- JavaScript syntax checks and Python compilation pass.
- Source snapshot contains 5,482 application records and 36 construction features.
- No capacity estimates or application-to-project dependencies are calculated.
- Desktop/mobile browser validation remains pending: the available Chromium launcher points to a missing binary, and the standard Playwright browser download is blocked by the execution environment. Responsive CSS is implemented but should be visually checked in a browser before a public launch.

Suggested browser review: verify initial counts, filter to a municipality and application type, search by file number, select a map marker, compare three records, change filters, download CSV, toggle construction, fit map, and repeat at 390 px width with keyboard navigation. Verify a record with conflicting status fields and a record with a missing water reference.
