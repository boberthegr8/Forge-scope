from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')

changes = 0

def rep(old, new, label):
    global text, changes
    if old not in text:
        raise RuntimeError(f'Could not find {label}')
    text = text.replace(old, new, 1)
    changes += 1

# Add explicit Scope of Work file to comparison state.
rep(
    "let bomCompareState = { bom:null, plans:[], result:null, loading:false, error:'', status:'' };",
    "let bomCompareState = { scope:null, bom:null, plans:[], result:null, loading:false, error:'', status:'' };",
    'BOM compare state'
)

# Add scope variable and change header wording.
rep(
    " const previous=current.bomComparison?.result||null;\n const bom=bomCompareState.bom;\n const plans=bomCompareState.plans||[];",
    " const previous=current.bomComparison?.result||null;\n const scope=bomCompareState.scope;\n const bom=bomCompareState.bom;\n const plans=bomCompareState.plans||[];",
    'comparison local variables'
)
rep(
    "<h2 class=\"text-2xl font-extrabold mt-1\">Compare BOM to Scope + Plans</h2><p class=\"text-slate-500 mt-2\">Read the MiTek/AI bill of materials against the drawings and the ${filled} populated Forge Scope fields. Flag what should come out, stay, be added, or be verified.</p>",
    "<h2 class=\"text-2xl font-extrabold mt-1\">Compare Scope + BOM + Plans</h2><p class=\"text-slate-500 mt-2\">Read the uploaded Scope of Work, MiTek/AI bill of materials, drawings, and the ${filled} populated Forge Scope fields together. Flag scope conflicts, BOM errors, missing material, exclusions, and items that need verification.</p>",
    'comparison heading'
)

# Replace the two-card uploader with three explicit inputs.
old_cards = '''  <div class="grid lg:grid-cols-2 gap-5 mb-5">
   <section class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div class="flex gap-3 items-start"><div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 grid place-items-center">${icon('file-spreadsheet')}</div><div class="flex-1"><h3 class="font-bold">1. Bill of Materials</h3><p class="text-sm text-slate-500 mt-1">MiTek BOM, AI takeoff, or exported material list.</p></div></div><label class="mt-4 flex items-center justify-center gap-3 border-2 border-dashed border-slate-200 hover:bg-slate-50 rounded-xl p-5 cursor-pointer"><input type="file" accept=".pdf,.txt,.csv,.json,application/pdf,text/plain,text/csv,application/json" onchange="setBomCompareFile(this)" class="hidden"><span class="w-9 h-9 rounded-lg bg-slate-100 grid place-items-center">${icon('upload','w-4 h-4')}</span><span class="text-sm"><b>${bom?esc(bom.name):'Choose BOM file'}</b><span class="block text-xs text-slate-400 mt-1">PDF, CSV, TXT or JSON</span></span></label></section>
   <section class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div class="flex gap-3 items-start"><div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center">${icon('files')}</div><div class="flex-1"><h3 class="font-bold">2. Plans / Drawings</h3><p class="text-sm text-slate-500 mt-1">Upload the plan set so AI can verify the BOM and fill blank scope fields.</p></div></div><label class="mt-4 flex items-center justify-center gap-3 border-2 border-dashed border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 rounded-xl p-5 cursor-pointer"><input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp" onchange="setBomPlanFiles(this)" class="hidden"><span class="w-9 h-9 rounded-lg bg-white text-indigo-600 grid place-items-center shadow-sm">${icon('upload','w-4 h-4')}</span><span class="text-sm"><b>${plans.length?plans.length+' plan file'+(plans.length===1?'':'s'):'Choose plan files'}</b><span class="block text-xs text-slate-400 mt-1">PDF or drawing images</span></span></label>${plans.length?`<div class="mt-3 space-y-1">${plans.map(f=>`<div class="text-xs text-slate-500 truncate">• ${esc(f.name)}</div>`).join('')}</div>`:''}</section>
  </div>'''
