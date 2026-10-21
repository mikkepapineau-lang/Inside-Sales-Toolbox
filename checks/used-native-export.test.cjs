const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const app='project/inside-sales-toolbox-team/',local={},session={};
const storage=store=>({get:async keys=>Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(k=>[k,store[k]])),set:async data=>Object.assign(store,data),remove:async key=>{delete store[key];}});
const chrome={scripting:{},storage:{local:storage(local),session:storage(session)},permissions:{onAdded:{addListener(){}}},runtime:{id:'test',onMessage:{addListener(){}}}};
const c=vm.createContext({chrome,URL,Intl,Date,crypto:webcrypto,atob,setTimeout,ToolboxTabGroup:{add:async()=>{}}});for(const name of ['used-catalogue','used-regions','used-powerbi-worker'])vm.runInContext(fs.readFileSync(app+name+'.js','utf8'),c);
const headers=['SKU','D365 Item ID','QTY AVAILABLE','Sell Price','NBV'],source={headers,currency:'CAD',filters:'SUBREGION est CANADA',rows:[{values:['A','1','7','250','0']}]};
local.toolboxUsedPowerBI={...c.ToolboxUsedCatalogue.create({...source,rows:[{values:['A','1','3','100','45']}]}),regionScope:'ALL',regionVerified:true};
function receipt(region='CANADA',extra={}){session['usedExportReceipt:export-test']={id:'export-test',at:Date.now(),region,regions:region==='ALL'?['CANADA','UK','USA']:region.split('+'),sha256:'testhash',currency:'CAD',...extra};return {region,exportId:'export-test',sha256:'testhash',data:source};}
(async()=>{
 const before=JSON.stringify(local.toolboxUsedPowerBI);await c.readUsedPowerBI('usedPowerBIImportExport',receipt());
 assert.equal(JSON.stringify(local.toolboxUsedPowerBI),before);assert.equal(local.toolboxUsedRegionQuantities.CANADA.sourceCount,1);assert.equal(local.toolboxUsedRegionPrices.CANADA.records[0][1],'250');assert.equal(local.toolboxUsedRegionPrices.CANADA.records[0][2],'0');assert.equal(local.toolboxUsedPowerBIStatus.operation,'export');
 await assert.rejects(c.readUsedPowerBI('usedPowerBIImportExport',{region:'CANADA',exportId:'export-test',sha256:'testhash',data:source}),/plus confirmé/);
 for(const change of [{sha256:'wrong'},{region:'UK'},{data:{...source,currency:'USD'}},{data:{...source,filters:'SUBREGION est UK'}}]){
  const payload={...receipt(),...change},saved=JSON.stringify([local.toolboxUsedPowerBI,local.toolboxUsedRegionQuantities,local.toolboxUsedRegionPrices]);await assert.rejects(c.readUsedPowerBI('usedPowerBIImportExport',payload));assert.equal(JSON.stringify([local.toolboxUsedPowerBI,local.toolboxUsedRegionQuantities,local.toolboxUsedRegionPrices]),saved);
 }
 await assert.rejects(c.readUsedPowerBI('usedPowerBIImportExport',receipt('CANADA',{at:Date.now()-121000})),/plus confirmé/);
 const bad=receipt();bad.data={...source,headers:['SKU','QTY AVAILABLE'],rows:[{values:['A','8']}]};const saved=JSON.stringify(local.toolboxUsedRegionQuantities);await assert.rejects(c.readUsedPowerBI('usedPowerBIImportExport',bad));assert.equal(JSON.stringify(local.toolboxUsedRegionQuantities),saved,'quantities not partially committed when financial validation fails');
 const all=receipt('ALL');all.data={...source,filters:'SUBREGION est CANADA UK USA'};await c.readUsedPowerBI('usedPowerBIImportExport',all);assert.equal(local.toolboxUsedPowerBI.rows[0].values[2],'7');assert.equal(local.toolboxUsedPowerBI.rows[0].values[3],'250');assert.equal(local.toolboxUsedPowerBI.rows[0].values[4],'0');
 // Exercise the real export worker handshake; no row-by-row reader is invoked.
 const bytes=Uint8Array.from([80,75,3,4,1,2]),base64=Buffer.from(bytes).toString('base64'),context={filters:['Tout'],currency:'CAD'},target={tabId:2,frameIds:[0]},tab={id:2,url:'https://app.powerbi.com/groups/a/reports/458f40a9-2b3f-4518-a3cb-d699fef65baa/ReportSection'};chrome.tabs={get:async()=>tab};let changed=false;
 chrome.scripting={executeScript:async args=>{if(args.files){assert.equal(args.world,'MAIN');return [];}const code=String(args.func);if(code.includes('ToolboxUsedExportUI.run'))return [{result:{base64,size:bytes.length}}];if(code.includes('state:'))return [{result:{context:changed?{...context,currency:'USD'}:context,state:{verified:true,selected:['CANADA']}}}];return [{result:context}];}};
 const file=await c.exportUsedFile(tab,target,'CANADA',null);assert.equal(file.base64,base64);assert.equal(session['usedExportReceipt:'+file.exportId].sha256,file.sha256);changed=true;await assert.rejects(c.exportUsedFile(tab,target,'CANADA',null),/filtres ou la devise/);
 const nativeDetail={version:'native-export-4',menu:{candidates:0},tableAncestors:[{tag:'DIV',classes:'visualContainerHost'}]};
 session.usedPowerBITab=2;chrome.permissions.contains=async()=>true;chrome.tabs.get=async()=>({...tab,status:'complete'});
 chrome.scripting.executeScript=async args=>{
  if(args.files)return [];
  const code=String(args.func);
  if(code.includes('ToolboxUsedExportUI.run'))return [{frameId:0,result:{error:'EXPORT_MENU: no control',diagnostic:nativeDetail}}];
  if(code.includes('exportReady'))return [{frameId:0,result:{exportReady:true,regions:['CANADA'],diagnostic:{tables:[{}]}}}];
  if(typeof args.args?.[0]==='string')return [{frameId:0,result:{regionReady:true,regions:['CANADA']}}];
  return [{frameId:0,result:context}];
 };
 await assert.rejects(c.readUsedPowerBI('usedPowerBIExportFile',{region:'CANADA'}),/EXPORT_MENU/);
 assert.deepEqual(local.toolboxUsedPowerBIDiagnostic.nativeExport,nativeDetail,'outer failure handler must retain actual native control diagnostic');
 console.log('PASS native Excel receipt, hash/scope/currency/expiry and replay guards, atomic regional quantities + finances, global import, rollback and export context handshake');
})().catch(e=>{console.error(e);process.exitCode=1;});
