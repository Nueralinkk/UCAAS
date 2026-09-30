/* ---------- Roles: what each person can see and do ---------- */
IC_.eye='<path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>';
IC_.uplus='<circle cx="10" cy="8" r="3.5"/><path d="M3.5 19a6.5 6.5 0 0 1 13 0"/><path d="M19 8v6M16 11h6"/>';
IC_.chevd='<path d="M6 9l6 6 6-6"/>';
var PERMS=[
  ['AI',['Use AI call summaries','Use AI assist during calls','Configure AI features']],
  ['Chat',['Send and receive chat','View chat history','Manage chat settings']],
  ['Video',['Join video meetings','Host video meetings','Record meetings']],
  ['Billing',['View invoices','Manage payment methods','Buy numbers and add-ons']],
  ['Contact',['View contacts','Add and edit contacts','Delete and import contacts']],
  ['Reports',['View own reports','View team reports','Export reports']],
  ['Campaign',['View campaigns','Create and edit campaigns','Start and stop campaigns']],
  ['Messages',['Send and receive SMS','View message history','Manage message templates']],
  ['Settings',['Change own settings','Manage people and groups','Manage roles']],
  ['Monitoring',['Listen to live calls','Whisper and barge in','View the live dashboard']],
  ['Integration',['Use connected apps','Connect and remove apps','Manage API keys']],
  ['Omni channel',['Handle email conversations','Handle social conversations','Route between channels']],
  ['Calling rates',['View calling rates','Change rate plans']],
  ['Account setting',['View account details','Edit company profile','Close the account']],
  ['Virtual numbers',['View numbers','Assign numbers to people','Buy and release numbers']],
  ['Monitoring features',['Play call recordings','Download recordings','Delete recordings']],
  ['Phone system action',['Make and receive calls','Transfer and hold','Set call forwarding']],
  ['Advance call management',['Manage queues','Manage IVR menus','Manage business hours']],
  ['Agent workday',['Set own presence','Log breaks','View own schedule']]
];
var PERM_TOTAL=PERMS.reduce(function(n,c){return n+c[1].length},0);
function pk(c,i){return c+':'+i}
function permsOf(list){var o={};list.forEach(function(s){var p=s.split(':'),c=+p[0];if(p[1]==='*')PERMS[c][1].forEach(function(_,i){o[pk(c,i)]=1});else o[s]=1});return o}
var P_AGENT=['0:0','0:1','1:0','1:1','2:0','4:0','4:1','5:0','7:0','7:1','8:0','11:0','11:1','14:0','16:*','18:*'];
var P_SUP=P_AGENT.concat(['1:2','2:1','2:2','5:1','5:2','6:0','6:2','9:*','11:2','15:0','15:1']);
var P_GADM=P_SUP.concat(['0:2','3:0','4:2','6:1','7:2','8:1','10:0','10:1','12:0','13:0','14:1','15:2','17:*']);
var ROLES=[
  {id:'owner',name:'Account owner',desc:'Runs the whole account. Everything the company has, including billing.',builtin:true,owner:true,perms:permsOf(PERMS.map(function(_,c){return c+':*'}))},
  {id:'gadmin',name:'Group admin',desc:ROLE_HELP['Group admin'],builtin:true,perms:permsOf(P_GADM)},
  {id:'sup',name:'Supervisor',desc:ROLE_HELP['Supervisor'],builtin:true,perms:permsOf(P_SUP)},
  {id:'agent',name:'Agent',desc:ROLE_HELP['Agent'],builtin:true,perms:permsOf(P_AGENT)}
];
function roleByName(n){for(var i=0;i<ROLES.length;i++)if(ROLES[i].name===n)return ROLES[i];return null}
function roleById(id){for(var i=0;i<ROLES.length;i++)if(ROLES[i].id===id)return ROLES[i];return null}
function roleHolders(x){return rows().filter(function(r){return r.dataset.removed!=='1'&&r.dataset.role===x.name})}
function permCount(x){return Object.keys(x.perms).length}
function catCount(x,c){var n=0;PERMS[c][1].forEach(function(_,i){if(x.perms[pk(c,i)])n++});return n}
/* every place a role can be picked follows the ROLES list: invite wizard, Role filter, CSV import, help text */
var roleOptTpl=$('[data-menu="role"] [data-opt]').cloneNode(true);
function syncRoleOptions(){
  var names=ROLES.map(function(x){return x.name}), pick=ROLES.filter(function(x){return !x.owner}).map(function(x){return x.name});
  ROLES.forEach(function(x){ROLE_HELP[x.name]=x.desc});
  Object.keys(IMP_ROLES).forEach(function(k){delete IMP_ROLES[k]}); pick.forEach(function(n){IMP_ROLES[n.toLowerCase()]=n});
  var sel=$('#fRole'), cur=sel.value; sel.innerHTML=pick.map(function(n){return '<option>'+esc(n)+'</option>'}).join(''); sel.value=pick.indexOf(cur)>-1?cur:'Agent';
  var menu=$('[data-menu="role"]'); menu.innerHTML='';
  ['Any'].concat(names).forEach(function(n){var o=roleOptTpl.cloneNode(true);o.setAttribute('data-opt',n);o.lastElementChild.textContent=n;menu.appendChild(o)});
  if(filters.role!=='Any'&&names.indexOf(filters.role)<0)filters.role='Any';
  updateChip('role');
}
function rolesTouched(){renderRoles();if(vD.style.display!=='none')renderDetail()}

