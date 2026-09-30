/* ---------- activity log: a real timeline behind "View activity" ---------- */
var ACTLOG={}, adOwn=false;
function logAct(r,text){
  if(!r)return; var id=r.dataset.id, list=ACTLOG[id]=ACTLOG[id]||[];
  list.unshift({t:Date.now(),text:text}); if(list.length>40)list.length=40;
}
function renderActivity(r){
  var d=r.dataset, list=ACTLOG[d.id]||[];
  $('#adT').textContent='Activity · '+d.name;
  if(!list.length){$('#adB').innerHTML='<div style="text-align:center;padding:30px 10px;color:#64748b">No activity recorded yet.</div>';return}
  $('#adB').innerHTML=list.map(function(e){
    return '<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9"><span style="width:30px;height:30px;border-radius:50%;background:#eef2f7;display:grid;place-items:center;flex-shrink:0;color:#475569">'+ico2('history','#475569',15)+'</span><div style="flex:1;min-width:0"><div style="color:#1e293b;font-size:13.5px">'+esc(e.text)+'</div><div style="color:#94a3b8;font-size:12px;margin-top:2px">'+relTime(e.t)+'</div></div></div>';
  }).join('');
}
function openActivity(r){
  renderActivity(r);
  adOwn=dOv.style.display!=='block'; dOv.style.display='block'; dOv.style.opacity=1; dOv.style.zIndex=99; closeMenu();
  $('#adlg').style.display='flex';
}
function closeActivity(){
  if($('#adlg').style.display!=='flex')return; $('#adlg').style.display='none';
  var other=modal.style.display==='flex'; dOv.style.zIndex=other?94:'';
  if(adOwn&&!other&&drawer.style.display!=='flex'){dOv.style.opacity=0;dOv.style.display='none'}
}
$('#aX').addEventListener('click',closeActivity);
$('#adlg').addEventListener('mousedown',function(e){if(e.target===$('#adlg'))closeActivity()});
