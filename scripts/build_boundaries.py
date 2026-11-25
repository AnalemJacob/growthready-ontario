"""Build municipality display boundaries, not water/wastewater service areas.

Install shapely==2.2.0, then run with the directory containing the source snapshot.
Preserves every source component. Uses topology-preserving simplification in source
GeoJSON WGS84 coordinates at 0.00012 degrees; never use this display layer for survey,
area measurement or site servicing decisions. Independent features may have tiny
gaps/overlaps after simplification; source NAME, not point overlay, drives statistics.
"""
import hashlib
import json
from pathlib import Path
import sys
from shapely.geometry import shape, mapping

root = Path(__file__).resolve().parents[1]
source = (Path(sys.argv[1]) if len(sys.argv)>1 else root/'data')/'municipal_boundaries.geojson'
data = json.loads(source.read_text())
features = []
audit = []
for feature in data['features']:
    p = feature['properties']
    if p.get('REGION') != 'York':
        continue
    geometry = shape(feature['geometry'])
    if not geometry.is_valid:
        raise ValueError(f"Invalid source geometry: {p['OBJECTID']}")
    tolerance = 0.00012
    simplified = geometry.simplify(tolerance, preserve_topology=True)
    # Retain small islands accurately: reduce tolerance until area change is <0.5%.
    while geometry.area and abs(simplified.area-geometry.area)/geometry.area > 0.005:
        tolerance /= 2
        if tolerance < 1e-10:
            simplified = geometry
            tolerance = 0
            break
        simplified = geometry.simplify(tolerance, preserve_topology=True)
    if simplified.is_empty or not simplified.is_valid:
        raise ValueError(f"Invalid display geometry: {p['OBJECTID']}")
    features.append({'type':'Feature','properties':{'NAME':p['NAME'],'OBJECTID':p['OBJECTID']},'geometry':mapping(simplified)})
    audit.append({'objectid':p['OBJECTID'],'name':p['NAME'],'source_valid':True,'display_valid':True,'tolerance_degrees':tolerance,
                  'relative_area_change':abs(simplified.area-geometry.area)/geometry.area if geometry.area else 0})
dest=root/'assets/data/municipalities.geojson'
dest.write_text(json.dumps({'type':'FeatureCollection','features':features}, separators=(',',':')))
(root/'data/boundary_display_audit.json').write_text(json.dumps({
    'source':'https://ww8.yorkmaps.ca/arcgis/rest/services/OpenData/Boundary/MapServer/1',
    'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
    'source_snapshot_retrieved_utc':json.loads((source.parent/'data_audit.json').read_text())['retrieved_at_utc'],
    'display_sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
    'maximum_simplification_tolerance_degrees':0.00012,'maximum_relative_area_change':0.005,
    'feature_count':len(features),'distinct_municipalities':len({f['properties']['NAME'] for f in features}),
    'notes':'Municipal jurisdiction context only. Not service areas. Counts grouped by source application MUN_NAME, not spatial containment.',
    'features':audit},indent=2))
print(f'Built {len(features)} valid municipality components; {dest.stat().st_size:,} bytes')
