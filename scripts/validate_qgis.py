"""Cross-check the frozen study using QGIS, independently of its Shapely pipeline.

QT_QPA_PLATFORM=offscreen /usr/bin/python3 scripts/validate_qgis.py RAW_DIRECTORY
Requires a QGIS Python environment. This does not change the study data.
"""
import collections
import datetime
import hashlib
import json
import math
import os
from pathlib import Path
import sys
os.environ.setdefault('QT_QPA_PLATFORM','offscreen')
from qgis.core import (Qgis,QgsApplication,QgsCoordinateReferenceSystem,
 QgsCoordinateTransform,QgsGeometry,QgsJsonUtils,QgsPointXY,QgsProject)
ROOT=Path(__file__).resolve().parents[1]
RAW=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'data'
app=QgsApplication([],False);app.initQgis()
def read(p):return json.loads(p.read_text())
def geom(g):return QgsJsonUtils.geometryFromGeoJson(json.dumps(g))
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
study=read(ROOT/'assets/data/vaughan-study.json');meta=study['metadata']
for name,sha in meta['source_sha256'].items():
 if digest(RAW/name)!=sha:raise RuntimeError('Source hash mismatch: '+name)
source_apps=read(RAW/'development_applications.geojson')
source_lines=read(RAW/'water_wastewater_construction_lines.geojson')
source_mun=read(RAW/'municipal_boundaries.geojson')
ct=QgsCoordinateTransform(QgsCoordinateReferenceSystem('EPSG:4326'),QgsCoordinateReferenceSystem('EPSG:26917'),QgsProject.instance())
def projected(g):
 x=geom(g)
 if x.transform(ct)!=0:raise RuntimeError('Coordinate transformation failed')
 if x.isEmpty() or not x.isGeosValid():raise RuntimeError('Invalid projected geometry')
 return x
city=QgsGeometry.unaryUnion([projected(f['geometry']) for f in source_mun['features'] if f['properties']['NAME']=='Vaughan'])
lines=[(f['properties']['OBJECTID'],projected(f['geometry'])) for f in source_lines['features']]
lines=[(id,g) for id,g in lines if g.intersects(city)]
source_selection={str(f['properties']['OBJECTID']):f for f in source_apps['features'] if f['properties']['MUN_NAME']=='Vaughan'}
records={r['id']:r for r in study['records']};display={f['properties']['id']:f for f in study['applications']['features']}
if set(records)!=set(source_selection):raise RuntimeError('Application ID selection mismatch')
if sorted(id for id,g in lines)!=sorted(int(f['properties']['id']) for f in study['construction']['features']):raise RuntimeError('Construction selection mismatch')
mismatches=[];checks=[];max_delta=0.;inside=0;grid_ok=0;bands=collections.Counter();cells=collections.Counter()
for id,f in source_selection.items():
 r=records[id]
 if f['geometry']!=display[id]['geometry']:raise RuntimeError('Display geometry changed: '+id)
 g=projected(f['geometry']);nearest,d=min(((lid,g.distance(line)) for lid,line in lines),key=lambda pair:(pair[1],pair[0]))
 if d<0:raise RuntimeError('QGIS distance failed')
 band='0–250 m' if d<=250 else '>250–500 m' if d<=500 else '>500–1,000 m' if d<=1000 else '>1,000 m'
 delta=abs(d-r['distance_m']);max_delta=max(delta,max_delta)
 point=QgsGeometry.fromPointXY(QgsPointXY(*r['representative_point']));point.transform(ct)
 xy=point.asPoint();grid=f'{math.floor(xy.x()/1000)}:{math.floor(xy.y()/1000)}'
 if g.intersects(point) and city.intersects(point):inside+=1
 else:mismatches.append({'id':id,'check':'representative point coverage'})
 if grid==r['grid_id']:grid_ok+=1
 else:mismatches.append({'id':id,'check':'grid assignment','qgis':grid,'study':r['grid_id']})
 if delta>0.001 or nearest!=r['nearest_line_id'] or band!=r['band']:
  mismatches.append({'id':id,'check':'distance/nearest line/band','qgis_distance_m':d,'stored_distance_m':r['distance_m'],'nearest_line_id':nearest,'band':band})
 bands[band]+=1;cells[grid]+=1
 checks.append({'id':id,'qgis_distance_m':round(d,6),'stored_distance_m':r['distance_m'],'difference_m':round(delta,9),'nearest_line_id':nearest,'band':band,'grid_id':grid})
report={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'qgis_version':Qgis.QGIS_VERSION,'analysis_crs':'EPSG:26917','study_sha256':digest(ROOT/'assets/data/vaughan-study.json'),'source_sha256':meta['source_sha256'],
 'method':'Re-read hash-matched original source GeoJSONs; independently select records and intersecting lines; project and measure full geometry with QgsCoordinateTransform and QgsGeometry.distance. Reproject stored interior points and independently calculate grid indices. No Shapely is imported.',
 'interpretation':'Independent QGIS code path; QGIS and Shapely both use GEOS geometry operations. This is a computational cross-check, not a field survey, independent source verification or positional-accuracy certification.',
 'distance_comparison_tolerance_m':0.001,'checked_records':len(checks),'selected_line_ids':sorted(id for id,g in lines),'original_display_geometries_match':True,'max_absolute_difference_m':max_delta,'representative_points_covered_by_application_and_city':inside,'grid_assignments_match':grid_ok,'distance_bands':dict(bands),'occupied_grid_cells':len(cells),'largest_cell_count':max(cells.values()),'mismatch_count':len(mismatches),'mismatches':mismatches,'record_checks':checks}
(ROOT/'data/qgis_validation.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['record_checks','source_sha256']},indent=2,ensure_ascii=False))
app.exitQgis()
if mismatches:raise SystemExit(1)
