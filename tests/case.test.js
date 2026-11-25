import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {filterCaseRecords,caseSummary} from '../assets/case-model.js';
const path=new URL('../assets/data/vaughan-study.json',import.meta.url);
const raw=readFileSync(path),d=JSON.parse(raw),audit=JSON.parse(readFileSync(new URL('../data/vaughan_analysis_audit.json',import.meta.url)));
test('Vaughan output agrees with its audit and source-record selection',()=>{
 assert.equal(createHash('sha256').update(raw).digest('hex'),audit.display_sha256);
 const source=JSON.parse(readFileSync(new URL('../assets/data/snapshot.json',import.meta.url)));
 const ids=source.applications.filter(r=>r.properties.MUN_NAME==='Vaughan').map(r=>r.id).sort();
 assert.deepEqual(d.records.map(r=>r.id).sort(),ids);assert.equal(d.records.length,1382);
 assert.deepEqual(d.applications.features.map(f=>f.properties.id).sort(),ids);
 assert.equal(d.metadata.analysis_crs,'EPSG:26917');assert.equal(d.metadata.qa.geometry_repairs.length,0);
 assert.equal(d.metadata.qa.representative_points_outside_municipality.length,0);
});
test('distance bands partition records and link to actual construction lines',()=>{
 const lineIds=new Set(d.construction.features.map(f=>Number(f.properties.OBJECTID??f.properties.id)));
 assert.equal(lineIds.size,5);
 const bands=d.summary.distance_bands;assert.equal(bands.reduce((s,b)=>s+b.count,0),d.records.length);
 for(const r of d.records){assert.ok(r.distance_m>=0&&Number.isFinite(r.distance_m));assert.ok(lineIds.has(r.nearest_line_id));assert.ok(bands.some(b=>b.label===r.band));}
 assert.deepEqual(bands.map(b=>b.count),[191,39,93,1059]);
 assert.equal(d.summary.within_1000m,323);assert.ok(d.summary.within_250m<=d.summary.within_500m&&d.summary.within_500m<=d.summary.within_1000m);
});
test('one grid assignment per application preserves counts without polygon overlap double counting',()=>{
 const assigned=new Map();for(const r of d.records)assigned.set(r.grid_id,(assigned.get(r.grid_id)||0)+1);
 assert.equal(assigned.size,227);assert.equal(d.grid.features.reduce((s,f)=>s+f.properties.count,0),1382);
 for(const f of d.grid.features)assert.equal(f.properties.count,assigned.get(f.properties.id));
 assert.equal(Math.max(...assigned.values()),43);
});
test('case-study filters combine type, distance band and case-insensitive address/file search',()=>{
 const r=d.records[0];const filtered=filterCaseRecords(d.records,{band:r.band,type:r.type,search:r.file.toLowerCase()});
 assert.ok(filtered.some(v=>v.id===r.id));assert.ok(filtered.every(v=>v.type===r.type&&v.band===r.band));
 assert.equal(filterCaseRecords(d.records,{search:'impossible-record-88776655'}).length,0);
 const near=filterCaseRecords(d.records,{band:'0–250 m'}),s=caseSummary(near);assert.equal(s.count,191);assert.equal(s.within500,191);
 assert.equal(caseSummary([]).count,0);assert.equal(caseSummary([]).within500,0);assert.deepEqual(caseSummary([]).cells,[]);
});

 test('QGIS cross-check remains tied to the exact study and reconciles every record',()=>{
 const q=JSON.parse(readFileSync(new URL('../data/qgis_validation.json',import.meta.url)));
 assert.equal(q.study_sha256,createHash('sha256').update(raw).digest('hex'));
 assert.equal(q.mismatch_count,0);assert.equal(q.checked_records,d.records.length);
 assert.equal(q.grid_assignments_match,d.records.length);assert.equal(q.representative_points_covered_by_application_and_city,d.records.length);
 assert.ok(q.max_absolute_difference_m<=q.distance_comparison_tolerance_m);
 const checks=new Map(q.record_checks.map(r=>[r.id,r]));assert.equal(checks.size,d.records.length);
 for(const r of d.records){const c=checks.get(r.id);assert.ok(c);assert.equal(c.nearest_line_id,r.nearest_line_id);assert.equal(c.band,r.band);assert.equal(c.grid_id,r.grid_id);assert.ok(Math.abs(c.qgis_distance_m-r.distance_m)<=0.001)}
 });
