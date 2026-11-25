# Vaughan: development activity and mapped construction

This independent screening study asks where development application records concentrate in Vaughan and how close their original geometries are to published water/wastewater construction lines. It helps select locations for document review and utility discussions. It does not determine infrastructure capacity, allocation, approval, delay or growth readiness.

## Source trail

All three datasets are York Region's authoritative public services, acquired in the audited 25 November 2026 UTC snapshot. Retrieval time is not the publisher's update date. See the [source register](source_register.csv) for licence and provenance checks. Contains public sector information made available under The Regional Municipality of York's Open Data Licence.

| Input | Official service | Selection |
| --- | --- | --- |
| Application boundaries and attributes | [DevelopmentApplicationStatusAndTeams / 0](https://ww8.yorkmaps.ca/arcgis/rest/services/OpenData/DevelopmentApplicationStatusAndTeams/MapServer/0) | Source `MUN_NAME = Vaughan` |
| Construction lines | [ActiveConstruction / 2](https://ww8.yorkmaps.ca/arcgis/rest/services/OpenData/ActiveConstruction/MapServer/2) | Original line geometry intersects Vaughan boundary |
| Municipal boundary | [Boundary / 1](https://ww8.yorkmaps.ca/arcgis/rest/services/OpenData/Boundary/MapServer/1) | Source `NAME = Vaughan`, union components |

The construction selection contains five features carrying four distinct source names: Northeast Vaughan PD8 Watermain, West Vaughan Sewage Servicing (two features), Northeast Vaughan Sewer and Humber to Black Creek Forcemains. These lines are a partial published construction inventory, not an inventory of operational pipes or all planned works. Distances use the complete selected line features, including any portions outside Vaughan.

## Method

1. Retain all 1,382 application records labelled Vaughan in the source. IDs identify source records; overlapping applications can concern the same site. Preserve original returned WGS84 GeoJSON coordinates for the interactive polygons and downloads. Main-explorer markers are a separate approximate display representation and are not used here.
2. Transform full application geometry, construction lines and the original municipal boundary from EPSG:4326 to NAD83 / UTM zone 17N, EPSG:26917, using longitude/latitude axis order. The source service returned WGS84 from its native coordinate system. Distances are projected metres, not road or hydraulic network distances.
3. Check each application geometry. Use Shapely `make_valid` for analysis only if invalid; retain original geometry for display. No application geometries required repair in this snapshot. Fail on empty/unusable analysis geometry or duplicate record IDs.
4. Measure the minimum Euclidean distance between each complete application geometry and every selected construction line. Intersections have zero distance. Keep the nearest source line ID/name; exact ties use the lower OBJECTID. A polygon can extend across a large area, so this is not distance from its entrance, building or point marker.
5. Classify unrounded distances into mutually exclusive bands: at most 250 m; over 250 through 500 m; over 500 through 1,000 m; over 1,000 m. Thresholds are analyst-selected screening choices, not utility standards. Stored distances are rounded to 0.001 m for reproducibility; the UI uses whole metres. Neither precision implies positional accuracy.
6. Generate one interior representative point from each projected application geometry and assign it to a fixed 1,000 m grid anchored at UTM (0, 0). The cell ID is `floor(easting/1000):floor(northing/1000)`. Assign each record once; sum records in occupied cells. Draw complete cells, which may extend outside Vaughan. This is not area-weighted density or a statistically tested hot-spot analysis.
7. Record source SHA-256 hashes, software versions, run time, checks and results in [the analysis audit](../data/vaughan_analysis_audit.json). The audit also hashes the derived web dataset. Geometry validity and point coverage are not positional-accuracy assessments.

## Snapshot results

| Minimum distance band | Application records | Share |
| --- | ---: | ---: |
| 0–250 m | 191 | 13.8% |
| >250–500 m | 39 | 2.8% |
| >500–1,000 m | 93 | 6.7% |
| >1,000 m | 1,059 | 76.6% |

Percentages are individually rounded. Cumulative counts are 191 within 250 m, 230 within 500 m (16.6%) and 323 within 1,000 m (23.4%). The median minimum distance is approximately 1,989 m. Changing the threshold changes the review set, without proving any utility relationship.

There are 227 occupied cells. The largest, `618:4849`, contains 43 records; the next four contain 38, 31, 30 and 26. Counts depend on grid size, alignment and representative-point choice. Multiple records at one location may inflate concentrations. No representative points fell outside the original Vaughan municipal boundary. No independent positional-accuracy assessment has been performed.

## Interface and exports

`vaughan.html` links the original polygon and 1 km grid views to distance/type/search filters, result lists, distance charts and the five highest-count cells. Construction lines remain unfiltered. Record details expose nearest source line IDs/names and state that capacity and dependency are unknown.

The CSV is the full case-study analysis. The GeoJSON button exports only currently filtered original application geometries with derived attributes. CSV string values that could execute spreadsheet formulas are prefixed with an apostrophe. The [three-page PDF](../output/pdf/GrowthReady_Vaughan_Brief.pdf) contains static unfiltered results, paired maps, threshold sensitivity, limitations and official source links. The PDF uses projected axes in kilometres and grid north up; its maps need no online basemap.

## Reproduce

Python 3 with Shapely 2.2.0 and pyproj 3.8.0 was used. The optional PDF generator was checked with Matplotlib 3.10.8 and ReportLab 4.4.9; it uses DejaVu Sans from the system fonts.

```sh
python3 -m pip install -r scripts/requirements-gis.txt
python3 scripts/fetch_york_data.py
python3 scripts/build_web_data.py
python3 scripts/analyse_vaughan.py data
python3 -m pip install matplotlib==3.10.8 reportlab==4.4.9
python3 scripts/build_vaughan_brief.py
npm test
```

An optional argument to `analyse_vaughan.py` selects another directory containing the three raw GeoJSONs and `data_audit.json`. Raw inputs are excluded from git; acquisition today may produce different results. Exact snapshot reproduction requires raw inputs matching the recorded hashes. Review the audit, figures, narrative counts and tests before releasing a refresh. Rebuilding adds a new run timestamp, so the derived file hash can change even with identical source geometry.

## Interpretation limits

Application records are not unique developments, approved dwellings or infrastructure demand. Source `UNITS` is Yes/No and is not used as a dwelling count. Source status is not construction or approval status. The broader explorer retains disagreements between source status fields; this case-study label uses `APPL_STATUS`.

The nearest published construction line may not serve the site. Missing construction, operational infrastructure, elevations, network connectivity, hydraulic modelling, utility allocations and documented project dependencies prevent a servicing or capacity conclusion. Construction completion is not commissioning. No service-area polygons, readiness ranking or cause-of-delay inference is added. Obtain current authoritative project and utility evidence before making development decisions.
