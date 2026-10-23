// The six Used Gear slicers operate on the whole saved catalogue, before pagination.
(()=>{
 const fields=[{key:'category',label:'Catégorie'},{key:'subcategory',label:'Sous-catégorie'},{key:'sku',label:'SKU'},{key:'manufacturer',label:'Fabricant'},{key:'d365itemid',label:'N° D365'},{key:'model',label:'Modèle'}];
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 function state(value={}){
  if(!value||typeof value!=='object')value={};
  return {subregion:ToolboxUsedRegions.normalize(value.subregion),query:typeof value.query==='string'?value.query.slice(0,5000):'',availableOnly:value.availableOnly===true,expanded:value.expanded===true,
   selections:Object.fromEntries(fields.map(f=>[f.key,new Set((Array.isArray(value.selections?.[f.key])?value.selections[f.key]:[]).filter(v=>typeof v==='string'&&v.length<=32000).slice(0,15000))]))};
 }
 function serialize(s){return {subregion:ToolboxUsedRegions.normalize(s.subregion),query:s.query,availableOnly:s.availableOnly,expanded:s.expanded,selections:Object.fromEntries(fields.map(f=>[f.key,[...s.selections[f.key]].sort()]))};}
 function activeCount(s){return fields.filter(f=>s.selections[f.key].size).length+(s.query.trim()?1:0)+(s.availableOnly?1:0)+(s.subregion&&s.subregion!=='ALL'?1:0);}
 function build(data){
  const headers=data.headers.map(ToolboxUsedCatalogue.column),columns=Object.fromEntries(fields.map(f=>[f.key,headers.indexOf(f.key)])),available=headers.indexOf('qtyavailable');
  const result={countryMode:!!data.countryMode,availableFields:new Set(fields.filter(f=>columns[f.key]>=0).map(f=>f.key)),rows:data.rows.map((r,i)=>{
   const values=Object.fromEntries(fields.map(f=>[f.key,String(columns[f.key]>=0?r.values[columns[f.key]]??'':'').trim()]));
   return {r,values,search:norm(r.values.join(' ')),available:available>=0?ToolboxUsedCatalogue.number(r.values[available]):null,key:r.country&&Number.isInteger(r.catalogueIndex)?'catalogue:'+r.catalogueIndex:values.d365itemid?'item:'+values.d365itemid:'sku:'+values.sku+':'+i};
  })};result.availableKeys=new Set(result.rows.filter(row=>row.available>0).map(row=>row.key));return result;
 }
 function evaluate(index,s){
  const query=norm(s.query),records=[],facets=Object.fromEntries(fields.map(f=>[f.key,new Map()]));
  for(const row of index.rows){
   if(query&&!row.search.includes(query)||s.availableOnly&&!(index.countryMode?index.availableKeys.has(row.key):row.available>0))continue;
   let failed='',failures=0;
   for(const f of fields)if(s.selections[f.key].size&&!s.selections[f.key].has(row.values[f.key])){failed=f.key;if(++failures>1)break;}
   if(!failures)records.push(row);
   if(failures>1)continue;
   // Ignore each slicer's own selection when listing its choices, so OR selections stay possible.
   for(const f of fields)if(!failures||failed===f.key){const value=row.values[f.key];facets[f.key].set(value,(facets[f.key].get(value)||0)+1);}
  }
  return {records,facets};
 }
 globalThis.ToolboxUsedFilterModel={fields,norm,state,serialize,activeCount,build,evaluate};
})();