/* ----- list ----- */
var rq='', rTpl=$('#rRowTpl');
function rBtn(attr,tip,icon,kind){
  var s=kind==='blue'?'color:#2563eb;border:1px solid #bfdbfe;background:#eff6ff;':kind==='red'?'color:#dc2626;border:1px solid #fecaca;background:#fef2f2;':'color:#475569;border:1px solid #e2e8f0;background:#fff;';
  var h=kind==='blue'?'background:#dbeafe;border-color:#93b4f5;':kind==='red'?'background:#fee2e2;border-color:#fca5a5;':'background:#f1f5f9;';
  return '<button '+attr+' data-tip="'+tip+'" aria-label="'+tip+'" data-h="'+h+'" style="width:32px;height:32px;border-radius:8px;display:grid;place-items:center;cursor:pointer;padding:0;font:inherit;flex-shrink:0;transition:background-color .12s,border-color .12s;'+s+'">'+ico2(icon,'currentColor',16)+'</button>';
}
function renderRoles(){
  var q=rq.trim().toLowerCase(), list=ROLES.filter(function(x){return !q||(x.name+' '+x.desc).toLowerCase().indexOf(q)>-1}), body=$('#rbody');
  $$('tr[data-rrow]',body).forEach(function(t){t.remove()});
  list.forEach(function(x){
    var tr=rTpl.cloneNode(true), n=roleHolders(x).length; tr.removeAttribute('id'); tr.setAttribute('data-rrow',x.id);
    $('[data-rname]',tr).textContent=x.name; $('[data-rdesc]',tr).textContent=x.desc;
    var ty=$('[data-rtype]',tr); ty.textContent=x.owner?'Built in · owner':x.builtin?'Built in':'Custom'; if(!x.builtin){ty.style.background='#eff6ff';ty.style.color='#1d4ed8'}
    var pc=$('[data-rpeople]',tr), cnt=$('[data-rcnt]',tr); cnt.textContent=n;
    if(!n){cnt.style.background='#eef2f6';cnt.style.color='#94a3b8';pc.setAttribute('data-tip','No one yet — click to assign people')}else pc.setAttribute('data-tip','Show these people');
    $('[data-racts]',tr).innerHTML=x.owner
      ?'<span style="color:#94a3b8;font-size:13px;margin-right:4px">Cannot be changed</span>'+rBtn('data-ract="view"','View permissions','eye')
      :rBtn('data-ract="assign"','Assign people','uplus')+rBtn('data-ract="view"','View permissions','eye')+(x.builtin?'':rBtn('data-ract="edit"','Edit role','pencil','blue'))+rBtn('data-ract="dup"','Duplicate','copy')+(x.builtin?'':rBtn('data-ract="del"','Delete role','trash','red'));
    body.insertBefore(tr,$('#rEmpty'));
  });
  $('#rEmpty').style.display=list.length?'none':''; $('#rsClear').style.display=rq?'':'none';
  $('#rCount').textContent=list.length+' of '+ROLES.length;
  $('#rPgText').textContent=list.length?'1–'+list.length+' of '+list.length+(list.length===1?' role':' roles'):'0 roles';
}
$('#rbody').addEventListener('click',function(e){
  var tr=e.target.closest('tr[data-rrow]'); if(!tr)return; var x=roleById(tr.getAttribute('data-rrow')); if(!x)return;
  var a=e.target.closest('[data-ract]');
  if(a){var k=a.getAttribute('data-ract');if(k==='view')openRoleView(x);else if(k==='assign')openAssign(x);else if(k==='edit')openRoleEditor('edit',x);else if(k==='dup')openRoleEditor('dup',x);else if(k==='del')confirmDeleteRole(x);return}
  if(e.target.closest('[data-rpeople]')){if(roleHolders(x).length){filters.role=x.name;updateChip('role');showView('people')}else openAssign(x);return}
  if(e.target.closest('[data-rview]'))openRoleView(x);
});
$('#rsearch').addEventListener('input',function(e){rq=e.target.value;renderRoles()});
$('#rsClear').addEventListener('click',function(){rq='';$('#rsearch').value='';renderRoles();$('#rsearch').focus()});
$('#rEmptyClear').addEventListener('click',function(){rq='';$('#rsearch').value='';renderRoles()});
$('#btnNewRole').addEventListener('click',function(){openRoleEditor('new')});
$('#rRefresh').addEventListener('click',function(){var i=$('#rRefresh svg');i.style.transition='transform .6s';i.style.transform='rotate(360deg)';setTimeout(function(){i.style.transition='none';i.style.transform='none';renderRoles()},600)});

