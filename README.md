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

Validate spatial accuracy and topology against a documented sample; retain original polygon inspection; acquire authoritative service-area geometry; establish documented application-to-capital-project dependencies; integrate electricity evidence only when data access and permitted reuse are verified. Evaluate real servicing constraints before proposing any readiness score.

## Attribution

Contains public sector information made available under [The Regional Municipality of York's Open Data Licence](https://insights-york.opendata.arcgis.com/documents/york-region-open-data-licence/explore). Source data remains subject to that licence. Basemap © OpenStreetMap contributors. Leaflet is distributed under its included BSD 2-Clause licence. No separate licence has yet been selected for original application code.

Independent portfolio/research project; not endorsed by York Region, the Ontario Energy Board or any utility. Consult authoritative sources for current development and connection decisions.
