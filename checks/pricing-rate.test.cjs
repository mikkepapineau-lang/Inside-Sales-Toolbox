const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let clock=Date.parse('2026-10-16T05:00:00Z'),stored={},calls=0,allowed=true,mode='ok',release,listener;
class Clock extends Date{static now(){return clock;}}
const payload={observations:[{d:'2026-10-15',FXUSDCAD:{v:'1.4000'}}]};
const chrome={runtime:{id:'test',onMessage:{addListener:f=>listener=f}},permissions:{contains:async()=>allowed},storage:{local:{get:async k=>({[k]:stored[k]}),set:async v=>Object.assign(stored,v)}}};
const c=vm.createContext({chrome,Date:Clock,AbortSignal:{timeout:()=>({})},fetch:async(url,opts)=>{calls++;assert.equal(url,'https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1');assert.equal(opts.credentials,'omit');assert.equal(opts.referrerPolicy,'no-referrer');if(mode==='deferred')await new Promise(r=>release=r);if(mode==='error')throw Error('offline');return {ok:true,json:async()=>mode==='bad'?{observations:[]}:payload};}});
vm.runInContext(fs.readFileSync('project/inside-sales-toolbox-team/pricing-rate.js','utf8'),c);const R=c.ToolboxPricingRate;
(async()=>{
 let r=await R.read();assert.equal(r.rate,'1.4000');assert.equal(r.date,'2026-10-15');assert.equal(calls,1);await R.read();assert.equal(calls,1);
 mode='deferred';const a=R.read(true),b=R.read(true);await new Promise(r=>setImmediate(r));assert.equal(calls,2);release();await Promise.all([a,b]);
 clock+=3600001;mode='error';r=await R.read();assert(r.offline);assert.equal(r.date,'2026-10-15');
 mode='bad';r=await R.read(true);assert(r.offline);
 stored={};await assert.rejects(R.read(true));
 for(const value of ['0','NaN','Infinity','-1'])assert.throws(()=>R.decode({observations:[{d:'2026-10-15',FXUSDCAD:{v:value}}]}));
 assert.throws(()=>R.decode({observations:[{d:'2026-02-30',FXUSDCAD:{v:'1.4'}}]}));
 allowed=false;const before=calls;await assert.rejects(R.read(true));assert.equal(calls,before);
 let response=false;assert.equal(listener({kind:'pricingRate'},{id:'other'},()=>response=true),undefined);assert.equal(response,false);assert.equal(listener({kind:'other'},{id:'test'},()=>response=true),undefined);
 console.log('PASS public-rate endpoint, hourly cache, request coalescing, precise source date, offline fallback, invalid payloads, permission guard and sender isolation');
})().catch(e=>{console.error(e);process.exitCode=1;});
