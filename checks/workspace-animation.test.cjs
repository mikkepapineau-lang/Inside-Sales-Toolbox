const assert=require('node:assert/strict'),{get,context:c,ready}=require('./redesign-preview/runtime.cjs');
const tick=()=>new Promise(r=>setImmediate(r)),pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 await ready;const banner=get('workspace-prep'),button=get('workspace-start'),original=c.chrome.runtime.sendMessage,exit=c.ToolboxMotion.exit;let calls=0,reply,finish,exits=0;
 c.ToolboxMotion.exit=(element,options)=>{if(element.id!=='workspace-prep')return exit(element,options);exits++;assert.equal(options.collapse,true);return {finished:new Promise(r=>finish=r),cancel(){}};};
 c.chrome.runtime.sendMessage=m=>m.kind==='workspacePrepare'?(calls++,new Promise(r=>reply=r)):original(m);
 const preparing=button.onclick();assert.equal(button.dataset.actionState,'busy');assert.equal(button.getAttribute('aria-busy'),'true');assert.equal(button.querySelectorAll('.action-mark i').length,3);assert(button.disabled&&get('workspace-open').disabled&&get('workspace-dismiss').disabled);await tick();await button.onclick();assert.equal(calls,1);
 // The worker writes its daily marker before replying. The banner must stay visible.
 await c.chrome.storage.local.set({toolboxWorkspaceDay:{date:c.ToolboxUsedCatalogue.day(Date.now()),status:'prepared'}});assert.equal(banner.hidden,false);assert.equal(banner.dataset.state,'loading');
 reply({value:{total:4}});await tick();assert.equal(banner.dataset.state,'success');assert.equal(button.getAttribute('aria-busy'),'false');assert(button.textContent.includes('Prêt'));assert.equal(button.querySelector('.action-mark').textContent,'✓');assert.equal(banner.hidden,false);assert(button.disabled);assert.equal(exits,0);
 await pause(1000);assert.equal(banner.dataset.state,'leaving');assert.equal(banner.hidden,false);assert.equal(exits,1);finish();await preparing;assert.equal(banner.hidden,true);assert.equal(get('workspace-feedback').hidden,false);
 // A manual retry can show the banner again; an actual error cannot turn green or disappear.
 let retry=get('workspace-open').onclick();await tick();reply({error:'Échec de test'});await retry;assert.equal(banner.hidden,false);assert.equal(button.dataset.actionState,'error');assert.equal(button.disabled,false);assert(get('workspace-prep-state').textContent.includes('Échec'));assert.equal(exits,1);
 retry=button.onclick();await tick();reply({value:{total:3}});await retry;assert.equal(button.dataset.actionState,'error');assert.equal(banner.hidden,false);assert.equal(exits,1);
 const dismiss=get('workspace-dismiss').onclick();await tick();assert.equal(banner.dataset.state,'leaving');assert.equal(banner.dataset.complete,'false');assert.equal(exits,2);finish();await dismiss;assert.equal(banner.hidden,true);assert.equal((await c.chrome.storage.local.get('toolboxWorkspaceDay')).toolboxWorkspaceDay.status,'dismissed');
 // Reduced motion changes immediately without requiring an animation promise.
 c.matchMedia=()=>({matches:true});c.ToolboxMotion.exit=exit;c.chrome.runtime.sendMessage=async m=>m.kind==='workspacePrepare'?{value:{total:4}}:original(m);
 await c.chrome.storage.local.set({toolboxLanguage:'en'});const reduced=get('workspace-open').onclick();await tick();assert.equal(button.dataset.actionState,'success');assert(button.textContent.includes('Ready!'));await reduced;assert.equal(banner.hidden,true);assert(get('workspace-feedback').textContent.includes('tabs opened'));
 await c.chrome.storage.local.set({toolboxLanguage:'fr'});assert(get('workspace-feedback').textContent.includes('onglets ouverts'));
 console.log('PASS pending button animation, duplicate guard, worker marker race, visible real success, delayed collapse, retryable/partial failure, animated dismissal, reduced motion and FR/EN');
})().catch(e=>{console.error(e);process.exitCode=1;});
