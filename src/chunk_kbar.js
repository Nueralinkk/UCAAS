/* ---------- global search (Ctrl K): people, groups and quick actions ---------- */
var KS=$('#gsearch'), kLabel=KS.closest('label'), kp=document.createElement('div'), kItems=[], kSel=0, kOpen=false;
kp.style.cssText='position:fixed;z-index:160;display:none;background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 20px 50px rgba(15,23,42,.18);padding:6px;max-height:min(72vh,540px);overflow-y:auto;box-sizing:border-box';
document.body.appendChild(kp);
var K_ITEM='display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;padding:8px 10px;border-radius:10px;border:0;background:transparent;text-align:left;cursor:pointer;font:inherit;color:#1e293b;';
var K_ACTS=[
  {label:'Invite people',key:'add new person invite',icon:'plus',run:function(){openModal()}},
  {label:'New group',key:'create add department',icon:'users',run:function(){openG(null)}},
  {label:'Import people from CSV',key:'upload bulk file',icon:'upload',run:function(){openImp()}},
  {label:'Export people to CSV',key:'download file',icon:'download',run:function(){exportCSV(rows().filter(function(r){return r.dataset.removed==='0'}))}}
];
function kRank(name,toks){var n=name.toLowerCase();return n.indexOf(toks[0])===0?0:n.split(/\s+/).some(function(w){return w.indexOf(toks[0])===0})?1:2}
function kHL(t,toks){
  if(!toks.length)return esc(t);
  var re=new RegExp('('+toks.map(function(x){return x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}).join('|')+')','ig');
  return t.split(re).map(function(p,i){return i%2?'<b style="color:#0f172a;background:#fef3c7;border-radius:3px">'+esc(p)+'</b>':esc(p)}).join('');
}
function kTile(icon){return '<span style="width:32px;height:32px;border-radius:9px;background:#eef2f7;display:grid;place-items:center;flex-shrink:0">'+ico2(icon,'#475569',16)+'</span>'}
function renderK(){
  var q=KS.value.trim(), toks=q.toLowerCase().split(/\s+/).filter(Boolean), h='', idx=0;
  function has(t){t=t.toLowerCase();return toks.every(function(x){return t.indexOf(x)>-1})}
  var people=[], grps=[], acts=[];
  if(toks.length){
    people=rows().filter(function(r){var d=r.dataset;return d.removed!=='1'&&has([d.name,d.email,d.num,d.num2,d.phone,d.title,d.role,d.group].join(' '))}).sort(function(a,b){return kRank(a.dataset.name,toks)-kRank(b.dataset.name,toks)}).slice(0,5);
    grps=groups.filter(function(g){return has([g.name,g.ext,g.desc,gMgrName(g)].join(' '))}).sort(function(a,b){return kRank(a.name,toks)-kRank(b.name,toks)}).slice(0,4);
  }
  acts=K_ACTS.filter(function(a){return !toks.length||has(a.key+' '+a.label)});
  kItems=[];
  function head(t){return '<div style="'+M_HEAD+'">'+t+'</div>'}
  function item(inner,it){kItems.push(it);return '<button data-kp="'+(idx++)+'" style="'+K_ITEM+'">'+inner+'</button>'}
  var line='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
  if(people.length){
    h+=head('People');
    people.forEach(function(r){var d=r.dataset;
      h+=item(avP(r,32)+'<span style="flex:1;min-width:0"><span style="display:block;font-weight:600;'+line+'">'+kHL(d.name,toks)+'</span><span style="display:block;font-size:12px;color:#64748b;'+line+'">'+kHL((d.title?d.title+' · ':'')+d.email,toks)+'</span></span>'
        +'<span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#64748b;flex-shrink:0">'+ico2('grid','#94a3b8',12)+kHL(d.num||'—',toks)+'</span>',{t:'person',r:r})});
  }
  if(grps.length){
    h+=head('Groups');
    grps.forEach(function(g){var n=gMembers(g).length;
      h+=item(avHTML(gInitials(g.name),AVS[(g.ci+4)%AVS.length],32)+'<span style="flex:1;min-width:0"><span style="display:block;font-weight:600;'+line+'">'+kHL(g.name,toks)+'</span><span style="display:block;font-size:12px;color:#64748b">Ext '+kHL(g.ext,toks)+' · '+n+(n===1?' member':' members')+'</span></span>'
        +'<span style="font-size:11px;font-weight:700;letter-spacing:.4px;color:#64748b;background:#eef2f7;border-radius:6px;padding:2px 7px;flex-shrink:0">GROUP</span>',{t:'group',g:g})});
  }
  if(toks.length&&!people.length&&!grps.length)h+='<div style="padding:14px 12px 8px;color:#64748b;font-size:13.5px">No people or groups match “'+esc(q)+'”.</div>';
  if(acts.length){
    h+=head(toks.length?'Actions':'Quick actions');
    acts.forEach(function(a){h+=item(kTile(a.icon)+'<span style="flex:1;font-weight:500">'+kHL(a.label,toks)+'</span>',{t:'act',a:a})});
  }
  if(toks.length)h+=item(kTile('search')+'<span style="flex:1;min-width:0;'+line+'">Show “'+esc(q)+'” in the People list</span>',{t:'filter',q:q});
  h+='<div style="display:flex;gap:16px;padding:9px 12px 4px;margin-top:4px;border-top:1px solid #eef1f5;font-size:11.5px;color:#94a3b8"><span>↑↓ Navigate</span><span>Enter Open</span><span>Esc Close</span></div>';
  kp.innerHTML=h;
  if(kSel>=kItems.length)kSel=Math.max(0,kItems.length-1);
  paintK();
}
function paintK(){
  $$('[data-kp]',kp).forEach(function(b,i){var on=i===kSel;b.style.background=on?'#eef4ff':'transparent';b.style.boxShadow=on?'inset 3px 0 0 #2563eb':'none';if(on&&b.scrollIntoView){var t=b.offsetTop,bt=kp.scrollTop;if(t<bt)kp.scrollTop=t-30;else if(t+b.offsetHeight>bt+kp.clientHeight)kp.scrollTop=t+b.offsetHeight-kp.clientHeight+8}});
}
function placeK(){
  var r=kLabel.getBoundingClientRect(), w=Math.min(560,innerWidth-16), left=Math.max(8,Math.min(r.left,innerWidth-w-8));
  kp.style.width=w+'px'; kp.style.left=left+'px'; kp.style.top=(r.bottom+8)+'px';
}
function openK(){if(kOpen)return;kOpen=true;kSel=0;kp.style.display='block';placeK();renderK()}
function closeK(){if(!kOpen)return;kOpen=false;kp.style.display='none'}
function kGo(i){
  var it=kItems[i]; if(!it)return;
  closeK(); KS.value=''; KS.blur();
  if(it.t==='person')openPerson(it.r);
  else if(it.t==='group')openDetail(it.g);
  else if(it.t==='act')it.a.run();
  else{q=it.q;$('#psearch').value=q;showView('people');apply()}
}
KS.addEventListener('focus',openK); KS.addEventListener('click',openK);
KS.addEventListener('input',function(){openK();kSel=0;renderK()});
KS.addEventListener('keydown',function(e){
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();openK();if(!kItems.length)return;kSel=(kSel+(e.key==='ArrowDown'?1:-1)+kItems.length)%kItems.length;paintK()}
  else if(e.key==='Enter'){e.preventDefault();openK();kGo(kSel)}
  else if(e.key==='Escape'){closeK();KS.blur()}
});
kp.addEventListener('mousedown',function(e){e.preventDefault()});
kp.addEventListener('click',function(e){var b=e.target.closest('[data-kp]');if(b)kGo(+b.getAttribute('data-kp'))});
kp.addEventListener('mouseover',function(e){var b=e.target.closest('[data-kp]');if(b&&+b.getAttribute('data-kp')!==kSel){kSel=+b.getAttribute('data-kp');paintK()}});
document.addEventListener('mousedown',function(e){if(kOpen&&!kp.contains(e.target)&&!kLabel.contains(e.target))closeK()});
addEventListener('resize',function(){if(kOpen)placeK()});
