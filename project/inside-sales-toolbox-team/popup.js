const leadEditorId=crypto.randomUUID();
const $=id=>document.getElementById(id);const B=Bridge;let data=B.normalize({}),currentScan=null,tabId=null,createdQuotation=null;const TTL=8*60*60*1000;
const LEAD_SESSION_KEYS=['lead','report','uiStep','d365Record','d365LastResult','d365Status','googleAddressStatus','quoteResult','d365Quotation','d365FillProgress'];
function relevant(){return B.fields.filter(([k])=>k!=='type'&&(data.type==='Person'?k!=='company':!['first','last'].includes(k)));}
function status(s){$('status').textContent=s;if($('bridge-status-summary'))$('bridge-status-summary').textContent=String(s).split('\n')[0]||'Messages du parcours';globalThis.ToolboxMotion?.text($('status'));if($('quoteStatus'))$('quoteStatus').textContent=s;}
async function save(){B.capitalizeNames(data);updateLeadBanner();renderQuoteContacts();const old=await chrome.storage.session.get('lead');await chrome.storage.session.set({lead:{...(old.lead||{}),data,editor:leadEditorId,at:old.lead?.at||Date.now()}});}
function render(){if(data.tax==='Hst_on')data.tax='HST_ON';B.capitalizeNames(data);
$('editor').replaceChildren();const groupMap={};
for(const [title,keys] of [['Identité',['type','company','first','last']],['Contact',['phoneName','phone','extension','emailName','email']],['Adresse',['street','city','state','postal','country']],['Paramètres D365',['language','currency','typeId','delivery','terms','tax']]]){
 const fieldset=document.createElement('fieldset'),legend=document.createElement('legend'),grid=document.createElement('div');legend.textContent=title;grid.className='field-grid';fieldset.append(legend,grid);
 if(title==='Paramètres D365'){const details=document.createElement('details'),summary=document.createElement('summary');details.className='editor-section';summary.textContent=title;details.append(summary,fieldset);$('editor').append(details);}else $('editor').append(fieldset);
 for(const key of keys)groupMap[key]=grid;
}
for(const [key,label] of B.fields){if(data.type==='Person'&&key==='company'||data.type==='Organization'&&['first','last'].includes(key))continue;
const l=document.createElement('label');l.textContent=key==='type'?'Organisation ou Personne ?':label;let input;
if(key==='type'||key==='tax'){input=document.createElement('select');const choices=key==='type'?['Organization','Person']:['',...Object.values(B.tax)];for(const value of choices){const o=new Option(key==='type'?(value==='Organization'?'Organisation':'Personne'):(value||'À choisir'),value);input.add(o);}}else input=document.createElement('input');
input.id='value-'+key;input.value=data[key]||'';input.addEventListener(input.tagName==='SELECT'?'change':'input',async()=>{if(key==='type')B.switchType(data,input.value);else data[key]=input.value;if(key==='phone'){const parsed=B.phone(input.value);data.phone=parsed.value;input.value=data.phone;if(parsed.extension){data.extension=parsed.extension;const ext=$('value-extension');if(ext)ext.value=data.extension;}}if(['street','city','state','postal','country','phone'].includes(key))quoteDefaults();if(['phone','state','postal','country'].includes(key)){B.updateTax(data);const t=$('value-tax');if(t)t.value=data.tax;$('taxNote').textContent=data.taxNote;}if(key==='tax'){data.taxSource='manual';data.taxNote='Taxe choisie manuellement.';$('taxNote').textContent=data.taxNote;}await save();input.value=data[key]||'';if(key==='type'){currentScan=null;render();}});l.append(input);if(['type','company','street','email','tax'].includes(key))l.classList.add('full');(groupMap[key]||$('editor')).append(l);
} updateLeadBanner();renderQuoteContacts();$('taxNote').textContent=data.taxNote||B.taxForData(data).note;quoteDefaults();
}
function renderQuoteContacts(){
 let values;try{values=ContactModel.values(ContactModel.fromLead(data));$('quote-contact-note').textContent='Ces coordonnées seront remplies dans la soumission après sa création.';}catch{$('quote-contact-note').textContent='Complète le nom, le téléphone et le courriel à l’étape Lead pour les reprendre dans la soumission.';}
 for(const key of ['delivery','notes','email'])$('quote-contact-'+key).value=values?.[key]||'';
}
async function active(){const [t]=await chrome.tabs.query({active:true,currentWindow:true});if(!t?.id)throw Error('Onglet introuvable.');return t;}
async function page(method,arg,target){const t=target||await active();await chrome.scripting.executeScript({target:{tabId:t.id},files:['page.js']});const [r]=await chrome.scripting.executeScript({target:{tabId:t.id},func:async(m,a)=>{try{return {value:await globalThis.solotechBridge[m](a)}}catch(e){return {error:e.message}}},args:[method,arg||null]});if(r.result?.error)throw Error(r.result.error);if(!r.result)throw Error('Page inaccessible.');return r.result.value;}
function safe(fn){return async()=>{try{return await fn();}catch(e){status(e.message);return {toolboxError:e.message};}};}
$('capture').onclick=safe(async()=>{$('successCard').hidden=true;const result=await page('read');data=B.updateTax(B.normalize(result.data));quoteAddress='';$('quote').disabled=false;$('quote-contacts').disabled=false;await chrome.storage.session.remove(['d365Record','d365LastResult','d365Status','googleAddressStatus','quoteResult','d365Quotation','d365FillProgress']);showQuotation(null);await chrome.storage.session.set({lead:{data,at:Date.now(),source:result.url},report:[]});currentScan=null;$('report').textContent='';render();$('source').textContent=result.url;await globalThis.ToolboxMotion?.fillFields($('editor'),{onStep:step=>globalThis.BridgeActions?.progress('capture',step)});status(['Lead récupéré. Vérifie le nom, la compagnie, l’adresse et la taxe.',data.type==='Person'?'Courriel personnel reconnu : Personne proposée. Vérifie le prénom et le nom.':'Organisation sélectionnée par défaut. Complète le nom de compagnie au besoin.',data.companyNote,...result.warnings].filter(Boolean).join('\n'));return result;});


