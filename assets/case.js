import {filterCaseRecords,caseSummary} from './case-model.js';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bands=['0–250 m','>250–500 m','>500–1,000 m','>1,000 m'];
const colors=['#157d70','#78aebc','#c6a15d','#b6c0c5'];
let data,records=[],selected=null,limit=25,map,applications,grid,highlight,mode='polygons';
const filters=()=>({band:$('case-band').value,type:$('case-type').value,search:$('case-search').value});
function notice(text){$('case-notice').textContent=text;$('case-notice').style.display='block';setTimeout(()=>$('case-notice').style.display='none',4000)}
const byId=new Map(),featureById=new Map();
const gridColor=n=>n>=30?'#0e5d4b':n>=15?'#348d70':n>=5?'#87bba4':'#d9e9df';
function draw(){
 applications.clearLayers();grid.clearLayers();
 const ids=new Set(records.map(r=>r.id));
 if(mode==='polygons')L.geoJSON({type:'FeatureCollection',features:data.applications.features.filter(f=>ids.has(f.properties.id))},{style:f=>({color:colors[bands.indexOf(byId.get(f.properties.id).band)],weight:1.2,fillOpacity:.55}),onEachFeature:(f,layer)=>{const r=byId.get(f.properties.id);layer.bindTooltip(`${esc(r.file)} · ${Math.round(r.distance_m).toLocaleString()} m`);layer.on('click',()=>selectRecord(r.id))}}).addTo(applications);
 else{
 const counts=new Map(caseSummary(records).cells.map(c=>[c.id,c.count]));
 L.geoJSON({type:'FeatureCollection',features:data.grid.features.filter(f=>counts.has(f.properties.id))},{style:f=>({color:'#42695a',weight:.7,fillColor:gridColor(counts.get(f.properties.id)),fillOpacity:.65}),onEachFeature:(f,layer)=>{layer.bindTooltip(`Cell ${esc(f.properties.id)}: ${counts.get(f.properties.id)} matching records`);layer.on('click',()=>locateCell(f.properties.id))}}).addTo(grid);
 }
 $('case-polygons').setAttribute('aria-pressed',String(mode==='polygons'));$('case-grid').setAttribute('aria-pressed',String(mode==='grid'));
 $('case-legend').innerHTML=(mode==='polygons'?bands.map((b,i)=>`<span><i style="background:${colors[i]}"></i>${esc(b)}</span>`).join(''):['1–4','5–14','15–29','30+'].map((b,i)=>`<span><i style="background:${['#d9e9df','#87bba4','#348d70','#0e5d4b'][i]}"></i>${b} records/cell</span>`).join(''))+'<span><i style="background:#3274b5"></i>Published construction lines</span>';
 $('case-map-note').textContent=mode==='polygons'?'Original application boundaries, coloured by minimum distance to the partial construction inventory. Overlapping application records can share a site. Construction lines remain unfiltered.':'Grid counts follow the filters. Each record is assigned once. Full 1 km cells may extend beyond Vaughan; cells are not service areas or risk scores.';
}
function list(){
 $('case-results').innerHTML=records.slice(0,limit).map(r=>`<button class="result" data-record="${r.id}"><strong>${esc(r.address||r.file)}</strong><span>${esc(r.file)} · ${esc(r.type)}</span><span>${Math.round(r.distance_m).toLocaleString()} m to nearest mapped line</span></button>`).join('')||'<p>No matching records.</p>';
 $('case-more').hidden=limit>=records.length;
}
function update(){
 records=filterCaseRecords(data.records,filters());limit=25;const s=caseSummary(records);
 $('case-count').textContent=s.count.toLocaleString();$('case-near').textContent=s.within500.toLocaleString();$('case-cell').textContent=s.cells[0]?.count||0;
 const within1000=records.filter(r=>r.band!=='>1,000 m').length;
 $('case-finding').innerHTML=s.count?`<strong>${within1000.toLocaleString()} of ${s.count.toLocaleString()}</strong> matching records (${(within1000/s.count*100).toFixed(1)}%) have application geometry within 1,000 m of a mapped construction line. The highest-count grid cell contains <strong>${s.cells[0]?.count||0}</strong> matching records. These measures describe spatial context, not demand or readiness.`:'No application records match these filters.';
 $('case-bands').innerHTML=bands.map((b,i)=>{const n=records.filter(r=>r.band===b).length;return `<button class="chart-bar" data-band="${esc(b)}" aria-pressed="${$('case-band').value===b}"><span class="bar-top"><span>${esc(b)}</span><strong>${n.toLocaleString()} records</strong></span><span class="bar-track"><span class="bar-fill" style="width:${s.count?n/s.count*100:0}%;background:${colors[i]}"></span></span></button>`}).join('');
 $('case-cells').innerHTML=s.cells.slice(0,5).map(c=>`<button class="cell-button" data-cell="${c.id}"><span>Grid cell ${c.id}</span><strong>${c.count} records · locate ↗</strong></button>`).join('');
 if(selected&&!records.some(r=>r.id===selected)){selected=null;highlight.clearLayers();$('case-detail').innerHTML='<h2>Selection outside current filters</h2><p>Select another boundary or record to inspect it.</p>'}
 draw();list();
}
function selectRecord(id){
 const r=byId.get(id),f=featureById.get(id);if(!r||!f)return;selected=id;
 highlight.clearLayers();const layer=L.geoJSON(f,{style:{color:'#9a5c0b',weight:3,fillColor:'#e9b753',fillOpacity:.3}}).addTo(highlight);map.fitBounds(layer.getBounds(),{maxZoom:16,padding:[35,35]});
 $('case-detail').innerHTML=`<div class="eyebrow">APPLICATION ${esc(r.file)}</div><h2>${esc(r.address||r.file)}</h2><p>${esc(r.type)} · Source status: ${esc(r.status)}</p><div class="detail-measure"><strong>${Math.round(r.distance_m).toLocaleString()} m</strong><br>Minimum straight-line distance to nearest mapped construction line</div><h3>${esc(r.nearest_line_name)}</h3><p>Construction line OBJECTID ${r.nearest_line_id}. This may be only part of a project. The closest published construction line is not necessarily the infrastructure serving this site.</p><p>Grid cell: ${esc(r.grid_id)}. Distances use full original application geometry, not a display marker.</p><div class="evidence-note">Capacity: unknown.<br>Servicing allocation: not established.<br>Application-to-project dependency: not established.</div><p class="case-links"><a href="https://ww8.yorkmaps.ca/arcgis/rest/services/OpenData/DevelopmentApplicationStatusAndTeams/MapServer/0/query?where=${encodeURIComponent('OBJECTID = '+Number(r.id))}&outFields=*&returnGeometry=true&f=pjson" target="_blank" rel="noopener">Original source record ↗</a></p>`;
}
function locateCell(id){
 const feature=data.grid.features.find(f=>f.properties.id===id);if(!feature)return;
 highlight.clearLayers();const layer=L.geoJSON(feature,{style:{color:'#9a5c0b',weight:3,fillOpacity:.03}}).addTo(highlight);map.fitBounds(layer.getBounds(),{padding:[30,30],maxZoom:15});
 const members=records.filter(r=>r.grid_id===id);
 $('case-detail').innerHTML=`<div class="eyebrow">FIXED 1 KM GRID</div><h2>Cell ${esc(id)}</h2><p>${members.length} matching application records are assigned to this cell by their interior representative point.</p><p>Counts depend on grid size and alignment. They do not count unique sites or quantify infrastructure demand.</p>${members.slice(0,15).map(r=>`<button class="result" data-record="${r.id}"><strong>${esc(r.file)}</strong><span>${esc(r.address||r.type)}</span></button>`).join('')}`;
}
async function init(){
 try{
 const response=await fetch('assets/data/vaughan-study.json');if(!response.ok)throw Error('Study data unavailable');data=await response.json();data.records.forEach(r=>byId.set(r.id,r));data.applications.features.forEach(f=>featureById.set(f.properties.id,f));
 map=L.map('case-map',{preferCanvas:true,zoomSnap:.25});L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(map);
 const boundary=L.geoJSON(data.boundary,{style:{color:'#26473b',weight:2,fillOpacity:0,interactive:false}}).addTo(map);map.fitBounds(boundary.getBounds(),{padding:[25,25]});
 applications=L.layerGroup().addTo(map);grid=L.layerGroup().addTo(map);highlight=L.layerGroup().addTo(map);
 L.geoJSON(data.construction,{style:{color:'#3274b5',weight:4},onEachFeature:(f,l)=>l.bindPopup(`<strong>${esc(f.properties.name||f.properties.PROJECTNAME)}</strong><br>Published construction geometry; not a service-area boundary.`)}).addTo(map);
 [...new Set(data.records.map(r=>r.type))].sort().forEach(type=>{const o=document.createElement('option');o.value=type;o.textContent=type;$('case-type').append(o)});
 $('case-band').onchange=update;$('case-type').onchange=update;let timer;$('case-search').oninput=()=>{clearTimeout(timer);timer=setTimeout(update,180)};
 $('case-reset').onclick=()=>{clearTimeout(timer);$('case-band').value='';$('case-type').value='';$('case-search').value='';highlight.clearLayers();update()};
 $('case-fit').onclick=()=>map.fitBounds(boundary.getBounds(),{padding:[25,25]});
 for(const m of ['polygons','grid'])$('case-'+m).onclick=()=>{mode=m;highlight.clearLayers();draw()};
 $('case-more').onclick=()=>{limit+=25;list()};
 document.addEventListener('click',e=>{const r=e.target.closest('[data-record]');if(r)selectRecord(r.dataset.record);const c=e.target.closest('[data-cell]');if(c)locateCell(c.dataset.cell);const b=e.target.closest('[data-band]');if(b){$('case-band').value=$('case-band').value===b.dataset.band?'':b.dataset.band;update()}});
 $('case-snapshot').textContent='Source snapshot: '+data.metadata.snapshot_retrieved_utc.slice(0,10)+' UTC. Analysis CRS: EPSG:26917. '+data.metadata.qa.geometry_repairs.length+' source geometries repaired for analysis.';
 $('case-geojson').onclick=()=>{const features=records.map(r=>{const {representative_point,...properties}=r;return {...featureById.get(r.id),properties}});const blob=new Blob([JSON.stringify({type:'FeatureCollection',features})],{type:'application/geo+json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='growthready-vaughan-filtered.geojson';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 update();
 }catch(error){$('case-finding').textContent='Unable to load the case study. Please reload or consult the methods in the repository.';console.error(error)}
}
init();
