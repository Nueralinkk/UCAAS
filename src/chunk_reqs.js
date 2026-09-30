/* ---------- requests: risky changes a non-admin can ask for, an admin approves ---------- */
var REQS=[]; try{REQS=JSON.parse(localStorage.getItem('reqs')||'[]')}catch(e){REQS=[]}
function saveReqs(){try{localStorage.setItem('reqs',JSON.stringify(REQS))}catch(e){}}
function teamLevel(){var m=me(),x=m&&roleByName(m.dataset.role);return !!(x&&x.perms['5.x.0.1'])}   /* "Call reports: Team" marks a supervisor-level role */
function canReqFor(r,type){var m=me();if(!m||!r||r.dataset.removed==='1'||r.dataset.role==='Account owner')return false;if(type==='role'||type==='cid')return r===m||teamLevel();return r!==m&&teamLevel()}
function reqNeed(q){return {role:'roles',cid:'numbers',suspend:'people',remove:'people',gdelete:'people'}[q.type]}
function canApprove(q){return can(reqNeed(q))}
function pendingReqs(){return REQS.filter(function(q){return q.status==='pending'})}
function hasPending(type,id){return pendingReqs().some(function(q){return q.type===type&&q.target===id})}
function reqTarget(q){return q.type==='gdelete'?groups.filter(function(g){return g.id===q.target})[0]:personById(q.target)}
function reqText(q){var t=reqTarget(q),n=t?(q.type==='gdelete'?t.name:t.dataset.name):'(gone)';
  if(q.type==='role')return 'change <b>'+esc(n)+'</b>’s role to <b>'+esc(q.value)+'</b>';
  if(q.type==='cid')return 'give <b>'+esc(n)+'</b> the caller ID <b>'+esc(fmtNum(q.value))+'</b>'+(q.fresh?' (new number)':'');
  if(q.type==='suspend')return (q.un?'reactivate':'suspend')+' <b>'+esc(n)+'</b>';
  if(q.type==='remove')return 'remove <b>'+esc(n)+'</b> from the directory';
  return 'delete the group <b>'+esc(n)+'</b>'}
function addReq(o){o.id='q'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);o.by=me().dataset.id;o.at=Date.now();o.status='pending';REQS.unshift(o);saveReqs();reqTouched();return o}
function withdrawReq(id){var i=REQS.map(function(q){return q.id}).indexOf(id);if(i<0)return;REQS.splice(i,1);saveReqs();reqTouched()}
function sendReq(o){var q=addReq(o);note('Request sent — an admin will review it','Undo',function(){withdrawReq(q.id)})}
function reqTouched(){paintReqBadge();apply();if(vD.style.display!=='none')renderDetail();if($('#rqdlg').style.display==='flex')renderReqs()}
function reqConfirm(type,t){
  var isG=type==='gdelete', n=isG?t.name:t.dataset.name, un=type==='suspend'&&t.dataset.status==='Suspended';
  var body=isG?'This asks an admin to delete <b>'+esc(n)+'</b> and its extension '+esc(t.ext)+'. Nothing changes until they approve.'
    :type==='remove'?'This asks an admin to remove <b>'+esc(n)+'</b> from the directory. Nothing changes until they approve.'
    :'This asks an admin to '+(un?'reactivate':'suspend')+' <b>'+esc(n)+'</b>. Nothing changes until they approve.';
  showConfirm('Ask an admin?',body,'Send request',function(){sendReq(isG?{type:'gdelete',target:t.id}:{type:type,target:t.dataset.id,un:un})},type!=='suspend'||!un);
}
function applyReq(q){
  var t=reqTarget(q); if(!t){note('That '+(q.type==='gdelete'?'group':'person')+' no longer exists',null,null,'danger');return false}
  if(q.type==='role'){var x=roleByName(q.value);if(!x){note('The role “'+q.value+'” no longer exists',null,null,'danger');return false}
    var old=t.dataset.role;t.dataset.role=q.value;renderRow(t);apply();rolesTouched();logAct(t,'Role changed from '+old+' to '+q.value+' (requested by '+reqByName(q)+')')}
  else if(q.type==='cid'){if(q.fresh)CID_POOL.push(q.value);var own=cidOwner(q.value);if(own&&own!==t)setCid(own,'');setCid(t,q.value);logAct(t,'Caller ID assigned: '+fmtNum(q.value)+' (requested by '+reqByName(q)+')');if(vD.style.display!=='none'&&dMode==='person')renderPerson()}
  else if(q.type==='suspend'){doSuspend([t],q.un)}
  else if(q.type==='remove'){removeRows([t])}
  else if(q.type==='gdelete'){doDelete(t)}
  return true;
}
function reqByName(q){var r=personById(q.by);return r?r.dataset.name:'someone'}
function resolveReq(q,ok){if(ok&&!applyReq(q))return;q.status=ok?'approved':'declined';q.byAdmin=me().dataset.id;q.doneAt=Date.now();saveReqs();reqTouched()}
function paintReqBadge(){
  var m=me(); if(!m)return; var n=can('people')||can('roles')||can('numbers')?pendingReqs().filter(canApprove).length:pendingReqs().filter(function(q){return q.by===m.dataset.id}).length;
  var d=$('#rqDot'); if(!d){d=document.createElement('span');d.id='rqDot';d.style.cssText='position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#dc2626;color:#fff;font-size:11px;font-weight:700;display:none;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff';$('#btnAccount').appendChild(d)}
  d.textContent=n; d.style.display=n?'inline-flex':'none'; d.title=n+' request'+(n===1?'':'s')+' waiting';
}
function statusChip(st){var c={pending:['#fef3c7','#b45309','Waiting'],approved:['#dcfce7','#15803d','Approved'],declined:['#fee2e2','#b91c1c','Declined']}[st];return '<span style="font-size:11px;font-weight:700;letter-spacing:.3px;border-radius:6px;padding:2px 7px;background:'+c[0]+';color:'+c[1]+'">'+c[2]+'</span>'}
function reqRow(q,acts){var by=personById(q.by);
  return '<div style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-top:1px solid #f1f5f9">'+(by?avP(by,36):'')+'<div style="flex:1;min-width:0"><div style="font-size:13.5px;color:#1e293b;line-height:1.45"><b>'+esc(by?by.dataset.name:'Someone')+'</b> asked to '+reqText(q)+(q.note?' — “'+esc(q.note)+'”':'')+'</div><div style="display:flex;align-items:center;gap:8px;margin-top:5px;font-size:12px;color:#64748b">'+relTime(q.at)+(q.status!=='pending'?' · '+statusChip(q.status)+(q.byAdmin?' by '+esc((personById(q.byAdmin)||{dataset:{name:'an admin'}}).dataset.name):''):'')+'</div></div>'+(acts||'')+'</div>'}
