const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const dir='project/inside-sales-toolbox-team/';const at=Date.parse('2026-10-16T14:00:00Z');
const headers=['SKU','D365 Item ID','QTY AVAILABLE','Sell Price','NBV'];
let source={headers,currency:'CAD',regions:['CANADA','UK','USA'],loadedToEnd:true,rows:[{values:['A','1','999','250','0']}]},calls=0,selected=[];
const local={toolboxUsedRegionQuantities:{CANADA:{sentinel:'unchanged'}}};
const chrome={storage:{local:{get:async keys=>Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(k=>[k,local[k]])),set:async values=>Object.assign(local,values)},session:{get:async()=>({usedPowerBITab:2}),set:async()=>{}}},permissions:{contains:async()=>true},tabs:{get:async()=>({id:2,status:'complete',url:'https://app.powerbi.com/groups/a/reports/458f40a9-2b3f-4518-a3cb-d699fef65baa/ReportSection'})},runtime:{id:'self',onMessage:{addListener(){}}},scripting:{executeScript:async args=>{if(args.files){assert.deepEqual([...args.files],['powerbi-reader.js','used-powerbi-reader.js']);return [];}if(typeof args.args?.[0]==='string'){const region=args.args[0];selected.push(region);return [{frameId:0,result:{regionReady:true,regions:region==='ALL'?['CANADA','UK','USA']:region.split('+')}}];}assert.equal(args.args?.[0],true,'financial mode must reach the production reader');calls++;return [{frameId:0,result:source}];}}};
class Clock extends Date{static now(){return at;}}
const c=vm.createContext({chrome,URL,Intl,Date:Clock,setTimeout:f=>f(),ToolboxTabGroup:{add:async()=>{}}});for(const name of ['used-catalogue.js','used-regions.js','used-powerbi-worker.js'])vm.runInContext(fs.readFileSync(dir+name,'utf8'),c);
const C=c.ToolboxUsedCatalogue;local.toolboxUsedPowerBI={...C.create({headers,currency:'CAD',complete:true,rows:[{values:['A','1','3','100','45']},{values:['B','2','4','200','90']}]},{at:at-86400000}),regionScope:'ALL',regionVerified:true};
(async()=>{
 const before=structuredClone(local.toolboxUsedPowerBI),regions=JSON.stringify(local.toolboxUsedRegionQuantities);
 await c.readUsedPowerBI('usedPowerBIReadPrices',{region:'ALL'});assert.equal(calls,1);assert.equal(selected[0],'ALL');assert.equal(local.toolboxUsedPowerBI.rows[0].values[2],'3');assert.equal(local.toolboxUsedPowerBI.rows[0].values[3],'250');assert.equal(local.toolboxUsedPowerBI.rows[0].values[4],'0');assert.equal(local.toolboxUsedPowerBI.rows.length,2);assert.equal(local.toolboxUsedPowerBI.lastQuantityAt,before.lastQuantityAt);assert.equal(local.toolboxUsedPowerBI.dailyDate,before.dailyDate);assert.equal(JSON.stringify(local.toolboxUsedRegionQuantities),regions);assert.equal(local.toolboxUsedPowerBIStatus.operation,'prices');
 await c.readUsedPowerBI('usedPowerBIReadPrices');assert.equal(calls,2); // No quantity-cache shortcut.
 const saved=JSON.stringify(local.toolboxUsedPowerBI);source={...source,currency:'USD'};await assert.rejects(c.readUsedPowerBI('usedPowerBIReadPrices'),/devise/);assert.equal(JSON.stringify(local.toolboxUsedPowerBI),saved);assert.equal(local.toolboxUsedPowerBIStatus.state,'error');assert.equal(local.toolboxUsedPowerBIStatus.operation,'prices');
 source={...source,currency:'CAD'};await c.readUsedPowerBI('usedCatalogueImport',{mode:'prices',region:'ALL',data:source});assert.equal(local.toolboxUsedPowerBI.lastQuantityAt,before.lastQuantityAt);
 source={...source,filters:'SUBREGION est CANADA'};await assert.rejects(c.readUsedPowerBI('usedCatalogueImport',{mode:'prices',data:source}),/exporte CANADA/);
 const globalBefore=JSON.stringify(local.toolboxUsedPowerBI);const scopePrices={};
 for(const [i,region] of ['CANADA','UK','USA','CANADA+UK','CANADA+USA','UK+USA'].entries()){
  source={...source,filters:'SUBREGION est '+region.split('+').join(' '),regions:region.split('+'),rows:[{values:['A','1','999',String(300+i),String(i)]}]};
  await c.readUsedPowerBI('usedPowerBIReadPrices',{region});assert.equal(selected.at(-1),region);
  assert.equal(local.toolboxUsedPowerBIStatus.region,region);assert.equal(JSON.stringify(local.toolboxUsedPowerBI),globalBefore);assert.equal(JSON.stringify(local.toolboxUsedRegionQuantities),regions);
  const snapshot=local.toolboxUsedRegionPrices[region];assert.equal(snapshot.records[0][1],String(300+i));assert.equal(snapshot.records[0][2],String(i));scopePrices[region]=JSON.stringify(snapshot);
  const view=c.ToolboxUsedRegions.financialView(local.toolboxUsedPowerBI,null,snapshot,region);assert.equal(view.rows[0].values[2],'');assert.equal(view.rows[0].values[3],String(300+i));assert.equal(view.quantitiesPending,true);
  for(const [scope,value]of Object.entries(scopePrices))assert.equal(JSON.stringify(local.toolboxUsedRegionPrices[scope]),value);
 }
 const pricesBefore=JSON.stringify(local.toolboxUsedRegionPrices);source={...source,regions:['CANADA']};
 await assert.rejects(c.readUsedPowerBI('usedPowerBIReadPrices',{region:'UK'}),/sous-région/);assert.equal(JSON.stringify(local.toolboxUsedRegionPrices),pricesBefore);
 await assert.rejects(c.readUsedPowerBI('usedCatalogueImport',{mode:'prices',region:'UK',data:source}),/ne confirme pas/);assert.equal(JSON.stringify(local.toolboxUsedRegionPrices),pricesBefore);
 source={...source,regions:['UK'],filters:'SUBREGION est UK',currency:'USD'};await assert.rejects(c.readUsedPowerBI('usedPowerBIReadPrices',{region:'UK'}),/devise/);assert.equal(JSON.stringify(local.toolboxUsedRegionPrices),pricesBefore);
 source={...source,currency:'CAD'};await c.readUsedPowerBI('usedCatalogueImport',{mode:'prices',region:'UK',data:source});assert.equal(JSON.stringify(local.toolboxUsedPowerBI),globalBefore);assert.equal(local.toolboxUsedRegionPrices.UK.source,'Excel');
 let focused=0,activated=0;chrome.tabs.update=async(id,options)=>{assert.equal(id,2);assert.equal(options.active,true);activated++;return {id,windowId:4};};chrome.windows={update:async(id,options)=>{assert.equal(id,4);assert.equal(options.focused,true);focused++;}};
 source={...source,regions:['UK'],filters:'SUBREGION est UK'};await c.readUsedPowerBI('usedPowerBIReadPrices',{region:'UK',foreground:true});assert.equal(focused,1);assert.equal(activated,1);
 await c.readUsedPowerBI('usedPowerBIReadPrices',{region:'UK',foreground:false});assert.equal(focused,1);assert.equal(activated,1);
 chrome.windows.get=async()=>({state:'minimized'});chrome.windows.update=async(id,options)=>{assert.equal(id,4);assert.equal(options.state,'normal');assert.equal(options.focused,true);focused++;};await c.readUsedPowerBI('usedPowerBIReadPrices',{region:'UK',foreground:true});assert.equal(focused,2);assert.equal(activated,2);
 console.log('PASS prices follow all seven region scopes, global and quantity isolation, zero NBV, price-first view, matching Excel imports and rollback on wrong scope/currency');
})().catch(e=>{console.error(e);process.exitCode=1;});
