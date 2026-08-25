from pathlib import Path

path = Path("index.html")
text = path.read_text(encoding="utf-8")
original = text


def replace_once(old: str, new: str, label: str):
    global text
    if new in text:
        return
    if old not in text:
        raise SystemExit(f"Could not find {label} marker in index.html")
    text = text.replace(old, new, 1)


# Load a client-side PDF exporter so Generate -> Export PDF downloads a real file.
replace_once(
    '  <script src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js"></script>\n',
    '  <script src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js"></script>\n'
    '  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>\n',
    "lucide script",
)

# The app shell is h-screen/overflow-hidden. Print must explicitly release that shell,
# otherwise Chromium only exposes the first viewport/page to the print renderer.
old_print = '''    @media print {
      aside, header, .no-print { display:none !important; }
      main { overflow: visible !important; }
      #content { padding:0 !important; background:white !important; }
      .print-card { box-shadow:none !important; border-color:#e2e8f0 !important; }
    }
'''
new_print = '''    @media print {
      html, body, #app { height:auto !important; min-height:0 !important; overflow:visible !important; }
      body { background:white !important; }
      aside, header, .no-print { display:none !important; }
      main { display:block !important; height:auto !important; min-height:0 !important; overflow:visible !important; }
      #content { display:block !important; height:auto !important; min-height:0 !important; overflow:visible !important; padding:0 !important; background:white !important; }
      .print-card { box-shadow:none !important; border-color:#e2e8f0 !important; overflow:visible !important; }
      .scope-summary table { break-inside:auto; page-break-inside:auto; }
      .scope-summary tr { break-inside:avoid; page-break-inside:avoid; }
      .scope-summary thead { display:table-header-group; }
      @page { size: Letter; margin: .45in; }
    }
'''
replace_once(old_print, new_print, "print CSS")

# Add the direct PDF export alongside the existing JSON and print actions in the generated summary.
old_actions = '''<button onclick="exportJSON()" class="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold flex items-center gap-2">${icon('braces','w-4 h-4')} JSON</button><button onclick="window.print()" class="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2">${icon('printer','w-4 h-4')} Print / PDF</button>'''
new_actions = '''<button onclick="exportJSON()" class="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold flex items-center gap-2">${icon('braces','w-4 h-4')} JSON</button><button onclick="exportPDF()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2">${icon('file-down','w-4 h-4')} Export PDF</button><button onclick="window.print()" class="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2">${icon('printer','w-4 h-4')} Print / PDF</button>'''
replace_once(old_actions, new_actions, "generated summary actions")

# Add a multipage direct-download PDF exporter immediately after JSON export.
export_json = '''function exportJSON(){ const blob=new Blob([JSON.stringify(current,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(current.fields.projectName?.value||'Forge-Scope').replace(/[^a-z0-9-_]+/gi,'-')+'.json'; a.click(); URL.revokeObjectURL(a.href); }
'''
export_pdf = export_json + '''async function exportPDF(){
 const source=document.querySelector('.scope-summary');
 if(!source){ alert('Generate the scope summary first.'); return; }
 if(typeof html2pdf==='undefined'){ alert('PDF export could not load. Use Print / PDF as a fallback.'); return; }
 const project=(current?.fields?.projectName?.value||'Forge-Scope').replace(/[^a-z0-9-_]+/gi,'-').replace(/^-+|-+$/g,'')||'Forge-Scope';
 const clone=source.cloneNode(true);
 clone.style.width='7.6in'; clone.style.maxWidth='7.6in'; clone.style.margin='0'; clone.style.boxShadow='none'; clone.style.overflow='visible';
 clone.querySelectorAll('.no-print').forEach(el=>el.remove());
 const holder=document.createElement('div');
 holder.setAttribute('aria-hidden','true'); holder.style.position='fixed'; holder.style.left='-100000px'; holder.style.top='0'; holder.style.width='7.6in'; holder.style.background='white'; holder.appendChild(clone); document.body.appendChild(holder);
 const options={
   margin:[0.35,0.35,0.4,0.35],
   filename:`${project}-Scope.pdf`,
   image:{type:'jpeg',quality:0.98},
   html2canvas:{scale:1.5,useCORS:true,backgroundColor:'#ffffff',scrollY:0,windowWidth:900},
   jsPDF:{unit:'in',format:'letter',orientation:'portrait'},
   pagebreak:{mode:['css','legacy'],avoid:['tr']}
 };
 try{
   await html2pdf().set(options).from(clone).save();
 }catch(e){
   console.error('Forge Scope PDF export failed',e);
   alert('PDF export failed. Use Print / PDF as a fallback.');
 }finally{
   holder.remove();
 }
}
'''
replace_once(export_json, export_pdf, "exportJSON function")

# Save already writes to localStorage, but there was no visible confirmation.
old_save = '''function saveCurrent(){ upsertCurrent(); render(); }
'''
new_save = '''let saveNoticeTimer=null;
function notifySaved(message='Saved in this browser'){
 let el=document.getElementById('forgeSaveNotice');
 if(!el){ el=document.createElement('div'); el.id='forgeSaveNotice'; el.className='fixed right-5 bottom-5 z-[100] rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl text-sm font-semibold transition-opacity'; document.body.appendChild(el); }
 el.textContent=message; el.style.opacity='1'; clearTimeout(saveNoticeTimer); saveNoticeTimer=setTimeout(()=>{el.style.opacity='0';},1800);
}
function saveCurrent(){ upsertCurrent(); render(); notifySaved(); }
'''
replace_once(old_save, new_save, "saveCurrent function")

if text == original:
    print("Forge Scope export patch already applied.")
else:
    path.write_text(text, encoding="utf-8")
    print("Forge Scope export/print/save patch applied.")
