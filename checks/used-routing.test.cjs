const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const reportId='458f40a9-2b3f-4518-a3cb-d699fef65baa';
const reportURL='https://app.powerbi.com/groups/ff3be965-02e9-4c0f-b9eb-b73e3bb4e51f/reports/'+reportId+'/ReportSection7cb28c98171347d49c0a';
const embedURL='https://app.powerbi.com/reportEmbed?reportId='+reportId+'&autoAuth=true&ctid=c2f120b6-e8fc-402c-9972-fa891cb53927&actionBarEnabled=true';
let saved={},created=[],scripted=[],current={id:1,windowId:7,status:'complete',url:'https://app.powerbi.com/groups/a/reports/other/ReportSection'},used={id:2,windowId:7,status:'complete',url:reportURL};
let tabs=new Map([[1,current],[2,used]]),local={toolboxUsedPowerBI:{schemaVersion:1,headers:['SKU','Description','QTY AVAILABLE'],rows:[{values:['SKU','Description','2']}],currency:'CAD'}};
const chrome={permissions:{contains:async()=>true},storage:{session:{get:async()=>saved,set:async v=>Object.assign(saved,v)},local:{get:async()=>({toolboxUsedPowerBI:local.toolboxUsedPowerBI}),set:async v=>Object.assign(local,v)}},tabs:{
 query:async q=>q.active?[current]:[...tabs.values()].filter(t=>new URL(t.url).origin==='https://app.powerbi.com'),
 get:async id=>{if(!tabs.has(id))throw Error('Missing tab');return tabs.get(id);},
 create:async props=>{const tab={id:10+created.length,windowId:7,status:'complete',...props};created.push(tab);tabs.set(tab.id,tab);return tab;}
},scripting:{executeScript:async args=>{scripted.push(args.target.tabId);return args.files?[]:[{frameId:0,result:typeof args.args?.[0]==='string'?{regionReady:true,regions:['CANADA','UK','USA']}:{rows:[{values:['SKU','Description','3']}],headers:['SKU','Description','QTY AVAILABLE'],currency:'CAD',regions:['CANADA','UK','USA']}}];}},runtime:{id:'self',onMessage:{addListener:()=>{}}}};
const c=vm.createContext({chrome,URL,setTimeout:f=>f(),ToolboxTabGroup:{add:async t=>t}});for(const f of ['used-catalogue.js','used-regions.js','used-powerbi-worker.js'])vm.runInContext(fs.readFileSync('project/inside-sales-toolbox-team/'+f,'utf8'),c);
const matches=tab=>{c.testTab=tab;return vm.runInContext('isUsedPowerBI(testTab)',c);};
const read=async expected=>{scripted=[];await c.readUsedPowerBI('usedPowerBIReadForce');assert.equal(saved.usedPowerBITab,expected);assert(scripted.length>0);assert(scripted.every(id=>id===expected));};
(async()=>{
 await assert.rejects(c.readUsedPowerBI('usedPowerBIBind'),/Used Gear/);
 saved={usedPowerBITab:1};await read(2);assert.equal(created.length,0);assert.equal(local.toolboxUsedPowerBI.currency,'CAD');assert.equal(local.toolboxPowerBI,undefined);
 for(const url of [reportURL,reportURL.split('/ReportSection')[0],embedURL,embedURL.replace(reportId,reportId.toUpperCase())])assert.equal(matches({url}),true,url);
 for(const url of [undefined,'https://example.test/?reportId='+reportId,embedURL.replace('app.powerbi.com','app.powerbi.com.example.test'),embedURL.replace('https:','http:'),embedURL.replace('reportEmbed','other'),embedURL.replace(reportId,'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'),embedURL+'&reportId='+reportId,reportURL.replace(reportId,'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')+'?reportId='+reportId])assert.equal(matches({url}),false,String(url));
 assert.equal(matches(undefined),false);assert.equal(matches({url:reportURL,pendingUrl:current.url}),false);assert.equal(matches({url:current.url,pendingUrl:embedURL}),true);
 // The supplied embed URL is read and associated without opening a second report.
 used.url=embedURL;saved={usedPowerBITab:1};await read(2);assert.equal(saved.usedPowerBIResolvedURL,embedURL);assert.equal(created.length,0);
 current=used;await c.readUsedPowerBI('usedPowerBIBind');assert.equal(saved.usedPowerBITab,2);assert.equal(saved.usedPowerBIResolvedURL,embedURL);
 // Several existing report tabs still reuse one, with the bound tab taking priority.
 const duplicate={id:3,windowId:7,status:'complete',url:reportURL,lastAccessed:20};tabs.set(3,duplicate);
 saved={usedPowerBITab:1,usedPowerBIResolvedURL:reportURL};await read(3);
 saved={usedPowerBITab:2,usedPowerBIResolvedURL:reportURL};await read(2);
 used.active=true;saved={};await read(2);
 used.active=false;used.lastAccessed=10;saved={};await read(3);
 assert.equal(created.length,0);
 // A stale saved URL pointing at another report must never be used for extraction.
 tabs=new Map([[1,tabs.get(1)]]);current=tabs.get(1);saved={usedPowerBITab:1,usedPowerBIResolvedURL:current.url};await read(10);
 assert.equal(created.length,1);assert(created[0].url.startsWith(reportURL));assert.equal(created[0].active,false);
 console.log('PASS canonical and embed report matching, embed binding/extraction, duplicate reuse, bound-tab priority, wrong-report and ambiguous-URL rejection, independent cached data');
})().catch(e=>{console.error(e);process.exitCode=1;});