/* ----- shared: dialog open/close/swap, accordion ----- */
var rOwn={};
function rOpen(id){var d=$(id);rOwn[id]=dOv.style.display!=='block';dOv.style.display='block';dOv.style.opacity=1;dOv.style.zIndex=99;closeMenu();d.style.display='flex';mOpen(d)}
function rClose(id){var d=$(id);if(d.style.display!=='flex')return;d.style.display='none';var other=modal.style.display==='flex';dOv.style.zIndex=other?94:'';if(rOwn[id]&&!other&&drawer.style.display!=='flex'){dOv.style.opacity=0;dOv.style.display='none'}mReturnFocus()}
function rSwap(from,to){var top=mStack.pop();$(from).style.display='none';rOwn[to]=rOwn[from];var d=$(to);d.style.display='flex';mOpen(d);if(top)mStack[mStack.length-1].prev=top.prev}
function closeRoleView(){rClose('#rvdlg');RV=null}
function closeRoleEditor(){rClose('#redlg');RE=null}
function closeAssign(){rClose('#radlg');RA=null}
var LNK='border:0;background:none;padding:4px 8px;border-radius:6px;font:inherit;font-size:13px;font-weight:600;color:#2563eb;cursor:pointer;transition:background-color .12s';
function pillHTML(n,m){var all=n===m&&m>0,none=!n;return '<span data-accn style="font-size:12px;font-weight:700;border-radius:999px;padding:2px 9px;white-space:nowrap;transition:background-color .15s,color .15s;background:'+(all?'#dcfce7':none?'#eef2f6':'#dbeafe')+';color:'+(all?'#15803d':none?'#94a3b8':'#1d4ed8')+'">'+n+' of '+m+'</span>'}
function accHTML(c,x,editable){
  var cat=PERMS[c], n=catCount(x,c), m=cat[1].length;
  var rowsH=cat[1].map(function(label,i){var k=pk(c,i),on=!!x.perms[k];
    if(editable)return '<label data-h="background:#f8fafc;" style="display:flex;align-items:center;gap:12px;padding:9px 8px;border-radius:8px;cursor:pointer;transition:background-color .12s"><input type="checkbox" data-perm="'+k+'"'+(on?' checked':'')+' style="accent-color:#2563eb;width:17px;height:17px;margin:0;cursor:pointer"><span style="font-size:13.5px;color:#1e293b">'+esc(label)+'</span></label>';
    return '<div style="display:flex;align-items:center;gap:12px;padding:8px 8px"><span style="width:20px;height:20px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;background:'+(on?'#dcfce7':'#eef2f6')+'">'+(on?ico2('check','#15803d',12):'<span style="width:7px;height:2px;border-radius:2px;background:#94a3b8"></span>')+'</span><span style="font-size:13.5px;color:'+(on?'#1e293b':'#94a3b8')+'">'+esc(label)+'</span></div>';
  }).join('');
  return '<div data-acc="'+c+'" style="border:1px solid #e2e8f0;border-radius:12px;margin-bottom:10px;background:#fff;overflow:hidden;transition:border-color .15s">'
    +'<div style="display:flex;align-items:center">'+(editable?'<input type="checkbox" data-acccat="'+c+'" data-tip="Tick or untick this whole section" style="accent-color:#2563eb;width:17px;height:17px;margin:0 0 0 14px;cursor:pointer;flex-shrink:0">':'')
    +'<button type="button" data-acch data-h="background:#f8fafc;" style="flex:1;display:flex;align-items:center;gap:12px;padding:15px 14px 15px '+(editable?'12px':'16px')+';border:0;background:#fff;font:inherit;cursor:pointer;text-align:left;color:#0f172a;transition:background-color .12s"><span style="flex:1;font-size:13px;font-weight:700;letter-spacing:.5px;text-transform:uppercase">'+esc(cat[0])+'</span>'+pillHTML(n,m)+'<span data-accv style="display:flex;color:#64748b;transition:transform .2s">'+ico2('chevd','currentColor',16)+'</span></button></div>'
    +'<div data-accb style="max-height:0;overflow:hidden;opacity:0;transition:max-height .22s ease,opacity .18s ease"><div style="padding:4px 10px 10px;border-top:1px solid #f1f5f9">'+rowsH+'</div></div></div>';
}
function accSet(acc,open){var b=$('[data-accb]',acc),v=$('[data-accv]',acc);acc.setAttribute('data-open',open?'1':'');b.style.maxHeight=open?b.scrollHeight+'px':'0px';b.style.opacity=open?'1':'0';v.style.transform=open?'rotate(180deg)':'';acc.style.borderColor=open?'#bfdbfe':'#e2e8f0'}
function accAll(box,open){$$('[data-acc]',box).forEach(function(a){accSet(a,open)})}
function accClick(e){var h=e.target.closest('[data-acch]');if(!h)return false;var acc=h.closest('[data-acc]');accSet(acc,acc.getAttribute('data-open')!=='1');return true}
function rChip(icon,text,bg,fg){return '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:999px;font-size:13px;background:'+bg+';color:'+fg+'">'+ico2(icon,fg,14)+text+'</span>'}
function rolePeopleGo(x){if(roleHolders(x).length){filters.role=x.name;updateChip('role');showView('people')}else openAssign(x)}

