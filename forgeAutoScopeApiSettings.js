(() => {
  const STORAGE_KEY='forgeScopeGeminiApiKey';
  const MODEL_KEY='forgeScopeGeminiModel';

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function sync(){
    try{
      const saved=localStorage.getItem(STORAGE_KEY)||'';
      const model=localStorage.getItem(MODEL_KEY)||'';
      if(saved && typeof geminiSessionKey!=='undefined') geminiSessionKey=saved;
      if(model && typeof geminiCompareModel!=='undefined') geminiCompareModel=model;
    }catch(_){ }
  }
  function panel(){
    const key=(typeof geminiSessionKey!=='undefined'&&geminiSessionKey)||localStorage.getItem(STORAGE_KEY)||'';
    const model=(typeof geminiCompareModel!=='undefined'&&geminiCompareModel)||localStorage.getItem(MODEL_KEY)||'gemini-3.7-flash';
    return `<section id="auto-api-settings" class="auto-card auto-api-settings no-print">
      <div class="auto-head"><div><div class="auto-kicker">FORGE AI SETTINGS</div><h3>Gemini API Key</h3><p>Paste your Gemini API key here. Automatic Scope will use this key for Scope, Takeoff and BOM Audit.</p></div><span class="auto-api-badge ${key?'connected':''}">${key?'KEY SAVED':'KEY REQUIRED'}</span></div>
      <div class="auto-api-grid"><label>Gemini API Key<input id="autoGeminiKey" type="password" autocomplete="off" value="${esc(key)}" placeholder="Paste Gemini API key"></label><label>AI Model<select id="autoGeminiModel"><option value="gemini-3.7-flash" ${model==='gemini-3.7-flash'?'selected':''}>Gemini 3.7 Flash</option><option value="gemini-3.6-flash" ${model==='gemini-3.6-flash'?'selected':''}>Gemini 3.6 Flash</option><option value="gemini-2.5-pro" ${model==='gemini-2.5-pro'?'selected':''}>Gemini 2.5 Pro</option></select></label></div>
      <div class="auto-api-actions"><button class="auto-api-save" onclick="autoScopeSaveApiKey()">Save AI Settings</button><button onclick="autoScopeClearApiKey()">Clear Key</button><button onclick="autoScopeToggleApiKey()">Show / Hide</button></div>
      <div id="autoApiStatus" class="auto-api-note">${key?'API key is saved in this browser and ready to use.':'Enter a Gemini API key before running Automatic Scope AI.'}</div>
    </section>`;
  }
  function styles(){
    if(document.getElementById('forge-auto-api-settings-style'))return;
    const s=document.createElement('style');s.id='forge-auto-api-settings-style';s.textContent=`
      .auto-api-settings{margin-bottom:18px}.auto-api-badge{font-size:10px;font-weight:900;letter-spacing:.08em;border:1px solid #fecaca;background:#fff1f2;color:#be123c;border-radius:999px;padding:7px 10px;white-space:nowrap}.auto-api-badge.connected{border-color:#bbf7d0;background:#f0fdf4;color:#15803d}
      .auto-api-grid{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:12px;margin-top:15px}.auto-api-grid label{font-size:12px;font-weight:750;color:#475569}.auto-api-grid input,.auto-api-grid select{width:100%;margin-top:6px;border:1px solid #d7dee7;border-radius:10px;padding:11px;background:#fff;font-size:14px}.auto-api-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.auto-api-actions button{border:1px solid #d7dee7;background:#fff;border-radius:9px;padding:9px 12px;font-size:12px;font-weight:800;cursor:pointer}.auto-api-actions .auto-api-save{background:#ff7617;border-color:#ff7617;color:#fff}.auto-api-note{font-size:11px;color:#64748b;margin-top:9px}
      @media(max-width:850px){.auto-api-grid{grid-template-columns:1fr}.auto-api-actions{display:grid;grid-template-columns:1fr}.auto-api-actions button{min-height:46px}.auto-api-badge{display:inline-block;margin-top:10px}}
    `;document.head.appendChild(s);
  }
  function mount(){
    if(typeof view==='undefined'||view!=='autoScopeAI')return;
    const shell=document.querySelector('.auto-shell');if(!shell)return;
    document.getElementById('auto-api-settings')?.remove();
    const hero=shell.querySelector('.auto-hero');
    if(hero)hero.insertAdjacentHTML('afterend',panel()); else shell.insertAdjacentHTML('afterbegin',panel());
  }
  window.autoScopeSaveApiKey=()=>{
    const input=document.getElementById('autoGeminiKey'),sel=document.getElementById('autoGeminiModel');
    const key=String(input?.value||'').trim(),model=String(sel?.value||'gemini-3.7-flash');
    if(typeof geminiSessionKey!=='undefined')geminiSessionKey=key;
    if(typeof geminiCompareModel!=='undefined')geminiCompareModel=model;
    try{if(key)localStorage.setItem(STORAGE_KEY,key);else localStorage.removeItem(STORAGE_KEY);localStorage.setItem(MODEL_KEY,model);}catch(_){ }
    mount();
  };
  window.autoScopeClearApiKey=()=>{if(typeof geminiSessionKey!=='undefined')geminiSessionKey='';try{localStorage.removeItem(STORAGE_KEY);}catch(_){ }mount();};
  window.autoScopeToggleApiKey=()=>{const x=document.getElementById('autoGeminiKey');if(x)x.type=x.type==='password'?'text':'password';};
  window.installForgeAutoScopeApiSettings=()=>{styles();sync();mount();};
  styles();sync();
  const obs=new MutationObserver(()=>{if(typeof view!=='undefined'&&view==='autoScopeAI'&&document.querySelector('.auto-shell')&&!document.getElementById('auto-api-settings'))mount();});obs.observe(document.body,{childList:true,subtree:true});
  mount();
})();