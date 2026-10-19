const assert=require('node:assert/strict');
const {root,context,get,click,ready}=require('./redesign-preview/runtime.cjs');
(async()=>{
 await ready;const chrome=context.chrome,original=chrome.runtime.sendMessage,nativeTimeout=context.setTimeout;context.setTimeout=(f,ms)=>{const h=nativeTimeout(f,ms);h.unref?.();return h;};
 const actions=[],result={clicked:true,number:'SQ-1234',tabId:77,account:'CAOP-1234',contactsPending:true,message:'Soumission créée. Coordonnées à vérifier.'};let failRetry=true;
 chrome.runtime.sendMessage=async m=>{if(m.kind!=='d365Action')return original(m);actions.push(m);if(m.action==='quoteContacts'){if(failRetry){failRetry=false;return {error:'En-tête en cours de chargement'};}return {value:{...result,contactsPending:false,contacts:{filled:true},message:'Coordonnées remplies'}};}return {value:m.action==='quote'?result:{message:'Onglet de la soumission affiché.'}};};
 await click(root.querySelector('.module-tabs [data-module=bridge]'));await click(get('tab-quote'));assert.equal(get('quote-open').hidden,true);
 await click(get('quote'));assert.equal(get('quote').dataset.actionState,'warning');assert.equal(get('quote').hidden,true);assert.equal(get('quote').disabled,true);
 assert.equal(get('quote-open').hidden,false);assert.equal(get('quote-open').disabled,false);
 assert.equal(get('quote-contacts').hidden,false);await click(get('quote-contacts'));assert.equal(get('quote-contacts').dataset.actionState,'error');assert.equal(get('quote-contacts').disabled,false);assert.equal(get('quote-contacts').hidden,false);
 await click(get('quote-contacts'));assert.equal(get('quote-contacts').hidden,true);assert.equal(get('quote-contacts-feedback').dataset.state,'success');assert.equal(get('quote-feedback').hidden,true);assert.equal(actions.filter(a=>a.action==='quote').length,1);assert.equal(actions.find(a=>a.action==='quoteContacts').args.number,'SQ-1234');assert.equal(actions.find(a=>a.action==='quoteContacts').args.tabId,77);
 assert.equal((await chrome.storage.session.get('quoteResult')).quoteResult.tabId,77);
 const sent=actions[0].args;assert(sent.contacts.notes.includes('Alex Martin'));assert.equal(sent.contacts.email,'alex@example.test');assert(sent.contacts.delivery.includes('(514)'));
 await click(get('quote-open'));assert.equal(actions.at(-1).action,'openQuote');assert.equal(actions.at(-1).args.tabId,77);assert.equal(actions.at(-1).args.number,'SQ-1234');
 await click(get('tab-prospect'));assert.equal(get('quote-open').hidden,true);await click(get('tab-quote'));assert.equal(get('quote-open').hidden,false);
 await click(get('quote'));assert.equal(actions.filter(a=>a.action==='quote').length,1);
 // A worker-completed result appears even if the initiating popup has gone away.
 await chrome.storage.session.set({quoteResult:{...result,number:'SQ-5678',tabId:99,contactsPending:false}});
 await click(get('quote-open'));assert.equal(actions.at(-1).args.tabId,99);assert.equal(actions.at(-1).args.number,'SQ-5678');
 await click(get('clear'));assert.equal(get('quote-open').hidden,true);assert.equal((await chrome.storage.session.get('quoteResult')).quoteResult,undefined);
 chrome.runtime.sendMessage=original;
 console.log('PASS quote completion UI: same ContactModel values, failed/successful contact-only retries on the same quote, no second creation, exact-tab opening, worker updates and session cleanup');
})().catch(e=>{console.error(e);process.exitCode=1;});
