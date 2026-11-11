import {core} from './core-client.js';
const FN='https://uyqanhwurngoupmvzxrh.supabase.co/functions/v1/portal-admin';
const KEY='sb_publishable_SquKrj848EoO9NHZknVkSA_k8CKD7WQ';
const JOB='https://scope.forgehub.dev/job.html';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let projects=[];
function notice(m,err=false){$('notice').textContent=m;$('notice').className=err?'error':'';}
async function call(action,args={}){
  const {data:{session}}=await core.auth.getSession();
  if(!session) throw new Error('Signed out. Reload to sign in.');
  const r=await fetch(FN,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token,'apikey':KEY},body:JSON.stringify({action,...args})});
  const j=await r.json().catch(()=>({error:'Unexpected response'}));
  if(!r.ok||j.error) throw new Error(j.error||('Error '+r.status));
  return j;
}
async function busy(btn,work){btn.disabled=true;try{await work();}catch(e){notice(e.message,true);}finally{btn.disabled=false;}}
const when=d=>d?new Date(d).toLocaleString('en-CA',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'never';

async function loadProjects(){
  const j=await call('projects'); projects=j.projects||[];
  $('jobs').innerHTML=projects.length?projects.map(p=>`<label><input type="checkbox" value="${p.id}">${esc(p.name)}</label>`).join(''):'<p class="hint">No jobs yet. Create one in Scope first.</p>';
}
async function loadList(){
  const j=await call('list'); const cs=j.customers||[];
  const opts=projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  $('list').innerHTML=cs.length?cs.map(c=>`<div class="cust" data-user="${c.user_id||''}" data-email="${esc(c.email)}">
    <div class="cust-top"><div><b>${esc(c.name||c.email)}</b><small>${esc(c.email)} · last sign-in ${esc(when(c.last_sign_in_at))}</small></div>
      <div class="cust-actions">${c.user_id?`<button class="ghost" data-act="pw">Set password</button><button class="ghost" data-act="addjob">Add job</button>`:'<span class="pill">Invite only, no password yet</span>'}</div></div>
    ${c.jobs.map(g=>`<div class="job${g.status!=='active'?' off':''}"><a href="${JOB}?p=${g.project_id}" target="_blank" rel="noopener">${esc(g.name)}</a>
      <span class="cust-actions"><label class="check"><input type="checkbox" data-act="approve" data-grant="${g.grant_id}" ${g.can_approve?'checked':''}>Can approve BOM & quotes</label>
      ${g.status==='active'?`<button class="ghost" data-act="revoke" data-grant="${g.grant_id}">Remove access</button>`:`<button class="ghost" data-act="restore" data-grant="${g.grant_id}">Restore</button>`}</span></div>`).join('')}
    <div class="inline" data-box="pw" hidden><input type="password" placeholder="New password (8+ characters)" minlength="8" maxlength="72" autocomplete="new-password"><button class="primary" data-act="savepw">Save password</button></div>
    <div class="inline" data-box="addjob" hidden><select>${opts}</select><button class="primary" data-act="savejob">Give access</button></div>
  </div>`).join(''):'<p class="hint">No customer logins yet. Add one on the left.</p>';
}
$('list').addEventListener('click',e=>{
  const b=e.target.closest('button[data-act]'); if(!b) return;
  const card=b.closest('.cust'), uid=card.dataset.user, act=b.dataset.act;
  if(act==='pw'||act==='addjob'){const box=card.querySelector(`[data-box="${act}"]`);box.hidden=!box.hidden;if(!box.hidden)box.querySelector('input,select').focus();return;}
  if(act==='savepw') return busy(b,async()=>{const v=card.querySelector('[data-box="pw"] input').value;await call('set_password',{user_id:uid,password:v});notice('Password updated for '+card.dataset.email+'. Send it to them.');card.querySelector('[data-box="pw"]').hidden=true;});
  if(act==='savejob') return busy(b,async()=>{await call('grant',{user_id:uid,project_id:card.querySelector('[data-box="addjob"] select').value,can_approve:true});notice('Access added.');await loadList();});
  if(act==='revoke'||act==='restore') return busy(b,async()=>{await call(act,{grant_id:b.dataset.grant});notice(act==='revoke'?'Access removed.':'Access restored.');await loadList();});
});
$('list').addEventListener('change',e=>{
  const i=e.target.closest('input[data-act="approve"]'); if(!i) return;
  call('set_approve',{grant_id:i.dataset.grant,can_approve:i.checked}).then(()=>notice('Saved.')).catch(err=>{i.checked=!i.checked;notice(err.message,true);});
});
$('showpw').addEventListener('click',()=>{const p=$('password');p.type=p.type==='password'?'text':'password';$('showpw').textContent=p.type==='password'?'Show':'Hide';});
$('add').addEventListener('submit',e=>{e.preventDefault();busy($('create'),async()=>{
  const email=$('email').value.trim(), password=$('password').value, name=$('name').value.trim();
  const ids=[...$('jobs').querySelectorAll('input:checked')].map(i=>i.value);
  if(!ids.length) throw new Error('Pick at least one job.');
  const r=await call('create',{email,password,name,project_ids:ids,can_approve:$('approve').checked});
  const link=ids.length===1?`${JOB}?p=${ids[0]}`:JOB;
  $('sendtext').textContent=`Hi${name?' '+name.split(/[ ,]/)[0]:''}, your J&K job page is ready.\n\nOpen: ${link}\nEmail: ${email}\nPassword: ${password}\n\nYou'll see your 3D framing model, scope of work and quote. Call me with any questions.\nRob Flagg, J&K Home Building Centre, 519-753-3114 ext. 112`;
  $('sendbox').hidden=false;
  notice((r.created?'Login created for ':'Login updated for ')+email+'.');
  $('password').value='';
  await loadList();
});});
$('copysend').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('sendtext').textContent);$('copysend').textContent='Copied';}catch{}});
$('reload').addEventListener('click',()=>busy($('reload'),loadList));

(async()=>{
  const {data}=await core.auth.getSession();
  if(!data?.session){location.replace('https://app.forgehub.dev/account.html?returnTo='+encodeURIComponent(location.href));return;}
  try{ await loadProjects(); await loadList(); $('app').hidden=false; notice('Signed in as '+data.session.user.email); }
  catch(e){ notice(e.message,true); }
})();
