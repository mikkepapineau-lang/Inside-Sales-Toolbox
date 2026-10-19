const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir='project/inside-sales-toolbox-team/',seed=JSON.parse(fs.readFileSync(dir+'used-catalogue-base.json','utf8'));
function setup(initial){
 let state={...initial},fetches=0,permissions=0,tabs=0,inspections=0;const header=seed.headers,id=header.indexOf('D365 Item ID'),qty=header.indexOf('QTY AVAILABLE'),nbv=header.indexOf('NBV'),original=seed.rows.find(r=>r.values[id]==='100813107');
 const values=[...original.values];values[qty]='0';values[nbv]='99999';
 const source={regions:['CANADA','UK','USA'],headers:header,rows:[{values}],currency:'CAD',loadedToEnd:true,complete:false,expected:12851};
 const tab={id:2,windowId:1,status:'complete',url:'https://app.powerbi.com/groups/a/reports/458f40a9-2b3f-4518-a3cb-d699fef65baa/ReportSection'};
 const chrome={storage:{local:{get:async key=>Array.isArray(key)?Object.fromEntries(key.map(k=>[k,state[k]])):{[key]:state[key]},set:async values=>Object.assign(state,values)},session:{get:async()=>({usedPowerBITab:2}),set:async()=>{}}},runtime:{id:'self',getURL:p=>'chrome-extension://self/'+p,onMessage:{addListener:()=>{}}},permissions:{contains:async()=>{permissions++;return true;}},tabs:{get:async()=>{tabs++;return tab;}},scripting:{executeScript:async a=>{if(a.files)return [];if(a.args?.[0]==='ALL')return [{frameId:0,result:{regionReady:true,regions:['CANADA','UK','USA']}}];inspections++;return [{frameId:0,result:source}];}}};
 class Clock extends Date{static now(){return Date.parse('2026-10-15T14:00:00Z');}}
 const c=vm.createContext({chrome,URL,Intl,Date:Clock,setTimeout:f=>f(),fetch:async()=>{fetches++;return {ok:true,json:async()=>structuredClone(seed)};},ToolboxTabGroup:{add:async()=>{}}});for(const f of ['used-catalogue.js','used-regions.js','used-powerbi-worker.js'])vm.runInContext(fs.readFileSync(dir+f,'utf8'),c);
 return {c,state,stats:()=>({fetches,permissions,tabs,inspections}),original,qty,nbv};
}
(async()=>{
 let x=setup();await Promise.all([x.c.readUsedPowerBI('usedPowerBIInit'),x.c.readUsedPowerBI('usedPowerBIInit')]);assert.equal(x.state.toolboxUsedPowerBI.rows.length,12851);assert.equal(x.stats().fetches,1);assert.equal(x.stats().permissions,0);
 await x.c.readUsedPowerBI('usedPowerBIRead');assert.equal(x.state.toolboxUsedPowerBIStatus.state,'cached');assert.equal(x.stats().tabs,0);
 await x.c.readUsedPowerBI('usedPowerBIReadForce');assert.equal(x.stats().inspections,1);assert.equal(x.state.toolboxUsedPowerBI.rows.length,12851);const row=x.state.toolboxUsedPowerBI.rows.find(r=>r.values[4]==='100813107');assert.equal(row.values[x.qty],'0');assert.equal(row.values[x.nbv],x.original.values[x.nbv]);
 const old=x.state.toolboxUsedPowerBI;await assert.rejects(x.c.readUsedPowerBI('usedCatalogueImport',{mode:'quantities',data:{headers:['SKU'],rows:[]}}),/QTY AVAILABLE/);assert.equal(x.state.toolboxUsedPowerBI,old);
 const minimal={headers:['SKU','QTY AVAILABLE'],rows:[{values:['DSK50','1']}],complete:true};await x.c.readUsedPowerBI('usedCatalogueImport',{mode:'quantities',data:minimal});assert.equal(x.state.toolboxUsedPowerBI.rows.length,12851);assert.equal(x.state.toolboxUsedPowerBI.rows[0].values[x.qty],'1');assert.equal(x.state.toolboxUsedPowerBI.rows[0].values[x.nbv],'0');
 x=setup({toolboxUsedPowerBI:{headers:seed.headers,rows:[{values:[...seed.rows[0].values.slice(0,8),'2',...seed.rows[0].values.slice(9)]}],at:Date.parse('2026-10-14T12:00:00Z')},toolboxUsedPowerBIStatus:{state:'loading'}});await x.c.readUsedPowerBI('usedPowerBIInit');assert.equal(x.state.toolboxUsedPowerBI.rows.length,12851);assert.equal(x.state.toolboxUsedPowerBI.rows[0].values[x.qty],'2');assert.equal(x.state.toolboxUsedPowerBIStatus.state,'error');assert.equal(x.stats().tabs,0);
 console.log('PASS packaged catalogue initialization, concurrent reuse, daily cache without opening Power BI, forced quantity-only refresh, failed import rollback, quantity import, legacy migration and interrupted-read recovery');
})().catch(e=>{console.error(e);process.exit(1)});
