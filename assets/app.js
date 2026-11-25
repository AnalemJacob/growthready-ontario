import {named,statusConflict,filterRecords,csv} from './model.js';
const $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const value=s=>escape(s||'Not recorded');
const source='https://ww8.yorkmaps.ca/arcgis/rest/services/OpenData/DevelopmentApplicationStatusAndTeams/MapServer/0';
const waterSource='https://www.york.ca/environment/water-and-wastewater/water-and-wastewater-construction-projects';
let rows=[],filtered=[],selected=null,limit=30,map,markers,construction,selection;
const comparison=new Set();
const filters=()=>Object.fromEntries(['search','municipality','type','status','evidence'].map(id=>[id,$(id).value]));
function notify(text){$('notice').textContent=text;$('notice').style.display='block';setTimeout(()=>$('notice').style.display='none',3500)}
function fill(id,field){[...new Set(rows.map(r=>r.properties[field]).filter(Boolean))].sort().forEach(v=>{let option=document.createElement('option');option.value=v;option.textContent=v;$(id).append(option)})}
function list(){
 $('results').innerHTML=filtered.slice(0,limit).map(r=>`<button class="result ${selected===r.id?'active':''}" data-id="${escape(r.id)}"><strong>${value(r.properties.ADDRESS||r.properties.REG_FILE_NUM)}</strong><span>${value(r.properties.MUN_NAME)} · ${value(r.properties.APPL_TYPE)}</span><span>${value(r.properties.REG_FILE_NUM)} · ${value(r.properties.APPL_STATUS)}</span></button>`).join('')||'<p class="empty">No matching records. Try another filter.</p>';
 $('more').hidden=filtered.length<=limit;
}
function update(){
 filtered=filterRecords(rows,filters());limit=30;
 $('count').textContent=filtered.length.toLocaleString();$('result-total').textContent=filtered.length.toLocaleString();
 $('water-count').textContent=filtered.filter(r=>named(r.properties.WSERVAREA)).length.toLocaleString();
 $('conflict-count').textContent=filtered.filter(r=>statusConflict(r.properties)).length.toLocaleString();
 markers.clearLayers();
 filtered.forEach(r=>L.circleMarker([r.lat,r.lng],{radius:4,weight:1,color:'#006456',fillColor:'#0a8d7d',fillOpacity:.55}).on('click',()=>select(r.id)).addTo(markers));
 if(selected&&!filtered.some(r=>r.id===selected)){selected=null;selection.clearLayers();$('details').innerHTML='<div class="eyebrow">APPLICATION EVIDENCE</div><h2>Select a record to investigate</h2><p>The previous selection is outside these filters. Choose another record.</p>'}
 list();
}
function select(id){
 const r=rows.find(r=>r.id===id);if(!r)return;selected=id;const p=r.properties;
 selection.clearLayers();L.circleMarker([r.lat,r.lng],{radius:9,weight:3,color:'#7b521e',fillColor:'#f3b44f',fillOpacity:1}).addTo(selection);
 map.panTo([r.lat,r.lng]);
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
  map=L.map('map',{zoomControl:false,preferCanvas:true}).setView([44.02,-79.47],10);L.control.zoom({position:'topright'}).addTo(map);
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
  let tileError=false;tiles.on('tileerror',()=>{if(!tileError){tileError=true;notify('Basemap unavailable. Application and construction layers remain available.')}});
  markers=L.layerGroup().addTo(map);selection=L.layerGroup().addTo(map);
  construction=L.geoJSON({type:'FeatureCollection',features:data.construction},{style:{color:'#4079b4',weight:4},pointToLayer:(f,ll)=>L.circleMarker(ll,{radius:6,color:'#fff',weight:2,fillColor:'#4079b4',fillOpacity:1}),onEachFeature:(f,layer)=>{const p=f.properties;layer.bindPopup(`<strong>${value(p.PROJECTNAME)}</strong><br>${value(p.LOCATION)}<br>${value(p.PROJECTCATEGORY)} · ${value(p.STATUS)}<br><a href="${waterSource}" target="_blank" rel="noopener">Official construction projects ↗</a><br><small>Location does not establish an application dependency.</small>`)}}).addTo(map);
  fill('municipality','MUN_NAME');fill('type','APPL_TYPE');fill('status','APPL_STATUS');
  for(const id of ['municipality','type','status','evidence'])$(id).onchange=update;
  let timer;$('search').oninput=()=>{clearTimeout(timer);timer=setTimeout(update,180)};
  $('results').onclick=e=>{const button=e.target.closest('[data-id]');if(button)select(button.dataset.id)};
  $('more').onclick=()=>{limit+=30;list()};
  $('reset').onclick=()=>{for(const id of ['search','municipality','type','status','evidence'])$(id).value='';update()};
  $('construction').onchange=e=>e.target.checked?construction.addTo(map):map.removeLayer(construction);
  $('fit').onclick=()=>{if(filtered.length)map.fitBounds(filtered.map(r=>[r.lat,r.lng]),{padding:[35,35],maxZoom:15});else notify('No records match the current filters.')};
  $('download').onclick=()=>{const blob=new Blob(['\ufeff'+csv(filtered)],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='growthready-filtered-applications.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
  update();
 }catch(error){$('snapshot-date').textContent='Data unavailable';$('details').innerHTML='<h2>Unable to load this snapshot</h2><p>Serve this project through a web server and reload. See the repository README for instructions.</p>' ;console.error(error)}
}
init();
