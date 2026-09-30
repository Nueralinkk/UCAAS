/* ---------- import people from CSV ---------- */
IC_.upload='<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'; IC_.download='<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>'; IC_.file='<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/>';
var IM={name:'',list:[],missing:[],msg:''}, impOwn=false, IMP_MAX=500;
var IMP_COLS={first:['firstname','first','givenname'],last:['lastname','last','surname','familyname'],email:['email','emailaddress','mail'],phone:['phone','phonenumber','mobile'],role:['role'],ext:['extension','ext'],group:['group','department','team'],title:['title','jobtitle'],reports:['reportsto','manager']};
var IMP_ROLES={'agent':'Agent','supervisor':'Supervisor','group admin':'Group admin'};
function parseCSV(t){
  t=t.replace(/^﻿/,''); var first=t.split(/\r?\n/)[0]||'', d=(first.indexOf(',')<0&&first.indexOf(';')>-1)?';':',';
  var out=[], row=[], f='', q=false, i, c;
  function endRow(){row.push(f);f='';if(row.some(function(x){return x.trim()!==''}))out.push(row);row=[]}
  for(i=0;i<t.length;i++){
    c=t.charAt(i);
    if(q){if(c==='"'){if(t.charAt(i+1)==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;
    else if(c===d){row.push(f);f=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&t.charAt(i+1)==='\n')i++;endRow()}
    else f+=c;
  }
  endRow(); return out;
}
function normHead(h){return h.replace(/\(.*?\)/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function analyseCSV(text){
  var data=parseCSV(text); IM.list=[]; IM.missing=[]; IM.msg='';
  if(data.length<2){IM.msg=data.length?'The file has a header row but no people in it.':'That file looks empty.';return}
  var head=data[0].map(normHead), col={};
  Object.keys(IMP_COLS).forEach(function(k){var i=-1;IMP_COLS[k].some(function(a){i=head.indexOf(a);return i>-1});col[k]=i});
  ['first','last','email'].forEach(function(k){if(col[k]<0)IM.missing.push({first:'First name',last:'Last name',email:'Email'}[k])});
  if(IM.missing.length)return;
  if(data.length-1>IMP_MAX){IM.msg='That file has '+(data.length-1)+' people — import up to '+IMP_MAX+' at a time.';return}
  var usedExt={}, seenEmail={}, exEmail={}, stamp=Date.now();
  rows().forEach(function(r){usedExt[r.dataset.num]=1;exEmail[r.dataset.email.toLowerCase()]=1});
  groups.forEach(function(g){usedExt[g.ext]=1});
  data.slice(1).forEach(function(cells,i){
    function g(k){return col[k]<0?'':String(cells[col[k]]||'').trim()}
    var o={n:i+2,id:'n'+stamp+'_'+i,first:g('first'),last:g('last'),email:g('email'),phone:g('phone'),role:g('role'),ext:g('ext'),group:g('group'),title:g('title'),reports:g('reports'),rid:'',err:''}, em=o.email.toLowerCase(), ph=o.phone.replace(/[\s()-]/g,'');
    if(!o.first)o.err='First name is required';
    else if(!o.last)o.err='Last name is required';
    else if(!em)o.err='Email is required';
    else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em))o.err='Not a valid email address';
    else if(exEmail[em])o.err='Email already in use';
    else if(seenEmail[em])o.err='Same email as row '+seenEmail[em];
    else if(ph&&!/^\+?\d{6,14}$/.test(ph))o.err='Not a valid phone number';
    else if(o.role&&!IMP_ROLES[o.role.toLowerCase()])o.err='Role must be Agent, Supervisor or Group admin';
    else if(o.ext&&!/^\d{3,6}$/.test(o.ext))o.err='Extension must be 3–6 digits';
    else if(o.ext&&usedExt[o.ext])o.err='Extension already in use';
    else if(o.title.length>60)o.err='Title is over 60 characters';
    if(!o.err&&o.group){var gg=groups.filter(function(x){return x.name.toLowerCase()===o.group.toLowerCase()})[0];if(gg)o.group=gg.name;else o.err='Group “'+o.group+'” doesn’t exist'}
    if(!o.err){seenEmail[em]=o.n;if(o.ext)usedExt[o.ext]=1;o.phone=ph;o.role=o.role?IMP_ROLES[o.role.toLowerCase()]:'Agent'}
    IM.list.push(o);
  });
  var nx=2248;
  IM.list.forEach(function(o){if(!o.err&&!o.ext){while(usedExt[String(nx)])nx++;o.ext=String(nx);usedExt[o.ext]=1}});
  /* "Reports to" can point at someone already here, or at another valid row in the same file */
  var byKey={}; rows().forEach(function(r){if(r.dataset.removed!=='1'){byKey[r.dataset.email.toLowerCase()]=r.dataset.id;byKey[r.dataset.name.toLowerCase()]=r.dataset.id}});
  var changed=true, guard=0;
  while(changed&&guard++<60){
    changed=false;
    var fileBy={}, byId={}; IM.list.forEach(function(o){if(!o.err){fileBy[o.email.toLowerCase()]=o;byId[o.id]=o}});
    IM.list.forEach(function(o){
      if(o.err||!o.reports)return;
      var k=o.reports.toLowerCase(), tg=fileBy[k];
      if(tg===o){o.err='A person can’t report to themselves';changed=true}
      else if(tg)o.rid=tg.id;
      else if(byKey[k])o.rid=byKey[k];
      else{o.err='Reports to: nobody found for “'+o.reports+'”';changed=true}
    });
    IM.list.forEach(function(o){
      if(o.err||!o.rid)return; var cur=byId[o.rid], n=0;
      while(cur&&n++<60){if(cur===o){o.err='Reporting loop';changed=true;break}cur=cur.rid?byId[cur.rid]:null}
    });
  }
}
function impBad(){return IM.list.filter(function(o){return o.err})}
function impGood(){return IM.list.filter(function(o){return !o.err})}
function renderImp(){
  var b=$('#iB'), yes=$('#iYes'), good=impGood().length, bad=impBad(), h='';
  var pickBtn='<button data-ipick data-h="text-decoration:underline;" style="border:0;background:none;padding:0;font:inherit;font-size:13.5px;font-weight:600;color:#2563eb;cursor:pointer">Choose another file</button>';
  if(IM.missing.length||IM.msg){
    h='<div style="display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border:1px solid #fecaca;background:#fef2f2;border-radius:12px;color:#991b1b;font-size:14px;line-height:1.5">'+ico2('warn','#dc2626',18)+'<div style="flex:1">'
      +(IM.missing.length?'<b>The file is missing a column: '+IM.missing.join(', ')+'.</b><div style="margin-top:2px;color:#7f1d1d">The first row must name the columns. The template shows how.</div>':'<b>'+esc(IM.msg)+'</b>')+'</div></div>'
      +'<div style="display:flex;gap:18px;margin-top:14px;align-items:center">'+pickBtn+'<button data-itpl data-h="text-decoration:underline;" style="border:0;background:none;padding:0;font:inherit;font-size:13.5px;font-weight:600;color:#2563eb;cursor:pointer">Download the template</button></div>';
  }else if(!IM.list.length){
    h='<div data-idrop style="border:2px dashed #cbd5e1;border-radius:14px;padding:30px 20px;text-align:center;background:#fafbfd">'
      +'<div style="width:44px;height:44px;border-radius:12px;background:#eaf1ff;display:grid;place-items:center;margin:0 auto 10px">'+ico2('upload','#2563eb',22)+'</div>'
      +'<div style="font-weight:600;color:#0f172a">Drop a CSV file here</div><div style="color:#64748b;font-size:13px;margin:2px 0 14px">or</div>'
      +'<button class="ssel" data-ipick style="height:38px;padding:0 18px;font-size:14px">Choose file</button></div>'
      +'<div style="margin-top:16px;font-size:13.5px;color:#475569;line-height:1.6"><div><b style="color:#0f172a">Required:</b> First name, Last name, Email</div><div><b style="color:#0f172a">Optional:</b> Phone, Role, Extension, Group, Title, Reports to (email)</div>'
      +'<div style="color:#64748b;margin-top:4px">Blank extensions are filled in for you. Everyone is invited by email. Up to '+IMP_MAX+' people at a time.</div>'
      +'<button data-itpl data-h="text-decoration:underline;" style="border:0;background:none;padding:0;margin-top:10px;font:inherit;font-size:13.5px;font-weight:600;color:#2563eb;cursor:pointer">Download a template</button></div>';
  }else{
    var show=bad.concat(impGood()).slice(0,200), TH='padding:9px 12px;text-align:left;font-size:11.5px;letter-spacing:.5px;color:#64748b;text-transform:uppercase;font-weight:600;border-bottom:1px solid #eef1f5;background:#fafbfd;position:sticky;top:0;white-space:nowrap';
    h='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:4px 0 12px">'+ico2('file','#64748b',18)+'<b style="color:#0f172a;font-size:14px;word-break:break-all">'+esc(IM.name)+'</b>'
      +'<span style="font-size:12.5px;font-weight:600;color:#15803d;background:#dcfce7;border-radius:999px;padding:3px 10px">'+good+' ready</span>'
      +(bad.length?'<span style="font-size:12.5px;font-weight:600;color:#b91c1c;background:#fee2e2;border-radius:999px;padding:3px 10px">'+bad.length+' need fixing</span>':'')
      +'<span style="margin-left:auto">'+pickBtn+'</span></div>'
      +'<div style="border:1px solid #e8ecf3;border-radius:12px;overflow:auto;max-height:340px"><table style="width:100%;border-collapse:collapse;font-size:13.5px;min-width:560px"><thead><tr><th style="'+TH+'">Row</th><th style="'+TH+'">Name</th><th style="'+TH+'">Email</th><th style="'+TH+'">Role</th><th style="'+TH+'">Group</th><th style="'+TH+'">Result</th></tr></thead><tbody>'
      +show.map(function(o){var TD='padding:9px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top;';
        return '<tr style="background:'+(o.err?'#fff7f7':'#fff')+'"><td style="'+TD+'color:#94a3b8">'+o.n+'</td><td style="'+TD+'font-weight:600;color:#0f172a">'+esc((o.first+' '+o.last).trim()||'—')+'</td><td style="'+TD+'color:#475569;word-break:break-all">'+esc(o.email||'—')+'</td><td style="'+TD+'color:#475569">'+esc(o.role||'Agent')+'</td><td style="'+TD+'color:#475569">'+esc(o.group||'—')+'</td>'
          +'<td style="'+TD+'font-weight:600;color:'+(o.err?'#b91c1c':'#15803d')+'">'+(o.err?esc(o.err):'Ready')+'</td></tr>'}).join('')
      +'</tbody></table></div>'
      +(IM.list.length>200?'<div style="color:#64748b;font-size:12.5px;margin-top:8px">Showing 200 of '+IM.list.length+' rows.</div>':'')
      +(bad.length?'<div style="color:#64748b;font-size:12.5px;line-height:1.5;margin-top:10px">Only the ready rows are imported. Fix the others in your file and import it again.</div>':'');
  }
  b.innerHTML=h;
  yes.textContent=good?'Import '+good+(good===1?' person':' people'):'Import'; yes.style.opacity=good?'1':'.45'; yes.style.pointerEvents=good?'':'none';
}
function openImp(){
  IM={name:'',list:[],missing:[],msg:''}; renderImp();
  impOwn=dOv.style.display!=='block'; dOv.style.display='block'; dOv.style.opacity=1; dOv.style.zIndex=99; closeMenu();
  $('#idlg').style.display='flex';
}
function closeImp(){
  if($('#idlg').style.display!=='flex')return; $('#idlg').style.display='none';
  var other=modal.style.display==='flex'; dOv.style.zIndex=other?94:'';
  if(impOwn&&!other&&drawer.style.display!=='flex'){dOv.style.opacity=0;dOv.style.display='none'}
}
function readImp(f){
  if(!f)return;
  if(f.size>2e6){IM={name:f.name,list:[],missing:[],msg:'That file is too large to import (over 2 MB).'};renderImp();return}
  var rd=new FileReader(); rd.onload=function(){IM={name:f.name,list:[],missing:[],msg:''};analyseCSV(String(rd.result));renderImp()}; rd.readAsText(f);
}
function doImport(){
  var ok=impGood(); if(!ok.length)return;
  var loc=$('#wLoc').value, made=[], base=rows().length, skipped=IM.list.length-ok.length;
  ok.forEach(function(o,i){
    var r=tpl.cloneNode(true);
    Object.assign(r.dataset,{id:o.id,name:o.first+' '+o.last,email:o.email,role:o.role,status:'Invited',group:o.group,loc:loc,city:'Mumbai, India',num:o.ext,num2:'',phone:o.phone,presence:'Offline',login:'',removed:'0',fav:'0',self:'0',av:String(base+i),title:o.title,reports:o.rid,fwd:''});
    $('[data-chk]',r).checked=false; $('[data-favstar]',r).style.display='none'; r.style.display=''; renderRow(r);
    tbody.insertBefore(r,emptyRow); made.push(r);
  });
  closeImp();
  if(tab!=='people')$('[data-tab="people"]').click(); else apply();
  renderGroups(); if(made[0])made[0].scrollIntoView({block:'nearest'});
  note(made.length+(made.length===1?' person':' people')+' imported'+(skipped?' · '+skipped+' skipped':'')+' · invites sent','Undo',function(){made.forEach(function(r){r.remove()});apply();renderGroups()});
}
function downloadFile(name,text){
  var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'text/csv'})); a.download=name; document.body.appendChild(a); a.click(); a.remove();
}
$('#btnImport').addEventListener('click',openImp);
$('#iX').addEventListener('click',closeImp); $('#iNo').addEventListener('click',closeImp); $('#iYes').addEventListener('click',doImport);
$('#idlg').addEventListener('mousedown',function(e){if(e.target===$('#idlg'))closeImp()});
$('#iFile').addEventListener('change',function(e){readImp(e.target.files[0]);e.target.value=''});
$('#idlg').addEventListener('click',function(e){
  if(e.target.closest('[data-ipick]')){$('#iFile').click();return}
  if(e.target.closest('[data-itpl]'))downloadFile('people-template.csv','First name,Last name,Email,Phone,Role,Extension,Group,Title,Reports to (email)\nAsha,Rao,asha.rao@example.com,+919876543210,Agent,,,Support agent,\nVikram,Shah,vikram.shah@example.com,,Supervisor,,,Team lead,asha.rao@example.com\n');
});
$('#idlg').addEventListener('dragover',function(e){var z=e.target.closest&&e.target.closest('[data-idrop]');if(z){e.preventDefault();z.style.borderColor='#2563eb';z.style.background='#f3f7ff'}});
$('#idlg').addEventListener('dragleave',function(e){var z=e.target.closest&&e.target.closest('[data-idrop]');if(z){z.style.borderColor='#cbd5e1';z.style.background='#fafbfd'}});
$('#idlg').addEventListener('drop',function(e){var z=e.target.closest&&e.target.closest('[data-idrop]');if(z){e.preventDefault();readImp(e.dataTransfer.files[0])}});