new_cards = '''  <div class="grid lg:grid-cols-3 gap-5 mb-5">
   <section class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div class="flex gap-3 items-start"><div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 grid place-items-center">${icon('clipboard-list')}</div><div class="flex-1"><h3 class="font-bold">1. Scope of Work</h3><p class="text-sm text-slate-500 mt-1">The salesperson/customer scope, inclusions, exclusions, or quote request.</p></div></div><label class="mt-4 flex items-center justify-center gap-3 border-2 border-dashed border-amber-200 bg-amber-50/30 hover:bg-amber-50 rounded-xl p-5 cursor-pointer"><input type="file" accept=".pdf,.txt,.csv,.json,.md,application/pdf,text/plain,text/csv,application/json,text/markdown" onchange="setBomScopeFile(this)" class="hidden"><span class="w-9 h-9 rounded-lg bg-white text-amber-700 grid place-items-center shadow-sm">${icon('upload','w-4 h-4')}</span><span class="text-sm"><b>${scope?esc(scope.name):'Choose Scope file'}</b><span class="block text-xs text-slate-400 mt-1">PDF, TXT, CSV, JSON or MD</span></span></label></section>
   <section class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div class="flex gap-3 items-start"><div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 grid place-items-center">${icon('file-spreadsheet')}</div><div class="flex-1"><h3 class="font-bold">2. Bill of Materials</h3><p class="text-sm text-slate-500 mt-1">MiTek BOM, AI takeoff, or exported material list.</p></div></div><label class="mt-4 flex items-center justify-center gap-3 border-2 border-dashed border-slate-200 hover:bg-slate-50 rounded-xl p-5 cursor-pointer"><input type="file" accept=".pdf,.txt,.csv,.json,.md,application/pdf,text/plain,text/csv,application/json,text/markdown" onchange="setBomCompareFile(this)" class="hidden"><span class="w-9 h-9 rounded-lg bg-slate-100 grid place-items-center">${icon('upload','w-4 h-4')}</span><span class="text-sm"><b>${bom?esc(bom.name):'Choose BOM file'}</b><span class="block text-xs text-slate-400 mt-1">PDF, CSV, TXT, JSON or MD</span></span></label></section>
   <section class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div class="flex gap-3 items-start"><div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center">${icon('files')}</div><div class="flex-1"><h3 class="font-bold">3. Plans / Drawings</h3><p class="text-sm text-slate-500 mt-1">Upload the plan set so AI can verify scope, BOM and fill blank Forge Scope fields.</p></div></div><label class="mt-4 flex items-center justify-center gap-3 border-2 border-dashed border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 rounded-xl p-5 cursor-pointer"><input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp" onchange="setBomPlanFiles(this)" class="hidden"><span class="w-9 h-9 rounded-lg bg-white text-indigo-600 grid place-items-center shadow-sm">${icon('upload','w-4 h-4')}</span><span class="text-sm"><b>${plans.length?plans.length+' plan file'+(plans.length===1?'':'s'):'Choose plan files'}</b><span class="block text-xs text-slate-400 mt-1">PDF or drawing images</span></span></label>${plans.length?`<div class="mt-3 space-y-1">${plans.map(f=>`<div class="text-xs text-slate-500 truncate">• ${esc(f.name)}</div>`).join('')}</div>`:''}</section>
  </div>'''
rep(old_cards, new_cards, 'two-card upload area')

# Renumber the AI step and update labels.
rep(
    '<h3 class="font-bold">3. Run Free AI Comparison</h3>',
    '<h3 class="font-bold">4. Run Free AI Comparison</h3>',
    'AI step heading'
)
rep(
    "${icon(bomCompareState.loading?'loader-circle':'scan-search','w-5 h-5')} ${bomCompareState.loading?'Analyzing BOM + Plans...':'COMPARE BOM TO PLANS'}",
    "${icon(bomCompareState.loading?'loader-circle':'scan-search','w-5 h-5')} ${bomCompareState.loading?'Analyzing Scope + BOM + Plans...':'COMPARE SCOPE + BOM + PLANS'}",
    'compare button wording'
)
rep(
    'Download the universal comparison prompt, attach the same BOM + plans to ChatGPT, Claude, Gemini, Hermes, etc., then import the JSON result.',
    'Download the universal comparison prompt, attach the same Scope of Work + BOM + plans to ChatGPT, Claude, Gemini, Hermes, etc., then import the JSON result.',
    'universal prompt helper'
)

# Add Scope of Work input setter.
rep(
    "function setBomCompareFile(input){ bomCompareState.bom=input?.files?.[0]||null; bomCompareState.error=''; render(); }",
    "function setBomScopeFile(input){ bomCompareState.scope=input?.files?.[0]||null; bomCompareState.error=''; render(); }\nfunction setBomCompareFile(input){ bomCompareState.bom=input?.files?.[0]||null; bomCompareState.error=''; render(); }",
    'file setters'
)

