(() => {
  const MODULES = [
    { key:'home', label:'Home', href:'https://forge2-navy.vercel.app' },
    { key:'crm', label:'CRM', href:'https://forge-crm-six.vercel.app' },
    { key:'reader', label:'Reader', href:'https://robquotes.vercel.app' },
    { key:'scope', label:'Scope', active:true },
    { key:'manufacturing', label:'Manufacturing', href:'https://forgemfg.vercel.app' },
    { key:'portal', label:'Portal', href:'https://forge-portal-pi.vercel.app' }
  ];

  function installStyles(){
    if(document.getElementById('forge-suite-nav-style')) return;
    const style=document.createElement('style');
    style.id='forge-suite-nav-style';
    style.textContent=`
      .forge-suite-switcher{margin:2px 0 14px;padding:0 0 14px;border-bottom:1px solid var(--forge-border-soft,#21242a)}
      .forge-suite-label{padding:0 12px 6px;font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:var(--forge-muted,#6f747d)}
      .forge-suite-link{display:flex;align-items:center;justify-content:space-between;margin:2px 0;padding:10px 14px;border:1px solid transparent;border-radius:9px;color:var(--forge-secondary,#a5a9b1);font-size:14px;font-weight:650;text-decoration:none;transition:140ms ease}
      .forge-suite-link:hover{color:#fff;background:#17191d}.forge-suite-link.active{color:#fff;background:rgba(255,118,23,.10);border-color:rgba(255,118,23,.18)}
      .forge-suite-dot{width:7px;height:7px;border-radius:999px;background:var(--forge-accent,#ff7617);box-shadow:0 0 0 4px rgba(255,118,23,.10)}
      .forge-suite-arrow{font-size:10px;font-weight:900;color:var(--forge-muted,#6f747d)}
    `;
    document.head.appendChild(style);
  }

  function markup(){
    return `<div id="forge-suite-nav" class="forge-suite-switcher"><div class="forge-suite-label">Forge Suite</div>${MODULES.map(m=>m.active?`<div class="forge-suite-link active"><span>${m.label}</span><span class="forge-suite-dot"></span></div>`:`<a class="forge-suite-link" href="${m.href}"><span>${m.label}</span><span class="forge-suite-arrow">↗</span></a>`).join('')}</div>`;
  }

  function injectSidingShortcut(){
    const nav=document.querySelector('aside nav');
    if(!nav||document.getElementById('forge-siding-template-link')||!window.installForgeSidingScope) return;
    window.installForgeSidingScope();
    const deckButton=[...nav.querySelectorAll('button')].find(btn=>btn.textContent.trim().includes('Decks'));
    if(!deckButton) return;
    deckButton.insertAdjacentHTML('afterend',`<button id="forge-siding-template-link" onclick="startNew('siding','manual')" class="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition text-slate-400 hover:text-white hover:bg-slate-800/60"><span class="flex items-center gap-3"><i data-lucide="panels-top-left" class="w-5 h-5"></i><span class="font-medium">Siding</span></span></button>`);
  }

  function inject(){
    const nav=document.querySelector('aside nav');
    if(!nav) return;
    if(!document.getElementById('forge-suite-nav')) nav.insertAdjacentHTML('afterbegin',markup());
    injectSidingShortcut();
    window.installForgeAutoScopeAI?.();
    window.installForgeAutoScopeFinalize?.();
    if(window.lucide) lucide.createIcons();
  }
  window.forgeSuiteInject=inject;

  function loadScript(src,id){
    return new Promise((resolve,reject)=>{
      if(document.getElementById(id)) return resolve();
      const s=document.createElement('script'); s.id=id; s.src=src; s.onload=resolve; s.onerror=reject; document.body.appendChild(s);
    });
  }

  installStyles();
  Promise.resolve()
    .then(()=>loadScript('/forgeSidingScope.js','forge-siding-scope-module'))
    .then(()=>{ window.installForgeSidingScope?.(); })
    .then(()=>loadScript('/forgeWorkspace.js','forge-workspace-module'))
    .then(()=>loadScript('/forgeBomEvolution.js','forge-bom-evolution-module'))
    .then(()=>loadScript('/forgeAutoScopeCompat.js','forge-auto-scope-compat-module'))
    .then(()=>loadScript('/forgeAutoScopeAI.js','forge-auto-scope-ai-module'))
    .then(()=>loadScript('/forgeAutoScopeFinalize.js','forge-auto-scope-finalize-module'))
    .then(()=>{ window.installForgeBomEvolution?.(); window.installForgeWorkspace?.(); window.installForgeAutoScopeAI?.(); window.installForgeAutoScopeFinalize?.(); inject(); if(typeof render==='function') render(); })
    .catch(err=>{ console.error('Forge module load failed',err); inject(); });

  if(typeof render==='function'){
    const priorRender=render;
    render=function forgeSuiteNavigationRenderWrapper(){
      window.installForgeSidingScope?.();
      window.installForgeBomEvolution?.();
      window.installForgeAutoScopeAI?.();
      window.installForgeAutoScopeFinalize?.();
      priorRender();
      inject();
    };
  }
  inject();
})();