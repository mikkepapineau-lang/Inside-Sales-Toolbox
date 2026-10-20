const POWERBI_REPORT_URL='https://app.powerbi.com/links/lNdArEWzXE?ctid=c2f120b6-e8fc-402c-9972-fa891cb53927&pbi_source=linkShare&bookmarkGuid=ff596301-8009-4b69-be11-40ae01525ce3';
let powerBIBusy=false;
const isPowerBI=tab=>{try{return new URL(tab.url).origin==='https://app.powerbi.com';}catch{return false;}};
async function powerBITab(){
 const saved=await chrome.storage.session.get(['powerBITab','powerBIResolvedURL']);
 let tab;try{if(saved.powerBITab)tab=await chrome.tabs.get(saved.powerBITab);}catch{}
 if(!isPowerBI(tab))tab=null;
 if(!tab){const tabs=await chrome.tabs.query({url:'https://app.powerbi.com/*'});const matches=tabs.filter(t=>t.url===saved.powerBIResolvedURL||t.url.includes('/links/lNdArEWzXE'));if(matches.length===1)tab=matches[0];}
 if(!tab)tab=await chrome.tabs.create({url:POWERBI_REPORT_URL,active:false});
 await chrome.storage.session.set({powerBITab:tab.id});await ToolboxTabGroup.add(tab);return tab;
}
async function readPowerBI(kind){
 if(powerBIBusy)throw Error('Une lecture Power BI est déjà en cours.');powerBIBusy=true;
 let tab,stage='Vérification des autorisations',diagnostics=[],frameWarning='';
 try{
  if(!await chrome.permissions.contains({origins:['https://app.powerbi.com/*']}))throw Error('Autorise les accès au Toolbox avant de lire Power BI.');
  if(kind==='powerBIBind'){
   stage='Association de l’onglet actif';
   const [active]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
   if(!isPowerBI(active)||/singleSignOn|signin|login/i.test(active.url))throw Error('Affiche le rapport Power BI dans l’onglet actif, puis réessaie.');
   await chrome.storage.session.set({powerBITab:active.id,powerBIResolvedURL:active.url});await chrome.storage.local.set({toolboxPowerBIResolvedURL:active.url});await ToolboxTabGroup.add(active);return {tabId:active.id};
  }
  stage='Ouverture ou récupération de l’onglet';tab=await powerBITab();
  if(kind==='powerBIOpen'){const opened=await chrome.tabs.update(tab.id,{active:true});await chrome.windows.update(opened.windowId,{focused:true});return {tabId:tab.id};}
  if(kind==='powerBIRead')await chrome.storage.local.set({toolboxPowerBIStatus:{state:'loading',tabId:tab.id}});
  stage='Chargement du rapport';
  const deadline=Date.now()+20000;let loaded=false;
  while(Date.now()<deadline){tab=await chrome.tabs.get(tab.id);if(tab.status==='complete'){loaded=true;break;}await new Promise(r=>setTimeout(r,400));}
  if(!loaded)throw Error('Le rapport charge encore. Ouvre Power BI puis réessaie.');
  if(!isPowerBI(tab)||/singleSignOn|signin|login/i.test(tab.url))throw Error('Connecte-toi à Power BI dans l’onglet du rapport, puis clique sur Actualiser.');
  async function inspect(target,label){
   stage='Accès au contenu · '+label;
   await chrome.scripting.executeScript({target,files:['powerbi-reader.js']});
   stage='Lecture du tableau · '+label;
   return chrome.scripting.executeScript({target,func:async diagnostic=>{try{if(diagnostic)return {diagnostic:globalThis.ToolboxPowerBIReader.diagnostic()};await globalThis.ToolboxPowerBIReader.ensureReady();return await globalThis.ToolboxPowerBIReader.read();}catch(e){return {error:e.message,diagnostic:globalThis.ToolboxPowerBIReader.diagnostic()};}},args:[kind==='powerBIDiagnostic']});
  }
  // A sandboxed child frame must not block extraction from the main report page.
  let frames=await inspect({tabId:tab.id},'page principale');
  const topRecognized=frames.some(f=>f.result?.rows?.length||f.result?.diagnostic?.tables?.length);
  if(!topRecognized){
   try{frames=await inspect({tabId:tab.id,allFrames:true},'sous-fenêtres');}
   catch(e){frameWarning=stage+' : '+e.message;}
  }
  diagnostics=frames.map(f=>({frameId:f.frameId,...f.result?.diagnostic}));
  if(kind==='powerBIDiagnostic')return {diagnostics,frameWarning,tabId:tab.id};
  const results=frames.filter(f=>f.result?.rows?.length);
  stage='Identification des résultats';
  if(results.length!==1)throw Error(results.length?'Plusieurs tableaux lisibles détectés. Utilise Diagnostic Power BI.':frames.find(f=>f.result?.diagnostic?.tables?.length)?.result.error||frames.find(f=>f.frameId===0)?.result?.error||(frameWarning?'La page principale est accessible, mais une sous-fenêtre refuse la lecture. Utilise Diagnostic Power BI.':'Tableau non détecté. Ouvre Ready to PIK, puis utilise Diagnostic Power BI.'));
  await chrome.storage.session.set({powerBIResolvedURL:tab.url});
  await chrome.storage.local.set({toolboxPowerBIResolvedURL:tab.url});
  let result={...results[0].result,tabId:tab.id,at:Date.now()};
  stage='Lecture des Internal Notes';
  await chrome.storage.local.set({toolboxPowerBIStatus:{state:'loading',tabId:tab.id,message:'Lecture des Internal Notes dans les commandes D365 ouvertes…'}});
  try{result=(await collectPowerBIOrderNotes(result)).data;}catch{/* Missing notes must not discard a successful report read. */}
  await chrome.storage.local.set({toolboxPowerBI:result,toolboxPowerBIStatus:{state:'done',tabId:tab.id,...(result.warning?{message:result.warning}:{})}});return {count:result.rows.length};
 }catch(e){
  const raw=String(e.message||e),blocked=/blocked|cannot access|not allowed|denied/i.test(raw);
  const message=stage+' : '+raw+(blocked?' · Le navigateur refuse cette opération. Vérifie l’accès de l’extension à app.powerbi.com; si une politique de ton organisation le bloque, elle devra être autorisée par les TI.':'');
  const detail={stage,error:raw,diagnostics,frameWarning,tabId:tab?.id};
  if(kind!=='powerBIOpen')await chrome.storage.local.set({toolboxPowerBIStatus:{state:'error',message,tabId:tab?.id},toolboxPowerBIDiagnostic:detail});
  if(kind==='powerBIDiagnostic')return detail;
  throw Error(message);
 }finally{powerBIBusy=false;}
}
chrome.runtime.onMessage.addListener((m,s,reply)=>{if(s.id!==chrome.runtime.id||!['powerBIRead','powerBIOpen','powerBIDiagnostic','powerBIBind','powerBIOrderNotes'].includes(m?.kind))return;(m.kind==='powerBIOrderNotes'?readPowerBIOrderNotes(m.order):readPowerBI(m.kind)).then(value=>reply({value}),e=>reply({error:e.message}));return true;});
