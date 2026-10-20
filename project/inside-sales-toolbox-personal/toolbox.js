(()=>{
const el=id=>document.getElementById(id),M=ContactModel;
let restoring=true,contextTab=null;
if(new URLSearchParams(location.search).has('toolboxWindow'))document.body.classList.add('toolbox-window');
function persist(){
 if(restoring)return;
 const snapshot={raw:el('contact-raw').value,...draft(),warning:el('contact-warning').textContent};
 chrome.storage.local.set({toolboxContacts:snapshot}).catch(()=>{el('contact-status').textContent='Impossible de conserver les coordonnées. Copie-les avant de fermer.';});
}
function module(name){
 if(!['home','bridge','contacts','hs','products'].includes(name))name='home';
 if(!restoring)chrome.storage.local.set({toolboxModule:name});
 if(name==='hs'&&!el('hs-frame').src)el('hs-frame').src='hs/popup.html';
 el('tool-home-panel').hidden=name!=='home';
 for(const n of ['bridge','contacts','hs','products'])el('tool-'+n).hidden=n!==name;
 el('tool-home').hidden=name==='home';
 el('tool-label').textContent={home:'Tes outils de ventes internes',bridge:'Salesforce vers Dynamics',contacts:'Coordonnées client',hs:'Vérificateur HS',products:'Product Search D365'}[name];
}
el('tool-home').onclick=()=>module('home');
for(const b of document.querySelectorAll('[data-module]'))b.onclick=async()=>{
 if(b.dataset.module==='hs'){
 const ok=await chrome.permissions.contains({origins:['https://www.canada.ca/*']});
 module('hs');if(!el('hs-frame').src)el('hs-frame').src='hs/popup.html';
 if(!ok)el('tool-label').textContent='Vérificateur HS · actualisation non autorisée';
 }else module(b.dataset.module);
};
function draft(){return {name:el('contact-name').value,phone:el('contact-phone').value,email:el('contact-email').value};}
function preview(){try{el('contact-preview').value=M.values(draft()).notes;}catch{el('contact-preview').value='';}}
function fillEditor(d){for(const k of ['name','phone','email'])el('contact-'+k).value=d[k]||'';preview();}
el('contact-from-lead').onclick=async()=>{
 const button=el('contact-from-lead');button.disabled=true;
 try{
  const {lead}=await chrome.storage.session.get('lead');
  if(!lead?.data||!Number.isFinite(lead.at)||Date.now()-lead.at>=8*60*60*1000)throw Error('Récupère d’abord un lead dans le module Salesforce vers Dynamics, puis reviens ici.');
  const d=lead.data,parsed=Bridge.phone(d.phone||'');
  const fullName=[d.first,d.last].filter(Boolean).join(' ');
  const name=String(d.phoneName||d.contact||d.emailName||fullName||'').trim();
  const rawPhone=parsed.value+(d.extension||parsed.extension?' #'+String(d.extension||parsed.extension).trim():'');
  const values={name:name?M.title(name):'',phone:M.phone(rawPhone)||rawPhone,email:String(d.email||'').trim().toLowerCase()};
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
el('contact-clear').onclick=()=>{fillEditor({});el('contact-raw').value='';el('contact-warning').textContent='';el('contact-status').textContent='Coordonnées effacées.';persist();};
el('toolbox-quick-text').oninput=()=>chrome.storage.local.set({toolboxQuick:{text:el('toolbox-quick-text').value,label:'Texte formaté'}});
el('toolbox-quick-copy').onclick=async()=>{try{await ToolboxAccess.requireAccess({permissions:['clipboardWrite']},'presse-papiers');await navigator.clipboard.writeText(el('toolbox-quick-text').value);el('contact-status').textContent='Texte formaté copié.';}catch(e){el('contact-status').textContent=e.message;}};
el('toolbox-quick-clear').onclick=()=>{el('toolbox-quick').hidden=true;chrome.storage.local.remove('toolboxQuick');};
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.toolboxModule)module(changes.toolboxModule.newValue);});
module('home');
const inputs=['contact-raw','contact-name','contact-phone','contact-email','contact-parse','contact-from-lead','contact-clear','contact-copy','contact-fill'];
for(const id of inputs)el(id).disabled=true;
chrome.storage.local.get(['toolboxModule','toolboxContacts','toolboxQuick','toolboxContextTab','toolboxContextError']).then(saved=>{
 contextTab=saved.toolboxContextTab;
 const q=saved.toolboxQuick;el('toolbox-quick').hidden=!q;if(q){el('toolbox-quick-text').value=q.text||'';el('toolbox-quick-label').textContent=q.label||'Texte formaté';}
 if(saved.toolboxContextError){el('contact-status').textContent=saved.toolboxContextError;chrome.storage.local.remove('toolboxContextError');}
 const d=saved.toolboxContacts;
 if(d){el('contact-raw').value=d.raw||'';fillEditor(d);el('contact-warning').textContent=d.warning||'';}
 module(saved.toolboxModule||'home');
}).catch(()=>{el('contact-status').textContent='Impossible de restaurer les coordonnées.';}).finally(()=>{restoring=false;for(const id of inputs)el(id).disabled=false;});
})();
