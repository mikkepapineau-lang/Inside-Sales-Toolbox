(()=>{
if(globalThis.solotechQuotation?.version==='1.7.2')return;
const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[*:]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function all(selector){const roots=[document],out=[];for(let i=0;i<roots.length;i++){out.push(...roots[i].querySelectorAll(selector));for(const e of roots[i].querySelectorAll('*'))if(e.shadowRoot)roots.push(e.shadowRoot);}return [...new Set(out)];}
function label(e){return Array.from(e.labels||[]).map(x=>x.innerText).join(' ')||e.getAttribute('aria-label')||(e.getAttribute('aria-labelledby')||'').split(' ').map(id=>e.getRootNode().getElementById?.(id)?.textContent||'').join(' ');}
const dimensionNames=new Set(['ACTIVITY','DEPARTMENT','DIVISION','OFFICE','TERRITORY']);
function field(name,editable=true){
 if(dimensionNames.has(name)){const technical=globalThis.D365Controls?.find('smmBusRelTable','DimensionEntryControl_DECValue_'+name,'field')||globalThis.D365Controls?.find('smmBusRelTable','DimensionEntryControl_DECRowGroup_'+name,'field');if(technical)return technical;}
 const eligible=e=>visible(e)&&!['hidden','button','submit','checkbox','radio'].includes(e.type)&&(!editable||!e.disabled&&!e.readOnly);
 const inputs=all('input,select,textarea').filter(eligible);
 const exact=inputs.filter(e=>norm(label(e))===norm(name));
 if(exact.length===1)return exact[0];
 if(exact.length>1)throw Error('Champ '+name+' ambigu : plusieurs champs portent ce libellé.');
 if(dimensionNames.has(name)){
  // F&O dimension controls can show a plain label without for/aria-labelledby.
  // Resolve only within the nearest row containing this exact dimension label.
  const labels=all('label,span,div').filter(e=>visible(e)&&norm(e.textContent||e.innerText)===norm(name)&&!(e.children?.length));
  const matches=new Set();
  for(const l of labels){
   const linked=l.getAttribute('for');
   const direct=linked&&l.getRootNode().getElementById?.(linked);
   if(direct&&inputs.includes(direct)){matches.add(direct);continue;}
   let row=l.parentElement;
   for(let depth=0;row&&depth<5;depth++,row=row.parentElement){
    const rowLabels=Array.from(row.querySelectorAll('label,span,div')).filter(e=>!e.children?.length&&dimensionNames.has((e.textContent||e.innerText||'').trim().toUpperCase()));
    if(rowLabels.some(e=>norm(e.textContent||e.innerText)!==norm(name)))break;
    const controls=Array.from(row.querySelectorAll('input,select,textarea')).filter(e=>inputs.includes(e));
    if(!controls.length)continue;
    if(controls.length===1)matches.add(controls[0]);
    else{
     // Prefer the dimension code lookup, never the adjacent description field.
     const lookups=controls.filter(e=>e.tagName==='SELECT'||e.getAttribute('role')==='combobox'||e.getAttribute('aria-haspopup')==='listbox');
     if(lookups.length===1)matches.add(lookups[0]);
    }
    break;
   }
  }
  if(matches.size===1)return [...matches][0];
 }
 throw Error('Champ '+name+' introuvable ou ambigu. La rubrique reste ouverte; aucun clic sur son titre.');
}
const actionSelector='button,a,[role="button"],[role="tab"],[role="menuitem"],input[type="submit"],input[type="button"]';
function button(name){
 if(name==='Sales quotation'){const technical=globalThis.D365Controls?.find('smmBusRelTable','mibSalesQuotation TableForNew','action');if(technical)return technical;}
 const enabled=e=>visible(e)&&!e.disabled&&e.getAttribute('aria-disabled')!=='true';
 const match=e=>[e.innerText,e.value,e.getAttribute('aria-label'),e.getAttribute('title')].some(v=>norm(v)===norm(name));
 let found=all(actionSelector).filter(e=>enabled(e)&&match(e));
 // F&O can expose the caption on a child span, with the action on its parent.
 for(const caption of all('span,div')){
  if(!visible(caption)||caption.children?.length||norm(caption.textContent||caption.innerText)!==norm(name))continue;
  const target=caption.closest?.(actionSelector+', [tabindex="0"]');
  if(target&&enabled(target))found.push(target);
 }
 found=[...new Set(found)];
 found=found.filter(e=>!found.some(other=>other!==e&&e.contains?.(other)));
 if(found.length!==1)throw Error('Bouton '+name+' : '+found.length+' cible(s) trouvée(s).');
 return found[0];
}
function diagnostics(){
 const fields=all('input,select,textarea').filter(visible);
 const labels=all('label,span,div').filter(e=>visible(e)&&!e.children?.length&&dimensionNames.has((e.textContent||e.innerText||'').trim().toUpperCase()));
 const rows=labels.map(l=>{
  let row=l.parentElement;const controls=[];
  for(let i=0;row&&i<4;i++,row=row.parentElement){
   const candidates=Array.from(row.querySelectorAll('input,select,textarea'));
   if(candidates.length){for(const e of candidates)controls.push({tag:e.tagName,id:e.id||'',name:e.name||'',role:e.getAttribute('role')||'',label:label(e),visible:!!visible(e),disabled:!!e.disabled,readOnly:!!e.readOnly});break;}
  }
  return {dimension:(l.textContent||l.innerText).trim(),controls};
 });
 let sales;try{const e=button('Sales quotation');sales={found:true,tag:e.tagName,id:e.id||'',role:e.getAttribute('role')||''};}catch(e){sales={found:false,error:e.message};}
 let save;try{const e=globalThis.solotechBridge.prospectSaveButton();save={found:true,tag:e.tagName,id:e.id||''};}catch(e){save={found:false,error:e.message};}
 const technicalDimensions=[...dimensionNames].map(name=>{try{const e=globalThis.D365Controls?.find('smmBusRelTable','DimensionEntryControl_DECValue_'+name,'field')||globalThis.D365Controls?.find('smmBusRelTable','DimensionEntryControl_DECRowGroup_'+name,'field');return {dimension:name,found:!!e,id:e?.id||''};}catch(e){return {dimension:name,error:e.message};}});
 return {version:'1.7.2',technicalDimensions,prospectSave:save,salesQuotation:sales,dimensions:rows,recognizedFields:fields.map(e=>label(e)).filter(v=>['account','first name','last name','name','sales origin','payment','warehouse'].includes(norm(v)))};
}
async function until(fn,ms=30000){const end=Date.now()+ms;let error;while(Date.now()<end){try{const value=fn();if(value)return value;}catch(e){error=e;}await sleep(200);}throw error||Error('D365 ne répond pas encore. Vérifie la page avant de réessayer.');}
function failIfInvalid(){const invalid=all('input,select,textarea').filter(e=>visible(e)&&!e.disabled&&(e.getAttribute('aria-invalid')==='true'||e.required&&!e.value.trim()||e.validity&&!e.validity.valid));if(invalid.length)throw Error('D365 signale un champ invalide : '+label(invalid[0]));}
async function write(name,value){
 const e=field(name);if(e.tagName==='SELECT'){const o=Array.from(e.options).find(o=>norm(o.value)===norm(value)||norm(o.text)===norm(value));if(!o)throw Error('Option '+value+' introuvable pour '+name);Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,o.value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.blur();await sleep(300);if(norm(field(name).selectedOptions[0]?.text)!==norm(value)&&norm(field(name).value)!==norm(o.value))throw Error(name+' non retenu.');return;
 }
 e.focus();const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));await sleep(300);
 const suggestions=all('[role="option"]').filter(o=>visible(o)&&norm(o.innerText)===norm(value));if(suggestions.length===1)suggestions[0].click();e.blur();await sleep(300);
 if(norm(field(name).value)!==norm(value))throw Error(name+' : valeur non retenue. Sélectionne '+value+' dans D365 puis réessaie.');failIfInvalidValue(field(name));
}
function failIfInvalidValue(e){if(e.getAttribute('aria-invalid')==='true')throw Error(label(e)+' : valeur refusée par D365.');}
function prospectName(){
 try{return field('Name',false).value;}catch{
  return [field('First name',false).value,field('Last name',false).value].filter(Boolean).join(' ');
 }
}
function assertProspect(expectedName,expectedAccount){
 const account=field('Account',false).value;
 if(expectedAccount&&account!==expectedAccount)throw Error('Le numéro de prospect ne correspond pas à celui créé.');
 if(!/^CAOP-\d+$/i.test(account)||norm(prospectName())!==norm(expectedName))throw Error('Le prospect ouvert ne correspond pas au nom du lead.');
 return account;
}
const dirtyDimensionAccounts=new Set();
async function fillDimensions({territory='MONTREAL',expectedName,expectedAccount}){
 const account=assertProspect(expectedName,expectedAccount);
 // Never toggle Financial dimension: a missing label is not proof it is collapsed.
 // Wait for all controls before writing anything, so a partial mapping cannot save.
 await until(()=>['ACTIVITY','DEPARTMENT','DIVISION','OFFICE','TERRITORY'].every(name=>field(name)),10000);
 const dimensions=[['ACTIVITY','ECOMM'],['DEPARTMENT','021'],['DIVISION','003'],['OFFICE','MONTREAL'],['TERRITORY',territory||'MONTREAL']];
 for(const [name,value] of dimensions){const e=field(name);if(norm(e.value)!==norm(value)&&norm(e.selectedOptions?.[0]?.text)!==norm(value)){dirtyDimensionAccounts.add(account);await write(name,value);}}
 failIfInvalid();assertProspect(expectedName,account);
 if(dirtyDimensionAccounts.has(account)){button('Save').click();await sleep(900);}
 for(const [name,value] of dimensions)await until(()=>{const e=field(name);failIfInvalidValue(e);return norm(e.value)===norm(value)||norm(e.selectedOptions?.[0]?.text)===norm(value);});
 dirtyDimensionAccounts.delete(account);
 return {account,territory:territory||'MONTREAL'};
}
let running=false;const submitted=new WeakSet();
async function create({territory='MONTREAL',warehouse,expectedName,expectedAccount,onProgress=async()=>{}}){
 let stage='Vérification du prospect';
 const progress=async message=>{stage=message;await onProgress(message);};
 if(running)throw Error('Création déjà en cours.');
 if(!/(^|\.)dynamics\.com$/.test(location.hostname))throw Error('Ouvre le prospect dans D365.');
 if(!['YUL-01','QUE-01','TOR-01','OTT-01'].includes(warehouse))throw Error('Choisis l’entrepôt.');
 if(!expectedName)throw Error('Nom du prospect manquant dans le lead.');
 running=true;try{
 let account;
 const isQuote=(()=>{try{return !!field('Sales origin');}catch{return false;}})();
 if(!isQuote){
  await progress('1/4 · Vérification du prospect ouvert…');
  account=assertProspect(expectedName,expectedAccount);
  await progress('2/4 · Remplissage et enregistrement des dimensions financières…');
  await fillDimensions({territory,expectedName,expectedAccount:account});
  await progress('3/4 · Ouverture de Sales quotation…');
  // New is a ribbon group under Sell, not the global New prospect button.
  try{button('Sales quotation');}catch{let tab;try{tab=button('Sell');}catch{tab=button('Sales');}tab.click();await until(()=>button('Sales quotation'));}
  button('Sales quotation').click();await until(()=>field('Sales origin'));
 }else account=field('Prospect',false).value;
 if(expectedAccount&&account!==expectedAccount)throw Error('Numéro de prospect différent.');
 if(!/^CAOP-\d+$/i.test(account)||field('Prospect',false).value!==account||norm(field('Name of prospect',false).value)!==norm(expectedName))throw Error('La soumission ne vise pas le prospect attendu.');
 const ok=button('OK');if(submitted.has(ok))throw Error('OK a déjà été cliqué. Vérifie le résultat dans D365.');
 await progress('4/4 · Saisie de la soumission…');
 for(const [name,value] of [['Sales origin','ECOMM'],['Payment','PAYMENT IN ADVANCE'],['Warehouse',warehouse]])await write(name,value);
 failIfInvalid();
 if(field('Prospect',false).value!==account)throw Error('Le prospect a changé.');
 const number=(()=>{try{return field('Quotation',false).value;}catch{return '';}})();
 submitted.add(ok);ok.click();
 return {clicked:true,account,number,message:'OK a été cliqué'+(number?' pour '+number:'')+'. Vérifie la confirmation de création dans D365.'};
 }catch(e){throw Error(stage+'\n'+e.message);}finally{running=false;}
}
globalThis.solotechQuotation={version:'1.7.2',create,fillDimensions,diagnostics};
})();
