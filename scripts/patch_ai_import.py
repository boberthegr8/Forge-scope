from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

css_marker = '/* Forge Scope compact one-column summary */'
if css_marker not in text:
    css = r'''
    /* Forge Scope compact one-column summary */
    .scope-summary { font-size: 92%; }
    .scope-summary .summary-title { font-size: 1.725rem; line-height: 2rem; }
    .scope-summary .summary-section-title { font-size: .69rem; line-height: 1rem; }
    .scope-summary .summary-table { font-size: .805rem; line-height: 1.25rem; }
    .scope-summary .summary-table th { font-size: .65rem; line-height: .9rem; }
    .scope-summary .summary-source { font-size: .69rem; line-height: 1rem; color: #94a3b8; }
'''
    text = text.replace('    @media print {', css + '    @media print {', 1)

new_summary = r'''function summaryView(){
 if(!current) return '';
 const d=summaryData();
 const project=current.fields.projectName?.value||'Untitled Scope';
 const customer=current.fields.customer?.value||'';
 const exclusions=current.fields.scopeExcluded?.value?.trim()?current.fields.scopeExcluded:null;
 const sections=d.sections.map(sec=>({
   ...sec,
   items:sec.items.filter(x=>x.label!=='Explicit Exclusions')
 })).filter(sec=>sec.items.length);
 return `<div class="max-w-5xl mx-auto fade-in"><div class="no-print flex flex-wrap justify-between gap-3 mb-5"><button onclick="view='editor';render()" class="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold flex items-center gap-2">${icon('arrow-left','w-4 h-4')} Back to Worksheet</button><div class="flex flex-wrap gap-2"><button onclick="copySummary()" class="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold flex items-center gap-2">${icon('copy','w-4 h-4')} Copy</button><button onclick="exportJSON()" class="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold flex items-center gap-2">${icon('braces','w-4 h-4')} JSON</button><button onclick="window.print()" class="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2">${icon('printer','w-4 h-4')} Print / PDF</button></div></div>
 <article class="scope-summary print-card bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"><div class="bg-slate-900 text-white px-7 py-6"><div class="flex justify-between gap-6 items-start"><div><div class="text-[10px] uppercase tracking-[.25em] text-indigo-300 font-bold">Forge Scope</div><h1 class="summary-title font-extrabold mt-1.5">${esc(project)}</h1>${customer?`<div class="text-slate-300 mt-1.5 text-[.805rem]">${esc(customer)}</div>`:''}</div><div class="text-right text-[.69rem] text-slate-400"><div>${TYPES[current.type].label} Scope Summary</div><div class="mt-1">Updated ${fmtDate(current.updatedAt)}</div></div></div></div>
 <div class="px-7 py-6 space-y-5">${exclusions?summaryExclusions(exclusions):''}${sections.map(summaryTable).join('')}${d.openings.length?summaryOpeningsTable(d.openings):''}</div>
 <div class="px-7 py-4 bg-slate-50 border-t border-slate-200 text-[.69rem] text-slate-500 flex justify-between"><span>Blank fields omitted automatically.</span><span>Forge Scope • Estimator Intake</span></div></article></div>`;
}
function summaryExclusions(x){
 return `<section class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"><div class="summary-section-title font-extrabold uppercase tracking-wider text-amber-800">Scope Exclusions</div><div class="mt-1.5 font-semibold text-slate-800 whitespace-pre-wrap">${esc(x.value)}</div>${x.source?`<div class="summary-source mt-1">Source: ${esc(x.source)}</div>`:''}</section>`;
}
function summaryTable(sec){
 return `<section><h2 class="summary-section-title font-extrabold uppercase tracking-wider text-slate-500 mb-2">${sec.title}</h2><div class="border border-slate-200 rounded-xl overflow-hidden"><table class="summary-table w-full table-fixed"><thead class="bg-slate-50 text-slate-400 uppercase tracking-wider"><tr><th class="w-[27%] px-3 py-2 text-left font-bold">Field</th><th class="w-[53%] px-3 py-2 text-left font-bold">Value</th><th class="w-[20%] px-3 py-2 text-left font-bold">Source</th></tr></thead><tbody class="divide-y divide-slate-100">${sec.items.map(summaryTableRow).join('')}</tbody></table></div></section>`;
}
function summaryTableRow(x){
 const badge=x.status && x.status!=='Confirmed' ? `<span class="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${x.status==='RFI'?'bg-rose-100 text-rose-700':x.status==='Verify'?'bg-amber-100 text-amber-700':x.status==='Assumption'?'bg-violet-100 text-violet-700':'bg-slate-100 text-slate-600'}">${x.status}</span>`:'';
 return `<tr class="align-top"><td class="px-3 py-2 font-semibold text-slate-500">${x.label}${badge}</td><td class="px-3 py-2 font-semibold text-slate-800 whitespace-pre-wrap break-words">${esc(x.value)}</td><td class="summary-source px-3 py-2 break-words">${x.source?esc(x.source):'—'}</td></tr>`;
}
function summaryOpeningsTable(openings){
 return `<section><h2 class="summary-section-title font-extrabold uppercase tracking-wider text-slate-500 mb-2">Openings</h2><div class="border border-slate-200 rounded-xl overflow-hidden"><table class="summary-table w-full table-fixed"><thead class="bg-slate-50 text-slate-400 uppercase tracking-wider"><tr><th class="w-[25%] px-3 py-2 text-left font-bold">Opening</th><th class="w-[18%] px-3 py-2 text-left font-bold">Size</th><th class="w-[37%] px-3 py-2 text-left font-bold">Framing / Notes</th><th class="w-[20%] px-3 py-2 text-left font-bold">Source</th></tr></thead><tbody class="divide-y divide-slate-100">${openings.map((o,i)=>{const name=`${o.wall||'Opening '+(i+1)}${o.type?' — '+o.type:''}`;const size=[o.width,o.height].filter(Boolean).join(' x ')||'—';const notes=[o.location,o.header,o.framing,o.foundationDrop].filter(Boolean).join(' • ')||'—';return `<tr class="align-top"><td class="px-3 py-2 font-semibold text-slate-700">${esc(name)}</td><td class="px-3 py-2 text-slate-700">${esc(size)}</td><td class="px-3 py-2 text-slate-700 break-words">${esc(notes)}</td><td class="summary-source px-3 py-2 break-words">${o.source?esc(o.source):'—'}</td></tr>`;}).join('')}</tbody></table></div></section>`;
}
function summaryItem(x){ return summaryTableRow(x); }'''

pattern = r'function summaryView\(\)\{.*?\n\}\nfunction summaryItem\(x\)\{.*?\n\}'
text, n = re.subn(pattern, lambda m: new_summary, text, count=1, flags=re.S)
if n != 1:
    raise RuntimeError('Could not locate summaryView()/summaryItem() for replacement')

if text != original:
    path.write_text(text, encoding='utf-8')
    print('Applied compact one-column grouped summary output.')
else:
    print('Summary output already up to date.')
