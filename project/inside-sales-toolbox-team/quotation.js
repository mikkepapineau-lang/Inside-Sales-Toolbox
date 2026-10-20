(()=>{
if(globalThis.solotechQuotation?.version==='1.8.14')return;
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
 const identity=quotationIdentity();
 return {version:'1.8.14',technicalDimensions,prospectSave:save,salesQuotation:sales,dimensions:rows,quotationIdentity:{state:identity.state,source:identity.source,candidateCount:identity.numbers.length,controls:identity.controls},recognizedFields:fields.map(e=>label(e)).filter(v=>['account','first name','last name','name','sales origin','payment','site','warehouse'].includes(norm(v)))};
}
async function until(fn,ms=30000,onBlocked){const end=Date.now()+ms;let error,woken=false;while(Date.now()<end){try{const value=fn();if(value)return value;}catch(e){error=e;}if(!woken&&onBlocked&&document.visibilityState==='hidden'&&ms-(end-Date.now())>=1800){woken=true;await onBlocked();}await sleep(200);}throw error||Error('D365 ne répond pas encore. Vérifie la page avant de réessayer.');}
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
async function fillDimensions({territory='MONTREAL',office='MONTREAL',expectedName,expectedAccount,onBlocked}){
 const account=assertProspect(expectedName,expectedAccount);
 const C=globalThis.D365Controls,expanded=new WeakSet(),verify=()=>assertProspect(expectedName,account);
 const ready=()=>{
  verify();
  if(C?.reveal)C.reveal('smmBusRelTable',C.all().filter(e=>C.formMatch(e,'smmBusRelTable')&&[...dimensionNames].some(name=>C.controlMatch(e,'DimensionEntryControl_DECValue_'+name))),verify,expanded);
  return [...dimensionNames].every(name=>{try{return !!field(name);}catch(e){if(e.unavailable||/introuvable/.test(e.message))return false;throw e;}});
 };
 // A new prospect opens in read mode. Click Edit once, then wait for all five fields.
 if(C?.prepareForm)await C.prepareForm('smmBusRelTable',{ready,verify,onBlocked});else await until(ready,10000);
 const dimensions=[['ACTIVITY','ECOMM'],['DEPARTMENT','021'],['DIVISION','003'],['OFFICE',office],['TERRITORY',territory||'MONTREAL']];
 for(const [name,value] of dimensions){const e=field(name);if(norm(e.value)!==norm(value)&&norm(e.selectedOptions?.[0]?.text)!==norm(value)){dirtyDimensionAccounts.add(account);await write(name,value);}}
 failIfInvalid();assertProspect(expectedName,account);
 if(dirtyDimensionAccounts.has(account)){button('Save').click();await sleep(900);}
 for(const [name,value] of dimensions)await until(()=>{const e=field(name);failIfInvalidValue(e);return norm(e.value)===norm(value)||norm(e.selectedOptions?.[0]?.text)===norm(value);});
 dirtyDimensionAccounts.delete(account);
 return {account,territory:territory||'MONTREAL'};
}
function quotationNodes(){
 const C=globalThis.D365Controls;if(!C)return [];
 const nodes=C.all();if(!nodes.some(e=>C.visible(e)&&C.formMatch(e,'SalesQuotationTable')))return [];
 return nodes.filter(e=>C.formMatch(e,'SalesQuotationTable'));
}
const quoteLabels=new Set(['quotation','sales quotation','quotation number','sales quotation number','soumission','numero de soumission']);
const quoteCodes=text=>[...new Set((String(text||'').match(/\bSQ-[A-Z0-9]+(?:-[A-Z0-9]+)*\b/gi)||[]).map(s=>s.toUpperCase()))];
const quoteText=e=>[e.textContent,e.innerText,e.getAttribute('aria-label'),e.getAttribute('title')].filter(Boolean).join(' ');
function quotationIdentity(){
 const C=globalThis.D365Controls,nodes=quotationNodes().filter(e=>C.visible(e));
 const controls=nodes.filter(e=>C.controlMatch(e,'QuotationId')||e.matches('input,textarea')&&quoteLabels.has(norm(label(e))));
 const numbers=[...new Set(controls.flatMap(e=>e.matches('input,textarea')?[String(e.value||'').trim()].filter(Boolean):quoteCodes(quoteText(e))))];
 const isHeading=e=>e.matches('h1,h2,[role="heading"]')||['FormCaption','FormTitle','HeaderTitle'].some(name=>C.controlMatch(e,name));
 const linked=nodes.flatMap(e=>String(e.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean).map(id=>e.getRootNode?.().getElementById?.(id)||document.getElementById(id))).filter(e=>e&&C.visible(e)&&isHeading(e));
 const headings=[...new Set([...nodes.filter(isHeading),...linked])];
 const titled=[...new Set(headings.flatMap(e=>quoteCodes(quoteText(e))))];
 // Read-only F&O views can display the quotation ID in the title without an input.
 // A contradictory visible identifier must never be ignored in favour of a title.
 const combined=[...new Set([...numbers,...titled])];
 return {state:combined.length===1?'identified':combined.length?'ambiguous':'missing',numbers:combined,source:numbers.length?'field':titled.length?'heading':'',controls:[...controls,...headings].map(e=>({id:e.id||'',tag:e.tagName,role:e.getAttribute('role')||''}))};
}
function matchesQuote(number){
 if(!number)return false;const identity=quotationIdentity();
 return identity.state==='identified'&&identity.numbers[0]===number;
}
function revealQuotationIdentity(opened){
 const C=D365Controls,nodes=quotationNodes();if(!nodes.length)return;
 const header=C.action('SalesQuotationTable',['Header','En-tête','Header view','Vue en-tête']);
 if(header&&!opened.has(header)&&header.getAttribute('aria-selected')!=='true'){opened.add(header);header.click();}
 C.reveal('SalesQuotationTable',nodes.filter(e=>C.controlMatch(e,'QuotationId')||e.matches('input,textarea')&&quoteLabels.has(norm(label(e)))),()=>{},opened);
}
async function waitForQuotation(check,{onBlocked,number=''}={}){
 const opened=new WeakSet();
 return D365Controls.waitFor(()=>{
  const value=check();if(value)return value;
  const identity=quotationIdentity();
  if(identity.state==='missing'||identity.state==='identified'&&(!number||identity.numbers[0]===number)){
   revealQuotationIdentity(opened);
   if(number&&!quotationNodes().some(e=>D365Controls.visible(e))){
    let links=all('a,[role="link"]').filter(e=>{
     if(!visible(e)||e.disabled||e.getAttribute('aria-disabled')==='true'||String(e.textContent||e.innerText||'').trim()!==number||e.getAttribute('target')==='_blank')return false;
     const href=e.getAttribute('href');if(!href||href.startsWith('#'))return true;
     try{const url=new URL(href,location.href);return url.origin===location.origin&&(!url.searchParams.has('cmp')||url.searchParams.get('cmp').toUpperCase()==='CAOP');}catch{return false;}
    });
    links=links.filter(e=>!links.some(other=>other!==e&&e.contains?.(other)));
    if(links.length>1)throw Error('Plusieurs liens vers '+number+' sont affichés. Ouvre sa fiche puis réessaie les coordonnées.');
    if(links.length===1&&!opened.has(links[0])){opened.add(links[0]);links[0].click();}
   }
  }
  return false;
 },{onBlocked});
}
function createdNumberFor(account){
 const C=D365Controls,fields=quotationNodes().filter(e=>C.visible(e)&&e.matches('input,textarea')),numbers=quotationIdentity().numbers;if(numbers.length!==1)return false;
 const accounts=[...new Set(fields.filter(e=>['prospect','account','prospect account','account number','compte','compte prospect'].includes(norm(label(e)))).map(e=>String(e.value||'').trim()).filter(Boolean))];
 if(accounts.length!==1)return false;
 if(accounts[0]!==account)throw Error('Le compte de la soumission créée ne correspond pas au prospect.');
 return numbers[0];
}
async function fillCreatedContacts(number,contacts,{onBlocked}={}){
 if(!number)throw Error('Numéro de soumission indisponible : coordonnées non appliquées automatiquement.');
 const verify=()=>{
  const identity=quotationIdentity();if(identity.state==='identified'&&identity.numbers[0]===number)return;
  if(identity.state==='missing')throw Error('Le numéro '+number+' n’est pas encore lisible dans la soumission. Ouvre son en-tête puis utilise Diagnostic D365.');
  if(identity.state==='ambiguous')throw Error('Plusieurs numéros de soumission sont affichés. Impossible de confirmer '+number+'. Utilise Diagnostic D365.');
  throw Error('La soumission ouverte ne correspond plus à '+number+'. Vérifie les coordonnées dans D365.');
 };
 try{await waitForQuotation(()=>matchesQuote(number),{onBlocked,number});}catch(e){if(e.message.startsWith('D365 ne présente'))verify();throw e;}
 verify();
 const result=await globalThis.fillClientContacts(contacts,{expectedForm:'SalesQuotationTable',verify,autoEdit:true,onBlocked});
 return {...result,filled:true};
}
let running=false;const submitted=new WeakSet();
async function create({site,warehouse,expectedName,expectedAccount,contacts=null,contactWarning='',onProgress=async()=>{},onBlocked}){
 let stage='Vérification du prospect';
 const progress=async message=>{stage=message;await onProgress(message);};
 if(running)throw Error('Création déjà en cours.');
 if(!/(^|\.)dynamics\.com$/.test(location.hostname))throw Error('Ouvre le prospect dans D365.');
 ({site,warehouse}=ToolboxWarehouses.assertPair(site,warehouse));
 if(!expectedName)throw Error('Nom du prospect manquant dans le lead.');
 running=true;try{
 let account;
 const isQuote=(()=>{try{return !!field('Sales origin');}catch{return false;}})();
 if(!isQuote){
  await progress('1/3 · Vérification du prospect ouvert…');
  account=assertProspect(expectedName,expectedAccount);
  await progress('2/3 · Ouverture de New Sales Quotation…');
  // New is a ribbon group under Sell, not the global New prospect button.
  try{button('Sales quotation');}catch{let tab;try{tab=button('Sell');}catch{tab=button('Sales');}tab.click();await until(()=>button('Sales quotation'),30000,onBlocked);}
  button('Sales quotation').click();await until(()=>field('Sales origin'),30000,onBlocked);
 }else account=field('Prospect',false).value;
 if(expectedAccount&&account!==expectedAccount)throw Error('Numéro de prospect différent.');
 if(!/^CAOP-\d+$/i.test(account)||field('Prospect',false).value!==account||norm(field('Name of prospect',false).value)!==norm(expectedName))throw Error('La soumission ne vise pas le prospect attendu.');
 const ok=button('OK');if(submitted.has(ok))throw Error('OK a déjà été cliqué. Vérifie le résultat dans D365.');
 await progress('3/3 · Saisie des paramètres de la soumission…');
 const quoteValues=[['Sales origin','ECOMM'],['Payment','PAYMENT IN ADVANCE'],['Site',site],['Warehouse',warehouse]];
 // Site must be resolved before Warehouse. A warehouse lookup must never keep an incompatible site.
 for(const [name,value] of quoteValues){if(name==='Site'&&norm(field(name,false).value)===norm(value))continue;await write(name,value);}
 // Only validate the fields written in this quotation, never unrelated prospect fields.
 for(const [name,value] of quoteValues){const e=field(name,false);failIfInvalidValue(e);if(norm(e.value)!==norm(value)&&norm(e.selectedOptions?.[0]?.text)!==norm(value))throw Error(name+' : valeur non retenue. Vérifie le site et l’entrepôt.');}
 if(field('Prospect',false).value!==account)throw Error('Le prospect a changé.');
 let number=(()=>{try{return String(field('Quotation',false).value||'').trim();}catch{return '';}})();
 submitted.add(ok);ok.click();
 const result={clicked:true,account,number,site,warehouse,message:'OK a été cliqué'+(number?' pour '+number:'')+'. Vérifie la confirmation de création dans D365.'};
 if(!number){
  try{number=await waitForQuotation(()=>createdNumberFor(account),{onBlocked});result.number=number;result.message='Soumission '+number+' créée.';}
  catch(e){return {...result,contactsPending:true,message:result.message+' Ne recrée pas la soumission. Numéro à vérifier dans D365 : '+e.message};}
 }
 if(!contacts)return {...result,contactsPending:true,message:result.message+' '+(contactWarning||'Coordonnées du contact indisponibles.')};
 try{
  await progress('Remplissage des coordonnées dans la nouvelle soumission…');
  const contactResult=await fillCreatedContacts(number,contacts,{onBlocked});
  return {...result,contacts:contactResult,message:'Soumission '+number+' ouverte : '+contactResult.report.join(', ')+' remplis. Vérifie puis enregistre la soumission dans D365.'};
 }catch(e){return {...result,contactsPending:true,message:result.message+' Ne recrée pas la soumission. Coordonnées à compléter : '+e.message};}
 }catch(e){throw Error(stage+'\n'+e.message);}finally{running=false;}
}
globalThis.solotechQuotation={version:'1.8.14',create,fillDimensions,fillCreatedContacts,matchesQuote,diagnostics};
})();
