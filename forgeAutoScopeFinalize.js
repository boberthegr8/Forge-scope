(() => {
  const KEY='forge-auto-finalize-style';
  const escHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const escCsv=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const numish=v=>String(v??'').trim();

  function report(){ return (typeof current!=='undefined' && current?.autoScopeAI?.report) || null; }
  function sourceRows(){
    const r=report();
    return (r?.recommendedBOM || r?.correctedBOM || []).map((x,index)=>({
      id:index,
      location:x.location||'Location TBC',
      category:x.category||'Other',
      material:x.material||x.item||'',
      oldQty:x.oldQty??'',
      newQty:x.newQty??x.quantity??'TBC',
      unit:x.unit||'',
      change:x.change||x.action||'KEEP',
      reason:x.reason||'',
      source:x.source||'',
      confidence:x.confidence||''
    }));
  }
  function state(){
    if(typeof current==='undefined'||!current) return null;
    current.autoScopeAI=current.autoScopeAI||{};
    const rows=sourceRows();
    const old=current.autoScopeAI.approval;
    if(!old || old.sourceCount!==rows.length){
      current.autoScopeAI.approval={
        sourceCount:rows.length,
        rows:rows.map(x=>({status:'pending',location:x.location,category:x.category,material:x.material,newQty:x.newQty,unit:x.unit,note:''})),
        approvedBOM:[],
        status:'AI DRAFT',
        updatedAt:new Date().toISOString()
      };
    }
    return current.autoScopeAI.approval;
  }
  function persist(){
    const s=state(); if(!s)return;
    s.updatedAt=new Date().toISOString();
    if(typeof upsertCurrent==='function') upsertCurrent();
  }
  function safeRow(row){
    const q=String(row.newQty??'').toUpperCase();
    const loc=String(row.location||'').toUpperCase();
    const change=String(row.change||'').toUpperCase();
    return !q.includes('TBC')&&!q.includes('VERIFY')&&!loc.includes('TBC')&&!change.includes('VERIFY')&&change!=='REMOVE';
  }
  function approvedRows(){
    const rows=sourceRows(),s=state(); if(!s)return[];
    return rows.map((src,i)=>({...src,...(s.rows[i]||{})})).filter(x=>x.status==='approved' && String(x.change||'').toUpperCase()!=='REMOVE');
  }
  function installStyles(){
    if(document.getElementById(KEY))return;
    const st=document.createElement('style');st.id=KEY;st.textContent=`
      .auto-final{margin-top:18px;border:1px solid rgba(255,118,23,.22);background:linear-gradient(180deg,rgba(255,118,23,.055),rgba(15,17,21,.25));border-radius:14px;padding:18px}
      .auto-final-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:12px}.auto-final-head h3{margin:3px 0 5px;font-size:20px}.auto-final-head p{margin:0;color:#9ca3af;font-size:13px}
      .auto-final-status{border:1px solid #374151;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:900;letter-spacing:.08em;white-space:nowrap}.auto-final-status.approved{color:#86efac;border-color:rgba(134,239,172,.35);background:rgba(134,239,172,.07)}
      .auto-review-tools{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.auto-review-tools button,.auto-final-actions button{min-height:42px;padding:9px 13px;border-radius:9px;border:1px solid #343840;background:#17191e;color:#f3f4f6;font-weight:750;cursor:pointer}.auto-review-tools button.primary,.auto-final-actions button.primary{background:#ff7617;color:#111;border-color:#ff7617}
      .auto-review-list{display:grid;gap:9px}.auto-review-row{display:grid;grid-template-columns:minmax(150px,1.2fr) minmax(180px,1.7fr) 95px 80px 118px;gap:8px;align-items:center;border:1px solid #2b2f36;border-radius:11px;padding:10px;background:#111318}.auto-review-row.approved{border-color:rgba(134,239,172,.27)}.auto-review-row.rejected{opacity:.6}.auto-review-row input,.auto-review-row select{width:100%;min-height:38px;border-radius:8px;border:1px solid #343840;background:#0c0e12;color:#f3f4f6;padding:7px 8px}.auto-review-meta{grid-column:1/-1;color:#7f8792;font-size:11px;display:flex;gap:10px;flex-wrap:wrap}.auto-review-meta b{color:#b9c0ca}
      .auto-final-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.auto-approved-wrap{margin-top:18px;border-top:1px solid #2b2f36;padding-top:16px}.auto-approved-wrap h4{margin:0 0 10px}.auto-approved-table{width:100%;border-collapse:collapse;font-size:13px}.auto-approved-table th,.auto-approved-table td{text-align:left;padding:8px;border-bottom:1px solid #282c33}.auto-approved-table th{color:#8f96a1;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
      .auto-final-note{margin-top:10px;color:#8f96a1;font-size:12px}
      @media(max-width:850px){.auto-final{padding:13px}.auto-final-head{display:block}.auto-final-status{display:inline-block;margin-top:10px}.auto-review-row{grid-template-columns:1fr 1fr}.auto-review-row .mat{grid-column:1/-1}.auto-review-row .status{grid-column:1/-1}.auto-review-meta{grid-column:1/-1}.auto-review-tools,.auto-final-actions{display:grid;grid-template-columns:1fr}.auto-review-tools button,.auto-final-actions button{width:100%;min-height:48px}.auto-approved-table thead{display:none}.auto-approved-table,.auto-approved-table tbody,.auto-approved-table tr,.auto-approved-table td{display:block;width:100%}.auto-approved-table tr{border:1px solid #2b2f36;border-radius:10px;margin:8px 0;padding:8px}.auto-approved-table td{display:grid;grid-template-columns:110px 1fr;gap:8px;border:0;padding:5px}.auto-approved-table td:before{content:attr(data-label);color:#7f8792;font-size:11px;font-weight:800;text-transform:uppercase}}
      @media print{.auto-review-tools,.auto-final-actions,.auto-review-list,.no-print{display:none!important}.auto-final{border:0;background:#fff;color:#111;padding:0}.auto-final-head p,.auto-final-note{color:#444}.auto-approved-table th,.auto-approved-table td{color:#111;border-color:#bbb}}
    `;document.head.appendChild(st);
  }
  function rowHtml(src,i){
    const s=state(),r=s?.rows?.[i]||{},st=r.status||'pending';
    return `<div class="auto-review-row ${escHtml(st)}">
      <input aria-label="Location" value="${escHtml(r.location??src.location)}" onchange="autoFinalField(${i},'location',this.value)">
      <input class="mat" aria-label="Material" value="${escHtml(r.material??src.material)}" onchange="autoFinalField(${i},'material',this.value)">
      <input aria-label="Quantity" value="${escHtml(r.newQty??src.newQty)}" onchange="autoFinalField(${i},'newQty',this.value)">
      <input aria-label="Unit" value="${escHtml(r.unit??src.unit)}" onchange="autoFinalField(${i},'unit',this.value)">
      <select class="status" aria-label="Estimator decision" onchange="autoFinalStatus(${i},this.value)"><option value="pending" ${st==='pending'?'selected':''}>Review</option><option value="approved" ${st==='approved'?'selected':''}>Approve</option><option value="rejected" ${st==='rejected'?'selected':''}>Reject</option></select>
      <div class="auto-review-meta"><span><b>${escHtml(src.change)}</b> · Old: ${escHtml(src.oldQty||'—')} ${escHtml(src.unit)}</span><span>${escHtml(src.reason||'')}</span><span>${escHtml(src.source||'')}</span></div>
    </div>`;
  }
  function approvedTable(){
    const s=state(); if(!s?.approvedBOM?.length)return'';
    return `<div class="auto-approved-wrap"><h4>Estimator Approved BOM</h4><table class="auto-approved-table"><thead><tr><th>Location</th><th>Category</th><th>Material</th><th>Qty</th><th>Unit</th></tr></thead><tbody>${s.approvedBOM.map(x=>`<tr><td data-label="Location">${escHtml(x.location)}</td><td data-label="Category">${escHtml(x.category)}</td><td data-label="Material"><b>${escHtml(x.material)}</b></td><td data-label="Qty">${escHtml(x.quantity)}</td><td data-label="Unit">${escHtml(x.unit)}</td></tr>`).join('')}</tbody></table><div class="auto-final-note">This list is the estimator-approved output. AI draft rows that were rejected, removed, or left in Review are not included.</div></div>`;
  }
  function panel(){
    const r=report();if(!r)return'';const rows=sourceRows(),s=state();const approved=s.rows.filter(x=>x.status==='approved').length,rejected=s.rows.filter(x=>x.status==='rejected').length,pending=s.rows.length-approved-rejected;
    return `<section id="auto-finalize" class="auto-final"><div class="auto-final-head"><div><div class="auto-kicker">FINAL ESTIMATOR REVIEW</div><h3>Approve the New BOM</h3><p>AI creates the draft. You control the final material list before it leaves Automatic Scope.</p></div><span class="auto-final-status ${s.status==='ESTIMATOR APPROVED'?'approved':''}">${escHtml(s.status)}</span></div><div class="auto-metrics"><div><span>Approved</span><b>${approved}</b></div><div><span>Review</span><b>${pending}</b></div><div><span>Rejected</span><b>${rejected}</b></div><div><span>Final BOM</span><b>${s.approvedBOM.length}</b></div></div><div class="auto-review-tools no-print"><button onclick="autoFinalApproveSafe()">Approve all clear lines</button><button onclick="autoFinalSetAll('approved')">Approve all</button><button onclick="autoFinalSetAll('pending')">Reset to Review</button></div><div class="auto-review-list">${rows.map(rowHtml).join('')}</div><div class="auto-final-actions no-print"><button class="primary" onclick="autoFinalBuild()">Build Approved BOM</button><button onclick="autoFinalExportCsv()">Export Approved BOM CSV</button><button onclick="window.print()">Print / Save PDF</button></div>${approvedTable()}</section>`;
  }
  function mount(){
    if(typeof view!=='undefined' && view!=='autoScopeAI')return;
    const result=document.querySelector('.auto-result');if(!result)return;
    document.getElementById('auto-finalize')?.remove();
    result.insertAdjacentHTML('afterend',panel());
  }
  function rerender(){ persist(); mount(); }

  window.autoFinalField=(i,k,v)=>{const s=state();if(!s?.rows?.[i])return;s.rows[i][k]=v;s.status='AI DRAFT';s.approvedBOM=[];rerender();};
  window.autoFinalStatus=(i,v)=>{const s=state();if(!s?.rows?.[i])return;s.rows[i].status=v;s.status='AI DRAFT';s.approvedBOM=[];rerender();};
  window.autoFinalSetAll=v=>{const s=state();if(!s)return;s.rows.forEach(x=>x.status=v);s.status='AI DRAFT';s.approvedBOM=[];rerender();};
  window.autoFinalApproveSafe=()=>{const s=state(),rows=sourceRows();if(!s)return;rows.forEach((x,i)=>{if(safeRow(x))s.rows[i].status='approved';});s.status='AI DRAFT';s.approvedBOM=[];rerender();};
  window.autoFinalBuild=()=>{const s=state();if(!s)return;const rows=approvedRows();s.approvedBOM=rows.map(x=>({location:x.location||'Location TBC',category:x.category||'Other',material:x.material||'',quantity:numish(x.newQty)||'TBC',unit:x.unit||'',source:x.source||'',confidence:x.confidence||''}));s.status=s.approvedBOM.length?'ESTIMATOR APPROVED':'AI DRAFT';s.approvedAt=s.approvedBOM.length?new Date().toISOString():null;persist();mount();if(typeof notifySaved==='function'&&s.approvedBOM.length)notifySaved(`Approved BOM built: ${s.approvedBOM.length} lines`);};
  window.autoFinalExportCsv=()=>{const s=state();if(!s?.approvedBOM?.length){alert('Build the Approved BOM first.');return;}const head=['Location','Category','Material','Quantity','Unit','Source','Confidence'];const lines=[head.map(escCsv).join(','),...s.approvedBOM.map(x=>[x.location,x.category,x.material,x.quantity,x.unit,x.source,x.confidence].map(escCsv).join(','))];const blob=new Blob([lines.join('\r\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${String(current?.fields?.projectName?.value||'Forge-Automatic-Scope').replace(/[^a-z0-9_-]+/gi,'-')}-Approved-BOM.csv`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},300);};

  function install(){
    if(window.__forgeAutoFinalizeInstalled){mount();return;}window.__forgeAutoFinalizeInstalled=true;installStyles();
    if(typeof render==='function'){
      const prior=render;render=function forgeAutoFinalizeRenderWrapper(){prior();setTimeout(mount,0);};
    }
    const observer=new MutationObserver(()=>{if(document.querySelector('.auto-result')&&!document.getElementById('auto-finalize'))mount();});observer.observe(document.body,{childList:true,subtree:true});
    mount();
  }
  window.installForgeAutoScopeFinalize=install;
  install();
})();