from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')

if 'function bomCompareView()' in text:
    print('BOM Compare already applied.')
    raise SystemExit(0)

# 1) Compact comparison styles.
css_anchor = "    .scope-summary .summary-source { font-size: .69rem; line-height: 1rem; color: #94a3b8; }\n"
css_add = css_anchor + """    .bom-result { font-size: 92%; }
    .bom-result table { font-size: .805rem; line-height: 1.25rem; }
    .bom-result th { font-size: .65rem; line-height: .9rem; }
    .bom-result .bom-source { font-size: .69rem; line-height: 1rem; color: #94a3b8; }
"""
if css_anchor not in text:
    raise RuntimeError('Could not find summary CSS anchor')
text = text.replace(css_anchor, css_add, 1)

# 2) Global state.
state_anchor = "let searchTerm = '';\n"
state_add = state_anchor + """let bomCompareState = { bom:null, plans:[], result:null, loading:false, error:'', status:'' };
let geminiSessionKey = '';
let geminiCompareModel = 'gemini-3.7-flash';
"""
if state_anchor not in text:
    raise RuntimeError('Could not find global state anchor')
text = text.replace(state_anchor, state_add, 1)

# 3) Sidebar nav.
nav_anchor = "      ${navBtn('ai','sparkles','AI Import')}\n"
nav_add = nav_anchor + "      ${navBtn('bom','scan-search','Compare to BOM')}\n"
if nav_anchor not in text:
    raise RuntimeError('Could not find AI nav anchor')
text = text.replace(nav_anchor, nav_add, 1)

# 4) Page title.
title_old = "function pageTitle(){ return ({dashboard:'Dashboard',new:'New Scope',saved:'Saved Scopes',barns:'Barn Templates',sheds:'Shed Templates',decks:'Deck Templates',editor:'Scope Worksheet',summary:'Scope Summary',ai:'AI Assisted Entry'})[view] || 'Forge Scope'; }"
title_new = "function pageTitle(){ return ({dashboard:'Dashboard',new:'New Scope',saved:'Saved Scopes',barns:'Barn Templates',sheds:'Shed Templates',decks:'Deck Templates',editor:'Scope Worksheet',summary:'Scope Summary',ai:'AI Assisted Entry',bom:'Compare to BOM'})[view] || 'Forge Scope'; }"
if title_old not in text:
    raise RuntimeError('Could not find pageTitle()')
text = text.replace(title_old, title_new, 1)

# 5) Render route.
render_anchor = "  else if(view==='ai') content=aiView();\n"
render_add = render_anchor + "  else if(view==='bom') content=bomCompareView();\n"
if render_anchor not in text:
    raise RuntimeError('Could not find render AI route')
text = text.replace(render_anchor, render_add, 1)

# 6) Add compare button to editor top bar.
editor_anchor = "${icon('download','w-4 h-4')} AI Prompt</button></div></div></div>\n  <div class=\"space-y-6\">"
editor_replace = "${icon('download','w-4 h-4')} AI Prompt</button><button onclick=\"view='bom';render()\" class=\"px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-sm flex items-center gap-2\">${icon('scan-search','w-4 h-4')} Compare BOM</button></div></div></div>\n  <div class=\"space-y-6\">"
if editor_anchor not in text:
    raise RuntimeError('Could not find editor AI Prompt button anchor')
text = text.replace(editor_anchor, editor_replace, 1)

# 7) Make go() route to a useful screen if no scope is open.
go_old = "function go(v){ if(v==='ai' && !current){ view='new'; } else view=v; render(); }"
go_new = "function go(v){ if((v==='ai'||v==='bom') && !current){ view=saved.length?'saved':'new'; } else view=v; render(); }"
if go_old not in text:
    raise RuntimeError('Could not find go()')
text = text.replace(go_old, go_new, 1)

# 8) BOM comparison UI + AI logic.
insert_anchor = "\nfunction generateSummary(){ upsertCurrent(); view='summary'; render(); }"
if insert_anchor not in text:
    raise RuntimeError('Could not find generateSummary anchor')