async function allowD365(){if(!await chrome.permissions.contains({origins:['https://solotech.operations.dynamics.com/*']}))throw Error('Accès Dynamics manquant. Clique sur Autoriser tous les accès en haut du Toolbox.');}
$('prepareAccess').onclick=safe(async()=>{
 const allowed=await chrome.permissions.request({origins:['https://*/*']});
 $('accessStatus').textContent=allowed?'Accès prêts : D365, localisation et recherche de compagnie.':'Accès non accordés. Tu peux réessayer avec ce bouton.';
});
chrome.permissions.contains({origins:['https://*/*']}).then(ok=>{if(ok)$('accessStatus').textContent='Tous les accès sont prêts.';});
function showSuccess(r){
 $('successCard').hidden=!(r?.verified&&r.account&&!r.dimensionsPending);
 if(!$('successCard').hidden){$('successAccount').textContent=r.account+' · Dimensions financières vérifiées';$('successCard').scrollIntoView({block:'nearest'});}
}
async function d365Action(action,args={}){const result=await chrome.runtime.sendMessage({kind:'d365Action',action,args});if(result?.error)throw Error(result.error);if(!result?.value)throw Error('Résultat inconnu. Affiche D365 avant de réessayer.');return result.value;}
function showQuotation(result){createdQuotation=result?.clicked&&Number.isInteger(result.tabId)?result:null;const visible=!$('panel-quote').hidden;$('quote-open').hidden=!visible||!createdQuotation;$('quote').hidden=!visible||!!createdQuotation;$('quote-contacts').hidden=!(createdQuotation?.contactsPending&&createdQuotation.number);if(createdQuotation&&!createdQuotation.contactsPending&&$('quote-feedback').dataset.state==='warning')$('quote-feedback').hidden=true;}
$('quote-open').onclick=safe(async()=>{if(!createdQuotation)throw Error('Aucune soumission créée dans cette session.');return d365Action('openQuote',{tabId:createdQuotation.tabId,number:createdQuotation.number||''});});
$('quote-contacts').onclick=safe(async()=>{if(!createdQuotation?.contactsPending)throw Error('Aucune coordonnée à reprendre dans cette session.');await allowD365();const contacts=ContactModel.values(ContactModel.fromLead(data));const result=await d365Action('quoteContacts',{tabId:createdQuotation.tabId,number:createdQuotation.number,contacts});await chrome.storage.session.set({quoteResult:result});showQuotation(result);status(result.message);return result;});
function expectedName(){return data.type==='Organization'?data.company:[data.first,data.last].filter(Boolean).join(' ');}
$('fill').onclick=safe(async()=>{
 await allowD365();const lead=(await chrome.storage.session.get('lead')).lead;if(!lead||Date.now()-lead.at>TTL)throw Error('Récupère le lead de nouveau.');
 data.phone=B.phone(data.phone).value;await save();$('fill').disabled=true;status('Ouverture et remplissage de D365 en arrière-plan…');
 try{const result=await d365Action('fill',{data,overwrite:false});const full=[...result.report,'','Valeurs dans D365 :',...result.actual];$('report').textContent=full.join('\n');await chrome.storage.session.set({report:full});$('createProspect').disabled=false;status(result.message);return result;}finally{$('fill').disabled=false;}
});
$('createProspect').onclick=safe(async()=>{
 await allowD365();await resolveTerritory();await save();$('createProspect').disabled=true;try{const r=await d365Action('confirm',{expectedName:expectedName(),data,territory:data.territory||'MONTREAL',office:data.office||'MONTREAL'});status(r.message);showSuccess(r);return r;}catch(e){$('createProspect').disabled=false;throw e;}
});
$('showD365').onclick=safe(async()=>{
 const url='https://solotech.operations.dynamics.com/?cmp=CAOP&mi=DefaultDashboard';
 const allowed=await chrome.permissions.contains({origins:['https://solotech.operations.dynamics.com/*']});
 const tabs=allowed?await chrome.tabs.query({url:'https://solotech.operations.dynamics.com/*'}):[];
 const target=tabs.find(t=>{try{return new URL(t.url).searchParams.get('cmp')?.toUpperCase()==='CAOP';}catch{return false;}})||tabs[0];
 if(target){await chrome.tabs.update(target.id,{active:true});if(target.windowId!==undefined)await chrome.windows.update(target.windowId,{focused:true});}
 else await chrome.tabs.create({url});
});
function emailDomain(){const d=B.domain(data.email);if(!d)throw Error('Domaine d’entreprise absent ou courriel personnel.');return d;}

