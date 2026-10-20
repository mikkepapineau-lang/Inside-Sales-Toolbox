const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const dir='project/inside-sales-toolbox-team/';
function fixture({missing=false,resetSite=false,readOnly=false}={}){
 let time=0,ok=0;const writes=[];
 class Clock extends Date{static now(){return time;}}
 class Input{
  constructor(label,value){this.tagName='INPUT';this.labels=[{innerText:label}];this.label=label;this._value=value;this.type='text';this.disabled=false;this.readOnly=label==='Site'&&readOnly;}
  get value(){return this._value;}set value(v){this._value=v;}
  getAttribute(){return null;}getClientRects(){return [{}];}focus(){}blur(){}
  dispatchEvent(event){if(event.type==='change'){writes.push(this.label);if(this.label==='Site')inputs.find(e=>e.label==='Warehouse').value='';if(this.label==='Warehouse'&&resetSite)inputs.find(e=>e.label==='Site').value='MTL';}}
 }
 const inputs=[['Sales origin',''],['Payment',''],['Prospect','CAOP-1234'],['Name of prospect','Test Company'],['Quotation','SQ-TEST'],...(!missing?[['Site','MTL']]:[]),['Warehouse','YUL-01']].map(([l,v])=>new Input(l,v));
 const button={tagName:'BUTTON',innerText:'OK',getClientRects:()=>[{}],getAttribute:()=>null,click(){ok++;assert.equal(inputs.find(e=>e.label==='Site').value,'QUE');assert.equal(inputs.find(e=>e.label==='Warehouse').value,'QUE-04');}};
 const doc={querySelectorAll:s=>s==='input,select,textarea'?inputs:s==='*'?[...inputs,button]:s.startsWith('button,')?[button]:[]};
 const c=vm.createContext({document:doc,location:{hostname:'solotech.operations.dynamics.com'},getComputedStyle:()=>({visibility:'visible'}),HTMLInputElement:Input,HTMLTextAreaElement:Input,HTMLSelectElement:Input,Event:class{constructor(type){this.type=type;}},Date:Clock,setTimeout:(f,n)=>{time+=n;f();}});
 for(const file of ['warehouse-model.js','quotation.js'])vm.runInContext(fs.readFileSync(dir+file,'utf8'),c);
 return {c,writes,ok:()=>ok};
}
const args={site:'QUE',warehouse:'QUE-04',expectedName:'Test Company',expectedAccount:'CAOP-1234'};
(async()=>{
 let f=fixture();const result=await f.c.solotechQuotation.create(args);assert.equal(f.ok(),1);assert.equal(result.site,'QUE');assert.equal(result.warehouse,'QUE-04');assert.deepEqual(f.writes,['Sales origin','Payment','Site','Warehouse']);
 f=fixture();await assert.rejects(f.c.solotechQuotation.create({...args,site:'MTL'}),/invalide/);assert.equal(f.ok(),0);assert.equal(f.writes.length,0);
 f=fixture({resetSite:true});await assert.rejects(f.c.solotechQuotation.create(args),/Site.*non retenue/);assert.equal(f.ok(),0);
 f=fixture({missing:true});await assert.rejects(f.c.solotechQuotation.create(args),/Site.*introuvable/);assert.equal(f.ok(),0);
 f=fixture({readOnly:true});await assert.rejects(f.c.solotechQuotation.create(args),/Site.*introuvable/);assert.equal(f.ok(),0);
 // Reject forged UI messages before opening any Dynamics tab or touching a record.
 let touched=0;const c=vm.createContext({chrome:{storage:{session:{set:async()=>{touched++;}}},runtime:{onMessage:{addListener(){}}}}});
 for(const file of ['warehouse-model.js','d365-worker.js'])vm.runInContext(fs.readFileSync(dir+file,'utf8'),c);
 await assert.rejects(c.d365Run('quote',{site:'MTL',warehouse:'QUE-01'}),/invalide/);assert.equal(touched,0);
 console.log('PASS Site before Warehouse, readback before OK, invalid-pair preflight, changed/missing/read-only site blocks submission and worker rejects forged cross-site messages');
})().catch(e=>{console.error(e);process.exitCode=1;});
