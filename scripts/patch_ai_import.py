from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')

if 'id="aiFile"' in text and 'function parseAIJson' in text:
    print('AI import upgrade already applied.')
    raise SystemExit(0)

new_ai_view = r'''function aiView(){
 if(!current) return `<div class="max-w-4xl mx-auto text-center py-16"><h2 class="text-2xl font-bold">Start a scope first.</h2><button onclick="go('new')" class="mt-4 bg-indigo-600 text-white px-5 py-3 rounded-lg font-semibold">New Scope</button></div>`;
 return `<div class="max-w-6xl mx-auto fade-in"><div class="grid lg:grid-cols-2 gap-6">
 <section class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div class="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl grid place-items-center mb-4">${icon('download')}</div><h2 class="text-xl font-bold">1. Download AI Prompt</h2><p class="text-sm text-slate-500 mt-2 leading-6">Upload the drawings to any AI model, attach this prompt, and ask it to return Forge Scope JSON. The prompt tells the model not to guess and to include drawing-sheet sources.</p><button onclick="downloadAIPrompt()" class="mt-5 w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold">Download ${TYPES[current.type].label} AI Prompt</button><div class="mt-4 text-xs text-slate-400 leading-5">Tip: if the AI can create files, ask it to save the result as <b>forge-scope.json</b>. You can upload that file directly on the right.</div></section>
 <section class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div class="w-11 h-11 bg-violet-50 text-violet-600 rounded-xl grid place-items-center mb-4">${icon('braces')}</div><h2 class="text-xl font-bold">2. Import AI Results</h2><p class="text-sm text-slate-500 mt-2">Upload the JSON file from ChatGPT, Claude, Gemini, Hermes, or paste the response below. Both methods use the same importer.</p>
 <label class="mt-4 flex items-center justify-center gap-3 w-full border-2 border-dashed border-violet-200 bg-violet-50/50 hover:bg-violet-50 rounded-xl p-5 cursor-pointer transition-colors"><input id="aiFile" type="file" accept=".json,.txt,application/json,text/plain" onchange="loadAIFile(this)" class="hidden"><span class="w-10 h-10 rounded-lg bg-white text-violet-600 grid place-items-center shadow-sm">${icon('upload','w-5 h-5')}</span><span><span class="block text-sm font-bold text-slate-800">Choose JSON File</span><span id="aiFileName" class="block text-xs text-slate-500 mt-1">.json or .txt</span></span></label>
 <div class="flex items-center gap-3 my-4"><div class="h-px bg-slate-200 flex-1"></div><span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">or paste</span><div class="h-px bg-slate-200 flex-1"></div></div>
 <textarea id="aiJson" rows="11" placeholder='Paste JSON here — markdown fences and extra AI text are okay.' class="w-full font-mono text-xs p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500"></textarea><div id="aiError" class="text-sm text-rose-600 mt-2"></div><div id="aiReady" class="text-sm text-emerald-700 mt-2"></div><button onclick="importAI()" class="mt-4 w-full bg-slate-900 text-white px-4 py-3 rounded-lg font-semibold">Import Into Worksheet</button></section>
 </div><div class="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4"><div class="text-amber-600">${icon('triangle-alert')}</div><div><div class="font-semibold text-amber-950">AI is an intake assistant, not the estimator.</div><p class="text-sm text-amber-800 mt-1">Imported values remain editable. Review the plan source and mark critical fields before generating the final scope summary.</p></div></div><div class="mt-6"><button onclick="view='editor';render()" class="text-indigo-600 font-semibold text-sm">← Back to worksheet</button></div></div>`;
}
'''

text, n = re.subn(r'function aiView\(\)\{.*?\n\}\n\nfunction generateSummary\(\)', new_ai_view + '\nfunction generateSummary()', text, count=1, flags=re.S)
if n != 1:
    raise RuntimeError('Could not locate aiView() for replacement')

