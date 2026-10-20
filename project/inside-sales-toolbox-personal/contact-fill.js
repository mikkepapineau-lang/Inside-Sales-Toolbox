(()=>{
globalThis.fillClientContacts=async function(v){
 if(location.hostname!=='solotech.operations.dynamics.com')throw Error('Ouvre une soumission ou une commande dans D365.');
 const forms=['SalesQuotationTable','SalesTable'];
 const found=forms.map(form=>({form,notes:D365Controls.find(form,'SOLInternalNotes','field')})).filter(x=>x.notes);
 if(found.length!==1)throw Error('Ouvre le formulaire en mode Edit, avec les champs visibles. Aucun formulaire unique modifiable trouvé.');
 const {form,notes}=found[0],order=form==='SalesTable';
 const controls=[
 [notes,v.notes,'Internal Notes'],
 [D365Controls.find(form,order?'SOLDeliveryContactInfo':'SOLDocumentDeliveryContact','field'),v.delivery,'Delivery contact information'],
 [D365Controls.find(form,order?'SysGen_{B94891EA-2350-41BD-8414-F4003D91BFEC}':'SysGen_{9056FF81-DEA8-430E-A877-AA7E2EA628C9}','field'),v.email,'Email']
 ];
 if(order)controls.push([D365Controls.find(form,'SysGen_{1FA28D3A-D8FA-40AC-A2AE-DB84EB7766C6}','field'),v.phone,'Telephone']);
 for(const [e,value,label] of controls){if(!e)throw Error(label+' introuvable. Aucun champ modifié.');if(e.maxLength>0&&value.length>e.maxLength)throw Error(label+' : texte trop long. Aucun champ modifié.');}
 const report=[];
 for(const [e,value,label] of controls){
 if(!e.isConnected)throw Error('Le formulaire a changé. Vérifie les champs déjà remplis : '+report.join(', '));
 e.focus();
 const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
 Object.getOwnPropertyDescriptor(proto,'value').set.call(e,value);
 e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.blur();
 await new Promise(r=>setTimeout(r,150));
 if(e.value!==value)throw Error(label+' non confirmé. Vérifie D365. Champs précédents : '+report.join(', '));
 report.push(label);
 }
 return {form,report};
};
})();