/* ----- view role (read only) ----- */
var RV=null;
function openRoleView(x){
  RV=x; var n=roleHolders(x).length, pc=permCount(x), all=pc===PERM_TOTAL;
  $('#rvT').textContent=x.name;
  $('#rvSub').textContent=x.owner?'The built-in owner role. It always allows everything and cannot be changed.':x.builtin?'A built-in role. You can read what it allows, and duplicate it to make your own.':'A custom role your company made. Edit it any time — changes apply to everyone holding it.';
  var chips='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">'+rChip('check','Allows '+pc+' of '+PERM_TOTAL+' permissions',all?'#dcfce7':'#dbeafe',all?'#15803d':'#1d4ed8')
    +'<button data-rvpeople data-h="background:#e2e8f0;" style="display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:999px;font-size:13px;background:#f1f5f9;color:#334155;border:0;font:inherit;cursor:pointer;transition:background-color .12s">'+ico2('users','#334155',14)+(n?n+(n===1?' person holds':' people hold')+' this role':'No one holds this role yet')+'</button>'
    +rChip(x.builtin?'shield':'pencil',x.owner?'Built in · owner':x.builtin?'Built in':'Custom','#f1f5f9','#334155')+'</div>';
  var desc='<div style="padding:12px 16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;font-size:13.5px;color:#334155;line-height:1.5;margin-bottom:14px"><b style="color:#0f172a">Description:</b> '+esc(x.desc||'—')+'</div>';
  var bar='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><span style="font-size:11px;font-weight:700;letter-spacing:.7px;color:#64748b;text-transform:uppercase">What it allows</span><span style="display:flex;gap:4px"><button data-rvx="1" data-h="background:#eff6ff;" style="'+LNK+'">Expand all</button><button data-rvx="0" data-h="background:#eff6ff;" style="'+LNK+'">Collapse all</button></span></div>';
  $('#rvB').innerHTML=chips+desc+bar+PERMS.map(function(_,c){return accHTML(c,x,false)}).join('');
  $('#rvB').scrollTop=0; $('#rvDup').style.display='inline-flex'; $('#rvEdit').style.display=x.builtin?'none':'inline-flex';
  rOpen('#rvdlg');
}
$('#rvB').addEventListener('click',function(e){
  if(accClick(e))return; var t;
  if((t=e.target.closest('[data-rvx]'))){accAll($('#rvB'),t.getAttribute('data-rvx')==='1');return}
  if(e.target.closest('[data-rvpeople]')){var x=RV;closeRoleView();rolePeopleGo(x)}
});
$('#rvX').addEventListener('click',closeRoleView); $('#rvClose').addEventListener('click',closeRoleView);
$('#rvdlg').addEventListener('mousedown',function(e){if(e.target===$('#rvdlg'))closeRoleView()});
$('#rvDup').addEventListener('click',function(){openRoleEditor('dup',RV,'#rvdlg')});
$('#rvEdit').addEventListener('click',function(){openRoleEditor('edit',RV,'#rvdlg')});

