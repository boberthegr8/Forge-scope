(() => {
 function mount(){
  const shell=document.querySelector('.auto-shell')||document.querySelector('.forge-ai-mount');
  if(!shell||document.getElementById('auto-api-settings')||!window.ForgeAI)return;
  const section=document.createElement('section');section.id='auto-api-settings';section.className='auto-card no-print';
  section.innerHTML=`<h3>AI connection</h3><p data-status role="status">Checking your account…</p><label>Use <select data-mode><option value="auto">My Forge account — automatic</option><option value="shared">Shared AI allowance</option></select></label><div data-personal hidden><label>Gemini key for this session <input data-key type="password" autocomplete="off" placeholder="Owner key — this session only"></label></div><p data-owner hidden><a href="https://app.forgehub.dev/account.html?returnTo=https%3A%2F%2Fscope.forgehub.dev%2F">Manage my saved AI connection</a> · Your personal AI is available only to your owner account.</p><button data-save>Apply selection</button>`;
  shell.prepend(section);
  const status=section.querySelector('[data-status]'),select=section.querySelector('select');
  select.onchange=()=>{section.querySelector('[data-personal]').hidden=select.value!=='personal';};
  async function describe(context){
   if(window.ForgeAI.mode==='personal'){status.textContent='Your personal Gemini key is active for this tab. Usage is billed to your Gemini account.';return;}
   if(window.ForgeAI.mode==='auto'&&context.is_owner){const saved=await window.ForgeAI.status();status.textContent=saved.configured?'Owner recognized. Your saved personal Gemini connection is selected automatically. Usage is billed to your Gemini account.':'Owner recognized. Connect your Gemini key once under Account & admin → My AI connection, then return here. You do not need shared AI.';return;}
   status.textContent='Shared AI selected. Availability and limits are controlled by the Forge owner.';
  }
  section.querySelector('button').onclick=async()=>{try{await window.ForgeAI.configure(select.value,section.querySelector('input').value);section.querySelector('input').value='';const {context}=await window.ForgeAI.identity();await describe(context);}catch(e){status.textContent=e.message;}};
  void window.ForgeAI.identity().then(async({context})=>{
   if(context.is_owner){const option=document.createElement('option');option.value='personal';option.textContent='Personal Gemini — temporary key';select.append(option);section.querySelector('[data-owner]').hidden=false;}
   select.value=window.ForgeAI.mode;select.onchange();await describe(context);
  }).catch(e=>{status.textContent=e.message;});
 }
 window.installForgeAutoScopeApiSettings=mount;
 new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});mount();
})();

