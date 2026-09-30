/* ---------- Locations: the sites a company works from ---------- */
IC_.pin='<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>';
var COUNTRIES={
  'India':{states:['Maharashtra','Karnataka','Delhi','Tamil Nadu','Telangana','Gujarat'],tz:'Asia/Kolkata',postal:['PIN code',/^\d{6}$/,'400001']},
  'United States':{states:['California','New York','Texas','Florida','Illinois','Washington'],tz:{'California':'America/Los_Angeles','New York':'America/New_York','Texas':'America/Chicago','Florida':'America/New_York','Illinois':'America/Chicago','Washington':'America/Los_Angeles'},postal:['ZIP code',/^\d{5}(-\d{4})?$/,'94105']},
  'United Kingdom':{states:['Greater London','Greater Manchester','West Midlands','Scotland','Wales'],tz:'Europe/London',postal:['Postcode',/^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/,'EC2A 4NE']},
  'Canada':{states:['Ontario','Quebec','British Columbia','Alberta'],tz:{'Ontario':'America/Toronto','Quebec':'America/Toronto','British Columbia':'America/Vancouver','Alberta':'America/Edmonton'},postal:['Postal code',/^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/,'M5V 2T6']},
  'United Arab Emirates':{states:['Dubai','Abu Dhabi','Sharjah'],tz:'Asia/Dubai',postal:['PO box',/^\d{0,6}$/,'optional']},
  'Singapore':{states:['Singapore'],tz:'Asia/Singapore',postal:['Postal code',/^\d{6}$/,'018956']}
};
var TZ_ALL=['Asia/Kolkata','Asia/Dubai','Asia/Singapore','Europe/London','America/New_York','America/Chicago','America/Los_Angeles','America/Toronto','America/Vancouver','America/Edmonton'];
function tzFor(country,state){var c=COUNTRIES[country];if(!c)return '';return typeof c.tz==='string'?c.tz:(c.tz[state]||c.tz[Object.keys(c.tz)[0]])}
function tzNow(tz){try{return new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:tz}).format(new Date())}catch(e){return ''}}
var locations=[
  {id:'l1',name:'MCM',street:'Jogeshwari',city:'Mumbai',state:'Maharashtra',country:'India',postal:'400001',tz:'Asia/Kolkata',cid:'',def:true},
  {id:'l2',name:'London Branch',street:'22 Bishopsgate',city:'London',state:'Greater London',country:'United Kingdom',postal:'EC2A 4NE',tz:'Europe/London',cid:'',def:false}
];
function locById(id){for(var i=0;i<locations.length;i++)if(locations[i].id===id)return locations[i];return null}
function locByName(n){for(var i=0;i<locations.length;i++)if(locations[i].name===n)return locations[i];return null}
function defLoc(){return locations.filter(function(l){return l.def})[0]||locations[0]}
function locCity(l){return l.city+', '+l.country}
function locPeople(l){return rows().filter(function(r){return r.dataset.removed!=='1'&&r.dataset.loc===l.name})}
function locGroups(l){return groups.filter(function(g){return g.loc===l.name})}
function movePerson(r,l){r.dataset.loc=l.name;r.dataset.city=locCity(l);renderRow(r)}
var locOptTpl=$('[data-menu="location"] [data-opt]').cloneNode(true);
function syncLocOptions(){
  var names=locations.map(function(l){return l.name}), menu=$('[data-menu="location"]'); menu.innerHTML='';
  ['All'].concat(names).forEach(function(n){var o=locOptTpl.cloneNode(true);o.setAttribute('data-opt',n);o.lastElementChild.textContent=n;menu.appendChild(o)});
  if(filters.location!=='All'&&names.indexOf(filters.location)<0)filters.location='All'; updateChip('location');
  [$('#gLoc'),$('#wLoc')].forEach(function(g){if(!g)return;var cur=g.value; g.innerHTML=names.map(function(n){return '<option>'+esc(n)+'</option>'}).join(''); g.value=names.indexOf(cur)>-1?cur:defLoc().name});
  var cm=$('[data-menu="lcountry"]'), cs=[]; locations.forEach(function(l){if(cs.indexOf(l.country)<0)cs.push(l.country)}); cm.innerHTML='';
  ['All'].concat(cs).forEach(function(n){var o=locOptTpl.cloneNode(true);o.setAttribute('data-opt',n);o.lastElementChild.textContent=n;cm.appendChild(o)});
  if(lFilters.country!=='All'&&cs.indexOf(lFilters.country)<0){lFilters.country='All';updateGChip('lcountry','All')}
}
/* ----- list ----- */
var lq='', lFilters={country:'All'}, lTpl=$('#lRowTpl');
function renderLocs(){
  var q=lq.trim().toLowerCase(), body=$('#lbody'), list=locations.filter(function(l){return (lFilters.country==='All'||l.country===lFilters.country)&&(!q||[l.name,l.street,l.city,l.state,l.country,l.postal,l.tz].join(' ').toLowerCase().indexOf(q)>-1)});
  $$('tr[data-lrow]',body).forEach(function(t){t.remove()});
  list.forEach(function(l){
    var tr=lTpl.cloneNode(true), ppl=locPeople(l), n=ppl.length; tr.removeAttribute('id'); tr.setAttribute('data-lrow',l.id);
    $('[data-lname]',tr).innerHTML=esc(l.name)+(l.def?'<span data-tip="New people and groups start here" style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:#1d4ed8;background:#dbeafe;border-radius:6px;padding:2px 7px">DEFAULT</span>':'');
    $('[data-lpostal]',tr).textContent=l.postal||'—'; $('[data-lstreet]',tr).textContent=l.street; $('[data-lcity]',tr).textContent=l.city+', '+l.state; $('[data-lcountry]',tr).textContent=l.country;
    $('[data-ltz]',tr).innerHTML=esc(l.tz)+'<span style="display:block;font-size:12px;color:#64748b">'+tzNow(l.tz)+' local</span>';
    var pc=$('[data-lpeople]',tr), st=ppl.slice(0,3).map(function(r,i){return '<span title="'+esc(r.dataset.name)+'" style="display:inline-flex;position:relative;z-index:'+(4-i)+';margin-left:'+(i?'-2px':'0')+'">'+avP(r,30)+'</span>'}).join('')+(n>3?'<span style="display:inline-grid;place-items:center;position:relative;margin-left:-2px;width:30px;height:30px;border-radius:50%;font-size:11.5px;font-weight:700;background:#e2e8f0;color:#334155;box-shadow:0 0 0 2px var(--gap,#fff),0 0 0 4px #cbd5e1">+'+(n-3)+'</span>':'');
    pc.style.flexDirection='row'; pc.style.alignItems='center'; pc.style.position='relative'; pc.setAttribute('aria-label',n+(n===1?' person':' people'));
    pc.innerHTML=(n?'<span style="display:inline-flex;align-items:center">'+st+'</span>':'<span style="font-size:13px;color:#94a3b8">No one yet</span>')+'<span data-lcnt style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">'+n+'</span>';
    $('[data-lacts]',tr).innerHTML=can('locations')?rBtn('data-lact="edit"','Edit location','pencil','blue')+(l.def?'':rBtn('data-lact="def"','Make this the default location','star'))+(l.def?'<span data-tip="The default location cannot be deleted" style="width:32px;height:32px;display:inline-grid;place-items:center;color:#cbd5e1">'+ico2('trash','currentColor',16)+'</span>':rBtn('data-lact="del"','Delete location','trash','red')):rBtn('data-lact="view"','View location','eye','blue');
    body.insertBefore(tr,$('#lEmpty'));
  });
  $('#lEmpty').style.display=list.length?'none':''; $('#lsClear').style.display=lq?'':'none';
  $('#lCount').textContent=list.length+' of '+locations.length; $('#lPgText').textContent=list.length?'1–'+list.length+' of '+list.length+(list.length===1?' location':' locations'):'0 locations';
  $('#lClearAll').style.display=(lq||lFilters.country!=='All')?'':'none';
}
$('#lbody').addEventListener('click',function(e){
  var tr=e.target.closest('tr[data-lrow]'); if(!tr)return; var l=locById(tr.getAttribute('data-lrow')); if(!l)return; var a=e.target.closest('[data-lact]');
  if(a){var k=a.getAttribute('data-lact');if(k==='view')openLocDialog('view',l);else if(!can('locations'))return;else if(k==='edit')openLocDialog('edit',l);else if(k==='def')setDefLoc(l);else if(k==='del')confirmDeleteLoc(l);return}
  if((a=e.target.closest('[data-lpeople]'))){openLocPeople(a,l);return}
  if(e.target.closest('[data-lopen]'))openLocDialog(can('locations')?'edit':'view',l);
});
$('#lsearch').addEventListener('input',function(e){lq=e.target.value;renderLocs()});
$('#lsClear').addEventListener('click',function(){lq='';$('#lsearch').value='';renderLocs();$('#lsearch').focus()});
$('#lClearAll').addEventListener('click',function(){lq='';$('#lsearch').value='';lFilters.country='All';updateGChip('lcountry','All');renderLocs()});
$('#lEmptyClear').addEventListener('click',function(){$('#lClearAll').click()});
$('#btnNewLoc').addEventListener('click',function(){openLocDialog('new')});
$('#lRefresh').addEventListener('click',function(){var i=$('#lRefresh svg');i.style.transition='transform .6s';i.style.transform='rotate(360deg)';setTimeout(function(){i.style.transition='none';i.style.transform='none';renderLocs()},600)});
setInterval(function(){if($('#viewLocs').style.display!=='none')$$('#lbody [data-ltz]').forEach(function(c){var tr=c.closest('tr'),l=locById(tr.getAttribute('data-lrow'));if(l)c.lastElementChild.textContent=tzNow(l.tz)+' local'})},30000);
function setDefLoc(l){locations.forEach(function(x){x.def=x===l});syncLocOptions();renderLocs();toast(l.name+' is now the default location')}
/* ----- people popover (same pattern as Roles) ----- */
var LPX=null;
function openLocPeople(btn,l){
  LPX=l; var m=$('[data-menu="lpeople"]'), hs=locPeople(l).sort(function(a,b){return a.dataset.name.localeCompare(b.dataset.name)}), n=hs.length;
  var LNKB='display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;padding:9px 10px;border-radius:8px;border:0;background:none;text-align:left;cursor:pointer;font:inherit;font-size:13px;font-weight:600;color:#2563eb;';
  m.innerHTML='<div style="'+M_HEAD+'">'+esc(l.name)+' · '+n+(n===1?' person':' people')+'</div>'
    +(n?hs.map(function(r){var d=r.dataset;return '<button data-lpp="'+d.id+'" data-h="background:#f1f5f9;" style="'+M_OPT+'padding:7px 10px;color:#1e293b">'+avP(r,30)+'<span style="flex:1;min-width:0"><span style="display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(d.name)+'</span><span style="display:block;font-size:12px;color:#64748b">Ext '+esc(d.num||'—')+' · '+esc(d.role)+'</span></span>'+ico2('chevr','#94a3b8',14)+'</button>'}).join(''):'<div style="padding:10px 10px 12px;font-size:13px;color:#64748b">No one works here yet. Move people from their profile page.</div>')
    +(n?M_SEP+'<button data-lpshow data-h="background:#eff6ff;" style="'+LNKB+'">'+ico2('users','#2563eb',15)+'Show all in the People list</button>':'');
  openMenu(btn,m,false);
}
$('[data-menu="lpeople"]').addEventListener('click',function(e){e.stopPropagation();var l=LPX,t;
  if((t=e.target.closest('[data-lpp]'))){var r=personById(t.getAttribute('data-lpp'));closeMenu();if(r){backTo={label:'Locations',view:'locations'};keepBack=true;openPerson(r);keepBack=false}return}
  if(e.target.closest('[data-lpshow]')){closeMenu();filters.location=l.name;updateChip('location');goWithBack('people','Locations','locations')}});
/* ----- dialog: 1 Details → 2 Review ----- */
var LD=null;
var L_IN='height:44px;border:1px solid #cbd5e1;border-radius:11px;padding:0 12px;font:inherit;font-size:15px;outline:0;background:#fff;color:#0f172a;width:100%;box-sizing:border-box;transition:border-color .12s,box-shadow .12s;';
function lLbl(t){return '<div style="font-size:13px;font-weight:600;color:#334155;margin:0 0 6px">'+t+'</div>'}
function lErr(k){return LD.err[k]?'<div data-lerr="'+k+'" style="color:#dc2626;font-size:12.5px;margin-top:5px">'+esc(LD.err[k])+'</div>':''}
function lIn(k,ph,extra){return '<input id="lf_'+k+'" value="'+esc(LD.d[k]||'')+'" placeholder="'+esc(ph||'')+'" autocomplete="off" data-fo="border-color:#3b82f6;box-shadow:0 0 0 3px #dbeafe;" style="'+L_IN+(LD.err[k]?'border-color:#ef4444;':'')+(extra||'')+'">'}
function lSel(k,opts,ph){return '<select id="lf_'+k+'" data-fo="border-color:#3b82f6;box-shadow:0 0 0 3px #dbeafe;" style="'+L_IN+(LD.err[k]?'border-color:#ef4444;':'')+'">'+(ph?'<option value="">'+esc(ph)+'</option>':'')+opts.map(function(o){return '<option'+(o===LD.d[k]?' selected':'')+'>'+esc(o)+'</option>'}).join('')+'</select>'}
function lPostal(){var c=COUNTRIES[LD.d.country];return c?c.postal:['Postal code',/^.{2,10}$/,'']}
function lStep1(){
  var c=COUNTRIES[LD.d.country], states=c?c.states:[], pl=lPostal(), cids=['Company main number'].concat(CID_POOL.map(fmtNum));
  return '<div style="padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;margin-bottom:14px">'+lLbl('Location name')+lIn('name','Mumbai Office, London Branch…')+lErr('name')+'<div style="font-size:12.5px;color:#64748b;margin-top:6px">The name of this place — not your company name.</div></div>'
    +'<div style="padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;margin-bottom:14px"><div style="font-size:14.5px;font-weight:700;color:#0f172a;margin-bottom:12px">Address</div>'
    +lLbl('Street address')+'<textarea id="lf_street" placeholder="Building, street, area" data-fo="border-color:#3b82f6;box-shadow:0 0 0 3px #dbeafe;" style="'+L_IN+'height:70px;padding:10px 12px;resize:vertical;line-height:1.45;'+(LD.err.street?'border-color:#ef4444;':'')+'">'+esc(LD.d.street||'')+'</textarea>'+lErr('street')
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;margin-top:12px"><div>'+lLbl('Country')+lSel('country',Object.keys(COUNTRIES),'Select country')+lErr('country')+'</div><div>'+lLbl('State / region')+lSel('state',states,states.length?'Select state':'Pick a country first')+lErr('state')+'</div>'
    +'<div>'+lLbl('City')+lIn('city','City')+lErr('city')+'</div><div>'+lLbl(pl[0])+lIn('postal',pl[2]==='optional'?'Optional':pl[2])+lErr('postal')+'</div></div></div>'
    +'<div style="padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#fff"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 16px"><div>'+lLbl('Timezone')+lSel('tz',TZ_ALL,'Select timezone')+lErr('tz')+'<div id="lTzHint" style="font-size:12.5px;color:#64748b;margin-top:6px">'+(LD.tzAuto?'Set from the country — change it if this site keeps different hours.':'')+'</div></div>'
    +'<div>'+lLbl('Outbound caller ID')+lSel('cid',cids)+'<div style="font-size:12.5px;color:#64748b;margin-top:6px">Recorded for this location. Calls still use each person’s own caller ID for now.</div></div></div></div>';
}
function lStep2(){
  var d=LD.d, n=LD.id?locPeople(locById(LD.id)).length:0, isDef=LD.id&&locById(LD.id).def;
  function row(l,v){return '<div style="display:flex;gap:16px;padding:9px 0;border-top:1px solid #f1f5f9;font-size:13.5px"><span style="width:150px;flex-shrink:0;color:#64748b">'+l+'</span><span style="color:#0f172a;font-weight:500">'+v+'</span></div>'}
  return '<div style="padding:4px 16px 8px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;margin-bottom:14px"><div style="display:flex;align-items:center;gap:10px;padding:10px 0 6px"><span style="font-size:16px;font-weight:700;color:#0f172a">'+esc(d.name)+'</span>'+(LD.mode!=='view'?'<button data-lgo="1" data-h="background:#eff6ff;" style="margin-left:auto;'+LNK+'">Edit details</button>':'')+'</div>'
    +row('Address',esc(d.street)+'<br>'+esc(d.city)+', '+esc(d.state)+' '+esc(d.postal)+'<br>'+esc(d.country))+row('Timezone',esc(d.tz)+' <span style="color:#64748b">· '+tzNow(d.tz)+' local now</span>')+row('Outbound caller ID',esc(d.cid||'Company main number'))+(LD.id?row('People here',n+(n===1?' person':' people')):'')+'</div>'
    +(LD.mode==='view'?'':'<label style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;cursor:'+(isDef?'default':'pointer')+'"><input type="checkbox" id="lf_def"'+((d.def||isDef)?' checked':'')+(isDef?' disabled':'')+' style="accent-color:#2563eb;width:17px;height:17px;margin:2px 0 0;cursor:inherit"><span><span style="display:block;font-weight:600;color:#0f172a;font-size:14px">Default location</span><span style="display:block;font-size:12.5px;color:#64748b;margin-top:2px">'+(isDef?'This is the default. New people and groups start here; pick another location to change it.':'New people and groups will start here.')+'</span></span></label>');
}
function lPaint(){
  var v=LD.mode==='view';
  $('#lT').textContent=LD.mode==='new'?'New location':LD.mode==='edit'?'Edit location':LD.d.name;
  $('#lSub').textContent=v?'Where this site is and who works there.':'An office or site your company works from — its address, its timezone and the people who work there.';
  $('#lB').innerHTML=LD.step===1?lStep1():lStep2(); $('#lB').scrollTop=0;
  $('#lStepT').textContent=v?'':'Step '+LD.step+' of 2 · '+(LD.step===1?'Details':'Review');
  $('#lBack').style.display=(!v&&LD.step===2)?'inline-flex':'none';
  $('#lYes').style.display=v?'none':'inline-flex'; $('#lYes').textContent=LD.step===1?'Save & Continue':(LD.mode==='edit'?'Save changes':'Create location');
  $('#lNo').textContent=v?'Close':'Cancel';
  if(LD.step===1)setTimeout(function(){var i=$('#lf_name');if(i&&!LD.err.name){var k=Object.keys(LD.err)[0];var t=k?$('#lf_'+k):i;if(t)t.focus()}},30);
}
function lPull(){if(LD.step!==1)return;['name','street','country','state','city','postal','tz','cid'].forEach(function(k){var el=$('#lf_'+k);if(el)LD.d[k]=el.value.trim()})}
function lValidate(){
  var d=LD.d, e={};
  if(!d.name)e.name='Give the location a name.'; else if(locations.some(function(l){return l.id!==LD.id&&l.name.toLowerCase()===d.name.toLowerCase()}))e.name='A location called “'+d.name+'” already exists.';
  if(!d.street)e.street='Enter the street address.'; if(!d.country)e.country='Pick a country.'; if(d.country&&COUNTRIES[d.country]&&!d.state)e.state='Pick a state or region.'; if(!d.city)e.city='Enter the city.';
  var pl=lPostal(); if(pl[2]!=='optional'&&!pl[1].test(d.postal||''))e.postal='Enter a valid '+pl[0].toLowerCase()+(pl[2]?' (e.g. '+pl[2]+')':'')+'.';
  if(!d.tz)e.tz='Pick a timezone.'; LD.err=e; return !Object.keys(e).length;
}
function openLocDialog(mode,l){
  if(mode!=='view'&&!can('locations'))return;
  LD={mode:mode,id:l?l.id:null,step:mode==='view'?2:1,err:{},tzAuto:false,d:l?{name:l.name,street:l.street,country:l.country,state:l.state,city:l.city,postal:l.postal,tz:l.tz,cid:l.cid,def:l.def}:{name:'',street:'',country:'',state:'',city:'',postal:'',tz:'',cid:'',def:!locations.length}};
  lPaint(); rOpen('#ldlg');
}
function closeLoc(){rClose('#ldlg');LD=null}
$('#lX').addEventListener('click',closeLoc); $('#lNo').addEventListener('click',closeLoc);
$('#lBack').addEventListener('click',function(){LD.step=1;lPaint()});
$('#lB').addEventListener('click',function(e){if(e.target.closest('[data-lgo]')){LD.step=1;lPaint()}});
$('#lB').addEventListener('change',function(e){
  var id=e.target.id; if(!LD||LD.step!==1)return; lPull();
  if(id==='lf_country'){LD.d.state='';LD.d.tz=tzFor(LD.d.country,'');LD.tzAuto=!!LD.d.tz;delete LD.err.country;delete LD.err.state;delete LD.err.tz;lPaint()}
  else if(id==='lf_state'){var t=tzFor(LD.d.country,LD.d.state);if(t){LD.d.tz=t;LD.tzAuto=true;var s=$('#lf_tz');if(s)s.value=t;$('#lTzHint').textContent='Set from the state — change it if this site keeps different hours.'}}
  else if(id==='lf_tz'){LD.tzAuto=false;$('#lTzHint').textContent=''}
});
$('#lB').addEventListener('input',function(e){var k=(e.target.id||'').replace('lf_','');if(LD&&LD.err[k]){delete LD.err[k];e.target.style.borderColor='#cbd5e1';var er=$('[data-lerr="'+k+'"]');if(er)er.remove()}});
$('#lB').addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();$('#lYes').click()}});
$('#lYes').addEventListener('click',function(){
  if(!LD)return;
  if(LD.step===1){lPull();if(!lValidate()){lPaint();return}LD.step=2;lPaint();return}
  var d=LD.d, def=$('#lf_def')?$('#lf_def').checked:false;
  if(LD.mode==='edit'){
    var l=locById(LD.id), old=l.name, ppl=locPeople(l), gs=locGroups(l);
    Object.assign(l,{name:d.name,street:d.street,country:d.country,state:d.state,city:d.city,postal:d.postal,tz:d.tz,cid:d.cid});
    if(def)locations.forEach(function(x){x.def=x===l});
    ppl.forEach(function(r){movePerson(r,l)}); gs.forEach(function(g){g.loc=l.name});
    syncLocOptions(); apply(); renderGroups(); renderLocs(); if(vD.style.display!=='none')renderDetail(); closeLoc(); toast('Location saved'); return;
  }
  var nl={id:'l'+Date.now().toString(36),name:d.name,street:d.street,country:d.country,state:d.state,city:d.city,postal:d.postal,tz:d.tz,cid:d.cid,def:false};
  locations.push(nl); if(def)locations.forEach(function(x){x.def=x===nl}); syncLocOptions(); renderLocs(); closeLoc();
  if($('#viewLocs').style.display==='none')showView('locations');
  var tr=$('tr[data-lrow="'+nl.id+'"]'); if(tr){tr.style.transition='background-color .7s';tr.style.background='#eff6ff';setTimeout(function(){tr.style.background=''},1500)}
  note('Location “'+nl.name+'” created','Undo',function(){var i=locations.indexOf(nl);if(i<0)return;var wasDef=nl.def;locations.splice(i,1);if(wasDef&&locations.length)locations[0].def=true;locPeople(nl).forEach(function(r){movePerson(r,defLoc())});syncLocOptions();apply();renderLocs()});
});
$('#ldlg').addEventListener('mousedown',function(e){if(e.target===$('#ldlg')&&LD&&LD.mode==='view')closeLoc()});
function confirmDeleteLoc(l){
  if(l.def)return; var ppl=locPeople(l), gs=locGroups(l), to=defLoc(), bits=[];
  if(ppl.length)bits.push('<b>'+ppl.length+(ppl.length===1?' person':' people')+'</b>'); if(gs.length)bits.push('<b>'+gs.length+(gs.length===1?' group':' groups')+'</b>');
  showConfirm('Delete “'+l.name+'”?',(bits.length?bits.join(' and ')+' based here will move to <b>'+esc(to.name)+'</b>. ':'No one is based here. ')+'You can undo this right after.','Delete location',function(){
    var i=locations.indexOf(l), moved=ppl.map(function(r){return r}), gmoved=gs.slice();
    locations.splice(i,1); moved.forEach(function(r){movePerson(r,to)}); gmoved.forEach(function(g){g.loc=to.name});
    syncLocOptions(); apply(); renderGroups(); renderLocs();
    note('Location “'+l.name+'” deleted'+(moved.length||gmoved.length?' · moved to '+to.name:''),'Undo',function(){locations.splice(Math.min(i,locations.length),0,l);moved.forEach(function(r){movePerson(r,l)});gmoved.forEach(function(g){g.loc=l.name});syncLocOptions();apply();renderGroups();renderLocs()});
  },true);
}
syncLocOptions();

