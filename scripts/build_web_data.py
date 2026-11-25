"""Produce a compact, reproducible display snapshot; source geometries stay unaltered.

Application markers use bounding-box centres, not entrances or parcel centroids.
No capacity, proximity dependency, or dwelling-count inference is performed.
"""
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'data'
OUT = ROOT / 'assets' / 'data'
OUT.mkdir(parents=True, exist_ok=True)

def read(name):
    return json.loads((SOURCE / name).read_text())

def positions(coords):
    if isinstance(coords[0], (int, float)):
        yield coords
    else:
        for child in coords:
            yield from positions(child)

features = []
for feature in read('development_applications.geojson')['features']:
    points = list(positions(feature['geometry']['coordinates']))
    xs, ys = zip(*[(p[0], p[1]) for p in points])
    features.append({'id': str(feature['properties']['OBJECTID']),
                     'lng': round((min(xs)+max(xs))/2, 6),
                     'lat': round((min(ys)+max(ys))/2, 6),
                     'properties': feature['properties']})
audit = read('data_audit.json')
payload = {'retrieved': audit['retrieved_at_utc'], 'applications': features,
           'construction': [f for name in ['water_wastewater_construction_points.geojson',
                                          'water_wastewater_construction_lines.geojson']
                            for f in read(name)['features']]}
(OUT/'snapshot.json').write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')))
print(f"Built {len(features)} application display markers and {len(payload['construction'])} construction features")
