(() => {
 let personalKey='', keyUser='', mode='auto';
 try{localStorage.removeItem('forgeScopeGeminiApiKey');}catch{}
 async function identity(){
  const client=await window.ForgeScopeCore.coreClient();
  const {data,error}=await client.auth.getUser();
  if(error||!data.user){personalKey='';keyUser='';mode='auto';throw new Error('Sign in to Forge before using AI.');}
  if(keyUser&&keyUser!==data.user.id){personalKey='';keyUser='';mode='auto';}
  const {data:context,error:contextError}=await client.rpc('forge_account_context');
  if(contextError)throw contextError;
  return {client,user:data.user,context};
 }
 async function configure(selected,key=''){
  const {user,context}=await identity();
  if(selected==='personal'&&!context.is_owner)throw new Error('Personal owner mode is only available to the platform owner.');
  if(selected==='personal'&&!key.trim())throw new Error('Enter a Gemini key for this session, or choose My Forge account to use your saved connection.');
  mode=['personal','shared'].includes(selected)?selected:'auto';personalKey=mode==='personal'?key.trim():'';keyUser=user.id;
 }
 async function invoke(client,name,body){
  const {data,error}=await client.functions.invoke(name,{body});
  if(error){let message='AI is unavailable. Please try again.';try{message=(await error.context.json()).error||message;}catch{}throw new Error(message);}
  if(data?.error)throw new Error(data.error);return data;
 }
 async function generate(parts){
  const {client,context,user}=await identity();keyUser=user.id;
  if(mode==='auto'&&context.is_owner)return invoke(client,'forge-owner-ai',{action:'generate',parts});
  if(mode==='personal'){
   if(!context.is_owner||!personalKey)throw new Error('Enter your owner API key for this session.');
   const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',{
    method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':personalKey},
    body:JSON.stringify({contents:[{role:'user',parts}],generationConfig:{temperature:0.1,responseMimeType:'application/json'}})
   });
   const payload=await response.json();if(!response.ok)throw new Error('Your personal Gemini request failed ('+response.status+').');return payload;
  }
  return invoke(client,'forge-ai',{parts});
 }
 async function status(){const {client,context}=await identity();return context.is_owner?invoke(client,'forge-owner-ai',{action:'status'}):{configured:false};}
 window.ForgeAI={identity,configure,generate,status,get mode(){return mode;}};
})();

