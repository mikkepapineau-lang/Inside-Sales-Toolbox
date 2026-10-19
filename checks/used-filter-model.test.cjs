const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const dir='project/inside-sales-toolbox-team/',context=vm.createContext({URL,Intl});
for(const file of ['used-catalogue.js','used-regions.js','used-filter-model.js'])vm.runInContext(fs.readFileSync(dir+file,'utf8'),context);
const M=context.ToolboxUsedFilterModel,data=JSON.parse(fs.readFileSync(dir+'used-catalogue-base.json','utf8')),index=M.build(data),columns=Object.fromEntries(data.headers.map((h,i)=>[context.ToolboxUsedCatalogue.column(h),i]));
let state=M.state(),result=M.evaluate(index,state);assert.equal(result.records.length,12851);assert.equal(result.facets.category.size,5);assert.equal(result.facets.manufacturer.size,1323);assert.equal(result.facets.sku.size,12851);assert.equal(result.facets.d365itemid.get(''),5489);
state.selections.category.add('AUDIO');result=M.evaluate(index,state);assert.equal(result.records.length,6859);assert.deepEqual([...result.facets.subcategory.keys()].sort(),[...new Set(data.rows.filter(r=>r.values[columns.category]==='AUDIO').map(r=>r.values[columns.subcategory]))].sort());assert.equal(result.facets.category.size,5);
state.selections.manufacturer.add('SHURE');state.selections.manufacturer.add('SENNHEISER');result=M.evaluate(index,state);
const expected=data.rows.filter(r=>r.values[columns.category]==='AUDIO'&&['SHURE','SENNHEISER'].includes(r.values[columns.manufacturer]));assert.equal(result.records.length,expected.length);assert(result.records.every(x=>['SHURE','SENNHEISER'].includes(x.values.manufacturer)));assert(result.facets.manufacturer.size>2);
state.selections.subcategory.add('AUDIO WIRELESS MIC.');result=M.evaluate(index,state);assert(result.records.length>0);assert(result.records.every(x=>x.values.subcategory==='AUDIO WIRELESS MIC.'));assert(!result.facets.category.has('VDO'));
state.selections.category.clear();state.selections.category.add('VDO');result=M.evaluate(index,state);assert.equal(result.records.length,0);assert(result.facets.category.has('AUDIO'));
state=M.state({selections:{d365itemid:['']}});result=M.evaluate(index,state);assert.equal(result.records.length,5489);assert(result.records.every(x=>x.values.d365itemid===''));
const last=data.rows.at(-1).values[columns.sku];state=M.state({selections:{sku:[last]}});result=M.evaluate(index,state);assert.equal(result.records.length,1);assert.equal(result.records[0].r,data.rows.at(-1));
state=M.state({query:'shure',availableOnly:true});result=M.evaluate(index,state);assert(result.records.length>0);assert(result.records.every(x=>x.available>0));assert(result.facets.manufacturer.has('SHURE'));
const roundtrip=M.serialize(M.state({query:'SM58-LC',availableOnly:true,expanded:false,selections:{manufacturer:['SHURE','SENNHEISER'],d365itemid:['']}}));assert.equal(M.activeCount(M.state(roundtrip)),4);assert.equal(roundtrip.expanded,false);assert.deepEqual([...M.state(roundtrip).selections.d365itemid],['']);assert.equal(M.state(null).query,'');
for(const key of ['CANADA+UK','CANADA+USA','UK+USA']){const s=M.state({subregion:key}),saved=M.serialize(s);assert.equal(saved.subregion,key);assert.equal(M.state(saved).subregion,key);assert.equal(M.activeCount(s),1);}assert.equal(M.state({subregion:'USA+CANADA'}).subregion,'CANADA+USA');
const fixture={headers:['SKU','Description','QTY AVAILABLE','Category','Manufacturer','MODEL','D365 Item ID','SubCategory'],rows:[
 {values:['SKU-1','Microphone à condensateur','1','AUDIO','A','Model-1','01','MIC']},
 {values:['SKU-10','Microphone dynamique','0','AUDIO','B','Model-2','02','MIC']},
 {values:['SKU-2','Projection','3','VDO','A','Model-1','','PROJ']}
]};
let small=M.build(fixture);state=M.state({selections:{sku:['SKU-1']}});assert.equal(M.evaluate(small,state).records.length,1);
state=M.state({selections:{model:['Model-1']},query:'projection',availableOnly:true});assert.equal(M.evaluate(small,state).records.length,1);
state=M.state({query:'condensateur'});assert.equal(M.evaluate(small,state).records.length,1);assert.equal(M.evaluate(M.build({headers:['SKU','QTY AVAILABLE'],rows:[{values:['only','1']}]}),M.state()).records.length,1);
console.log('PASS six full-catalogue filters, multi-select OR/AND, contextual counts, cascading options, contradictory selections, missing IDs, last-row SKU, availability/search and saved state');
