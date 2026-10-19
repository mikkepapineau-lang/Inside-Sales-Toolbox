const assert=require('node:assert/strict');
const {root,doc,context,get,click,ready}=require('./redesign-preview/runtime.cjs');
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 await ready;await click(root.querySelector('.module-tabs [data-module=bridge]'));await click(get('tab-lead'));
 const chrome=context.chrome,originalScript=chrome.scripting.executeScript,lead=(await chrome.storage.session.get('lead')).lead;
 let reads=0,crm=0,steps=[],scrolls=0,elapsed=0;
 const originalMessage=chrome.runtime.sendMessage;
 chrome.runtime.sendMessage=async m=>{if(m.kind==='d365Action')crm++;return originalMessage(m);};
 chrome.scripting.executeScript=async options=>{if(options.files)return [];reads++;return [{result:{value:{data:lead.data,url:'Salesforce test',warnings:[]}}}];};
 const nativeTimeout=context.setTimeout,queue=[];
 context.setTimeout=(fn,ms)=>{if([80,55,160].includes(ms)){queue.push({fn,ms});return 0;}const handle=nativeTimeout(fn,ms);handle.unref?.();return handle;};
 const progress=context.BridgeActions.progress;
 context.BridgeActions.progress=(id,step)=>{
  progress(id,step);
  const controls=[...get('editor').querySelectorAll('input,select,textarea')],populated=controls.filter(e=>String(e.value).trim());
  steps.push({id,...step,input:populated.at(-1).id});
  assert.equal(populated.length,step.current,'one additional field is visible at each step');
  assert(controls.every(e=>e.disabled));assert(get('bridge-next').disabled);assert.equal(get('capture').dataset.actionState,'busy');
  assert.equal(get('capture').querySelector('.lead-import-fill').style.width,(step.current/step.total*100)+'%');
  assert(get('capture-feedback').textContent.includes(step.current+' / '+step.total));
  if(step.current===1)for(const fn of get('editor').closest('main').events.wheel||[])fn();
 };
 const pending=click(get('capture'));await tick();
 // Storage and contact previews already contain the complete lead while the display is blank.
 assert.equal(reads,1);assert.equal((await chrome.storage.session.get('lead')).lead.data.email,lead.data.email);
 assert.equal(get('quote-contact-email').value,lead.data.email);
 assert.equal(get('editor').dataset.importState,'running');assert.equal(get('editor').getAttribute('aria-busy'),'true');
 const controls=[...get('editor').querySelectorAll('input,select,textarea')];assert(controls.every(e=>!e.value));
 for(const e of controls)e.closest('label').scrollIntoView=()=>scrolls++;
 await click(get('capture'));assert.equal(reads,1);
 while(queue.length){const item=queue.shift();elapsed+=item.ms;item.fn();await tick();}
 await pending;
 const expected=controls.filter(e=>String(e.value).trim()).map(e=>e.id);
 assert.deepEqual(steps.map(s=>s.input),expected);assert(expected.length>12);assert(elapsed>=expected.length*160);assert(elapsed<expected.length*220);
 assert.equal(scrolls,1,'manual scrolling stops automatic following');
 assert.equal(get('editor').getAttribute('aria-busy'),null);assert.equal(get('editor').dataset.importState,undefined);
 assert(controls.every(e=>!e.disabled));assert.equal(get('capture').dataset.actionState,'success');assert.equal(get('bridge-next').disabled,false);assert.equal(crm,0);
 assert.equal(get('capture-feedback').getAttribute('aria-live'),'polite');
 // Reduced motion presents complete values immediately, with no artificial delay.
 context.BridgeActions.reset('capture');context.matchMedia=()=>({matches:true});const count=steps.length;
 await click(get('capture'));assert.equal(queue.length,0);assert.equal(steps.length,count);assert.equal(get('value-email').value,lead.data.email);
 // A tab hidden during presentation restores every value and releases input locks.
 context.matchMedia=()=>({matches:false});context.BridgeActions.reset('capture');
 const hiding=click(get('capture'));await tick();queue.shift().fn();await tick();doc.visibilityState='hidden';
 while(queue.length){queue.shift().fn();await tick();}await hiding;doc.visibilityState='visible';
 assert.equal(get('value-email').value,lead.data.email);assert([...get('editor').querySelectorAll('input,select,textarea')].every(e=>!e.disabled));
 // Failed page reads retain the previous lead and never start the field sequence.
 context.BridgeActions.reset('capture');chrome.scripting.executeScript=async()=>{throw Error('Salesforce inaccessible');};
 const before=steps.length;await click(get('capture'));assert.equal(steps.length,before);assert.equal(get('capture').dataset.actionState,'error');
 assert.equal(get('value-email').value,lead.data.email);assert.equal((await chrome.storage.session.get('lead')).lead.data.email,lead.data.email);
 chrome.scripting.executeScript=originalScript;chrome.runtime.sendMessage=originalMessage;
 console.log('PASS paced Salesforce import: ordered fields, count/bar, full stored data, duplicate lock, manual scroll, completion, reduced motion, hidden-tab cleanup and failed-read preservation');
})().catch(e=>{console.error(e);process.exitCode=1;});
