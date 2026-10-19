const D365_ORIGIN='https://solotech.operations.dynamics.com';
const D365_URL=D365_ORIGIN+'/?cmp=CAOP&mi=smmBusinessRelationsListPage';
const pauseD365=ms=>new Promise(r=>setTimeout(r,ms));
let d365Busy=false;let activeProgress=null;let progressSequence=0;
function correctCompany(url){try{const u=new URL(url);return u.origin===D365_ORIGIN&&u.searchParams.get('cmp')?.toUpperCase()==='CAOP';}catch{return false;}}
async function targetD365(action='fill'){
 if(!await chrome.permissions.contains({origins:[D365_ORIGIN+'/*']}))throw Error('Autorise l’accès à D365 depuis le bouton de l’extension.');
 const state=await chrome.storage.session.get('d365TargetId');let tab;
 const prospectModules=['smmBusinessRelationsListPage','smmBusRelTable'];
 const continuationModules=[...prospectModules,'SalesQuotationTable'];
 if(action!=='fill'&&state.d365TargetId){try{const candidate=await chrome.tabs.get(state.d365TargetId);if(ToolboxTabs.matches(candidate,continuationModules))tab=candidate;}catch{}}
 // A new prospect starts from All prospects. Product Search and orders are never targets.
 if(!tab)tab=await ToolboxTabs.find(action==='fill'?['smmBusinessRelationsListPage']:prospectModules,state.d365TargetId);
 if(!tab){if(!['fill','show'].includes(action))throw Error('Onglet All prospects introuvable. Ouvre le prospect à utiliser dans D365.');tab=await chrome.tabs.create({url:D365_URL,active:false});}
 await chrome.storage.session.set({d365TargetId:tab.id});
 await ToolboxTabGroup.add(tab);
 const end=Date.now()+25000;while(Date.now()<end){tab=await chrome.tabs.get(tab.id);if(tab.status==='complete')break;await pauseD365(300);}
 if(!correctCompany(tab.url))throw Error('Connexion D365 nécessaire. Clique sur Afficher D365, connecte-toi, puis réessaie depuis Salesforce.');
 return tab;
}
async function wakeD365(progress){
 if(progress.woken)return {active:true};
 const tab=await chrome.tabs.get(progress.tabId),[current]=await chrome.tabs.query({windowId:tab.windowId,active:true});
 progress.woken=true;
 if(current?.id!==tab.id){progress.restoreId=current?.id;await chrome.tabs.update(tab.id,{active:true});}
 const end=Date.now()+25000;
 while(Date.now()<end){const current=await chrome.tabs.get(tab.id);if(current.status==='complete'&&!current.frozen&&!current.discarded)return {active:true};await pauseD365(200);}
 throw Error('L’onglet D365 ne s’est pas réveillé. Affiche D365 pour vérifier la connexion.');
}
async function restoreD365(progress){
 if(!progress?.restoreId)return;
 try{const tab=await chrome.tabs.get(progress.tabId),previous=await chrome.tabs.get(progress.restoreId);if(tab.active&&tab.windowId===previous.windowId){await chrome.tabs.update(previous.id,{active:true});await ToolboxTabGroup.add(tab);}}catch{/* The user may have closed or switched tabs during the operation. */}
}
async function createdQuotationTarget(args){
 const saved=(await chrome.storage.session.get('d365Quotation')).d365Quotation;
 if(!saved||saved.tabId!==args?.tabId||saved.number!==args?.number||Date.now()-saved.at>8*60*60*1000)throw Error('Soumission de cette session introuvable. Vérifie D365.');
 let tab;try{tab=await chrome.tabs.get(saved.tabId);}catch{throw Error('L’onglet de la soumission a été fermé. Ouvre-la dans D365.');}
 if(!correctCompany(tab.url))throw Error('L’onglet de la soumission affiche maintenant une autre page. Vérifie D365.');
 return {tab,saved};
}
async function openCreatedQuotation(args){
 const {tab,saved}=await createdQuotationTarget(args);
 // Focus the recorded tab only. Never select another Dynamics tab or create a duplicate.
 await chrome.tabs.update(tab.id,{active:true});await chrome.windows.update(tab.windowId,{focused:true});
 if(saved.number){
  await chrome.scripting.executeScript({target:{tabId:tab.id},files:['d365-controls.js','quotation.js']});
  const [check]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:number=>globalThis.solotechQuotation.matchesQuote(number),args:[saved.number]});
  if(!check?.result)throw Error('Cet onglet n’affiche plus la soumission '+saved.number+'. Retrouve-la dans D365.');
 }
 return {message:'Onglet de la soumission affiché.',tabId:tab.id,number:saved.number};
}
async function d365Run(action,args){
 if(action==='quote')ToolboxWarehouses.assertPair(args?.site,args?.warehouse);
 if(d365Busy)throw Error('Une opération D365 est déjà en cours.');d365Busy=true;
 let progress;
 try{if(action==='openQuote')return await openCreatedQuotation(args);
 await chrome.storage.session.set({d365Status:'Opération D365 en cours…'});
 if(action==='show'){const t=await targetD365('show');await chrome.tabs.update(t.id,{active:true});await chrome.windows.update(t.windowId,{focused:true});return {message:'D365 affiché.'};}
 const priorQuotation=action==='quoteContacts'?await createdQuotationTarget(args):null;
 const tab=priorQuotation?.tab||await targetD365(action);
 if(!['fill','confirm','quote','quoteContacts','diagnose'].includes(action))throw Error('Action D365 inconnue.');
 const progressToken=String(++progressSequence);progress={action,tabId:tab.id,token:progressToken};activeProgress=progress;
 if(action==='fill')await chrome.storage.session.remove('d365FillProgress');
 if(tab.frozen||tab.discarded)await wakeD365(progress);
 await chrome.scripting.executeScript({target:{tabId:tab.id},files:['model.js','warehouse-model.js','d365-controls.js','page.js','contact-fill.js','quotation.js','d365-flow.js']});
 const record=await chrome.storage.session.get(['d365Record','quoteResult']);
 const [response]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:async(action,args,record,progressToken,quotation)=>{
 try{const onBlocked=async()=>{const reply=await chrome.runtime.sendMessage({kind:'d365Attention',token:progressToken});if(reply?.error)throw Error(reply.error);if(!reply?.active)throw Error('L’onglet D365 n’a pas pu être activé automatiquement.');};
 const onProgress=async update=>{try{const detail=typeof update==='string'?{message:update}:update;await chrome.runtime.sendMessage({kind:'d365Progress',token:progressToken,message:detail.message,fields:detail.fields});}catch{/* A display update must never abort the CRM operation. */}};
 if(action==='diagnose')return {value:{message:'Diagnostic disponible ci-dessous.',diagnostic:solotechQuotation.diagnostics()}};
 if(action==='quoteContacts'){
  if(!quotation?.clicked||quotation.number!==args.number||!['notes','delivery','email'].every(key=>typeof args.contacts?.[key]==='string'&&args.contacts[key].trim()))throw Error('Coordonnées ou soumission de cette session indisponibles.');
  await onProgress('Reprise des coordonnées dans la soumission '+args.number+'…');
  const contacts=await solotechQuotation.fillCreatedContacts(args.number,args.contacts,{onBlocked});
  return {value:{...quotation,contacts,contactsPending:false,message:'Coordonnées remplies dans '+args.number+'. Vérifie puis enregistre la soumission dans D365.'}};
 }
 if(action==='fill')return {value:await solotechFlow.fillDraft({...args,onBlocked,onProgress})};
 if(action==='confirm')return {value:await solotechFlow.confirmProspect({...args,onBlocked})};
 if(record?.account)await solotechFlow.openRecord(record.account,{onBlocked});
 return {value:await solotechQuotation.create({...args,onBlocked,onProgress,expectedAccount:record?.account})};
 }catch(e){return {error:e.message};}
 },args:[action,args||{},record.d365Record||null,progressToken,record.quoteResult||null]});
 if(response?.result?.error)throw Error(response.result.error);const result=response?.result?.value;if(!result)throw Error('Résultat D365 inconnu : affiche D365 avant de réessayer.');
 if(action==='fill')await chrome.storage.session.remove(['d365Record','d365Quotation','quoteResult']);
 if(action==='confirm')await chrome.storage.session.set({d365Record:{account:result.account,expectedName:args.expectedName}});
 if(['quote','quoteContacts'].includes(action)&&result.clicked){result.tabId=tab.id;await chrome.storage.session.set({d365Quotation:{tabId:tab.id,number:result.number||'',account:result.account,at:priorQuotation?.saved.at||Date.now()},quoteResult:result});}
 await chrome.storage.session.set({d365Status:result.message||'Opération terminée.',d365LastResult:result});return result;
 }catch(e){await chrome.storage.session.set({d365Status:e.message});throw e;}finally{await restoreD365(progress);d365Busy=false;activeProgress=null;}
}
chrome.runtime.onMessage.addListener((m,s,reply)=>{if(s.id!==chrome.runtime.id||m?.kind!=='d365Action')return;d365Run(m.action,m.args).then(value=>reply({value}),e=>reply({error:e.message}));return true;});
chrome.runtime.onMessage.addListener((m,s,reply)=>{
 if(m?.kind!=='d365Attention')return;
 if(s.id!==chrome.runtime.id||!d365Busy||!activeProgress||s.tab?.id!==activeProgress.tabId||m.token!==activeProgress.token){reply({active:false});return;}
 wakeD365(activeProgress).then(reply,e=>reply({error:e.message}));return true;
});

// Content scripts cannot access storage.session: the extension worker owns status writes.
chrome.runtime.onMessage.addListener((m,s,reply)=>{
 if(m?.kind!=='d365Progress')return;
 if(s.id!==chrome.runtime.id||!d365Busy||!activeProgress||s.tab?.id!==activeProgress.tabId||m.token!==activeProgress.token||typeof m.message!=='string'||m.message.length>300){reply({accepted:false});return;}
 const values={d365Status:m.message},f=m.fields;
 if(f!==undefined){
  if(activeProgress.action!=='fill'||!f||!Number.isInteger(f.current)||!Number.isInteger(f.total)||f.total<1||f.total>100||f.current<0||f.current>f.total||typeof f.label!=='string'||!f.label||f.label.length>120||!['writing','filled','kept','warning'].includes(f.state)){reply({accepted:false});return;}
  values.d365FillProgress={current:f.current,total:f.total,label:f.label,state:f.state,token:activeProgress.token};
 }
 chrome.storage.session.set(values).then(()=>reply({accepted:true}),()=>reply({accepted:false}));return true;
});
