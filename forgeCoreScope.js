(() => {
  const CONFIG = {
    url: 'https://uyqanhwurngoupmvzxrh.supabase.co',
    publishableKey: 'sb_publishable_SquKrj848EoO9NHZknVkSA_k8CKD7WQ',
    supabaseJsUrl: 'https://esm.sh/@supabase/supabase-js@2.112.4',
    defaultEmail: 'rob.flagg1234@gmail.com',
    defaultLocationCode: 'JK-MAIN'
  };

  let clientPromise = null;
  let coreState = {
    context: null,
    documents: [],
    scopes: [],
    loading: false,
    error: '',
    notice: ''
  };

  function coreClient() {
    if (!clientPromise) {
      clientPromise = import(/* @vite-ignore */ CONFIG.supabaseJsUrl).then(mod => mod.createClient(
        CONFIG.url,
        CONFIG.publishableKey,
        { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
      ));
    }
    return clientPromise;
  }

  function h(value = '') {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function fmtDate(value) {
    if (!value) return '—';
    try { return new Date(value).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }); }
    catch { return '—'; }
  }

  function compactAnalysis(extracted = {}) {
    return {
      textCoverage: extracted.text_coverage ?? extracted.textCoverage ?? null,
      sections: Array.isArray(extracted.sections) ? extracted.sections.slice(0, 30) : [],
      sheets: Array.isArray(extracted.sheets) ? extracted.sheets.slice(0, 60) : [],
      scales: Array.isArray(extracted.scales) ? extracted.scales.slice(0, 30) : [],
      signals: extracted.signals && typeof extracted.signals === 'object' ? extracted.signals : {},
      parserVersion: extracted.parser_version || extracted.parserVersion || null
    };
  }

  function worksheetForCore(scope) {
    const clean = JSON.parse(JSON.stringify(scope || {}));
    // Local UI/cache timestamps are intentionally excluded from Core content hashing/versioning.
    delete clean.updatedAt;
    delete clean.coreVersion;
    delete clean.coreSyncedAt;
    if (clean.readerAnalysis?.extractedData?.pages) delete clean.readerAnalysis.extractedData.pages;
    return clean;
  }

  async function getContext() {
    const client = await coreClient();
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData?.user) return null;

    const { data: memberships, error: membershipError } = await client
      .from('organization_memberships')
      .select('organization_id,role,status')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .limit(1);
    if (membershipError) throw membershipError;
    const membership = memberships?.[0];
    if (!membership) return { userId:userData.user.id, email:userData.user.email || '', organizationId:'', role:'unassigned' };

    const [orgResult, locationsResult] = await Promise.all([
      client.from('organizations').select('id,name').eq('id', membership.organization_id).single(),
      client.from('locations').select('id,name,code').eq('organization_id', membership.organization_id).eq('status','active').order('name')
    ]);
    if (orgResult.error) throw orgResult.error;
    if (locationsResult.error) throw locationsResult.error;
    const locations = locationsResult.data || [];
    const location = locations.find(row => row.code === CONFIG.defaultLocationCode) || locations[0];
    return {
      userId: userData.user.id,
      email: userData.user.email || '',
      organizationId: membership.organization_id,
      organizationName: orgResult.data?.name || 'Forge Organization',
      role: membership.role,
      locationId: location?.id || null,
      locationName: location?.name || 'Organization-wide'
    };
  }

  async function loadCore() {
    coreState.loading = true;
    coreState.error = '';
    drawPanel();
    try {
      const context = await getContext();
      coreState.context = context;
      if (!context?.organizationId) {
        coreState.documents = [];
        coreState.scopes = [];
        return;
      }
      const client = await coreClient();
      const [customersResult, projectsResult, documentsResult, analysesResult, scopesResult] = await Promise.all([
        client.from('customers').select('id,display_name').eq('organization_id',context.organizationId),
        client.from('projects').select('id,name,customer_id').eq('organization_id',context.organizationId),
        client.from('documents').select('id,title,original_filename,document_type,status,created_at,project_id,customer_id,source').eq('organization_id',context.organizationId).eq('source','forge-reader').order('created_at',{ascending:false}).limit(100),
        client.from('document_analysis_runs').select('id,document_id,status,analysis_type,parser,page_count,extracted_data,warnings,error_message,created_at,completed_at').eq('organization_id',context.organizationId).order('created_at',{ascending:false}).limit(300),
        client.from('scopes').select('id,title,scope_type,status,current_version,structured_data,source_document_id,project_id,customer_id,updated_at,source').eq('organization_id',context.organizationId).in('source',['forge-scope','forge-scope-reader']).order('updated_at',{ascending:false}).limit(100)
      ]);
      for (const result of [customersResult,projectsResult,documentsResult,analysesResult,scopesResult]) if (result.error) throw result.error;

      const customerMap = new Map((customersResult.data || []).map(row => [row.id,row.display_name]));
      const projectMap = new Map((projectsResult.data || []).map(row => [row.id,row]));
      const analysisMap = new Map();
      for (const row of analysesResult.data || []) if (!analysisMap.has(row.document_id)) analysisMap.set(row.document_id,row);

      coreState.documents = (documentsResult.data || []).map(row => {
        const project = row.project_id ? projectMap.get(row.project_id) : null;
        const customerId = row.customer_id || project?.customer_id || null;
        return {
          ...row,
          projectName: project?.name || '',
          customerId,
          customerName: customerId ? customerMap.get(customerId) || '' : '',
          analysis: analysisMap.get(row.id) || null
        };
      });
      coreState.scopes = scopesResult.data || [];
    } catch (error) {
      coreState.error = error?.message || String(error);
    } finally {
      coreState.loading = false;
      drawPanel();
      injectCoreButton();
    }
  }

  async function sendMagicLink() {
    const input = document.getElementById('forge-core-email');
    const email = String(input?.value || '').trim();
    if (!email) return;
    coreState.error = '';
    coreState.notice = '';
    drawPanel();
    try {
      const client = await coreClient();
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { shouldCreateUser:false, emailRedirectTo:`${window.location.origin}${window.location.pathname}` }
      });
      if (error) throw error;
      coreState.notice = 'Passwordless Forge sign-in link sent. Open it on this device, then return to Scope.';
    } catch (error) {
      coreState.error = error?.message || String(error);
    }
    drawPanel();
  }

  async function signOut() {
    try {
      const client = await coreClient();
      await client.auth.signOut();
    } finally {
      coreState.context = null;
      coreState.documents = [];
      coreState.scopes = [];
      coreState.notice = 'Signed out of Forge Core.';
      drawPanel();
      injectCoreButton();
    }
  }

  async function syncScope(scope = (typeof current !== 'undefined' ? current : null)) {
    if (!scope) return null;
    const context = await getContext();
    if (!context?.organizationId) throw new Error('Sign into Forge Core before saving this scope.');

    if (!scope.coreScopeId) {
      scope.coreScopeId = crypto.randomUUID();
      scope.core = {
        ...(scope.core || {}),
        organizationId: context.organizationId,
        locationId: context.locationId || null,
        projectId: scope.core?.projectId || null,
        customerId: scope.core?.customerId || null,
        sourceDocumentId: scope.core?.sourceDocumentId || null,
        source: scope.core?.sourceDocumentId ? 'forge-reader' : 'forge-scope'
      };
      if (typeof upsertCurrent === 'function' && typeof current !== 'undefined' && current?.id === scope.id) upsertCurrent();
    } else {
      scope.core = {
        ...(scope.core || {}),
        organizationId: context.organizationId,
        locationId: context.locationId || scope.core?.locationId || null,
        projectId: scope.core?.projectId || null,
        customerId: scope.core?.customerId || null,
        sourceDocumentId: scope.core?.sourceDocumentId || null,
        source: scope.core?.sourceDocumentId ? 'forge-reader' : 'forge-scope'
      };
    }

    const client = await coreClient();
    const { data, error } = await client.rpc('commit_scope_v1', {
      p_scope_id: scope.coreScopeId,
      p_organization_id: context.organizationId,
      p_location_id: context.locationId || null,
      p_project_id: scope.core.projectId || null,
      p_customer_id: scope.core.customerId || null,
      p_source_document_id: scope.core.sourceDocumentId || null,
      p_scope_type: scope.type,
      p_title: scope.fields?.projectName?.value || 'Untitled Scope',
      p_structured_data: worksheetForCore(scope)
    });
    if (error) throw error;

    const result = data?.[0];
    if (result) {
      scope.coreVersion = result.version_number;
      scope.coreSyncedAt = new Date().toISOString();
      if (typeof upsertCurrent === 'function' && typeof current !== 'undefined' && current?.id === scope.id) upsertCurrent();
      if (typeof notifySaved === 'function') {
        notifySaved(result.changed
          ? `Saved to Forge Core • v${result.version_number}`
          : `Forge Core already current • v${result.version_number}`);
      }
    }
    return result;
  }

  function templateOptions(selected = '') {
    if (typeof TYPES === 'undefined') return '';
    return Object.entries(TYPES).map(([key,value]) => `<option value="${h(key)}" ${selected===key?'selected':''}>${h(value.label)}</option>`).join('');
  }

  function defaultTemplate() {
    if (typeof TYPES === 'undefined') return 'barn';
    if (TYPES.singleStorey) return 'singleStorey';
    return Object.keys(TYPES)[0] || 'barn';
  }

  function setField(scope,key,value,source='Forge Core / Reader',status='Confirmed') {
    if (!value || !scope?.fields?.[key]) return;
    scope.fields[key] = { ...scope.fields[key], value:String(value), source, status, reviewed:false };
  }

  async function startFromReader(documentId) {
    const doc = coreState.documents.find(row => row.id === documentId);
    if (!doc) return;
    const select = document.getElementById(`forge-template-${documentId}`);
    const type = select?.value || defaultTemplate();
    if (typeof SCHEMAS === 'undefined' || !SCHEMAS[type]) {
      coreState.error = 'Choose a valid Forge Scope template.';
      return drawPanel();
    }

    const scope = newProject(type,'ai');
    scope.coreScopeId = crypto.randomUUID();
    scope.core = {
      organizationId: coreState.context.organizationId,
      locationId: coreState.context.locationId || null,
      projectId: doc.project_id || null,
      customerId: doc.customerId || null,
      sourceDocumentId: doc.id,
      analysisRunId: doc.analysis?.id || null,
      source: 'forge-reader'
    };
    scope.readerAnalysis = {
      status: doc.analysis?.status || 'queued',
      parser: doc.analysis?.parser || '',
      pageCount: doc.analysis?.page_count || null,
      warnings: Array.isArray(doc.analysis?.warnings) ? doc.analysis.warnings : [],
      extractedData: compactAnalysis(doc.analysis?.extracted_data || {})
    };

    setField(scope,'projectName',doc.projectName || doc.title || doc.original_filename);
    setField(scope,'customer',doc.customerName);

    if (doc.analysis?.status === 'review' && scope.fields?.rfi) {
      setField(
        scope,
        'rfi',
        `Forge Reader could not extract enough machine-readable information from ${doc.original_filename}. Review the drawings manually or run vision/OCR before relying on automated extraction.`,
        'Forge Reader analysis',
        'RFI'
      );
    }

    current = scope;
    upsertCurrent();
    view = 'editor';
    closePanel();
    render();

    try {
      const result = await syncScope(scope);
      if (result) coreState.notice = `Scope linked to Reader document in Forge Core • v${result.version_number}.`;
    } catch (error) {
      coreState.error = `The worksheet is safe in this browser, but Core linking failed: ${error?.message || error}`;
      if (typeof notifySaved === 'function') notifySaved('Saved locally • Core sync needs attention');
    }
  }

  function openCoreScope(scopeId) {
    const row = coreState.scopes.find(item => item.id === scopeId);
    if (!row?.structured_data || typeof row.structured_data !== 'object') return;
    const restored = JSON.parse(JSON.stringify(row.structured_data));
    if (!restored.id) restored.id = `scope_${Date.now()}_core`;
    restored.coreScopeId = row.id;
    restored.coreVersion = row.current_version;
    restored.core = {
      ...(restored.core || {}),
      organizationId: coreState.context?.organizationId || restored.core?.organizationId,
      locationId: coreState.context?.locationId || restored.core?.locationId || null,
      projectId: row.project_id || restored.core?.projectId || null,
      customerId: row.customer_id || restored.core?.customerId || null,
      sourceDocumentId: row.source_document_id || restored.core?.sourceDocumentId || null,
      source: row.source === 'forge-scope-reader' ? 'forge-reader' : 'forge-scope'
    };
    current = restored;
    upsertCurrent();
    view = 'editor';
    closePanel();
    render();
    if (typeof notifySaved === 'function') notifySaved(`Opened from Forge Core • v${row.current_version}`);
  }

  function analysisBadge(doc) {
    const status = doc.analysis?.status || 'queued';
    if (status === 'completed') return '<span class="forge-core-pill ok">Analyzed</span>';
    if (status === 'review') return '<span class="forge-core-pill warn">Needs review</span>';
    if (status === 'failed') return '<span class="forge-core-pill bad">Failed</span>';
    return '<span class="forge-core-pill">Queued</span>';
  }

  function readerCards() {
    if (!coreState.documents.length) return '<div class="forge-core-empty">No Forge Reader documents yet. Upload plans in Forge Reader first.</div>';
    return coreState.documents.map(doc => {
      const compact = compactAnalysis(doc.analysis?.extracted_data || {});
      const sections = compact.sections.slice(0,5).map(x => String(x).replaceAll('_',' ')).join(' • ');
      const sheets = compact.sheets.slice(0,6).join(', ');
      return `<article class="forge-core-row">
        <div class="forge-core-row-main">
          <div class="forge-core-row-title">${h(doc.title || doc.original_filename)}</div>
          <div class="forge-core-row-sub">${h(doc.customerName || 'Unassigned customer')} • ${h(doc.projectName || 'No project')} • ${h(doc.document_type || 'document')}</div>
          <div class="forge-core-row-evidence">${analysisBadge(doc)} ${doc.analysis?.page_count?`<span>${h(doc.analysis.page_count)} pages</span>`:''}${sections?`<span>${h(sections)}</span>`:''}${sheets?`<span>Sheets ${h(sheets)}</span>`:''}</div>
        </div>
        <div class="forge-core-row-actions">
          <select id="forge-template-${h(doc.id)}" class="forge-core-select">${templateOptions(defaultTemplate())}</select>
          <button type="button" class="forge-core-primary" data-reader-start="${h(doc.id)}">Start Scope</button>
        </div>
      </article>`;
    }).join('');
  }

  function coreScopeCards() {
    if (!coreState.scopes.length) return '<div class="forge-core-empty small">No Core scopes yet.</div>';
    return coreState.scopes.map(row => `<article class="forge-core-row compact">
      <div class="forge-core-row-main"><div class="forge-core-row-title">${h(row.title || 'Untitled Scope')}</div><div class="forge-core-row-sub">${h((typeof TYPES!=='undefined'&&TYPES[row.scope_type]?.label)||row.scope_type||'Scope')} • Core v${h(row.current_version)} • ${h(fmtDate(row.updated_at))}</div></div>
      <button type="button" class="forge-core-secondary" data-core-open="${h(row.id)}">Open</button>
    </article>`).join('');
  }

  function connectedPanel() {
    return `<div class="forge-core-heading-row">
      <div><div class="forge-core-eyebrow">FORGE CORE</div><h2>Forge Scope + Reader</h2><p>${h(coreState.context.organizationName)} • ${h(coreState.context.locationName)} • ${h(coreState.context.role)}</p></div>
      <div class="forge-core-header-actions"><button type="button" class="forge-core-secondary" id="forge-core-refresh">Refresh</button><button type="button" class="forge-core-secondary" id="forge-core-signout">Sign out</button></div>
    </div>
    <section class="forge-core-section"><div class="forge-core-section-title"><div><strong>Reader documents</strong><span>Select the Scope template yourself; Reader never guesses the building type.</span></div><a href="https://robquotes.vercel.app" target="_blank" rel="noreferrer">Open Reader ↗</a></div>${readerCards()}</section>
    <section class="forge-core-section"><div class="forge-core-section-title"><div><strong>Core scopes</strong><span>Reopen manual, AI-assisted or Reader-linked worksheets from another browser.</span></div></div>${coreScopeCards()}</section>`;
  }

  function signedOutPanel() {
    return `<div class="forge-core-auth">
      <div class="forge-core-eyebrow">FORGE CORE</div>
      <h2>Connect Scope to Forge Core</h2>
      <p>Use the same passwordless Forge owner identity as CRM and Reader. This creates no separate Scope account.</p>
      <label>Email<input id="forge-core-email" type="email" value="${h(CONFIG.defaultEmail)}"></label>
      <button type="button" class="forge-core-primary wide" id="forge-core-send-link">Send passwordless sign-in link</button>
    </div>`;
  }

  function ensurePanel() {
    let overlay = document.getElementById('forge-core-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'forge-core-overlay';
    overlay.className = 'forge-core-overlay hidden';
    overlay.innerHTML = '<div class="forge-core-backdrop" data-core-close></div><div class="forge-core-panel"><button type="button" class="forge-core-close" data-core-close>×</button><div id="forge-core-panel-body"></div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', event => {
      const target = event.target.closest('[data-core-close],[data-reader-start],[data-core-open]');
      if (!target) return;
      if (target.hasAttribute('data-core-close')) return closePanel();
      if (target.hasAttribute('data-reader-start')) return void startFromReader(target.getAttribute('data-reader-start'));
      if (target.hasAttribute('data-core-open')) return openCoreScope(target.getAttribute('data-core-open'));
    });
    return overlay;
  }

  function drawPanel() {
    const overlay = document.getElementById('forge-core-overlay');
    if (!overlay || overlay.classList.contains('hidden')) return;
    const body = document.getElementById('forge-core-panel-body');
    if (!body) return;
    const alerts = `${coreState.error?`<div class="forge-core-alert bad">${h(coreState.error)}</div>`:''}${coreState.notice?`<div class="forge-core-alert ok">${h(coreState.notice)}</div>`:''}`;
    body.innerHTML = `${alerts}${coreState.loading?'<div class="forge-core-loading">Loading Forge Core…</div>':coreState.context?.organizationId?connectedPanel():signedOutPanel()}`;
    document.getElementById('forge-core-send-link')?.addEventListener('click', () => void sendMagicLink());
    document.getElementById('forge-core-refresh')?.addEventListener('click', () => void loadCore());
    document.getElementById('forge-core-signout')?.addEventListener('click', () => void signOut());
  }

  function openPanel() {
    ensurePanel().classList.remove('hidden');
    coreState.notice = '';
    drawPanel();
    void loadCore();
  }

  function closePanel() {
    document.getElementById('forge-core-overlay')?.classList.add('hidden');
  }

  function injectCoreButton() {
    const actions = document.querySelector('header .flex.items-center.gap-3');
    if (!actions || document.getElementById('forge-core-reader')) return;
    const button = document.createElement('button');
    button.id = 'forge-core-reader';
    button.type = 'button';
    button.className = 'px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-sm font-extrabold flex items-center gap-2 transition';
    button.innerHTML = `<span aria-hidden="true">◆</span><span>${coreState.context?.organizationId?'Forge Core':'Connect Core'}</span>`;
    button.addEventListener('click', openPanel);
    actions.prepend(button);
  }

  function installStyles() {
    if (document.getElementById('forge-core-scope-style')) return;
    const style = document.createElement('style');
    style.id = 'forge-core-scope-style';
    style.textContent = `
      .forge-core-overlay{position:fixed;inset:0;z-index:9999;display:grid;grid-template-columns:minmax(0,1fr) min(760px,92vw)}.forge-core-overlay.hidden{display:none}.forge-core-backdrop{background:rgba(2,6,23,.72);backdrop-filter:blur(4px)}.forge-core-panel{position:relative;background:#0b0c0e;color:#f8fafc;overflow:auto;border-left:1px solid #292c31;box-shadow:-24px 0 60px rgba(0,0,0,.4);padding:28px}.forge-core-close{position:absolute;right:18px;top:14px;width:36px;height:36px;border-radius:10px;border:1px solid #2b2e33;background:#15171a;color:#94a3b8;font-size:24px;line-height:1}.forge-core-heading-row{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding-right:38px}.forge-core-heading-row h2,.forge-core-auth h2{font-size:24px;font-weight:850;margin:4px 0}.forge-core-heading-row p,.forge-core-auth p{color:#9ca3af;font-size:13px}.forge-core-eyebrow{font-size:10px;font-weight:900;letter-spacing:.24em;color:#ff7716}.forge-core-header-actions{display:flex;gap:8px}.forge-core-section{margin-top:26px;border:1px solid #292c31;border-radius:16px;background:#111315;overflow:hidden}.forge-core-section-title{padding:16px 18px;border-bottom:1px solid #292c31;display:flex;justify-content:space-between;gap:16px;align-items:center}.forge-core-section-title strong{display:block;font-size:14px}.forge-core-section-title span{display:block;font-size:11px;color:#777f89;margin-top:3px}.forge-core-section-title a{font-size:12px;color:#ff8a35;font-weight:750}.forge-core-row{display:flex;gap:18px;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid #202328}.forge-core-row:last-child{border-bottom:0}.forge-core-row.compact{padding:13px 18px}.forge-core-row-main{min-width:0}.forge-core-row-title{font-weight:800;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:430px}.forge-core-row-sub{font-size:11px;color:#8b949e;margin-top:4px}.forge-core-row-evidence{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;font-size:10px;color:#707883;margin-top:8px}.forge-core-row-actions{display:grid;grid-template-columns:minmax(150px,1fr) auto;gap:8px;min-width:300px}.forge-core-select,.forge-core-auth input{background:#17191c;border:1px solid #30343a;color:#f8fafc;border-radius:9px;padding:9px 10px;font-size:12px;outline:none}.forge-core-primary,.forge-core-secondary{border-radius:9px;padding:9px 12px;font-size:12px;font-weight:800;cursor:pointer}.forge-core-primary{background:#ff7716;color:#111}.forge-core-primary:hover{background:#ff8b39}.forge-core-primary.wide{width:100%;padding:12px}.forge-core-secondary{background:#191b1f;border:1px solid #30343a;color:#d7dce2}.forge-core-pill{display:inline-flex;border-radius:999px;background:#2a2117;color:#ff9a52;padding:3px 7px;font-weight:800}.forge-core-pill.ok{background:#12271e;color:#71d89c}.forge-core-pill.warn{background:#2c2412;color:#f3c969}.forge-core-pill.bad{background:#32191c;color:#ff8c94}.forge-core-empty,.forge-core-loading{padding:30px;text-align:center;color:#717985;font-size:12px}.forge-core-empty.small{padding:20px}.forge-core-alert{padding:11px 13px;border-radius:10px;font-size:12px;margin-bottom:14px}.forge-core-alert.bad{background:#35181d;color:#ffadb3;border:1px solid #62252e}.forge-core-alert.ok{background:#13281e;color:#8ce0aa;border:1px solid #25523b}.forge-core-auth{max-width:460px;margin:90px auto}.forge-core-auth label{display:grid;gap:7px;margin:22px 0 12px;font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#818996;font-weight:800}.forge-core-auth input{font-size:14px;text-transform:none;letter-spacing:0}.forge-core-loading{margin-top:100px;font-size:14px}@media(max-width:800px){.forge-core-overlay{grid-template-columns:1fr}.forge-core-backdrop{display:none}.forge-core-panel{width:100vw}.forge-core-row{align-items:flex-start;flex-direction:column}.forge-core-row-actions{min-width:0;width:100%;grid-template-columns:1fr}.forge-core-heading-row{flex-direction:column}.forge-core-row-title{max-width:80vw}}
    `;
    document.head.appendChild(style);
  }

  installStyles();
  ensurePanel();

  if (typeof render === 'function') {
    const priorRender = render;
    render = function forgeCoreScopeRenderWrapper() {
      priorRender();
      injectCoreButton();
    };
  }

  if (typeof saveCurrent === 'function') {
    const priorSaveCurrent = saveCurrent;
    saveCurrent = function forgeCoreScopeSaveWrapper() {
      priorSaveCurrent();
      if (typeof current !== 'undefined' && current && coreState.context?.organizationId) {
        void syncScope(current).catch(error => {
          console.error('Forge Core Scope save failed', error);
          if (typeof notifySaved === 'function') notifySaved('Saved locally • Core sync failed');
        });
      }
    };
  }

  if (typeof duplicateProject === 'function') {
    const priorDuplicateProject = duplicateProject;
    duplicateProject = function forgeCoreSafeDuplicateProject(id) {
      priorDuplicateProject(id);
      const copy = typeof saved !== 'undefined' ? saved?.[0] : null;
      if (!copy || copy.id === id) return;
      delete copy.coreScopeId;
      delete copy.coreVersion;
      delete copy.coreSyncedAt;
      if (copy.core) {
        copy.core = {
          ...copy.core,
          source: copy.core.sourceDocumentId ? 'forge-reader' : 'forge-scope'
        };
      }
      if (typeof persist === 'function') persist();
      if (typeof render === 'function') render();
    };
  }

  window.ForgeScopeCore = { openPanel, loadCore, syncScope, getContext };

  void coreClient().then(client => {
    client.auth.onAuthStateChange(() => window.setTimeout(() => void loadCore(), 0));
  });
  void getContext().then(context => { coreState.context = context; injectCoreButton(); });
  injectCoreButton();
})();
