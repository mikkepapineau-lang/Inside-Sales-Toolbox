const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const listeners=[],writes=[];let storageTouches=0,finished=0,dropMessages=false;
const chrome={permissions:{contains:async()=>true},storage:{session:{get:async()=>({}),set:async o=>writes.push(o),remove:async()=>{}}},tabs:{query:async()=>[{id:7,status:'complete',url:'https://solotech.operations.dynamics.com/?cmp=CAOP'}],get:async()=>({id:7,status:'complete',url:'https://solotech.operations.dynamics.com/?cmp=CAOP'})},runtime:{id:'ext',onMessage:{addListener:f=>listeners.push(f)}},scripting:{executeScript:async o=>{
 if(o.files)return [];
 const pageChrome={get storage(){storageTouches++;throw Error('Access to storage is not allowed from this context.');},runtime:{sendMessage:async m=>{
  if(dropMessages)throw Error('Port closed');
  return new Promise(resolve=>{for(const listener of listeners)listener(m,{id:'ext',tab:{id:7}},resolve)});
 }}};
 const page={chrome:pageChrome,solotechQuotation:{create:async opts=>{await opts.onProgress('1/4 · Vérification du prospect ouvert…');finished++;return {message:'done'}}},args:o.args};vm.createContext(page);
 const result=await vm.runInContext('('+o.func.toString()+')(...args)',page);return [{result}];
}}};
const c={chrome,URL,setTimeout};vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/d365-worker.js','utf8'),c);
(async()=>{
 await c.d365Run('quote',{});assert.equal(finished,1);assert.equal(storageTouches,0);assert.ok(writes.some(x=>x.d365Status?.startsWith('1/4')));
 dropMessages=true;await c.d365Run('quote',{});assert.equal(finished,2);assert.equal(storageTouches,0);
 let reply;for(const l of listeners)l({kind:'d365Progress',message:'forged',token:'1'},{id:'wrong',tab:{id:7}},r=>reply=r);
 assert.equal(reply.accepted,false);assert.ok(!writes.some(x=>x.d365Status==='forged'));
 console.log('OK — stockage interdit dans la page : création poursuit, statut relayé par le worker; échec de statut non bloquant; messages étrangers refusés.');
})().catch(e=>{console.error(e);process.exitCode=1});
