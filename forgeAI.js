(() => {
 let personalKey='', keyUser='', mode='shared';
 // Remove the old origin-wide saved key; keys must never follow a different signed-in user.
 try{localStorage.removeItem('forgeScopeGeminiApiKey');}catch{}
 async function identity(){
  const client=await window.ForgeScopeCore.coreClient();
  const {data,error}=await client.auth.getUser();
  if(error||!data.user){personalKey='';keyUser='';mode='shared';throw new Error('Sign in to Forge before using AI.');}
  if(keyUser&&keyUser!==data.user.id){personalKey='';keyUser='';mode='shared';}
  const {data:context,error:contextError}=await client.rpc('forge_account_context');
  if(contextError)throw contextError;
  return {client,user:data.user,context};
 }
 async function configure(selected,key){
  const {user,context}=await identity();
  if(selected==='personal'&&!context.is_owner)throw new Error('Personal owner mode is only available to the platform owner.');
  mode=selected==='personal'?'personal':'shared';personalKey=mode==='personal'?key.trim():'';keyUser=user.id;
 }
 async function generate(parts){
  const {client,context}=await identity();
  if(mode==='personal'){
   if(!context.is_owner||!personalKey)throw new Error('Enter your owner API key for this session.');
   const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',{
    method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':personalKey},
    body:JSON.stringify({contents:[{role:'user',parts}],generationConfig:{temperature:0.1,responseMimeType:'application/json'}})
   });
   const payload=await response.json();if(!response.ok)throw new Error('Your personal Gemini request failed ('+response.status+').');return payload;
  }
  const {data,error}=await client.functions.invoke('forge-ai',{body:{parts}});
  if(error){let message='Shared AI is unavailable.';try{message=(await error.context.json()).error||message;}catch{}throw new Error(message);}
  if(data.error)throw new Error(data.error);return data;
 }
 window.ForgeAI={identity,configure,generate,get mode(){return mode;}};
})();

