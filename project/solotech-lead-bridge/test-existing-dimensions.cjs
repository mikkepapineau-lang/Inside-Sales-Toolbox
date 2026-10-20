const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const B=require('./model.js');
assert.equal(B.suggest('(438) 563-8596').tax,'GST&QST');
assert.equal(B.normalize({contact:'samuel mok'}).first,'Samuel');
assert.equal(B.normalize({first:'michaël',last:'papineau'}).last,'Papineau');
// Exercise the real quotation engine against the Person layout and collapsed Sell ribbon.
let mode='person',sell=false,saves=0,oks=0;const actions=[];
class Input{constructor(label,v='',ro=false){this.labels=[{innerText:label}];this._value=v;this.readOnly=ro;this.tagName='INPUT';}get value(){return this._value}set value(v){this._value=v}getClientRects(){return [1]}getAttribute(){return null}focus(){}blur(){}dispatchEvent(){}}
const person=[new Input('Account','CAOP-009559',true),new Input('First name','Samuel'),new Input('Last name','Mok'),...['ACTIVITY','DEPARTMENT','DIVISION','OFFICE','TERRITORY','CATEGORY','EVENTSR2','INTERCO','PROJECTSI'].map(x=>new Input(x))];
const quote=[new Input('Prospect','CAOP-009559',true),new Input('Name of prospect','Samuel Mok',true),...['Sales origin','Payment','Warehouse'].map(x=>new Input(x))];
const btn=(name,fn)=>({innerText:name,getClientRects:()=>[1],getAttribute:()=>null,click:fn});
const save=btn('Save',()=>{throw Error('Already correct: Save must not be clicked')});save.disabled=true;
const sellBtn=btn('Sell',()=>{sell=true;actions.push('Sell')});
const sales=btn('Sales quotation',()=>{mode='quote';actions.push('Sales quotation')});
const globalNew=btn('New',()=>{throw Error('Must not click global New to create a quotation')});
const ok=btn('OK',()=>{oks++;actions.push('OK')});
const document={body:{get innerText(){return mode==='quote'?'Create sales quotation':'Default financial dimensions'}},querySelectorAll:s=>s==='*'?[]:s==='input,select,textarea'?(mode==='quote'?quote:person):s==='[role="option"]'?[]:mode==='quote'?[ok]:[save,sellBtn,globalNew,...(sell?[sales]:[])]};
const ctx={document,location:{hostname:'solotech.operations.dynamics.com'},getComputedStyle:()=>({visibility:'visible'}),HTMLInputElement:Input,Event:class{},setTimeout:f=>f()};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/quotation.js','utf8'),ctx);
(async()=>{
 for(const [label,value] of [['ACTIVITY','ECOMM'],['DEPARTMENT','021'],['DIVISION','003'],['OFFICE','MONTREAL'],['TERRITORY','MONTREAL']])person.find(e=>e.labels[0].innerText===label).value=value;
 await ctx.solotechQuotation.fillDimensions({expectedName:'Samuel Mok',expectedAccount:'CAOP-009559'});
 for(const [label,v] of [['ACTIVITY','ECOMM'],['DEPARTMENT','021'],['DIVISION','003'],['OFFICE','MONTREAL'],['TERRITORY','MONTREAL'],['CATEGORY',''],['EVENTSR2',''],['INTERCO',''],['PROJECTSI','']])assert.equal(person.find(x=>x.labels[0].innerText===label).value,v);
 assert.equal(oks,0);
 await assert.rejects(()=>ctx.solotechQuotation.create({expectedName:'Samuel Mok',expectedAccount:'CAOP-000000',warehouse:'YUL-01'}),/ne correspond/);
 await ctx.solotechQuotation.create({expectedName:'Samuel Mok',expectedAccount:'CAOP-009559',warehouse:'YUL-01'});
 assert.deepEqual(actions,['Sell','Sales quotation','OK']);assert.equal(oks,1);
 await assert.rejects(()=>ctx.solotechQuotation.create({expectedName:'Samuel Mok',expectedAccount:'CAOP-009559',warehouse:'YUL-01'}),/déjà/);
 // Async form readiness: first scan has no fields, then only Type, then identity.
 let scans=0,filled=0,clock=0;
 const flowDoc={body:{innerText:'Create prospect'},querySelectorAll:()=>[]};
 const fc={document:flowDoc,location:{href:'https://solotech.operations.dynamics.com/?cmp=CAOP&mi=smmBusinessRelationsListPage'},URL,Bridge:B,getComputedStyle:()=>({visibility:'visible'}),setTimeout:f=>{clock+=300;f()},Date:{now:()=>clock},solotechBridge:{setType:async()=>{scans++;},scan:()=>({token:'x',fields:[{key:'a',label:'First name'},{key:'b',label:'Last name'}]}),fill:async()=>{filled++;return []}}};
 vm.createContext(fc);vm.runInContext(fs.readFileSync(__dirname+'/d365-flow.js','utf8'),fc);
 const data=B.normalize({contact:'samuel mok',email:'samuel@gmail.com'});
 await fc.solotechFlow.fillDraft({data,overwrite:true});assert.equal(filled,1);assert.equal(data.first,'Samuel');
 console.log('OK — dimensions déjà correctes et Save désactivé : passage direct à Sales quotation; 438, noms, Person, dimensions après création, MONTREAL par défaut, Sell > Sales quotation, garde identité et clic OK unique.');
})().catch(e=>{console.error(e);process.exitCode=1});
