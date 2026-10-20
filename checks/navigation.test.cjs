const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('project/inside-sales-toolbox-team/navigation.js','utf8');
let normalWindows=[{id:1}],startup,onRemoved;const values={lead:{data:'kept'},toolboxTabGroups:{1:12},toolboxNavigation:{module:'used',at:Date.now()}};
const chrome={storage:{session:{set:async x=>Object.assign(values,x),remove:async key=>{delete values[key];}}},runtime:{onStartup:{addListener:f=>startup=f}},windows:{onRemoved:{addListener:f=>onRemoved=f},getAll:async()=>normalWindows}};
const c=vm.createContext({chrome,Date});vm.runInContext(source,c);const nav=c.ToolboxNavigation,now=Date.now();
(async()=>{
 assert.equal(nav.resolve({module:'used',at:now-2*60000},now),'used');assert.equal(nav.resolve({module:'products',at:now-29*60000},now),'products');
 for(const state of [null,{}, {module:'used',at:now-30*60000},{module:'used',at:now+1000},{module:'used',at:'wrong'},{module:'other',at:now}])assert.equal(nav.resolve(state,now),'home');
 await nav.remember('products');assert.equal(nav.resolve(values.toolboxNavigation),'products');
 await onRemoved();assert(values.toolboxNavigation);normalWindows=[];await onRemoved();assert(!values.toolboxNavigation);assert(values.lead&&values.toolboxTabGroups);
 await nav.remember('contacts');await startup();assert(!values.toolboxNavigation);assert(values.lead);
 await nav.remember('hs');assert.equal(nav.resolve(values.toolboxNavigation),'hs');await nav.forget();assert.equal(nav.resolve(values.toolboxNavigation),'home');
 console.log('PASS quick return, 30-minute boundary, new browser session, last normal window close, startup reset and preserved business/session data');
})().catch(e=>{console.error(e);process.exitCode=1;});