new_import = r'''function parseAIJson(input){
 let raw=String(input||'').replace(/^\uFEFF/,'').trim();
 if(!raw) throw new Error('Choose a JSON file or paste the AI result first.');
 const attempts=[];
 const add=s=>{s=String(s||'').trim(); if(s && !attempts.includes(s)) attempts.push(s);};
 add(raw);
 const fenced=raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
 if(fenced) add(fenced[1]);
 add(raw.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim());
 const first=raw.indexOf('{'), last=raw.lastIndexOf('}');
 if(first!==-1 && last>first) add(raw.slice(first,last+1));
 let lastErr=null;
 for(const candidate of attempts){
  try{return JSON.parse(candidate);}catch(e){lastErr=e;}
 }
 throw new Error((lastErr?.message||'Invalid JSON')+' — The importer accepts a .json/.txt file, plain JSON, JSON inside ``` fences, or JSON surrounded by normal AI commentary.');
}
function applyAIData(data){
 if(!data || typeof data!=='object' || Array.isArray(data)) throw new Error('The imported file must contain one Forge Scope JSON object.');
 if(data.projectType && data.projectType!==current.type) throw new Error(`This JSON is for ${data.projectType}, but this scope is ${current.type}.`);
 const incoming=data.fields||{};
 if(!incoming || typeof incoming!=='object' || Array.isArray(incoming)) throw new Error('I found JSON, but it does not contain a valid "fields" object.');
 let imported=0;
 Object.entries(incoming).forEach(([k,v])=>{
  if(!(k in current.fields)) return;
  if(typeof v==='string') current.fields[k]={...current.fields[k],value:v,reviewed:false,status:'Confirmed'};
  else if(v && typeof v==='object') current.fields[k]={...current.fields[k],value:v.value??'',source:v.source??'',status:STATUS_OPTIONS.includes(v.status)?v.status:'Confirmed',reviewed:false};
  imported++;
 });
 if(Array.isArray(data.openings)) current.openings=data.openings.map(o=>({...o,reviewed:false,status:STATUS_OPTIONS.includes(o.status)?o.status:'Confirmed'}));
 if(imported===0 && !current.openings.length) throw new Error('The JSON was valid, but none of its field keys matched this Forge Scope template.');
 current.mode='ai'; upsertCurrent(); view='editor'; render();
}
function importAI(){
 const box=document.getElementById('aiJson'); const err=document.getElementById('aiError'); const ready=document.getElementById('aiReady');
 if(err) err.textContent=''; if(ready) ready.textContent='';
 try{ applyAIData(parseAIJson(box?.value||'')); }
 catch(e){ if(err) err.textContent='Could not import: '+e.message; }
}
function loadAIFile(input){
 const file=input?.files?.[0]; const err=document.getElementById('aiError'); const ready=document.getElementById('aiReady'); const name=document.getElementById('aiFileName');
 if(err) err.textContent=''; if(ready) ready.textContent='';
 if(!file) return;
 if(name) name.textContent=file.name;
 const reader=new FileReader();
 reader.onload=()=>{
  const box=document.getElementById('aiJson'); if(box) box.value=String(reader.result||'');
  try{ const data=parseAIJson(reader.result); if(ready) ready.textContent=`${file.name} loaded and looks like valid JSON. Click Import Into Worksheet.`; }
  catch(e){ if(err) err.textContent='File loaded, but '+e.message; }
 };
 reader.onerror=()=>{ if(err) err.textContent='Could not read that file. Try downloading it again or paste the JSON instead.'; };
 reader.readAsText(file);
}
'''

text, n = re.subn(r'function importAI\(\)\{.*?\n\}\nfunction exportJSON\(\)', new_import + '\nfunction exportJSON()', text, count=1, flags=re.S)
if n != 1:
    raise RuntimeError('Could not locate importAI() for replacement')

old_rule = '6. Return JSON only. No markdown fences, no explanation before or after JSON.'
new_rule = '6. Return JSON only. No markdown fences, no explanation before or after JSON. If your interface supports creating files, also provide the exact result as a downloadable file named forge-scope.json.'
if old_rule in text:
    text = text.replace(old_rule, new_rule, 1)

path.write_text(text, encoding='utf-8')
print('Patched AI import: file upload + tolerant copy/paste parser.')
