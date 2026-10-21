const USED_POWERBI_REPORT_URL='https://app.powerbi.com/groups/ff3be965-02e9-4c0f-b9eb-b73e3bb4e51f/reports/458f40a9-2b3f-4518-a3cb-d699fef65baa/ReportSection7cb28c98171347d49c0a?ctid=c2f120b6-e8fc-402c-9972-fa891cb53927&experience=power-bi';
let usedPowerBIBusy=false,usedPowerBIStop=false,usedNativeExportTarget=null;
let usedCatalogueInit=null;
async function initialUsedCatalogue(){
 const response=await fetch(chrome.runtime.getURL('used-catalogue-base.json'));
 if(!response.ok)throw Error('Le catalogue Excel initial ne peut pas être chargé. Recharge l’extension.');
 return ToolboxUsedCatalogue.create(await response.json(),{at:0,source:'Excel initial',batch:'excel-2026-10-15'});
}
async function ensureUsedCatalogue(){
 if(usedCatalogueInit)return usedCatalogueInit;
 usedCatalogueInit=(async()=>{
  const saved=await chrome.storage.local.get('toolboxUsedPowerBI');
  if(saved.toolboxUsedPowerBI?.schemaVersion===1)return saved.toolboxUsedPowerBI;
  let data=await initialUsedCatalogue();
  if(saved.toolboxUsedPowerBI?.rows?.length){
   try{data=ToolboxUsedCatalogue.merge(data,saved.toolboxUsedPowerBI,{at:saved.toolboxUsedPowerBI.at||Date.now(),source:'Power BI'});}catch{}
  }
  await chrome.storage.local.set({toolboxUsedCountryCatalogue:null,toolboxUsedPowerBI:data});return data;
 })();
 try{return await usedCatalogueInit;}finally{usedCatalogueInit=null;}
}
const isUsedPowerBI=tab=>{
 try{
  const url=new URL(tab?.pendingUrl||tab?.url),ids=/^\/reportEmbed\/?$/i.test(url.pathname)?url.searchParams.getAll('reportId'):[url.pathname.match(/\/reports\/([\da-f-]{36})(?:\/|$)/i)?.[1]||''];
  return url.origin==='https://app.powerbi.com'&&ids.length===1&&ids[0].toLowerCase()==='458f40a9-2b3f-4518-a3cb-d699fef65baa';
 }catch{return false;}
};
async function usedPowerBITab(){
 const saved=await chrome.storage.session.get(['usedPowerBITab','usedPowerBIResolvedURL']);
 let tab;try{if(saved.usedPowerBITab)tab=await chrome.tabs.get(saved.usedPowerBITab);}catch{}
 if(!isUsedPowerBI(tab))tab=null;
 if(!tab){
  const matches=(await chrome.tabs.query({url:'https://app.powerbi.com/*'})).filter(isUsedPowerBI);
  tab=matches.find(t=>(t.pendingUrl||t.url)===saved.usedPowerBIResolvedURL)||matches.find(t=>t.active)||matches.sort((a,b)=>(b.lastAccessed||0)-(a.lastAccessed||0)||a.id-b.id)[0];
 }
 if(!tab)tab=await chrome.tabs.create({url:USED_POWERBI_REPORT_URL,active:false});
 await chrome.storage.session.set({usedPowerBITab:tab.id});await ToolboxTabGroup.add(tab);return tab;
}
const usedRegionScriptId='toolbox-used-region-frames-v1',usedRegionDiscoveries=new Map();let usedRegionRegistration=null;
async function ensureUsedRegionFrames(){
 if(!chrome.scripting.registerContentScripts||!chrome.scripting.getRegisteredContentScripts||!chrome.tabs.sendMessage)return {supported:false,registered:false};
 if(usedRegionRegistration)return usedRegionRegistration;
 usedRegionRegistration=(async()=>{
  try{
   if(!await chrome.permissions.contains({origins:['https://app.powerbi.com/*']}))return {supported:true,registered:false,error:'Accès à app.powerbi.com non autorisé.'};
   const spec={id:usedRegionScriptId,matches:['https://app.powerbi.com/*'],js:['used-powerbi-reader.js'],allFrames:true,matchOriginAsFallback:true,runAt:'document_idle',world:'ISOLATED',persistAcrossSessions:true};
   const [existing]=await chrome.scripting.getRegisteredContentScripts({ids:[usedRegionScriptId]});
   if(!existing)await chrome.scripting.registerContentScripts([spec]);
   else if(!existing.allFrames||!existing.matchOriginAsFallback||existing.js?.join('|')!==spec.js.join('|'))await chrome.scripting.updateContentScripts([spec]);
   return {supported:true,registered:true};
  }catch(error){return {supported:true,registered:false,error:String(error.message||error)};}
 })();
 try{return await usedRegionRegistration;}finally{usedRegionRegistration=null;}
}
function usedRegionProbeValid(probe){
 const state=probe?.subregion,count=probe?.subregionSelectors?.candidateGroups;
 return !!state&&typeof state.verified==='boolean'&&Array.isArray(state.selected)&&state.selected.length<=3&&new Set(state.selected).size===state.selected.length&&state.selected.every(name=>['CANADA','UK','USA'].includes(name))&&(!state.verified||state.selected.length>0)&&Number.isInteger(count)&&count>=0&&count<=100;
}
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(sender.id!==chrome.runtime.id||message?.kind!=='usedRegionFrameFound')return;
 const pending=usedRegionDiscoveries.get(message.nonce);
 if(!pending||sender.tab?.id!==pending.tabId||!isUsedPowerBI(sender.tab)||!Number.isInteger(sender.frameId)||sender.frameId<=0||!usedRegionProbeValid(message.probe))return;
 const key=sender.documentId||String(sender.frameId);
 if(pending.frames.size<24||pending.frames.has(key))pending.frames.set(key,{frameId:sender.frameId,...(sender.documentId?{documentId:sender.documentId}:{}),probe:message.probe});
 reply({accepted:true});
});
async function discoverUsedRegionFrames(tabId){
 const nonce=globalThis.crypto?.randomUUID?.()||'used-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),pending={tabId,frames:new Map()};
 usedRegionDiscoveries.set(nonce,pending);
 try{
  try{await chrome.tabs.sendMessage(tabId,{kind:'usedRegionDiscover',nonce});}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));return [...pending.frames.values()];
 }finally{usedRegionDiscoveries.delete(nonce);}
}
function uniqueUsedRegionFrame(frames){
 const candidates=frames.filter(frame=>frame.probe.subregionSelectors.candidateGroups>0);
 if(candidates.length!==1||candidates[0].probe.subregionSelectors.candidateGroups!==1)throw Error(candidates.length?'Plusieurs sélecteurs SUBREGION sont détectés dans les visuels intégrés. Aucun relevé enregistré.':'Aucun bouton SUBREGION lisible dans les visuels intégrés. Utilise Diagnostic inventaire usagé.');
 return candidates[0];
}
async function usedRegionFrameCommand(tabId,frame,kind,region){
 const tab=await chrome.tabs.get(tabId);if(!isUsedPowerBI(tab))throw Error('L’onglet Usagé a changé pendant la lecture.');
 const target=frame.documentId?{documentId:frame.documentId}:{frameId:frame.frameId};
 let answer;try{answer=await chrome.tabs.sendMessage(tabId,{kind,...(region?{region}:{})},target);}catch{throw Error('Le visuel SUBREGION a été fermé ou rechargé. Relance Actualiser.');}
 if(answer?.error)throw Error(answer.error);
 if(!usedRegionProbeValid(answer?.probe))throw Error('Le visuel SUBREGION ne confirme pas son état.');
 if(answer.probe.subregionSelectors.candidateGroups!==1||!answer.probe.subregion.verified||!ToolboxUsedRegions.matches(answer.probe.subregion.selected,region))throw Error(answer.probe.subregion.reason||'La sélection SUBREGION a changé pendant la lecture.');
 return answer.probe;
}
if(chrome.scripting.registerContentScripts)ensureUsedRegionFrames().catch(()=>{});
chrome.permissions.onAdded?.addListener(()=>ensureUsedRegionFrames().catch(()=>{}));
async function consumeUsedExport(payload,{remove=true,batchId}={}){
 const id=payload.exportId;
 if(typeof id!=='string'||!/^[-a-zA-Z0-9]{1,100}$/.test(id))throw Error('Reçu d’export invalide.');
 const key='usedExportReceipt:'+id,receipt=(await chrome.storage.session.get(key))[key];
 if(!receipt||receipt.id!==id||receipt.sha256!==payload.sha256||receipt.region!==ToolboxUsedRegions.normalize(payload.region)||Date.now()-receipt.at>(receipt.batchId?600000:120000)||Date.now()<receipt.at)throw Error('L’export n’est plus confirmé. Relance Actualiser par Excel.');
 if(batchId&&receipt.batchId!==batchId)throw Error('Le fichier ne correspond pas à cette actualisation.');
 const data=payload.data;if(!data?.rows?.length)throw Error('Le fichier exporté ne contient aucun article.');
 if(receipt.currency&&data.currency&&receipt.currency!==data.currency)throw Error('La devise du fichier diffère de celle du rapport. Aucun import.');
 const line=String(data.filters||'').split(/\r?\n/).find(line=>/SUBREGION/i.test(line))||'',regions=ToolboxUsedRegions.names.filter(name=>new RegExp('\\b'+name+'\\b','i').test(line));
 if(regions.length&&!ToolboxUsedRegions.matches(regions,receipt.region))throw Error('Les pays du fichier diffèrent de la sélection exportée. Aucun import.');
 if(remove)await chrome.storage.session.remove(key);
 return {...payload,mode:'selection',nativeExportMode:receipt.exportMode,exportAt:receipt.at,data:{...data,currency:data.currency||receipt.currency,regions:receipt.regions}};
}
async function exportUsedFile(tab,target,region,remoteRegion,batchId){
 if(batchId){const batch=await usedCountryBatch(batchId);if(ToolboxUsedRegions.names[batch.receipts.length]!==region)throw Error('L’ordre des exports a changé.');}
 const [before]=await chrome.scripting.executeScript({target,func:()=>globalThis.ToolboxUsedPowerBIReader.exportContext()});
 if(!before?.result)throw Error('Le contexte du rapport ne peut pas être confirmé.');
 usedNativeExportTarget=target;
 try{
  await chrome.scripting.executeScript({target,world:'MAIN',files:['used-export-ui.js']});
  const [result]=await chrome.scripting.executeScript({target,world:'MAIN',func:async()=>globalThis.ToolboxUsedExportUI.run()});
  if(result?.result?.error){const error=Error(result.result.error);error.nativeExport=result.result.diagnostic||{error:result.result.error};throw error;}
  const file=result?.result;
  if(usedPowerBIStop)throw Error('Export Excel arrêté.');
  if(!file||typeof file.base64!=='string'||file.base64.length>35000000||!Number.isInteger(file.size)||file.size<4||file.size>25*1024*1024||!/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64))throw Error('Fichier Excel généré invalide ou trop volumineux.');
  const bytes=Uint8Array.from(atob(file.base64),c=>c.charCodeAt(0));if(bytes.length!==file.size||bytes[0]!==80||bytes[1]!==75)throw Error('Le fichier reçu n’est pas une archive XLSX.');
  if(!isUsedPowerBI(await chrome.tabs.get(tab.id)))throw Error('Le rapport a changé pendant l’export.');
  const [after]=await chrome.scripting.executeScript({target,func:()=>({context:globalThis.ToolboxUsedPowerBIReader.exportContext(),state:globalThis.ToolboxUsedPowerBIReader.regionState()})});
  if(!after?.result||JSON.stringify(before.result)!==JSON.stringify(after.result.context))throw Error('Les filtres ou la devise ont changé pendant l’export. Aucun import.');
  if(remoteRegion)await usedRegionFrameCommand(tab.id,remoteRegion,'usedRegionProbe',region);
  else if(!after.result.state?.verified||!ToolboxUsedRegions.matches(after.result.state.selected,region))throw Error('La sélection des pays a changé pendant l’export.');
  const sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join(''),id=crypto.randomUUID();
  await chrome.storage.session.set({['usedExportReceipt:'+id]:{id,sha256,at:Date.now(),region,regions:ToolboxUsedRegions.selection(region),currency:before.result.currency||'',exportMode:file.exportMode||'layout',...(batchId?{batchId}:{})}});
  if(batchId){const batch=await usedCountryBatch(batchId);if(ToolboxUsedRegions.names[batch.receipts.length]!==region)throw Error('L’ordre des exports a changé.');await chrome.storage.session.set({usedCountryExportBatch:{...batch,receipts:[...batch.receipts,{region,id}]}});}
  return {base64:file.base64,size:file.size,name:'Used-Gear.xlsx',exportId:id,sha256,exportMode:file.exportMode||'layout'};
 }finally{usedNativeExportTarget=null;}
}
async function usedCountryBatch(id){
 const batch=(await chrome.storage.session.get('usedCountryExportBatch')).usedCountryExportBatch;
 if(!batch||batch.id!==id||Date.now()-batch.at>600000)throw Error('L’actualisation des trois pays a expiré. Relance Actualiser par Excel.');return batch;
}
async function beginUsedCountries(){
 if(usedPowerBIBusy)throw Error('Une lecture Power BI est déjà en cours.');
 const old=(await chrome.storage.session.get('usedCountryExportBatch')).usedCountryExportBatch;
 for(const receipt of old?.receipts||[])await chrome.storage.session.remove('usedExportReceipt:'+receipt.id);
 const id=crypto.randomUUID();usedPowerBIStop=false;await chrome.storage.session.set({usedCountryExportBatch:{id,at:Date.now(),receipts:[]}});
 await chrome.storage.local.set({toolboxUsedPowerBIStatus:{state:'loading',operation:'export',region:'ALL',phase:'starting',message:'Préparation des exports Canada, UK et USA…'}});return {batchId:id};
}
async function abortUsedCountries(payload){
 usedPowerBIStop=true;const saved=(await chrome.storage.session.get('usedCountryExportBatch')).usedCountryExportBatch;
 if(saved?.id!==payload.batchId)return {aborted:false};
 for(const receipt of saved.receipts)await chrome.storage.session.remove('usedExportReceipt:'+receipt.id);
 await chrome.storage.session.remove('usedCountryExportBatch');
 await chrome.storage.local.set({toolboxUsedPowerBIStatus:{state:'error',operation:'export',region:'ALL',message:payload.message||'Actualisation Excel arrêtée. Les données précédentes sont conservées.'}});return {aborted:true};
}
async function importUsedCountries(payload){
 if(usedPowerBIBusy)throw Error('Une lecture Power BI est déjà en cours.');usedPowerBIBusy=true;
 try{
  const batch=await usedCountryBatch(payload.batchId),names=ToolboxUsedRegions.names;
  if(batch.receipts.length!==3||!Array.isArray(payload.exports)||payload.exports.length!==3)throw Error('Les trois fichiers Excel sont requis avant l’import.');
  const inputs=[];
  for(let i=0;i<3;i++){
   const file=payload.exports[i],receipt=batch.receipts[i];
   if(file.region!==names[i]||receipt.region!==names[i]||file.exportId!==receipt.id)throw Error('Les fichiers des pays ne correspondent pas à cette actualisation.');
   const checked=await consumeUsedExport(file,{remove:false,batchId:batch.id});inputs.push({region:file.region,data:checked.data,at:checked.exportAt,exportMode:checked.nativeExportMode});
  }
  const filters=inputs.map(input=>String(input.data.filters||'').split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!/SUBREGION/i.test(line)&&!/^(CANADA|UK|USA)$/i.test(line)).sort().join('\n'));
  if(new Set(filters).size!==1)throw Error('Les autres filtres Power BI diffèrent entre les pays. Aucun des trois exports n’est importé.');
  const base=await ensureUsedCatalogue(),result=ToolboxUsedRegions.countryCatalogue(base,inputs),count=inputs.reduce((n,x)=>n+x.data.rows.length,0);
  if(usedPowerBIStop)throw Error('Actualisation Excel arrêtée.');
  await chrome.storage.local.set({toolboxUsedPowerBI:result.catalogue,toolboxUsedRegionQuantities:result.quantities,toolboxUsedRegionPrices:result.prices,toolboxUsedCountryCatalogue:result.meta,toolboxUsedPowerBIStatus:{state:'done',at:result.meta.at,region:'ALL',operation:'export',count,message:'Trois exports Excel importés : quantités, prix et NBV classés par pays.'}});
  for(const receipt of batch.receipts)await chrome.storage.session.remove('usedExportReceipt:'+receipt.id);await chrome.storage.session.remove('usedCountryExportBatch');return {count,countries:3};
 }finally{usedPowerBIBusy=false;}
}
async function readUsedPowerBI(kind,payload={}){
 if(kind==='usedPowerBIBeginCountries')return beginUsedCountries();
 if(kind==='usedPowerBIAbortCountries')return abortUsedCountries(payload);
 if(kind==='usedPowerBIImportCountries')return importUsedCountries(payload);
 if(kind==='usedPowerBIExportFile'){if(payload.batchId){const batch=await usedCountryBatch(payload.batchId);if(payload.region!==ToolboxUsedRegions.names[batch.receipts.length])throw Error('Le pays demandé ne correspond pas au prochain export.');payload={...payload,batchIndex:batch.receipts.length+1};}else payload={...payload,region:'ALL'};}
 const nativeImport=kind==='usedPowerBIImportExport';
 if(nativeImport){payload=await consumeUsedExport(payload);kind='usedCatalogueImport';}
 if(kind==='usedPowerBIInit'){
  const data=await ensureUsedCatalogue(),saved=await chrome.storage.local.get('toolboxUsedPowerBIStatus');
  if(!usedPowerBIBusy&&saved.toolboxUsedPowerBIStatus?.state==='loading')await chrome.storage.local.set({toolboxUsedPowerBIStatus:{state:'error',message:'Lecture interrompue. Les données précédentes sont conservées; tu peux relancer les quantités.'}});
  return {count:data.rows.length};
 }
 if(payload.region!==undefined&&ToolboxUsedRegions.parse(payload.region)===null)throw Error('Sous-région invalide.');
 const prices=kind==='usedPowerBIReadPrices'||kind==='usedCatalogueImport'&&payload.mode==='prices',operation=nativeImport||kind==='usedPowerBIExportFile'?'export':prices?'prices':'quantities';
 const region=ToolboxUsedRegions.normalize(payload.region),reading=['usedPowerBIRead','usedPowerBIReadForce','usedPowerBIReadPrices','usedPowerBIExportFile'].includes(kind);
 const progress=(phase,message,extra={})=>chrome.storage.local.set({toolboxUsedPowerBIStatus:{state:'loading',phase,message,region,operation,...(payload.batchId?{batchIndex:payload.batchIndex,country:region}:{}),...extra}});
 if(usedPowerBIBusy)throw Error('Une lecture Power BI est déjà en cours.');usedPowerBIBusy=true;usedPowerBIStop=false;
 let tab,stage='Vérification des autorisations',diagnostics=[],frameWarning='',frameBridge=null,remoteRegion=null,scanTarget=null,frameRegistration;
 try{
  if(['usedPowerBIRead','usedPowerBIReadForce','usedPowerBIReadPrices','usedPowerBIExportFile','usedCatalogueImport','usedCatalogueReset'].includes(kind)){
   stage='Chargement du catalogue enregistré';if(reading)await progress('catalogue','Chargement du catalogue enregistré…');
   const base=await ensureUsedCatalogue();
   if(kind==='usedCatalogueReset'){
    const data=await initialUsedCatalogue();await chrome.storage.local.set({toolboxUsedPowerBI:data,toolboxUsedRegionQuantities:{},toolboxUsedRegionPrices:{},toolboxUsedCountryCatalogue:null,toolboxUsedPowerBIStatus:{state:'done',message:'Catalogue Excel initial rétabli.'}});return {count:data.rows.length};
   }
   if(kind==='usedCatalogueImport'){
    stage='Import Excel';await progress('merging','Mise à jour du catalogue depuis Excel…');
    if(!['quantities','prices','catalogue',...(nativeImport?['selection']:[])].includes(payload.mode))throw Error('Mode d’import invalide.');
    if(region!=='ALL'&&payload.mode==='catalogue')throw Error('Choisis CANADA + UK + USA pour mettre à jour les prix et NBV du catalogue.');
    const importLine=String(payload.data?.filters||'').split(/\r?\n/).find(l=>/SUBREGION/i.test(l))||'',importRegions=ToolboxUsedRegions.names.filter(r=>new RegExp('\\b'+r+'\\b','i').test(importLine));
    if(region==='ALL'&&importRegions.length&&!ToolboxUsedRegions.matches(importRegions,'ALL'))throw Error(prices?'Pour actualiser les prix du catalogue, exporte CANADA + UK + USA.':'Cet Excel ne couvre pas toutes les sous-régions. Choisis la même sélection avant l’import.');
    if(nativeImport){
     if(!ToolboxUsedRegions.matches(payload.data.regions,region))throw Error('Le périmètre de l’export ne correspond pas à la sélection.');
     let count,updated;
     if(region!=='ALL'){
      const quantities=ToolboxUsedRegions.snapshot(base,payload.data,region),financial=ToolboxUsedRegions.financialSnapshot(base,payload.data,region,quantities.at,'Excel Power BI');
      const saved=await chrome.storage.local.get(['toolboxUsedRegionQuantities','toolboxUsedRegionPrices']);count=quantities.sourceCount;updated=financial.stats.updated;
      await chrome.storage.local.set({toolboxUsedCountryCatalogue:null,toolboxUsedRegionQuantities:{...(saved.toolboxUsedRegionQuantities||{}),[region]:quantities},toolboxUsedRegionPrices:{...(saved.toolboxUsedRegionPrices||{}),[region]:financial},toolboxUsedPowerBIStatus:{state:'done',at:quantities.at,region,operation:'export',count,updated,message:'Export Excel importé : quantités, prix et NBV actualisés.'}});
     }else{
      const merged=ToolboxUsedCatalogue.merge(base,payload.data,{source:'Excel Power BI',mode:'catalogue'}),data={...ToolboxUsedCatalogue.updatePrices(merged,payload.data,{source:'Excel Power BI'}),regionScope:'ALL',regionVerified:true};
      data.lastImport.regions=payload.data.regions;count=payload.data.rows.length;updated=data.lastFinancialUpdate.stats.updated;
      await chrome.storage.local.set({toolboxUsedCountryCatalogue:null,toolboxUsedPowerBI:data,toolboxUsedRegionQuantities:{},toolboxUsedRegionPrices:{},toolboxUsedPowerBIStatus:{state:'done',at:Date.now(),region,operation:'export',count,updated,exportMode:payload.nativeExportMode,message:'Catalogue Canada + USA + UK importé : quantités, prix et NBV actualisés.'+(payload.nativeExportMode==='summarized'?' Format : données résumées.':'')}});
     }
     return {count,updated};
    }
    if(prices&&region!=='ALL'){
     if(!ToolboxUsedRegions.matches(importRegions,region))throw Error('Cet Excel ne confirme pas la sous-région choisie pour les prix.');
     const value={...payload.data,regions:importRegions},snapshot=ToolboxUsedRegions.financialSnapshot(base,value,region,Date.now(),'Excel'),saved=await chrome.storage.local.get('toolboxUsedRegionPrices');
     await chrome.storage.local.set({toolboxUsedCountryCatalogue:null,toolboxUsedRegionPrices:{...(saved.toolboxUsedRegionPrices||{}),[region]:snapshot},toolboxUsedPowerBIStatus:{state:'done',at:snapshot.at,region,operation,count:snapshot.sourceCount,updated:snapshot.stats.updated,message:'Prix et NBV de la sélection actualisés. Les quantités sont conservées.'}});return {count:snapshot.records.length,stats:snapshot.stats};
    }
    if(prices){
     const result=ToolboxUsedCatalogue.updatePrices(base,payload.data,{source:'Excel'}),stats=result.lastFinancialUpdate.stats;
     await chrome.storage.local.set({toolboxUsedCountryCatalogue:null,toolboxUsedPowerBI:result,toolboxUsedPowerBIStatus:{state:'done',at:Date.now(),region,operation,count:payload.data.rows.length,updated:stats.updated,message:'Prix et NBV actualisés. Les quantités sont conservées.'}});return {count:result.rows.length,stats};
    }
    if(region!=='ALL'){
     const line=String(payload.data?.filters||'').split(/\r?\n/).find(l=>/SUBREGION/i.test(l))||'',regions=ToolboxUsedRegions.names.filter(r=>new RegExp('\\b'+r+'\\b','i').test(line));
     const data={...payload.data,regions};if(!ToolboxUsedRegions.matches(regions,region))throw Error('Cet Excel ne confirme pas la sous-région choisie. Exporte cette sous-région ou utilise Actualiser.');
     const snapshot=ToolboxUsedRegions.snapshot(base,data,region),saved=await chrome.storage.local.get('toolboxUsedRegionQuantities');
     await chrome.storage.local.set({toolboxUsedCountryCatalogue:null,toolboxUsedRegionQuantities:{...(saved.toolboxUsedRegionQuantities||{}),[region]:snapshot},toolboxUsedPowerBIStatus:{state:'done',at:Date.now(),region,count:snapshot.sourceCount,message:'Quantités régionales importées. Prix et NBV du catalogue conservés.'}});return {count:snapshot.sourceCount};
    }
    const result={...ToolboxUsedCatalogue.merge(base,payload.data,{source:'Excel',mode:payload.mode}),regionScope:'ALL',regionVerified:ToolboxUsedRegions.matches(importRegions,'ALL')};
    await chrome.storage.local.set({toolboxUsedCountryCatalogue:null,toolboxUsedPowerBI:result,toolboxUsedPowerBIStatus:{state:'done',at:Date.now(),region,count:payload.data.rows.length,message:'Import Excel terminé. Le catalogue est conservé.'}});return {count:result.rows.length,stats:result.lastImportStats};
   }
   if(kind==='usedPowerBIRead'&&region!=='ALL'){
    const saved=await chrome.storage.local.get('toolboxUsedRegionQuantities'),snapshot=saved.toolboxUsedRegionQuantities?.[region];
    if(ToolboxUsedRegions.valid(base,snapshot,region)&&snapshot.dailyDate===ToolboxUsedCatalogue.day(Date.now())&&(snapshot.complete||snapshot.loadedToEnd)){
     await chrome.storage.local.set({toolboxUsedPowerBIStatus:{state:'cached',at:Date.now(),region,count:snapshot.sourceCount,message:'Quantités de cette sous-région déjà récupérées aujourd’hui.'}});return {count:snapshot.sourceCount,cached:true};
    }
   }
   if(kind==='usedPowerBIRead'&&region==='ALL'&&ToolboxUsedRegions.allKnown(base)&&base.dailyDate===ToolboxUsedCatalogue.day(Date.now())&&(!base.lastImport?base.complete:base.lastImport.complete||base.lastImport.loadedToEnd)){
    await chrome.storage.local.set({toolboxUsedPowerBIStatus:{state:'cached',at:Date.now(),region,count:base.rows.length,message:'Quantités déjà récupérées aujourd’hui. Importe un nouvel Excel ou utilise Forcer la lecture Power BI dans les options.'}});return {count:base.rows.length,cached:true};
   }
  }
  if(!await chrome.permissions.contains({origins:['https://app.powerbi.com/*']}))throw Error('Autorise les accès au Toolbox avant de lire Power BI.');
  frameRegistration=await ensureUsedRegionFrames();
  if(kind==='usedPowerBIBind'){
   stage='Association de l’onglet actif';
   const [active]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
   if(!isUsedPowerBI(active)||/singleSignOn|signin|login/i.test(active.url))throw Error('Affiche le rapport Used Gear dans l’onglet actif, puis réessaie.');
   await chrome.storage.session.set({usedPowerBITab:active.id,usedPowerBIResolvedURL:active.pendingUrl||active.url});await ToolboxTabGroup.add(active);return {tabId:active.id};
  }
  stage='Ouverture ou récupération de l’onglet';if(reading)await progress('opening','Ouverture du rapport Power BI…');tab=await usedPowerBITab();
  if(kind==='usedPowerBIOpen'){const opened=await chrome.tabs.update(tab.id,{active:true});await chrome.windows.update(opened.windowId,{focused:true});return {tabId:tab.id};}
  if(reading)await progress('page','Chargement du rapport Power BI…',{tabId:tab.id});
  stage='Chargement du rapport';
  const deadline=Date.now()+20000;let loaded=false;
  while(Date.now()<deadline){tab=await chrome.tabs.get(tab.id);if(tab.status==='complete'){loaded=true;break;}await new Promise(r=>setTimeout(r,400));}
  if(!loaded)throw Error('Le rapport charge encore. Ouvre Power BI puis réessaie.');
  if(!isUsedPowerBI(tab)||/singleSignOn|signin|login/i.test(tab.url))throw Error('Connecte-toi à Power BI dans l’onglet du rapport, puis clique sur Actualiser.');
  if(reading&&payload.foreground===true){
   stage='Affichage du rapport';
   const visibleTab=await chrome.tabs.update(tab.id,{active:true});
   if(Number.isInteger(visibleTab.windowId)){
    const windowInfo=chrome.windows.get?await chrome.windows.get(visibleTab.windowId):null;
    await chrome.windows.update(visibleTab.windowId,{focused:true,...(windowInfo?.state==='minimized'?{state:'normal'}:{})});
   }
  }
  async function inspect(target,label){
   stage='Accès au contenu · '+label;
   await chrome.scripting.executeScript({target,files:['powerbi-reader.js','used-powerbi-reader.js']});
   stage='Lecture du tableau · '+label;
   if(kind==='usedPowerBIDiagnostic')return chrome.scripting.executeScript({target,func:()=>({diagnostic:globalThis.ToolboxUsedPowerBIReader.diagnostic()})});
   stage='Sélection de la sous-région · '+label;
   await progress('region','Sélection de la sous-région dans Power BI…',{tabId:tab.id});
   const prepared=await chrome.scripting.executeScript({target,func:async region=>{try{await globalThis.ToolboxUsedPowerBIReader.ensureReady();const regions=await globalThis.ToolboxUsedPowerBIReader.ensureRegion(region);return {regionReady:true,regions};}catch(e){return {error:e.message,diagnostic:globalThis.ToolboxUsedPowerBIReader.diagnostic()};}},args:[region]});
   if(!prepared.some(f=>f.result?.regionReady&&ToolboxUsedRegions.matches(f.result.regions,region)))return prepared;
   if(kind==='usedPowerBIExportFile')return chrome.scripting.executeScript({target,func:regions=>({exportReady:true,regions,diagnostic:globalThis.ToolboxUsedPowerBIReader.diagnostic()}),args:[ToolboxUsedRegions.selection(region)]});
   stage='Lecture du tableau · '+label;
   await progress('reading','Lecture des lignes Power BI…',{tabId:tab.id,count:0});
   return chrome.scripting.executeScript({target,func:async priceMode=>{try{return await globalThis.ToolboxUsedPowerBIReader.read({prices:priceMode});}catch(e){return {error:e.message,diagnostic:globalThis.ToolboxUsedPowerBIReader.diagnostic()};}},args:[prices]});
  }
  // A sandboxed child frame must not block extraction from the main report page.
  let frames=await inspect({tabId:tab.id},'page principale');
  diagnostics=frames.map(frame=>({frameId:frame.frameId,...frame.result?.diagnostic}));
  const bridgeFailure=()=>frames.find(frame=>frame.result?.diagnostic?.tables?.length&&frame.result.diagnostic.subregion?.verified===false&&frame.result.diagnostic.subregionSelectors?.candidateGroups===0&&frame.result.diagnostic.embeddedFrames?.some(child=>child.documentAccessible===false));
  if(kind!=='usedPowerBIDiagnostic'&&bridgeFailure()){
   frameBridge={registration:frameRegistration,frames:[]};
   if(!frameRegistration.registered)throw Error('Accès direct aux visuels intégrés indisponible. '+(frameRegistration.error||'Ce navigateur ne prend pas en charge leur enregistrement.'));
   stage='Connexion au visuel SUBREGION';await progress('region','Connexion aux boutons SUBREGION du rapport…',{tabId:tab.id});
   let agents=await discoverUsedRegionFrames(tab.id);
   if(!agents.length){
    // Registration applies to newly loaded documents. Reload this read-only report once.
    stage='Activation des visuels intégrés';await progress('page','Activation des boutons du rapport · rechargement de l’onglet Usagé…',{tabId:tab.id});
    await chrome.tabs.reload(tab.id);await new Promise(resolve=>setTimeout(resolve,300));
    const end=Date.now()+25000;let complete=false;
    do{tab=await chrome.tabs.get(tab.id);if(!isUsedPowerBI(tab))throw Error('Le rapport Usagé a changé pendant son rechargement.');if(tab.status==='complete'){complete=true;break;}await new Promise(resolve=>setTimeout(resolve,300));}while(Date.now()<end);
    if(!complete)throw Error('Le rapport Usagé charge encore après activation des visuels. Réessaie après le chargement.');
    frameBridge.reloaded=true;frames=await inspect({tabId:tab.id},'page principale');diagnostics=frames.map(frame=>({frameId:frame.frameId,...frame.result?.diagnostic}));
    if(bridgeFailure())agents=await discoverUsedRegionFrames(tab.id);
   }
   if(bridgeFailure()){
    frameBridge.frames=agents;remoteRegion=uniqueUsedRegionFrame(agents);
    await usedRegionFrameCommand(tab.id,remoteRegion,'usedRegionSelect',region);
    const source=bridgeFailure();scanTarget={tabId:tab.id,...(source.documentId?{documentIds:[source.documentId]}:{frameIds:[source.frameId]})};
    stage='Lecture du tableau lié au visuel SUBREGION';await progress('reading','Sous-région confirmée · chargement du tableau…',{tabId:tab.id,count:0});
    const regions=ToolboxUsedRegions.names.filter(name=>region==='ALL'||region.split('+').includes(name));
    if(kind==='usedPowerBIExportFile')frames=await chrome.scripting.executeScript({target:scanTarget,func:regions=>({exportReady:true,regions,diagnostic:globalThis.ToolboxUsedPowerBIReader.diagnostic()}),args:[regions]});
    else frames=await chrome.scripting.executeScript({target:scanTarget,func:async(regions,priceMode)=>{try{await globalThis.ToolboxUsedPowerBIReader.waitForTable();return await globalThis.ToolboxUsedPowerBIReader.read({externalRegions:regions,prices:priceMode});}catch(error){return {error:error.message,diagnostic:globalThis.ToolboxUsedPowerBIReader.diagnostic()};}},args:[regions,prices]});
    await usedRegionFrameCommand(tab.id,remoteRegion,'usedRegionProbe',region);
   }
  }
  const topRecognized=frames.some(f=>f.result?.more||f.result?.rows?.length||f.result?.diagnostic?.tables?.length);
  const inspectDiagnosticFrames=kind==='usedPowerBIDiagnostic'&&frames.some(f=>f.result?.diagnostic?.subregion?.verified===false&&f.result.diagnostic.embeddedFrames?.length);
  if(!topRecognized||inspectDiagnosticFrames){
   try{frames=await inspect({tabId:tab.id,allFrames:true},'sous-fenêtres');}
   catch(e){frameWarning=stage+' : '+e.message;}
  }
  diagnostics=frames.map(f=>({frameId:f.frameId,...f.result?.diagnostic}));
  if(kind==='usedPowerBIDiagnostic'){
   if(frameRegistration.registered&&frames.some(frame=>frame.result?.diagnostic?.embeddedFrames?.length))frameBridge={registration:frameRegistration,frames:await discoverUsedRegionFrames(tab.id)};
   return {diagnostics,frameWarning,tabId:tab.id,...(frameBridge?{frameBridge}:{})};
  }
  if(kind==='usedPowerBIExportFile'){
   const ready=frames.filter(frame=>frame.result?.exportReady&&ToolboxUsedRegions.matches(frame.result.regions,region));
   if(ready.length!==1)throw Error('Le tableau et sa sous-région ne sont pas confirmés pour l’export Excel.');
   const source=ready[0],target={tabId:tab.id,...(source.documentId?{documentIds:[source.documentId]}:{frameIds:[source.frameId]})};
   stage='Export Excel natif';await progress('export','Export Excel du rapport Power BI…',{tabId:tab.id});
   return await exportUsedFile(tab,target,region,remoteRegion,payload.batchId);
  }
  const results=frames.filter(f=>f.result?.more||f.result?.rows?.length);
  stage='Identification des résultats';
  if(results.length!==1)throw Error(results.length?'Plusieurs tableaux lisibles détectés. Utilise Diagnostic Power BI.':frames.find(f=>f.result?.diagnostic?.tables?.length)?.result.error||frames.find(f=>f.frameId===0)?.result?.error||(frameWarning?'La page principale est accessible, mais une sous-fenêtre refuse la lecture. Utilise Diagnostic Power BI.':'Tableau non détecté. Ouvre LP Catalog - Used Gear, puis utilise Diagnostic Power BI.'));
  let value=results[0].result;
  const target={tabId:tab.id,...(results[0].documentId?{documentIds:[results[0].documentId]}:{frameIds:[results[0].frameId]})};scanTarget=target;
  while(value.more){
   if(remoteRegion)await usedRegionFrameCommand(tab.id,remoteRegion,'usedRegionProbe',region);
   if(usedPowerBIStop){await chrome.scripting.executeScript({target,func:()=>globalThis.ToolboxUsedPowerBIReader.cancel()});throw Error('Chargement arrêté. Le catalogue complet n’a pas été chargé; les données précédentes sont conservées.');}
   stage='Chargement complet du catalogue';
   await chrome.storage.local.set({toolboxUsedPowerBIStatus:{state:'loading',phase:'reading',region,operation,tabId:tab.id,count:value.count,expected:value.expected??null,message:value.count+' lignes récupérées · chargement en cours…'}});
   const [chunk]=await chrome.scripting.executeScript({target,func:async()=>{try{return await globalThis.ToolboxUsedPowerBIReader.next();}catch(e){return {error:e.message};}}});
   if(chunk?.result?.error)throw Error(chunk.result.error);
   if(!chunk?.result)throw Error('Le rapport ne répond plus. Le chargement complet n’est pas confirmé.');
   value=chunk.result;
   if(remoteRegion)await usedRegionFrameCommand(tab.id,remoteRegion,'usedRegionProbe',region);
  }
  if(remoteRegion){
   const agents=await discoverUsedRegionFrames(tab.id);frameBridge.frames=agents;const current=uniqueUsedRegionFrame(agents);
   if(current.frameId!==remoteRegion.frameId||current.documentId!==remoteRegion.documentId)throw Error('Le visuel SUBREGION a changé pendant la lecture.');
   await usedRegionFrameCommand(tab.id,remoteRegion,'usedRegionProbe',region);
  }
  if(usedPowerBIStop)throw Error('Chargement arrêté. Les données précédentes sont conservées.');
  await chrome.storage.session.set({usedPowerBIResolvedURL:tab.url});
  stage=prices?'Mise à jour des prix et NBV':'Mise à jour des quantités';
  if(!ToolboxUsedRegions.matches(value.regions,region))throw Error('La sous-région du relevé n’est pas confirmée. Aucun changement enregistré.');
  await progress('merging',prices?'Enregistrement des prix et NBV…':'Enregistrement des quantités…',{tabId:tab.id,count:value.rows.length,expected:value.expected??null});
  const base=await ensureUsedCatalogue();
  if(prices&&region!=='ALL'){
   const snapshot=ToolboxUsedRegions.financialSnapshot(base,value,region),saved=await chrome.storage.local.get('toolboxUsedRegionPrices');
   await chrome.storage.local.set({toolboxUsedCountryCatalogue:null,toolboxUsedRegionPrices:{...(saved.toolboxUsedRegionPrices||{}),[region]:snapshot},toolboxUsedPowerBIStatus:{state:'done',at:snapshot.at,region,operation,count:value.rows.length,expected:value.expected??null,updated:snapshot.stats.updated,tabId:tab.id,message:'Prix et NBV de la sélection actualisés. Les quantités sont conservées.'}});return {count:snapshot.records.length,stats:snapshot.stats};
  }
  if(prices){
   const result=ToolboxUsedCatalogue.updatePrices(base,value,{source:'Power BI'}),stats=result.lastFinancialUpdate.stats;
   await chrome.storage.local.set({toolboxUsedCountryCatalogue:null,toolboxUsedPowerBI:result,toolboxUsedPowerBIStatus:{state:'done',at:Date.now(),region,operation,count:value.rows.length,expected:value.expected??null,updated:stats.updated,tabId:tab.id,message:'Prix et NBV actualisés. Les quantités sont conservées.'}});return {count:result.rows.length,stats};
  }
  if(region!=='ALL'){
   const snapshot=ToolboxUsedRegions.snapshot(base,value,region),saved=await chrome.storage.local.get('toolboxUsedRegionQuantities');
   await chrome.storage.local.set({toolboxUsedCountryCatalogue:null,toolboxUsedRegionQuantities:{...(saved.toolboxUsedRegionQuantities||{}),[region]:snapshot},toolboxUsedPowerBIStatus:{state:'done',at:Date.now(),region,count:value.rows.length,expected:value.expected??null,tabId:tab.id,message:'Quantités régionales mises à jour. Prix et NBV du catalogue conservés.'}});return {count:value.rows.length};
  }
  const result={...ToolboxUsedCatalogue.merge(base,value,{source:'Power BI'}),regionScope:'ALL',regionVerified:true,tabId:tab.id,lastPowerBIReadAt:Date.now()};result.lastImport.regions=value.regions;
  await chrome.storage.local.set({toolboxUsedCountryCatalogue:null,toolboxUsedPowerBI:result,toolboxUsedPowerBIStatus:{state:'done',at:Date.now(),region,count:value.rows.length,expected:value.expected??null,tabId:tab.id,message:'Quantités mises à jour. Les prix et NBV du catalogue sont conservés.'}});return {count:result.rows.length,stats:result.lastImportStats};
 }catch(e){
  const raw=String(e.message||e),blocked=/blocked|cannot access|not allowed|denied/i.test(raw);
  const message=stage+' : '+raw+(blocked?' · Le navigateur refuse cette opération. Vérifie l’accès de l’extension à app.powerbi.com; si une politique de ton organisation le bloque, elle devra être autorisée par les TI.':'');
  if(remoteRegion&&scanTarget)try{await chrome.scripting.executeScript({target:scanTarget,func:()=>globalThis.ToolboxUsedPowerBIReader?.cancel()});}catch{}
  const detail={stage,error:raw,diagnostics,frameWarning,tabId:tab?.id,...(frameBridge?{frameBridge}:{}),...(e.nativeExport?{nativeExport:e.nativeExport}:{})};
  if(kind!=='usedPowerBIOpen')await chrome.storage.local.set({toolboxUsedPowerBIStatus:{state:'error',region,operation,message,tabId:tab?.id},toolboxUsedPowerBIDiagnostic:detail});
  if(kind==='usedPowerBIDiagnostic')return detail;
  throw Error(message);
 }finally{usedPowerBIBusy=false;}
}
chrome.runtime.onMessage.addListener((m,s,reply)=>{if(s.id!==chrome.runtime.id)return;if(m?.kind==='usedPowerBIStop'){usedPowerBIStop=true;if(usedNativeExportTarget)chrome.scripting.executeScript({target:usedNativeExportTarget,world:'MAIN',func:()=>globalThis.ToolboxUsedExportUI?.cancel()}).catch(()=>{});reply({value:{stopping:true}});return;}if(!['usedPowerBIBeginCountries','usedPowerBIAbortCountries','usedPowerBIImportCountries','usedPowerBIInit','usedPowerBIRead','usedPowerBIReadForce','usedPowerBIReadPrices','usedPowerBIExportFile','usedPowerBIImportExport','usedPowerBIOpen','usedPowerBIDiagnostic','usedPowerBIBind','usedCatalogueImport','usedCatalogueReset'].includes(m?.kind))return;readUsedPowerBI(m.kind,m).then(value=>reply({value}),e=>reply({error:e.message}));return true;});
