# Independent QGIS computational cross-check

All **1,382 Vaughan records** were recalculated using QGIS **3.40.6-Bratislava** against the hash-matched original source snapshot. There were **zero mismatches**.

| Check | Result |
| --- | --- |
| Original raw-source hashes | All three match the analysis audit |
| Source-labelled Vaughan record set | 1,382 original records |
| Original displayed application geometries | Exact coordinate-structure agreement |
| Independently selected construction line IDs | 1, 2, 3, 4, 5 |
| Minimum full-geometry distance | All agree within 0.001 m comparison tolerance |
| Maximum difference from stored rounded distance | 0.000499630 m |
| Nearest construction line / distance band | All 1,382 agree |
| Stored interior points covered by application and city | 1,382 |
| Independently calculated grid assignment | All 1,382 agree |
| Occupied cells / highest cell count | 227 / 43 |

## What was independent

The validator imports QGIS, not Shapely. It re-reads original raw GeoJSONs, checks their hashes against the frozen analysis, selects Vaughan and intersecting construction lines, transforms coordinates with `QgsCoordinateTransform`, and measures each complete application geometry against each line using `QgsGeometry.distance`. It independently evaluates the thresholds and lowest-OBJECTID tie rule, transforms stored representative points, checks their coverage and recomputes grid indices.

The validator also checks that displayed application geometries exactly match the original source geometries. Per-record distances, nearest lines, bands and grid IDs are retained in [data/qgis_validation.json](../data/qgis_validation.json), along with source and derived-data hashes, software version, timestamp, tolerance and discrepancies.

## What this does not establish

QGIS and Shapely both use GEOS for geometry operations. This checks implementation and data handling through a separate application/code path; it is not an independent geometric kernel, field survey, positional-accuracy assessment, hydraulic model or verification that source records describe current conditions. The 0.001 m comparison tolerance accommodates stored numerical rounding; it does not imply millimetre mapping accuracy.

## Reproduce

Requires QGIS 3.36 or newer and its Python bindings. Use the Python interpreter supplied by the QGIS environment; the executable path below was used in this Linux workspace.

```sh
QT_QPA_PLATFORM=offscreen /usr/bin/python3 scripts/validate_qgis.py /path/to/raw/snapshot
```

The source directory must contain the same raw files named in the study audit. The script refuses source hash mismatches and exits unsuccessfully if comparisons fail. Raw files are excluded from git. A fresh download may differ from the frozen snapshot; regenerate the study and audits together when deliberately refreshing. The Node suite verifies that the committed validation report still matches the committed study and its record results; it does not run QGIS in CI.
