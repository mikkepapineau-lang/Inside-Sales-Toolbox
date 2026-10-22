let nonReservedBusy=false,nonReservedStopped=false,nonReservedTarget=null;
const nonReservedReport=tab=>ToolboxNonReserved.matches(tab?.pendingUrl||tab?.url);
async function nonReservedTab(){
 const saved=await chrome.storage.local.get('toolboxNonReservedReportURL'),url=ToolboxNonReserved.matches(saved.toolboxNonReservedReportURL)?saved.toolboxNonReservedReportURL:ToolboxNonReserved.reportURL;
 const session=await chrome.storage.session.get('nonReservedTab');let tab;try{tab=await chrome.tabs.get(session.nonReservedTab);}catch{}
 if(!nonReservedReport(tab)){const tabs=(await chrome.tabs.query({url:'https://app.powerbi.com/*'})).filter(nonReservedReport);tab=tabs.find(t=>t.active)||tabs[0]||await chrome.tabs.create({url,active:false});}
 if(new URL(tab.pendingUrl||tab.url).pathname!==new URL(url).pathname)tab=await chrome.tabs.update(tab.id,{url});
 await chrome.storage.session.set({nonReservedTab:tab.id});await ToolboxTabGroup.add(tab);return {tab,url};
}
async function nonReservedCommand(kind,payload={}){
 if(kind==='nonReservedInit'){const saved=await chrome.storage.local.get('toolboxNonReservedStatus');if(!nonReservedBusy&&saved.toolboxNonReservedStatus?.state==='loading')await chrome.storage.local.set({toolboxNonReservedStatus:{state:'error',message:'L’export Non-Reserved a été interrompu. Le catalogue précédent est conservé.'}});return {ready:true};}
 if(kind==='nonReservedSetURL'){if(!ToolboxNonReserved.matches(payload.url))throw Error('Ce lien ne correspond pas au rapport Non-Reserved Item List.');await chrome.storage.local.set({toolboxNonReservedReportURL:payload.url});return {saved:true};}
 if(kind!=='nonReservedImport'&&!await chrome.permissions.contains({origins:['https://app.powerbi.com/*']}))throw Error('Autorise l’accès à Power BI dans le Toolbox.');
 if(kind==='nonReservedOpen'){const {tab}=await nonReservedTab();await chrome.tabs.update(tab.id,{active:true});await chrome.windows.update(tab.windowId,{focused:true});return {tabId:tab.id};}
 if(nonReservedBusy)throw Error('Une actualisation Non-Reserved est déjà en cours.');nonReservedBusy=true;nonReservedStopped=false;
 const status=value=>chrome.storage.local.set({toolboxNonReservedStatus:{...value,at:Date.now()}});
 try{
  if(kind==='nonReservedImport'){
   const receipt=(await chrome.storage.session.get('nonReservedReceipt')).nonReservedReceipt;
   if(!payload.manual&&(!receipt||receipt.id!==payload.exportId||receipt.sha256!==payload.sha256||Date.now()-receipt.at>120000||Date.now()<receipt.at))throw Error('Le fichier Non-Reserved n’est plus confirmé. Relance l’export.');
   const data=ToolboxNonReserved.validate(payload.data,{at:payload.manual?Date.now():receipt.at});data.importedAt=Date.now();
   if(!payload.manual&&receipt.currency&&data.currency&&receipt.currency!==data.currency)throw Error('La devise du fichier diffère du rapport. Aucun import.');
   if(!data.currency&&!payload.manual)data.currency=receipt.currency||'';
   await ToolboxNonReservedStore.put(data);await chrome.storage.session.remove('nonReservedReceipt');
   await chrome.storage.local.set({toolboxNonReservedStamp:Date.now(),toolboxNonReservedStatus:{state:'done',message:'Catalogue Non-Reserved importé : '+data.rows.length+' lignes.',at:data.at}}).catch(()=>{});return {count:data.rows.length};
  }
  await chrome.storage.session.remove('nonReservedReceipt');await status({state:'loading',message:'Préparation de l’export Non-Reserved…'});
  const {tab:initial,url}=await nonReservedTab();let tab=initial;const end=Date.now()+20000;
  while(tab.status==='loading'&&Date.now()<end){if(nonReservedStopped)throw Error('Export Non-Reserved arrêté.');await new Promise(r=>setTimeout(r,200));tab=await chrome.tabs.get(tab.id);}
  if(!nonReservedReport(tab)||tab.status==='loading'||new URL(tab.url).pathname!==new URL(url).pathname)throw Error('Le rapport Non-Reserved n’est pas prêt sur la page demandée.');
  const scan={tabId:tab.id,allFrames:true};let frames;
  try{await chrome.scripting.executeScript({target:scan,files:['nonreserved-reader.js']});frames=await chrome.scripting.executeScript({target:scan,func:async path=>ToolboxNonReservedReader.prepare(path),args:[new URL(url).pathname]});}
  catch{const target={tabId:tab.id,frameIds:[0]};await chrome.scripting.executeScript({target,files:['nonreserved-reader.js']});frames=await chrome.scripting.executeScript({target,func:async path=>ToolboxNonReservedReader.prepare(path),args:[new URL(url).pathname]});}
  const ready=frames.filter(frame=>frame.result?.ready);if(ready.length!==1)throw Error(ready.length?'Plusieurs tableaux Non-Reserved sont accessibles.':frames.find(f=>f.result?.error)?.result.error||'Tableau Non-Reserved inaccessible.');
  const frame=ready[0],target={tabId:tab.id,...(frame.documentId?{documentIds:[frame.documentId]}:{frameIds:[frame.frameId]})};nonReservedTarget=target;
  if(nonReservedStopped)throw Error('Export Non-Reserved arrêté.');
  await status({state:'loading',message:'Export Excel du tableau Non-Reserved…'});
  await chrome.scripting.executeScript({target,world:'MAIN',files:['used-export-ui.js']});
  const [result]=await chrome.scripting.executeScript({target,world:'MAIN',func:()=>ToolboxUsedExportUI.run({profile:'nonreserved'})});
  if(result?.result?.error)throw Error(result.result.error);const file=result?.result;
  if(nonReservedStopped)throw Error('Export Non-Reserved arrêté.');
  if(!file||typeof file.base64!=='string'||file.base64.length>35000000||!/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64)||!Number.isInteger(file.size)||file.size<4||file.size>25*1024*1024)throw Error('Fichier Non-Reserved invalide ou trop volumineux.');
  const bytes=Uint8Array.from(atob(file.base64),c=>c.charCodeAt(0));if(bytes.length!==file.size||bytes[0]!==80||bytes[1]!==75)throw Error('Le fichier reçu n’est pas un XLSX.');
  const current=await chrome.tabs.get(tab.id);if(!nonReservedReport(current)||new URL(current.pendingUrl||current.url).pathname!==new URL(url).pathname)throw Error('Le rapport a changé pendant l’export.');
  const [after]=await chrome.scripting.executeScript({target,func:()=>ToolboxNonReservedReader.probe()});if(!after?.result?.ready||after.result.context!==frame.result.context)throw Error('Les filtres ou la page ont changé pendant l’export. Aucun import.');
  const sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join(''),id=crypto.randomUUID();
  await chrome.storage.session.set({nonReservedReceipt:{id,sha256,at:Date.now(),currency:frame.result.currency||''}});
  await status({state:'ready',message:'Lecture du fichier Excel Non-Reserved…'});return {...file,name:'Non-Reserved.xlsx',sha256,exportId:id};
 }catch(e){await status({state:'error',message:e.message});throw e;}
 finally{nonReservedBusy=false;nonReservedTarget=null;}
}
chrome.runtime.onMessage.addListener((m,s,reply)=>{
 if(s.id!==chrome.runtime.id)return;
 if(m?.kind==='nonReservedStop'){nonReservedStopped=true;if(nonReservedTarget)chrome.scripting.executeScript({target:nonReservedTarget,world:'MAIN',func:()=>ToolboxUsedExportUI.cancel()}).catch(()=>{});chrome.storage.session.remove('nonReservedReceipt').then(()=>reply({value:{stopped:true}}),e=>reply({error:e.message}));return true;}
 if(!['nonReservedInit','nonReservedExport','nonReservedImport','nonReservedOpen','nonReservedSetURL'].includes(m?.kind))return;
 nonReservedCommand(m.kind,m).then(value=>reply({value}),e=>reply({error:e.message}));return true;
});
