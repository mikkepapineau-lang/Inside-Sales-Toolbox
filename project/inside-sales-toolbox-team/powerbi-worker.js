(()=>{
const build=chrome=>{
const ToolboxTabGroup=globalThis.ToolboxTabGroup?.forChrome?.(chrome)||globalThis.ToolboxTabGroup;
const POWERBI_REPORT_URL='https://app.powerbi.com/groups/me/reports/37ddaf7f-5526-4fd7-b85e-bc6630d5ae33/ReportSection16a57238ce9621584668?ctid=c2f120b6-e8fc-402c-9972-fa891cb53927';
let powerBIBusy=false;
const isPowerBI=tab=>{try{return new URL(tab.url).origin==='https://app.powerbi.com';}catch{return false;}};
function readyPowerBIId(value){try{const u=new URL(value);if(u.origin!=='https://app.powerbi.com'||u.username||u.password)return '';const ids=/^\/reportEmbed\/?$/i.test(u.pathname)?u.searchParams.getAll('reportId'):[u.pathname.match(/\/reports\/([\da-f-]{36})(?:\/|$)/i)?.[1]||''];return ids.length===1&&/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(ids[0])?ids[0].toLowerCase():'';}catch{return '';}}
function isReadyPowerBI(tab,known=''){
 try{const value=tab?.pendingUrl||tab?.url,u=new URL(value),id=readyPowerBIId(value),knownId=readyPowerBIId(known);return u.origin==='https://app.powerbi.com'&&!u.username&&!u.password&&!/singleSignOn|signin|login/i.test(u.pathname)&&!['458f40a9-2b3f-4518-a3cb-d699fef65baa','d8c07521-770e-41bd-be72-a23a1dbf41ff'].includes(id)&&(id==='37ddaf7f-5526-4fd7-b85e-bc6630d5ae33'||/^\/links\/lNdArEWzXE\/?$/.test(u.pathname)||!!known&&(value===known||!!id&&id===knownId));}catch{return false;}
}
async function powerBITab(){
 const [saved,local]=await Promise.all([chrome.storage.session.get(['powerBITab','powerBIResolvedURL']),chrome.storage.local.get('toolboxPowerBIResolvedURL')]);
 const known=saved.powerBIResolvedURL||local.toolboxPowerBIResolvedURL||'';
 let tab;try{if(saved.powerBITab)tab=await chrome.tabs.get(saved.powerBITab);}catch{}
 if(!isReadyPowerBI(tab,known))tab=null;
 if(!tab){const tabs=await chrome.tabs.query({url:'https://app.powerbi.com/*'}),matches=tabs.filter(t=>isReadyPowerBI(t,known));tab=matches.find(t=>{try{return new URL(t.pendingUrl||t.url).searchParams.get('visual')==='e012a952be9d5b6b572d';}catch{return false;}})||matches.find(t=>t.active)||matches[0];}
 if(!tab)tab=await chrome.tabs.create({url:POWERBI_REPORT_URL,active:false});
 if(chrome.__toolboxScope)tab=await ToolboxInstances.reserve(chrome,tab,{url:POWERBI_REPORT_URL});
 await chrome.storage.session.set({powerBITab:tab.id});await ToolboxTabGroup.add(tab);return tab;
}
async function readPowerBI(kind){
 if(powerBIBusy)throw Error('Une lecture Power BI est déjà en cours.');powerBIBusy=true;
 let scope=null;
 let tab,stage='Vérification des autorisations',diagnostics=[],frameWarning='';
 try{
  if(!await chrome.permissions.contains({origins:['https://app.powerbi.com/*']}))throw Error('Autorise les accès au Toolbox avant de lire Power BI.');
  if(kind==='powerBIBind'){
   stage='Association de l’onglet actif';
   const [active]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
   if(!isReadyPowerBI(active,active?.url))throw Error('Affiche le rapport Power BI dans l’onglet actif, puis réessaie.');
   await chrome.storage.session.set({powerBITab:active.id,powerBIResolvedURL:active.url});await chrome.storage.local.set({toolboxPowerBIResolvedURL:active.url});await ToolboxTabGroup.add(active);return {tabId:active.id};
  }
  if(kind==='powerBIRead'&&globalThis.ToolboxReadyScope){stage='Choix de Sales Rep Name';scope=ToolboxReadyScope.requireSelection((await chrome.storage.local.get('toolboxReadyScope')).toolboxReadyScope);}
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
   await chrome.scripting.executeScript({target,files:scope?['powerbi-reader.js','ready-salesperson.js']:['powerbi-reader.js']});
   stage='Lecture du tableau · '+label;
   return chrome.scripting.executeScript({target,func:async(diagnostic,scope)=>{try{if(diagnostic)return {diagnostic:globalThis.ToolboxPowerBIReader.diagnostic()};await globalThis.ToolboxPowerBIReader.ensureReady();if(scope)await globalThis.ToolboxReadySalesperson.apply(scope);const value=await globalThis.ToolboxPowerBIReader.read();if(scope){const proof=globalThis.ToolboxReadySalesperson.confirmed(scope);if(!proof.verified)throw Error('Sales Rep Name a changé pendant la lecture.');return {...value,readyFilter:proof};}return value;}catch(e){return {error:e.message,diagnostic:globalThis.ToolboxPowerBIReader.diagnostic()};}},args:[kind==='powerBIDiagnostic',scope]});
  }
  // A sandboxed child frame must not block extraction from the main report page.
  let frames=await inspect({tabId:tab.id},'page principale');
  const topRecognized=frames.some(f=>Array.isArray(f.result?.rows)||f.result?.diagnostic?.tables?.length);
  if(!topRecognized){
   try{frames=await inspect({tabId:tab.id,allFrames:true},'sous-fenêtres');}
   catch(e){frameWarning=stage+' : '+e.message;}
  }
  diagnostics=frames.map(f=>({frameId:f.frameId,...f.result?.diagnostic}));
  if(kind==='powerBIDiagnostic')return {diagnostics,frameWarning,tabId:tab.id};
  const results=frames.filter(f=>!f.result?.error&&Array.isArray(f.result?.rows)&&Array.isArray(f.result?.headers));
  stage='Identification des résultats';
  if(results.length!==1)throw Error(results.length?'Plusieurs tableaux lisibles détectés. Utilise Diagnostic Power BI.':frames.find(f=>f.result?.diagnostic?.tables?.length)?.result.error||frames.find(f=>f.frameId===0)?.result?.error||(frameWarning?'La page principale est accessible, mais une sous-fenêtre refuse la lecture. Utilise Diagnostic Power BI.':'Tableau non détecté. Ouvre Ready to PIK, puis utilise Diagnostic Power BI.'));
  await chrome.storage.session.set({powerBIResolvedURL:tab.url});
  await chrome.storage.local.set({toolboxPowerBIResolvedURL:tab.url});
  let result={...results[0].result,tabId:tab.id,at:Date.now()};
  if(scope)result=ToolboxReadyScope.confirm(result,scope);
  stage='Lecture des Internal Notes';
  await chrome.storage.local.set({toolboxPowerBIStatus:{state:'loading',tabId:tab.id,message:'Lecture des Internal Notes dans les commandes D365 ouvertes…'}});
  try{result=(await (chrome.__toolboxScope?ToolboxInstances.worker('notes',chrome.__toolboxScope):globalThis).collectPowerBIOrderNotes(result)).data;}catch{/* Missing notes must not discard a successful report read. */}
  if(scope&&!ToolboxReadyScope.same(scope,(await chrome.storage.local.get('toolboxReadyScope')).toolboxReadyScope))throw Error('Le vendeur a changé pendant la lecture. Relance l’actualisation.');
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
chrome.runtime.onMessage.addListener((m,s,reply)=>{if(s.id!==chrome.runtime.id||!['powerBIRead','powerBIOpen','powerBIDiagnostic','powerBIBind','powerBIOrderNotes'].includes(m?.kind))return;(m.kind==='powerBIOrderNotes'?(chrome.__toolboxScope?ToolboxInstances.worker('notes',chrome.__toolboxScope):globalThis).readPowerBIOrderNotes(m.order):readPowerBI(m.kind)).then(value=>reply({value}),e=>reply({error:e.message}));return true;});

return {readyPowerBIId,isReadyPowerBI,powerBITab,readPowerBI,POWERBI_REPORT_URL,isPowerBI,get powerBIBusy(){return powerBIBusy},set powerBIBusy(value){powerBIBusy=value}};
};
const values=globalThis.ToolboxInstances?ToolboxInstances.register('powerbi',build):build(globalThis.chrome);
Object.defineProperties(globalThis,Object.getOwnPropertyDescriptors(values));
})();
