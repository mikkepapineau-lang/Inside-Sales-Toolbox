const D365_ORIGIN='https://solotech.operations.dynamics.com';
const D365_URL=D365_ORIGIN+'/?cmp=CAOP&mi=smmBusinessRelationsListPage';
const pauseD365=ms=>new Promise(r=>setTimeout(r,ms));
let d365Busy=false;let activeProgress=null;let progressSequence=0;
function correctCompany(url){try{const u=new URL(url);return u.origin===D365_ORIGIN&&u.searchParams.get('cmp')?.toUpperCase()==='CAOP';}catch{return false;}}
async function targetD365(create=true){
 if(!await chrome.permissions.contains({origins:[D365_ORIGIN+'/*']}))throw Error('Autorise l’accès à D365 depuis le bouton de l’extension.');
 const state=await chrome.storage.session.get('d365TargetId');let tab;
 if(state.d365TargetId){try{const candidate=await chrome.tabs.get(state.d365TargetId);if(correctCompany(candidate.url))tab=candidate;}catch{}}
 if(!tab){const candidates=(await chrome.tabs.query({url:D365_ORIGIN+'/*'})).filter(t=>correctCompany(t.url));if(candidates.length===1)tab=candidates[0];else if(candidates.length>1)throw Error('Plusieurs onglets D365 CAOP sont ouverts. Ferme ceux inutilisés pour sélectionner le bon.');}
 if(!tab){if(!create)throw Error('Onglet D365 introuvable. Remplis le prospect pour le rouvrir.');tab=await chrome.tabs.create({url:D365_URL,active:false});}
 await chrome.storage.session.set({d365TargetId:tab.id});
 const end=Date.now()+25000;while(Date.now()<end){tab=await chrome.tabs.get(tab.id);if(tab.status==='complete')break;await pauseD365(300);}
 if(!correctCompany(tab.url))throw Error('Connexion D365 nécessaire. Clique sur Afficher D365, connecte-toi, puis réessaie depuis Salesforce.');
 if(tab.frozen||tab.discarded)throw Error('L’onglet D365 est en veille. Clique sur Afficher D365 pour le réveiller puis retourne sur Salesforce.');
 return tab;
}
async function d365Run(action,args){
 if(action==='quote')throw Error('Création de soumission indisponible dans la version Ventes Internes.');
 if(d365Busy)throw Error('Une opération D365 est déjà en cours.');d365Busy=true;
 await chrome.storage.session.set({d365Status:'Opération D365 en cours…'});
 try{if(action==='show'){const stored=await chrome.storage.session.get('d365TargetId');if(stored.d365TargetId){try{await chrome.tabs.update(stored.d365TargetId,{active:true});return {message:'D365 affiché.'};}catch{}}const t=await chrome.tabs.create({url:D365_URL,active:true});await chrome.storage.session.set({d365TargetId:t.id});return {message:'D365 affiché.'};}
 const tab=await targetD365(action==='fill');
 if(!['fill','confirm','diagnose'].includes(action))throw Error('Action D365 inconnue.');
 await chrome.scripting.executeScript({target:{tabId:tab.id},files:['model.js','d365-controls.js','page.js','quotation.js','d365-flow.js']});
 const record=await chrome.storage.session.get('d365Record');
 const progressToken=String(++progressSequence);activeProgress={tabId:tab.id,token:progressToken};
 const [response]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:async(action,args,record,progressToken)=>{
 try{if(action==='diagnose')return {value:{message:'Diagnostic disponible ci-dessous.',diagnostic:solotechQuotation.diagnostics()}};
 if(action==='fill')return {value:await solotechFlow.fillDraft(args)};
 if(action==='confirm')return {value:await solotechFlow.confirmProspect(args)};
 throw Error('Action D365 inconnue.');
 }catch(e){return {error:e.message};}
 },args:[action,args||{},record.d365Record||null,progressToken]});
 if(response?.result?.error)throw Error(response.result.error);const result=response?.result?.value;if(!result)throw Error('Résultat D365 inconnu : affiche D365 avant de réessayer.');
 if(action==='fill')await chrome.storage.session.remove('d365Record');
 if(action==='confirm')await chrome.storage.session.set({d365Record:{account:result.account,expectedName:args.expectedName}});
 await chrome.storage.session.set({d365Status:result.message||'Opération terminée.',d365LastResult:result});return result;
 }catch(e){await chrome.storage.session.set({d365Status:e.message});throw e;}finally{d365Busy=false;activeProgress=null;}
}
chrome.runtime.onMessage.addListener((m,s,reply)=>{if(s.id!==chrome.runtime.id||m?.kind!=='d365Action')return;d365Run(m.action,m.args).then(value=>reply({value}),e=>reply({error:e.message}));return true;});

// Content scripts cannot access storage.session: the extension worker owns status writes.
chrome.runtime.onMessage.addListener((m,s,reply)=>{
 if(m?.kind!=='d365Progress')return;
 if(s.id!==chrome.runtime.id||!d365Busy||!activeProgress||s.tab?.id!==activeProgress.tabId||m.token!==activeProgress.token||typeof m.message!=='string'||m.message.length>300){reply({accepted:false});return;}
 chrome.storage.session.set({d365Status:m.message}).then(()=>reply({accepted:true}),()=>reply({accepted:false}));return true;
});
