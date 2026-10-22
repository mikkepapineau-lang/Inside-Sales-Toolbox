// Non-Reserved Item List has its own schema and never writes the Used catalogue.
(()=>{
 const reportId='d8c07521-770e-41bd-be72-a23a1dbf41ff';
 const reportURL='https://app.powerbi.com/groups/ff3be965-02e9-4c0f-b9eb-b73e3bb4e51f/reports/'+reportId+'/2d2858f342dad29953b3?ctid=c2f120b6-e8fc-402c-9972-fa891cb53927&experience=power-bi';
 const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const columns={item:['itemid','itemnumber'],sku:['productname'],description:['productdescription'],quantity:['qtynotreserved','quantitynotreserved'],cost:['avgunitcost','averageunitcost'],manufacturer:['manufacturer'],entity:['entity','legalentity'],site:['site'],warehouse:['warehouse'],category:['nonreservedinventorycategory'],category1:['lvl1productcategory'],category2:['lvl2productcategory'],category3:['lvl3productcategory'],category4:['lvl4productcategory']};
 const indexes=headers=>Object.fromEntries(Object.entries(columns).map(([key,names])=>[key,headers.map(norm).findIndex(name=>names.includes(name))]));
 const matches=value=>{try{const u=new URL(value),ids=/^\/reportEmbed\/?$/i.test(u.pathname)?u.searchParams.getAll('reportId'):[u.pathname.match(/\/reports\/([\da-f-]{36})(?:\/|$)/i)?.[1]];return u.origin==='https://app.powerbi.com'&&!u.username&&!u.password&&ids.length===1&&ids[0]?.toLowerCase()===reportId;}catch{return false;}};
 function validate(input,{at=Date.now()}={}){
  if(!input||!Array.isArray(input.headers)||!Array.isArray(input.rows)||input.headers.length>100||input.rows.length>150000)throw Error('Format Non-Reserved invalide ou fichier trop volumineux.');
  const headers=input.headers.map(h=>String(h??'').trim()),keys=headers.map(norm),cols=indexes(headers);
  if(new Set(keys).size!==keys.length||keys.some(k=>!k)||[cols.item,cols.sku,cols.quantity,cols.cost].some(i=>i<0))throw Error('Le fichier doit contenir ITEMID, PRODUCTNAME, QtyNotReserved et AvgUnitCost.');
  const rows=[];
  for(const source of input.rows){
   if(!Array.isArray(source.values)||source.values.length>headers.length)throw Error('Une ligne ne correspond pas aux colonnes Non-Reserved.');
   const values=headers.map((_,i)=>String(source.values[i]??'').trim());if(values.some(v=>v.length>32000))throw Error('Une cellule Non-Reserved est trop longue.');
   if(/^(total|totals|totaux)$/i.test(values[cols.item])||!values[cols.item]&&!values[cols.sku]||!values[cols.sku]&&!values[cols.quantity]&&!values[cols.cost])continue;
   for(const key of ['quantity','cost']){const value=values[cols[key]];if(value!==''&&ToolboxUsedCatalogue.number(value)===null)throw Error('La quantité ou le coût unitaire moyen n’est pas numérique. Aucun import.');}
   rows.push({values});
  }
  return {schemaVersion:1,headers,rows,at,currency:/^(CAD|USD|EUR|GBP)$/.test(input.currency)?input.currency:'',filters:String(input.filters||'').slice(0,50000),sourceName:String(input.sourceName||'Non-Reserved.xlsx').slice(0,200),sourceSheet:String(input.sourceSheet||'').slice(0,200)};
 }
 globalThis.ToolboxNonReserved={reportId,reportURL,norm,indexes,matches,validate};
})();
