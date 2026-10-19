(()=>{
if(globalThis.solotechBridge?.version==='1.8.12')return;
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
async function fill({scanToken,items,overwrite,type,onProgress=async()=>{}}){
if(token!==scanToken)throw Error('Le formulaire a changé. Clique de nouveau sur Repérer les champs.');
const identity=items.filter(i=>type==='Person'?['first','last'].includes(i.field):i.field==='company');
if(!identity.length)throw Error('Champs d’identité introuvables. Vérifie le Type sélectionné dans D365.');
const seen=new Set();for(const i of items){if(seen.has(i.key))throw Error('Un même champ D365 est associé deux fois. Corrige les associations.');seen.add(i.key);const e=elements.get(i.key);if(!e?.isConnected||!visible(e))throw Error('Le formulaire a changé. Repère les champs de nouveau.');}
const report=[],total=items.length+1;
const progress=async(current,label,state)=>{try{await onProgress({message:current+' / '+total+' · '+label+' · '+({writing:'en cours…',filled:'saisi',kept:'valeur conservée',warning:'à vérifier'}[state]),fields:{current,total,label,state}});}catch{/* Display updates must never interrupt a field commit. */}};
for(let index=0;index<items.length;index++){
const item=items[index];await progress(index,item.label,'writing');let outcome='warning';
try{
let e=elements.get(item.key);if(e&&!e.isConnected&&e.id)e=document.getElementById(e.id);if(!e?.isConnected||!visible(e)||e.disabled||e.readOnly){report.push(item.label+' : champ indisponible');continue;}
if(!overwrite&&item.field!=='language'&&e.value.trim()&&e.value.trim()!==item.value){outcome='kept';report.push(item.label+' : valeur existante conservée');continue;}
try{
let v=item.value;if(e.tagName==='SELECT'){const o=Array.from(e.options).find(o=>norm(o.text)===norm(v)||norm(o.value)===norm(v));if(!o){report.push(item.label+' : option à sélectionner manuellement');continue;}v=o.value;}
e.focus();const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true,composed:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.blur();await new Promise(r=>setTimeout(r,220));const current=e.isConnected?e:document.getElementById(e.id);outcome=current?.value===v&&current.getAttribute('aria-invalid')!=='true'?'filled':'warning';report.push(item.label+(outcome==='filled'?' : saisi, à vérifier dans D365':' : valeur non retenue, saisir manuellement'));
}catch(err){report.push(item.label+' : saisie manuelle requise');}
}finally{await progress(index+1,item.label,outcome);}
}
await progress(items.length,'Mandatory credit limit','writing');const credit=await creditLimitYes();report.push(credit);await progress(total,'Mandatory credit limit',/ : Yes$/.test(credit)?'filled':'warning');
return report;
}

const typeValue=value=>({person:'Person',personne:'Person',organization:'Organization',organisation:'Organization'}[norm(value)]||'');
function typeControl(){
 const C=globalThis.D365Controls,label=e=>Array.from(e.labels||[]).map(l=>l.innerText).join(' ')||e.getAttribute('aria-label')||String(e.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>document.getElementById(id)?.textContent||'').join(' ');
 let found=query('input,select,[role="combobox"]').filter(e=>visible(e)&&!e.disabled&&/^type(?:\s+(?:value|valeur))?(?:\s+(?:organization|organisation|person|personne))?$/.test(norm(label(e))));
 found=found.filter(e=>!found.some(other=>other!==e&&e.contains?.(other)));
 const scoped=C?found.filter(e=>C.formMatch(e,'DirPartyQuickCreateForm')):[];if(scoped.length)found=scoped;
 if(found.length>1)throw Error('Champ Type ambigu dans Create prospect. Aucun choix automatique.');
 return found[0]||null;
}
function selectedType(e){return typeValue(e?.selectedOptions?.[0]?.text)||typeValue(e?.getAttribute('aria-valuetext'))||typeValue(e?.value);}
async function setType(type,{onBlocked}={}){
 if(!['Person','Organization'].includes(type))throw Error('Type de prospect non reconnu.');
 const wait=globalThis.D365Controls?.waitFor||async function(check,{timeout=18000}={}){const end=Date.now()+timeout;while(Date.now()<end){const value=check();if(value)return value;await new Promise(r=>setTimeout(r,200));}throw Error('Le formulaire prospect ne charge pas ses champs.');};
 let control=await wait(()=>typeControl(),{onBlocked});
 if(selectedType(control)!==type){
  if(control.tagName==='SELECT'){
   const option=Array.from(control.options).find(o=>typeValue(o.text)===type);
   if(!option)throw Error('Option '+type+' introuvable dans le champ Type.');
   control.focus();Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(control,option.value);
   control.dispatchEvent(new Event('input',{bubbles:true}));control.dispatchEvent(new Event('change',{bubbles:true}));control.blur();
  }else{
   // F&O dropdowns may expose a read-only input. Select the real option instead of typing a label.
   control.focus();control.click();let keyboardOpened=false;
   const option=await wait(()=>{
    const current=typeControl();if(!current)return false;
    const ids=String(current.getAttribute('aria-controls')||current.getAttribute('aria-owns')||'').split(/\s+/).filter(Boolean),panels=ids.map(id=>document.getElementById(id)).filter(Boolean);
    let options=query('[role="option"],[role="menuitemradio"]').filter(o=>visible(o)&&typeValue(o.innerText||o.textContent)===type);
    if(panels.length)options=options.filter(o=>panels.some(p=>p===o||p.contains(o)));
    if(options.length>1)throw Error('Option '+type+' ambiguë dans le champ Type. Aucun clic automatique.');
    if(options.length===1)return options[0];
    if(!keyboardOpened&&typeof KeyboardEvent!=='undefined'){keyboardOpened=true;current.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',code:'ArrowDown',altKey:true,bubbles:true}));}
    return false;
   },{timeout:12000,onBlocked});
   option.click();
  }
 }
 let previous='',stable=0;
 await wait(()=>{
  control=typeControl();if(!control||selectedType(control)!==type)return false;
  const snapshot=scan(),map=Bridge.mapFields(snapshot.fields,type);
  const ready=(type==='Person'?['first','last']:['company']).every(k=>map[k]!==undefined);
  const signature=JSON.stringify(snapshot.fields.map(f=>[f.id,f.label]));
  stable=ready&&signature===previous?stable+1:0;previous=signature;
  return stable>=3;
 },{onBlocked});
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
globalThis.solotechBridge={version:'1.8.12',read,scan,fill,setType,createProspect,prospectSaveButton};
})();