/* ----- new / duplicate / edit role ----- */
var RE=null;
var IN_='height:44px;border:1px solid #cbd5e1;border-radius:11px;padding:0 12px;font:inherit;font-size:15px;outline:0;background:#fff;color:#0f172a;width:100%;box-sizing:border-box;transition:border-color .12s,box-shadow .12s;';
function reRadio(id,name,desc,on){return '<label data-refrom="'+id+'" data-h="border-color:#93b4f5;" style="display:flex;align-items:flex-start;gap:12px;padding:11px 12px;border:1px solid '+(on?'#2563eb':'#e2e8f0')+';border-radius:10px;cursor:pointer;background:'+(on?'#f3f7ff':'#fff')+';transition:border-color .12s,background-color .12s"><span style="width:18px;height:18px;border-radius:50%;border:2px solid '+(on?'#2563eb':'#cbd5e1')+';flex-shrink:0;margin-top:1px;display:grid;place-items:center;transition:border-color .12s">'+(on?'<span style="width:9px;height:9px;border-radius:50%;background:#2563eb"></span>':'')+'</span><span style="flex:1;min-width:0"><span style="display:block;font-weight:700;color:#0f172a;font-size:14px">'+esc(name)+'</span><span style="display:block;color:#64748b;font-size:12.5px;line-height:1.45;margin-top:1px">'+esc(desc)+'</span></span></label>'}
function reFromOpts(){var src=RE.src,opts=ROLES.filter(function(r){return r.builtin&&!r.owner});if(src&&!src.builtin)opts=[src].concat(opts);return opts}
function reRenderFrom(){var b=$('#reFrom');if(!b)return;b.innerHTML=reFromOpts().map(function(r){return reRadio(r.id,r.name,r.desc,RE.from===r.id)}).join('')+reRadio('','Nothing','Start with no permissions ticked.',RE.from==='')}
function openRoleEditor(mode,x,swapFrom){
  var src=mode==='new'?roleById('agent'):x;
  RE={mode:mode,id:mode==='edit'?x.id:null,src:mode==='dup'?x:null,from:mode==='edit'?null:src.id,perms:Object.assign({},src.perms)};
  var name=mode==='edit'?x.name:mode==='dup'?'Copy of '+x.name:'', desc=mode==='new'?'':x.desc;
  $('#reT').textContent=mode==='edit'?'Edit role':mode==='dup'?'Duplicate role':'New role';
  $('#reSub').textContent=mode==='edit'?'Rename it or change what it allows. Changes apply to everyone holding it.':'Name it, then tick what anyone holding it can see and do.';
  var top='<div style="padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;margin-bottom:14px">'
    +'<div style="font-size:13px;font-weight:600;color:#334155;margin-bottom:8px">Role name</div><input id="reName" value="'+esc(name)+'" placeholder="e.g. Night shift supervisor" maxlength="40" autocomplete="off" data-fo="border-color:#3b82f6;box-shadow:0 0 0 3px #dbeafe;" style="'+IN_+'"><div id="reNameErr" style="display:none;color:#dc2626;font-size:12.5px;margin-top:6px"></div>'
    +'<div style="display:flex;justify-content:space-between;align-items:baseline;margin:14px 0 8px"><span style="font-size:13px;font-weight:600;color:#334155">Description</span><span id="reDescN" style="font-size:12px;color:#94a3b8">'+desc.length+'/300</span></div><textarea id="reDesc" placeholder="What is this role for?" maxlength="300" data-fo="border-color:#3b82f6;box-shadow:0 0 0 3px #dbeafe;" style="'+IN_+'height:76px;padding:10px 12px;resize:vertical;line-height:1.45">'+esc(desc)+'</textarea></div>';
  var start;
  if(mode!=='edit'){
    start='<div style="padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;margin-bottom:14px"><div style="font-size:14.5px;font-weight:700;color:#0f172a">Which role should this one start from?</div>'
      +'<p style="margin:6px 0 12px;color:#64748b;font-size:13px;line-height:1.5">Copy a role and adjust it, or pick <b style="color:#334155">Nothing</b> and tick every permission yourself. The role you copy is not changed.</p>'
      +'<div id="reFrom" style="display:grid;gap:8px"></div><div id="reFromHint" style="margin-top:10px;font-size:12.5px;color:#15803d;font-weight:600;display:none"></div></div>';
  }else{
    var hn=roleHolders(x).length;
    start='<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;background:#eff6ff;color:#1e3a8a;font-size:13px;margin-bottom:14px">'+ico2('users','#1d4ed8',15)+'<span>'+(hn?'<b>'+hn+(hn===1?' person holds':' people hold')+'</b> this role — they get the new permissions as soon as you save.':'No one holds this role yet.')+'</span></div>';
  }
  var bar='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px"><span style="font-size:11px;font-weight:700;letter-spacing:.7px;color:#64748b;text-transform:uppercase">'+(mode==='edit'?'Permissions':'Or build it yourself')+'</span><span style="display:flex;gap:4px;align-items:center"><button data-rex="1" data-h="background:#eff6ff;" style="'+LNK+'">Expand all</button><button data-rex="0" data-h="background:#eff6ff;" style="'+LNK+'">Collapse all</button></span></div>';
  $('#reB').innerHTML=top+start+bar+PERMS.map(function(_,c){return accHTML(c,{perms:RE.perms},true)}).join('');
  $('#reB').scrollTop=0; reRenderFrom(); rePaint(); reValidate();
  if(swapFrom)rSwap(swapFrom,'#redlg');else rOpen('#redlg');
}
function rePaint(){
  var tot=Object.keys(RE.perms).length;
  $$('#reB [data-acc]').forEach(function(acc){var c=+acc.getAttribute('data-acc'),n=catCount({perms:RE.perms},c),m=PERMS[c][1].length,cb=$('[data-acccat]',acc),p=$('[data-accn]',acc);
    cb.checked=n===m; cb.indeterminate=n>0&&n<m; p.textContent=n+' of '+m; var all=n===m,none=!n; p.style.background=all?'#dcfce7':none?'#eef2f6':'#dbeafe'; p.style.color=all?'#15803d':none?'#94a3b8':'#1d4ed8'});
  var hint=$('#reFromHint');
  if(hint){var fr=RE.from?roleById(RE.from):null;hint.style.display=fr?'':'none';
    if(fr){var diff=0,a=RE.perms,b=fr.perms;Object.keys(a).forEach(function(k){if(!b[k])diff++});Object.keys(b).forEach(function(k){if(!a[k])diff++});hint.textContent='Started from '+fr.name+' — '+(diff?diff+(diff===1?' permission changed':' permissions changed')+' since.':permCount(fr)+' permissions ticked. Adjust below.')}}
  $('#reFooterN').textContent=tot+' of '+PERM_TOTAL+' permissions';
}
function reValidate(){var ok=!!$('#reName').value.trim(),y=$('#reYes');y.disabled=!ok;y.style.opacity=ok?'1':'.5';y.style.cursor=ok?'pointer':'not-allowed';y.setAttribute('data-tip',ok?'':'Give the role a name first')}
function reNameErr(msg){var e=$('#reNameErr'),i=$('#reName');e.textContent=msg||'';e.style.display=msg?'':'none';i.style.borderColor=msg?'#ef4444':'#cbd5e1';if(msg)i.focus()}
$('#reB').addEventListener('input',function(e){
  if(e.target.id==='reName'){reNameErr('');reValidate()}
  else if(e.target.id==='reDesc')$('#reDescN').textContent=e.target.value.length+'/300';
});
$('#reB').addEventListener('change',function(e){
  var t=e.target, k=t.getAttribute('data-perm');
  if(k){if(t.checked)RE.perms[k]=1;else delete RE.perms[k];rePaint();return}
  var c=t.getAttribute('data-acccat');
  if(c!=null){PERMS[+c][1].forEach(function(_,i){var kk=pk(+c,i);if(t.checked)RE.perms[kk]=1;else delete RE.perms[kk];var cb=$('#reB [data-perm="'+kk+'"]');if(cb)cb.checked=t.checked});rePaint()}
});
$('#reB').addEventListener('click',function(e){
  if(accClick(e))return; var t;
  if((t=e.target.closest('[data-rex]'))){accAll($('#reB'),t.getAttribute('data-rex')==='1');return}
  if((t=e.target.closest('[data-refrom]'))){var id=t.getAttribute('data-refrom'),fr=id?roleById(id):null;RE.from=id;RE.perms=fr?Object.assign({},fr.perms):{};
    $$('#reB [data-perm]').forEach(function(cb){cb.checked=!!RE.perms[cb.getAttribute('data-perm')]});reRenderFrom();rePaint()}
});
function saveRole(){
  var name=$('#reName').value.trim(), desc=$('#reDesc').value.trim();
  if(!name){reNameErr('Give the role a name.');return}
  var clash=ROLES.filter(function(r){return r.id!==RE.id&&r.name.toLowerCase()===name.toLowerCase()})[0];
  if(clash){reNameErr('A role called “'+clash.name+'” already exists. Pick another name.');return}
  var perms=Object.assign({},RE.perms);
  if(RE.mode==='edit'){
    var x=roleById(RE.id), oldName=x.name, hs=roleHolders(x);
    x.name=name; x.desc=desc; x.perms=perms;
    if(oldName!==name)hs.forEach(function(r){r.dataset.role=name;renderRow(r);logAct(r,'Role renamed from '+oldName+' to '+name)});
    syncRoleOptions(); apply(); rolesTouched(); closeRoleEditor(); toast('Role saved'); flashRole(x); return;
  }
  var nx={id:'r'+Date.now().toString(36),name:name,desc:desc,builtin:false,perms:perms}; ROLES.push(nx);
  syncRoleOptions(); rolesTouched(); closeRoleEditor();
  if($('#viewRoles').style.display==='none')showView('roles');
  flashRole(nx);
  note('Role “'+name+'” created','Undo',function(){var i=ROLES.indexOf(nx);if(i<0)return;roleHolders(nx).forEach(function(r){r.dataset.role='Agent';renderRow(r)});ROLES.splice(i,1);syncRoleOptions();apply();rolesTouched()});
}
function flashRole(x){var tr=$('tr[data-rrow="'+x.id+'"]');if(!tr)return;tr.style.transition='background-color .7s';tr.style.background='#eff6ff';setTimeout(function(){tr.style.background=''},1500)}
$('#reYes').addEventListener('click',saveRole); $('#reX').addEventListener('click',closeRoleEditor); $('#reNo').addEventListener('click',closeRoleEditor);
$('#reB').addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.id==='reName'){e.preventDefault();if(!$('#reYes').disabled)saveRole()}});
function confirmDeleteRole(x){
  var hs=roleHolders(x), n=hs.length;
  showConfirm('Delete role “'+x.name+'”?',n?'<b>'+n+(n===1?' person holds':' people hold')+'</b> this role. They will be moved to <b>Agent</b> and keep their extension, group and numbers. You can undo this for a few seconds.':'No one holds this role. You can undo this for a few seconds after deleting.','Delete role',function(){
    var i=ROLES.indexOf(x), prev=hs.map(function(r){return [r,r.dataset.role]});
    hs.forEach(function(r){r.dataset.role='Agent';renderRow(r);logAct(r,'Moved to Agent — the role '+x.name+' was deleted')});
    ROLES.splice(i,1); syncRoleOptions(); apply(); rolesTouched();
    note('Role “'+x.name+'” deleted'+(n?' · '+n+' moved to Agent':''),'Undo',function(){ROLES.splice(Math.min(i,ROLES.length),0,x);prev.forEach(function(p){p[0].dataset.role=p[1];renderRow(p[0])});syncRoleOptions();apply();rolesTouched();flashRole(x)});
  },true);
}