$('searchCompany').onclick=safe(async()=>{
 const domain=emailDomain();
 const origins=['https://'+domain+'/*','https://www.'+domain+'/*'];
 // Called directly from the click so Edge can request only this site's access.
 const allowed=await chrome.permissions.contains({origins});
 if(!allowed)throw Error('Accès au site non accordé. Tu peux saisir les coordonnées manuellement.');
 const email=data.email;await save();$('searchCompany').disabled=true;status('Recherche des coordonnées en cours…');$('companyResults').replaceChildren();
 try{const result=await chrome.runtime.sendMessage({kind:'companyLookup',domain});if(result?.error)throw Error(result.error);if(data.email!==email)return;
 if(!result?.candidates?.length)throw Error('Aucune adresse exploitable trouvée sur l’accueil ou les pages de contact. Vérifie l’adresse manuellement.');
 showCompany(result,domain);status('Coordonnées trouvées : vérifie la proposition avant de l’utiliser.');return result;
 }finally{$('searchCompany').disabled=false;}
});
function showCompany(result,domain){
 $('companyResults').replaceChildren();for(const candidate of result.candidates){const box=document.createElement('div');const info=document.createElement('p');info.textContent=[candidate.company,candidate.street,candidate.city,candidate.state,candidate.postal,candidate.country].filter(Boolean).join(' — ');const source=document.createElement('p');source.textContent='Source : '+candidate.source;
 const use=document.createElement('button');use.textContent='Utiliser ces coordonnées';use.onclick=safe(async()=>{if(emailDomain()!==domain)throw Error('Le courriel a changé. Relance la recherche.');B.applyCompany(data,candidate);await save();render();$('companyResults').replaceChildren();status('Adresse confirmée. Recherche du format Google Maps…');const result=await chrome.runtime.sendMessage({kind:'googleAddress',candidate,email:data.email});if(result?.error)throw Error(result.error);if(result?.value?.data){data=result.value.data;render();status(result.value.message);}});box.append(info,source,use);$('companyResults').append(box);}
}

