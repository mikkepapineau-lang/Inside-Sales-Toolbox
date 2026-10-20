const assert=require('node:assert/strict'),{context:c,get,ready,click}=require('./redesign-preview/runtime.cjs');
(async()=>{
 await ready;
 const records=()=>get('powerbi-results').querySelectorAll('.record-row'),find=order=>records().find(r=>r.querySelector('.record-name').textContent===order);
 let record=find('SO-CA100001');
 assert(record.querySelector('.record-heading').textContent.includes('Camille Dubois\n514 555-0100\ncamille@example.test'));
 assert.equal(record.querySelectorAll('.order-notes-field').length,1);assert.equal(record.querySelector('.order-notes-field').textContent.split('Internal Notes').length,2);assert.equal(record.querySelector('.order-notes-button'),null);
 assert.equal(find('SO-CA100002').querySelector('.record-order-notes'),null);assert(find('SO-CA100002').textContent.includes('Internal Notes vides.'));
 record=find('SO-CA100008');assert(record.textContent.includes('Internal Notes non récupérées.'));
 let calls=0;const send=c.chrome.runtime.sendMessage;c.chrome.runtime.sendMessage=message=>{if(message.kind==='powerBIOrderNotes')calls++;return send(message);};
 const button=record.querySelector('.order-notes-button'),pending=click(button);assert.equal(find('SO-CA100008').querySelector('.order-notes-button').disabled,true);await pending;
 record=find('SO-CA100008');assert.equal(calls,1);assert(record.querySelector('.record-order-notes').textContent.includes('alex@example.test'));assert(record.querySelector('.order-notes-source').textContent.includes('D365'));
 get('powerbi-query').value='camille@example.test';get('powerbi-query').oninput();assert.equal(records().length,3);
 get('powerbi-query').value='';get('powerbi-query').oninput();
 const data=(await c.chrome.storage.local.get('toolboxPowerBI')).toolboxPowerBI;data.rows[7].internalNotes.value='<img src=x onerror=alert(1)>\nNon traduit';await c.chrome.storage.local.set({toolboxPowerBI:JSON.parse(JSON.stringify(data))});
 // The actual list factory renders source values as text, including markup-like notes.
 get('powerbi-query').oninput();record=find('SO-CA100008');assert(record.querySelector('.record-order-notes').textContent.startsWith('<img'));assert.equal(record.querySelector('.record-order-notes').querySelector('img'),null);
 c.chrome.runtime.sendMessage=async()=>({error:'Ouvre la bonne commande dans D365.'});await click(record.querySelector('.order-notes-button'));assert(find('SO-CA100008').querySelector('.order-notes-error').textContent.includes('bonne commande'));
 await c.chrome.storage.local.set({toolboxPowerBIStatus:{state:'done',message:'Le défilement a été effectué, mais Internal Notes n’est pas encore lisible dans le rapport. Consulte Diagnostic Power BI.'}});assert.equal(get('powerbi-status').hidden,false);assert(get('powerbi-status').textContent.includes('pas encore lisible'));
 await c.chrome.storage.local.set({toolboxPowerBIStatus:{state:'done'}});assert.equal(get('powerbi-status').hidden,true);
 console.log('PASS order note UI: contact below SO, one complete note field, confirmed empty vs missing, per-SO retry, loading state, search, text-only rendering, visible errors and non-hidden read warnings');
})().catch(e=>{console.error(e);process.exitCode=1;});
