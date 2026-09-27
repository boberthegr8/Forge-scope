(() => {
 function mount(){
  const shell=document.querySelector('.auto-shell')||document.querySelector('.forge-ai-mount');
  if(!shell||document.getElementById('auto-api-settings')||!window.ForgeAI)return;
  const section=document.createElement('section');section.id='auto-api-settings';section.className='auto-card no-print';
  section.innerHTML=`<h3>AI provider</h3><p data-status role="status">Checking your account…</p><label>Use <select data-mode><option value="shared">Shared AI — owner-controlled allowance</option></select></label><div data-personal hidden><label>Your personal Gemini key <input data-key type="password" autocomplete="off" placeholder="Owner key — this session only"></label><p>Uses your personal Gemini account. Your key is never shared with other users.</p></div><button data-save>Apply selection</button>`;
  shell.prepend(section);
  const status=section.querySelector('[data-status]'),select=section.querySelector('select');
  select.onchange=()=>{section.querySelector('[data-personal]').hidden=select.value!=='personal';};
  section.querySelector('button').onclick=async()=>{try{await window.ForgeAI.configure(select.value,section.querySelector('input').value);section.querySelector('input').value='';status.textContent=select.value==='personal'?'Your personal Gemini account is selected for this session.':'Shared AI selected. No personal key will be used.';}catch(e){status.textContent=e.message;}};
  void window.ForgeAI.identity().then(async({client,context})=>{
   if(context.is_owner){const option=document.createElement('option');option.value='personal';option.textContent='My personal Gemini — owner only';select.append(option);}
   select.value=window.ForgeAI.mode;select.onchange();
   const {data,error}=await client.rpc('forge_ai_settings');if(error)throw error;
   status.textContent='Shared mode: '+data.mode+'. '+data.per_user_daily+' AI calls per user per day. No paid fallback. A separate provider account must be configured before shared AI can run.';
  }).catch(e=>{status.textContent=e.message;});
 }
 window.installForgeAutoScopeApiSettings=mount;
 new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});mount();
})();

