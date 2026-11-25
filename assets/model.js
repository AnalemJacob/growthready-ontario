export const named = value => Boolean(value && String(value).trim() && String(value).trim().toLowerCase() !== 'no');
export const statusConflict = p => Boolean(p.APPL_STATUS && p.Application_Status__c && p.APPL_STATUS !== p.Application_Status__c);
export function filterRecords(rows, filters) {
  const q = (filters.search || '').trim().toLowerCase();
  return rows.filter(({properties:p}) =>
    (!filters.municipality || p.MUN_NAME === filters.municipality) &&
    (!filters.type || p.APPL_TYPE === filters.type) &&
    (!filters.status || p.APPL_STATUS === filters.status) &&
    matchesYear(p.DATE_RECVD, filters.year) &&
    (!filters.evidence || named(p.WSERVAREA) === (filters.evidence === 'named')) &&
    (!q || [p.ADDRESS,p.APPL_NAME,p.REG_FILE_NUM,p.APPL_DESC].some(x => String(x || '').toLowerCase().includes(q))));
}
export function receivedYear(timestamp) {
  if (timestamp === null || timestamp === undefined || timestamp === '') return null;
  const date = new Date(Number(timestamp));
  return Number.isFinite(date.getTime()) ? date.getUTCFullYear() : null;
}
export function matchesYear(timestamp, range) {
  if (!range) return true;
  const year = receivedYear(timestamp);
  if (range === 'undated') return year === null;
  if (year === null) return false;
  const [start, end = start] = range.split(':').map(Number);
  return year >= start && year <= end;
}
export function aggregate(rows, field) {
  const counts = new Map();
  for (const r of rows) {
    const name = r.properties[field] || 'Not recorded';
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count || a.name.localeCompare(b.name));
}
export function receiptBuckets(rows) {
  const buckets = [
    {name:'Before 2010', value:'1:2009'}, {name:'2010–14',value:'2010:2014'},
    ...Array.from({length:12},(_,i)=>({name:String(2015+i),value:String(2015+i)})),
    {name:'2027+', value:'2027:9999'}, {name:'Undated',value:'undated'}
  ];
  return buckets.map(b=>({...b,count:rows.filter(r=>matchesYear(r.properties.DATE_RECVD,b.value)).length}));
}
// Deterministic Web-Mercator grid bins, independent of viewport position.
export function clusterRecords(rows, zoom) {
  const groups = new Map(), scale=256*2**zoom, cell=54;
  for (const r of rows) {
    const sin=Math.sin(Math.max(-85,Math.min(85,r.lat))*Math.PI/180);
    const x=(r.lng+180)/360*scale;
    const y=(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*scale;
    const key=`${Math.floor(x/cell)}:${Math.floor(y/cell)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  // Place count labels at grid-cell centres so adjacent labels cannot collide.
  // Individual application markers still use their original display coordinates.
  return [...groups].map(([key,members])=>{
    const [col,row]=key.split(':').map(Number),x=(col+.5)*cell,y=(row+.5)*cell;
    const lat=Math.atan(Math.sinh(Math.PI*(1-2*y/scale)))*180/Math.PI;
    return {members,lat,lng:x/scale*360-180};
  });
}
export function filterProjects(projects, municipality='', sector='') {
  return projects.filter(p=>(!municipality || p.municipality===municipality) &&
    (!sector || p.sector===sector || (['Water','Wastewater'].includes(sector) && p.sector==='Water & wastewater')))
    .sort((a,b)=>(a.completion_year??Infinity)-(b.completion_year??Infinity)||a.title.localeCompare(b.title));
}
export function projectFeatures(project, features) {
  return features.filter(f=>(project.geometry_refs||[]).some(ref=>
    ref.objectid===f.properties.OBJECTID && ref.geometry_class===(f.geometry.type==='Point'?'point':'line')));
}
export function csv(rows) {
  const fields = ['OBJECTID','REG_FILE_NUM','MUN_NAME','ADDRESS','APPL_TYPE','APPL_STATUS','Application_Status__c','WSERVAREA','WWSERVAREA'];
  const quote = v => '"'+String(v ?? '').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
  return [fields.join(','), ...rows.map(r => fields.map(f => quote(r.properties[f])).join(','))].join('\r\n');
}
