const assert=require('node:assert/strict');
const {get,context,click,ready}=require('./redesign-preview/runtime.cjs');
const options=id=>get(id).children.map(o=>o.value);
(async()=>{
 await ready;
 assert.deepEqual(options('quote-site'),['','MTL','QUE','HAL','OTT','TOR','USED-CA','CAL']);
 assert.equal(get('quote-site').value,'MTL');assert(options('warehouse').includes('CA-TRANSIT'));assert(!options('warehouse').includes('QUE-01'));
 const chrome=context.chrome,original=chrome.runtime.sendMessage,quotes=[];
 chrome.runtime.sendMessage=async m=>{if(m.kind==='d365Action'&&m.action==='quote')quotes.push(m.args);return original(m);};
 get('quote-site').value='QUE';await get('quote-site').onchange();assert.equal(get('warehouse').value,'');assert(!options('warehouse').includes('YUL-01'));assert(options('warehouse').includes('FOY-01'));
 await click(get('quote'));assert.equal(quotes.length,0);assert(get('status').textContent.includes('invalide'));
 context.BridgeActions.reset('quote');get('warehouse').value='QUE-04';await get('warehouse').onchange();
 // Neither prospect confirmation nor address-based territory resolution can replace an explicit pair.
 await click(get('createProspect'));await click(get('quote'));assert.equal(quotes.length,1);assert.equal(quotes[0].site,'QUE');assert.equal(quotes[0].warehouse,'QUE-04');
 const lead=(await chrome.storage.session.get('lead')).lead;assert.equal(lead.data.site,'QUE');assert.equal(lead.data.warehouse,'QUE-04');
 get('quote-site').value='USED-CA';await get('quote-site').onchange();assert.deepEqual(options('warehouse'),['','USED-INC','USED-MTL','USED-OTT','USED-PO-SO','USED-QUE']);
 get('quote-site').value='HAL';await get('quote-site').onchange();assert.equal(get('warehouse').value,'HAL-01');
 get('quote-site').value='';await get('quote-site').onchange();assert(get('warehouse').disabled);assert.equal(get('warehouse').value,'');
 get('quote-site').value='MTL';await get('quote-site').onchange();assert(options('warehouse').includes('MTL-06'));assert(options('warehouse').includes('YUL-99'));
 console.log('PASS dependent Site/Warehouse menus, clear-on-site-change, required choice, manual pair retained through prospect/quote, used-site membership and independent Product Search exclusions');
})().catch(e=>{console.error(e);process.exitCode=1;});
