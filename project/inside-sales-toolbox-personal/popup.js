const $=id=>document.getElementById(id);const B=Bridge;let data=B.normalize({}),currentScan=null,tabId=null;const TTL=8*60*60*1000;
function relevant(){return B.fields.filter(([k])=>k!=='type'&&(data.type==='Person'?k!=='company':!['first','last'].includes(k)));}
function status(s){$('status').textContent=s;if($('quoteStatus'))$('quoteStatus').textContent=s;}
async function save(){B.capitalizeNames(data);updateLeadBanner();const old=await chrome.storage.session.get('lead');await chrome.storage.session.set({lead:{...(old.lead||{}),data,at:old.lead?.at||Date.now()}});}
function render(){if(data.tax==='Hst_on')data.tax='HST_ON';B.capitalizeNames(data);
$('editor').replaceChildren();const groupMap={};
for(const [title,keys] of [['Identité',['type','company','first','last']],['Contact',['phoneName','phone','extension','emailName','email']],['Adresse',['street','city','state','postal','country']],['Paramètres D365',['language','currency','typeId','delivery','terms','tax']]]){
 const fieldset=document.createElement('fieldset'),legend=document.createElement('legend'),grid=document.createElement('div');legend.textContent=title;grid.className='field-grid';fieldset.append(legend,grid);$('editor').append(fieldset);for(const key of keys)groupMap[key]=grid;
}
for(const [key,label] of B.fields){if(data.type==='Person'&&key==='company'||data.type==='Organization'&&['first','last'].includes(key))continue;
const l=document.createElement('label');l.textContent=key==='type'?'Organisation ou Personne ?':label;let input;
if(key==='type'||key==='tax'){input=document.createElement('select');const choices=key==='type'?['Organization','Person']:['',...Object.values(B.tax)];for(const value of choices){const o=new Option(key==='type'?(value==='Organization'?'Organisation':'Personne'):(value||'À choisir'),value);input.add(o);}}else input=document.createElement('input');
input.id='value-'+key;input.value=data[key]||'';input.addEventListener('change',async()=>{if(key==='type')B.switchType(data,input.value);else data[key]=input.value;if(key==='phone'){const parsed=B.phone(input.value);data.phone=parsed.value;input.value=data.phone;if(parsed.extension){data.extension=parsed.extension;const ext=$('value-extension');if(ext)ext.value=data.extension;}}if(['street','city','state','postal','country','phone'].includes(key))quoteDefaults();if(['phone','state','postal','country'].includes(key)){B.updateTax(data);const t=$('value-tax');if(t)t.value=data.tax;$('taxNote').textContent=data.taxNote;}if(key==='tax'){data.taxSource='manual';data.taxNote='Taxe choisie manuellement.';$('taxNote').textContent=data.taxNote;}await save();input.value=data[key]||'';if(key==='type'){currentScan=null;render();}});l.append(input);if(['type','company','street','email','tax'].includes(key))l.classList.add('full');(groupMap[key]||$('editor')).append(l);
} updateLeadBanner();$('taxNote').textContent=data.taxNote||B.taxForData(data).note;quoteDefaults();
}
async function active(){const [t]=await chrome.tabs.query({active:true,currentWindow:true});if(!t?.id)throw Error('Onglet introuvable.');return t;}
async function page(method,arg,target){const t=target||await active();await chrome.scripting.executeScript({target:{tabId:t.id},files:['page.js']});const [r]=await chrome.scripting.executeScript({target:{tabId:t.id},func:async(m,a)=>{try{return {value:await globalThis.solotechBridge[m](a)}}catch(e){return {error:e.message}}},args:[method,arg||null]});if(r.result?.error)throw Error(r.result.error);if(!r.result)throw Error('Page inaccessible.');return r.result.value;}
function safe(fn){return async()=>{try{await fn();}catch(e){status(e.message);}};}
$('capture').onclick=safe(async()=>{$('successCard').hidden=true;const result=await page('read');data=B.updateTax(B.normalize(result.data));quoteAddress='';$('quote').disabled=false;await chrome.storage.session.remove(['d365Record','d365LastResult','d365Status']);await chrome.storage.session.set({lead:{data,at:Date.now(),source:result.url},report:[]});currentScan=null;$('report').textContent='';render();$('source').textContent=result.url;status(['Lead récupéré. Vérifie le nom, la compagnie, l’adresse et la taxe.',data.type==='Person'?'Courriel personnel reconnu : Personne proposée. Vérifie le prénom et le nom.':'Organisation sélectionnée par défaut. Complète le nom de compagnie au besoin.',...result.warnings].filter(Boolean).join('\n'));});


