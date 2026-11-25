import {named,statusConflict,filterRecords,csv,aggregate,receivedYear,receiptBuckets,clusterRecords} from './model.js?v=2';
const $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const value=s=>escape(s||'Not recorded');
const source='https://ww8.yorkmaps.ca/arcgis/rest/services/OpenData/DevelopmentApplicationStatusAndTeams/MapServer/0';
const waterSource='https://www.york.ca/environment/water-and-wastewater/water-and-wastewater-construction-projects';
const filterIds=['search','municipality','type','status','evidence','year'];
const yorkNames=new Set(['Aurora','East Gwillimbury','Georgina','King','Markham','Newmarket','Richmond Hill','Vaughan','Whitchurch-Stouffville']);
let rows=[],filtered=[],selected=null,limit=30,map,markers,construction,selection,boundaries,mode='applications';
const comparison=new Set();
const filters=()=>Object.fromEntries(filterIds.map(id=>[id,$(id).value]));
let noticeTimer;
function notify(text){clearTimeout(noticeTimer);$('notice').textContent=text;$('notice').style.display='block';noticeTimer=setTimeout(()=>$('notice').style.display='none',4500)}
function fill(id,field){[...new Set(rows.map(r=>r.properties[field]).filter(Boolean))].sort().forEach(v=>{let option=document.createElement('option');option.value=v;option.textContent=v;$(id).append(option)})}
function list(){
 $('results').innerHTML=filtered.slice(0,limit).map(r=>`<button class="result ${selected===r.id?'active':''}" data-id="${escape(r.id)}"><strong>${value(r.properties.ADDRESS||r.properties.REG_FILE_NUM)}</strong><span>${value(r.properties.MUN_NAME)} · ${value(r.properties.APPL_TYPE)}</span><span>${value(r.properties.REG_FILE_NUM)} · ${value(r.properties.APPL_STATUS)}</span></button>`).join('')||'<p class="empty">No matching records. Try another filter.</p>';
 $('more').hidden=filtered.length<=limit;
}
const colors=['#edf3ee','#c3e3d4','#7cbea3','#368e74','#08634f'];
const countColor=n=>colors[n===0?0:n<250?1:n<500?2:n<1000?3:4];
function boundaryStyle(f){const n=filtered.filter(r=>r.properties.MUN_NAME===f.properties.NAME).length;return {color:'#466f60',weight:1,fillColor:mode==='municipalities'?countColor(n):'#fafcf9',fillOpacity:mode==='municipalities'?.72:.04}}
function drawMap(){
 markers.clearLayers();
 if(boundaries){boundaries.setStyle(boundaryStyle);boundaries.eachLayer(layer=>{const name=layer.feature.properties.NAME;const n=filtered.filter(r=>r.properties.MUN_NAME===name).length;layer.setTooltipContent(`<strong>${escape(name)}</strong><br>${n.toLocaleString()} filtered application records<br><small>Click to filter. Municipal boundary, not service area.</small>`)});}
 if(mode==='applications'){
  const groups=map.getZoom()>=18?filtered.map(r=>({members:[r],lat:r.lat,lng:r.lng})):clusterRecords(filtered,map.getZoom());
  for(const group of groups){
   if(group.members.length===1){const r=group.members[0];L.circleMarker([r.lat,r.lng],{radius:5,weight:1,color:'#006456',fillColor:'#0a8d7d',fillOpacity:.75}).on('click',()=>select(r.id)).bindTooltip(escape(r.properties.REG_FILE_NUM||r.properties.ADDRESS||'Application')).addTo(markers);continue}
   const size=Math.min(48,30+Math.log2(group.members.length)*2);
   const marker=L.marker([group.lat,group.lng],{icon:L.divIcon({className:'cluster-icon',html:`<span class="cluster-bubble">${group.members.length}</span>`,iconSize:[size,size],iconAnchor:[size/2,size/2]}),title:`${group.members.length} application records; zoom to explore`});
   marker.on('click',()=>{
    const bounds=L.latLngBounds(group.members.map(r=>[r.lat,r.lng]));
    if(map.getZoom()>=17 || (bounds.getNorth()-bounds.getSouth()<.00002&&bounds.getEast()-bounds.getWest()<.00002)){
     marker.bindPopup(`<strong>${group.members.length} application records</strong><br>${group.members.slice(0,20).map(r=>`<button class="text-button cluster-record" data-id="${escape(r.id)}">${value(r.properties.REG_FILE_NUM||r.properties.ADDRESS)}</button>`).join('<br>')}${group.members.length>20?'<br>Use the results list for more records.':''}`).openPopup();
    }else map.fitBounds(bounds,{padding:[45,45],maxZoom:map.getZoom()+3});
   });marker.addTo(markers);
  }
 }
 $('mode-applications').setAttribute('aria-pressed',String(mode==='applications'));$('mode-municipalities').setAttribute('aria-pressed',String(mode==='municipalities'));
 $('map-subtitle').textContent=mode==='applications'?'Application clusters · click to explore':'Application records by source municipality';
 $('map-legend').innerHTML=mode==='applications'?'<span><i class="dot teal"></i> Application / cluster</span><span><i class="dot amber"></i> Selected</span><span><i class="dot blue"></i> Construction</span>':`<div class="legend-scale"><span>Records</span>${['0','1–249','250–499','500–999','1,000+'].map((v,i)=>`<span><i class="swatch" style="background:${colors[i]}"></i><small>${v}</small></span>`).join('')}</div>`;
 $('map-caption').textContent=mode==='applications'?'Clusters count records. Individual markers are approximate extent centres. Construction layer is unfiltered.':'Municipal shading shows record totals, not density or capacity. Outside-York records have no shaded municipality. Construction layer is unfiltered.';
}
function barChart(id,data,filter){
 const maximum=Math.max(1,...data.map(x=>x.count));
 $(id).innerHTML=data.map(x=>`<button class="chart-bar" data-filter="${filter}" data-value="${escape(x.name)}" aria-pressed="${$(filter).value===x.name}" aria-label="Filter ${escape(x.name)}: ${x.count} records"><span class="bar-top"><span>${escape(x.name)}</span><strong>${x.count.toLocaleString()}</strong></span><span class="bar-track"><span class="bar-fill" style="width:${x.count/maximum*100}%"></span></span></button>`).join('')||'<p class="empty">No matching records.</p>';
}
function renderAnalytics(){
 const municipalities=aggregate(filtered,'MUN_NAME'),types=aggregate(filtered,'APPL_TYPE'),statuses=aggregate(filtered,'APPL_STATUS');
 barChart('municipality-chart',municipalities,'municipality');barChart('type-chart',types,'type');barChart('status-chart',statuses,'status');
 const n=filtered.length,water=filtered.filter(r=>named(r.properties.WSERVAREA)).length,waste=filtered.filter(r=>named(r.properties.WWSERVAREA)).length;
 $('reference-chart').innerHTML=`<button class="chart-bar" data-filter="evidence" data-value="named" aria-pressed="${$('evidence').value==='named'}"><span class="bar-top"><span>Named water area</span><strong>${water.toLocaleString()} / ${n.toLocaleString()}</strong></span><span class="bar-track"><span class="bar-fill" style="width:${n?water/n*100:0}%"></span></span></button><button class="chart-bar" data-filter="evidence" data-value="missing" aria-pressed="${$('evidence').value==='missing'}"><span class="bar-top"><span>Missing / “No” water reference</span><strong>${(n-water).toLocaleString()}</strong></span><span class="bar-track"><span class="bar-fill" style="width:${n?(n-water)/n*100:0}%;background:#b4c4bc"></span></span></button><p class="micro">Named wastewater references: <strong>${waste.toLocaleString()} / ${n.toLocaleString()}</strong>. Neither measure establishes capacity.</p>`;
 const bins=receiptBuckets(filtered).filter(b=>b.count||$('year').value===b.value);const max=Math.max(1,...bins.map(b=>b.count));
 $('timeline').innerHTML=bins.map(b=>`<button class="year-bar" data-filter="year" data-value="${b.value}" aria-pressed="${$('year').value===b.value}" aria-label="Filter received ${b.name}: ${b.count} records"><strong>${b.count}</strong><span class="column" style="height:${b.count/max*110}px"></span><small>${b.name}</small></button>`).join('')||'<p class="empty">No matching records.</p>';
 if(n){const lead=municipalities[0];$('finding').innerHTML=`<strong>${escape(lead.name)}</strong> accounts for <strong>${lead.count.toLocaleString()}</strong> of the <strong>${n.toLocaleString()}</strong> matching records (${(lead.count/n*100).toFixed(1)}%). <strong>${water.toLocaleString()}</strong> matching records contain a named water service-area reference.`}else $('finding').textContent='No records match these filters. Clear a filter or reset the view.';
}
function update(){
 filtered=filterRecords(rows,filters());limit=30;
 $('count').textContent=filtered.length.toLocaleString();$('result-total').textContent=filtered.length.toLocaleString();
 $('municipality-count').textContent=new Set(filtered.map(r=>r.properties.MUN_NAME).filter(n=>yorkNames.has(n))).size;
 $('water-count').textContent=filtered.filter(r=>named(r.properties.WSERVAREA)).length.toLocaleString();
 const conflicts=filtered.filter(r=>statusConflict(r.properties)).length;
 $('conflict-count').textContent=conflicts.toLocaleString();$('quality-summary').textContent=`${conflicts.toLocaleString()} filtered records with source status disagreements`;
 if(selected&&!filtered.some(r=>r.id===selected)){selected=null;selection.clearLayers();$('details').innerHTML='<div class="eyebrow">APPLICATION EVIDENCE</div><h2>Select a record to investigate</h2><p>The previous selection is outside these filters. Choose another record. Your comparison is retained below.</p>'}
 drawMap();list();renderAnalytics();
}
function select(id){
 const r=rows.find(r=>r.id===id);if(!r)return;selected=id;const p=r.properties;
 selection.clearLayers();L.circleMarker([r.lat,r.lng],{radius:9,weight:3,color:'#7b521e',fillColor:'#f3b44f',fillOpacity:1}).addTo(selection);
 map.panTo([r.lat,r.lng]); if(mode==='municipalities'){mode='applications';drawMap();}
 $('details').innerHTML=`<div class="eyebrow">APPLICATION EVIDENCE · ${value(p.REG_FILE_NUM)}</div><div class="detail-head"><div><h2>${value(p.ADDRESS||p.APPL_NAME)}</h2><span class="badge">${value(p.MUN_NAME)}</span><span class="badge">${value(p.APPL_TYPE)}</span><span class="badge">${value(p.APPL_STATUS)}</span></div><button id="compare-add" class="secondary">${comparison.has(id)?'Remove from comparison':'Compare this record'}</button></div><p>${value(p.APPL_DESC)}</p><div class="detail-meta">Applicant: ${value(p.APPL_NAME)}<br>Received (source date): ${p.DATE_RECVD?escape(new Date(p.DATE_RECVD).toISOString().slice(0,10)):'Not recorded'} · Stage: ${value(p.APPL_STAGE)}</div>${statusConflict(p)?`<p class="warning">Source fields disagree: APPL_STATUS = “${value(p.APPL_STATUS)}”; Application_Status__c = “${value(p.Application_Status__c)}”. Confirm the current status with York Region.</p>`:''}<div class="evidence-grid"><div class="evidence-card"><h3>WATER SERVICE REFERENCE</h3><strong>${named(p.WSERVAREA)?value(p.WSERVAREA):'No named reference'}</strong><p>Recorded service area only. Available capacity and site allocation are unknown.</p></div><div class="evidence-card"><h3>WASTEWATER REFERENCE</h3><strong>${named(p.WWSERVAREA)?value(p.WWSERVAREA):'No named reference'}</strong><p>Sewershed: ${value(p.SEWERSHED)}. Confirm servicing and project dependencies with the Region.</p><a href="${waterSource}" target="_blank" rel="noopener">Regional construction evidence ↗</a></div><div class="evidence-card"><h3>ELECTRICITY CAPACITY</h3><strong>Unknown</strong><p>No verified site-level electricity capacity has been ingested.</p><a href="https://www.oeb.ca/ontarios-energy-sector/centralized-capacity-information-map" target="_blank" rel="noopener">OEB capacity map information ↗</a></div></div><p class="detail-meta">Source OBJECTID ${value(p.OBJECTID)} · Display marker is the application bounding-box centre.<br><a target="_blank" rel="noopener" href="${source}/query?where=${encodeURIComponent('OBJECTID = '+Number(p.OBJECTID))}&outFields=*&returnGeometry=false&f=pjson">View this source record ↗</a></p>`;
 $('compare-add').onclick=()=>{if(comparison.has(id))comparison.delete(id);else if(comparison.size<3)comparison.add(id);else return notify('Compare up to three records. Remove one to add another.');renderComparison();select(id)};
 list();
}
function renderComparison(){
 const records=rows.filter(r=>comparison.has(r.id));$('comparison').hidden=!records.length;
 const fields=[['Municipality','MUN_NAME'],['Application type','APPL_TYPE'],['Source status','APPL_STATUS'],['Alternate source status','Application_Status__c'],['Water service area','WSERVAREA'],['Wastewater service area','WWSERVAREA']];
 $('comparison').innerHTML=`<div class="panel-title"><h2>Compare application evidence</h2><button id="clear-compare" class="text-button">Clear comparison</button></div><p class="detail-meta">Selections stay in this comparison when map filters change.</p><table><thead><tr><th scope="col">Source field</th>${records.map(r=>`<th scope="col">${value(r.properties.REG_FILE_NUM)}</th>`).join('')}</tr></thead><tbody>${fields.map(([label,f])=>`<tr><th scope="row">${label}</th>${records.map(r=>`<td>${value(r.properties[f])}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">Confirmed site capacity</th>${records.map(()=>'<td>Unknown</td>').join('')}</tr></tbody></table>`;
 if(records.length)$('clear-compare').onclick=()=>{comparison.clear();renderComparison();if(selected)select(selected)};
}
async function init(){
 try{
  if(!window.L)throw Error('The local map library did not load.');
  const response=await fetch('assets/data/snapshot.json');if(!response.ok)throw Error('Snapshot could not be loaded.');
  const data=await response.json();rows=data.applications;
  $('snapshot-date').textContent=new Date(data.retrieved).toLocaleDateString('en-CA',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'})+' · '+rows.length.toLocaleString()+' records';
  map=L.map('map',{zoomControl:false,preferCanvas:true}).setView([44.035,-79.46],9);L.control.zoom({position:'topright'}).addTo(map);
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
  let tileError=false;tiles.on('tileerror',()=>{if(!tileError){tileError=true;notify('Basemap unavailable. Application and construction layers remain available.')}});
  map.createPane('municipalities');map.getPane('municipalities').style.zIndex=350;
  markers=L.layerGroup().addTo(map);selection=L.layerGroup().addTo(map);
  construction=L.geoJSON({type:'FeatureCollection',features:data.construction},{style:{color:'#4079b4',weight:4},pointToLayer:(f,ll)=>L.circleMarker(ll,{radius:6,color:'#fff',weight:2,fillColor:'#4079b4',fillOpacity:1}),onEachFeature:(f,layer)=>{const p=f.properties;layer.bindPopup(`<strong>${value(p.PROJECTNAME)}</strong><br>${value(p.LOCATION)}<br>${value(p.PROJECTCATEGORY)} · ${value(p.STATUS)}<br><a href="${waterSource}" target="_blank" rel="noopener">Official construction projects ↗</a><br><small>Location does not establish an application dependency. This layer is not filtered.</small>`)}}).addTo(map);
  try{
   const boundaryResponse=await fetch('assets/data/municipalities.geojson');if(!boundaryResponse.ok)throw Error('Boundary request failed');const geojson=await boundaryResponse.json();
   boundaries=L.geoJSON(geojson,{pane:'municipalities',style:boundaryStyle,onEachFeature:(f,layer)=>{layer.bindTooltip(escape(f.properties.NAME));layer.on('click',()=>{$('municipality').value=f.properties.NAME;update()})}}).addTo(map);map.fitBounds(boundaries.getBounds(),{padding:[20,20]});
  }catch(error){$('mode-municipalities').disabled=true;notify('Municipality boundaries unavailable. Application analytics remain available.');console.warn(error.message)}
  fill('municipality','MUN_NAME');fill('type','APPL_TYPE');fill('status','APPL_STATUS');
  [...new Set(rows.map(r=>receivedYear(r.properties.DATE_RECVD)).filter(y=>y!==null))].sort((a,b)=>b-a).forEach(y=>{const option=document.createElement('option');option.value=String(y);option.textContent=String(y);$('year').append(option)});
  for(const [v,label] of [['2027:9999','2027 onward'],['undated','Undated']]){const option=document.createElement('option');option.value=v;option.textContent=label;$('year').append(option)}
  for(const id of filterIds.filter(id=>id!=='search'))$(id).onchange=update;
  let timer;$('search').oninput=()=>{clearTimeout(timer);timer=setTimeout(update,180)};
  $('toggle-filters').onclick=()=>{const open=document.querySelector('main').classList.toggle('filters-open');$('toggle-filters').setAttribute('aria-expanded',String(open));$('toggle-filters').textContent=open?'Hide filters, search & records':'Show filters, search & records';setTimeout(()=>map.invalidateSize(),0)};
  $('results').onclick=e=>{const button=e.target.closest('[data-id]');if(button)select(button.dataset.id)};
  document.addEventListener('click',e=>{
   const bar=e.target.closest('[data-filter]');if(bar){const id=bar.dataset.filter;$(id).value=$(id).value===bar.dataset.value?'':bar.dataset.value;update()}
   const clear=e.target.closest('[data-clear]');if(clear){$(clear.dataset.clear).value='';update()}
   const record=e.target.closest('.cluster-record');if(record){map.closePopup();select(record.dataset.id)}
  });
  $('more').onclick=()=>{limit+=30;list()};
  $('reset').onclick=()=>{clearTimeout(timer);for(const id of filterIds)$(id).value='';update()};
  $('construction').onchange=e=>e.target.checked?construction.addTo(map):map.removeLayer(construction);
  $('fit').onclick=()=>{if(filtered.length)map.fitBounds(filtered.map(r=>[r.lat,r.lng]),{padding:[35,35],maxZoom:15});else notify('No records match the current filters.')};
  for(const display of ['applications','municipalities'])$('mode-'+display).onclick=()=>{mode=display;drawMap()};
  map.on('zoomend',drawMap);
  $('download').onclick=()=>{const blob=new Blob(['\ufeff'+csv(filtered)],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='growthready-filtered-applications.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
  update();
 }catch(error){$('snapshot-date').textContent='Data unavailable';$('details').innerHTML='<h2>Unable to load this snapshot</h2><p>Serve this project through a web server and reload. See the repository README for instructions.</p>';console.error(error)}
}
init();