/* ----- assign people to a role ----- */
var RA=null;
function openAssign(x){RA={x:x,q:'',sel:{}};$('#raSub').innerHTML='Choosing people for <b style="color:#2563eb;font-weight:600">'+esc(x.name)+'</b>';$('#raSearch').value='';renderAssign();rOpen('#radlg')}
function raWhy(r){var d=r.dataset;return d.role==='Account owner'?'Account owner can’t be changed':d.role===RA.x.name?'Already holds this role':''}
function renderAssign(){
  var q=RA.q.trim().toLowerCase();
  var list=rows().filter(function(r){var d=r.dataset;return d.removed!=='1'&&(!q||(d.name+' '+d.email+' '+d.num).toLowerCase().indexOf(q)>-1)})
    .sort(function(a,b){return (raWhy(a)?1:0)-(raWhy(b)?1:0)||a.dataset.name.localeCompare(b.dataset.name)});
  var ok=list.filter(function(r){return !raWhy(r)});
  $('#raList').innerHTML=list.length?list.map(function(r){var d=r.dataset,why=raWhy(r),on=!!RA.sel[d.id];
    return '<label data-h="'+(why?'':'background:#f8fafc;')+'" style="display:flex;align-items:center;gap:14px;padding:10px 12px;border-radius:12px;margin:2px 0;cursor:'+(why?'default':'pointer')+';opacity:'+(why?'.55':'1')+';background:'+(on?'#eff6ff':'transparent')+';transition:background-color .12s">'
      +'<input type="checkbox" data-rasel="'+d.id+'"'+(on?' checked':'')+(why?' disabled':'')+' style="accent-color:#2563eb;width:18px;height:18px;margin:0;cursor:'+(why?'default':'pointer')+'">'
      +avP(r,36)+'<span style="flex:1;min-width:0"><span style="display:block;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(d.name)+'</span><span style="display:block;font-size:12.5px;color:#64748b">Ext : '+esc(d.num||'—')+(why?' · '+why:'')+'</span></span>'
      +'<span style="text-align:right;flex-shrink:0"><span style="display:block;font-size:10.5px;font-weight:700;letter-spacing:.6px;color:#94a3b8;margin-bottom:4px">CURRENT ROLE</span><span style="display:inline-block;font-size:11.5px;font-weight:700;letter-spacing:.3px;color:#1d4ed8;background:#dbeafe;border-radius:6px;padding:3px 9px;text-transform:uppercase">'+esc(d.role)+'</span></span></label>';
  }).join(''):'<div style="text-align:center;color:#64748b;padding:26px 0;font-size:13.5px">No people match “'+esc(RA.q)+'”.</div>';
  var nSel=Object.keys(RA.sel).length, all=$('#raAll');
  all.checked=ok.length>0&&ok.every(function(r){return RA.sel[r.dataset.id]}); all.indeterminate=!all.checked&&ok.some(function(r){return RA.sel[r.dataset.id]}); all.disabled=!ok.length;
  $('#raAllL').textContent='Select all ('+ok.length+')';
  $('#raCount').textContent=nSel?nSel+(nSel===1?' person selected':' people selected'):'Nobody selected yet';
  var y=$('#raYes'); y.disabled=!nSel; y.style.opacity=nSel?'1':'.5'; y.style.cursor=nSel?'pointer':'not-allowed';
}
$('#raSearch').addEventListener('input',function(e){RA.q=e.target.value;renderAssign()});
$('#raAll').addEventListener('change',function(e){var q=RA.q.trim().toLowerCase();rows().forEach(function(r){var d=r.dataset;if(d.removed==='1'||raWhy(r)||(q&&(d.name+' '+d.email+' '+d.num).toLowerCase().indexOf(q)<0))return;if(e.target.checked)RA.sel[d.id]=1;else delete RA.sel[d.id]});renderAssign()});
$('#raList').addEventListener('change',function(e){var id=e.target.getAttribute('data-rasel');if(!id)return;if(e.target.checked)RA.sel[id]=1;else delete RA.sel[id];renderAssign()});
$('#raYes').addEventListener('click',function(){
  var x=RA.x, ppl=Object.keys(RA.sel).map(personById).filter(Boolean); if(!ppl.length)return;
  var prev=ppl.map(function(r){return [r,r.dataset.role]});
  ppl.forEach(function(r){logAct(r,'Role changed from '+r.dataset.role+' to '+x.name);r.dataset.role=x.name;renderRow(r)});
  apply(); rolesTouched(); closeAssign();
  var n=ppl.length;
  note((n===1?ppl[0].dataset.name+' now holds ':n+' people now hold ')+x.name,'Undo',function(){prev.forEach(function(p){p[0].dataset.role=p[1];renderRow(p[0])});apply();rolesTouched()});
});
$('#raX').addEventListener('click',closeAssign); $('#raNo').addEventListener('click',closeAssign);
$('#radlg').addEventListener('mousedown',function(e){if(e.target===$('#radlg'))closeAssign()});
syncRoleOptions();

