/* ---------- quick-view hover card: hover a person's avatar to see them without leaving the page ---------- */
var qvEl=document.createElement('div');
qvEl.style.cssText='position:fixed;z-index:150;display:none;background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 16px 40px rgba(15,23,42,.18);padding:16px;width:300px;box-sizing:border-box;font-size:13.5px;color:#1e293b';
document.body.appendChild(qvEl);
var qvT, qvBtn=null;
function qvField(label,val){return '<div style="display:flex;justify-content:space-between;gap:14px;padding:7px 0;border-top:1px solid #f1f5f9"><span style="color:#64748b;flex-shrink:0">'+label+'</span><span style="font-weight:600;color:#0f172a;text-align:right;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+val+'</span></div>'}
function renderQV(r){
  var d=r.dataset;
  var head='<div style="display:flex;align-items:center;gap:12px">'+avP(r,44)+'<div style="min-width:0;flex:1"><div style="font-weight:700;color:#0f172a;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(d.name)+'</div><div style="font-size:11px;font-weight:700;letter-spacing:.4px;color:#2563eb;margin-top:1px">'+personTag(d.role)+'</div></div></div>';
  var pres='<div style="display:flex;align-items:center;gap:8px;margin-top:12px;padding:8px 10px;border-radius:10px;background:#f8fafc"><span style="width:8px;height:8px;border-radius:50%;background:'+PD[d.presence]+';flex-shrink:0"></span><span style="font-weight:600;color:'+PC[d.presence].t+'">'+esc(d.presence)+'</span><span style="color:#94a3b8;font-size:12px;margin-left:auto;white-space:nowrap">'+esc(PEFF[d.presence])+'</span></div>';
  var rows=qvField('Email',esc(d.email))+qvField('Phone',esc(d.phone||'')||'—')+qvField('Extension',esc(d.num||'')||'—')+qvField('Group',d.group?esc(d.group):'—');
  return head+pres+'<div style="margin-top:2px">'+rows+'</div>'+(d.removed==='1'?'<div style="margin-top:10px;padding:8px 10px;border-radius:10px;background:#fef2f2;color:#b91c1c;font-size:12.5px;font-weight:600">Removed from the directory</div>':'');
}
function placeQV(el){
  var r=el.getBoundingClientRect(), w=300, h=qvEl.offsetHeight;
  var left=Math.max(8,Math.min(r.left,innerWidth-w-8)), top=r.bottom+8;
  if(top+h>innerHeight-8)top=Math.max(8,r.top-h-8);
  qvEl.style.left=left+'px'; qvEl.style.top=top+'px';
}
function showQV(el,r){qvBtn=el; qvEl.innerHTML=renderQV(r); qvEl.style.display='block'; placeQV(el)}
function hideQV(){clearTimeout(qvT); qvEl.style.display='none'; qvBtn=null}
function qvPerson(t){return t.hasAttribute('data-person')?t.closest('tr[data-row]'):personById(t.getAttribute('data-pp'))}
document.addEventListener('mouseover',function(e){
  var t=e.target.closest&&e.target.closest('[data-person],[data-pp]'); clearTimeout(qvT);
  if(!t){hideQV();return}
  if(t===qvBtn)return;
  qvT=setTimeout(function(){var r=qvPerson(t);if(r)showQV(t,r)},320);
});
document.addEventListener('click',hideQV,true);
addEventListener('scroll',hideQV,true);
