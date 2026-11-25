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
