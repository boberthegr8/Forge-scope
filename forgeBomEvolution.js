(() => {
  let installed=false;

  function q(v){ return typeof esc==='function' ? esc(v??'') : String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function normalizeRow(x={}){
    const action=String(x.action||'KEEP').toUpperCase();
    const unit=x.unit||x.newUnit||x.oldUnit||'';
    let oldQty=x.oldQuantity ?? x.oldQty ?? x.bomQty ?? x.originalQuantity ?? '';
    let newQty=x.newQuantity ?? x.newQty ?? x.quantity ?? x.recommendedQty ?? '';
    if(action==='ADD' && (oldQty===''||oldQty==null)) oldQty=0;
    if(action==='REMOVE' && (newQty===''||newQty==null)) newQty=0;
    return {
      category:x.category||'Other',
      location:x.location||x.whereUsed||x.assembly||x.wall||x.zone||'LOCATION REQUIRED',
      material:x.material||x.item||'',
      oldQty,
      oldUnit:x.oldUnit||unit,
      newQty,
      newUnit:x.newUnit||unit,
      action,
      reason:x.changeReason||x.reason||'',
      source:x.source||'—',
      confidence:x.confidence||''
    };
  }

  function qty(qty,unit){ return qty===''||qty==null ? '—' : `${q(qty)}${unit?' '+q(unit):''}`; }

  function installPromptRules(){
    if(typeof buildBomComparePrompt!=='function' || buildBomComparePrompt.__forgeLocationV2) return;
    const base=buildBomComparePrompt;
    const wrapped=function(){
      return base()+`\n\nFORGE BOM REVISION RULES — REQUIRED\n\nThe estimator must be able to compare the ORIGINAL BOM directly against the CORRECTED BOM. Do not return only a list of missing components.\n\nFor every material in correctedBOM, return these fields:\n- category\n- location\n- material\n- oldQuantity\n- oldUnit\n- newQuantity\n- newUnit\n- action: KEEP / ADD / REMOVE / CHANGE\n- changeReason\n- source\n- confidence\n\nLOCATION IS MANDATORY on every correctedBOM row. State where the material is used in the building. Prefer specific construction locations/tags from the drawings such as Basement — Wall Load, Main Floor — Floor Load, Main Floor — Exterior Walls, Second Floor — Wall Load, Roof, North/South/East/West Elevation, W1/W2 wall tags, Gable End, Porch, Garage, Header H1, Opening W3, etc. If one material serves multiple locations, split it into separate correctedBOM rows whenever the evidence supports the split. Do not hide location inside the material description.\n\nOLD VS NEW IS MANDATORY. oldQuantity must represent the uploaded/original BOM quantity for that same material/location where available. newQuantity must represent the evidence-supported corrected requirement. For a newly discovered missing item use oldQuantity=0. For a removed item use newQuantity=0. For unchanged items keep both quantities the same. If the old BOM combines several locations and cannot be reliably split, preserve the old total, identify the applicable location as specifically as possible, and explain the allocation issue in changeReason. Never invent a split.\n\nThe correctedBOM must be the COMPLETE evidence-supported NEW WORKING BOM, not just changes. It must include confirmed unchanged material, additions, removals/zeroed items where useful for audit, and corrected quantities/specs. The table should let a reviewer understand what the old BOM said, what Forge now recommends, why it changed, and exactly where the material goes.\n\nAlso add a top-level array named bomDelta using this schema:\n\"bomDelta\":[{\"location\":\"specific building location\",\"material\":\"material description\",\"oldQuantity\":\"original qty\",\"newQuantity\":\"corrected qty\",\"unit\":\"pcs/LF/sheets/etc\",\"action\":\"KEEP/ADD/REMOVE/CHANGE\",\"reason\":\"why\",\"source\":\"sheet/detail\",\"confidence\":\"High/Medium/Low\"}]\n\nBefore responding, verify that EVERY correctedBOM row has a non-empty location and both oldQuantity and newQuantity values or an explicit TBC where evidence cannot support a number.`;
    };
    wrapped.__forgeLocationV2=true;
    buildBomComparePrompt=wrapped;
  }

  function installTables(){
    if(typeof correctedBomTable==='function' && !correctedBomTable.__forgeLocationV2){
      const fn=function(items){
        const rows=(items||[]).map(normalizeRow);
        return `<section><div class="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-2"><div><h3 class="text-[.69rem] font-extrabold uppercase tracking-wider text-slate-500">New Working BOM — Old vs New</h3><div class="text-xs text-slate-400 mt-1">Every material is tagged to where it goes in the building.</div></div><span class="text-[.69rem] text-slate-400">Evidence-supported quantities only</span></div><div class="border border-slate-200 rounded-xl overflow-x-auto"><table class="w-full min-w-[1100px]"><thead class="bg-slate-50 text-slate-400 uppercase tracking-wider"><tr><th class="px-3 py-2 text-left">Location</th><th class="px-3 py-2 text-left">Material</th><th class="px-3 py-2 text-left">Old BOM</th><th class="px-3 py-2 text-left">New BOM</th><th class="px-3 py-2 text-left">Change</th><th class="px-3 py-2 text-left">Reason</th><th class="px-3 py-2 text-left">Source</th></tr></thead><tbody class="divide-y divide-slate-100">${rows.map(r=>`<tr class="align-top"><td class="px-3 py-2 font-bold ${r.location==='LOCATION REQUIRED'?'text-rose-700':'text-slate-700'}"><div>${q(r.location)}</div><div class="text-[10px] uppercase tracking-wide text-slate-400 mt-1">${q(r.category)}</div></td><td class="px-3 py-2 font-semibold text-slate-800">${q(r.material)}</td><td class="px-3 py-2 text-slate-600">${qty(r.oldQty,r.oldUnit)}</td><td class="px-3 py-2 font-bold text-slate-900">${qty(r.newQty,r.newUnit)}</td><td class="px-3 py-2"><span class="inline-flex px-2 py-1 rounded-full text-[10px] font-extrabold ${r.action==='ADD'?'bg-indigo-50 text-indigo-700':r.action==='REMOVE'?'bg-rose-50 text-rose-700':r.action==='CHANGE'?'bg-violet-50 text-violet-700':'bg-emerald-50 text-emerald-700'}">${q(r.action)}</span></td><td class="px-3 py-2 text-slate-600">${q(r.reason||'—')}</td><td class="bom-source px-3 py-2">${q(r.source)}${r.confidence?`<div class="mt-1 font-semibold">${q(r.confidence)}</div>`:''}</td></tr>`).join('')}</tbody></table></div></section>`;
      };
      fn.__forgeLocationV2=true;
      correctedBomTable=fn;
    }

    if(typeof bomActionTable==='function' && !bomActionTable.__forgeLocationV2){
      const fn=function(title,items,tone){
        const cls=({rose:'text-rose-700',emerald:'text-emerald-700',indigo:'text-indigo-700',violet:'text-violet-700',amber:'text-amber-700'})[tone]||'text-slate-600';
        return `<section><h3 class="text-[.69rem] font-extrabold uppercase tracking-wider ${cls} mb-2">${title}</h3><div class="border border-slate-200 rounded-xl overflow-x-auto"><table class="w-full min-w-[950px]"><thead class="bg-slate-50 text-slate-400 uppercase tracking-wider"><tr><th class="px-3 py-2 text-left">Location</th><th class="px-3 py-2 text-left">Item</th><th class="px-3 py-2 text-left">Old BOM</th><th class="px-3 py-2 text-left">Recommended</th><th class="px-3 py-2 text-left">Reason / Source</th></tr></thead><tbody class="divide-y divide-slate-100">${(items||[]).map(x=>{const old=x.oldQuantity??x.oldQty??x.bomQty??x.bomSpec??'—';const rec=x.newQuantity??x.newQty??x.recommendedQty??x.requiredSpec??x.planRequirement??x.question??'—';const loc=x.location||x.whereUsed||x.assembly||'Location not returned';return `<tr class="align-top"><td class="px-3 py-2 font-bold text-slate-700">${q(loc)}</td><td class="px-3 py-2 font-semibold text-slate-800">${q(x.item||x.material||'Item')}</td><td class="px-3 py-2 text-slate-600">${q(old)}</td><td class="px-3 py-2 font-semibold text-slate-800">${q(rec)}</td><td class="px-3 py-2 text-slate-600">${q(x.reason||'')}${x.source?`<div class="bom-source mt-1">${q(x.source)}${x.confidence?' • '+q(x.confidence):''}</div>`:''}</td></tr>`;}).join('')}</tbody></table></div></section>`;
      };
      fn.__forgeLocationV2=true;
      bomActionTable=fn;
    }
  }

  function installTextExport(){
    if(typeof bomComparisonText!=='function' || bomComparisonText.__forgeLocationV2) return;
    const base=bomComparisonText;
    const fn=function(){
      let out=base();
      const r=(typeof bomCompareState!=='undefined' ? bomCompareState.result : null) || (typeof current!=='undefined' ? current?.bomComparison?.result : null) || {};
      if((r.correctedBOM||[]).length){
        out+='\n\nNEW BOM — OLD VS NEW BY LOCATION\n';
        r.correctedBOM.map(normalizeRow).forEach(x=>{ out+=`• ${x.location} — ${x.material} — OLD: ${x.oldQty||0} ${x.oldUnit||''} — NEW: ${x.newQty||'TBC'} ${x.newUnit||''} — ${x.action}${x.reason?' — '+x.reason:''}${x.source?' — '+x.source:''}\n`; });
      }
      return out;
    };
    fn.__forgeLocationV2=true;
    bomComparisonText=fn;
  }

  window.installForgeBomEvolution=function(){
    if(installed) return;
    installPromptRules();
    installTables();
    installTextExport();
    installed=true;
  };
})();