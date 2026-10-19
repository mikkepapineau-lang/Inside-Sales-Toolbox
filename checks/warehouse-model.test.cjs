const assert=require('node:assert/strict');
const W=require('../project/inside-sales-toolbox-team/warehouse-model.js');
const expected={MTL:'ANJ-01 ANJ-08 CA-TRANSIT MTL-01 MTL-02 MTL-03 MTL-04 MTL-05 MTL-06 MTL-07 MTL-08 MTL-09 MTL-61 MTL-62 YUL-01 YUL-99',QUE:'FOY-01 QUE-01 QUE-02 QUE-03 QUE-04 QUE-06 QUE-07 QUE-08 QUE-61 QUE-62',HAL:'HAL-01',OTT:'OTT-01 OTT-03 OTT-04 OTT-61',TOR:'TOR-01 TOR-03 TOR-04 TOR-05 TOR-06 TOR-61','USED-CA':'USED-INC USED-MTL USED-OTT USED-PO-SO USED-QUE',CAL:'CAL-01 CAL-04'};
let count=0;
for(const [site,codes]of Object.entries(expected)){
 assert.deepEqual(W.find(site).warehouses.map(r=>r[0]),codes.split(' '));
 for(const warehouse of codes.split(' ')){
  count++;assert.equal(W.siteFor(warehouse),site);assert(W.valid(site,warehouse));
  for(const other of Object.keys(expected).filter(s=>s!==site)){assert(!W.valid(other,warehouse));assert.throws(()=>W.assertPair(other,warehouse),/invalide/);}
 }
}
assert.equal(count,44);assert.equal(new Set(W.sites.flatMap(s=>s.warehouses.map(r=>r[0]))).size,44);
assert.deepEqual(W.assertPair(' que ',' foy-01 '),{site:'QUE',warehouse:'FOY-01'});
assert.deepEqual(W.selection({warehouse:'QUE-01'},'MONTREAL'),{site:'QUE',warehouse:'QUE-01',warehouseManual:true});
assert.deepEqual(W.selection({site:'MTL',warehouse:'QUE-01',warehouseManual:true},'QUEBEC'),{site:'MTL',warehouse:'',warehouseManual:true});
assert.deepEqual(W.selection({site:'USED-CA',warehouse:'USED-QUE',warehouseManual:true},'MONTREAL'),{site:'USED-CA',warehouse:'USED-QUE',warehouseManual:true});
assert.equal(W.defaults('HALIFAX').warehouse,'HAL-01');assert.equal(W.defaults('CALGARY').site,'CAL');
assert.equal(W.defaults('SAGUENAY').site,'QUE');assert.equal(W.defaults('MONTREAL').warehouse,'YUL-01');
assert.equal(W.selection({site:'BAD',warehouse:'QUE-01'},'MONTREAL').warehouse,'');
assert.equal(W.selection({site:'MTL',warehouse:'MTL-08',warehouseManual:true},'QUEBEC',true).warehouse,'QUE-01');
assert.equal(W.selection({warehouseManual:true},'MONTREAL').site,'');
console.log('PASS all 44 warehouse mappings, seven sites, deduplication, cross-site rejection, non-prefix membership, default sites, legacy migration and invalid saved-pair handling');
