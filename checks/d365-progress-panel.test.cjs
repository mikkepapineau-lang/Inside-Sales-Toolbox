const assert=require('node:assert/strict');
const {root,context,get,click,ready}=require('./redesign-preview/runtime.cjs');
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 await ready;const chrome=context.chrome,original=chrome.runtime.sendMessage,native=context.setTimeout;context.setTimeout=(f,ms)=>{const h=native(f,ms);h.unref?.();return h;};let finish;
 chrome.runtime.sendMessage=async m=>m.kind==='d365Action'&&m.action==='fill'?new Promise(resolve=>finish=resolve):original(m);
 await click(root.querySelector('.module-tabs [data-module=bridge]'));await click(get('tab-prospect'));
 const pending=click(get('fill'));await tick();assert.equal(get('fill').dataset.actionState,'busy');
 const update=async(current,label,state)=>chrome.storage.session.set({d365FillProgress:{current,total:3,label,state,token:'test'}});
 await update(0,'Name','writing');assert.equal(get('fill').querySelector('.lead-import-fill').style.width,'0%');assert(get('fill').textContent.includes('Remplissage du prospect'));assert(!get('fill').textContent.includes('Importation du lead'));assert(get('fill-feedback').textContent.includes('En cours'));
 await update(1,'Name','filled');assert(get('fill-feedback').textContent.includes('Saisi'));assert(get('fill').querySelector('.lead-import-fill').style.width.startsWith('33.'));
 await update(1,'Phone','writing');assert(get('fill').textContent.includes('Phone'));assert(get('bridge-next').disabled);
 await update(2,'Phone','kept');assert(get('fill-feedback').textContent.includes('Conservé'));
 await update(3,'Email','warning');assert(get('fill-feedback').textContent.includes('À vérifier'));assert.equal(get('fill').querySelector('.lead-import-fill').style.width,'100%');assert.equal(get('fill').dataset.actionState,'busy');
 finish({value:{report:['Email : à vérifier'],actual:[],message:'Formulaire rempli'}});await pending;assert.equal(get('fill').dataset.actionState,'success');assert.equal(get('fill').querySelector('.lead-import-fill'),null);assert.equal(get('bridge-next').disabled,false);
 await update(1,'Stale field','writing');assert(!get('fill').textContent.includes('Stale field'));
 chrome.runtime.sendMessage=original;
 console.log('PASS live Dynamics progress UI: zero-based real count/bar, active field, filled/kept/warning states, busy lock through actual completion and ignored stale updates');
})().catch(e=>{console.error(e);process.exitCode=1;});
