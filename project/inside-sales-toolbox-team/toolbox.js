(()=>{
const el=id=>document.getElementById(id),M=ContactModel;
let restoring=true,contextTab=null,selectedDuringRestore=false,lastActivity=0,activityTimer,productKind='new',activeModule='home';
if(new URLSearchParams(location.search).has('toolboxWindow'))document.body.classList.add('toolbox-window');
function persist(){
 if(restoring)return;
 const snapshot={raw:el('contact-raw').value,...draft(),warning:el('contact-warning').textContent};
 chrome.storage.local.set({toolboxContacts:snapshot}).catch(()=>{el('contact-status').textContent='Impossible de conserver les coordonnées. Copie-les avant de fermer.';});
}
function module(name,remember=true){
 name=ToolboxNavigation.normalize(name);const previousModule=document.body.dataset.module,previousKind=productKind;
 const isProducts=['products','used','nonreserved'].includes(name),visible=isProducts?'products':name;if(isProducts)productKind=name==='products'?'new':name;activeModule=name;
 const changed=previousModule!==visible||isProducts&&previousKind!==productKind;document.body.dataset.module=visible;document.body.dataset.productKind=productKind;
 if(remember){selectedDuringRestore=true;ToolboxNavigation.remember(name).catch(()=>{});lastActivity=Date.now();}
 if(name==='hs'&&!el('hs-frame').src)el('hs-frame').src='hs/popup.html';
 el('tool-home-panel').hidden=name!=='home';
 for(const b of document.querySelectorAll('.module-tabs [data-module]')){const selected=b.dataset.module===visible;b.classList.toggle('is-active',selected);b.setAttribute('aria-current',selected?'page':'false');}
 for(const n of ['bridge','contacts','hs','products','powerbi','calculator'])el('tool-'+n).hidden=n!==visible;
 el('products-new-panel').hidden=productKind!=='new';el('tool-used').hidden=productKind!=='used';el('tool-nonreserved').hidden=productKind!=='nonreserved';
 for(const kind of ['new','used','nonreserved']){el('products-tab-'+kind).setAttribute('aria-selected',String(kind===productKind));el('products-tab-'+kind).tabIndex=kind===productKind?0:-1;}
 el('tool-home').hidden=name==='home';
 if(changed&&!restoring){globalThis.ToolboxMotion?.enter(el(isProducts?(productKind==='new'?'products-new-panel':'tool-'+productKind):name==='home'?'tool-home-panel':'tool-'+name));globalThis.ToolboxMotion?.navigation(document.querySelector('.module-tabs [data-module="'+visible+'"]'));}
 el('tool-label').textContent={home:'Ton espace de travail',bridge:'Salesforce → D365',contacts:'Coordonnées client',hs:'Vérificateur HS',products:'Recherche de produits',powerbi:'Commandes prêtes',calculator:'Marge et devises'}[visible];
 if(name==='calculator')globalThis.ToolboxCalculator?.activate();
}
for(const kind of ['new','used','nonreserved']){
 const button=el('products-tab-'+kind),select=next=>module(next==='new'?'products':next);button.onclick=()=>select(kind);
 button.addEventListener('keydown',e=>{let next;if(['ArrowLeft','ArrowRight'].includes(e.key))next=['new','used','nonreserved'][(['new','used','nonreserved'].indexOf(kind)+(e.key==='ArrowRight'?1:2))%3];if(e.key==='Home')next='new';if(e.key==='End')next='nonreserved';if(next){e.preventDefault();select(next);el('products-tab-'+next).focus();}});
}
el('tool-home').onclick=()=>module('home');
for(const b of document.querySelectorAll('[data-module]'))b.onclick=async()=>{
 if(b.dataset.module==='hs'){
 const ok=await chrome.permissions.contains({origins:['https://www.canada.ca/*']});
 module('hs');if(!el('hs-frame').src)el('hs-frame').src='hs/popup.html';
 if(!ok)el('tool-label').textContent='Vérificateur HS · actualisation non autorisée';
 }else module(b.dataset.module==='products'&&productKind!=='new'?productKind:b.dataset.module);
};
function draft(){return {name:el('contact-name').value,phone:el('contact-phone').value,email:el('contact-email').value};}
function preview(){try{el('contact-preview').value=M.values(draft()).notes;}catch{el('contact-preview').value='';}}
function fillEditor(d){for(const k of ['name','phone','email'])el('contact-'+k).value=d[k]||'';preview();}
el('contact-from-lead').onclick=async()=>{
 const button=el('contact-from-lead');button.disabled=true;
 try{
  const {lead}=await chrome.storage.session.get('lead');
  if(!lead?.data||!Number.isFinite(lead.at)||Date.now()-lead.at>=8*60*60*1000)throw Error('Récupère d’abord un lead dans le module Salesforce vers Dynamics, puis reviens ici.');
  const values=M.fromLead(lead.data);
  if(!Object.values(values).some(Boolean))throw Error('Ce lead ne contient aucune coordonnée de contact. Vérifie les données dans le module Salesforce vers Dynamics.');
  fillEditor(values);el('contact-raw').value=[values.name,values.phone,values.email].filter(Boolean).join('\n');
  const missing=[!values.name?'nom':'',!M.phone(values.phone)?'téléphone valide':'',!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)?'courriel valide':''].filter(Boolean);
  el('contact-warning').textContent=missing.length?'À compléter : '+missing.join(', ')+'.':'';
  el('contact-status').textContent='Contact du lead repris. Vérifie les coordonnées avant de copier ou remplir D365.';
  persist();
 }catch(e){el('contact-status').textContent=e.message;}finally{button.disabled=false;}
};
el('contact-parse').onclick=()=>{const d=M.parse(el('contact-raw').value);fillEditor(d);el('contact-warning').textContent=d.warnings.join(' ');el('contact-status').textContent='Vérifie les trois champs avant de les appliquer.';persist();};
for(const k of ['name','phone','email'])el('contact-'+k).oninput=()=>{preview();el('contact-status').textContent='';persist();};
el('contact-raw').oninput=persist;
function normalized(){const v=M.values(draft());fillEditor(v);persist();return v;}
el('contact-copy').onclick=async()=>{try{await ToolboxAccess.requireAccess({permissions:['clipboardWrite']},'presse-papiers');await navigator.clipboard.writeText(normalized().notes);el('contact-status').textContent='Notes copiées.';}catch(e){el('contact-status').textContent=e.message;}};
el('contact-fill').onclick=async()=>{
 const b=el('contact-fill');b.disabled=true;
 try{
 const v=normalized();await ToolboxAccess.requireAccess({origins:['https://solotech.operations.dynamics.com/*']},'Dynamics 365');let [tab]=await chrome.tabs.query({active:true,currentWindow:true});
 if(new URLSearchParams(location.search).has('toolboxWindow')&&contextTab){try{tab=await chrome.tabs.get(contextTab);}catch{}}
 if(!tab?.id||new URL(tab.url).hostname!=='solotech.operations.dynamics.com')throw Error('Ouvre l’extension depuis ta soumission ou commande D365.');
 await chrome.scripting.executeScript({target:{tabId:tab.id},files:['d365-controls.js','contact-fill.js']});
 const [r]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:async values=>{try{return {value:await globalThis.fillClientContacts(values)};}catch(e){return {error:e.message};}},args:[v]});
 if(r.result?.error)throw Error(r.result.error);
 if(!r.result?.value)throw Error('Aucune confirmation reçue. Vérifie les champs dans D365.');
 el('contact-status').textContent=r.result.value.report.join(', ')+' remplis. Vérifie puis enregistre dans D365.';
 }catch(e){el('contact-status').textContent=e.message;}finally{b.disabled=false;}
};
el('contact-diagnostic').onclick=async()=>{
 try{
  await ToolboxAccess.requireAccess({origins:['https://solotech.operations.dynamics.com/*']},'Dynamics 365');
  let [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(new URLSearchParams(location.search).has('toolboxWindow')&&contextTab)tab=await chrome.tabs.get(contextTab);
  if(!tab?.id||new URL(tab.url).hostname!=='solotech.operations.dynamics.com')throw Error('Ouvre l’extension depuis la soumission ou commande D365.');
  await chrome.scripting.executeScript({target:{tabId:tab.id},files:['d365-controls.js','contact-fill.js']});
  const [r]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>globalThis.diagnoseClientContacts()});
  el('contact-diagnostic-output').hidden=false;el('contact-diagnostic-output').value=JSON.stringify(r.result,null,2);
 }catch(e){el('contact-status').textContent=e.message;}
};
el('contact-clear').onclick=()=>{fillEditor({});el('contact-raw').value='';el('contact-warning').textContent='';el('contact-status').textContent='Coordonnées effacées.';persist();};
el('toolbox-quick-text').oninput=()=>chrome.storage.local.set({toolboxQuick:{text:el('toolbox-quick-text').value,label:'Texte formaté'}});
el('toolbox-quick-copy').onclick=async()=>{try{await ToolboxAccess.requireAccess({permissions:['clipboardWrite']},'presse-papiers');await navigator.clipboard.writeText(el('toolbox-quick-text').value);el('contact-status').textContent='Texte formaté copié.';}catch(e){el('contact-status').textContent=e.message;}};
el('toolbox-quick-clear').onclick=()=>{el('toolbox-quick').hidden=true;chrome.storage.local.remove('toolboxQuick');};
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='session'&&changes[ToolboxNavigation.key]?.newValue){selectedDuringRestore=true;module(ToolboxNavigation.resolve(changes[ToolboxNavigation.key].newValue),false);}});
module('home',false);
function activity(){
 if(restoring||Date.now()-lastActivity<15000)return;
 clearTimeout(activityTimer);activityTimer=setTimeout(()=>{lastActivity=Date.now();ToolboxNavigation.remember(activeModule).catch(()=>{});},100);
}
for(const event of ['pointerdown','keydown','input','scroll'])document.addEventListener(event,activity,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{
 if(!restoring&&document.visibilityState==='visible')chrome.storage.session.get(ToolboxNavigation.key).then(saved=>module(ToolboxNavigation.resolve(saved[ToolboxNavigation.key]),false)).catch(()=>{});
});
const inputs=['contact-raw','contact-name','contact-phone','contact-email','contact-parse','contact-from-lead','contact-clear','contact-copy','contact-fill'];
for(const id of inputs)el(id).disabled=true;
Promise.all([chrome.storage.local.get(['toolboxContacts','toolboxQuick','toolboxContextTab','toolboxContextError']),chrome.storage.session.get(ToolboxNavigation.key)]).then(([saved,session])=>{
 contextTab=saved.toolboxContextTab;
 const q=saved.toolboxQuick;el('toolbox-quick').hidden=!q;if(q){el('toolbox-quick-text').value=q.text||'';el('toolbox-quick-label').textContent=q.label||'Texte formaté';}
 if(saved.toolboxContextError){el('contact-status').textContent=saved.toolboxContextError;chrome.storage.local.remove('toolboxContextError');}
 const d=saved.toolboxContacts;
 if(d){el('contact-raw').value=d.raw||'';fillEditor(d);el('contact-warning').textContent=d.warning||'';}
 if(!selectedDuringRestore)module(ToolboxNavigation.resolve(session[ToolboxNavigation.key]),false);
}).catch(()=>{el('contact-status').textContent='Impossible de restaurer les coordonnées.';}).finally(()=>{
 restoring=false;for(const id of inputs)el(id).disabled=false;
 lastActivity=Date.now();ToolboxNavigation.remember(activeModule).catch(()=>{});
 globalThis.ToolboxMotion?.enter(el(document.body.dataset.module==='home'?'tool-home-panel':'tool-'+document.body.dataset.module));if(activeModule==='calculator')globalThis.ToolboxCalculator?.activate();
});
})();
