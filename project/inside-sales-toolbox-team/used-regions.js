// Regional quantity snapshots reference catalogue rows, keeping prices/NBV in one place.
(()=>{
 const names=['CANADA','UK','USA'];
 function parse(value){
  if(value===undefined||typeof value==='string'&&value.trim().toUpperCase()==='ALL')return 'ALL';
  const parts=Array.isArray(value)?value:typeof value==='string'?value.split('+'):null;
  if(!parts?.length||parts.length>3||parts.some(v=>typeof v!=='string'||!names.includes(v.trim().toUpperCase())))return null;
  const chosen=names.filter(n=>parts.some(v=>v.trim().toUpperCase()===n));return chosen.length===names.length?'ALL':chosen.join('+');
 }
 const normalize=value=>parse(value)||'ALL',selection=value=>normalize(value)==='ALL'?[...names]:normalize(value).split('+'),label=value=>selection(value).join(' + ');
 const matches=(regions,scope)=>Array.isArray(regions)&&JSON.stringify([...new Set(regions)].sort())===JSON.stringify(selection(scope).sort());
 function signature(data,count=data.rows.length){
  const keys=data.headers.map(ToolboxUsedCatalogue.column),cols=['d365itemid','sku','manufacturer','model'].map(k=>keys.indexOf(k));let a=2166136261,b=5381;
  for(const r of data.rows.slice(0,count)){const s=JSON.stringify(cols.map(i=>i<0?'':r.values[i]||''));for(let j=0;j<s.length;j++){a=Math.imul(a^s.charCodeAt(j),16777619);b=Math.imul(b,33)^s.charCodeAt(j);}a=Math.imul(a^10,16777619);b=Math.imul(b,33)^10;}
  return (a>>>0).toString(16)+':'+(b>>>0).toString(16);
 }
 function valid(base,snapshot,region){return !!snapshot&&snapshot.region===normalize(region)&&snapshot.baseCount<=base.rows.length&&snapshot.baseHash===signature(base,snapshot.baseCount);}
 function snapshot(base,incoming,region,at=Date.now()){
  region=normalize(region);if(region==='ALL'||!matches(incoming.regions,region))throw Error('La sous-région du rapport ne correspond pas au filtre demandé. Les données précédentes sont conservées.');
  const clean={...base,rows:base.rows.map(r=>({...r,qtyBatch:'before-regional-read'}))},merged=ToolboxUsedCatalogue.merge(clean,incoming,{at,source:'Power BI'});
  const keys=merged.headers.map(ToolboxUsedCatalogue.column),inputKeys=incoming.headers.map(ToolboxUsedCatalogue.column),records=[],extra=[],byId=new Map(),bySku=new Map();let skipped=0;
  const identity=(r,columns)=>Object.fromEntries(['d365itemid','sku','manufacturer','model'].map(k=>[k,String(r.values[columns.indexOf(k)]||'').trim().toUpperCase()]));
  incoming.rows.forEach(r=>{const id=identity(r,inputKeys),entry={id,values:ToolboxUsedCatalogue.quantityKeys.map(k=>String(r.values[inputKeys.indexOf(k)]??'').trim())};for(const [map,key]of [[byId,id.d365itemid],[bySku,id.sku]])if(key){if(!map.has(key))map.set(key,[]);map.get(key).push(entry);}});
  merged.rows.forEach((r,i)=>{
   if(r.qtyBatch!==merged.quantityBatch)return;
   if(i>=base.rows.length){extra.push({...r,values:merged.headers.map((_,j)=>r.values[j]||'')});return;}
   const id=identity(r,keys),candidates=byId.get(id.d365itemid)||bySku.get(id.sku)||[],matches=candidates.filter(x=>['d365itemid','manufacturer','model'].every(k=>!id[k]||!x.id[k]||id[k]===x.id[k]));
   if(matches.length!==1){skipped++;return;}records.push([i,...matches[0].values]);
  });
  if(!records.length&&!extra.length)throw Error('Aucune quantité régionale ne peut être associée au catalogue. Les données précédentes sont conservées.');
  return {region,at,dailyDate:ToolboxUsedCatalogue.day(at),baseCount:base.rows.length,baseHash:signature(base),records,extra,headers:merged.headers,currency:base.currency||incoming.currency,filters:incoming.filters||'',complete:!!incoming.complete,loadedToEnd:!!incoming.loadedToEnd,expected:incoming.expected??null,sourceCount:incoming.rows.length,ambiguous:merged.lastImportStats.ambiguous+skipped};
 }
 function view(base,snapshot,region){
  if(!valid(base,snapshot,region))return null;
  const headers=[...base.headers],keys=headers.map(ToolboxUsedCatalogue.column),extraKeys=snapshot.headers.map(ToolboxUsedCatalogue.column);
  snapshot.headers.forEach((h,i)=>{if(!keys.includes(extraKeys[i])){headers.push(h);keys.push(extraKeys[i]);}});
  const q=ToolboxUsedCatalogue.quantityKeys.map(k=>keys.indexOf(k)),batch=String(snapshot.at),rows=[];
  for(const record of snapshot.records){const original=base.rows[record[0]];if(!original)continue;const values=headers.map((_,i)=>original.values[i]||'');q.forEach((j,i)=>{if(j>=0)values[j]=record[i+1]||'';});rows.push({...original,values,qtyBatch:batch,qtyAt:snapshot.at,qtySource:'Power BI · '+label(region),qtyPartial:record.slice(1).some(v=>v==='')});}
  for(const r of snapshot.extra)rows.push({...r,values:keys.map(k=>{const i=extraKeys.indexOf(k);return i<0?'':r.values[i]||'';})});
  const stats={updated:snapshot.records.length,added:snapshot.extra.length,retained:0,ambiguous:snapshot.ambiguous};
  return {...base,headers,rows,regionScope:region,regionVerified:true,at:snapshot.at,lastQuantityAt:snapshot.at,quantityBatch:batch,dailyDate:snapshot.dailyDate,lastImportStats:stats,lastImport:{source:'Power BI',at:snapshot.at,stats,filters:snapshot.filters,complete:snapshot.complete,loadedToEnd:snapshot.loadedToEnd,regions:selection(region)},complete:snapshot.complete,loadedToEnd:snapshot.loadedToEnd};
 }
 function allKnown(data){if(data.regionScope==='ALL'&&data.regionVerified)return true;if(data.lastImport?.source==='Power BI')return matches(data.lastImport.regions,'ALL');const filters=data.lastImport?.filters||data.filters||'';return /SUBREGION/i.test(filters)&&names.every(n=>new RegExp('\\b'+n+'\\b','i').test(filters));}
 globalThis.ToolboxUsedRegions={names,parse,normalize,selection,label,matches,signature,valid,snapshot,view,allKnown};
})();
