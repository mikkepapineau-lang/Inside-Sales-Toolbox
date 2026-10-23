// Preference behaviour, including slow/failing storage; no browser APIs or live services.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const code=fs.readFileSync('project/inside-sales-toolbox-team/appearance.js','utf8');
const flush=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve));};
function fixture({dark=false,saved,read,fail=false}={}){
 const root={dataset:{}},attrs={},events={},changes=[],mediaEvents={},stored=[],window={};let language='fr';
 const button={setAttribute:(k,v)=>attrs[k]=v,addEventListener:(k,f)=>events[k]=f};
 const chrome={storage:{local:{get:()=>read||Promise.resolve({toolboxAppearance:saved}),set:async value=>{if(fail)throw Error('Storage unavailable');stored.push(value.toolboxAppearance);changes.forEach(fn=>fn({toolboxAppearance:{newValue:value.toolboxAppearance}},'local'));}},onChanged:{addListener:fn=>changes.push(fn)}}};
 const context={document:{documentElement:root,getElementById:()=>button},window,parent:window,chrome,matchMedia:()=>({matches:dark,addEventListener:(k,f)=>mediaEvents[k]=f}),ToolboxI18n:{t:label=>language==='en'?({'Activer le mode clair':'Switch to light mode','Activer le mode sombre':'Switch to dark mode'}[label]):label}};
 vm.runInNewContext(code,context);
 return {root,attrs,stored,click:()=>events.click(),system:value=>mediaEvents.change({matches:value}),change:value=>changes.forEach(fn=>fn({toolboxAppearance:{newValue:value}},'local')),english:()=>{language='en';changes.forEach(fn=>fn({toolboxLanguage:{newValue:'en'}},'local'));}};
}
(async()=>{
 const system=fixture();await flush();assert.equal(system.root.dataset.appearance,'light');system.system(true);assert.equal(system.root.dataset.appearance,'dark');system.click();system.system(true);await flush();assert.equal(system.root.dataset.appearance,'light');assert.deepEqual(system.stored,['light']);assert.equal(system.attrs['aria-pressed'],'false');
 const remembered=fixture({dark:true,saved:'light'});await flush();assert.equal(remembered.root.dataset.appearance,'light');remembered.system(true);assert.equal(remembered.root.dataset.appearance,'light');remembered.click();await flush();assert.equal(remembered.attrs['aria-label'],'Activer le mode clair');remembered.english();assert.equal(remembered.attrs['aria-label'],'Switch to light mode');
 let release;const slow=fixture({read:new Promise(resolve=>{release=resolve;})});slow.click();release({toolboxAppearance:'light'});await flush();assert.equal(slow.root.dataset.appearance,'dark','A late saved value cannot undo a click');
 const rapid=fixture();await flush();rapid.click();rapid.click();rapid.click();await flush();assert.equal(rapid.root.dataset.appearance,'dark');assert.deepEqual(rapid.stored,['dark','light','dark']);rapid.change('light');assert.equal(rapid.root.dataset.appearance,'light');rapid.change('invalid');assert.equal(rapid.root.dataset.appearance,'light');
 const broken=fixture({read:Promise.reject(Error('Unavailable')),fail:true});await flush();broken.click();await flush();assert.equal(broken.root.dataset.appearance,'dark');broken.click();await flush();assert.equal(broken.root.dataset.appearance,'light');
 const isolated=fixture();await flush();assert.equal(isolated.root.dataset.appearance,'light','Another instance has independent storage');
 const owner={dataset:{appearance:'dark'}},child={dataset:{}};let notify;
 vm.runInNewContext(code,{document:{documentElement:child,getElementById:()=>null},window:{},parent:{ToolboxAppearance:{},document:{documentElement:owner}},MutationObserver:class{constructor(fn){notify=fn;}observe(){}}});
 assert.equal(child.dataset.appearance,'dark');owner.dataset.appearance='light';notify();assert.equal(child.dataset.appearance,'light');
 console.log('PASS appearance: system default and changes, saved preference, explicit choice, labels FR/EN, delayed restore, ordered rapid toggles, sibling update, invalid values, storage failure and HS inheritance');
})().catch(e=>{console.error(e);process.exitCode=1;});
