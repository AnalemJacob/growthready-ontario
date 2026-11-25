"""Reproduce the Vaughan screening study from audited raw York snapshots.

python -m pip install -r scripts/requirements-gis.txt
python scripts/analyse_vaughan.py [directory containing raw GeoJSONs]

Uses original application geometry for minimum polygon-to-line distances in NAD83 /
UTM 17N (EPSG:26917). The fixed 1 km grid assigns each application once using an
interior representative point. This is descriptive proximity, not network access,
capacity, a causal dependency, a formal hot-spot test, or unique development counts.
"""
import collections
import csv
import datetime
import hashlib
import json
from pathlib import Path
import sys
import shapely
from shapely import make_valid
from shapely.geometry import shape, mapping, box
from shapely.ops import unary_union

def transform(fn, geometry):
 return shapely.transform(geometry, fn, interleaved=False)
import pyproj

ROOT=Path(__file__).resolve().parents[1]
RAW=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'data'
OUT=ROOT/'assets/data'
OUT.mkdir(exist_ok=True,parents=True)
def read(path):return json.loads(path.read_text())
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
to_m=pyproj.Transformer.from_crs(4326,26917,always_xy=True).transform
to_geo=pyproj.Transformer.from_crs(26917,4326,always_xy=True).transform
apps=read(RAW/'development_applications.geojson')
mun=read(RAW/'municipal_boundaries.geojson')
lines=read(RAW/'water_wastewater_construction_lines.geojson')
audit=read(RAW/'data_audit.json')
city=unary_union([transform(to_m,shape(f['geometry'])) for f in mun['features'] if f['properties']['NAME']=='Vaughan'])
works=[f for f in lines['features'] if transform(to_m,shape(f['geometry'])).intersects(city)]
work_m=[transform(to_m,shape(f['geometry'])) for f in works]
if not works:raise RuntimeError('No construction line intersects Vaughan; review the source')
records=[];polygons=[];cells=collections.defaultdict(list);repairs=[];outside=[]
for f in apps['features']:
 p=f['properties']
 if p['MUN_NAME']!='Vaughan':continue
 original=shape(f['geometry'])
 if original.is_empty:raise RuntimeError(f'Empty source geometry {p["OBJECTID"]}')
 working=original if original.is_valid else make_valid(original)
 if not original.is_valid:repairs.append({'id':str(p['OBJECTID']),'reason':'make_valid for analysis only; display retains source geometry'})
 g=transform(to_m,working)
 if not g.is_valid or g.is_empty:raise RuntimeError('Unusable analysis geometry')
 distances=[g.distance(line) for line in work_m]
 nearest=min(range(len(distances)),key=lambda i:(distances[i],works[i]['properties']['OBJECTID']))
 d=distances[nearest]
 band='0–250 m' if d<=250 else '>250–500 m' if d<=500 else '>500–1,000 m' if d<=1000 else '>1,000 m'
 rp=g.representative_point();gx=int(rp.x//1000);gy=int(rp.y//1000);cell_id=f'{gx}:{gy}'
 id=str(p['OBJECTID']);cells[cell_id].append(id)
 if not city.covers(rp):outside.append(id)
 rec={'id':id,'file':p['REG_FILE_NUM'],'address':p['ADDRESS'],'type':p['APPL_TYPE'],'status':p['APPL_STATUS'],
      'distance_m':round(d,3),'band':band,'nearest_line_id':works[nearest]['properties']['OBJECTID'],
      'nearest_line_name':works[nearest]['properties']['PROJECTNAME'],'grid_id':cell_id,
      'representative_point':mapping(transform(to_geo,rp))['coordinates']}
 records.append(rec)
 polygons.append({'type':'Feature','properties':{'id':id},'geometry':f['geometry']})
records.sort(key=lambda r:int(r['id']))
if len(records)!=len({r['id'] for r in records}):raise RuntimeError('Duplicate application IDs')
for i,f in enumerate(works):f['properties']={'id':str(f['properties']['OBJECTID']),'name':f['properties']['PROJECTNAME'],'location':f['properties']['LOCATION']}
grid=[]
for cell_id,ids in sorted(cells.items()):
 x,y=map(int,cell_id.split(':'));g=box(x*1000,y*1000,(x+1)*1000,(y+1)*1000)
 grid.append({'type':'Feature','properties':{'id':cell_id,'count':len(ids)},'geometry':mapping(transform(to_geo,g))})
bands=[{'label':label,'count':sum(r['band']==label for r in records)} for label in ['0–250 m','>250–500 m','>500–1,000 m','>1,000 m']]
summary={'record_count':len(records),'line_feature_count':len(works),'line_name_count':len({f['properties']['name'] for f in works}),
 'distance_bands':bands,'within_250m':bands[0]['count'],'within_500m':sum(b['count'] for b in bands[:2]),'within_1000m':sum(b['count'] for b in bands[:3]),
 'grid_cell_count':len(grid),'largest_grid_count':max(f['properties']['count'] for f in grid),
 'top_grid_cells':sorted([f['properties'] for f in grid],key=lambda p:(-p['count'],p['id']))[:5],
 'types':dict(collections.Counter(r['type'] for r in records)),
 'median_distance_m':sorted(r['distance_m'] for r in records)[len(records)//2] if len(records)%2 else sum(sorted(r['distance_m'] for r in records)[len(records)//2-1:len(records)//2+1])/2}
meta={'snapshot_retrieved_utc':audit['retrieved_at_utc'],'analysis_created_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'analysis_crs':'EPSG:26917','source_crs':'EPSG:4326','grid_size_m':1000,'grid_anchor_utm_m':[0,0],
 'distance_method':'Minimum Euclidean distance from full application geometry to each published construction line intersecting Vaughan. Not distance to a centric display marker.',
 'threshold_rule':'Use unrounded distance: <=250; >250 and <=500; >500 and <=1000; >1000 metres. Display distances are rounded to 0.001 m for reproducibility, not positional accuracy.',
 'grid_method':'One interior representative point per application; fixed projected 1 km cells, not area-weighted. Full cells may extend beyond municipality boundaries.',
 'source_urls':['https://ww8.yorkmaps.ca/arcgis/rest/services/OpenData/DevelopmentApplicationStatusAndTeams/MapServer/0','https://ww8.yorkmaps.ca/arcgis/rest/services/OpenData/ActiveConstruction/MapServer/2','https://ww8.yorkmaps.ca/arcgis/rest/services/OpenData/Boundary/MapServer/1'],
 'source_sha256':{name:digest(RAW/name) for name in ['development_applications.geojson','water_wastewater_construction_lines.geojson','municipal_boundaries.geojson']},
 'qa':{'geometry_repairs':repairs,'representative_points_outside_municipality':outside,'all_analysis_geometries_valid':True},
 'software':{'shapely':shapely.__version__,'pyproj':pyproj.__version__},
 'limitations':['Application records are not unique sites, approved homes or demand.','Construction inventory is partial; nearest mapped works are not necessarily the nearest operational infrastructure.','Thresholds are analyst-selected screening distances, not utility standards.','Dates and status describe the source snapshot, not current approval or commissioning.','No hydraulic connectivity, spare capacity, site allocation or project dependency established.','Grid counts depend on cell size, alignment, representation and multiple applications at a location.']}
payload={'metadata':meta,'summary':summary,'records':records,'applications':{'type':'FeatureCollection','features':polygons},
 'construction':{'type':'FeatureCollection','features':works},'grid':{'type':'FeatureCollection','features':grid},
 'boundary':{'type':'FeatureCollection','features':[{'type':'Feature','properties':{'name':'Vaughan'},'geometry':mapping(transform(to_geo,city))}]}}
(OUT/'vaughan-study.json').write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')))
(ROOT/'data/vaughan_analysis_audit.json').write_text(json.dumps({'metadata':meta,'summary':summary,'display_sha256':digest(OUT/'vaughan-study.json')},indent=2))
with (OUT/'vaughan-screening.csv').open('w',newline='') as handle:
 fields=[k for k in records[0] if k!='representative_point'];writer=csv.DictWriter(handle,fieldnames=fields,lineterminator='\n');writer.writeheader()
 for r in records:
  safe={k:("'"+v if isinstance(v,str) and v.startswith(('=','+','-','@','\t','\r')) else v) for k,v in r.items() if k in fields};writer.writerow(safe)
print(json.dumps(summary,indent=2));print('Source polygons retained exactly; repairs:',len(repairs),'interior points outside city:',len(outside))