async function allowD365(){if(!await chrome.permissions.contains({origins:['https://solotech.operations.dynamics.com/*']}))throw Error('Clique sur Préparer tous les accès avant de continuer.');}
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
function expectedName(){return data.type==='Organization'?data.company:[data.first,data.last].filter(Boolean).join(' ');}
$('fill').onclick=safe(async()=>{
 await allowD365();const lead=(await chrome.storage.session.get('lead')).lead;if(!lead||Date.now()-lead.at>TTL)throw Error('Récupère le lead de nouveau.');
 data.phone=B.phone(data.phone).value;await save();$('fill').disabled=true;status('Ouverture et remplissage de D365 en arrière-plan…');
 try{const result=await d365Action('fill',{data,overwrite:false});const full=[...result.report,'','Valeurs dans D365 :',...result.actual];$('report').textContent=full.join('\n');await chrome.storage.session.set({report:full});$('createProspect').disabled=false;status(result.message);}finally{$('fill').disabled=false;}
});
$('createProspect').onclick=safe(async()=>{
 await allowD365();await resolveTerritory();await save();$('createProspect').disabled=true;try{const r=await d365Action('confirm',{expectedName:expectedName(),data,territory:data.territory||'MONTREAL',office:data.office||'MONTREAL'});status(r.message);showSuccess(r);}catch(e){$('createProspect').disabled=false;throw e;}
});
$('showD365').onclick=safe(async()=>{await allowD365();await d365Action('show');});
function emailDomain(){const d=B.domain(data.email);if(!d)throw Error('Domaine d’entreprise absent ou courriel personnel.');return d;}

$('searchCompany').onclick=safe(async()=>{
 const domain=emailDomain();
 const origins=['https://'+domain+'/*','https://www.'+domain+'/*'];
 // Called directly from the click so Edge can request only this site's access.
 const allowed=await chrome.permissions.contains({origins});
 if(!allowed)throw Error('Accès au site non accordé. Tu peux saisir les coordonnées manuellement.');
 const email=data.email;await save();$('searchCompany').disabled=true;status('Recherche des coordonnées en cours…');$('companyResults').replaceChildren();
 try{const result=await chrome.runtime.sendMessage({kind:'companyLookup',domain});if(result?.error)throw Error(result.error);if(data.email!==email)return;
 if(!result?.candidates?.length)throw Error('Aucune coordonnée structurée exploitable trouvée sur le site. Vérifie l’adresse manuellement.');
 showCompany(result,domain);status('Coordonnées trouvées : vérifie la proposition avant de l’utiliser.');
 }finally{$('searchCompany').disabled=false;}
});
function showCompany(result,domain){
 $('companyResults').replaceChildren();for(const candidate of result.candidates){const box=document.createElement('div');const info=document.createElement('p');info.textContent=[candidate.company,candidate.street,candidate.city,candidate.state,candidate.postal,candidate.country].filter(Boolean).join(' — ');const source=document.createElement('p');source.textContent='Source : '+candidate.source;
 const use=document.createElement('button');use.textContent='Utiliser ces coordonnées';use.onclick=safe(async()=>{if(emailDomain()!==domain)throw Error('Le courriel a changé. Relance la recherche.');B.applyCompany(data,candidate);await save();render();$('companyResults').replaceChildren();status('Coordonnées reprises et taxe recalculée selon l’adresse. La langue du lead est conservée.');});box.append(info,source,use);$('companyResults').append(box);}
}

const addressKey=()=>[data.street,data.city,data.state,data.postal,data.country,data.phone].join('|');
let quoteAddress='';
function quoteDefaults(){
 if(quoteAddress===addressKey())return;quoteAddress=addressKey();
 const guess=Territories.infer(data);Object.assign(data,guess,{territoryResolved:false,territoryManual:false});
 $('territory').value=data.territory;$('warehouse').value=data.warehouse;$('locations').replaceChildren();
}
for(const name of ['',...Territories.names])$('territory').add(new Option(name||'À déterminer',name));
for(const name of ['','YUL-01','QUE-01','TOR-01','OTT-01'])$('warehouse').add(new Option(name||'Choisir un entrepôt',name));
$('territory').onchange=safe(async()=>{data.territoryManual=true;data.territory=$('territory').value;data.warehouse=Territories.warehouses[data.territory]||'';$('warehouse').value=data.warehouse;await save();});
$('warehouse').onchange=safe(async()=>{data.warehouse=$('warehouse').value;await save();});
$('locate').onclick=safe(async()=>{
 const allowed=await chrome.permissions.contains({origins:['https://photon.komoot.io/*']});if(!allowed)throw Error('Localisation non autorisée : choisis le territoire dans la liste.');
 const key=addressKey();const address=[data.street,data.city,data.state,data.postal,data.country==='CAN'?'Canada':data.country].filter(Boolean).join(', ');
 if(!data.city&&!data.postal)throw Error('Complète la ville ou le code postal.');
 $('locate').disabled=true;status('Localisation de l’adresse…');
 try{const result=await chrome.runtime.sendMessage({kind:'geocodeAddress',address});if(result.error)throw Error(result.error);if(key!==addressKey())throw Error('L’adresse a changé : relance la localisation.');$('locations').replaceChildren();
 for(const location of result.locations||[]){const territory=Territories.nearest(location.lat,location.lon,location.country);const box=document.createElement('p');box.textContent=location.label+(territory?' → '+territory:' — territoire à choisir manuellement');if(territory){const use=document.createElement('button');use.textContent='Retenir '+territory;use.onclick=safe(async()=>{if(key!==addressKey())throw Error('L’adresse a changé.');data.territoryResolved=true;data.territory=territory;data.warehouse=Territories.warehouses[territory]||'';$('territory').value=territory;$('warehouse').value=data.warehouse;await save();$('locations').replaceChildren();status('Territoire retenu. Vérifie l’entrepôt avant de créer la soumission.');});box.append(use);}$('locations').append(box);}
 status(result.locations?.length?'Vérifie l’adresse trouvée et retiens le territoire correspondant.':'Adresse introuvable : choisis le territoire manuellement.');
 }finally{$('locate').disabled=false;}
});

