import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
const source=(await readFile(new URL('../assets/termo-analytics.js',import.meta.url),'utf8'))
 .replace(/\}\)\(\);\s*$/, 'window.__signupTest = { offerSignupMeasurement, setToken: (token) => { authAccessToken = token; } };\n})();');
function setup({available=true, claim=true}={}) {
 const calls=[]; const panels=[]; const buttons={};
 const doc={readyState:'loading',referrer:'',head:{appendChild(){}},body:{appendChild(n){panels.push(n);}},querySelector(){return null;},addEventListener(){},
  createElement(tag){if(tag!=='section') return {setAttribute(){}}; const panel={style:{}, setAttribute(){}, remove(){this.removed=true;}, querySelector(sel){return buttons[sel] ||= {disabled:false,addEventListener(_n,fn){this.click=fn;}};}}; return panel;}};
 const values=new Map(); const storage={getItem(k){return values.get(k)||null;},setItem(k,v){values.set(k,String(v));},removeItem(k){values.delete(k);}};
 const w={location:new URL('https://termo.app.br/'),localStorage:storage,sessionStorage:storage,crypto:{randomUUID(){return 'session';}},screen:{width:400},setTimeout(){return 1;},clearTimeout(){},setInterval(){},addEventListener(){},history:{replaceState(){}}};
 const ctx=vm.createContext({window:w,document:doc,navigator:{language:'pt-BR'},URL,URLSearchParams,Intl,Date,Math,Element:class{},fetch:async (url,options)=>{calls.push({url,options});if(url==='/api/public-config')return {ok:true,json:async()=>({supabaseUrl:'https://example.supabase.co',supabasePublishableKey:'public'})};return {ok:true,json:async()=>url.endsWith('signup_measurement_available')?available:typeof claim === 'function'?claim():claim};}});
 vm.runInContext(source,ctx); w.__signupTest.setToken('private-token');
 return {w,calls,panels,buttons};
}
const events=w=>Array.from(w.dataLayer||[]).filter(e=>e[0]==='event'&&e[1]==='sign_up');
test('não mostra pedido para conta inelegível',async()=>{const x=setup({available:false});await x.w.__signupTest.offerSignupMeasurement();assert.equal(x.panels.length,0);assert.equal(events(x.w).length,0);});
test('recusa não reivindica nem envia evento',async()=>{const x=setup();await x.w.__signupTest.offerSignupMeasurement();x.buttons['[data-signup-decline]'].click();assert.equal(x.calls.filter(c=>c.url.endsWith('claim_signup_measurement')).length,0);assert.equal(events(x.w).length,0);assert.equal(x.panels[0].removed,true);});
test('aceite e reivindicação positiva geram evento sem token ou identidade',async()=>{const x=setup();await x.w.__signupTest.offerSignupMeasurement();await x.buttons['[data-signup-allow]'].click();assert.equal(events(x.w).length,1);assert.doesNotMatch(JSON.stringify(events(x.w)),/private-token/);});
test('conta já reivindicada não gera evento',async()=>{const x=setup({claim:false});await x.w.__signupTest.offerSignupMeasurement();await x.buttons['[data-signup-allow]'].click();assert.equal(events(x.w).length,0);});
test('troca de sessão durante confirmação impede envio',async()=>{let finish;const x=setup({claim:()=>new Promise(resolve=>{finish=resolve;})});await x.w.__signupTest.offerSignupMeasurement();const pending=x.buttons['[data-signup-allow]'].click();await new Promise(resolve=>setImmediate(resolve));x.w.__signupTest.setToken('');finish(true);await pending;assert.equal(events(x.w).length,0);});
