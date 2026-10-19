const assert=require('node:assert/strict'),{context:c,get,ready}=require('./redesign-preview/runtime.cjs');
(async()=>{await ready;
 const sample=(await c.chrome.storage.local.get('toolboxProductSearch')).toolboxProductSearch;
 const headers=sample.headers,rows=[...sample.rows.map(row=>[...row]),['SM58-LC','100700001','SHURE','Microphone','MTL-06','','500','500','0','0','0','0'],['SM58-LC','100700001','SHURE','Microphone','YUL-99','','700','700','0','0','0','0']];
 await c.chrome.storage.local.set({toolboxProductSearch:{...sample,rows}});
 let root=get('product-results'),cards=root.querySelectorAll('.product-card');assert.equal(cards.length,1);assert.equal(cards[0].dataset.stock,'available');
 assert.deepEqual(root.querySelectorAll('.stock-quantity strong').map(x=>x.textContent),['3','8','0']);assert(!root.textContent.includes('MTL-06'));assert(!root.textContent.includes('YUL-99'));
 assert(root.querySelectorAll('.product-warehouse-heading h4').map(x=>x.textContent).join(' ').includes('QUE-01 YUL-01 TOR-01'));assert(root.querySelectorAll('.product-warehouse-metrics dd').every(n=>n.textContent!=='0'));
 const duplicate=[...sample.rows[0]];duplicate[5]='B-02';const first=[...sample.rows[0]];first[5]='A-01';
 await c.chrome.storage.local.set({toolboxProductSearch:{...sample,rows:[first,duplicate]}});root=get('product-results');assert.equal(root.querySelectorAll('.product-warehouse').length,1);assert.deepEqual(root.querySelectorAll('.stock-quantity strong').map(x=>x.textContent),['3','3']);
 const unknown=[...sample.rows[0]];unknown[6]='n/a';await c.chrome.storage.local.set({toolboxProductSearch:{...sample,rows:[unknown]}});assert.equal(get('product-results').querySelector('.product-card').dataset.stock,'unverified');assert.equal(get('product-results').querySelector('.stock-quantity strong').textContent,'?');
 const none=[...sample.rows[0]];none[6]='0';await c.chrome.storage.local.set({toolboxProductSearch:{...sample,rows:[none]}});assert.equal(get('product-results').querySelector('.product-card').dataset.stock,'empty');
 const used={headers:['SKU','D365 Item ID','QTY AVAILABLE','QTY OWNED','MAX QTY TO SELL','Sell Price','NBV','Warehouse'],currency:'CAD',quantityBatch:'new',rows:[
  {values:['A','1','3','7','4','65','0','QUE-01'],qtyBatch:'new'},
  {values:['B','2','0','0','0','100','10','YUL-01'],qtyBatch:'new'},
  {values:['C','3','5','7','7','200','20','TOR-01'],qtyBatch:'old'},
  {values:['D','4','4','7','7','300','30','OTT-01'],qtyBatch:'new',qtyPartial:true},
  {values:['E','5','2','7','7','400','40','YUL-01'],qtyBatch:'new'},
  {values:['E','5','2','7','7','400','40','YUL-01'],qtyBatch:'new'}]};
 await c.chrome.storage.local.set({toolboxUsedPowerBI:used});const records=get('used-results').children;assert.equal(records.length,5);assert.equal(records[0].dataset.stock,'available');assert.equal(records[1].dataset.stock,'empty');assert(records.slice(2).every(r=>r.dataset.stock==='unverified'));
 assert.equal(records[0].querySelector('.stock-quantity strong').textContent,'3');assert.equal(records[0].querySelector('.record-stock-place').textContent,'QUE-01');assert(records[0].querySelector('.record-valuations').textContent.includes('NBV0,00'));assert.equal(get('used-location-note').hidden,true);
 assert.equal(records[4].querySelector('.stock-quantity strong').textContent,'?');
 const without={...used,headers:used.headers.slice(0,-1),rows:used.rows.map(r=>({...r,values:r.values.slice(0,-1)}))};await c.chrome.storage.local.set({toolboxUsedPowerBI:without});assert.equal(get('used-location-note').hidden,false);assert(get('used-location-note').textContent.includes('non fourni'));assert.equal(get('used-results').querySelectorAll('.record-stock-place').length,0);
 console.log('PASS warehouse availability prominence, physical/reserved/order retention, zero-field hiding, exclusions, no location sums, unknown stock, used stock states, stale/partial guards, real warehouse metadata and NBV zero');
})().catch(e=>{console.error(e);process.exitCode=1;});
