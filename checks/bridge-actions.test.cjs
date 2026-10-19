const assert=require('node:assert/strict');
const {get,click,context,ready}=require('./redesign-preview/runtime.cjs');
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 await ready;
 const chrome=context.chrome,original=chrome.runtime.sendMessage;let calls=0,pending;
 const next=get('bridge-next');assert.equal(next.hidden,false);assert.equal(next.parentElement.parentElement.id,'tool-bridge');
 // Capture is visibly pending; a duplicate click cannot issue another capture.
 const capture=click(get('capture'));assert.equal(get('capture').dataset.actionState,'busy');assert.equal(get('capture').getAttribute('aria-busy'),'true');assert(next.disabled);assert.equal(get('capture').querySelectorAll('.action-mark i').length,3);
 await click(get('capture'));await capture;assert.equal(get('capture').dataset.actionState,'success');assert.equal(next.disabled,false);assert.equal(get('panel-lead').hidden,false);
 await click(next);assert.equal(get('panel-prospect').hidden,false);assert.equal(next.dataset.go,'quote');
 chrome.runtime.sendMessage=async m=>{if(m.kind==='d365Action'){calls++;return new Promise(r=>pending=r);}return original(m);};
 const filling=click(get('fill'));await tick();assert.equal(get('fill').dataset.actionState,'busy');assert(next.disabled);await click(get('fill'));assert.equal(calls,1);
 pending({value:{report:['Nom rempli'],actual:['Compte test'],message:'Formulaire rempli'}});await filling;
 assert.equal(get('fill').dataset.actionState,'success');assert.equal(get('panel-prospect').hidden,false);assert.equal(get('createProspect').disabled,false);
 // Partial save stays amber and cannot be repeated, including after the timer.
 let confirming=click(get('createProspect'));await tick();pending({value:{account:'CA-TEST',dimensionsPending:true,message:'Dimensions à vérifier'}});await confirming;
 assert.equal(get('createProspect').dataset.actionState,'warning');assert(get('createProspect').disabled);const before=calls;await click(get('createProspect'));assert.equal(calls,before);
 // Reset through a fresh capture and fill, then verify the successful result.
 await click(get('tab-lead'));await click(get('capture'));await click(next);
 const fill2=click(get('fill'));await tick();pending({value:{report:[],actual:[],message:'Rempli'}});await fill2;
 confirming=click(get('createProspect'));await tick();pending({value:{verified:true,account:'CA-TEST',message:'Créé'}});await confirming;
 assert.equal(get('createProspect').dataset.actionState,'success');assert.equal(get('successCard').hidden,false);assert(get('createProspect').disabled);
 await click(next);assert.equal(get('panel-quote').hidden,false);assert(next.hidden);assert.equal(get('quote').hidden,false);
 const quoting=click(get('quote'));await tick();assert.equal(get('quote').dataset.actionState,'busy');pending({value:{clicked:true,number:'SQ-TEST',contactsPending:true,message:'Coordonnées à vérifier'}});await quoting;
 assert.equal(get('quote').dataset.actionState,'warning');assert(get('quote').disabled);assert(get('quote-feedback').textContent.includes('Ne la recrée pas'));
 // A genuine worker error is retryable and never receives the success styling.
 chrome.runtime.sendMessage=async m=>m.kind==='d365Action'?{error:'Erreur de test D365'}:original(m);
 await click(get('tab-prospect'));await click(get('fill'));assert.equal(get('fill').dataset.actionState,'error');assert.equal(get('fill').disabled,false);assert(get('fill-feedback').textContent.includes('Erreur de test'));
 await new Promise(r=>setTimeout(r,2850));assert.equal(get('fill').dataset.actionState,undefined);assert.equal(get('fill-feedback').hidden,false);assert.equal(get('fill-feedback').dataset.state,'error');assert(get('quote').disabled);
 // Language and motion affordances are supplied for the new states as well.
 assert.equal(context.ToolboxDictionary['J’ai terminé cette étape'],'I’ve finished this step');assert.equal(typeof context.ToolboxMotion.reveal,'function');
 chrome.runtime.sendMessage=original;
 console.log('PASS guided CRM actions: bottom progression, pending animation, duplicate guard, real success, partial save warnings, terminal lock, retryable error, durable feedback');
})().catch(e=>{console.error(e);process.exitCode=1;});
