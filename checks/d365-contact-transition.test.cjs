const assert=require('node:assert/strict'),fixture=require('./d365-fixture.cjs');
function quotationFixture({changeQuote=false,duplicateEmail=false,stuck=false,identity='field',conflict=false,numberValue='SQ-1234',technicalEdit=false}={}){
 const f=fixture();f.document.visibilityState='hidden';let headers=0,edits=0,expands=0,wakes=0,editable=false,fields=[];
 const container=new f.Node('section',{id:'SalesQuotationTable_4'}),headerPanel=new f.Node('section',{id:'quotation-header'}),deliveryPanel=new f.Node('section',{id:'quotation-delivery'});
 f.body.append(container);container.append(headerPanel);headerPanel.append(deliveryPanel);headerPanel.hidden=true;deliveryPanel.hidden=true;
 const number=f.field('Quotation',numberValue,'SalesQuotationTable_4_QuotationId_input');headerPanel.append(number);number.readOnly=true;let heading;
 if(identity==='span'){number.tagName='SPAN';number.innerText=numberValue;}
 if(['heading','caption','linked','aria'].includes(identity)){
  heading=new f.Node(identity==='caption'?'div':'h1',{id:identity==='linked'?'current-quotation-title':identity==='caption'?'SalesQuotationTable_4_FormCaption':'SalesQuotationTable_4_Heading'});heading.innerText='Sales quotation: '+numberValue+' · Test Company';
  if(identity==='linked'){f.body.append(heading);container.attrs['aria-labelledby']=heading.id;}else container.append(heading);
  if(identity==='aria'){heading.attrs['aria-label']=heading.innerText;heading.innerText='Sales quotation';}
  if(!conflict)number.remove();else{number.value='SQ-OTHER';container.append(number);}
 }
 if(identity==='none')number.remove();
 const header=f.button('Header','SalesQuotationTable_4_Header',()=>{headers++;f.later(600,()=>{headerPanel.hidden=false;header.attrs['aria-selected']='true';mount();});});container.append(header);header.attrs.role='tab';header.attrs['aria-selected']='false';
 const edit=f.button(technicalEdit?'Icon only':'Edit','SalesQuotationTable_4_'+(technicalEdit?'SystemDefinedViewEditButton':'Edit'),()=>{edits++;});container.append(edit);
 const expand=f.button('Delivery','SalesQuotationTable_4_Delivery',()=>{expands++;expand.attrs['aria-expanded']='true';f.later(500,()=>deliveryPanel.hidden=false);});headerPanel.append(expand);expand.attrs['aria-expanded']='false';expand.attrs['aria-controls']='quotation-delivery';
 function mount(values=['old notes','old delivery','old@example.test']){
  for(const e of fields)e.remove();
  fields=[['Internal Notes','SOLInternalNotes'],['Delivery contact information','SOLDocumentDeliveryContact'],['Email','SysGen_{9056FF81-DEA8-430E-A877-AA7E2EA628C9}']].map(([label,id],i)=>{const e=f.field(label,values[i],'SalesQuotationTable_4_'+id+'_input');(i===1?deliveryPanel:headerPanel).append(e);e.readOnly=!editable;return e;});
  // D365 can replace controls after a field commits. Subsequent writes must re-resolve them.
  fields[0].events.change=()=>{const values=fields.map(e=>e.value);f.later(80,()=>{mount(values);if(changeQuote){number.value='SQ-OTHER';if(heading)heading.innerText='Sales quotation: SQ-OTHER';}});};
  if(duplicateEmail){const extra=f.field('Email','other@example.test','SalesQuotationTable_4_Email2_input');extra.readOnly=!editable;headerPanel.append(extra);fields.push(extra);}
 }
 const onBlocked=async()=>{wakes++;f.document.visibilityState='visible';if(!stuck)f.later(900,()=>{editable=true;edit.remove();for(const e of fields)e.readOnly=false;});};
 return {...f,container,number,onBlocked,fields:()=>fields,counts:()=>({headers,edits,expands,wakes})};
}
const contacts={notes:'Vincent Benoit\n(514) 555-1234 #6062\nvincent@example.test',delivery:'Vincent Benoit - (514) 555-1234 #6062',email:'vincent@example.test'};
(async()=>{
 let f=quotationFixture();const r=await f.c.solotechQuotation.fillCreatedContacts('SQ-1234',contacts,{onBlocked:f.onBlocked});
 assert.equal(r.filled,true);assert.equal(r.report.length,3);assert.deepEqual(f.fields().map(e=>e.value),[contacts.notes,contacts.delivery,contacts.email]);assert.deepEqual(f.counts(),{headers:1,edits:1,expands:1,wakes:1});
 f=quotationFixture({stuck:true});await assert.rejects(f.c.solotechQuotation.fillCreatedContacts('SQ-1234',contacts,{onBlocked:f.onBlocked}),/lecture seule/);assert.equal(f.counts().edits,1);assert(f.fields().every(e=>e.value.startsWith('old')));
 f=quotationFixture({changeQuote:true});await assert.rejects(f.c.solotechQuotation.fillCreatedContacts('SQ-1234',contacts,{onBlocked:f.onBlocked}),/correspond plus/);assert.equal(f.fields()[1].value,'old delivery');assert.equal(f.fields()[2].value,'old@example.test');
 f=quotationFixture();await assert.rejects(f.c.solotechQuotation.fillCreatedContacts('SQ-WRONG',contacts,{onBlocked:f.onBlocked}),/correspond plus/);assert.equal(f.counts().headers,1);assert.equal(f.counts().edits,0);
 // Regression for SQ-CA186187: its number can exist only in a read-only title/caption.
 for(const identity of ['heading','caption','linked','span','aria']){
  f=quotationFixture({identity,numberValue:'SQ-CA186187',technicalEdit:identity==='aria'});const other=new f.Node('h1',{id:'SalesTable_9_FormTitle'});other.innerText='SQ-CA999999';f.body.append(other);const untouched=f.field('Internal Notes','untouched','SalesTable_9_SOLInternalNotes_input');
  const result=await f.c.solotechQuotation.fillCreatedContacts('SQ-CA186187',contacts,{onBlocked:f.onBlocked});assert.equal(result.filled,true);assert.equal(f.counts().edits,1);assert.deepEqual(f.fields().map(e=>e.value),[contacts.notes,contacts.delivery,contacts.email]);assert.equal(untouched.value,'untouched');
 }
 // Some creation flows return to a list. Follow only the unique exact new quote link.
 f=quotationFixture({identity:'heading',numberValue:'SQ-CA186187'});f.container.hidden=true;let opens=0;
 const link=new f.Node('a',{id:'smmBusRelTable_2_NewQuoteLink'});link.innerText='SQ-CA186187';link.events.click=()=>{opens++;f.later(400,()=>{f.container.hidden=false;link.hidden=true;});};f.body.append(link);
 for(const attrs of [{href:'https://example.test/SQ-CA186187'},{href:'https://solotech.operations.dynamics.com/?cmp=USOP'},{target:'_blank'}]){const ignored=new f.Node('a',attrs);ignored.innerText='SQ-CA186187';ignored.events.click=()=>{throw Error('Unrelated quote link clicked');};f.body.append(ignored);}
 await f.c.solotechQuotation.fillCreatedContacts('SQ-CA186187',contacts,{onBlocked:f.onBlocked});assert.equal(opens,1);assert.equal(f.fields()[0].value,contacts.notes);
 f=quotationFixture({identity:'heading',numberValue:'SQ-CA1861870'});await assert.rejects(f.c.solotechQuotation.fillCreatedContacts('SQ-CA186187',contacts,{onBlocked:f.onBlocked}),/correspond plus/);assert.equal(f.counts().edits,0);
 f=quotationFixture({identity:'heading',numberValue:'SQ-CA186187',conflict:true});await assert.rejects(f.c.solotechQuotation.fillCreatedContacts('SQ-CA186187',contacts,{onBlocked:f.onBlocked}),/Plusieurs numéros/);assert.equal(f.counts().edits,0);
 f=quotationFixture({identity:'none'});await assert.rejects(f.c.solotechQuotation.fillCreatedContacts('SQ-CA186187',contacts,{onBlocked:f.onBlocked}),/pas encore lisible/);assert.equal(f.counts().edits,0);
 // A label ambiguity must preflight before any of the three values is replaced.
 f=quotationFixture({duplicateEmail:true});f.c.D365Controls.find=()=>null;await assert.rejects(f.c.solotechQuotation.fillCreatedContacts('SQ-1234',contacts,{onBlocked:f.onBlocked}),/plusieurs champs/);assert(f.fields().every(e=>e.value.startsWith('old')||e.value.startsWith('other')));
 console.log('PASS quotation contacts: SQ-CA186187 in title/caption/linked heading/span, reveal identity before Edit, delayed fields, fresh controls after commit, exact number/conflict/missing guards and all-field preflight');
})().catch(e=>{console.error(e);process.exitCode=1;});