# Markdown text MIME fallback.
rep(
    "return ({pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',csv:'text/csv',txt:'text/plain',json:'application/json'})[ext]||'application/octet-stream';",
    "return ({pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',csv:'text/csv',txt:'text/plain',md:'text/markdown',json:'application/json'})[ext]||'application/octet-stream';",
    'MIME map'
)

# Make the comparison prompt explicitly distinguish commercial scope from design documents.
rep(
    "You have been given: (1) a bill of materials generated by MiTek or another estimating system, (2) the construction drawings/plans, and (3) an existing Forge Scope intake record below.",
    "You have been given: (1) the uploaded Scope of Work / quote request, (2) a bill of materials generated by MiTek or another estimating system, (3) the construction drawings/plans, and (4) an existing Forge Scope intake record below.",
    'prompt source list'
)
rep(
    "Audit the BOM against the actual drawings and scope. Do not merely summarize the BOM. Determine what is wrong, missing, duplicated, owner-supplied/by-others, the wrong product/specification, or needs verification. Use the drawings to fill blank Forge Scope fields where the answer is clearly shown.",
    "Audit the BOM against BOTH the uploaded Scope of Work and the actual drawings. Do not merely summarize the BOM. Determine what is wrong, missing, duplicated, outside the requested scope, owner-supplied/by-others, the wrong product/specification, or needs verification. Use the drawings and Scope of Work to fill blank Forge Scope fields where the answer is clearly shown.",
    'prompt objective'
)
rep(
    "1. Treat the drawings/specifications as the design source of truth unless they conflict.",
    "1. Treat the uploaded Scope of Work as the source of truth for what the quote is supposed to INCLUDE or EXCLUDE. Treat the drawings/specifications as the source of truth for what the building actually REQUIRES. If Scope and Plans conflict, flag the conflict explicitly instead of silently choosing one.",
    'prompt source priority'
)

# Require all three uploaded source groups and send all three to Gemini.
rep(
    "  if(!bomCompareState.bom) throw new Error('Upload the bill of materials first.');\n  if(!bomCompareState.plans.length) throw new Error('Upload at least one plan/drawing file.');",
    "  if(!bomCompareState.scope) throw new Error('Upload the Scope of Work first.');\n  if(!bomCompareState.bom) throw new Error('Upload the bill of materials first.');\n  if(!bomCompareState.plans.length) throw new Error('Upload at least one plan/drawing file.');",
    'required file validation'
)
rep(
    "  const files=[bomCompareState.bom,...bomCompareState.plans];",
    "  const files=[bomCompareState.scope,bomCompareState.bom,...bomCompareState.plans];",
    'combined size file list'
)
rep(
    "  const parts=[{text:buildBomComparePrompt()},{text:`\\nBILL OF MATERIALS FILE: ${bomCompareState.bom.name}`}];\n  parts.push(await fileToGeminiPart(bomCompareState.bom));",
    "  const parts=[{text:buildBomComparePrompt()},{text:`\\nSCOPE OF WORK FILE: ${bomCompareState.scope.name}`}];\n  parts.push(await fileToGeminiPart(bomCompareState.scope));\n  parts.push({text:`\\nBILL OF MATERIALS FILE: ${bomCompareState.bom.name}`});\n  parts.push(await fileToGeminiPart(bomCompareState.bom));",
    'Gemini uploaded parts'
)
rep(
    "  if(status)status.textContent='AI is cross-checking BOM quantities, scope and plans...';",
    "  if(status)status.textContent='AI is cross-checking Scope of Work, BOM quantities and plans...';",
    'comparison status text'
)
rep(
    "current.bomComparison={result,analyzedAt:new Date().toISOString(),bomName:bomCompareState.bom.name,planNames:bomCompareState.plans.map(f=>f.name),model:geminiCompareModel};",
    "current.bomComparison={result,analyzedAt:new Date().toISOString(),scopeName:bomCompareState.scope.name,bomName:bomCompareState.bom.name,planNames:bomCompareState.plans.map(f=>f.name),model:geminiCompareModel};",
    'saved comparison metadata'
)

path.write_text(text, encoding='utf-8')
print(f'Applied {changes} Scope + BOM + Plans comparison changes.')
