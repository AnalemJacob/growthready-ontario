# GrowthReady Ontario

**York Region pilot · Independent GIS portfolio project by Jacob Analem**

An interactive map connecting development application records with documented water and wastewater infrastructure evidence. Explore **5,482 application records**, filter by municipality/type/source status/service reference, inspect source discrepancies, compare up to three applications, and export filtered CSV records.

## Run locally

Requires Python 3. No frontend build or package installation is needed.

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Opening `index.html` directly will not load the JSON snapshot.

Run validation with Node.js 18 or newer:

```sh
npm test
```

## Municipality analytics update

- Switch between clustered application markers and municipality shading. Shading shows application-record totals, not infrastructure capacity or density.
- Select bars in municipality, type, status and received-period charts to filter the dashboard.
- Inspect a location in the side panel, compare records and export filtered CSV.
- Read dynamically calculated findings and service-reference completeness, with source-status discrepancies in a separate data-quality panel.
- On mobile, open the collapsible filters only when needed; the map and charts remain accessible.

Water and wastewater service-area boundary polygons are intentionally excluded. Administrative municipality polygons are included solely as geographic context. Site capacity and utility connection eligibility remain unknown.

## What this version establishes

- Source-linked application details and the two source status fields when they disagree.
- Named water/wastewater service-area references, with missing/“No” values handled explicitly.
- 30 point and 6 line construction features. These are source features, not necessarily 36 distinct projects.
- Consistent linked filters, application comparison, CSV export and a mobile layout.
- A reproducible acquisition script, source register, snapshot audit and display-data transformation.

This is an evidence explorer. **It does not establish site-level infrastructure capacity, utility allocations, approvals, project commissioning dates or readiness rankings.** Electricity capacity remains unknown. Proximity to construction does not establish a servicing dependency. Application records are not unique developments or dwelling counts. The source `UNITS` field is Yes/No and is never summed.

## Data and refresh

The committed display snapshot is derived from the authoritative York Region MapServer, retrieved on 25 November 2026 UTC. Retrieval is not the source's update date. It preserves public source attributes and uses the bounding-box centre of each application geometry for display. Markers are approximate locations; they are not entrances, parcel centroids or original polygon boundaries. They may fall outside an irregular source polygon. Source coordinates are transformed to WGS84 by the source service. The display file is about 5.6 MiB; the original source files are excluded from git.

```sh
python3 scripts/fetch_york_data.py
python3 scripts/build_web_data.py
npm test
```

Refresh acquisition validates counts and IDs; source failures must be investigated before releasing another snapshot. Review `data/data_audit.json` and `docs/FIRST_DATA_AUDIT.md`. The narrative audit describes the initial snapshot and must be updated after a refresh. No refresh has been scheduled.

- [Project blueprint](docs/PROJECT_BLUEPRINT.md)
- [Source register](docs/source_register.csv)
- [Data dictionary](docs/DATA_DICTIONARY.md)
- [Initial audit](docs/FIRST_DATA_AUDIT.md)
- [Authoritative application service](https://ww8.yorkmaps.ca/arcgis/rest/services/OpenData/DevelopmentApplicationStatusAndTeams/MapServer/0)
- [York construction evidence](https://www.york.ca/environment/water-and-wastewater/water-and-wastewater-construction-projects)
- [OEB electricity map information](https://www.oeb.ca/ontarios-energy-sector/centralized-capacity-information-map)

## Hosting

Serve the repository root on any static host. All app assets and the display snapshot use relative paths, including for a GitHub Pages project URL. The Leaflet 1.9.4 library and its licence are vendored in `assets/vendor`; map tiles require internet access. The application layers still work if the OpenStreetMap basemap is unavailable. Do not use the community tile service for heavy production traffic without reviewing its usage policy and selecting suitable hosting.

## Next GIS work

Validate application spatial accuracy against a documented sample; retain original application polygon inspection; establish documented application-to-capital-project dependencies; integrate electricity evidence only when data access and permitted reuse are verified. Evaluate real servicing constraints before proposing any readiness score.

## Attribution

Contains public sector information made available under [The Regional Municipality of York's Open Data Licence](https://insights-york.opendata.arcgis.com/documents/york-region-open-data-licence/explore). Source data remains subject to that licence. Basemap © OpenStreetMap contributors. Leaflet is distributed under its included BSD 2-Clause licence. No separate licence has yet been selected for original application code.

Independent portfolio/research project; not endorsed by York Region, the Ontario Energy Board or any utility. Consult authoritative sources for current development and connection decisions.

## Municipality display geometry

`assets/data/municipalities.geojson` contains 18 components representing nine York municipalities, selected by the source `REGION = York` field. `data/boundary_display_audit.json` records source and display hashes, validation and simplification. A maximum tolerance of 0.00012 degrees is reduced for individual components until their relative area change is below 0.5%. This is a display check, not a positional-accuracy assessment. No First Nation jurisdiction is inferred from these polygons.

To regenerate after refreshing raw data:

```sh
python3 -m pip install -r scripts/requirements-gis.txt
python3 scripts/build_boundaries.py
```

These boundaries are generalized at 0.00012 degrees with topology-preserving simplification for display. Each output component was checked as valid. Independent boundaries may have small gaps or overlaps after simplification; no topology agreement between neighbours or positional accuracy is claimed. Counts use source `MUN_NAME` attributes rather than a spatial join against generalized geometry. Five source application records labelled Other/Outside York Region remain in charts and totals but have no municipality shading.

Received-date charts describe only records present in the snapshot. Closed or removed applications can be absent; this is not a historical series of all submissions, and 2026 is a partial calendar year. Period selection does not estimate construction timing.

## Documented infrastructure timeline

The timeline contains eight selected project records independently summarized from York's official construction page and the West Vaughan project page. It is a curated evidence set, not the full capital inventory. Every record retains its source URL, source section, retrieval timestamp and published completion-date precision. A date passing does not change commissioning or completion to confirmed.

Municipality selection narrows both applications and project context. Application type, status, received date, water-reference and search filters apply to application records only. A separate project-sector filter and completion-year buttons refine the timeline. A municipality association is not a project-to-application dependency. Where no curated project matches, the UI says the evidence set has no matches rather than asserting no infrastructure exists.

West Vaughan and the Markham Highway 7 watermain have explicit references to matched source construction line features. The Locate action highlights these works, which may cover only a portion of the project. It does not draw a service area or claim a site allocation. Unmatched projects are not assigned guessed coordinates. The Glenway listing does not identify a water/wastewater sector explicitly, so it is retained as Not specified.

Application cluster labels use the centres of fixed 54-pixel Web Mercator grid cells, keeping adjacent count labels apart. Individual record markers retain their original display coordinates. Clicking a cluster explores its underlying records. The opening view fits application locations with fractional zoom steps; municipality geometry remains contextual.