block = r'''
function bomCompareView(){
 if(!current) return `<div class="max-w-4xl mx-auto text-center py-16"><div class="w-14 h-14 mx-auto bg-emerald-50 text-emerald-600 rounded-2xl grid place-items-center mb-4">${icon('scan-search','w-7 h-7')}</div><h2 class="text-2xl font-bold">Open a scope first</h2><p class="text-slate-500 mt-2">The BOM comparison uses the saved Forge Scope as one of its references.</p><button onclick="go(saved.length?'saved':'new')" class="mt-5 bg-slate-900 text-white px-5 py-3 rounded-lg font-semibold">${saved.length?'Open Saved Scope':'Create Scope'}</button></div>`;
 const previous=current.bomComparison?.result||null;
 const bom=bomCompareState.bom;
 const plans=bomCompareState.plans||[];
 const filled=Object.values(current.fields||{}).filter(f=>String(f.value||'').trim()).length;
 return `<div class="max-w-6xl mx-auto fade-in">
  <div class="mb-6"><div class="flex items-center gap-2"><span class="text-xs font-bold uppercase tracking-wider text-emerald-600">BOM QA</span><span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">${TYPES[current.type].label}</span></div><h2 class="text-2xl font-extrabold mt-1">Compare BOM to Scope + Plans</h2><p class="text-slate-500 mt-2">Read the MiTek/AI bill of materials against the drawings and the ${filled} populated Forge Scope fields. Flag what should come out, stay, be added, or be verified.</p></div>

  <div class="grid lg:grid-cols-2 gap-5 mb-5">
   <section class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div class="flex gap-3 items-start"><div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 grid place-items-center">${icon('file-spreadsheet')}</div><div class="flex-1"><h3 class="font-bold">1. Bill of Materials</h3><p class="text-sm text-slate-500 mt-1">MiTek BOM, AI takeoff, or exported material list.</p></div></div><label class="mt-4 flex items-center justify-center gap-3 border-2 border-dashed border-slate-200 hover:bg-slate-50 rounded-xl p-5 cursor-pointer"><input type="file" accept=".pdf,.txt,.csv,.json,application/pdf,text/plain,text/csv,application/json" onchange="setBomCompareFile(this)" class="hidden"><span class="w-9 h-9 rounded-lg bg-slate-100 grid place-items-center">${icon('upload','w-4 h-4')}</span><span class="text-sm"><b>${bom?esc(bom.name):'Choose BOM file'}</b><span class="block text-xs text-slate-400 mt-1">PDF, CSV, TXT or JSON</span></span></label></section>
   <section class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div class="flex gap-3 items-start"><div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center">${icon('files')}</div><div class="flex-1"><h3 class="font-bold">2. Plans / Drawings</h3><p class="text-sm text-slate-500 mt-1">Upload the plan set so AI can verify the BOM and fill blank scope fields.</p></div></div><label class="mt-4 flex items-center justify-center gap-3 border-2 border-dashed border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 rounded-xl p-5 cursor-pointer"><input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp" onchange="setBomPlanFiles(this)" class="hidden"><span class="w-9 h-9 rounded-lg bg-white text-indigo-600 grid place-items-center shadow-sm">${icon('upload','w-4 h-4')}</span><span class="text-sm"><b>${plans.length?plans.length+' plan file'+(plans.length===1?'':'s'):'Choose plan files'}</b><span class="block text-xs text-slate-400 mt-1">PDF or drawing images</span></span></label>${plans.length?`<div class="mt-3 space-y-1">${plans.map(f=>`<div class="text-xs text-slate-500 truncate">• ${esc(f.name)}</div>`).join('')}</div>`:''}</section>
  </div>

  <section class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-5">
   <div class="flex flex-col lg:flex-row lg:items-start gap-5 justify-between"><div><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">${icon('sparkles')}</div><div><h3 class="font-bold">3. Run Free AI Comparison</h3><p class="text-sm text-slate-500 mt-1">Uses your own Gemini API free-tier key. The key stays in this browser tab and is not saved with the project.</p></div></div></div><div class="text-xs text-slate-400 lg:text-right">Recommended for internal estimating QA.<br>Critical quantities still require estimator review.</div></div>
   <div class="grid lg:grid-cols-[1fr_220px] gap-3 mt-5"><input type="password" autocomplete="off" value="${esc(geminiSessionKey)}" oninput="geminiSessionKey=this.value" placeholder="Paste Gemini API key for this session" class="px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"><select onchange="geminiCompareModel=this.value" class="px-3 py-3 border border-slate-200 rounded-xl bg-white text-sm"><option value="gemini-3.7-flash" ${geminiCompareModel==='gemini-3.7-flash'?'selected':''}>Gemini 3.7 Flash</option><option value="gemini-3.6-flash" ${geminiCompareModel==='gemini-3.6-flash'?'selected':''}>Gemini 3.6 Flash</option></select></div>
   <div id="bomCompareError" class="text-sm text-rose-600 mt-3">${esc(bomCompareState.error||'')}</div><div id="bomCompareStatus" class="text-sm text-emerald-700 mt-3">${esc(bomCompareState.status||'')}</div>
   <button onclick="runBomCompare()" ${bomCompareState.loading?'disabled':''} class="mt-4 w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-5 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2">${icon(bomCompareState.loading?'loader-circle':'scan-search','w-5 h-5')} ${bomCompareState.loading?'Analyzing BOM + Plans...':'COMPARE BOM TO PLANS'}</button>
   <div class="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><div class="text-sm font-semibold">No API key?</div><div class="text-xs text-slate-500 mt-1">Download the universal comparison prompt, attach the same BOM + plans to ChatGPT, Claude, Gemini, Hermes, etc., then import the JSON result.</div></div><button onclick="downloadBomComparePrompt()" class="shrink-0 px-4 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-sm flex items-center gap-2">${icon('download','w-4 h-4')} Universal Compare Prompt</button></div>
   <details class="mt-4"><summary class="cursor-pointer text-sm font-semibold text-slate-600">Import comparison JSON from another AI</summary><div class="mt-3"><textarea id="bomCompareJson" rows="7" placeholder="Paste the comparison JSON here..." class="w-full font-mono text-xs p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"></textarea><button onclick="importBomCompareJson()" class="mt-2 px-4 py-2.5 bg-slate-100 rounded-lg text-sm font-semibold">Import Comparison Result</button></div></details>
  </section>

  ${(bomCompareState.result||previous)?bomCompareResultView(bomCompareState.result||previous):''}
 </div>`;
}

function setBomCompareFile(input){ bomCompareState.bom=input?.files?.[0]||null; bomCompareState.error=''; render(); }
function setBomPlanFiles(input){ bomCompareState.plans=[...(input?.files||[])]; bomCompareState.error=''; render(); }
function fileMime(file){
 if(file.type) return file.type;
 const ext=(file.name.split('.').pop()||'').toLowerCase();
 return ({pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',csv:'text/csv',txt:'text/plain',json:'application/json'})[ext]||'application/octet-stream';
}
function arrayBufferToBase64(buffer){
 const bytes=new Uint8Array(buffer); let binary=''; const chunk=0x8000;
 for(let i=0;i<bytes.length;i+=chunk) binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));
 return btoa(binary);
}
async function fileToGeminiPart(file){
 const mime=fileMime(file);
 if(mime.startsWith('text/')||mime==='application/json') return {text:`FILE: ${file.name}\n\n${await file.text()}`};
 return {inlineData:{mimeType:mime,data:arrayBufferToBase64(await file.arrayBuffer())}};
}
function currentScopeSnapshot(){
 const filled=[]; const blanks=[];
 SCHEMAS[current.type].forEach(sec=>sec.fields.forEach(f=>{
  const d=current.fields[f.key]||emptyField();
  if(String(d.value||'').trim()) filled.push(`${f.key} | ${sec.title} | ${f.label}: ${d.value}${d.source?' | Source: '+d.source:''}${d.status&&d.status!=='Confirmed'?' | '+d.status:''}`);
  else blanks.push(`${f.key} | ${sec.title} | ${f.label}`);
 }));
 if(current.openings?.length) filled.push('OPENINGS: '+JSON.stringify(current.openings));
 return {filled,blanks};
}
function buildBomComparePrompt(){
 const snap=currentScopeSnapshot();
 return `FORGE SCOPE — BOM / PLAN COMPARISON\n\nYou are a senior construction estimator performing a material QA review. You have been given: (1) a bill of materials generated by MiTek or another estimating system, (2) the construction drawings/plans, and (3) an existing Forge Scope intake record below.\n\nOBJECTIVE\nAudit the BOM against the actual drawings and scope. Do not merely summarize the BOM. Determine what is wrong, missing, duplicated, owner-supplied/by-others, the wrong product/specification, or needs verification. Use the drawings to fill blank Forge Scope fields where the answer is clearly shown.\n\nESTIMATING RULES\n1. Treat the drawings/specifications as the design source of truth unless they conflict.\n2. Do not invent dimensions or quantities. If a quantity requires a takeoff you cannot support confidently, mark it Verify/TBC.\n3. Distinguish REMOVE, KEEP, ADD, VERIFY/TBC and CHANGE SPEC.\n4. Watch specifically for foundation type, post-frame vs stud-frame vs hybrid construction, wall heights, gable/endwall conditions, truss span/pitch/spacing/bearing, roof/wall strapping or purlins, structural posts/beams, headers/lintels, shearwalls, blocking, bracing, openings, owner/by-others material and truss-engineer deferred items.\n5. For every important finding cite the sheet/detail/source when possible.\n6. Compare quantities, not only product names. Catch conventional-building assumptions that conflict with agricultural/post-frame/curtain-wall construction.\n7. If the BOM includes finishes specifically marked PER OWNER / BY OTHERS, call them out for removal from the supplied quote.\n8. When the plans require a different material (example 1/2 plywood vs 7/16 OSB), classify it as CHANGE SPEC rather than simply ADD.\n9. Preserve uncertainty. Confidence must be High, Medium or Low.\n10. Return JSON only. No markdown and no text outside the JSON object.\n\nCURRENT FORGE SCOPE — POPULATED FIELDS\n${snap.filled.length?snap.filled.join('\n'):'No populated fields yet.'}\n\nCURRENT FORGE SCOPE — BLANK FIELDS AI MAY FILL\n${snap.blanks.join('\n')}\n\nRETURN EXACTLY THIS GENERAL SHAPE (omit empty arrays):\n{\n  "verdict": {"status":"DO NOT PRICE AS-IS | REVIEW REQUIRED | GENERALLY ALIGNED","summary":"short overall call"},\n  "scopeUpdates": {"allowedFieldKey":{"value":"answer from plans","source":"sheet/detail","status":"Confirmed"}},\n  "scopeCorrections": [{"field":"scope field or exclusion","current":"existing value","corrected":"recommended value","reason":"why","source":"sheet/detail","confidence":"High"}],\n  "remove": [{"item":"BOM item","bomQty":"qty if shown","planRequirement":"what plans show","reason":"why remove","source":"sheet/detail","confidence":"High"}],\n  "keep": [{"item":"BOM item","bomQty":"qty if shown","planRequirement":"what plans show","reason":"why it belongs","source":"sheet/detail","confidence":"High"}],\n  "add": [{"item":"missing material","recommendedQty":"supported quantity or TBC","planRequirement":"assembly/detail","reason":"why missing","source":"sheet/detail","confidence":"High"}],\n  "changeSpec": [{"item":"BOM item","bomSpec":"current spec","requiredSpec":"plan spec","reason":"why change","source":"sheet/detail","confidence":"High"}],\n  "verify": [{"item":"item/quantity","bomQty":"if shown","question":"what must be confirmed","source":"sheet/detail","confidence":"Medium"}],\n  "correctedBOM": [{"category":"Foundation / Walls / Roof / Openings / Bracing / Other","material":"material description","quantity":"working quantity","unit":"pcs/LF/sheets/etc","action":"KEEP/ADD/CHANGE","source":"sheet/detail","confidence":"High"}],\n  "warnings": ["important quote note"]\n}\n\nThe correctedBOM is a WORKING material list only: include items you can support from the evidence; do not pretend uncertain quantities are final. Before responding, cross-check the BOM against plan, elevation, section/detail and schedule information wherever available.`;
}
function downloadBomComparePrompt(){
 if(!current){alert('Open a scope first.');return;}
 const blob=new Blob([buildBomComparePrompt()],{type:'text/plain'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`Forge-Scope-${current.type}-BOM-Compare-Prompt.txt`; a.click(); URL.revokeObjectURL(a.href);
}
async function runBomCompare(){
 const err=document.getElementById('bomCompareError'); const status=document.getElementById('bomCompareStatus');
 bomCompareState.error=''; bomCompareState.status=''; if(err)err.textContent=''; if(status)status.textContent='';
 try{
  if(!current) throw new Error('Open a Forge Scope first.');
  if(!bomCompareState.bom) throw new Error('Upload the bill of materials first.');
  if(!bomCompareState.plans.length) throw new Error('Upload at least one plan/drawing file.');
  if(!geminiSessionKey.trim()) throw new Error('Paste a Gemini API key, or use the Universal Compare Prompt below.');
  const files=[bomCompareState.bom,...bomCompareState.plans];
  const total=files.reduce((n,f)=>n+f.size,0); const max=45*1024*1024;
  if(total>max) throw new Error(`The selected files total ${(total/1024/1024).toFixed(1)} MB. For browser-based free AI, keep the combined upload under 45 MB or split/compress the plan set.`);
  bomCompareState.loading=true; if(status)status.textContent='Reading BOM and drawings...';
  const parts=[{text:buildBomComparePrompt()},{text:`\nBILL OF MATERIALS FILE: ${bomCompareState.bom.name}`}];
  parts.push(await fileToGeminiPart(bomCompareState.bom));
  for(let i=0;i<bomCompareState.plans.length;i++){
   const f=bomCompareState.plans[i]; if(status)status.textContent=`Preparing plan ${i+1} of ${bomCompareState.plans.length}: ${f.name}`;
   parts.push({text:`\nPLAN / DRAWING FILE ${i+1}: ${f.name}`}); parts.push(await fileToGeminiPart(f));
  }
  if(status)status.textContent='AI is cross-checking BOM quantities, scope and plans...';
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiCompareModel)}:generateContent`,{
   method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':geminiSessionKey.trim()},
   body:JSON.stringify({contents:[{role:'user',parts}],generationConfig:{temperature:0.1,responseMimeType:'application/json'}})
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(payload?.error?.message||`Gemini request failed (${response.status}).`);
  const raw=(payload.candidates||[]).flatMap(c=>c.content?.parts||[]).map(p=>p.text||'').join('\n').trim();
  if(!raw) throw new Error('Gemini returned no comparison text.');
  const result=parseAIJson(raw);
  if(!result || typeof result!=='object') throw new Error('The AI response was not a comparison JSON object.');
  bomCompareState.result=result; bomCompareState.status='Comparison complete.'; bomCompareState.loading=false;
  current.bomComparison={result,analyzedAt:new Date().toISOString(),bomName:bomCompareState.bom.name,planNames:bomCompareState.plans.map(f=>f.name),model:geminiCompareModel}; upsertCurrent(); render();
 }catch(e){bomCompareState.loading=false; bomCompareState.error=e.message||String(e); const el=document.getElementById('bomCompareError'); if(el)el.textContent=bomCompareState.error;}
}
function importBomCompareJson(){
 const box=document.getElementById('bomCompareJson');
 try{const result=parseAIJson(box?.value||''); bomCompareState.result=result; current.bomComparison={result,analyzedAt:new Date().toISOString(),bomName:'Imported comparison',planNames:[],model:'External AI'}; upsertCurrent(); render();}
 catch(e){bomCompareState.error=e.message; render();}
}
function bomCompareResultView(r){
 const verdict=r.verdict||{}; const arrays=[['REMOVE FROM BOM','remove','rose'],['KEEP / CONFIRMED','keep','emerald'],['ADD — MISSING MATERIAL','add','indigo'],['CHANGE SPEC','changeSpec','violet'],['VERIFY / TBC','verify','amber']];
 const updates=Object.keys(r.scopeUpdates||{}).filter(k=>current.fields?.[k] && !String(current.fields[k].value||'').trim()).length;
 return `<section class="bom-result bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6"><div class="bg-slate-900 text-white px-7 py-6"><div class="flex flex-col md:flex-row md:items-start justify-between gap-4"><div><div class="text-[10px] uppercase tracking-[.25em] text-emerald-300 font-bold">BOM COMPARISON</div><h2 class="text-2xl font-extrabold mt-1.5">${esc(current.fields.projectName?.value||'Untitled Scope')}</h2><div class="mt-2 inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${String(verdict.status||'').includes('DO NOT')?'bg-rose-500/20 text-rose-200':String(verdict.status||'').includes('REVIEW')?'bg-amber-500/20 text-amber-200':'bg-emerald-500/20 text-emerald-200'}">${esc(verdict.status||'Comparison Complete')}</div></div><div class="no-print flex flex-wrap gap-2"><button onclick="copyBomComparison()" class="px-3 py-2 rounded-lg bg-white/10 text-xs font-semibold">${icon('copy','w-3.5 h-3.5')} Copy</button><button onclick="window.print()" class="px-3 py-2 rounded-lg bg-white text-slate-900 text-xs font-semibold">${icon('printer','w-3.5 h-3.5')} Print / PDF</button></div></div>${verdict.summary?`<p class="mt-4 text-sm leading-6 text-slate-300">${esc(verdict.summary)}</p>`:''}</div>
 <div class="px-7 py-6 space-y-5">${updates?`<div class="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><div class="font-bold text-indigo-950">${updates} blank Forge Scope field${updates===1?'':'s'} found in the plans</div><div class="text-xs text-indigo-700 mt-1">This only fills blanks. Existing estimator-entered values are not overwritten.</div></div><button onclick="applyBomScopeUpdates()" class="no-print shrink-0 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Fill Blank Scope Fields</button></div>`:''}${(r.scopeCorrections||[]).length?bomCorrectionsTable(r.scopeCorrections):''}${arrays.map(([label,key,tone])=>(r[key]||[]).length?bomActionTable(label,r[key],tone):'').join('')}${(r.correctedBOM||[]).length?correctedBomTable(r.correctedBOM):''}${(r.warnings||[]).length?`<section class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"><div class="text-[.69rem] font-extrabold uppercase tracking-wider text-amber-800">Quote Warnings</div><div class="mt-2 space-y-1">${r.warnings.map(x=>`<div class="text-sm text-slate-800">• ${esc(x)}</div>`).join('')}</div></section>`:''}</div></section>`;
}
function bomCorrectionsTable(items){
 return `<section><h3 class="text-[.69rem] font-extrabold uppercase tracking-wider text-slate-500 mb-2">Scope Corrections</h3><div class="border border-slate-200 rounded-xl overflow-hidden"><table class="w-full table-fixed"><thead class="bg-slate-50 text-slate-400 uppercase tracking-wider"><tr><th class="w-[20%] px-3 py-2 text-left">Field</th><th class="w-[24%] px-3 py-2 text-left">Current</th><th class="w-[28%] px-3 py-2 text-left">Recommended</th><th class="w-[28%] px-3 py-2 text-left">Reason / Source</th></tr></thead><tbody class="divide-y divide-slate-100">${items.map(x=>`<tr class="align-top"><td class="px-3 py-2 font-semibold text-slate-600">${esc(x.field||'Scope')}</td><td class="px-3 py-2 text-slate-600">${esc(x.current||'—')}</td><td class="px-3 py-2 font-semibold text-slate-800">${esc(x.corrected||'—')}</td><td class="px-3 py-2 text-slate-600">${esc(x.reason||'')} ${x.source?`<div class="bom-source mt-1">${esc(x.source)}${x.confidence?' • '+esc(x.confidence):''}</div>`:''}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function bomActionTable(title,items,tone){
 const cls=({rose:'text-rose-700',emerald:'text-emerald-700',indigo:'text-indigo-700',violet:'text-violet-700',amber:'text-amber-700'})[tone]||'text-slate-600';
 return `<section><h3 class="text-[.69rem] font-extrabold uppercase tracking-wider ${cls} mb-2">${title}</h3><div class="border border-slate-200 rounded-xl overflow-hidden"><table class="w-full table-fixed"><thead class="bg-slate-50 text-slate-400 uppercase tracking-wider"><tr><th class="w-[25%] px-3 py-2 text-left">Item</th><th class="w-[18%] px-3 py-2 text-left">BOM / Qty</th><th class="w-[37%] px-3 py-2 text-left">Plan Requirement / Call</th><th class="w-[20%] px-3 py-2 text-left">Source</th></tr></thead><tbody class="divide-y divide-slate-100">${items.map(x=>{const qty=x.bomQty||x.recommendedQty||x.bomSpec||'—'; const call=x.planRequirement||x.requiredSpec||x.question||x.reason||'—'; return `<tr class="align-top"><td class="px-3 py-2 font-semibold text-slate-800">${esc(x.item||'Item')}</td><td class="px-3 py-2 text-slate-600">${esc(qty)}</td><td class="px-3 py-2 text-slate-700">${esc(call)}${x.reason&&call!==x.reason?`<div class="text-slate-500 mt-1">${esc(x.reason)}</div>`:''}</td><td class="bom-source px-3 py-2">${esc(x.source||'—')}${x.confidence?`<div class="mt-1 font-semibold">${esc(x.confidence)}</div>`:''}</td></tr>`;}).join('')}</tbody></table></div></section>`;
}
function correctedBomTable(items){
 return `<section><div class="flex items-end justify-between gap-3 mb-2"><h3 class="text-[.69rem] font-extrabold uppercase tracking-wider text-slate-500">Corrected Working BOM</h3><span class="text-[.69rem] text-slate-400">Evidence-supported items only</span></div><div class="border border-slate-200 rounded-xl overflow-hidden"><table class="w-full table-fixed"><thead class="bg-slate-50 text-slate-400 uppercase tracking-wider"><tr><th class="w-[18%] px-3 py-2 text-left">Category</th><th class="w-[34%] px-3 py-2 text-left">Material</th><th class="w-[18%] px-3 py-2 text-left">Quantity</th><th class="w-[12%] px-3 py-2 text-left">Action</th><th class="w-[18%] px-3 py-2 text-left">Source</th></tr></thead><tbody class="divide-y divide-slate-100">${items.map(x=>`<tr class="align-top"><td class="px-3 py-2 text-slate-500">${esc(x.category||'Other')}</td><td class="px-3 py-2 font-semibold text-slate-800">${esc(x.material||'')}</td><td class="px-3 py-2 text-slate-700">${esc([x.quantity,x.unit].filter(Boolean).join(' ')||'TBC')}</td><td class="px-3 py-2 font-bold text-slate-600">${esc(x.action||'')}</td><td class="bom-source px-3 py-2">${esc(x.source||'—')}${x.confidence?`<div class="mt-1">${esc(x.confidence)}</div>`:''}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function applyBomScopeUpdates(){
 const updates=(bomCompareState.result||current.bomComparison?.result||{}).scopeUpdates||{}; let applied=0;
 Object.entries(updates).forEach(([k,v])=>{if(!current.fields?.[k]||String(current.fields[k].value||'').trim())return; const d=typeof v==='string'?{value:v}:{...v}; if(!String(d.value||'').trim())return; current.fields[k]={...current.fields[k],value:d.value,source:d.source||current.fields[k].source,status:STATUS_OPTIONS.includes(d.status)?d.status:'Confirmed',reviewed:false}; applied++;});
 upsertCurrent(); alert(`${applied} blank scope field${applied===1?'':'s'} filled. Review them in the worksheet before quoting.`); view='editor'; render();
}
function bomComparisonText(){
 const r=bomCompareState.result||current?.bomComparison?.result||{}; let out=`FORGE SCOPE — BOM COMPARISON\n${current?.fields?.projectName?.value||'Untitled Scope'}\n\n${r.verdict?.status||''}\n${r.verdict?.summary||''}\n\n`;
 [['REMOVE','remove'],['KEEP','keep'],['ADD','add'],['CHANGE SPEC','changeSpec'],['VERIFY / TBC','verify']].forEach(([title,key])=>{if(!(r[key]||[]).length)return;out+=title+'\n';r[key].forEach(x=>{out+=`• ${x.item||'Item'} — ${x.bomQty||x.recommendedQty||x.bomSpec||''} — ${x.planRequirement||x.requiredSpec||x.question||x.reason||''}${x.source?' — '+x.source:''}\n`;});out+='\n';});
 if((r.correctedBOM||[]).length){out+='CORRECTED WORKING BOM\n';r.correctedBOM.forEach(x=>out+=`• ${x.category||'Other'} — ${x.material||''} — ${x.quantity||'TBC'} ${x.unit||''} — ${x.action||''}${x.source?' — '+x.source:''}\n`);}
 return out;
}
async function copyBomComparison(){try{await navigator.clipboard.writeText(bomComparisonText());alert('BOM comparison copied.');}catch{alert('Copy failed.');}}
'''
text = text.replace(insert_anchor, '\n' + block + insert_anchor, 1)

path.write_text(text, encoding='utf-8')
print('Added Compare to BOM workflow with free Gemini + universal AI fallback.')
