
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={awaiting_customer_approval:'Awaiting customer approval',customer_approved:'Customer approved',changes_requested:'Changes requested',approved:'Approved',pending:'Awaiting response'};
const fieldLabels={rfi:'Questions from the drawings',conflicts:'Conflicting drawing details',heatedArea:'Heated floor area',heelHeight:'Truss heel height',mainplates:'Top plates',ewpSupplier:'Engineered wood supplier',drawingStatus:'Drawing status',overallHeight:'Overall height',mainWallHeight:'Main wall height'};
export function renderBomReview({sb,projectId,data,error}){
 let state=data, working=false;
 const drafts=new Map();
 let host=document.getElementById('bom-review');
 if(!host){
  host=document.createElement('section');host.id='bom-review';host.className='card rep bom-review';
  const report=document.getElementById('report');
  if(report)report.insertAdjacentElement('afterend',host);
  else document.querySelector('.shell main').appendChild(host);
 }
 const statusBadge=document.createElement('p');statusBadge.id='bom-approval-status';statusBadge.className='bom-status';
 document.querySelector('.shell main h1').insertAdjacentElement('afterend',statusBadge);
 const draw=()=>{
  if(!state){
   statusBadge.textContent='Customer review unavailable';
   host.innerHTML='<h2>Customer BOM review</h2><p class="err">'+esc(error||'Unable to load review status. Reload to try again.')+'</p>';
   return;
  }
  const responses=new Map((state.responses||[]).map(r=>[r.item_id,r]));
  const responseHtml=id=>{
   const r=responses.get(id);
   return r?'<p class="review-receipt"><strong>'+esc(labels[r.response])+'</strong> · '+esc(r.signer)+' · '+esc(new Date(r.created_at).toLocaleString())+'</p><p class="review-note">'+esc(r.note)+'</p>':'<p class="hint">Awaiting customer response</p>';
  };
  const controls=id=>state.canApprove?'<label class="hint" for="note-'+esc(id)+'">'+(id==='bom'?'Comments (optional when approving)':'Your confirmation / selected specification / requested change')+'</label><textarea id="note-'+esc(id)+'" data-note="'+esc(id)+'" maxlength="4000" rows="3" placeholder="'+(id==='bom'?'Add any comments for your rep':'Explain what you are confirming, or what needs to change')+'">'+esc(drafts.get(id)??responses.get(id)?.note??'')+'</textarea><div class="btnrow"><button type="button" class="primary" data-item="'+esc(id)+'" data-response="approved" '+(working||(id==='bom'&&(state.pending>0||!state.portal?.report?.bom?.length))?'disabled':'')+'>'+(id==='bom'?'Approve BOM':'Approve as shown')+'</button><button type="button" data-item="'+esc(id)+'" data-response="changes_requested" '+(working?'disabled':'')+'>Request changes</button></div>':'';
  statusBadge.innerHTML='<span class="pill '+(state.status==='customer_approved'?'ok':'warn')+'">'+esc(labels[state.status]||state.status)+'</span>';
  host.innerHTML='<div class="rephead"><div><h2>Customer BOM review & approval</h2><p class="hint">Version '+esc(state.version.slice(0,10))+' · '+state.pending+' flagged item'+(state.pending===1?'':'s')+' awaiting approval</p></div><button type="button" data-refresh '+(working?'disabled':'')+'>Refresh status</button></div>'+
   '<p>Review the <a href="#viewer">3D model</a> and <a href="#report">bill of materials</a>, then respond to the items below. Your responses are saved to this job for your rep.</p>'+
   (state.hasPreviousVersion?'<p class="review-banner">This package has changed since an earlier response. Only approvals for the version shown here count.</p>':'')+
   '<p class="hint">Customer approval confirms the materials shown. It is separate from quote approval. Requests to change materials or geometry go to your rep; approval does not recalculate quantities or certify structural design.</p>'+
   (!state.canApprove?'<p class="review-banner">'+(state.staff?'Staff view: customer responses appear here. The customer completes approval using their own login.':'You have view-only access. Ask your rep to enable customer approval for this job.')+'</p>':'')+
   '<div class="review-flags">'+(state.flags||[]).map((f,i)=>'<article class="review-item"><div class="rephead"><h3>'+esc(fieldLabels[f.title]||f.title)+'</h3><span class="pill '+(responses.get(f.id)?.response==='approved'?'ok':'warn')+'">'+esc(labels[responses.get(f.id)?.response||'pending'])+'</span></div><p class="review-detail">'+esc(f.detail)+'</p>'+(f.source?'<p class="hint">Drawing / source: '+esc(f.source)+'</p>':'')+responseHtml(f.id)+controls(f.id)+'</article>').join('')+'</div>'+
   '<article class="review-item review-final"><h3>Approve the complete BOM</h3>'+responseHtml('bom')+(state.pending?'<p class="hint">Approve each flagged item above before approving the complete BOM. You can request changes at any time.</p>':'')+controls('bom')+'</article><p id="review-message" role="status" aria-live="polite"></p>';
  host.querySelectorAll('[data-note]').forEach(el=>el.addEventListener('input',()=>drafts.set(el.dataset.note,el.value)));
  host.querySelector('[data-refresh]').onclick=async()=>{
   working=true;draw();
   const {data,error}=await sb.rpc('portal_get_bom_review',{p_project:projectId});
   working=false;
   if(error){draw();message(error.message,true);return;}
   if(data.version!==state.version){draw();message('The BOM or 3D model changed. Reload the page to review the new version.',true);disableApproval();return;}
   state=data;draw();
  };
  host.querySelectorAll('button[data-response]').forEach(btn=>btn.onclick=async()=>{
   const item=btn.dataset.item, response=btn.dataset.response;
   const note=(drafts.get(item)??responses.get(item)?.note??'').trim();
   if((item!=='bom'||response==='changes_requested')&&note.length<3){message('Enter your confirmation, selected specification, or requested change first.',true);return;}
   working=true;draw();
   let result;
   try{result=await sb.rpc('portal_respond_bom_review',{p_project:projectId,p_version:state.version,p_item:item,p_response:response,p_note:note});}
   catch(e){result={error:e};}
   working=false;
   if(result.error){draw();message(result.error.message||'Could not save. Please try again.',true);if(result.error.code==='40001')disableApproval();return;}
   state=result.data;drafts.delete(item);draw();message(response==='approved'?'Approval saved. Your rep can see it on this job.':'Change request saved for your rep.');
  });
 };
 const message=(text,isError=false)=>{const el=host.querySelector('#review-message');if(el){el.textContent=text;el.className=isError?'err':'okmsg';}};
 const disableApproval=()=>host.querySelectorAll('button[data-response]').forEach(b=>b.disabled=true);
 draw();
}