const addressKey=()=>[data.street,data.city,data.state,data.postal,data.country,data.phone].join('|');
let quoteAddress='';
function syncWarehouses(reset=false){
 Object.assign(data,ToolboxWarehouses.selection(data,data.territory,reset));
 $('quote-site').value=data.site;
 $('warehouse').replaceChildren(new Option('Choisir un entrepôt',''));
 for(const [id,name] of ToolboxWarehouses.find(data.site)?.warehouses||[])$('warehouse').add(new Option(id+' · '+name,id));
 $('warehouse').value=data.warehouse;$('warehouse').disabled=!data.site;
}
function quoteDefaults(){
 if(quoteAddress===addressKey()){syncWarehouses();return;}quoteAddress=addressKey();
 const {warehouse,...guess}=Territories.infer(data);Object.assign(data,guess,{territoryResolved:false,territoryManual:false});
 syncWarehouses(!data.warehouseManual);
 $('territory').value=data.territory;$('locations').replaceChildren();
}
for(const name of ['',...Territories.names])$('territory').add(new Option(name||'À déterminer',name));
$('quote-site').add(new Option('Choisir un site',''));
for(const site of ToolboxWarehouses.sites)$('quote-site').add(new Option(site.id+' · '+site.name,site.id));
$('territory').onchange=safe(async()=>{data.territoryManual=true;data.territory=$('territory').value;data.office=Territories.officeFor(data.territory);syncWarehouses(!data.warehouseManual);await save();});
$('quote-site').onchange=safe(async()=>{data.site=$('quote-site').value;data.warehouse='';data.warehouseManual=true;const site=ToolboxWarehouses.find(data.site);if(site?.warehouses.length===1)data.warehouse=site.warehouses[0][0];syncWarehouses();await save();});
$('warehouse').onchange=safe(async()=>{data.warehouse=$('warehouse').value;data.warehouseManual=true;if(data.warehouse)ToolboxWarehouses.assertPair(data.site,data.warehouse);await save();});
$('locate').onclick=safe(async()=>{
 const allowed=await chrome.permissions.contains({origins:['https://photon.komoot.io/*']});if(!allowed)throw Error('Localisation non autorisée : choisis le territoire dans la liste.');
 const key=addressKey();const address=[data.street,data.city,data.state,data.postal,data.country==='CAN'?'Canada':data.country].filter(Boolean).join(', ');
 if(!data.city&&!data.postal)throw Error('Complète la ville ou le code postal.');
 $('locate').disabled=true;status('Localisation de l’adresse…');
 try{const result=await chrome.runtime.sendMessage({kind:'geocodeAddress',address});if(result.error)throw Error(result.error);if(key!==addressKey())throw Error('L’adresse a changé : relance la localisation.');$('locations').replaceChildren();
 for(const location of result.locations||[]){const territory=Territories.nearest(location.lat,location.lon,location.country);const box=document.createElement('p');box.textContent=location.label+(territory?' → '+territory:' — territoire à choisir manuellement');if(territory){const use=document.createElement('button');use.textContent='Retenir '+territory;use.onclick=safe(async()=>{if(key!==addressKey())throw Error('L’adresse a changé.');data.territoryResolved=true;data.territoryManual=true;data.territory=territory;data.office=Territories.officeFor(territory);syncWarehouses(!data.warehouseManual);$('territory').value=territory;await save();$('locations').replaceChildren();status('Territoire retenu. Vérifie l’entrepôt avant de créer la soumission.');});box.append(use);}$('locations').append(box);}
 status(result.locations?.length?'Vérifie l’adresse trouvée et retiens le territoire correspondant.':'Adresse introuvable : choisis le territoire manuellement.');return result;
 }finally{$('locate').disabled=false;}
});

async function resolveTerritory(){
 const guess=Territories.infer(data),manual=data.territoryManual&&Territories.names.includes(data.territory);let territory=manual?data.territory:guess.territory;
 if(!manual&&(data.city||data.postal||data.street)&&!guess.exactCity){
  if(!await chrome.permissions.contains({origins:['https://photon.komoot.io/*']}))throw Error('Clique sur Préparer tous les accès pour calculer la région selon l’adresse.');
  const address=[data.street,data.city,data.state,data.postal,data.country].filter(Boolean).join(', ');
  try{const r=await chrome.runtime.sendMessage({kind:'geocodeAddress',address});const point=r?.locations?.[0];if(point)territory=Territories.nearest(point.lat,point.lon,point.country)||territory;}catch{}
 }
 data.territory=territory;data.office=Territories.officeFor(territory);data.territoryResolved=true;syncWarehouses(!data.warehouseManual);
 $('territory').value=territory;
}

