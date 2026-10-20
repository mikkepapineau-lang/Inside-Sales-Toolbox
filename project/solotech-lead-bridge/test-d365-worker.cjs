const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let store={},tabs=[],created=[],injected=[],messages=[],allow=true;
const chrome={permissions:{contains:async()=>allow},storage:{session:{get:async k=>Object.fromEntries([k].flat().map(k=>[k,store[k]])),set:async o=>Object.assign(store,o),remove:async k=>{delete store[k]}}},tabs:{get:async id=>{const t=tabs.find(t=>t.id===id);if(!t)throw Error('missing');return t},query:async()=>tabs,create:async o=>{created.push(o);const t={id:42,url:o.url,status:'complete',...o};tabs.push(t);return t},update:async(id,o)=>{const t=tabs.find(t=>t.id===id);if(!t)throw Error('missing');Object.assign(t,o);return t}},scripting:{executeScript:async o=>{injected.push(o);return o.files?[]:[{result:{value:{message:'done',report:[],actual:[]}}}]}},runtime:{id:'test',onMessage:{addListener:f=>messages.push(f)}}};
const c={chrome,URL,setTimeout:f=>f()};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'d365-worker.js'),'utf8'),c);
(async()=>{
 await c.d365Run('fill',{data:{}});assert.equal(created.length,1);assert.equal(created[0].active,false);assert.ok(created[0].url.includes('cmp=CAOP&mi=smmBusinessRelationsListPage'));assert.ok(injected.every(x=>x.target.tabId===42));
 await c.d365Run('fill',{data:{}});assert.equal(created.length,1);
 allow=false;await assert.rejects(()=>c.d365Run('confirm',{}),/Autorise/);allow=true;
 store={};tabs=[{id:1,url:'https://solotech.operations.dynamics.com/?cmp=CAOP',status:'complete'},{id:2,url:'https://solotech.operations.dynamics.com/?cmp=CAOP',status:'complete'}];await assert.rejects(()=>c.d365Run('fill',{}),/Plusieurs/);
 store={d365TargetId:1};tabs=[{id:1,url:'https://login.microsoftonline.com/',status:'complete'}];await c.d365Run('show',{});assert.equal(tabs[0].active,true);
 console.log('OK — onglet créé sans activation, réutilisation, injection ciblée, permission, ambiguïté et affichage connexion (simulation).');
})().catch(e=>{console.error(e);process.exitCode=1});
