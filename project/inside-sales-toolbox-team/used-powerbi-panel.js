(()=>{
 const el=id=>document.getElementById(id),tr=value=>globalThis.ToolboxI18n?.t(value)||value;let data=null,catalogue=null,countryMeta=null,countryMemo=null,batchCancelled=false,regionSnapshots={},regionPrices={},memoFinancial=null,shownRegion='ALL',memoBase=null,memoSnapshot=null,requesting=false,status={},visibleLimit=80,importing=false,indexedData=null,filterIndex=null,filterSaveTimer,filtersTouched=false;
 const filterUI=ToolboxUsedFilters.mount(changeFilters);
 const {node,diagnostics,time,link}=ToolboxList,opened=new Set();
 const numeric=ToolboxUsedCatalogue.number;
 const dateOnly=s=>new Date(s+'T12:00:00Z').toLocaleDateString(document.documentElement.lang==='en-CA'?'en-CA':'fr-CA',{year:'numeric',month:'short',day:'numeric'});
 function money(value){const n=numeric(value);return n===null?value:new Intl.NumberFormat(document.documentElement.lang==='en-CA'?'en-CA':'fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);}
 const region=()=>filterUI.state.subregion||'ALL';
 function selectData(){
  const current=region(),snapshot=regionSnapshots[current],financial=regionPrices[current];
  if(countryMeta){
   if(!countryMemo||countryMemo.base!==catalogue||countryMemo.meta!==countryMeta||countryMemo.q!==regionSnapshots||countryMemo.f!==regionPrices||countryMemo.region!==current)countryMemo={base:catalogue,meta:countryMeta,q:regionSnapshots,f:regionPrices,region:current,value:ToolboxUsedRegions.countryView(catalogue,regionSnapshots,regionPrices,countryMeta,current)};
   if(countryMemo.value){data=countryMemo.value;return;}
  }
  if(current==='ALL'){data=catalogue;memoBase=null;memoSnapshot=null;return;}
  if(catalogue!==memoBase||snapshot!==memoSnapshot||financial!==memoFinancial){memoBase=catalogue;memoSnapshot=snapshot;memoFinancial=financial;data=catalogue?ToolboxUsedRegions.financialView(catalogue,ToolboxUsedRegions.view(catalogue,snapshot,current),financial,current):null;}
 }
 const exactDate=at=>new Intl.DateTimeFormat(document.documentElement.lang==='en-CA'?'en-CA':'fr-CA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(at));
 async function parseNativeExcel(file){
  if(typeof file?.base64!=='string'||file.base64.length>35000000)throw Error('Fichier Excel reçu invalide.');
  const bytes=Uint8Array.from(atob(file.base64),c=>c.charCodeAt(0)),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(bytes.length!==file.size||hash!==file.sha256)throw Error('L’empreinte du fichier Excel reçu ne correspond pas.');
  return {sha256:hash,data:await ToolboxUsedExcel.read(new File([bytes],file.name,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})),exportId:file.exportId};
 }
 async function refresh(kind='usedPowerBIReadForce'){
  if(requesting||status.state==='loading'||importing)return;
  if(kind==='usedPowerBIExportFile'){el('used-fallback').open=false;filterUI.state.subregion='ALL';shownRegion='ALL';memoBase=null;memoSnapshot=null;memoFinancial=null;changeFilters();}
  const prices=kind==='usedPowerBIReadPrices',excel=kind==='usedPowerBIExportFile',targetRegion=region(),operation=excel?'export':prices?'prices':'quantities';
  requesting=true;status={state:'loading',phase:'starting',region:targetRegion,operation,message:excel?'Préparation des trois exports Canada, UK et USA…':prices?'Lecture des prix et NBV de la sélection…':'Préparation de la lecture des quantités…'};render();
  let batchId,activeCountry;batchCancelled=false;
  try{let result;
   if(excel){
    const start=await chrome.runtime.sendMessage({kind:'usedPowerBIBeginCountries'});if(start?.error)throw Error(start.error);batchId=start?.value?.batchId;if(!batchId)throw Error('La préparation des trois pays n’a pas été confirmée.');
    const exports=[];
    for(const [index,country]of ToolboxUsedRegions.names.entries()){activeCountry=country;
     if(batchCancelled)throw Error('Actualisation Excel arrêtée.');
     result=await chrome.runtime.sendMessage({kind,region:country,batchId,foreground:el('used-foreground').checked});if(result?.error)throw Error(result.error);if(!result?.value)throw Error('Le fichier Excel '+country+' n’a pas été reçu.');
     status={state:'loading',phase:'importing',operation,region:'ALL',batchIndex:index+1,country,message:'Lecture de l’export Excel '+country+' · '+(index+1)+'/3…'};render();
     exports.push({region:country,...await parseNativeExcel(result.value)});
    }
    if(batchCancelled)throw Error('Actualisation Excel arrêtée.');
    activeCountry=undefined;result=await chrome.runtime.sendMessage({kind:'usedPowerBIImportCountries',batchId,exports});
   }else result=await chrome.runtime.sendMessage({kind,region:targetRegion,foreground:el('used-foreground').checked});
   if(result?.error)throw Error(result.error);if(!result?.value)throw Error('La mise à jour n’a pas été confirmée.');
   const saved=await chrome.storage.local.get(['toolboxUsedPowerBI','toolboxUsedRegionQuantities','toolboxUsedRegionPrices','toolboxUsedPowerBIStatus','toolboxUsedCountryCatalogue']);countryMeta=saved.toolboxUsedCountryCatalogue||null;countryMemo=null;catalogue=saved.toolboxUsedPowerBI||catalogue;regionSnapshots=saved.toolboxUsedRegionQuantities||regionSnapshots;regionPrices=saved.toolboxUsedRegionPrices||regionPrices;status=saved.toolboxUsedPowerBIStatus||{state:'done',region:region(),count:result.value.count};
  }catch(e){const message=(activeCountry?activeCountry+' · ':'')+e.message;if(batchId)await chrome.runtime.sendMessage({kind:'usedPowerBIAbortCountries',batchId,message}).catch(()=>{});status={state:'error',region:targetRegion,operation,message};}finally{requesting=false;render();}
 }
 function render(){
  selectData();const root=el('used-results');root.className='product-card-list';root.replaceChildren();const loading=status.state==='loading'||importing||requesting,prices=status.operation==='prices',excel=status.operation==='export';const scopedStatus=status.region&&status.region!==region()&&status.state!=='loading'?{state:'idle'}:status;
  ToolboxUsedRefresh.render(prices||excel?{state:'idle'}:scopedStatus,!prices&&!excel&&(requesting||importing));ToolboxUsedRefresh.render(prices?scopedStatus:{state:'idle',region:region()},prices&&(requesting||importing),{buttonId:'used-refresh-prices',financial:true});ToolboxUsedRefresh.render(excel?scopedStatus:{state:'idle',region:region()},excel&&requesting,{buttonId:'used-export-excel',excel:true});filterUI.setBusy(loading);
  el('used-excel-time').textContent=countryMeta?tr('Derniers exports Excel :')+' '+exactDate(countryMeta.at):catalogue?.lastImport?.source==='Excel'?'Dernier import Excel manuel : '+exactDate(catalogue.lastImport.at):'Exports par pays : pas encore importés.';
  const exportTimes=el('used-country-export-times');exportTimes.replaceChildren();if(countryMeta)for(const country of ToolboxUsedRegions.names)exportTimes.append(node('p','fine-print',country+' · Export Excel : '+exactDate(countryMeta.exports[country].at)));
  const regionLabel=ToolboxUsedRegions.label(region());el('used-region-note').textContent=data?.countryMode?'Relevés Excel par pays · Quantités et NBV séparés, prix de vente commun.':region()==='ALL'?(catalogue&&!ToolboxUsedRegions.allKnown(catalogue)?'Sous-région du dernier relevé non confirmée. Actualise les quantités pour vérifier CANADA + UK + USA.':'Quantités CANADA + UK + USA.'):(data?.quantitiesPending?'Prix et NBV '+regionLabel+' · Lecture de secours : actualise les quantités de cette sélection.':data?'Quantités '+regionLabel+' selon les filtres Power BI · Prix et NBV selon la sélection.':regionLabel+' · Lecture de secours : clique sur Quantités pour cette sélection.');
  for(const id of ['used-refresh','used-refresh-prices','used-export-excel','used-import','used-force','used-clear','used-import-mode','used-foreground'])el(id).disabled=loading;
  el('used-status').textContent=importing?'Lecture du fichier Excel…':status.message||(loading?'Lecture de l’inventaire usagé…':data?'':'Chargement du catalogue Excel…');
  el('used-stop').hidden=!loading||importing;el('used-more').hidden=true;
  el('used-time').textContent=data?(data.quantitiesPending?'Quantités à actualiser pour cette sélection.':data.lastQuantityAt?'Quantités récupérées · '+time(data.lastQuantityAt):data.sourceDate?'Quantités · Excel du '+dateOnly(data.sourceDate):time(data.at)):'';
  el('used-status').dataset.state=status.state||'idle';el('used-status').hidden=!!data&&!loading&&!status.message;
  const financialData=data?.countryMode?data:region()==='ALL'?catalogue:data;
  el('used-financial-time').textContent=financialData?(financialData.catalogueAt?'Prix et NBV · '+time(financialData.catalogueAt):region()==='ALL'&&financialData.sourceDate?'Prix et NBV · Excel du '+dateOnly(financialData.sourceDate):'Prix et NBV à actualiser pour cette sélection.'):'';
  const financial=financialData?.lastFinancialUpdate;
  el('used-price-note').textContent=data?.countryMode?'Prix de vente commun au produit · NBV et quantités par pays.':financial?(region()==='ALL'?financial.stats.updated+' articles actualisés · '+financial.stats.retained+' prix et NBV conservés.':financial.stats.updated+' articles actualisés · '+regionLabel+'.'):region()==='ALL'?'Catalogue global · Quantités conservées':'Prix et NBV à actualiser pour cette sélection.';
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
  if(data.countryMode)el('used-coverage').textContent=groups.size+(groups.size===1?' produit · ':' produits · ')+data.rows.length+' lignes par pays';
  if(data.lastImport?.source==='Power BI'&&!data.lastImport.complete)el('used-coverage').textContent+=' · total Power BI non confirmé';
  el('used-source').textContent=data.filters||'';el('used-update-source').textContent=data.lastImport?.filters||'';
  el('used-more').hidden=groups.size<=visibleLimit;
  // countryView already validates each country's own batch; it has no shared quantityBatch.
  const stockState=source=>{const quantity=numeric(get(source,'available')),stale=!data.countryMode&&source.qtyBatch&&source.qtyBatch!==data.quantityBatch,partial=!data.countryMode&&source.qtyPartial;return {quantity,state:stale||partial||quantity===null?'unverified':quantity>0?'available':'empty',caption:stale?'À revérifier':partial?'Quantités partielles':quantity===null?'À vérifier':'Dispo.'};};
  function stockQuantity(source){const stock=stockState(source),box=node('div','stock-quantity is-'+stock.state);box.append(node('strong','source-value',stock.quantity===null?'?':get(source,'available')),node('span','stock-quantity-label',stock.caption));return box;}
  function financialMetric(sourceRows,key,label,extraClass){
   const distinct=new Map();for(const row of sourceRows){const value=get(row,key).trim();if(value!=='')distinct.set(numeric(value)??value,value);}
   const values=[...distinct.values()],known=values.length===1,amounts=node('dl','product-metrics product-financial-metrics '+extraClass),pair=node('div',''),caption=node('dt','');caption.append(node('span','',label));
   if(known&&data.currency)caption.append(node('span','product-currency source-value',data.currency));pair.append(caption,node('dd',known?'source-value':'product-missing',known?money(values[0])+' $':values.length?'Plusieurs valeurs':'Non renseigné'));amounts.append(pair);return amounts;
  }
  for(const [groupKey,rows] of [...groups.entries()].slice(0,visibleLimit)){
   const source=rows[0],card=node('article','product-card'),states=rows.map(stockState),positive=states.some(s=>s.state==='available');
   const uncertain=states.some(s=>s.state==='unverified')||data.countryMode&&data.countrySelection.some(country=>!rows.some(row=>row.country===country));
   card.dataset.stock=positive?'available':uncertain?'unverified':'empty';
   const heading=node('div','product-card-heading');heading.append(node('h3','product-sku source-value',get(source,'sku')||get(source,'item')||'Article D365'),node('span','product-stock-badge'+(positive?' product-stock-positive':''),positive?'En stock':uncertain?'À vérifier':'Indisponible'));card.append(heading);
   card.append(node('p','product-meta source-value',[get(source,'brand'),get(source,'item')?'D365 '+get(source,'item'):'Numéro D365 non renseigné'].filter(Boolean).join(' · ')));
   if(get(source,'description'))card.append(node('p','product-description source-value',get(source,'description')));
   card.append(financialMetric(rows,'price','Prix de vente','product-selling-price'));
   // Reuse the New/D365 card structure. A country occupies the warehouse position;
   // multiple source lines stay separate, and an absent country never becomes zero.
   const stocks=node('div','product-warehouses'),places=new Map();
   if(data.countryMode)for(const country of data.countrySelection)places.set(country,rows.filter(row=>row.country===country));
   else for(const row of rows){const place=get(row,'warehouse').trim()||ToolboxUsedRegions.label(region());if(!places.has(place))places.set(place,[]);places.get(place).push(row);}
   for(const [place,placeRows]of places){
    const block=node('section','product-warehouse'),placeHeading=node('div','product-warehouse-heading');placeHeading.append(node('h4','source-value',place==='CANADA'?'Canada':place));
    if(data.countryMode)block.title='Export Excel · '+exactDate(countryMeta.exports[place].at);
    if(placeRows.length===1)placeHeading.append(stockQuantity(placeRows[0]));block.append(placeHeading);
    if(!placeRows.length)block.append(node('p','product-no-stock','Non renseigné dans cet export'));
    placeRows.forEach((row,i)=>{
     const line=node('div','product-warehouse-line');
     if(placeRows.length>1){const lineHeading=node('div','product-location-heading');lineHeading.append(node('p','product-location','Ligne source '+(i+1)),stockQuantity(row));line.append(lineHeading);}
     const metrics=node('dl','product-metrics product-warehouse-metrics');
     for(const [key,label]of [['owned','Possédé'],['sellable','Max.']])if(get(row,key)!==''){const pair=node('div','');pair.append(node('dt','',label),node('dd','source-value',get(row,key)));metrics.append(pair);}if(metrics.children.length)line.append(metrics);
     line.append(financialMetric([row],'nbv','NBV','product-nbv-metrics'));block.append(line);
    });stocks.append(block);
   }card.append(stocks);
   const details=node('details','product-details');details.open=opened.has(groupKey);details.addEventListener('toggle',()=>{if(details.isConnected){if(details.open)opened.add(groupKey);else opened.delete(groupKey);}});details.append(node('summary','','Toutes les informations · '+rows.length+' ligne(s)'));
   const values=node('div','product-source-lines');rows.forEach((row,i)=>{
    const section=node('section','product-source-line');section.append(node('h4','source-value',row.country||get(row,'warehouse')||'Ligne source '+(i+1)));
    if(row.qtyAt)section.append(node('p','quantity-provenance','Quantités récupérées · '+time(row.qtyAt)+' · '+(row.qtySource||'')));
    if(row.financialAt||data.sourceDate)section.append(node('p','quantity-provenance','Prix et NBV · '+(row.financialAt?time(row.financialAt):'Excel du '+dateOnly(data.sourceDate))));
    const fields=node('dl','product-all-values');data.headers.forEach((label,j)=>{const value=String(row.values[j]??''),pair=node('div','');pair.append(node('dt','',label),node('dd',value===''?'product-missing':'source-value',value===''?'Non renseigné':value));fields.append(pair);});section.append(fields);if(row.href)section.append(link('Ouvrir le lien SKU ↗',row.href,'record-source-link'));values.append(section);
   });details.append(values);card.append(details);root.append(card);
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
 document.addEventListener('toolbox-before-session-change',event=>{clearTimeout(filterSaveTimer);event.detail.push(chrome.storage.local.set({toolboxUsedFilters:filterUI.serialize()}));});
 el('used-query').oninput=()=>changeFilters(true,true);el('used-available').onchange=()=>changeFilters();el('used-more').onclick=()=>{visibleLimit+=80;render();};el('used-stop').onclick=()=>{batchCancelled=true;return action('usedPowerBIStop');};el('used-clear').onclick=async()=>{const result=await action('usedCatalogueReset');if(result){filterUI.state.subregion='ALL';shownRegion='ALL';changeFilters();}};
 el('used-import').onclick=()=>el('used-file').click();
 el('used-file').onchange=async()=>{
  const file=el('used-file').files?.[0];if(!file)return;const mode=el('used-import-mode').value;importing=true;status={state:'loading',operation:mode==='prices'?'prices':'quantities',phase:'starting',region:mode==='prices'?'ALL':region()};render();
  try{const parsed=await ToolboxUsedExcel.read(file);await action('usedCatalogueImport',{data:parsed,mode});}
  catch(e){status={state:'error',operation:mode==='prices'?'prices':'quantities',message:e.message};}
  finally{importing=false;el('used-file').value='';render();}
 };
 chrome.storage.onChanged.addListener((c,area)=>{if(area!=='local')return;let changed=!!c.toolboxLanguage;if(c.toolboxUsedCountryCatalogue){countryMeta=c.toolboxUsedCountryCatalogue.newValue||null;countryMemo=null;changed=true;}if(c.toolboxUsedPowerBI){catalogue=c.toolboxUsedPowerBI.newValue;changed=true;}if(c.toolboxUsedRegionQuantities){regionSnapshots=c.toolboxUsedRegionQuantities.newValue||{};memoSnapshot=null;changed=true;}if(c.toolboxUsedRegionPrices){regionPrices=c.toolboxUsedRegionPrices.newValue||{};memoFinancial=null;changed=true;}if(c.toolboxUsedPowerBIStatus){status=c.toolboxUsedPowerBIStatus.newValue||{};changed=true;}if(c.toolboxUsedFilters){filtersTouched=true;const saved=ToolboxUsedFilterModel.serialize(ToolboxUsedFilterModel.state(c.toolboxUsedFilters.newValue));if(JSON.stringify(saved)!==JSON.stringify(filterUI.serialize())){clearTimeout(filterSaveTimer);filterUI.restore(saved);shownRegion=region();memoBase=null;memoSnapshot=null;visibleLimit=80;changed=true;}}if(c.toolboxUsedPowerBIDiagnostic)diagnostics('used-diagnostic-output',c.toolboxUsedPowerBIDiagnostic.newValue);if(changed)render();});
 chrome.storage.local.get(['toolboxUsedPowerBI','toolboxUsedPowerBIStatus','toolboxUsedFilters','toolboxUsedRegionQuantities','toolboxUsedRegionPrices','toolboxUsedForeground','toolboxUsedCountryCatalogue']).then(async s=>{countryMeta=s.toolboxUsedCountryCatalogue||null;el('used-foreground').checked=s.toolboxUsedForeground===true;catalogue=s.toolboxUsedPowerBI;regionSnapshots=s.toolboxUsedRegionQuantities||{};regionPrices=s.toolboxUsedRegionPrices||{};status=s.toolboxUsedPowerBIStatus||{};if(!filtersTouched)filterUI.restore(s.toolboxUsedFilters);shownRegion=region();render();await action('usedPowerBIInit');});
})();
