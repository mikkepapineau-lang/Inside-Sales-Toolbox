const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({URL,Intl});for(const file of ['used-catalogue.js','used-regions.js'])vm.runInContext(fs.readFileSync('project/inside-sales-toolbox-team/'+file,'utf8'),c);
const C=c.ToolboxUsedCatalogue,R=c.ToolboxUsedRegions;
const raw={headers:['SKU','D365 Item ID','Manufacturer','MODEL','QTY OWNED','MAX QTY TO SELL','QTY AVAILABLE','Sell Price','NBV'],currency:'CAD',rows:[{values:['A','01','Brand','A','9','8','7','100','40']},{values:['B','02','Brand','B','6','5','4','200','80']}]};
const base=C.create(raw,{at:0}),original=JSON.stringify(base),snapshots={};
for(const [i,region]of ['CANADA','UK','USA','CANADA+UK','CANADA+USA','UK+USA'].entries()){
 const incoming={...raw,regions:region.split('+'),rows:[{values:['A','01','Brand','A','3','2','1',String(300+i),String(i)]}]};
 const q=R.snapshot(base,incoming,region,100+i),quantityView=R.view(base,q,region),before=JSON.stringify(q);
 const f=R.financialSnapshot(base,incoming,region,200+i),view=R.financialView(base,quantityView,f,region);
 snapshots[region]=f;assert.equal(view.rows[0].values[6],'1');assert.equal(view.rows[0].values[7],String(300+i));assert.equal(view.rows[0].values[8],String(i));assert.equal(view.rows[0].financialAt,200+i);assert.equal(view.lastQuantityAt,100+i);
 assert.equal(JSON.stringify(q),before);assert.equal(JSON.stringify(base),original);assert.equal(f.records.length,1);assert.equal(f.records[0].length,3);
 const pending=R.financialView(base,quantityView,null,region);assert.equal(pending.rows[0].values[7],'');assert.equal(pending.rows[0].values[8],'');assert.equal(pending.financialVerified,false);
 const priceFirst=R.financialView(base,null,f,region);assert.equal(priceFirst.quantitiesPending,true);assert.equal(priceFirst.rows[0].values[6],'');assert.equal(priceFirst.rows[0].values[7],String(300+i));assert.equal(priceFirst.rows[0].qtyAt,undefined);
 assert.equal(R.financialView(base,null,f,region==='UK'?'CANADA':'UK'),null);
 assert.equal(R.financialView(base,null,null,region),null);
}
assert.equal(R.financialView(base,null,snapshots.CANADA,'ALL'),base);
assert.equal(R.financialView({...base,currency:'USD'},null,snapshots.CANADA,'CANADA'),null);
assert.equal(R.financialView({...base,rows:[base.rows[1],base.rows[0]]},null,snapshots.CANADA,'CANADA'),null);
assert.throws(()=>R.financialSnapshot(base,{...raw,regions:['UK']},'CANADA'),/sous-région/);
assert.equal(snapshots.CANADA.records[0][1],'300');assert.equal(snapshots.UK.records[0][1],'301');assert.equal(snapshots['CANADA+UK'].records[0][1],'303');
console.log('PASS scoped financial snapshots: six independent regional scopes, global isolation, unchanged quantities, price-first unknown quantities, missing prices never borrowed, zero NBV, identity and currency guards');
