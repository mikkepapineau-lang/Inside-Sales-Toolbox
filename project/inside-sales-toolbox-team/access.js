(()=>{
const groups=[
 {label:'Dynamics 365',origins:['https://solotech.operations.dynamics.com/*']},
 {label:'Power BI',origins:['https://app.powerbi.com/*']},
 {label:'Salesforce',origins:['https://*.salesforce.com/*','https://*.force.com/*']},
 {label:'Canada.ca · vérificateur HS',origins:['https://www.canada.ca/*']},
 {label:'Localisation des adresses',origins:['https://photon.komoot.io/*']},
 {label:'Recherche des compagnies · sites HTTPS',origins:['https://*/*']},
 {label:'Copier dans le presse-papiers',permissions:['clipboardWrite']}
];
const request={origins:['https://*/*'],permissions:['clipboardWrite']};
let generation=0;
async function check(){
 const n=++generation;
 const missing=[];
 for(const g of groups){const {label,...p}=g;if(!await chrome.permissions.contains(p))missing.push(label);}
 if(n!==generation)return;
 const panel=document.getElementById('tool-access'),list=document.getElementById('tool-access-list');
 panel.hidden=!missing.length;list.textContent=missing.length?'Accès à autoriser : '+missing.join(' · '):'';
 document.getElementById('tool-access-state').textContent=missing.length?'Autorise les accès pour activer tous tes outils.':'Tous les accès sont prêts.';
 return missing;
}
async function grant(){
 const button=document.getElementById('tool-access-grant');
 // Invoke directly during the click, before any asynchronous permission check.
 const pending=chrome.permissions.request(request);
 button.disabled=true;
 try{const ok=await pending;await check();if(!ok){document.getElementById('tool-access-state').textContent='Certains accès n’ont pas été accordés. Tu peux réessayer avec ce bouton.';document.querySelector('.access-details').open=true;}}
 catch(e){document.getElementById('tool-access').hidden=false;document.getElementById('tool-access-state').textContent='Autorisation impossible : '+e.message;document.querySelector('.access-details').open=true;}
 finally{button.disabled=false;}
}
async function requireAccess(p,label){
 if(await chrome.permissions.contains(p))return;
 await check();
 throw Error('Accès manquant : '+label+'. Clique sur « Autoriser tous les accès » en haut du Toolbox.');
}
globalThis.ToolboxAccess={check,grant,requireAccess};
document.getElementById('tool-access-grant').onclick=grant;
chrome.permissions.onAdded.addListener(()=>check().catch(()=>{}));
chrome.permissions.onRemoved.addListener(()=>check().catch(()=>{}));
window.addEventListener('focus',()=>check().catch(()=>{}));
check().catch(e=>{document.getElementById('tool-access-state').textContent='Vérification des accès impossible : '+e.message;});
})();
