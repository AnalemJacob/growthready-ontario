"""Generate the standalone three-page findings brief from the study artifact.

Requires reportlab and matplotlib in addition to requirements-gis.txt.
"""
import json
import hashlib
from pathlib import Path
from xml.sax.saxutils import escape
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as Patch, Patch as LegendPatch
from matplotlib.ticker import FuncFormatter
from shapely.geometry import shape
from shapely.geometry.polygon import orient
from shapely.plotting import patch_from_polygon
import shapely

def transform(fn, geometry):
 return shapely.transform(geometry, fn, interleaved=False)
import pyproj
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT=Path(__file__).resolve().parents[1]
D=json.loads((ROOT/'assets/data/vaughan-study.json').read_text());S=D['summary'];M=D['metadata']
QPATH=ROOT/'data/qgis_validation.json'
Q=json.loads(QPATH.read_text()) if QPATH.exists() else None
if Q and Q['study_sha256']!=hashlib.sha256((ROOT/'assets/data/vaughan-study.json').read_bytes()).hexdigest():raise RuntimeError('QGIS validation is stale; rerun validate_qgis.py before building the brief')
TMP=ROOT/'tmp/pdfs';TMP.mkdir(parents=True,exist_ok=True)
OUT=ROOT/'output/pdf';OUT.mkdir(parents=True,exist_ok=True)
project=pyproj.Transformer.from_crs(4326,26917,always_xy=True).transform
band_colors=['#157d70','#78aebc','#c6a15d','#b6c0c5'];bands=[b['label'] for b in S['distance_bands']]
lookup={r['id']:r for r in D['records']}
fig,axes=plt.subplots(1,2,figsize=(10,5.5));fig.patch.set_facecolor('white')
city=transform(project,shape(D['boundary']['features'][0]['geometry']))
def polygons(g):return list(g.geoms) if g.geom_type=='MultiPolygon' else [g]
for ax in axes:
 for poly in polygons(city):
  x,y=poly.exterior.xy;ax.plot(x,y,color='#183c31',linewidth=1)
 ax.set_aspect('equal');ax.set_xlim(city.bounds[0]-500,city.bounds[2]+500);ax.set_ylim(city.bounds[1]-500,city.bounds[3]+500)
 ax.xaxis.set_major_formatter(FuncFormatter(lambda x,pos:f'{x/1000:.0f}'))
 ax.yaxis.set_major_formatter(FuncFormatter(lambda y,pos:f'{y/1000:.0f}'))
 ax.tick_params(labelsize=9);ax.set_xlabel('UTM easting (km)',fontsize=10);ax.set_ylabel('UTM northing (km)',fontsize=10)
 ax.grid(alpha=.15)
for f in D['grid']['features']:
 g=transform(project,shape(f['geometry']));n=f['properties']['count'];c='#0e5d4b' if n>=30 else '#348d70' if n>=15 else '#87bba4' if n>=5 else '#d9e9df'
 for poly in polygons(g):axes[0].add_patch(Patch(list(poly.exterior.coords),facecolor=c,edgecolor='white',linewidth=.25))
for f in D['applications']['features']:
 g=transform(project,shape(f['geometry']));c=band_colors[bands.index(lookup[f['properties']['id']]['band'])]
 for poly in polygons(g):axes[1].add_patch(patch_from_polygon(orient(poly,sign=1),facecolor=c,edgecolor=c,linewidth=.2))
for f in D['construction']['features']:
 g=transform(project,shape(f['geometry']));segments=list(g.geoms) if g.geom_type=='MultiLineString' else [g]
 for line in segments:
  x,y=line.xy;axes[1].plot(x,y,color='#295ea0',linewidth=1.6)
