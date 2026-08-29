(() => {
  let installed = false;

  const money = n => (Number(n || 0)).toLocaleString('en-CA',{style:'currency',currency:'CAD'});
  const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const pct = v => Math.max(0, Math.min(99.9, num(v)));

  function ensureQuote(){
    if(!current) return null;
    if(!current.quote) current.quote = { defaultMargin:18, delivery:0, taxRate:13, notes:'', lines:[] };
    if(!Array.isArray(current.quote.lines)) current.quote.lines=[];
    return current.quote;
  }

  function save(notify=false){
    if(!current) return;
    upsertCurrent();
    if(notify && typeof notifySaved==='function') notifySaved('Quote saved with scope');
  }

  function sellFromCost(cost, margin){
    const m=pct(margin)/100;
    return m>=1 ? 0 : num(cost)/(1-m);
  }

  function quoteTotals(){
    const q=ensureQuote();
    if(!q) return {cost:0,sell:0,gm:0,tax:0,total:0};
    let cost=0,sell=0;
    q.lines.forEach(l=>{
      const qty=num(l.qty||1);
      cost += qty*num(l.cost);
      sell += qty*sellFromCost(l.cost, l.margin===''||l.margin==null?q.defaultMargin:l.margin);
    });
    sell += num(q.delivery);
    const gm=sell ? ((sell-cost)/sell*100) : 0;
    const tax=sell*num(q.taxRate)/100;
    return {cost,sell,gm,tax,total:sell+tax};
  }

  function projectName(){ return current?.fields?.projectName?.value || 'Untitled Job'; }
  function customerName(){ return current?.fields?.customer?.value || 'No customer entered'; }

  function workspaceView(){
    const hasScope=!!current;
    const cmp=current?.bomComparison?.result;
    const lines=current?.quote?.lines?.length||0;
    return `<div class="max-w-7xl mx-auto fade-in">
      <div class="mb-7"><div class="text-xs font-extrabold uppercase tracking-[.18em] text-indigo-600">Forge Job Workspace</div><h2 class="text-3xl font-extrabold mt-1">${hasScope?esc(projectName()):'Plans → Scope → BOM → Quote'}</h2><p class="text-slate-500 mt-2">One job, one workspace. Build the scope, compare it against the BOM and drawings, then price the final material list.</p></div>
      ${!hasScope?`<div class="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6"><div class="font-bold text-amber-950">Start or open a scope first.</div><p class="text-sm text-amber-800 mt-1">The workspace keeps the scope, comparison result and quote tied to the same job.</p><div class="flex gap-3 mt-4"><button onclick="go('new')" class="px-4 py-2.5 bg-slate-900 text-white rounded-lg font-semibold">New Scope</button><button onclick="go('saved')" class="px-4 py-2.5 bg-white border border-amber-300 rounded-lg font-semibold">Open Saved Scope</button></div></div>`:''}
      <div class="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        ${card('1','Scope Worksheet','clipboard-check',hasScope?'Open the estimator worksheet for this job.':'Create the job scope first.',hasScope?"view='editor';render()":"go('new')",hasScope?'Open Scope':'New Scope','indigo')}
        ${card('2','Plans + Scope + BOM','scan-search',cmp?'Comparison completed and saved to this job.':'Upload all three and run the combined QA comparison.',"view='bom';render()",cmp?'Review Comparison':'Run Comparison','emerald')}
        ${card('3','Quote Builder','calculator',lines?`${lines} priced line item${lines===1?'':'s'} saved.`:'Price the final reviewed material list with gross margin.',"view='quote';render()",lines?'Open Quote':'Build Quote','orange')}
        ${card('4','Customer Output','file-down','Generate the scope PDF, comparison report, and customer quote from the same job.',hasScope?"view='summary';render()":"go('new')",'Outputs','slate')}
      </div>
      ${hasScope?`<div class="mt-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div class="font-bold text-lg">${esc(projectName())}</div><div class="text-sm text-slate-500 mt-1">${esc(customerName())} • ${TYPES[current.type]?.label||current.type}</div></div><div class="flex flex-wrap gap-2"><span class="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">Scope ${Object.values(current.fields||{}).filter(f=>String(f.value||'').trim()).length} fields</span><span class="px-3 py-1.5 rounded-full text-xs font-bold ${cmp?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}">${cmp?'BOM compared':'BOM not compared'}</span><span class="px-3 py-1.5 rounded-full text-xs font-bold ${lines?'bg-orange-50 text-orange-700':'bg-slate-100 text-slate-500'}">${lines?lines+' quote lines':'Quote not started'}</span></div></div></div>`:''}
    </div>`;
  }

  function card(step,title,ic,body,action,label,tone){
    const tones={indigo:'bg-indigo-50 text-indigo-600',emerald:'bg-emerald-50 text-emerald-600',orange:'bg-orange-50 text-orange-600',slate:'bg-slate-100 text-slate-600'};
    return `<section class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col"><div class="flex items-center justify-between"><div class="w-11 h-11 rounded-xl ${tones[tone]} grid place-items-center">${icon(ic,'w-6 h-6')}</div><span class="text-xs font-extrabold text-slate-300">STEP ${step}</span></div><h3 class="font-bold text-lg mt-5">${title}</h3><p class="text-sm text-slate-500 mt-2 leading-6 flex-1">${body}</p><button onclick="${action}" class="mt-5 w-full px-4 py-3 rounded-lg bg-slate-900 text-white font-semibold text-sm">${label}</button></section>`;
  }

  function quoteView(){
    if(!current) return workspaceView();
    const q=ensureQuote(); const t=quoteTotals();
    return `<div class="max-w-[1500px] mx-auto fade-in">
      <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-6"><div><div class="text-xs font-extrabold uppercase tracking-[.18em] text-orange-600">Forge Quote</div><h2 class="text-2xl font-extrabold mt-1">${esc(projectName())}</h2><p class="text-slate-500 mt-1">${esc(customerName())} • Quote stays attached to this Forge Scope job.</p></div><div class="flex gap-2"><button onclick="view='workspace';render()" class="px-4 py-2.5 bg-white border border-slate-200 rounded-lg font-semibold text-sm">Job Workspace</button><button onclick="forgeQuotePrint()" class="px-4 py-2.5 bg-slate-900 text-white rounded-lg font-semibold text-sm flex items-center gap-2">${icon('printer','w-4 h-4')} Customer Quote</button></div></div>

      <div class="grid xl:grid-cols-[1fr_310px] gap-6">
        <section class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><h3 class="font-bold">Material Pricing</h3><p class="text-xs text-slate-500 mt-1">Enter your cost and gross margin. Sell price is calculated as Cost ÷ (1 − GM%).</p></div><button onclick="forgeQuoteAddLine()" class="px-4 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2">${icon('plus','w-4 h-4')} Add Line</button></div>
          <div class="overflow-x-auto"><table class="w-full min-w-[950px] text-sm"><thead class="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th class="text-left px-4 py-3">Description</th><th class="text-left px-3 py-3 w-24">Qty</th><th class="text-left px-3 py-3 w-28">Unit</th><th class="text-right px-3 py-3 w-32">Cost Ea.</th><th class="text-right px-3 py-3 w-24">GM %</th><th class="text-right px-3 py-3 w-32">Sell Ea.</th><th class="text-right px-3 py-3 w-32">Ext.</th><th class="w-12"></th></tr></thead><tbody>${q.lines.length?q.lines.map((l,i)=>quoteRow(l,i,q)).join(''):`<tr><td colspan="8" class="p-12 text-center text-slate-400">No quote lines yet. Add the final reviewed BOM items here.</td></tr>`}</tbody></table></div>
        </section>
        <aside class="space-y-5">
          <section class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><h3 class="font-bold">Quote Controls</h3>${smallInput('Default Gross Margin %','defaultMargin',q.defaultMargin,'number')}${smallInput('Delivery / Freight','delivery',q.delivery,'number')}${smallInput('Tax Rate %','taxRate',q.taxRate,'number')}<label class="block mt-4 text-xs font-bold text-slate-500">Customer Notes</label><textarea onchange="forgeQuoteSet('notes',this.value)" rows="5" class="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">${esc(q.notes||'')}</textarea></section>
          <section class="bg-slate-900 text-white rounded-2xl p-5 shadow-sm"><div class="text-xs uppercase tracking-wider text-slate-400 font-bold">Internal Totals</div><div class="flex justify-between mt-4 text-sm"><span class="text-slate-400">Material cost</span><b>${money(t.cost)}</b></div><div class="flex justify-between mt-2 text-sm"><span class="text-slate-400">Sell before tax</span><b>${money(t.sell)}</b></div><div class="flex justify-between mt-2 text-sm"><span class="text-slate-400">Gross margin</span><b>${t.gm.toFixed(1)}%</b></div><div class="border-t border-slate-700 my-4"></div><div class="flex justify-between text-sm"><span class="text-slate-400">Tax</span><b>${money(t.tax)}</b></div><div class="flex justify-between mt-2 text-xl"><span>Total</span><b>${money(t.total)}</b></div></section>
        </aside>
      </div>
    </div>`;
  }

  function smallInput(label,key,value,type='text'){
    return `<label class="block mt-4 text-xs font-bold text-slate-500">${label}</label><input type="${type}" step="0.01" value="${esc(value)}" onchange="forgeQuoteSet('${key}',this.value)" class="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm">`;
  }

  function quoteRow(l,i,q){
    const margin=l.margin===''||l.margin==null?q.defaultMargin:l.margin;
    const sell=sellFromCost(l.cost,margin), ext=sell*num(l.qty||1);
    return `<tr class="border-t border-slate-100"><td class="px-4 py-3"><input value="${esc(l.description||'')}" onchange="forgeQuoteLine(${i},'description',this.value)" placeholder="2x6x12 SPF, Hardie plank, soffit, trim..." class="w-full px-2 py-2 border border-slate-200 rounded-lg"></td><td class="px-3 py-3"><input type="number" step="0.01" value="${esc(l.qty??1)}" onchange="forgeQuoteLine(${i},'qty',this.value)" class="w-full px-2 py-2 border border-slate-200 rounded-lg"></td><td class="px-3 py-3"><input value="${esc(l.unit||'ea')}" onchange="forgeQuoteLine(${i},'unit',this.value)" class="w-full px-2 py-2 border border-slate-200 rounded-lg"></td><td class="px-3 py-3"><input type="number" step="0.01" value="${esc(l.cost||'')}" onchange="forgeQuoteLine(${i},'cost',this.value)" class="w-full px-2 py-2 border border-slate-200 rounded-lg text-right"></td><td class="px-3 py-3"><input type="number" step="0.1" value="${esc(l.margin??'')}" placeholder="${esc(q.defaultMargin)}" onchange="forgeQuoteLine(${i},'margin',this.value)" class="w-full px-2 py-2 border border-slate-200 rounded-lg text-right"></td><td class="px-3 py-3 text-right font-semibold">${money(sell)}</td><td class="px-3 py-3 text-right font-bold">${money(ext)}</td><td class="px-3 py-3"><button onclick="forgeQuoteRemove(${i})" class="p-2 text-slate-400 hover:text-rose-600">${icon('trash-2','w-4 h-4')}</button></td></tr>`;
  }

  window.forgeQuoteAddLine=function(){ const q=ensureQuote(); q.lines.push({description:'',qty:1,unit:'ea',cost:'',margin:''}); save(); render(); };
  window.forgeQuoteRemove=function(i){ const q=ensureQuote(); q.lines.splice(i,1); save(); render(); };
  window.forgeQuoteLine=function(i,key,value){ const q=ensureQuote(); if(!q.lines[i]) return; q.lines[i][key]=value; save(); render(); };
  window.forgeQuoteSet=function(key,value){ const q=ensureQuote(); q[key]=value; save(); render(); };

  window.forgeQuotePrint=function(){
    if(!current) return;
    const q=ensureQuote(), t=quoteTotals();
    const rows=q.lines.map(l=>{ const margin=l.margin===''||l.margin==null?q.defaultMargin:l.margin; const sell=sellFromCost(l.cost,margin); return `<tr><td>${esc(l.description||'')}</td><td>${esc(l.qty||1)} ${esc(l.unit||'')}</td><td style="text-align:right">${money(sell*num(l.qty||1))}</td></tr>`; }).join('');
    const w=window.open('','_blank');
    w.document.write(`<!doctype html><html><head><title>${esc(projectName())} Quote</title><style>body{font-family:Arial,sans-serif;color:#111;padding:42px;max-width:850px;margin:auto}h1{margin:0;font-size:28px}.sub{color:#666;margin-top:6px}.rule{height:4px;background:#d71920;margin:22px 0}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{padding:10px 8px;border-bottom:1px solid #ddd;text-align:left}th{font-size:12px;text-transform:uppercase;color:#666}.totals{margin-left:auto;margin-top:25px;width:320px}.totals div{display:flex;justify-content:space-between;padding:7px 0}.grand{font-size:20px;font-weight:bold;border-top:2px solid #111;margin-top:6px;padding-top:12px!important}.notes{margin-top:28px;color:#555;white-space:pre-wrap}@media print{body{padding:0}}</style></head><body><h1>Customer Quote</h1><div class="sub"><b>${esc(projectName())}</b><br>${esc(customerName())}</div><div class="rule"></div><table><thead><tr><th>Material</th><th>Quantity</th><th style="text-align:right">Price</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><div><span>Subtotal</span><b>${money(t.sell)}</b></div><div><span>Tax (${esc(q.taxRate)}%)</span><b>${money(t.tax)}</b></div><div class="grand"><span>Total</span><span>${money(t.total)}</span></div></div>${q.notes?`<div class="notes">${esc(q.notes)}</div>`:''}<script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  };

  function injectNav(){
    const nav=document.querySelector('aside nav');
    if(!nav) return;
    if(!document.getElementById('forge-workspace-nav')){
      const first=nav.querySelector('button');
      first?.insertAdjacentHTML('beforebegin', `<div id="forge-job-label" class="pb-2 px-4 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Job</div><button id="forge-workspace-nav" onclick="view='workspace';render()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${view==='workspace'?'bg-slate-800 text-white':'text-slate-400 hover:text-white hover:bg-slate-800/60'}">${icon('briefcase-business')}<span class="font-medium">Job Workspace</span></button><button id="forge-quote-nav" onclick="view='quote';render()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${view==='quote'?'bg-slate-800 text-white':'text-slate-400 hover:text-white hover:bg-slate-800/60'}">${icon('calculator')}<span class="font-medium">Quote</span></button>`);
    }
    if(window.lucide) lucide.createIcons();
  }

  window.installForgeWorkspace=function(){
    if(installed) return; installed=true;
    const priorRender=render;
    render=function forgeWorkspaceRender(){
      if(view==='workspace' || view==='quote'){
        const content=view==='workspace'?workspaceView():quoteView();
        document.getElementById('app').innerHTML=layout(content);
        injectNav();
        if(typeof window.forgeSuiteInject==='function') window.forgeSuiteInject();
        if(window.lucide) lucide.createIcons();
        return;
      }
      priorRender();
      injectNav();
    };
    const priorTitle=pageTitle;
    pageTitle=function(){ if(view==='workspace') return 'Job Workspace'; if(view==='quote') return 'Quote Builder'; return priorTitle(); };
    injectNav();
  };
})();