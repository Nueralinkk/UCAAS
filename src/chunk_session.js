/* ---------- session: who is signed in, and what their role lets them do ---------- */
var NEED={people:'8:1',roles:'8:2',numbers:'14:1',fax:'14:2',export:'5:2'};
function me(){return $('tr[data-self="1"]')}
function can(k){if(!ROLES)return true;var r=me();if(!r)return false;var x=roleByName(r.dataset.role);return !!(x&&x.perms[NEED[k]||k])}
function canSelect(){return can('people')||can('export')}
function showEl(el,ok){if(!el)return;if(el._d==null)el._d=el.style.display;el.style.display=ok?el._d:'none'}
function applyPerms(){
  $$('[data-need]').forEach(function(el){showEl(el,can(el.getAttribute('data-need')))});
  var sel=canSelect();
  $$('[data-chk]').forEach(function(i){i.closest('td').style.display=sel?'':'none'});
  $('#chkAll').closest('th').style.display=sel?'':'none'; $('#gChkAll').closest('th').style.display=sel?'':'none';
  var r=me(), x=r?roleByName(r.dataset.role):null, nm=x?x.name:'';
  [['#pcPeople','people'],['#pcGroups','people'],['#pcRoles','roles']].forEach(function(p){var el=$(p[0]);el.style.display=can(p[1])?'none':'inline-flex';el.setAttribute('data-tip','Your role ('+nm+') can look but not change anything here. An account owner can change your role.')});
}
function prunePerson(d){
  if(!(d.self==='1'||can('people')))$$('#dRight [data-pedit]').forEach(function(b){b.remove()});
  if(!can('roles'))$$('#dRight [data-pchrole]').forEach(function(b){b.remove()});
  if(!can('numbers'))$$('#dRight [data-pcid]').forEach(function(b){b.remove()});
}
function pruneDetail(){if(can('people'))return;$$('#dRight [data-dedit],#dRight [data-dmore],#dRight [data-dsep],#dRight [data-ddesc],#dRight [data-mgrpick],#dRight [data-mgrrm],#dRight [data-addmgr],#dRight [data-addmem],#dRight [data-mkmgr],#dRight [data-rmmem],#dRight [data-newgrp]').forEach(function(b){b.remove()})}
function rerenderAll(){applyPerms();apply();syncSel();renderGroups();renderRoles();if(vD.style.display!=='none')renderDetail()}
function signIn(id,quiet){
  var r=personById(id); if(!r)return false;
  var old=me(), ps=$('[data-dd="setpresence"]');
  if(old!==r){
    if(old){old.dataset.self='0';var oc=ps.parentNode;ps.remove();var br=$('br',oc);if(br)br.remove()}
    r.dataset.self='1'; var cell=$('[data-f="presence"]',r).parentNode; cell.appendChild(document.createElement('br')); cell.appendChild(ps);
  }
  var d=r.dataset, av=AVS[(+d.av)%AVS.length], b=$('#btnAccount');
  b.firstChild.nodeValue=ini(d.name); b.style.background=av[0]; b.style.color=av[1]; b.setAttribute('title',d.name+' · '+d.role);
  curP=d.presence; $('[data-lbl]',ps).textContent=curP==='Offline'?'Available':curP; renderDuty();
  try{localStorage.setItem('me',id)}catch(e){}
  $('#signin').style.display='none';
  rerenderAll();
  if(!quiet)showView('people');
  return true;
}
function renderSignIn(){
  var list=rows().filter(function(r){var d=r.dataset;return d.removed!=='1'&&d.status==='Active'});
  $('#siList').innerHTML=list.map(function(r){var d=r.dataset,x=roleByName(d.role);
    return '<button data-si="'+d.id+'" data-h="border-color:#93b4f5;background:#f8fbff;" style="display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;font:inherit;cursor:pointer;text-align:left;transition:border-color .12s,background-color .12s">'+avP(r,38)
      +'<span style="flex:1;min-width:0"><span style="display:block;font-weight:700;color:#0f172a">'+esc(d.name)+'</span><span style="display:block;font-size:12.5px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(d.email)+'</span></span>'
      +'<span style="text-align:right;flex-shrink:0"><span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:.3px;color:#1d4ed8;background:#dbeafe;border-radius:6px;padding:3px 8px">'+esc(d.role)+'</span><span style="display:block;font-size:11.5px;color:#94a3b8;margin-top:3px">'+(x?permCount(x)+' of '+PERM_TOTAL+' permissions':'')+'</span></span></button>'}).join('');
}
function signOut(){
  try{localStorage.setItem('me','')}catch(e){}
  closeMenu(); closeDrawer(); closeK(); $$('[role="dialog"]').forEach(function(m){m.style.display='none'}); mStack.length=0; dOv.style.opacity=0; dOv.style.display='none';
  renderSignIn(); var s=$('#signin'); s.style.display='flex'; s.style.opacity='0'; void s.offsetHeight; s.style.transition='opacity .2s'; s.style.opacity='1';
  setTimeout(function(){var f=$('#siList button');if(f)f.focus()},50);
}
$('#siList').addEventListener('click',function(e){var b=e.target.closest('[data-si]');if(b)signIn(b.getAttribute('data-si'))});
$('#btnAccount').addEventListener('click',function(){
  var r=me(), d=r.dataset, x=roleByName(d.role), menu=$('[data-menu="account"]');
  menu.innerHTML='<div style="display:flex;align-items:center;gap:10px;padding:8px 10px 6px">'+avP(r,38)+'<div style="min-width:0;flex:1"><div style="font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(d.name)+'</div><div style="font-size:12px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(d.email)+'</div></div></div>'
    +'<div style="display:flex;align-items:center;gap:8px;padding:2px 10px 10px"><span style="font-size:11px;font-weight:700;letter-spacing:.3px;color:#1d4ed8;background:#dbeafe;border-radius:6px;padding:3px 8px">'+esc(d.role)+'</span><span style="font-size:12px;color:#94a3b8">'+(x?permCount(x)+' of '+PERM_TOTAL+' permissions':'')+'</span></div>'+M_SEP
    +'<button data-acc="profile" data-h="background:#f1f5f9;" style="'+M_OPT+'color:#1e293b">'+ico('user')+'<span>My profile</span></button>'
    +'<button data-acc="switch" data-h="background:#f1f5f9;" style="'+M_OPT+'color:#1e293b">'+ico('swap')+'<span>Switch profile…</span></button>'+M_SEP
    +'<button data-acc="out" data-h="background:#fef2f2;" style="'+M_OPT+'color:#dc2626">'+ico('x','#dc2626')+'<span>Sign out</span></button>';
  openMenu($('#btnAccount'),menu,true);
});
$('[data-menu="account"]').addEventListener('click',function(e){e.stopPropagation();var b=e.target.closest('[data-acc]');if(!b)return;var k=b.getAttribute('data-acc');closeMenu();if(k==='profile')openPerson(me());else signOut()});
function initSession(){
  var id=null; try{id=localStorage.getItem('me')}catch(e){}
  if(id===''){signIn('anu',true);signOut();return}
  var r=id&&personById(id); if(!(r&&r.dataset.removed!=='1'&&r.dataset.status==='Active'))id='anu';
  signIn(id,true);
}

