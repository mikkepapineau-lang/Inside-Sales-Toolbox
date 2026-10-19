const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const dir='project/inside-sales-toolbox-team/';const at=Date.parse('2026-10-16T14:00:00Z');
const headers=['SKU','D365 Item ID','QTY AVAILABLE','Sell Price','NBV'];
let source={headers,currency:'CAD',regions:['CANADA','UK','USA'],loadedToEnd:true,rows:[{values:['A','1','999','250','0']}]},calls=0,selected=[];
const local={toolboxUsedRegionQuantities:{CANADA:{sentinel:'unchanged'}}};
const chrome={storage:{local:{get:async keys=>Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(k=>[k,local[k]])),set:async values=>Object.assign(local,values)},session:{get:async()=>({usedPowerBITab:2}),set:async()=>{}}},permissions:{contains:async()=>true},tabs:{get:async()=>({id:2,status:'complete',url:'https://app.powerbi.com/groups/a/reports/458f40a9-2b3f-4518-a3cb-d699fef65baa/ReportSection'})},runtime:{id:'self',onMessage:{addListener(){}}},scripting:{executeScript:async args=>{if(args.files)return [];if(args.args?.[0]==='ALL'){selected.push('ALL');return [{frameId:0,result:{regionReady:true,regions:['CANADA','UK','USA']}}];}calls++;return [{frameId:0,result:source}];}}};
class Clock extends Date{static now(){return at;}}
const c=vm.createContext({chrome,URL,Intl,Date:Clock,setTimeout:f=>f(),ToolboxTabGroup:{add:async()=>{}}});for(const name of ['used-catalogue.js','used-regions.js','used-powerbi-worker.js'])vm.runInContext(fs.readFileSync(dir+name,'utf8'),c);
const C=c.ToolboxUsedCatalogue;local.toolboxUsedPowerBI={...C.create({headers,currency:'CAD',complete:true,rows:[{values:['A','1','3','100','45']},{values:['B','2','4','200','90']}]},{at:at-86400000}),regionScope:'ALL',regionVerified:true};
(async()=>{
 const before=structuredClone(local.toolboxUsedPowerBI),regions=JSON.stringify(local.toolboxUsedRegionQuantities);
 await c.readUsedPowerBI('usedPowerBIReadPrices',{region:'CANADA+USA'});assert.equal(calls,1);assert.equal(selected[0],'ALL');assert.equal(local.toolboxUsedPowerBI.rows[0].values[2],'3');assert.equal(local.toolboxUsedPowerBI.rows[0].values[3],'250');assert.equal(local.toolboxUsedPowerBI.rows[0].values[4],'0');assert.equal(local.toolboxUsedPowerBI.rows.length,2);assert.equal(local.toolboxUsedPowerBI.lastQuantityAt,before.lastQuantityAt);assert.equal(local.toolboxUsedPowerBI.dailyDate,before.dailyDate);assert.equal(JSON.stringify(local.toolboxUsedRegionQuantities),regions);assert.equal(local.toolboxUsedPowerBIStatus.operation,'prices');
 await c.readUsedPowerBI('usedPowerBIReadPrices');assert.equal(calls,2); // No quantity-cache shortcut.
 const saved=JSON.stringify(local.toolboxUsedPowerBI);source={...source,currency:'USD'};await assert.rejects(c.readUsedPowerBI('usedPowerBIReadPrices'),/devise/);assert.equal(JSON.stringify(local.toolboxUsedPowerBI),saved);assert.equal(local.toolboxUsedPowerBIStatus.state,'error');assert.equal(local.toolboxUsedPowerBIStatus.operation,'prices');
 source={...source,currency:'CAD'};await c.readUsedPowerBI('usedCatalogueImport',{mode:'prices',region:'CANADA',data:source});assert.equal(local.toolboxUsedPowerBI.lastQuantityAt,before.lastQuantityAt);
 source={...source,filters:'SUBREGION est CANADA'};await assert.rejects(c.readUsedPowerBI('usedCatalogueImport',{mode:'prices',data:source}),/exporte CANADA/);
 console.log('PASS Power BI prices action always rereads verified global scope, preserves all quantities and regional caches, keeps previous data on errors and supports financial-only Excel imports');
})().catch(e=>{console.error(e);process.exitCode=1;});