function renderReqs(){
  var m=me(), mine=REQS.filter(function(q){return q.by===m.dataset.id}), pend=pendingReqs();
  var forMe=pend.filter(function(q){return canApprove(q)&&q.by!==m.dataset.id}), other=pend.filter(function(q){return !canApprove(q)&&q.by!==m.dataset.id}), done=REQS.filter(function(q){return q.status!=='pending'}).slice(0,6);
  var B='height:32px;padding:0 12px;border-radius:8px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background-color .12s;';
  function head(t,n){return '<div style="font-size:11px;font-weight:700;letter-spacing:.7px;color:#64748b;text-transform:uppercase;margin:14px 0 2px">'+t+(n!=null?' <span style="color:#94a3b8">('+n+')</span>':'')+'</div>'}
  var h='';
  if(forMe.length)h+=head('Waiting for you',forMe.length)+forMe.map(function(q){return reqRow(q,'<div style="display:flex;gap:6px;flex-shrink:0"><button data-rq="no" data-id="'+q.id+'" data-h="background:#f1f5f9;" style="'+B+'border:1px solid #e2e8f0;background:#fff;color:#334155">Decline</button><button data-rq="ok" data-id="'+q.id+'" data-h="background:#1d4ed8;" style="'+B+'border:1px solid #2563eb;background:#2563eb;color:#fff">Approve</button></div>')}).join('');
  if(mine.length)h+=head('Your requests',mine.length)+mine.map(function(q){return reqRow(q,q.status==='pending'?'<button data-rq="wd" data-id="'+q.id+'" data-h="background:#f1f5f9;" style="'+B+'border:1px solid #e2e8f0;background:#fff;color:#334155;flex-shrink:0">Withdraw</button>':'')}).join('');
  if(other.length)h+=head('Waiting for another admin',other.length)+other.map(function(q){return reqRow(q)}).join('');
  var rest=done.filter(function(q){return q.by!==m.dataset.id}); if(rest.length)h+=head('Recently resolved')+rest.map(function(q){return reqRow(q)}).join('');
  if(!h)h='<div style="text-align:center;padding:36px 10px;color:#64748b"><div style="font-weight:600;color:#0f172a">Nothing waiting</div><div style="font-size:13px;margin-top:4px">'+(teamLevel()||!can('people')?'Actions you can’t take yourself show as “Request…” in menus — they land here.':'Requests from supervisors and agents for changes only an admin can make will show up here.')+'</div></div>';
  $('#rqSub').textContent=forMe.length?forMe.length+(forMe.length===1?' change is':' changes are')+' waiting for your decision.':'Changes that need an admin’s approval.';
  $('#rqB').innerHTML=h;
}
function openReqs(){renderReqs();rOpen('#rqdlg')}
function closeReqs(){rClose('#rqdlg')}
$('#rqX').addEventListener('click',closeReqs); $('#rqClose').addEventListener('click',closeReqs);
$('#rqdlg').addEventListener('mousedown',function(e){if(e.target===$('#rqdlg'))closeReqs()});
$('#rqB').addEventListener('click',function(e){var b=e.target.closest('[data-rq]');if(!b)return;var q=REQS.filter(function(x){return x.id===b.getAttribute('data-id')})[0];if(!q)return;var k=b.getAttribute('data-rq');
  if(k==='wd'){withdrawReq(q.id);return} if(!canApprove(q))return;
  if(k==='ok'){resolveReq(q,true);note('Approved — '+reqText(q).replace(/<[^>]+>/g,''))} else {resolveReq(q,false)}});
function reqChip(t){return '<span data-tip="Waiting for an admin" style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:#b45309;background:#fef3c7;border-radius:8px;padding:5px 10px;margin-left:auto">'+ico2('clock','#b45309',13)+t+'</span>'}
function reqBtn(attr,t){return '<button '+attr+' data-h="background:#fef3c7;" style="margin-left:auto;height:30px;padding:0 12px;border:1px solid #fde68a;border-radius:8px;background:#fffbeb;color:#b45309;font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background-color .12s">'+t+'</button>'}
