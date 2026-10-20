const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir='project/inside-sales-toolbox-team/';
const lead={phoneName:'vincent BENOIT',phone:'5145551234',extension:'6062',email:'Vincent@Example.test'};
function fixture({missing=false,duplicate=false,changeDuringFill=false,invalidEmail=false,missingDraftNumber=false}={}){
 let clock=0,created=false,editable=false,ok=0,edit=0,active=[];const writes=[];
 class Clock extends Date{static now(){return clock;}}
 class Input{
  constructor(label,value='',readonly=false){this.tagName='INPUT';this.type='text';this.labels=[{textContent:label,innerText:label}];this.label=label;this.id='SalesQuotationTable_9_custom_'+Math.random().toString(36).slice(2)+'_input';this.name='';this._value=value;this.readOnly=readonly;this.disabled=false;this.isConnected=true;this.maxLength=0;this.attrs={};}
  get value(){return this._value;}set value(v){this._value=v;}
  getAttribute(key){return key==='id'?this.id:this.attrs[key]??null;}
  getClientRects(){return [{}];}querySelectorAll(){return [];}contains(){return false;}matches(selector){return /input/.test(selector);}focus(){}blur(){}
  dispatchEvent(event){if(event.type==='change'){writes.push(this.label);if(created&&changeDuringFill)quoteNumber.value='SQ-OTHER';if(created&&invalidEmail&&this.label==='Courriel')this.attrs['aria-invalid']='true';}}
 }
 const initial=[['Sales origin',''],['Payment',''],['Prospect','CAOP-1234'],['Name of prospect','Test Company'],['Quotation',missingDraftNumber?'':'SQ-TEST'],['Site','MTL'],['Warehouse','YUL-01']].map(([l,v])=>new Input(l,v));
 const quoteNumber=new Input('Quotation','SQ-TEST',true),fields=[new Input('Notes internes','old notes',true),new Input('Coordonnées du contact de livraison','old delivery',true),...(!missing?[new Input('Courriel','old@example.test',true)]:[]),...(duplicate?[new Input('Email','other@example.test',true)]:[])];
 active=initial;
 const button=(name,click)=>({tagName:'BUTTON',innerText:name,disabled:false,getClientRects:()=>[{}],getAttribute:()=>null,querySelectorAll:()=>[],contains:()=>false,matches:s=>s.includes('button'),click});
 const createdProspect=new Input('Prospect','CAOP-1234',true);
 const okButton=button('OK',()=>{ok++;created=true;active=[quoteNumber,createdProspect,...fields];}),editButton=button('Edit',()=>{edit++;editable=true;for(const f of fields)f.readOnly=false;});
 const buttons=()=>created?(editable?[]:[editButton]):[okButton];
 const doc={getElementById:()=>null,querySelectorAll:s=>s==='*'?[...active,...buttons()]:s==='input,select,textarea'||s==='input,textarea'?active:s.startsWith('button,')?buttons():[]};
 const c=vm.createContext({document:doc,location:{hostname:'solotech.operations.dynamics.com'},getComputedStyle:()=>({visibility:'visible'}),HTMLInputElement:Input,HTMLTextAreaElement:Input,HTMLSelectElement:Input,Event:class{constructor(type){this.type=type;}},Date:Clock,setTimeout:(f,ms)=>{clock+=ms;f();}});
 for(const file of ['contact-model.js','warehouse-model.js','d365-controls.js','contact-fill.js','quotation.js'])vm.runInContext(fs.readFileSync(dir+file,'utf8'),c);
 const contacts=c.ContactModel.values(c.ContactModel.fromLead(lead));
 return {c,contacts,fields,quoteNumber,writes,ok:()=>ok,edit:()=>edit,show(){created=true;editable=true;active=[quoteNumber,...fields];for(const f of fields)f.readOnly=false;}};
}
const args={site:'QUE',warehouse:'QUE-01',expectedName:'Test Company',expectedAccount:'CAOP-1234'};
(async()=>{
 let f=fixture();assert.equal(f.contacts.notes,'Vincent Benoit\n(514) 555-1234 #6062\nvincent@example.test');
 // Embedded and separate extensions share exactly the same normalization in both modules.
 assert.equal(f.c.ContactModel.fromLead({...lead,phone:'5145551234 ext 55',extension:''}).phone,'(514) 555-1234 #55');
 assert.equal(f.c.ContactModel.fromLead({...lead,phone:'5145551234 #6062'}).phone,'(514) 555-1234 #6062');
 assert.equal(f.c.ContactModel.fromLead({emailName:'marie claire',phone:'5145551234',email:'MARIE@example.test'}).name,'Marie Claire');
 let r=await f.c.solotechQuotation.create({...args,contacts:f.contacts});assert.equal(f.ok(),1);assert.equal(f.edit(),1);assert.equal(r.contactsPending,undefined);assert.equal(r.contacts.filled,true);assert.equal(r.contacts.report.length,3);assert(r.message.includes('Email'));
 assert.deepEqual(f.fields.map(e=>e.value),[f.contacts.notes,f.contacts.delivery,f.contacts.email]);
 f=fixture({missingDraftNumber:true});r=await f.c.solotechQuotation.create({...args,contacts:f.contacts});assert.equal(r.number,'SQ-TEST');assert.equal(r.contacts.filled,true);assert.equal(f.ok(),1);
 // Changed D365 IDs still resolve through the same label-based fallback as the Contacts module.
 f=fixture();f.show();r=await f.c.solotechQuotation.fillCreatedContacts('SQ-TEST',f.contacts);assert.equal(r.form,'SalesQuotationTable');assert.equal(r.report.length,3);
 for(const options of [{missing:true},{duplicate:true}]){
  f=fixture(options);r=await f.c.solotechQuotation.create({...args,contacts:f.contacts});assert.equal(f.ok(),1);assert.equal(r.contactsPending,true);assert(r.message.includes('Ne recrée pas'));assert(f.fields.every(e=>e.value.startsWith('old')||e.value.startsWith('other')));
 }
 f=fixture({invalidEmail:true});r=await f.c.solotechQuotation.create({...args,contacts:f.contacts});assert.equal(r.contactsPending,true);assert(r.message.includes('refusée'));assert.equal(f.ok(),1);
 f=fixture({changeDuringFill:true});r=await f.c.solotechQuotation.create({...args,contacts:f.contacts});assert.equal(r.contactsPending,true);assert.equal(f.fields[1].value,'old delivery');assert.equal(f.fields[2].value,'old@example.test');assert.equal(f.ok(),1);
 f=fixture();f.show();await assert.rejects(f.c.solotechQuotation.fillCreatedContacts('SQ-WRONG',f.contacts),/répond|correspond/);assert(f.fields.every(e=>e.value.startsWith('old')));
 console.log('PASS full quotation creation shares Contact fields/formatting, includes Email, preserves extensions, supports custom IDs/French labels, and keeps created quotes on missing/ambiguous/invalid fields or navigation changes');
})().catch(e=>{console.error(e);process.exitCode=1;});
