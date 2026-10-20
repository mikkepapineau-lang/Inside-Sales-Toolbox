const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const dir='project/inside-sales-toolbox-team/';
const run=(file,context)=>vm.runInContext(fs.readFileSync(dir+file,'utf8'),context);
const timer=(f)=>{f();return 0};
async function contactTests(){
 class Input{constructor(label){this.label=label;this.tagName='INPUT';this.form='SalesQuotationTable';this.id='custom_'+label;this.name='';this.labels=[];this.isConnected=true;this.maxLength=0;this._value='old';this.parentElement=null;}get value(){return this._value;}set value(v){this._value=v;}getAttribute(k){return k==='aria-label'?this.label:null;}matches(){return true;}focus(){}blur(){}dispatchEvent(){}}
 const make=(duplicate=false,missing=false)=>{const fields=['Internal Notes','Delivery contact information',...(missing?[]:['Email']),...(duplicate?['Email']:[])].map(l=>new Input(l));const context=vm.createContext({location:{hostname:'solotech.operations.dynamics.com'},document:{getElementById:()=>null,querySelectorAll:()=>[]},HTMLInputElement:Input,HTMLTextAreaElement:Input,Event:class{},setTimeout:timer,D365Controls:{all:()=>fields,visible:()=>true,formMatch:(e,f)=>e.form===f,controlMatch:()=>false,find:()=>null}});run('contact-fill.js',context);return {fields,context};};
 const values={notes:'Jean\n514\nmail',delivery:'Jean - 514',email:'jean@example.com',phone:'514'};
 let {fields,context}=make();const r=await context.fillClientContacts(values);assert.equal(r.report.length,3);assert.equal(fields[2].value,values.email);assert.equal(context.diagnoseClientContacts().forms[0].fields[0].id,'custom_Internal Notes');
 ({fields,context}=make(true));await assert.rejects(context.fillClientContacts(values),/plusieurs/);assert(fields.every(f=>f.value==='old'));
 ({fields,context}=make(false,true));await assert.rejects(context.fillClientContacts(values),/introuvable/);assert(fields.every(f=>f.value==='old'));
 console.log('PASS contact fallback on changed IDs, ambiguity and missing-field preflight');
}
async function workerTests(){
 let saved={},local={},created=0,tab={id:42,url:'https://app.powerbi.com/groups/a/reports/b',status:'complete'};
 const chrome={storage:{session:{get:async()=>saved,set:async v=>Object.assign(saved,v)},local:{set:async v=>Object.assign(local,v)}},permissions:{contains:async()=>true},tabs:{get:async()=>tab,query:async()=>[tab],create:async()=>{created++;return tab;},update:async()=>tab},windows:{update:async()=>{}},runtime:{id:'self',onMessage:{addListener:()=>{}}},scripting:{executeScript:async args=>args.files?[]:[{frameId:0,result:{headers:['Sales Order Number','Customer'],rows:[{values:['SO-CA123','Example'],href:''}],partial:true}}]}};
 const c=vm.createContext({chrome,URL,setTimeout:timer,ToolboxTabGroup:{add:async tab=>tab}});run('powerbi-worker.js',c);
 const original=chrome.scripting.executeScript;chrome.scripting.executeScript=async args=>{if(args.target.allFrames)throw Error('Blocked');return original(args);};
 await c.readPowerBI('powerBIBind');await c.readPowerBI('powerBIRead');await c.readPowerBI('powerBIRead');assert.equal(created,0);assert.equal(local.toolboxPowerBI.rows.length,1);
 tab={...tab,url:'https://app.powerbi.com/singleSignOn'};await assert.rejects(c.readPowerBI('powerBIRead'),/Connecte-toi/);assert.equal(local.toolboxPowerBI.rows.length,1);assert.equal(local.toolboxPowerBIStatus.state,'error');
 tab={...tab,url:'https://app.powerbi.com/groups/a/reports/b'};chrome.scripting.executeScript=async()=>{throw Error('Blocked')};
 const diagnostic=await c.readPowerBI('powerBIDiagnostic');assert.match(diagnostic.stage,/page principale/);assert.equal(diagnostic.error,'Blocked');assert.equal(local.toolboxPowerBI.rows.length,1);assert.match(local.toolboxPowerBIStatus.message,/Accès au contenu/);
 console.log('PASS bound-tab reuse, restricted-child-frame isolation, sign-in guard and stage-specific Blocked diagnostics');
}
async function readerTests(){
 const cell=(t)=>({innerText:t,textContent:t,getAttribute:()=>null,contains:()=>false,getClientRects:()=>[{}]});
 const header=['Sales Order Number','Customer','Total Not Invoiced'].map(cell);
 const row={querySelectorAll:s=>s==='a[href]'?[]:['SO-CA123','Example','12.50'].map(cell),getClientRects:()=>[{}]};
 const table={querySelectorAll:s=>s.includes('columnheader')?header:s.includes('[role="row"]')?[row]:[],getClientRects:()=>[{}],contains:()=>false,clientHeight:100,scrollHeight:100};
 let ready=true,duplicate=false;
 const doc={body:{get innerText(){return ready?'Order Completely Ready to PIK':'Other report';}},querySelector:()=>null,querySelectorAll:s=>s.includes('[role="grid"]')?(duplicate?[table,{...table}]:[table]):[]};
 const c=vm.createContext({document:doc,location:{origin:'https://app.powerbi.com',href:'https://app.powerbi.com/'},getComputedStyle:()=>({visibility:'visible',display:'block'}),setTimeout:timer,URL,Event:class{}});run('powerbi-reader.js',c);
 let r=await c.ToolboxPowerBIReader.read();assert.equal(r.rows.length,1);assert.equal(r.partial,true);assert.equal(r.rows[0].href,'');
 ready=false;r=await c.ToolboxPowerBIReader.read();assert.match(r.error,/confirmée/);
 let clicked=0;ready=false;const baseQuery=doc.querySelectorAll;const nav={innerText:'Ready to PIK',getAttribute:()=>null,getClientRects:()=>[{}],contains:()=>false,click:()=>{clicked++;ready=true;}};doc.querySelectorAll=s=>s.includes('[role=\"tab\"]')?[nav]:baseQuery(s);await c.ToolboxPowerBIReader.ensureReady();assert.equal(clicked,1);await c.ToolboxPowerBIReader.ensureReady();assert.equal(clicked,1);ready=false;doc.querySelectorAll=s=>s.includes('[role=\"tab\"]')?[nav,{...nav}]:baseQuery(s);await assert.rejects(c.ToolboxPowerBIReader.ensureReady(),/2 cible/);
 ready=true;duplicate=true;r=await c.ToolboxPowerBIReader.read();assert.match(r.error,/Plusieurs/);
 console.log('PASS accessible-table extraction, automatic Ready-to-PIK navigation, no duplicate clicks and ambiguity guards');
}
(async()=>{await contactTests();await workerTests();await readerTests();})().catch(e=>{console.error(e);process.exit(1)});
