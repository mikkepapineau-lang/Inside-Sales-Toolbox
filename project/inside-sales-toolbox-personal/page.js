(()=>{
if(globalThis.solotechBridge?.version==='1.8.10')return;
const visible=e=>!!(e.getClientRects().length)&&getComputedStyle(e).visibility!=='hidden';
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[*:]/g,'').replace(/\s+/g,' ').trim();
function roots(){const out=[document];for(let i=0;i<out.length;i++)for(const e of out[i].querySelectorAll('*'))if(e.shadowRoot)out.push(e.shadowRoot);return out;}
const query=s=>roots().flatMap(r=>Array.from(r.querySelectorAll(s)));
// Read only field content; Salesforce puts accessible Edit labels inside controls.
function fieldText(container){
 const ignored='button,[role="button"],lightning-button,lightning-button-icon,input,select,textarea,svg,script,style,.slds-assistive-text,.assistiveText,.inline-edit-trigger,[hidden],[aria-hidden="true"]';
 function walk(node){
  if(node.nodeType===3)return node.textContent||'';
  if(node.nodeType!==1&&node.nodeType!==11)return '';
  if(node.nodeType===1){
   if(node.matches(ignored))return '';
   const style=getComputedStyle(node);if(style.display==='none'||style.visibility==='hidden')return '';
   if(node.tagName==='BR')return '\n';
  }
  const children=node.shadowRoot?node.shadowRoot.childNodes:node.childNodes;
  const text=Array.from(children||[]).map(walk).join('');
  return node.nodeType===1&&/^(DIV|P|LI)$/.test(node.tagName)?text+'\n':text;
 }
 return walk(container).replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').trim();
}
function read(){
if(!/(^|\.)(lightning\.force\.com|my\.salesforce\.com)$/.test(location.hostname)||!/(\/Lead\/|\/00Q)/.test(location.pathname))throw Error('Ouvre la fiche du lead Salesforce, onglet Details, puis réessaie.');
const aliases={contact:['Name','Nom'],company:['Company','Société','Compagnie'],email:['Email','E-mail','Courriel'],phone:['Phone','Téléphone'],mobile:['Mobile'],extension:['Ext.','Extension'],preferredLanguage:['Preferred Language','Preferred language','Langue préférée','Langue de communication'],language:['Language','Langue'],currency:['Lead Currency','Devise du lead'],country:['Country','Pays'],street:['Street','Rue'],city:['City','Ville'],state:['State/Province','State','Province'],postal:['Zip/Postal Code','Postal Code','Code postal'],first:['First Name','Prénom'],last:['Last Name','Nom de famille']};
const values={};
for(const row of query('records-record-layout-item,.slds-form-element')){
if(!visible(row))continue;const label=row.querySelector('.test-id__field-label,.slds-form-element__label');const value=row.querySelector('.test-id__field-value,.slds-form-element__control');if(label&&value){const key=norm(label.innerText);const v=fieldText(value);if(v){if(!values[key])values[key]=new Set();values[key].add(v);}}
}
const data={};const warnings=[];
for(const [key,names] of Object.entries(aliases)){const candidates=new Set(names.flatMap(n=>Array.from(values[norm(n)]||[])));if(candidates.size===1)data[key]=Array.from(candidates)[0];else if(candidates.size>1)warnings.push('Plusieurs valeurs pour '+names[0]+' : vérifier manuellement.');}
if(data.currency)data.currency=data.currency.match(/\b[A-Z]{3}\b/)?.[0]||'';
if(!data.contact&&!data.company&&!data.email)throw Error('Champs du lead introuvables. Ouvre Details et assure-toi que Name, Company et Email sont visibles.');
return {data,warnings,url:location.origin+location.pathname,capturedAt:Date.now()};
}
let elements=new Map();let token='';
function scan(){
if(!/(^|\.)(dynamics\.com|cloudax\.dynamics\.com)$/.test(location.hostname))throw Error('Ouvre le formulaire Create prospect sur ton site D365.');
if(!/create prospect|créer un prospect|creer un prospect|création de prospect/i.test(document.body.innerText))throw Error('Le formulaire Create prospect doit être ouvert avant le repérage.');
token=crypto.randomUUID();elements=new Map();const fields=[];
for(const e of query('input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]),textarea,select')){
if(!visible(e)||e.disabled||e.readOnly)continue;
const labels=Array.from(e.labels||[]).map(l=>l.innerText);const labelled=(e.getAttribute('aria-labelledby')||'').split(' ').map(id=>e.getRootNode().getElementById?.(id)?.textContent||'').join(' ');
const label=(labels.join(' ')||e.getAttribute('aria-label')||labelled||e.getAttribute('placeholder')||e.name||e.id||'Champ sans libellé').trim();
const box=e.closest('[role=group],fieldset,.group,.formGroup');const context=box?.querySelector('legend,[role=heading],.group-title')?.textContent?.trim()||'';
const key=String(fields.length);elements.set(key,e);fields.push({key,label,context,id:e.id,name:e.name,value:e.value,options:e.tagName==='SELECT'?Array.from(e.options).map(o=>({value:o.value,text:o.text})):[]});
}
return {token,origin:location.origin,fields};
}
async function creditLimitYes(){
 const targets=query('input,select,[role="switch"],[role="checkbox"]').filter(e=>{
  if(!visible(e)||e.disabled)return false;
  const labelled=(e.getAttribute('aria-labelledby')||'').split(' ').map(id=>e.getRootNode().getElementById?.(id)?.textContent||'').join(' ');
  const label=Array.from(e.labels||[]).map(x=>x.innerText).join(' ')||e.getAttribute('aria-label')||labelled;
  return ['mandatory credit limit','limite de credit obligatoire'].includes(norm(label));
 });
 if(targets.length!==1)return 'Mandatory credit limit : choisir Yes manuellement (champ introuvable ou ambigu)';
 const e=targets[0];
 if(e.type==='checkbox'){if(!e.checked)e.click();await new Promise(r=>setTimeout(r,200));return 'Mandatory credit limit : '+(e.checked?'Yes':'à régler à Yes manuellement');}
 const role=e.getAttribute('role');
 if(role==='switch'||role==='checkbox'){
  if(e.getAttribute('aria-checked')==='false')e.click();await new Promise(r=>setTimeout(r,200));return 'Mandatory credit limit : '+(e.getAttribute('aria-checked')==='true'?'Yes':'à régler à Yes manuellement');
 }
 if(e.tagName==='SELECT'){
  const no=Array.from(e.options).find(o=>['yes','oui'].includes(norm(o.text)));if(no){Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,no.value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.blur();await new Promise(r=>setTimeout(r,200));return 'Mandatory credit limit : '+(e.value===no.value?'Yes':'à vérifier manuellement');}
 }
 if(['yes','oui'].includes(norm(e.value)))return 'Mandatory credit limit : Yes';
 return 'Mandatory credit limit : sélectionner Yes manuellement';
}
async function fill({scanToken,items,overwrite,type}){
if(token!==scanToken)throw Error('Le formulaire a changé. Clique de nouveau sur Repérer les champs.');
const identity=items.filter(i=>type==='Person'?['first','last'].includes(i.field):i.field==='company');
if(!identity.length)throw Error('Champs d’identité introuvables. Vérifie le Type sélectionné dans D365.');
const seen=new Set();for(const i of items){if(seen.has(i.key))throw Error('Un même champ D365 est associé deux fois. Corrige les associations.');seen.add(i.key);const e=elements.get(i.key);if(!e?.isConnected||!visible(e))throw Error('Le formulaire a changé. Repère les champs de nouveau.');}
const report=[];
for(const item of items){
let e=elements.get(item.key);if(e&&!e.isConnected&&e.id)e=document.getElementById(e.id);if(!e?.isConnected||!visible(e)||e.disabled||e.readOnly){report.push(item.label+' : champ indisponible');continue;}
if(!overwrite&&item.field!=='language'&&e.value.trim()&&e.value.trim()!==item.value){report.push(item.label+' : valeur existante conservée');continue;}
try{
let v=item.value;if(e.tagName==='SELECT'){const o=Array.from(e.options).find(o=>norm(o.text)===norm(v)||norm(o.value)===norm(v));if(!o){report.push(item.label+' : option à sélectionner manuellement');continue;}v=o.value;}
e.focus();const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true,composed:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.blur();await new Promise(r=>setTimeout(r,220));report.push(item.label+(e.value===v?' : saisi — à vérifier dans D365':' : valeur non retenue, saisir manuellement'));
}catch(err){report.push(item.label+' : saisie manuelle requise');}
}
report.push(await creditLimitYes());
return report;
}

async function changeType(type){
 scan();
 const candidates=Array.from(elements.values()).filter(e=>norm((Array.from(e.labels||[]).map(l=>l.innerText).join(' ')||e.getAttribute('aria-label')||document.getElementById(e.getAttribute('aria-labelledby'))?.textContent||''))==='type');
 if(candidates.length!==1)throw Error('Sélectionne '+type+' dans le champ Type de D365, puis réessaie.');
 const e=candidates[0];if(norm(e.value)===norm(type)||e.tagName==='SELECT'&&norm(e.selectedOptions[0]?.text)===norm(type))return;
 if(e.tagName==='SELECT'){const option=Array.from(e.options).find(o=>norm(o.text)===norm(type));if(!option)throw Error('Choisis '+type+' dans D365.');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,option.value);e.dispatchEvent(new Event('change',{bubbles:true}));}
 else{e.click();await new Promise(r=>setTimeout(r,250));const opts=query('[role=option]').filter(o=>visible(o)&&norm(o.innerText)===norm(type));if(opts.length!==1)throw Error('Choisis '+type+' dans D365 puis clique de nouveau sur Remplir.');opts[0].click();}
 await new Promise(r=>setTimeout(r,100));
}
async function setType(type){
 const end=Date.now()+30000;
 // The heading appears before the form controls and before the type re-render completes.
 while(true){
  try{scan();if(Array.from(elements.values()).some(e=>norm(Array.from(e.labels||[]).map(l=>l.innerText).join(' ')||e.getAttribute('aria-label')||document.getElementById(e.getAttribute('aria-labelledby'))?.textContent||'')==='type'))break;}catch{}
  if(Date.now()>end)throw Error('Le formulaire prospect ne charge pas ses champs. Affiche D365 pour vérifier.');
  await new Promise(r=>setTimeout(r,250));
 }
 await changeType(type);
 let previous='',stable=0;
 while(Date.now()<end){
  const snapshot=scan(),map=Bridge.mapFields(snapshot.fields,type);
  const ready=(type==='Person'?['first','last']:['company']).every(k=>map[k]!==undefined);
  const signature=JSON.stringify(snapshot.fields.map(f=>[f.id,f.label]));
  stable=ready&&signature===previous?stable+1:0;previous=signature;
  if(stable>=3)return;
  await new Promise(r=>setTimeout(r,250));
 }
 throw Error('Les champs '+type+' ne sont pas prêts dans D365.');
}
const savedButtons=new WeakSet();
function prospectSaveButton(){
 const technical=globalThis.D365Controls?.find('DirPartyQuickCreateForm','OKButton','action');
 if(technical)return technical;
 const selector='button,a,[role="button"],input[type="submit"],input[type="button"]';
 const enabled=e=>visible(e)&&!e.disabled&&e.getAttribute('aria-disabled')!=='true'&&!e.closest?.('[inert],[aria-hidden="true"]');
 const isSave=e=>[e.innerText,e.value,e.getAttribute('aria-label'),e.getAttribute('title')].some(v=>norm(v)==='save');
 let buttons=query(selector).filter(e=>enabled(e)&&isSave(e));
 for(const caption of query('span,div')){
  if(!visible(caption)||caption.children?.length||norm(caption.textContent||caption.innerText)!=='save')continue;
  const target=caption.closest?.(selector+', [tabindex="0"]');
  if(target&&enabled(target))buttons.push(target);
 }
 buttons=[...new Set(buttons)];
 buttons=buttons.filter(e=>!buttons.some(other=>other!==e&&e.contains?.(other)));
 const headings=query('h1,h2,h3,h4,[role="heading"],span,div').filter(e=>visible(e)&&norm(e.textContent||e.innerText)==='create prospect');
 const scoped=new Set();
 for(const heading of headings){
  let container=heading.parentElement;
  while(container&&container!==document.body&&container!==document.documentElement){
   const inside=buttons.filter(e=>container.contains(e));
   if(inside.length){if(inside.length===1)scoped.add(inside[0]);break;}
   container=container.parentElement;
  }
 }
 if(scoped.size===1)return [...scoped][0];
 throw Error('Save du panneau Create prospect introuvable ou ambigu ('+scoped.size+' cible). Aucun clic sur le Save de la page arrière. Utilise Diagnostic D365.');
}
function createProspect(){
 scan(); // Require the D365 Create prospect form before any save action.
 const button=prospectSaveButton();
 if(savedButtons.has(button))throw Error('Save a déjà été cliqué pour ce formulaire. Vérifie le résultat dans D365 avant de continuer.');
 const invalid=Array.from(elements.values()).filter(e=>e.getAttribute('aria-invalid')==='true'||(e.required&&!e.value.trim())||(e.validity&&!e.validity.valid));
 if(invalid.length)throw Error('D365 indique des champs manquants ou invalides. Corrige-les avant de créer le prospect.');
 savedButtons.add(button);button.click();
 return {clicked:true,message:'Save a été cliqué. Vérifie la confirmation ou les erreurs affichées dans D365 avant de passer à la soumission.'};
}
globalThis.solotechBridge={version:'1.8.10',read,scan,fill,setType,createProspect,prospectSaveButton};
})();
