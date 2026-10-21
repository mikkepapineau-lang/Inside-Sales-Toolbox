const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),fixture=require('./d365-fixture.cjs');
const app='project/inside-sales-toolbox-team/';
function model(){const c=vm.createContext({Intl});vm.runInContext(fs.readFileSync(app+'order-model.js','utf8'),c);return c.ToolboxOrderModel;}
function orderForm({order='SO-CA153790',value='Alex Martin\n514 555-0123\nalex@example.test',hidden=false}={}){
 const f=fixture(),root=new f.Node('div',{id:'SalesTable_8'});f.body.append(root);
 const number=f.field('Sales order',order,'SalesTable_8_SalesId_input');root.append(number);
 const notes=f.field('Internal Notes',value,'SalesTable_8_SOLInternalNotes_input');notes.tagName='TEXTAREA';notes.readOnly=true;notes.hidden=hidden;root.append(notes);
 f.load('order-notes-reader.js');return {...f,root,number,notes,read:orders=>f.c.ToolboxOrderNotesReader.read(orders)};
}
async function worker({responses,allowed=true,beforeWrite,original}={}){
 const M=model(),data=original||{at:100,headers:['Sales Order Number','Account Name'],rows:[{values:['SO-CA153790','École Démo']},{values:['SO-CA200000','Studio Démo']}]};let saved=data,writes=0,scripts=0;
 const c=vm.createContext({Intl,URL,Date,console,ToolboxOrderModel:M,powerBIBusy:false,chrome:{permissions:{contains:async()=>allowed},tabs:{query:async()=>responses.map((_,i)=>({id:i,status:'complete',url:'https://solotech.operations.dynamics.com/?cmp=CAOP&mi=SalesTable'}))},scripting:{executeScript:async options=>{scripts++;if(options.files)return [];const response=responses[options.target.tabId];if(response instanceof Error)throw response;assert(options.args[0].includes('SO-CA153790'));beforeWrite?.(()=>saved={...saved,at:999});return [{result:response}];}},storage:{local:{get:async()=>({toolboxPowerBI:saved}),set:async value=>{writes++;saved=value.toolboxPowerBI;}}}}});
 vm.runInContext(fs.readFileSync(app+'order-notes-worker.js','utf8'),c);
 return {c,data,saved:()=>saved,writes:()=>writes,scripts:()=>scripts};
}
(async()=>{
 const M=model(),note='Alex Martin\n514 555-0123\n<contact>@example.test',data={headers:['Sales Order Number','Account Name','Internal Notes'],rows:[{values:['SO-1','Client',note]},{values:['SO-2','Autre','']}]};
 assert.equal(M.columns(['Notes internes']).notes,0);assert.equal(M.columns(['SOLInternalNotes']).notes,0);assert.equal(M.columns(['Customer Notes']).notes,-1);
 assert.equal(M.notes(data,data.rows[0]).value,note);assert.equal(M.notes(data,data.rows[1]).available,true);assert.equal(M.notes(data,data.rows[1]).value,'');
 const fallback={values:['SO-3','Client',''],unreadColumns:[2],internalNotes:{order:'SO-3',value:note,source:'D365',at:100}};
 assert.equal(M.notes(data,fallback).source,'D365');fallback.internalNotes.order='SO-OTHER';assert.equal(M.notes(data,fallback).available,false);fallback.internalNotes.order='SO-3';
 assert.equal(M.select({...data,rows:[fallback]},{query:'<contact>@'}).rows.length,1);
 assert.equal(M.notes(data,{...fallback,unreadColumns:[]}).source,'Power BI','confirmed empty report cells remain empty');
 let f=orderForm();const r=await f.read(['SO-CA153790']);assert.equal(r.order,'SO-CA153790');assert.equal(r.value,f.notes.value);assert.equal(f.notes.readOnly,true);
 f=orderForm({value:''});assert.equal((await f.read(['SO-CA153790'])).value,'');
 f=orderForm({hidden:true});let edits=0,headers=0;const edit=f.button('Edit','SalesTable_8_SystemDefinedViewEditButton',()=>{edits++;});f.root.append(edit);
 const header=f.button('Header','SalesTable_8_Header',()=>{headers++;f.later(400,()=>f.notes.hidden=false);});header.attrs.role='tab';header.attrs['aria-selected']='false';f.root.append(header);
 assert.equal((await f.read(['SO-OTHER'])).error,'Cette commande n’est pas dans la sélection demandée.');assert.equal(headers,0);
 assert.equal((await f.read(['SO-CA153790'])).value,f.notes.value);assert.equal(headers,1);assert.equal(edits,0);
 f=orderForm();const conflict=f.field('Sales order','SO-CA999999','SalesTable_8_Conflicting_SalesId_input');f.root.append(conflict);assert.match((await f.read()).error,/ambigu/);
 f=orderForm({hidden:true});const changed=f.button('Header','SalesTable_8_Header',()=>{f.number.value='SO-CA999999';f.notes.hidden=false;});f.root.append(changed);assert.match((await f.read()).error,/changé/);
 f=orderForm();f.c.location.href='https://solotech.operations.dynamics.com/?cmp=USOP';assert.match((await f.read()).error,/CAOP/);
 const result={order:'SO-CA153790',source:'D365',value:note,at:200};
 let w=await worker({responses:[result,{order:'SO-CA999999',source:'D365',value:'Unrelated',at:200}]});
 const enriched=await w.c.collectPowerBIOrderNotes(w.data);assert.equal(enriched.matched,1);assert.equal(enriched.data.rows[0].internalNotes.value,note);assert.equal(enriched.data.rows[1].internalNotes,undefined);assert.equal(w.data.rows[0].internalNotes,undefined);
 await w.c.readPowerBIOrderNotes('SO-CA153790');assert.equal(w.writes(),1);assert.equal(w.saved().rows[0].internalNotes.value,note);
 w=await worker({responses:[result,{...result,value:'Conflicting'}]});await assert.rejects(w.c.readPowerBIOrderNotes('SO-CA153790'),/différentes/);assert.equal(w.writes(),0);
 w=await worker({responses:[result],allowed:false});await assert.rejects(w.c.readPowerBIOrderNotes('SO-CA153790'),/Autorise/);assert.equal(w.scripts(),0);
 w=await worker({responses:[result],beforeWrite:change=>change()});await assert.rejects(w.c.readPowerBIOrderNotes('SO-CA153790'),/relevé a changé/);assert.equal(w.writes(),0);
 w=await worker({responses:[new Error('Tab closed')]});assert.equal((await w.c.collectPowerBIOrderNotes(w.data)).matched,0);assert.equal(w.writes(),0);
 await assert.rejects(w.c.readPowerBIOrderNotes('SO-CA000000'),/plus dans le relevé/);
 console.log('PASS Internal Notes: bilingual headers, multiline text, empty vs missing, exact SO, report priority, note search, read-only D365 forms, delayed header, no Edit, changed/wrong company guards, conflicting tabs and stale snapshot protection');
})().catch(e=>{console.error(e);process.exitCode=1;});
