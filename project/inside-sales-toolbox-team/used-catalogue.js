// Persistent Used Gear catalogue. Source values stay text; quantities are never summed.
(()=>{
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const text=s=>String(s??'').trim();
 const aliases={d365itemnumber:'d365itemid',itemnumber:'d365itemid'};
 const column=s=>aliases[norm(s)]||norm(s);
 const quantityKeys=['qtyowned','maxqtytosell','qtyavailable'];
 function number(s){
  let v=text(s).replace(/[\s\u00a0\u202f]/g,'');if(!v)return null;
  if(v.includes(',')&&v.includes('.'))v=v.lastIndexOf(',')>v.lastIndexOf('.')?v.replace(/\./g,'').replace(',','.'):v.replace(/,/g,'');
  else if(v.includes(','))v=/^-?\d{1,3}(,\d{3})+$/.test(v)?v.replace(/,/g,''):v.replace(',','.');
  return /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(v)&&Number.isFinite(Number(v))?Number(v):null;
 }
 const day=at=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(at));return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');};
 function validate(input){
  if(!input||!Array.isArray(input.headers)||!Array.isArray(input.rows)||input.rows.length>60000||input.headers.length>100)throw Error('Format de catalogue invalide ou fichier trop volumineux.');
  const headers=input.headers.map(text),keys=headers.map(column);
  if(new Set(keys).size!==keys.length||keys.some(k=>!k))throw Error('Les colonnes du catalogue sont vides ou en double.');
  if(!keys.includes('sku')||!keys.includes('qtyavailable'))throw Error('Le fichier doit contenir SKU et QTY AVAILABLE.');
  const sku=keys.indexOf('sku'),quantities=quantityKeys.map(k=>keys.indexOf(k)).filter(i=>i>=0);
  const rows=[];
  for(const r of input.rows){
   if(!Array.isArray(r.values)||r.values.length>headers.length)throw Error('Une ligne du catalogue ne correspond pas aux colonnes.');
   const values=headers.map((_,i)=>text(r.values[i]));
   if(values.some(v=>v.length>32000))throw Error('Une cellule du fichier est trop longue.');
   if(!values[sku]||/^(total|totals|totaux)$/i.test(values[sku]))continue;
   if(quantities.some(i=>values[i]!==''&&number(values[i])===null))throw Error('Une quantité du fichier n’est pas numérique. Aucun changement enregistré.');
   let href='';try{const u=new URL(r.href||'');if(u.protocol==='https:'&&!u.username&&!u.password)href=u.href;}catch{}
   rows.push({...r,values,href});
  }
  if(!rows.length)throw Error('Aucun article exploitable dans le fichier. Le catalogue existant est conservé.');
  return {...input,headers,rows,currency:/^(CAD|USD|EUR|GBP)$/.test(input.currency)?input.currency:''};
 }
 function identities(data){
  const keys=data.headers.map(column),value=(r,k)=>text(r.values[keys.indexOf(k)]);
  return data.rows.map(r=>{const sku=value(r,'sku').toUpperCase(),brand=value(r,'manufacturer').toUpperCase(),model=value(r,'model').toUpperCase();return {id:value(r,'d365itemid'),sku,brand,model,fallback:JSON.stringify([sku,brand,model])};});
 }
 function index(items,field){const map=new Map();items.forEach((x,i)=>{const k=x[field];if(k){if(!map.has(k))map.set(k,[]);map.get(k).push(i);}});return map;}
 function create(input,{at=Date.now(),source='Excel',batch}={}){
  const data=validate(input),tag=batch||String(at),keys=data.headers.map(column);
  return {...data,schemaVersion:1,catalogueAt:at,at,quantityBatch:tag,lastQuantityAt:at,lastQuantitySource:source,dailyDate:at?day(at):data.sourceDate||'',
   rows:data.rows.map(r=>({...r,financialAt:at,qtyBatch:tag,qtyAt:at,qtySource:source,qtyPartial:quantityKeys.some(k=>{const i=keys.indexOf(k);return i<0||r.values[i]==='';})}))};
 }
 function merge(baseInput,incomingInput,{at=Date.now(),source='Excel',mode='quantities'}={}){
  const base=validate(baseInput),incoming=validate(incomingInput),financial=mode==='catalogue';
  if(financial&&(!incoming.headers.some(h=>column(h)==='nbv')||!incoming.headers.some(h=>column(h)==='sellprice')))throw Error('Pour mettre à jour les prix et NBV, le fichier doit contenir Sell Price et NBV.');
  if(base.currency&&incoming.currency&&base.currency!==incoming.currency)throw Error('La devise du fichier ou du rapport diffère du catalogue. Sélectionne la même devise avant de mettre à jour.');
  if(financial&&base.currency&&!incoming.currency)throw Error('La devise du fichier doit être indiquée pour mettre à jour les prix et NBV.');
  const headers=[...base.headers],keys=headers.map(column),inKeys=incoming.headers.map(column);
  incoming.headers.forEach((h,i)=>{if(!keys.includes(inKeys[i])){headers.push(h);keys.push(inKeys[i]);}});
  const oldIds=identities(base),newIds=identities(incoming),byId=index(oldIds,'id'),bySku=index(oldIds,'sku'),byFallback=index(oldIds,'fallback'),incomingId=index(newIds,'id'),incomingFallback=index(newIds,'fallback'),fullIdentity=inKeys.includes('manufacturer')&&inKeys.includes('model');
  const proposal=[],stats={updated:0,added:0,retained:0,ambiguous:0,matched:0};
  newIds.forEach((identity,j)=>{
   if(identity.id&&incomingId.get(identity.id).length!==1||!identity.id&&incomingFallback.get(identity.fallback).length!==1){stats.ambiguous++;return;}
   const exact=identity.id?byId.get(identity.id):null;
   if(exact?.length>1){stats.ambiguous++;return;}
   let matches=exact;
   if(!matches?.length&&fullIdentity)matches=(byFallback.get(identity.fallback)||[]).filter(i=>!identity.id||!oldIds[i].id||identity.id===oldIds[i].id);
   if(!matches?.length){matches=(bySku.get(identity.sku)||[]).filter(i=>(!identity.id||!oldIds[i].id||identity.id===oldIds[i].id)&&(!identity.brand||!oldIds[i].brand||identity.brand===oldIds[i].brand)&&(!identity.model||!oldIds[i].model||identity.model===oldIds[i].model));}
   if(matches.length>1){stats.ambiguous++;return;}
   proposal.push({target:matches[0]??null,j});
  });
  // Several incoming records targeting one existing record are all left untouched.
  const targetCounts=new Map();proposal.forEach(p=>{if(p.target!==null)targetCounts.set(p.target,(targetCounts.get(p.target)||0)+1);});
  const batch=String(at),rows=base.rows.map(r=>({...r,values:headers.map((_,i)=>r.values[i]??'')})),touched=new Set();
  for(const p of proposal){
   if(p.target!==null&&targetCounts.get(p.target)>1){stats.ambiguous++;continue;}
   const fresh=incoming.rows[p.j];
   if(p.target===null){
    const values=headers.map((_,i)=>{const k=inKeys.indexOf(keys[i]);return k<0?'':fresh.values[k];});
    if(base.currency&&!incoming.currency&&['sellprice','nbv','purchasecost'].some(k=>{const i=inKeys.indexOf(k);return i>=0&&fresh.values[i]!=='';}))throw Error('La devise des nouveaux articles doit être indiquée pour importer leurs prix et NBV. Aucun changement enregistré.');
    rows.push({values,href:fresh.href,financialAt:at,qtyBatch:batch,qtyAt:at,qtySource:source,qtyPartial:quantityKeys.some(k=>{const i=keys.indexOf(k);return i<0||values[i]==='';})});stats.added++;continue;
   }
   const target=rows[p.target];let changedQuantity=false;
   incoming.headers.forEach((_,i)=>{
    const dest=keys.indexOf(inKeys[i]),isQuantity=quantityKeys.includes(inKeys[i]);
    if(isQuantity?fresh.values[i]!=='':financial||inKeys[i]==='d365itemid'&&!target.values[dest])target.values[dest]=fresh.values[i];
    if(isQuantity&&fresh.values[i]!=='')changedQuantity=true;
   });
   if(financial){target.href=fresh.href||target.href;target.financialAt=at;}
   if(changedQuantity){target.qtyBatch=batch;target.qtyAt=at;target.qtySource=source;target.qtyPartial=quantityKeys.some(k=>{const i=inKeys.indexOf(k);return i<0||fresh.values[i]==='';});stats.updated++;touched.add(p.target);}
   stats.matched++;
  }
  stats.retained=base.rows.length-touched.size;
  return {...base,headers,rows,schemaVersion:1,at,lastQuantityAt:at,lastQuantitySource:source,quantityBatch:batch,dailyDate:day(at),
   catalogueAt:financial?at:base.catalogueAt,financialSource:financial?(incoming.sourceName||source):base.financialSource,
   currency:financial?(incoming.currency||base.currency):base.currency,
   lastImport:{at,source,mode,stats,rows:incoming.rows.length,complete:!!incoming.complete,loadedToEnd:!!incoming.loadedToEnd,expected:incoming.expected??null,filters:incoming.filters||'',currency:incoming.currency},
   lastImportName:incoming.sourceName||'',lastImportStats:stats};
 }
 function updatePrices(baseInput,incomingInput,{at=Date.now(),source='Power BI'}={}){
  const base=validate(baseInput),incoming=validate(incomingInput),keys=incoming.headers.map(column);
  if(!base.currency||!incoming.currency)throw Error('La devise du catalogue et du relevé doit être confirmée pour actualiser les prix et NBV.');
  if(base.currency!==incoming.currency)throw Error('La devise du fichier ou du rapport diffère du catalogue. Sélectionne la même devise avant de mettre à jour.');
  const price=keys.indexOf('sellprice'),nbv=keys.indexOf('nbv');
  if(price<0||nbv<0)throw Error('Le relevé doit contenir Sell Price et NBV pour actualiser les prix.');
  const amount=value=>{
   let cleaned=text(value).replace(new RegExp('\\b'+incoming.currency+'\\b','gi'),'').trim();
   if(incoming.currency==='CAD')cleaned=cleaned.replace(/(?:CA\$|C\$|\$)/gi,'');
   else if(incoming.currency==='USD')cleaned=cleaned.replace(/(?:US\$|\$)/gi,'');
   else cleaned=cleaned.replace(incoming.currency==='EUR'?/€/g:/£/g,'');
   const n=number(cleaned);if(n===null)throw Error('Un prix ou NBV du relevé n’est pas numérique. Aucun changement enregistré.');return String(n);
  };
  let incomplete=0;const fresh=[];
  for(const row of incoming.rows){if(row.values[price]===''||row.values[nbv]===''){incomplete++;continue;}const values=[...row.values];values[price]=amount(values[price]);values[nbv]=amount(values[nbv]);fresh.push({...row,values});}
  if(!fresh.length)throw Error('Aucune paire prix et NBV exploitable. Les valeurs précédentes sont conservées.');
  // Reuse the catalogue’s identity and ambiguity checks, then keep only financial fields.
  const marker='before-price-refresh',staged=merge({...base,rows:base.rows.map(row=>({...row,financialAt:marker}))},{...incoming,rows:fresh},{at,source,mode:'catalogue'});
  const headers=[...base.headers],baseKeys=headers.map(column);
  for(const key of ['sellprice','nbv'])if(!baseKeys.includes(key)){headers.push(incoming.headers[keys.indexOf(key)]);baseKeys.push(key);}
  const stagedKeys=staged.headers.map(column);let updated=0;
  const rows=base.rows.map((row,index)=>{
   const next=staged.rows[index];if(next.financialAt!==at)return row;
   const values=headers.map((_,i)=>row.values[i]??'');for(const key of ['sellprice','nbv'])values[baseKeys.indexOf(key)]=next.values[stagedKeys.indexOf(key)];updated++;
   return {...row,values,financialAt:at,financialSource:source};
  });
  const stats={updated,retained:base.rows.length-updated,ambiguous:staged.lastImportStats.ambiguous,incomplete,newItems:staged.lastImportStats.added};
  if(!updated)throw Error('Aucun article du catalogue ne correspond de façon unique aux prix du relevé. Aucun changement enregistré.');
  return {...base,headers,rows,catalogueAt:at,financialSource:incoming.sourceName||source,lastFinancialUpdate:{at,source,stats,rows:incoming.rows.length,complete:!!incoming.complete,loadedToEnd:!!incoming.loadedToEnd,expected:incoming.expected??null,filters:incoming.filters||'',currency:incoming.currency}};
 }
 globalThis.ToolboxUsedCatalogue={column,number,day,validate,create,merge,updatePrices,quantityKeys};
})();
