(()=>{
globalThis.diagnoseClientContacts=()=>{
 const C=D365Controls;
 return {forms:['SalesQuotationTable','SalesTable'].map(form=>({form,fields:C.all().filter(e=>C.formMatch(e,form)&&e.matches('input,textarea,select')).map(e=>({id:e.id,name:e.name,label:e.getAttribute('aria-label')||[...(e.labels||[])].map(l=>l.textContent.trim()).join(' '),control:e.getAttribute('data-dyn-controlname'),visible:C.visible(e),readOnly:!!e.readOnly,disabled:!!e.disabled}))})).filter(f=>f.fields.length)};
};
globalThis.fillClientContacts=async function(v,{expectedForm='',verify=()=>{},autoEdit=false,onBlocked}={}){
 if(location.hostname!=='solotech.operations.dynamics.com')throw Error('Ouvre une soumission ou une commande dans D365.');
const C=D365Controls,nodes=C.all();
 const forms=['SalesQuotationTable','SalesTable'];
 const found=forms.filter(form=>nodes.some(e=>C.visible(e)&&C.formMatch(e,form)));
 verify();
 if(expectedForm&&!found.includes(expectedForm))throw Error('La soumission créée n’est plus le formulaire actif. Aucun champ modifié.');
 if(!expectedForm&&found.length!==1)throw Error('Ouvre une seule soumission ou commande en mode Edit. Utilise Diagnostic coordonnées D365 pour identifier les champs.');
 // The automatic path has already verified the exact quotation number. Other open forms are irrelevant.
 const form=expectedForm||found[0],order=form==='SalesTable';
 const specs=[
 ['SOLInternalNotes',v.notes,'Internal Notes',['internal notes','notes internes']],
 [order?'SOLDeliveryContactInfo':'SOLDocumentDeliveryContact',v.delivery,'Delivery contact information',['delivery contact information','delivery contact info','coordonnées du contact de livraison','informations de contact de livraison']],
 [order?'SysGen_{B94891EA-2350-41BD-8414-F4003D91BFEC}':'SysGen_{9056FF81-DEA8-430E-A877-AA7E2EA628C9}',v.email,'Email',['email','e-mail','courriel']]
 ];
 if(order)specs.push(['SysGen_{1FA28D3A-D8FA-40AC-A2AE-DB84EB7766C6}',v.phone,'Telephone',['telephone','téléphone','phone']]);
 const normalized=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim().replace(/\s*[:*]+$/,'').trim();
 const fieldLabel=e=>[e.getAttribute('aria-label'),...String(e.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean).map(id=>document.getElementById(id)?.textContent),...[...(e.labels||[])].map(l=>l.textContent)].map(normalized).filter(Boolean);
 const eligible=e=>C.visible(e)&&!e.disabled&&!e.readOnly&&e.getAttribute('aria-disabled')!=='true'&&e.matches('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]),textarea')&&C.formMatch(e,form);
 const expanded=new WeakSet();let headerOpened=false;
 function resolve(){return specs.map(([control,value,label,labels])=>{
  let e;try{e=C.find(form,control,'field');}catch(error){if(!error.unavailable)throw error;}
  if(!e){const matches=C.all().filter(eligible).filter(e=>fieldLabel(e).some(l=>labels.includes(l)));if(matches.length>1)throw Error(label+' : plusieurs champs possibles. Aucun champ modifié. Utilise Diagnostic coordonnées D365.');e=matches[0];}
  return [e,String(value||''),label];
 });}
 function reveal(){
  verify();const nodes=C.all(),targets=nodes.filter(e=>C.formMatch(e,form)&&specs.some(([control,,,labels])=>C.controlMatch(e,control)||e.matches('input,textarea')&&fieldLabel(e).some(l=>labels.includes(l))));
  if(C.reveal)C.reveal(form,targets,verify,expanded);
  // Newly created quotations can open in Lines. Header exposes the contact fields.
  if(autoEdit&&!headerOpened&&!resolve().every(([e])=>e)){
   const header=C.action?.(form,['Header','En-tête']);
   if(header&&header.getAttribute('aria-selected')!=='true'){verify();headerOpened=true;header.click();}
  }
 }
 const ready=()=>{reveal();const controls=resolve();return controls.every(([e])=>e)?controls:false;};
 let controls;
 if(autoEdit&&C.prepareForm){
  try{controls=await C.prepareForm(form,{ready,verify,onBlocked});}catch(error){const missing=resolve().filter(([e])=>!e).map(([, ,label])=>label);if(missing.length&&error.message.startsWith('D365 ne présente'))throw Error(missing.join(', ')+' introuvable, masqué ou encore en lecture seule. Aucun champ modifié. Utilise Diagnostic coordonnées D365.');throw error;}
 }else{reveal();await new Promise(r=>setTimeout(r,180));verify();controls=resolve();}
 for(const [e,value,label] of controls){if(!e)throw Error(label+' introuvable ou masqué. Aucun champ modifié. Ouvre la section concernée puis réessaie, ou utilise Diagnostic coordonnées D365.');if(e.maxLength>0&&value.length>e.maxLength)throw Error(label+' : texte trop long. Aucun champ modifié.');}
 const report=[];
 for(let i=0;i<controls.length;i++){
 const [e,value,label]=resolve()[i];
 verify();
 if(!e?.isConnected)throw Error('Le formulaire a changé. Vérifie les champs déjà remplis : '+report.join(', '));
 e.focus();
 const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
 Object.getOwnPropertyDescriptor(proto,'value').set.call(e,value);
 e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.blur();
 await new Promise(r=>setTimeout(r,150));
 verify();
 const current=resolve()[i][0];
 if(!current||current.value!==value)throw Error(label+' non confirmé. Vérifie D365. Champs précédents : '+report.join(', '));
 if(current.getAttribute('aria-invalid')==='true')throw Error(label+' : valeur refusée par D365. Champs précédents : '+report.join(', '));
 report.push(label);
 }
 return {form,report};
};
})();
