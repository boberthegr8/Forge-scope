import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.4';

const SHARED_KEY = 'forge-core-auth';
const COOKIE_DOMAIN = '.forgehub.dev';
const CHUNK = 3500;
function readRaw(name){
  const re = new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, '\\$1') + '=([^;]*)');
  const m = document.cookie.match(re);
  return m ? decodeURIComponent(m[1]) : null;
}
function writeRaw(name, value, days){
  let expires = '';
  if (days != null) { const d = new Date(); d.setTime(d.getTime() + days*864e5); expires = '; expires=' + d.toUTCString(); }
  document.cookie = name + '=' + encodeURIComponent(value) + expires + '; domain=' + COOKIE_DOMAIN + '; path=/; secure; samesite=lax';
}
function clearRaw(name){
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=' + COOKIE_DOMAIN + '; path=/; secure; samesite=lax';
}
const cookieStorage = {
  getItem: key => {
    const nRaw = readRaw(key + '.n');
    if (nRaw === null) return readRaw(key);
    const n = parseInt(nRaw, 10) || 0;
    let out = '';
    for (let i = 0; i < n; i++) { const part = readRaw(key + '.' + i); if (part === null) return null; out += part; }
    return out;
  },
  setItem: (key, value) => {
    cookieStorage.removeItem(key);
    const chunks = [];
    for (let i = 0; i < value.length; i += CHUNK) chunks.push(value.slice(i, i + CHUNK));
    if (!chunks.length) chunks.push('');
    chunks.forEach((c, j) => writeRaw(key + '.' + j, c, 34));
    writeRaw(key + '.n', String(chunks.length), 34);
  },
  removeItem: key => {
    const nRaw = readRaw(key + '.n');
    const n = nRaw !== null ? (parseInt(nRaw, 10) || 0) : 0;
    const clearUpTo = Math.max(n, 8);
    for (let i = 0; i < clearUpTo; i++) clearRaw(key + '.' + i);
    clearRaw(key + '.n');
    clearRaw(key);
  }
};

export const core = createClient('https://uyqanhwurngoupmvzxrh.supabase.co',
  'sb_publishable_SquKrj848EoO9NHZknVkSA_k8CKD7WQ', {
    auth: {persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:cookieStorage,storageKey:SHARED_KEY},
    global:{headers:{'x-forge-module':'home'}}
  });
export const appOrigins = ['https://app.forgehub.dev','https://crm.forgehub.dev',
  'https://scope.forgehub.dev','https://reader.forgehub.dev','https://quote.forgehub.dev',
  'https://manufacturing.forgehub.dev','https://portal.forgehub.dev','https://frame.forgehub.dev',
  'https://todo.forgehub.dev','https://ai.forgehub.dev'];
export function safeReturn(value) {
  try {
    const url=new URL(value);
    return appOrigins.includes(url.origin) && !url.username && !url.password ? url.href : '/';
  } catch { return '/'; }
}
