const USED_POWERBI_REPORT_URL='https://app.powerbi.com/groups/ff3be965-02e9-4c0f-b9eb-b73e3bb4e51f/reports/458f40a9-2b3f-4518-a3cb-d699fef65baa/ReportSection7cb28c98171347d49c0a?ctid=c2f120b6-e8fc-402c-9972-fa891cb53927&experience=power-bi';
let usedPowerBIBusy=false,usedPowerBIStop=false;
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
  await chrome.storage.local.set({toolboxUsedPowerBI:data});return data;
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
async function readUsedPowerBI(kind,payload={}){
 if(kind==='usedPowerBIInit'){
  const data=await ensureUsedCatalogue(),saved=await chrome.storage.local.get('toolboxUsedPowerBIStatus');
  if(!usedPowerBIBusy&&saved.toolboxUsedPowerBIStatus?.state==='loading')await chrome.storage.local.set({toolboxUsedPowerBIStatus:{state:'error',message:'Lecture interrompue. Les données précédentes sont conservées; tu peux relancer les quantités.'}});
  return {count:data.rows.length};
 }
 if(payload.region!==undefined&&ToolboxUsedRegions.parse(payload.region)===null)throw Error('Sous-région invalide.');
 const prices=kind==='usedPowerBIReadPrices'||kind==='usedCatalogueImport'&&payload.mode==='prices',operation=prices?'prices':'quantities';
 const region=ToolboxUsedRegions.normalize(payload.region),reading=['usedPowerBIRead','usedPowerBIReadForce','usedPowerBIReadPrices'].includes(kind);
 const progress=(phase,message,extra={})=>chrome.storage.local.set({toolboxUsedPowerBIStatus:{state:'loading',phase,message,region,operation,...extra}});
 if(usedPowerBIBusy)throw Error('Une lecture Power BI est déjà en cours.');usedPowerBIBusy=true;usedPowerBIStop=false;
 let tab,stage='Vérification des autorisations',diagnostics=[],frameWarning='',frameBridge=null,remoteRegion=null,scanTarget=null,frameRegistration;
 try{
  if(['usedPowerBIRead','usedPowerBIReadForce','usedPowerBIReadPrices','usedCatalogueImport','usedCatalogueReset'].includes(kind)){
   stage='Chargement du catalogue enregistré';if(reading)await progress('catalogue','Chargement du catalogue enregistré…');
   const base=await ensureUsedCatalogue();
   if(kind==='usedCatalogueReset'){
    const data=await initialUsedCatalogue();await chrome.storage.local.set({toolboxUsedPowerBI:data,toolboxUsedRegionQuantities:{},toolboxUsedRegionPrices:{},toolboxUsedPowerBIStatus:{state:'done',message:'Catalogue Excel initial rétabli.'}});return {count:data.rows.length};
   }
   if(kind==='usedCatalogueImport'){
    stage='Import Excel';await progress('merging','Mise à jour du catalogue depuis Excel…');
    if(!['quantities','prices','catalogue'].includes(payload.mode))throw Error('Mode d’import invalide.');
    if(region!=='ALL'&&payload.mode==='catalogue')throw Error('Choisis CANADA + UK + USA pour mettre à jour les prix et NBV du catalogue.');
    const importLine=String(payload.data?.filters||'').split(/\r?\n/).find(l=>/SUBREGION/i.test(l))||'',importRegions=ToolboxUsedRegions.names.filter(r=>new RegExp('\\b'+r+'\\b','i').test(importLine));
    if(region==='ALL'&&importRegions.length&&!ToolboxUsedRegions.matches(importRegions,'ALL'))throw Error(prices?'Pour actualiser les prix du catalogue, exporte CANADA + UK + USA.':'Cet Excel ne couvre pas toutes les sous-régions. Choisis la même sélection avant l’import.');
    if(prices&&region!=='ALL'){
     if(!ToolboxUsedRegions.matches(importRegions,region))throw Error('Cet Excel ne confirme pas la sous-région choisie pour les prix.');
     const value={...payload.data,regions:importRegions},snapshot=ToolboxUsedRegions.financialSnapshot(base,value,region,Date.now(),'Excel'),saved=await chrome.storage.local.get('toolboxUsedRegionPrices');
     await chrome.storage.local.set({toolboxUsedRegionPrices:{...(saved.toolboxUsedRegionPrices||{}),[region]:snapshot},toolboxUsedPowerBIStatus:{state:'done',at:snapshot.at,region,operation,count:snapshot.sourceCount,updated:snapshot.stats.updated,message:'Prix et NBV de la sélection actualisés. Les quantités sont conservées.'}});return {count:snapshot.records.length,stats:snapshot.stats};
    }
    if(prices){
     const result=ToolboxUsedCatalogue.updatePrices(base,payload.data,{source:'Excel'}),stats=result.lastFinancialUpdate.stats;
     await chrome.storage.local.set({toolboxUsedPowerBI:result,toolboxUsedPowerBIStatus:{state:'done',at:Date.now(),region,operation,count:payload.data.rows.length,updated:stats.updated,message:'Prix et NBV actualisés. Les quantités sont conservées.'}});return {count:result.rows.length,stats};
    }
    if(region!=='ALL'){
     const line=String(payload.data?.filters||'').split(/\r?\n/).find(l=>/SUBREGION/i.test(l))||'',regions=ToolboxUsedRegions.names.filter(r=>new RegExp('\\b'+r+'\\b','i').test(line));
     const data={...payload.data,regions};if(!ToolboxUsedRegions.matches(regions,region))throw Error('Cet Excel ne confirme pas la sous-région choisie. Exporte cette sous-région ou utilise Actualiser.');
     const snapshot=ToolboxUsedRegions.snapshot(base,data,region),saved=await chrome.storage.local.get('toolboxUsedRegionQuantities');
     await chrome.storage.local.set({toolboxUsedRegionQuantities:{...(saved.toolboxUsedRegionQuantities||{}),[region]:snapshot},toolboxUsedPowerBIStatus:{state:'done',at:Date.now(),region,count:snapshot.sourceCount,message:'Quantités régionales importées. Prix et NBV du catalogue conservés.'}});return {count:snapshot.sourceCount};
    }
    const result={...ToolboxUsedCatalogue.merge(base,payload.data,{source:'Excel',mode:payload.mode}),regionScope:'ALL',regionVerified:ToolboxUsedRegions.matches(importRegions,'ALL')};
    await chrome.storage.local.set({toolboxUsedPowerBI:result,toolboxUsedPowerBIStatus:{state:'done',at:Date.now(),region,count:payload.data.rows.length,message:'Import Excel terminé. Le catalogue est conservé.'}});return {count:result.rows.length,stats:result.lastImportStats};
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
    frames=await chrome.scripting.executeScript({target:scanTarget,func:async(regions,priceMode)=>{try{await globalThis.ToolboxUsedPowerBIReader.waitForTable();return await globalThis.ToolboxUsedPowerBIReader.read({externalRegions:regions,prices:priceMode});}catch(error){return {error:error.message,diagnostic:globalThis.ToolboxUsedPowerBIReader.diagnostic()};}},args:[regions,prices]});
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
   await chrome.storage.local.set({toolboxUsedRegionPrices:{...(saved.toolboxUsedRegionPrices||{}),[region]:snapshot},toolboxUsedPowerBIStatus:{state:'done',at:snapshot.at,region,operation,count:value.rows.length,expected:value.expected??null,updated:snapshot.stats.updated,tabId:tab.id,message:'Prix et NBV de la sélection actualisés. Les quantités sont conservées.'}});return {count:snapshot.records.length,stats:snapshot.stats};
  }
  if(prices){
   const result=ToolboxUsedCatalogue.updatePrices(base,value,{source:'Power BI'}),stats=result.lastFinancialUpdate.stats;
   await chrome.storage.local.set({toolboxUsedPowerBI:result,toolboxUsedPowerBIStatus:{state:'done',at:Date.now(),region,operation,count:value.rows.length,expected:value.expected??null,updated:stats.updated,tabId:tab.id,message:'Prix et NBV actualisés. Les quantités sont conservées.'}});return {count:result.rows.length,stats};
  }
  if(region!=='ALL'){
   const snapshot=ToolboxUsedRegions.snapshot(base,value,region),saved=await chrome.storage.local.get('toolboxUsedRegionQuantities');
   await chrome.storage.local.set({toolboxUsedRegionQuantities:{...(saved.toolboxUsedRegionQuantities||{}),[region]:snapshot},toolboxUsedPowerBIStatus:{state:'done',at:Date.now(),region,count:value.rows.length,expected:value.expected??null,tabId:tab.id,message:'Quantités régionales mises à jour. Prix et NBV du catalogue conservés.'}});return {count:value.rows.length};
  }
  const result={...ToolboxUsedCatalogue.merge(base,value,{source:'Power BI'}),regionScope:'ALL',regionVerified:true,tabId:tab.id,lastPowerBIReadAt:Date.now()};result.lastImport.regions=value.regions;
  await chrome.storage.local.set({toolboxUsedPowerBI:result,toolboxUsedPowerBIStatus:{state:'done',at:Date.now(),region,count:value.rows.length,expected:value.expected??null,tabId:tab.id,message:'Quantités mises à jour. Les prix et NBV du catalogue sont conservés.'}});return {count:result.rows.length,stats:result.lastImportStats};
 }catch(e){
  const raw=String(e.message||e),blocked=/blocked|cannot access|not allowed|denied/i.test(raw);
  const message=stage+' : '+raw+(blocked?' · Le navigateur refuse cette opération. Vérifie l’accès de l’extension à app.powerbi.com; si une politique de ton organisation le bloque, elle devra être autorisée par les TI.':'');
  if(remoteRegion&&scanTarget)try{await chrome.scripting.executeScript({target:scanTarget,func:()=>globalThis.ToolboxUsedPowerBIReader?.cancel()});}catch{}
  const detail={stage,error:raw,diagnostics,frameWarning,tabId:tab?.id,...(frameBridge?{frameBridge}:{})};
  if(kind!=='usedPowerBIOpen')await chrome.storage.local.set({toolboxUsedPowerBIStatus:{state:'error',region,operation,message,tabId:tab?.id},toolboxUsedPowerBIDiagnostic:detail});
  if(kind==='usedPowerBIDiagnostic')return detail;
  throw Error(message);
 }finally{usedPowerBIBusy=false;}
}
chrome.runtime.onMessage.addListener((m,s,reply)=>{if(s.id!==chrome.runtime.id)return;if(m?.kind==='usedPowerBIStop'){usedPowerBIStop=true;reply({value:{stopping:true}});return;}if(!['usedPowerBIInit','usedPowerBIRead','usedPowerBIReadForce','usedPowerBIReadPrices','usedPowerBIOpen','usedPowerBIDiagnostic','usedPowerBIBind','usedCatalogueImport','usedCatalogueReset'].includes(m?.kind))return;readUsedPowerBI(m.kind,m).then(value=>reply({value}),e=>reply({error:e.message}));return true;});