$('quote').onclick=safe(async()=>{
 status('Préparation de la soumission…');
 await allowD365();await resolveTerritory();await save();if(!Territories.names.includes(data.territory))throw Error('Choisis le territoire et l’entrepôt.');ToolboxWarehouses.assertPair(data.site,data.warehouse);
 $('quote').disabled=true;status('Ouverture du prospect et création de soumission en arrière-plan…');
 let contacts=null,contactWarning='';try{contacts=ContactModel.values(ContactModel.fromLead(data));}catch{contactWarning='Coordonnées du contact incomplètes : utilise le module Coordonnées client pour les compléter.';}
 try{const result=await d365Action('quote',{site:data.site,warehouse:data.warehouse,expectedName:expectedName(),contacts,contactWarning});status(result.message);await chrome.storage.session.set({quoteResult:result});showQuotation(result);return result;}catch(e){$('quote').disabled=false;throw e;}
});
$('clear').onclick=safe(async()=>{$('successCard').hidden=true;$('quote-contacts').disabled=false;showQuotation(null);for(const id of ['capture','fill','createProspect','quote','quote-open','quote-contacts','searchCompany','locate','diagnose'])globalThis.BridgeActions?.reset(id);await chrome.storage.session.remove(LEAD_SESSION_KEYS);data=B.normalize({});currentScan=null;$('report').textContent='';$('source').textContent='';$('companyResults').replaceChildren();render();selectStep('lead');status('Données du lead effacées.');});
(async()=>{const s=await chrome.storage.session.get(['lead','report','d365Status','d365LastResult','quoteResult']);if(s.lead&&Date.now()-s.lead.at<TTL){data=s.lead.data;if(!data.taxSource)B.updateTax(data);if(data.territory)quoteAddress=addressKey();$('territory').value=data.territory||'';$('warehouse').value=data.warehouse||'';$('source').textContent=s.lead.source||'';$('report').textContent=(s.report||[]).join('\n');showQuotation(s.quoteResult);if(s.quoteResult?.clicked)$('quote').disabled=true;}else await chrome.storage.session.remove(LEAD_SESSION_KEYS);render();if(s.d365Status)status(s.d365Status);const g=await chrome.storage.session.get('googleAddressStatus');if(g.googleAddressStatus)status(g.googleAddressStatus);showSuccess(s.d365LastResult);if(s.d365LastResult?.report)$('report').textContent=[...s.d365LastResult.report,'',...(s.d365LastResult.actual||[])].join('\n');})();

chrome.storage.onChanged.addListener((changes,area)=>{
 if(area==='session'&&changes.googleAddressStatus)status(changes.googleAddressStatus.newValue||'');
 if(area==='session'&&changes.lead?.newValue?.data&&(changes.lead.newValue.editor!==leadEditorId||changes.lead.newValue.data.addressGoogleAt!==data.addressGoogleAt)&&JSON.stringify(changes.lead.newValue.data)!==JSON.stringify(data)){data=changes.lead.newValue.data;render();}
 if(area==='session'&&changes.quoteResult)showQuotation(changes.quoteResult.newValue);
 if(area==='session'&&changes.d365FillProgress?.newValue)globalThis.BridgeActions?.progress('fill',changes.d365FillProgress.newValue);
 if(area==='session'&&changes.d365Status)status(changes.d365Status.newValue||'');
});
$('diagnose').onclick=safe(async()=>{
 status('Lecture du diagnostic…');await allowD365();
 const result=await d365Action('diagnose');
 $('diagnostic').hidden=false;$('diagnostic').value=JSON.stringify(result.diagnostic,null,2);
 $('diagnostic').select();status('Diagnostic prêt : copie le texte ci-dessous et envoie-le-moi. Aucune valeur client incluse.');return result;
});

