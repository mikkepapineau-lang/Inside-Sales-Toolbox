(()=>{
 const el=id=>document.getElementById(id);let data=null,catalogue=null,regionSnapshots={},regionPrices={},memoFinancial=null,shownRegion='ALL',memoBase=null,memoSnapshot=null,requesting=false,status={},visibleLimit=80,importing=false,indexedData=null,filterIndex=null,filterSaveTimer,filtersTouched=false;
 const filterUI=ToolboxUsedFilters.mount(changeFilters);
 const {node,row:recordRow,fieldList,diagnostics,time,link}=ToolboxList;
 const numeric=ToolboxUsedCatalogue.number;
 const dateOnly=s=>new Date(s+'T12:00:00Z').toLocaleDateString(document.documentElement.lang==='en-CA'?'en-CA':'fr-CA',{year:'numeric',month:'short',day:'numeric'});
 function money(value){const n=numeric(value);return n===null?value:new Intl.NumberFormat(document.documentElement.lang==='en-CA'?'en-CA':'fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);}
 const region=()=>filterUI.state.subregion||'ALL';
 function selectData(){
  const current=region(),snapshot=regionSnapshots[current],financial=regionPrices[current];
  if(current==='ALL'){data=catalogue;memoBase=null;memoSnapshot=null;return;}
  if(catalogue!==memoBase||snapshot!==memoSnapshot||financial!==memoFinancial){memoBase=catalogue;memoSnapshot=snapshot;memoFinancial=financial;data=catalogue?ToolboxUsedRegions.financialView(catalogue,ToolboxUsedRegions.view(catalogue,snapshot,current),financial,current):null;}
 }
 async function refresh(kind='usedPowerBIReadForce'){
  if(requesting||status.state==='loading'||importing)return;
  const prices=kind==='usedPowerBIReadPrices',excel=kind==='usedPowerBIExportFile',targetRegion=region(),operation=excel?'export':prices?'prices':'quantities';
  requesting=true;status={state:'loading',phase:'starting',region:targetRegion,operation,message:prices?'Lecture des prix et NBV de la sélection…':'Préparation de la lecture des quantités…'};render();
  try{let result=await chrome.runtime.sendMessage({kind,region:targetRegion,foreground:el('used-foreground').checked});if(result?.error)throw Error(result.error);if(!result?.value)throw Error('La mise à jour n’a pas été confirmée.');
   if(excel){
    const file=result.value;if(typeof file.base64!=='string'||file.base64.length>35000000)throw Error('Fichier Excel reçu invalide.');
    const bytes=Uint8Array.from(atob(file.base64),c=>c.charCodeAt(0));
    const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
    if(bytes.length!==file.size||hash!==file.sha256)throw Error('L’empreinte du fichier Excel reçu ne correspond pas.');
    status={state:'loading',phase:'importing',operation,region:targetRegion,message:'Lecture du fichier Excel…'};render();
    const parsed=await ToolboxUsedExcel.read(new File([bytes],file.name,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
    result=await chrome.runtime.sendMessage({kind:'usedPowerBIImportExport',region:targetRegion,exportId:file.exportId,sha256:hash,data:parsed});
    if(result?.error)throw Error(result.error);if(!result?.value)throw Error('L’importation Excel n’a pas été confirmée.');
   }
   const saved=await chrome.storage.local.get(['toolboxUsedPowerBI','toolboxUsedRegionQuantities','toolboxUsedRegionPrices','toolboxUsedPowerBIStatus']);catalogue=saved.toolboxUsedPowerBI||catalogue;regionSnapshots=saved.toolboxUsedRegionQuantities||regionSnapshots;regionPrices=saved.toolboxUsedRegionPrices||regionPrices;status=saved.toolboxUsedPowerBIStatus||{state:'done',region:region(),count:result.value.count};
  }catch(e){status={state:'error',region:targetRegion,operation,message:e.message};}finally{requesting=false;render();}
 }
 function render(){
  selectData();const root=el('used-results');root.replaceChildren();const loading=status.state==='loading'||importing||requesting,prices=status.operation==='prices',excel=status.operation==='export';const scopedStatus=status.region&&status.region!==region()&&status.state!=='loading'?{state:'idle'}:status;
  ToolboxUsedRefresh.render(prices||excel?{state:'idle'}:scopedStatus,!prices&&!excel&&(requesting||importing));ToolboxUsedRefresh.render(prices?scopedStatus:{state:'idle',region:region()},prices&&(requesting||importing),{buttonId:'used-refresh-prices',financial:true});ToolboxUsedRefresh.render(excel?scopedStatus:{state:'idle',region:region()},excel&&requesting,{buttonId:'used-export-excel',excel:true});filterUI.setBusy(loading);
  const regionLabel=ToolboxUsedRegions.label(region());el('used-region-note').textContent=region()==='ALL'?(catalogue&&!ToolboxUsedRegions.allKnown(catalogue)?'Sous-région du dernier relevé non confirmée. Actualise les quantités pour vérifier CANADA + UK + USA.':'Quantités CANADA + UK + USA.'):(data?.quantitiesPending?'Prix et NBV '+regionLabel+' · Actualise les quantités pour cette sélection.':data?'Quantités '+regionLabel+' selon les filtres Power BI · Prix et NBV selon la sélection.':regionLabel+' · Clique sur Quantités pour charger cette sélection.');
  for(const id of ['used-refresh','used-refresh-prices','used-export-excel','used-import','used-force','used-clear','used-import-mode','used-foreground'])el(id).disabled=loading;
  el('used-status').textContent=importing?'Lecture du fichier Excel…':status.message||(loading?'Lecture de l’inventaire usagé…':data?'':'Chargement du catalogue Excel…');
  el('used-stop').hidden=!loading||importing;el('used-more').hidden=true;
  el('used-time').textContent=data?(data.quantitiesPending?'Quantités à actualiser pour cette sélection.':data.lastQuantityAt?'Quantités récupérées · '+time(data.lastQuantityAt):data.sourceDate?'Quantités · Excel du '+dateOnly(data.sourceDate):time(data.at)):'';
  el('used-status').dataset.state=status.state||'idle';el('used-status').hidden=!!data&&!loading&&!status.message;
  const financialData=region()==='ALL'?catalogue:data;
  el('used-financial-time').textContent=financialData?(financialData.catalogueAt?'Prix et NBV · '+time(financialData.catalogueAt):region()==='ALL'&&financialData.sourceDate?'Prix et NBV · Excel du '+dateOnly(financialData.sourceDate):'Prix et NBV à actualiser pour cette sélection.'):'';
  const financial=financialData?.lastFinancialUpdate;
  el('used-price-note').textContent=financial?(region()==='ALL'?financial.stats.updated+' articles actualisés · '+financial.stats.retained+' prix et NBV conservés.':financial.stats.updated+' articles actualisés · '+regionLabel+'.'):region()==='ALL'?'Catalogue global · Quantités conservées':'Prix et NBV à actualiser pour cette sélection.';
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
  el('used-coverage').textContent=data.quantitiesPending?'Prix et NBV · '+data.rows.length+' articles · Quantités à actualiser.':stats?stats.updated+' mis à jour · '+stats.added+' nouveaux · '+stats.retained+' conservés sans nouvelle quantité'+(stats.ambiguous?' · '+stats.ambiguous+' correspondances ambiguës ignorées':''):'Catalogue Excel · '+data.rows.length+' lignes';
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
 el('used-foreground').onchange=()=>chrome.storage.local.set({toolboxUsedForeground:el('used-foreground').checked}).catch(()=>{});
 el('used-export-excel').onclick=()=>refresh('usedPowerBIExportFile');el('used-refresh').onclick=()=>refresh();el('used-refresh-prices').onclick=()=>refresh('usedPowerBIReadPrices');el('used-force').onclick=()=>refresh('usedPowerBIReadForce');el('used-open').onclick=()=>action('usedPowerBIOpen');el('used-bind').onclick=()=>action('usedPowerBIBind');el('used-diagnostic').onclick=()=>action('usedPowerBIDiagnostic');
 el('used-query').oninput=()=>changeFilters(true,true);el('used-available').onchange=()=>changeFilters();el('used-more').onclick=()=>{visibleLimit+=80;render();};el('used-stop').onclick=()=>action('usedPowerBIStop');el('used-clear').onclick=async()=>{const result=await action('usedCatalogueReset');if(result){filterUI.state.subregion='ALL';shownRegion='ALL';changeFilters();}};
 el('used-import').onclick=()=>el('used-file').click();
 el('used-file').onchange=async()=>{
  const file=el('used-file').files?.[0];if(!file)return;const mode=el('used-import-mode').value;importing=true;status={state:'loading',operation:mode==='prices'?'prices':'quantities',phase:'starting',region:mode==='prices'?'ALL':region()};render();
  try{const parsed=await ToolboxUsedExcel.read(file);await action('usedCatalogueImport',{data:parsed,mode});}
  catch(e){status={state:'error',operation:mode==='prices'?'prices':'quantities',message:e.message};}
  finally{importing=false;el('used-file').value='';render();}
 };
 chrome.storage.onChanged.addListener((c,area)=>{if(area!=='local')return;let changed=!!c.toolboxLanguage;if(c.toolboxUsedPowerBI){catalogue=c.toolboxUsedPowerBI.newValue;changed=true;}if(c.toolboxUsedRegionQuantities){regionSnapshots=c.toolboxUsedRegionQuantities.newValue||{};memoSnapshot=null;changed=true;}if(c.toolboxUsedRegionPrices){regionPrices=c.toolboxUsedRegionPrices.newValue||{};memoFinancial=null;changed=true;}if(c.toolboxUsedPowerBIStatus){status=c.toolboxUsedPowerBIStatus.newValue||{};changed=true;}if(c.toolboxUsedFilters){filtersTouched=true;const saved=ToolboxUsedFilterModel.serialize(ToolboxUsedFilterModel.state(c.toolboxUsedFilters.newValue));if(JSON.stringify(saved)!==JSON.stringify(filterUI.serialize())){clearTimeout(filterSaveTimer);filterUI.restore(saved);shownRegion=region();memoBase=null;memoSnapshot=null;visibleLimit=80;changed=true;}}if(c.toolboxUsedPowerBIDiagnostic)diagnostics('used-diagnostic-output',c.toolboxUsedPowerBIDiagnostic.newValue);if(changed)render();});
 chrome.storage.local.get(['toolboxUsedPowerBI','toolboxUsedPowerBIStatus','toolboxUsedFilters','toolboxUsedRegionQuantities','toolboxUsedRegionPrices','toolboxUsedForeground']).then(async s=>{el('used-foreground').checked=s.toolboxUsedForeground===true;catalogue=s.toolboxUsedPowerBI;regionSnapshots=s.toolboxUsedRegionQuantities||{};regionPrices=s.toolboxUsedRegionPrices||{};status=s.toolboxUsedPowerBIStatus||{};if(!filtersTouched)filterUI.restore(s.toolboxUsedFilters);shownRegion=region();render();await action('usedPowerBIInit');});
})();