axes[0].set_title('Application records in 1 km cells',fontsize=13,loc='left',fontweight='bold')
axes[1].set_title('Distance to mapped construction',fontsize=13,loc='left',fontweight='bold')
axes[0].legend(handles=[LegendPatch(color=c,label=l) for c,l in zip(['#d9e9df','#87bba4','#348d70','#0e5d4b'],['1-4','5-14','15-29','30+'])],loc='lower left',fontsize=9,title='Records per cell',title_fontsize=9)
axes[1].legend(handles=[LegendPatch(color=c,label=l.replace('–','-')) for c,l in zip(band_colors,bands)]+[LegendPatch(color='#295ea0',label='Mapped construction')],loc='lower left',fontsize=8)
fig.tight_layout();plot=TMP/'vaughan-analysis-map.png';fig.savefig(plot,dpi=260);plt.close(fig)
fontdir=Path('/usr/share/fonts/truetype/dejavu')
pdfmetrics.registerFont(TTFont('DV',str(fontdir/'DejaVuSans.ttf')));pdfmetrics.registerFont(TTFont('DV-Bold',str(fontdir/'DejaVuSans-Bold.ttf')))
pdfmetrics.registerFontFamily('DV',normal='DV',bold='DV-Bold',italic='DV',boldItalic='DV-Bold')
styles=getSampleStyleSheet();styles.add(ParagraphStyle(name='BodyDV',fontName='DV',fontSize=10,leading=14,textColor=colors.HexColor('#254439'),spaceAfter=10))
styles.add(ParagraphStyle(name='TitleDV',fontName='DV-Bold',fontSize=25,leading=30,textColor=colors.HexColor('#173c32'),spaceAfter=15))
styles.add(ParagraphStyle(name='HeadingDV',fontName='DV-Bold',fontSize=14,leading=19,textColor=colors.HexColor('#087763'),spaceBefore=12,spaceAfter=8))
styles.add(ParagraphStyle(name='SmallDV',fontName='DV',fontSize=8,leading=12,textColor=colors.HexColor('#536c61'),spaceAfter=8))
story=[]
def p(text,style='BodyDV'):story.append(Paragraph(text,styles[style]))
def heading(text):p(text,'HeadingDV')
def table(rows,widths):
 t=Table([[Paragraph(str(c),styles['SmallDV']) for c in row] for row in rows],colWidths=widths,hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e7f2ed')),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#cbdcd2')),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),7)]));story.append(t);story.append(Spacer(1,10))