function updateLeadBanner(){
 const name=(data.type==='Organization'?data.company:[data.first,data.last].filter(Boolean).join(' '))||data.contact;
 $('leadTitle').textContent=name||'Aucun lead sélectionné';
 $('leadSubtitle').textContent=data.email||(name?(data.type==='Organization'?'Organisation':'Personne'):'Commence par une fiche Salesforce');
 $('leadInitials').textContent=name?name.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase():'—';
}
let motionStep='lead';
function selectStep(step,remember=true){
 if(!['lead','prospect','quote'].includes(step))return;
 for(const name of ['lead','prospect','quote']){
  $('panel-'+name).hidden=name!==step;
  $('tab-'+name).setAttribute('aria-selected',String(name===step));
  $('tab-'+name).tabIndex=name===step?0:-1;
 }
 $('bridge-next').hidden=step==='quote';$('quote').hidden=step!=='quote'||!!createdQuotation;$('quote-open').hidden=step!=='quote'||!createdQuotation;$('bridge-next-label').textContent=step==='lead'?'Continuer vers le prospect':'Continuer vers la soumission';$('bridge-next').dataset.go=step==='lead'?'prospect':'quote';
 if(remember&&motionStep!==step)globalThis.ToolboxMotion?.enter($('panel-'+step));motionStep=step;
 document.querySelector('main').scrollTop=0;
 if(remember)chrome.storage.session.set({uiStep:step});
}
for(const tab of document.querySelectorAll('[data-step]')){
 tab.addEventListener('click',()=>selectStep(tab.dataset.step));
 tab.addEventListener('keydown',e=>{const names=['lead','prospect','quote'];const i=names.indexOf(tab.dataset.step);let next;
  if(e.key==='ArrowRight')next=names[(i+1)%3];if(e.key==='ArrowLeft')next=names[(i+2)%3];if(e.key==='Home')next=names[0];if(e.key==='End')next=names[2];
  if(next){e.preventDefault();selectStep(next);$('tab-'+next).focus();}
 });
}
for(const button of document.querySelectorAll('[data-go]'))button.addEventListener('click',()=>selectStep(button.dataset.go));
chrome.storage.session.get('uiStep').then(s=>selectStep(s.uiStep||'lead',false));

// Outcomes stay tied to the real worker result, including partial saves.
const BA=globalThis.BridgeActions;
BA.bind('capture',{busy:'Récupération du lead…',done:'Lead récupéré',message:'Lead récupéré. Vérifie les informations ci-dessous.',resetAfter:2400,successDuration:200,after(){for(const id of ['fill','createProspect','quote','quote-contacts'])BA.reset(id);ToolboxMotion.text($('leadTitle'),{duration:140});}});
BA.bind('fill',{progressLabel:'Remplissage du prospect…',busy:'Remplissage du prospect…',done:'Formulaire rempli',message:'Formulaire rempli. Vérifie le rapport avant de créer le prospect.',after(){BA.reset('createProspect');ToolboxMotion.text($('report'));}});
BA.bind('createProspect',{busy:'Création du prospect…',done:'Prospect créé',message:'Prospect créé. Tu peux passer à la soumission.',state:r=>r?.verified&&r.account&&!r.dimensionsPending?'success':'warning',warning:'Vérifie le prospect et ses dimensions dans D365 avant de continuer.',terminal:r=>!!(r?.account||r?.verified||r?.dimensionsPending),after(){ToolboxMotion.success($('successCard'));}});
BA.bind('quote',{busy:'Création de la soumission…',done:'Soumission ouverte',message:'Soumission ouverte. Vérifie puis enregistre dans D365.',state:r=>r?.contactsPending||!r?.number?'warning':'success',warning:'Vérifie la soumission et les coordonnées dans D365. Ne la recrée pas.',terminal:r=>!!(r?.clicked||r?.number||r?.contactsPending)});
BA.bind('quote-contacts',{busy:'Remplissage des coordonnées…',done:'Coordonnées remplies',message:'Coordonnées remplies. Vérifie puis enregistre la soumission dans D365.',terminal:r=>!!r?.contacts?.filled});
BA.bind('quote-open',{busy:'Ouverture de D365…',done:'Soumission affichée',message:'Onglet de la soumission affiché.'});
BA.bind('searchCompany',{busy:'Recherche des coordonnées…',done:'Coordonnées trouvées',message:'Vérifie la proposition avant de l’utiliser.'});
BA.bind('locate',{busy:'Localisation en cours…',done:'Adresse localisée',message:'Adresse trouvée. Vérifie le territoire proposé.',state:r=>r?.locations?.length?'success':'warning',warning:'Adresse à vérifier. Choisis le territoire manuellement.'});
BA.bind('diagnose',{busy:'Lecture du diagnostic…',done:'Diagnostic prêt',message:'Diagnostic disponible ci-dessous.'});

const displayedVersion=document.querySelector('#tool-bridge .version');if(displayedVersion)displayedVersion.textContent='v'+chrome.runtime.getManifest().version+' · Équipe';