async function resolveTerritory(){
 const guess=Territories.infer(data);let territory=guess.territory;
 if((data.city||data.postal||data.street)&&!guess.exactCity){
  if(!await chrome.permissions.contains({origins:['https://photon.komoot.io/*']}))throw Error('Clique sur Préparer tous les accès pour calculer la région selon l’adresse.');
  const address=[data.street,data.city,data.state,data.postal,data.country].filter(Boolean).join(', ');
  try{const r=await chrome.runtime.sendMessage({kind:'geocodeAddress',address});const point=r?.locations?.[0];if(point)territory=Territories.nearest(point.lat,point.lon,point.country)||territory;}catch{}
 }
 data.territory=territory;data.office=Territories.officeFor(territory);data.warehouse=Territories.warehouses[data.office]||'YUL-01';data.territoryResolved=true;
 $('territory').value=territory;$('warehouse').value=data.warehouse;
}

$('quote').onclick=safe(async()=>{
 status('Préparation de la soumission…');
 await allowD365();await resolveTerritory();await save();if(!Territories.names.includes(data.territory)||!['YUL-01','QUE-01','TOR-01','OTT-01'].includes(data.warehouse))throw Error('Choisis le territoire et l’entrepôt.');
 $('quote').disabled=true;status('Ouverture du prospect et création de soumission en arrière-plan…');
 try{const result=await d365Action('quote',{territory:data.territory,office:data.office||'MONTREAL',warehouse:data.warehouse,expectedName:expectedName()});status(result.message);await chrome.storage.session.set({quoteResult:result});}catch(e){$('quote').disabled=false;throw e;}
});
$('clear').onclick=safe(async()=>{$('successCard').hidden=true;await chrome.storage.session.clear();data=B.normalize({});currentScan=null;$('report').textContent='';$('source').textContent='';$('companyResults').replaceChildren();render();selectStep('lead');status('Données du lead effacées.');});
(async()=>{const s=await chrome.storage.session.get(['lead','report','d365Status','d365LastResult']);if(s.lead&&Date.now()-s.lead.at<TTL){data=s.lead.data;if(!data.taxSource)B.updateTax(data);if(data.territory)quoteAddress=addressKey();$('territory').value=data.territory||'';$('warehouse').value=data.warehouse||'';$('source').textContent=s.lead.source||'';$('report').textContent=(s.report||[]).join('\n');}else await chrome.storage.session.clear();render();if(s.d365Status)status(s.d365Status);showSuccess(s.d365LastResult);if(s.d365LastResult?.report)$('report').textContent=[...s.d365LastResult.report,'',...(s.d365LastResult.actual||[])].join('\n');})();

chrome.storage.onChanged.addListener((changes,area)=>{
 if(area==='session'&&changes.d365Status)status(changes.d365Status.newValue||'');
});
$('diagnose').onclick=safe(async()=>{
 status('Lecture du diagnostic…');await allowD365();
 const result=await d365Action('diagnose');
 $('diagnostic').hidden=false;$('diagnostic').value=JSON.stringify(result.diagnostic,null,2);
 $('diagnostic').select();status('Diagnostic prêt : copie le texte ci-dessous et envoie-le-moi. Aucune valeur client incluse.');
});

function updateLeadBanner(){
 const name=(data.type==='Organization'?data.company:[data.first,data.last].filter(Boolean).join(' '))||data.contact;
 $('leadTitle').textContent=name||'Aucun lead sélectionné';
 $('leadSubtitle').textContent=data.email||(name?(data.type==='Organization'?'Organisation':'Personne'):'Commence par une fiche Salesforce');
 $('leadInitials').textContent=name?name.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase():'—';
}
function selectStep(step,remember=true){
 if(!['lead','prospect','quote'].includes(step))return;
 for(const name of ['lead','prospect','quote']){
  $('panel-'+name).hidden=name!==step;
  $('tab-'+name).setAttribute('aria-selected',String(name===step));
  $('tab-'+name).tabIndex=name===step?0:-1;
 }
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
chrome.storage.session.get('uiStep').then(s=>{if(s.uiStep)selectStep(s.uiStep,false);});
