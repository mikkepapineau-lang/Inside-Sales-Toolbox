const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const dir='project/inside-sales-toolbox-team/';
const run=(file,context)=>vm.runInContext(fs.readFileSync(dir+file,'utf8'),context);
const timer=(f)=>{f();return 0};
async function readerTests(){
 const cell=(t)=>({innerText:t,textContent:t,getAttribute:()=>null,contains:()=>false,getClientRects:()=>[{}]});
 const header=['SKU','Description','QTY AVAILABLE'].map(cell);
 const row={querySelector:()=>null,querySelectorAll:s=>s==='a[href]'?[]:['SM58-LC','Used microphone','3'].map(cell),getClientRects:()=>[{}]};
 const table={getAttribute:()=>null,querySelectorAll:s=>s.includes('columnheader')?header:s.includes('[role="row"]')?[row]:[],getClientRects:()=>[{}],contains:()=>false,clientHeight:100,scrollHeight:100};
 let ready=true,duplicate=false;
 const doc={body:{get innerText(){return ready?'Order Completely Ready to PIK':'Other report';}},querySelector:()=>null,querySelectorAll:s=>s.includes('[role="grid"]')?(ready?(duplicate?[table,{...table}]:[table]):[]):[]};
 const c=vm.createContext({document:doc,location:{origin:'https://app.powerbi.com',href:'https://app.powerbi.com/'},getComputedStyle:()=>({visibility:'visible',display:'block'}),setTimeout:timer,URL,Event:class{}});run('used-powerbi-reader.js',c);
 let r=await c.ToolboxUsedPowerBIReader.read();assert.equal(r.rows.length,1);assert.equal(r.partial,true);assert.equal(r.rows[0].href,'');
 ready=false;r=await c.ToolboxUsedPowerBIReader.read();assert.match(r.error,/non accessible/);
 let clicked=0;ready=false;const baseQuery=doc.querySelectorAll;const nav={innerText:'LP Catalog - Used Gear',getAttribute:()=>null,getClientRects:()=>[{}],contains:()=>false,click:()=>{clicked++;ready=true;}};doc.querySelectorAll=s=>s.includes('[role=\"tab\"]')?[nav]:baseQuery(s);await c.ToolboxUsedPowerBIReader.ensureReady();assert.equal(clicked,1);await c.ToolboxUsedPowerBIReader.ensureReady();assert.equal(clicked,1);ready=false;doc.querySelectorAll=s=>s.includes('[role=\"tab\"]')?[nav,{...nav}]:baseQuery(s);await assert.rejects(c.ToolboxUsedPowerBIReader.ensureReady(),/2 cible/);
 ready=true;duplicate=true;r=await c.ToolboxUsedPowerBIReader.read();assert.match(r.error,/Plusieurs/);
 console.log('PASS accessible-table extraction, automatic Ready-to-PIK navigation, no duplicate clicks and ambiguity guards');
}
readerTests().catch(e=>{console.error(e);process.exit(1)});
