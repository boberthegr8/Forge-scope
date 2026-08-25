(() => {
  const MODULES = [
    { key: 'crm', label: 'CRM', href: 'https://forge-crm-six.vercel.app' },
    { key: 'reader', label: 'Reader', href: 'https://robquotes.vercel.app' },
    { key: 'scope', label: 'Scope', active: true },
    { key: 'quoter', label: 'Quote / AI Quoter', comingSoon: true }
  ];

  function installStyles() {
    if (document.getElementById('forge-suite-nav-style')) return;
    const style = document.createElement('style');
    style.id = 'forge-suite-nav-style';
    style.textContent = `
      .forge-suite-switcher{margin:2px 0 14px;padding:0 0 14px;border-bottom:1px solid var(--forge-border-soft,#21242a)}
      .forge-suite-label{padding:0 12px 6px;font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:var(--forge-muted,#6f747d)}
      .forge-suite-link{display:flex;align-items:center;justify-content:space-between;margin:2px 0;padding:10px 14px;border:1px solid transparent;border-radius:9px;color:var(--forge-secondary,#a5a9b1);font-size:14px;font-weight:650;text-decoration:none;transition:140ms ease}
      .forge-suite-link:hover{color:#fff;background:#17191d}
      .forge-suite-link.active{color:#fff;background:rgba(255,118,23,.10);border-color:rgba(255,118,23,.18)}
      .forge-suite-link.disabled{opacity:.4;cursor:default}
      .forge-suite-dot{width:7px;height:7px;border-radius:999px;background:var(--forge-accent,#ff7617);box-shadow:0 0 0 4px rgba(255,118,23,.10)}
      .forge-suite-arrow,.forge-suite-next{font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--forge-muted,#6f747d)}
    `;
    document.head.appendChild(style);
  }

  function markup() {
    return `<div id="forge-suite-nav" class="forge-suite-switcher">
      <div class="forge-suite-label">Forge Suite</div>
      ${MODULES.map(module => {
        if (module.active) return `<div class="forge-suite-link active"><span>${module.label}</span><span class="forge-suite-dot"></span></div>`;
        if (module.comingSoon) return `<div class="forge-suite-link disabled"><span>${module.label}</span><span class="forge-suite-next">Next</span></div>`;
        return `<a class="forge-suite-link" href="${module.href}"><span>${module.label}</span><span class="forge-suite-arrow">↗</span></a>`;
      }).join('')}
    </div>`;
  }

  function inject() {
    const nav = document.querySelector('aside nav');
    if (!nav || document.getElementById('forge-suite-nav')) return;
    nav.insertAdjacentHTML('afterbegin', markup());
  }

  installStyles();
  if (typeof render === 'function') {
    const priorRender = render;
    render = function forgeSuiteNavigationRenderWrapper() {
      priorRender();
      inject();
    };
  }
  inject();
})();
