(()=>{
 const el=id=>document.getElementById(id);let data=null,catalogue=null,regionSnapshots={},shownRegion='ALL',memoBase=null,memoSnapshot=null,requesting=false,status={},visibleLimit=80,importing=false,indexedData=null,filterIndex=null,filterSaveTimer,filtersTouched=false;
 const filterUI=ToolboxUsedFilters.mount(changeFilters);
 const {node,row:recordRow,fieldList,diagnostics,time,link}=ToolboxList;
 const numeric=ToolboxUsedCatalogue.number;
 const dateOnly=s=>new Date(s+'T12:00:00Z').toLocaleDateString(document.documentElement.lang==='en-CA'?'en-CA':'fr-CA',{year:'numeric',month:'short',day:'numeric'});
 function money(value){const n=numeric(value);return n===null?value:new Intl.NumberFormat(document.documentElement.lang==='en-CA'?'en-CA':'fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);}
 const region=()=>filterUI.state.subregion||'ALL';
 function selectData(){
  const current=region(),snapshot=regionSnapshots[current];
  if(current==='ALL'){data=catalogue;memoBase=null;memoSnapshot=null;return;}
  if(catalogue!==memoBase||snapshot!==memoSnapshot){memoBase=catalogue;memoSnapshot=snapshot;data=catalogue?ToolboxUsedRegions.view(catalogue,snapshot,current):null;}
 }
 async function refresh(kind='usedPowerBIRead'){
  if(requesting||status.state==='loading'||importing)return;
  const prices=kind==='usedPowerBIReadPrices',targetRegion=prices?'ALL':region(),operation=prices?'prices':'quantities';
  requesting=true;status={state:'loading',phase:'starting',region:targetRegion,operation,message:prices?'Lecture des prix et NBV du catalogue global…':'Préparation de la lecture des quantités…'};render();
  try{const result=await chrome.runtime.sendMessage({kind,region:targetRegion});if(result?.error)throw Error(result.error);if(!result?.value)throw Error('La mise à jour n’a pas été confirmée.');
   const saved=await chrome.storage.local.get(['toolboxUsedPowerBI','toolboxUsedRegionQuantities','toolboxUsedPowerBIStatus']);catalogue=saved.toolboxUsedPowerBI||catalogue;regionSnapshots=saved.toolboxUsedRegionQuantities||regionSnapshots;status=saved.toolboxUsedPowerBIStatus||{state:'done',region:region(),count:result.value.count};
  }catch(e){status={state:'error',region:targetRegion,operation,message:e.message};}finally{requesting=false;render();}
 }
 function render(){
  selectData();const root=el('used-results');root.replaceChildren();const loading=status.state==='loading'||importing||requesting,prices=status.operation==='prices';const scopedStatus=status.region&&status.region!==region()&&status.state!=='loading'?{state:'idle'}:status;
  ToolboxUsedRefresh.render(prices?{state:'idle'}:scopedStatus,!prices&&(requesting||importing));ToolboxUsedRefresh.render(prices?status:{state:'idle'},prices&&(requesting||importing),{buttonId:'used-refresh-prices',financial:true});filterUI.setBusy(loading);
  const regionLabel=ToolboxUsedRegions.label(region());el('used-region-note').textContent=region()==='ALL'?(catalogue&&!ToolboxUsedRegions.allKnown(catalogue)?'Sous-région du dernier relevé non confirmée. Actualise les quantités pour vérifier CANADA + UK + USA.':'Quantités CANADA + UK + USA.'):(data?'Quantités '+regionLabel+' selon les filtres Power BI · Prix et NBV du catalogue.':regionLabel+' · Clique sur Quantités pour charger cette sélection.');
  for(const id of ['used-refresh','used-refresh-prices','used-import','used-force','used-clear','used-import-mode'])el(id).disabled=loading;
  el('used-status').textContent=importing?'Lecture du fichier Excel…':status.message||(loading?'Lecture de l’inventaire usagé…':data?'':'Chargement du catalogue Excel…');
  el('used-stop').hidden=!loading||importing;el('used-more').hidden=true;
  el('used-time').textContent=data?(data.lastQuantityAt?'Quantités récupérées · '+time(data.lastQuantityAt):data.sourceDate?'Quantités · Excel du '+dateOnly(data.sourceDate):time(data.at)):'';
  el('used-status').dataset.state=status.state||'idle';el('used-status').hidden=!!data&&!loading&&!status.message;
  el('used-financial-time').textContent=catalogue?(catalogue.catalogueAt?'Prix et NBV · '+time(catalogue.catalogueAt):catalogue.sourceDate?'Prix et NBV · Excel du '+dateOnly(catalogue.sourceDate):'Prix et NBV du catalogue enregistré'):'';
  const financial=catalogue?.lastFinancialUpdate;
  el('used-price-note').textContent=financial?financial.stats.updated+' articles actualisés · '+financial.stats.retained+' prix et NBV conservés.':'Catalogue global · Quantités conservées';
  if(!data){if(region()!=='ALL')root.append(node('p','muted','Les quantités des autres sous-régions ne sont pas utilisées pour ce filtre.'));el('used-count').textContent='';el('used-currency').textContent='';el('used-coverage').textContent='';el('used-location-note').hidden=true;return;}
  const headers=data.headers.map(ToolboxUsedCatalogue.column),index=key=>headers.indexOf(key);
  const warehouseKey=['warehouse','warehouseid','inventlocationid','entrepot','location','emplacement','site','siteid'].find(key=>headers.includes(key));
  const cols={item:index('d365itemid'),sku:index('sku'),description:index('description'),brand:index('manufacturer'),available:index('qtyavailable'),owned:index('qtyowned'),sellable:index('maxqtytosell'),price:index('sellprice'),nbv:index('nbv'),warehouse:warehouseKey?index(warehouseKey):-1};
  const get=(r,key)=>String(cols[key]>=0?r.values[cols[key]]??'':'');
  el('used-location-note').hidden=cols.warehouse>=0&&data.rows.every(r=>get(r,'warehouse').trim());
  el('used-location-note').textContent=cols.warehouse<0?'Entrepôt non fourni par ce rapport.':'Entrepôt non indiqué pour certains articles.';
  if(data!==indexedData){indexedData=data;filterIndex=ToolboxUsedFilterModel.build(data);}
  const filtered=ToolboxUsedFilterModel.evaluate(filterIndex,filterUI.state),records=filtered.records;
  filterUI.render(filtered,filterIndex.availableFields);
  const groups=new Map();records.forEach(x=>{if(!groups.has(x.key))groups.set(x.key,[]);groups.get(x.key).push(x.r);});
  el('used-count').textContent=groups.size+' article(s) · '+records.length+' / '+data.rows.length+' ligne(s)';
  el('used-currency').textContent=data.currency||'Devise à vérifier';
  const stats=data.lastImportStats;
  el('used-coverage').textContent=stats?stats.updated+' mis à jour · '+stats.added+' nouveaux · '+stats.retained+' conservés sans nouvelle quantité'+(stats.ambiguous?' · '+stats.ambiguous+' correspondances ambiguës ignorées':''):'Catalogue Excel · '+data.rows.length+' lignes';
  if(data.lastImport?.source==='Power BI'&&!data.lastImport.complete)el('used-coverage').textContent+=' · total Power BI non confirmé';
  el('used-source').textContent=data.filters||'';el('used-update-source').textContent=data.lastImport?.filters||'';
  el('used-more').hidden=groups.size<=visibleLimit;
  for(const [groupKey,rows] of [...groups.entries()].slice(0,visibleLimit)){
   const r=rows[0],meta=[];
   if(rows.length===1){for(const [key,label] of [['owned','Possédé'],['sellable','Max.']])if(get(r,key)!=='')meta.push({label,value:get(r,key)});}
   else meta.push({value:rows.length+' lignes source',raw:false});
   const unverified=rows.some(r=>r.qtyBatch&&r.qtyBatch!==data.quantityBatch),partial=rows.some(r=>r.qtyPartial);
   const quantity=rows.length===1?numeric(get(r,'available')):null,state=unverified||partial||quantity===null?'unverified':quantity>0?'available':'empty';
   const availability={state,quantity:rows.length===1&&quantity!==null?get(r,'available'):null,caption:unverified?'À revérifier':partial?'Quantités partielles':quantity===null?'À vérifier':quantity>0?'Dispo.':'Indisponible',place:cols.warehouse>=0?[...new Set(rows.map(r=>get(r,'warehouse')).filter(Boolean))].join(' · '):''};
   const amounts=[['price','Prix de vente'],['nbv','NBV']].map(([key,label])=>{const values=[...new Set(rows.map(r=>get(r,key)))],raw=values.length===1&&values[0]!=='';return {label,raw,currency:raw?data.currency:'',value:raw?money(values[0])+' $':values.length>1?'Plusieurs valeurs':'Non renseigné'};});
   const name=[get(r,'brand'),get(r,'item')?'D365 '+get(r,'item'):''].filter(Boolean).join(' · ');
   const record=recordRow({key:'used:'+groupKey,code:get(r,'sku')||get(r,'item'),name,description:get(r,'description'),amounts,meta,availability});
   rows.forEach((r,i)=>{
    if(rows.length>1)record.append(node('h4','record-source-heading','Ligne source '+(i+1)));
    if(r.qtyAt)record.append(node('p','quantity-provenance','Quantités récupérées · '+time(r.qtyAt)+' · '+(r.qtySource||'')));
    if(r.financialAt||data.sourceDate)record.append(node('p','quantity-provenance','Prix et NBV · '+(r.financialAt?time(r.financialAt):'Excel du '+dateOnly(data.sourceDate))));
    record.append(fieldList(data.headers,r.values));if(r.href)record.append(link('Ouvrir le lien SKU ↗',r.href,'record-source-link'));
   });root.append(record);
  }
  if(!records.length)root.append(node('p','muted','Aucun article ne correspond aux filtres locaux.'));
 }
 function changeFilters(results=true,debounce=false){
  const regionChanged=shownRegion!==region();shownRegion=region();if(regionChanged){memoBase=null;memoSnapshot=null;status={state:'idle',region:region()};}
  filtersTouched=true;filterUI.state.query=el('used-query').value;filterUI.state.availableOnly=el('used-available').checked;
  if(results){visibleLimit=80;render();globalThis.ToolboxMotion?.results(el('used-results'));}
  clearTimeout(filterSaveTimer);const snapshot=filterUI.serialize();
  const save=()=>chrome.storage.local.set({toolboxUsedFilters:snapshot}).catch(()=>{});
  if(debounce)filterSaveTimer=setTimeout(save,150);else save();
 }
 async function action(kind,payload={}){
  try{const r=await chrome.runtime.sendMessage({kind,region:region(),...payload});if(r?.error)throw Error(r.error);if(kind==='usedPowerBIDiagnostic')diagnostics('used-diagnostic-output',r.value);if(kind==='usedPowerBIBind'){status={state:'done',message:'Onglet associé. Clique sur Actualiser.'};render();}return r?.value;}
  catch(e){status={state:'error',operation:payload.mode==='prices'?'prices':undefined,message:e.message};render();}
 }
 el('used-refresh').onclick=()=>refresh();el('used-refresh-prices').onclick=()=>refresh('usedPowerBIReadPrices');el('used-force').onclick=()=>refresh('usedPowerBIReadForce');el('used-open').onclick=()=>action('usedPowerBIOpen');el('used-bind').onclick=()=>action('usedPowerBIBind');el('used-diagnostic').onclick=()=>action('usedPowerBIDiagnostic');
 el('used-query').oninput=()=>changeFilters(true,true);el('used-available').onchange=()=>changeFilters();el('used-more').onclick=()=>{visibleLimit+=80;render();};el('used-stop').onclick=()=>action('usedPowerBIStop');el('used-clear').onclick=async()=>{const result=await action('usedCatalogueReset');if(result){filterUI.state.subregion='ALL';shownRegion='ALL';changeFilters();}};
 el('used-import').onclick=()=>el('used-file').click();
 el('used-file').onchange=async()=>{
  const file=el('used-file').files?.[0];if(!file)return;const mode=el('used-import-mode').value;importing=true;status={state:'loading',operation:mode==='prices'?'prices':'quantities',phase:'starting',region:mode==='prices'?'ALL':region()};render();
  try{const parsed=await ToolboxUsedExcel.read(file);await action('usedCatalogueImport',{data:parsed,mode});}
  catch(e){status={state:'error',operation:mode==='prices'?'prices':'quantities',message:e.message};}
  finally{importing=false;el('used-file').value='';render();}
 };
 chrome.storage.onChanged.addListener((c,area)=>{if(area!=='local')return;let changed=!!c.toolboxLanguage;if(c.toolboxUsedPowerBI){catalogue=c.toolboxUsedPowerBI.newValue;changed=true;}if(c.toolboxUsedRegionQuantities){regionSnapshots=c.toolboxUsedRegionQuantities.newValue||{};memoSnapshot=null;changed=true;}if(c.toolboxUsedPowerBIStatus){status=c.toolboxUsedPowerBIStatus.newValue||{};changed=true;}if(c.toolboxUsedFilters){filtersTouched=true;const saved=ToolboxUsedFilterModel.serialize(ToolboxUsedFilterModel.state(c.toolboxUsedFilters.newValue));if(JSON.stringify(saved)!==JSON.stringify(filterUI.serialize())){clearTimeout(filterSaveTimer);filterUI.restore(saved);shownRegion=region();memoBase=null;memoSnapshot=null;visibleLimit=80;changed=true;}}if(c.toolboxUsedPowerBIDiagnostic)diagnostics('used-diagnostic-output',c.toolboxUsedPowerBIDiagnostic.newValue);if(changed)render();});
 chrome.storage.local.get(['toolboxUsedPowerBI','toolboxUsedPowerBIStatus','toolboxUsedFilters','toolboxUsedRegionQuantities']).then(async s=>{catalogue=s.toolboxUsedPowerBI;regionSnapshots=s.toolboxUsedRegionQuantities||{};status=s.toolboxUsedPowerBIStatus||{};if(!filtersTouched)filterUI.restore(s.toolboxUsedFilters);shownRegion=region();render();await action('usedPowerBIInit');});
})();
