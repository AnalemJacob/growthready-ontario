import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {named,statusConflict,filterRecords,csv} from '../assets/model.js';
const {applications:rows}=JSON.parse(readFileSync(new URL('../assets/data/snapshot.json',import.meta.url)));
const audit=JSON.parse(readFileSync(new URL('../data/data_audit.json',import.meta.url)));
test('audited snapshot retains all source records and valid marker coordinates',()=>{
 assert.equal(rows.length,audit.feature_count);assert.equal(new Set(rows.map(r=>r.id)).size,audit.distinct_business_keys);
 assert.ok(rows.every(r=>r.lat>=-90&&r.lat<=90&&r.lng>=-180&&r.lng<=180));
 assert.equal(rows.filter(r=>statusConflict(r.properties)).length,audit.status_field_disagreements);
});
test('missing service references include blank and No; named references do not imply capacity',()=>{
 assert.equal(named('No'),false);assert.equal(named(null),false);assert.equal(named('  '),false);assert.equal(named('York Water System'),true);
 const yes=filterRecords(rows,{evidence:'named'}),no=filterRecords(rows,{evidence:'missing'});
 assert.equal(yes.length+no.length,rows.length);assert.ok(yes.every(r=>named(r.properties.WSERVAREA)));
});
test('municipality, source status, type and search combine without broadening results',()=>{
 const r=rows.find(r=>r.properties.REG_FILE_NUM&&r.properties.MUN_NAME);const p=r.properties;
 const result=filterRecords(rows,{municipality:p.MUN_NAME,status:p.APPL_STATUS,type:p.APPL_TYPE,search:p.REG_FILE_NUM});
 assert.ok(result.some(x=>x.id===r.id));assert.ok(result.every(x=>x.properties.MUN_NAME===p.MUN_NAME&&x.properties.APPL_STATUS===p.APPL_STATUS&&x.properties.APPL_TYPE===p.APPL_TYPE));
 assert.equal(filterRecords(rows,{search:'no-such-file-987654321'}).length,0);
});
test('CSV quotes values and neutralizes spreadsheet formulas',()=>{
 const result=csv([{properties:{OBJECTID:1,ADDRESS:'=1+1',REG_FILE_NUM:'a,"b'}}]);
 assert.ok(result.includes('"\'=1+1"'));assert.ok(result.includes('"a,""b"'));assert.equal(result.split('\r\n').length,2);
});

import {aggregate,receivedYear,matchesYear,receiptBuckets,clusterRecords} from '../assets/model.js';
test('aggregates preserve record totals and handle absent category values',()=>{
 for(const field of ['MUN_NAME','APPL_TYPE','APPL_STATUS']){
  const groups=aggregate(rows,field);assert.equal(groups.reduce((sum,g)=>sum+g.count,0),rows.length);
 }
 assert.deepEqual(aggregate([{properties:{}},{properties:{MUN_NAME:'Aurora'}}],'MUN_NAME'),[{name:'Aurora',count:1},{name:'Not recorded',count:1}]);
});
test('received-date filters use UTC and explicit ranges, with undated records separate',()=>{
 assert.equal(receivedYear(null),null);assert.equal(receivedYear('bad'),null);
 const t=Date.UTC(2020,11,31,23,59,59);assert.equal(receivedYear(t),2020);
 assert.equal(matchesYear(t,'2020'),true);assert.equal(matchesYear(t,'2015:2020'),true);assert.equal(matchesYear(t,'2021'),false);
 assert.equal(matchesYear(null,'2020'),false);assert.equal(matchesYear(null,'undated'),true);
 assert.equal(receiptBuckets(rows).reduce((n,b)=>n+b.count,0),rows.length);
 const recent=filterRecords(rows,{year:'2026'});assert.equal(recent.length,302);assert.ok(recent.every(r=>receivedYear(r.properties.DATE_RECVD)===2026));
});
test('map clustering represents every filtered record once at different zoom levels',()=>{
 for(const zoom of [9,12,17]){
  const clusters=clusterRecords(rows,zoom),members=clusters.flatMap(g=>g.members);
  assert.equal(members.length,rows.length);assert.equal(new Set(members.map(r=>r.id)).size,rows.length);
  assert.ok(clusters.every(g=>Number.isFinite(g.lat)&&Number.isFinite(g.lng)));
 }
 assert.deepEqual(clusterRecords([],10),[]);
});
test('municipal display boundaries match their audit and include nine named municipalities',()=>{
 const data=JSON.parse(readFileSync(new URL('../assets/data/municipalities.geojson',import.meta.url)));
 const audit=JSON.parse(readFileSync(new URL('../data/boundary_display_audit.json',import.meta.url)));
 assert.equal(data.features.length,audit.feature_count);assert.equal(new Set(data.features.map(f=>f.properties.NAME)).size,9);
 assert.ok(audit.features.every(f=>f.source_valid&&f.display_valid&&f.relative_area_change<=0.005));
 assert.ok(data.features.every(f=>['Polygon','MultiPolygon'].includes(f.geometry.type)));
});
