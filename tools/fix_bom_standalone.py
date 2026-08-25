from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
orig = text

# Compare to BOM must be a standalone workflow. A saved Forge Scope is optional context, not a prerequisite.
old = "function go(v){ if((v==='ai'||v==='bom') && !current){ view=saved.length?'saved':'new'; } else view=v; render(); }"
new = "function go(v){ if(v==='ai' && !current){ view='new'; } else view=v; render(); }"
if old in text:
    text = text.replace(old, new, 1)

# Remove the gate that sends users back to Saved Scopes when no worksheet is open.
start = "function bomCompareView(){\n if(!current) return `"
if start in text:
    gate_start = text.index(start) + len("function bomCompareView(){\n")
    gate_end = text.index(";\n const previous=", gate_start) + 2
    text = text[:gate_start] + text[gate_end:]

text = text.replace(
    " const previous=current.bomComparison?.result||null;",
    " const previous=current?.bomComparison?.result||null;",
    1,
)
text = text.replace(
    " const filled=Object.values(current.fields||{}).filter(f=>String(f.value||'').trim()).length;",
    " const filled=current?Object.values(current.fields||{}).filter(f=>String(f.value||'').trim()).length:0;",
    1,
)
text = text.replace(
    "${TYPES[current.type].label}</span></div><h2 class=\"text-2xl font-extrabold mt-1\">Compare Scope + BOM + Plans</h2><p class=\"text-slate-500 mt-2\">Read the uploaded Scope of Work, MiTek/AI bill of materials, drawings, and the ${filled} populated Forge Scope fields together.",
    "${current?TYPES[current.type].label:'Standalone Compare'}</span></div><h2 class=\"text-2xl font-extrabold mt-1\">Compare Scope + BOM + Plans</h2><p class=\"text-slate-500 mt-2\">Read the uploaded Scope of Work, MiTek/AI bill of materials and drawings together${current?' with '+filled+' populated Forge Scope fields as extra context':''}.",
    1,
)

# Scope snapshot is optional context.
needle = "function currentScopeSnapshot(){\n const filled=[]; const blanks=[];"
replace = "function currentScopeSnapshot(){\n const filled=[]; const blanks=[];\n if(!current) return {filled,blanks};"
if needle in text:
    text = text.replace(needle, replace, 1)

# Universal prompt must work without an open worksheet.
text = text.replace(
    "function downloadBomComparePrompt(){\n if(!current){alert('Open a scope first.');return;}\n const blob=new Blob([buildBomComparePrompt()]",
    "function downloadBomComparePrompt(){\n const blob=new Blob([buildBomComparePrompt()]",
    1,
)
text = text.replace(
    "a.download=`Forge-Scope-${current.type}-BOM-Compare-Prompt.txt`;",
    "a.download=`Forge-Scope-${current?.type||'standalone'}-BOM-Compare-Prompt.txt`;",
    1,
)

# Running the comparison requires the three uploaded inputs, not a saved worksheet.
text = text.replace("  if(!current) throw new Error('Open a Forge Scope first.');\n", "", 1)
old_save = "  current.bomComparison={result,analyzedAt:new Date().toISOString(),scopeName:bomCompareState.scope.name,bomName:bomCompareState.bom.name,planNames:bomCompareState.plans.map(f=>f.name),model:geminiCompareModel}; upsertCurrent(); render();"
new_save = "  if(current){ current.bomComparison={result,analyzedAt:new Date().toISOString(),scopeName:bomCompareState.scope.name,bomName:bomCompareState.bom.name,planNames:bomCompareState.plans.map(f=>f.name),model:geminiCompareModel}; upsertCurrent(); } render();"
if old_save in text:
    text = text.replace(old_save, new_save, 1)

old_import = " try{const result=parseAIJson(box?.value||''); bomCompareState.result=result; current.bomComparison={result,analyzedAt:new Date().toISOString(),bomName:'Imported comparison',planNames:[],model:'External AI'}; upsertCurrent(); render();}"
new_import = " try{const result=parseAIJson(box?.value||''); bomCompareState.result=result; if(current){ current.bomComparison={result,analyzedAt:new Date().toISOString(),bomName:'Imported comparison',planNames:[],model:'External AI'}; upsertCurrent(); } render();}"
if old_import in text:
    text = text.replace(old_import, new_import, 1)

# Result rendering must also work standalone.
text = text.replace(
    " const updates=Object.keys(r.scopeUpdates||{}).filter(k=>current.fields?.[k] && !String(current.fields[k].value||'').trim()).length;",
    " const updates=current?Object.keys(r.scopeUpdates||{}).filter(k=>current.fields?.[k] && !String(current.fields[k].value||'').trim()).length:0;",
    1,
)
text = text.replace(
    "${esc(current.fields.projectName?.value||'Untitled Scope')}</h2>",
    "${esc(current?.fields?.projectName?.value||bomCompareState.scope?.name||'Scope / BOM Comparison')}</h2>",
    1,
)

# Prevent any accidental worksheet-fill action in standalone mode.
needle = "function applyBomScopeUpdates(){\n const updates="
replace = "function applyBomScopeUpdates(){\n if(!current){ alert('Open a saved Forge Scope if you want to write discovered values back into a worksheet.'); return; }\n const updates="
if needle in text:
    text = text.replace(needle, replace, 1)

# Copy result title can be based on the uploaded Scope when standalone.
text = text.replace(
    "${current?.fields?.projectName?.value||'Untitled Scope'}\\n\\n${r.verdict?.status||''}",
    "${current?.fields?.projectName?.value||bomCompareState.scope?.name||'Scope / BOM Comparison'}\\n\\n${r.verdict?.status||''}",
    1,
)

if text == orig:
    raise SystemExit('No changes made; expected anchors were not found or fix is already applied.')

path.write_text(text, encoding='utf-8')
print('Compare to BOM is now standalone; saved Forge Scope is optional context.')