p('GROWTHREADY ONTARIO / VAUGHAN PILOT','SmallDV');p('Development activity &amp; mapped construction','TitleDV')
p('A reproducible GIS screening study by Jacob Analem. Source snapshot: '+M['snapshot_retrieved_utc'][:10]+' UTC. Analysis: '+M['analysis_created_utc'][:10]+' UTC.','SmallDV')
p('<b>Question:</b> Where do application records concentrate in Vaughan, and how close are their boundaries to the published water/wastewater construction lines?')
heading('What the snapshot shows')
p(f'<b>{S["record_count"]:,} application records</b> were analysed against <b>{S["line_feature_count"]} construction line features</b> carrying {S["line_name_count"]} distinct source names. Applications can overlap or concern the same development.')
p(f'<b>{S["within_1000m"]:,} records ({S["within_1000m"]/S["record_count"]*100:.1f}%)</b> have application geometry within 1,000 m of a mapped line. The median minimum distance is approximately <b>{S["median_distance_m"]:,.0f} m</b>.')
table([['Minimum distance to mapped works','Application records','Share']]+[[b['label'].replace('–','-'),str(b['count']),f'{b["count"]/S["record_count"]*100:.1f}%'] for b in S['distance_bands']],[285,100,105])
p(f'The 1 km grid contains {S["grid_cell_count"]} occupied cells. The largest cell contains <b>{S["largest_grid_count"]} application records</b>; its grid identifier is {S["top_grid_cells"][0]["id"]}. This is concentration of records, not a statistically tested hot spot.')
heading('Planning use')
p('Use this screening to choose places for document review and utility discussions. Ask whether an application has an allocation, which system serves it, and whether a published upgrade is a documented prerequisite. The spatial results do not answer those questions by themselves.')
p('<b>No site-level capacity, hydraulic connectivity, utility eligibility, delay attribution or readiness score is established.</b>','SmallDV')
story.append(PageBreak());p('Two views of the same application snapshot','TitleDV');p('Vaughan, York Region | NAD83 / UTM zone 17N (EPSG:26917)','SmallDV');story.append(Image(str(plot),width=490,height=269.5));heading('How to read these maps')
p('Left: each record is assigned to one fixed 1 km cell using an interior representative point. Several applications at the same site can contribute several records. Full cells can extend outside the municipal outline.')
p('Right: original application geometry is coloured by its shortest straight-line distance to any included construction line. Overlapping polygons can obscure each other. The construction inventory is partial; operational infrastructure and other projects may be absent.')
p('Both panels use the same projected extent. Axis values are kilometres in UTM coordinates. Grid north is up. No basemap is used. Thresholds are analyst-selected screening distances, not utility design standards.','SmallDV')
heading('Sensitivity to the chosen screening distance')
table([['Cumulative threshold','Records','Share']]+[[f'Within {d:,} m',str(S[f'within_{d}m']),f'{S[f"within_{d}m"]/S["record_count"]*100:.1f}%'] for d in [250,500,1000]],[285,100,105])
p('Changing the threshold changes the review set. Grid alignment, cell size and representative-point method affect cell counts. Neither view establishes a cause of delay.','SmallDV')
story.append(PageBreak());p('Methods, quality &amp; source trail','TitleDV')
heading('Reproducible method')
p('1. Select records whose source MUN_NAME equals Vaughan. Preserve the original GeoJSON application coordinates for display.<br/>2. Transform application and construction geometry from WGS84 to EPSG:26917 for metre-based analysis.<br/>3. Select published construction line features intersecting the Vaughan municipal polygon. Compute the minimum full-geometry distance to each line; retain the nearest source line ID. Ties use the lower OBJECTID.<br/>4. Classify unrounded distances into mutually exclusive 250 m, 500 m and 1,000 m bands.<br/>5. Assign one interior representative point per application to a fixed 1,000 m grid anchored at UTM (0, 0). Sum records per occupied cell.')
heading('Quality checks and limits')
p(f'{len(M["qa"]["geometry_repairs"])} source application geometries required repair for analysis. {len(M["qa"]["representative_points_outside_municipality"])} representative points fell outside Vaughan. All analysis geometries passed validity checks. These checks do not measure positional accuracy.')
if Q:p(f'QGIS {Q["qgis_version"]} independently recalculated all {Q["checked_records"]:,} records: {Q["mismatch_count"]} mismatches in nearest lines, bands and grid assignments. Maximum distance difference from stored rounded values: {Q["max_absolute_difference_m"]:.6f} m. QGIS and Shapely both use GEOS; this checks computation, not positional accuracy.','SmallDV')
p('Source hashes and per-record checks are retained in data/vaughan_analysis_audit.json and data/qgis_validation.json. Numerical precision does not imply millimetre mapping accuracy. UNITS is Yes/No, not a dwelling count; source status is not approval or construction status.','SmallDV')
heading('Official source services')
for label,url in zip(['Development application boundaries','Active water/wastewater construction lines','Municipal boundary'],M['source_urls']):p(f'<b>{label}</b><br/><link href="{escape(url)}" color="#087763">{escape(url)}</link>','SmallDV')
p('Source snapshot retrieval does not establish source currency. This is a dated screening study, not a live servicing assessment.','SmallDV')
heading('Files and rerun')
p('Study: assets/data/vaughan-study.json. Record export: assets/data/vaughan-screening.csv. Run scripts/analyse_vaughan.py against the downloaded source snapshot; run scripts/build_vaughan_brief.py to regenerate this brief. Interactive maps and filtered GeoJSON export are available on the Vaughan study page.','SmallDV')
p('Contains public sector information made available under The Regional Municipality of York\'s Open Data Licence. Independent portfolio research; consult York Region and the relevant municipality/utility for current decisions.','SmallDV')
def footer(canvas,doc):
 canvas.saveState();canvas.setStrokeColor(colors.HexColor('#d6e4dc'));canvas.line(42,39,553,39);canvas.setFont('DV',8);canvas.setFillColor(colors.HexColor('#5c7568'));canvas.drawString(42,26,'GrowthReady Ontario | Jacob Analem | Vaughan spatial screening');canvas.drawRightString(553,26,str(doc.page));canvas.restoreState()
path=OUT/'GrowthReady_Vaughan_Brief.pdf'
SimpleDocTemplate(str(path),pagesize=(595.28,841.89),leftMargin=48,rightMargin=48,topMargin=43,bottomMargin=55,title='GrowthReady Ontario - Vaughan spatial screening',author='Jacob Analem').build(story,onFirstPage=footer,onLaterPages=footer)
print(path)
