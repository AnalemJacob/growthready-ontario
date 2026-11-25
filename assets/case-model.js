export function filterCaseRecords(records,{band='',type='',search=''}={}) {
 const q=search.trim().toLowerCase();
 return records.filter(r=>(!band||r.band===band)&&(!type||r.type===type)&&(!q||[r.address,r.file,r.id].some(v=>String(v||'').toLowerCase().includes(q))));
}
export function caseSummary(records){
 const cells=new Map();for(const r of records)cells.set(r.grid_id,(cells.get(r.grid_id)||0)+1);
 return {count:records.length,within500:records.filter(r=>['0–250 m','>250–500 m'].includes(r.band)).length,
  cells:[...cells].map(([id,count])=>({id,count})).sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id)),
  bands:['0–250 m','>250–500 m','>500–1,000 m','>1,000 m'].map(band=>({band,count:records.filter(r=>r.band===band).length}))};
}
