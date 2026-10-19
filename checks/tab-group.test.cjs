const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const tabs=new Map([[1,{id:1,windowId:7,groupId:-1,pinned:false,active:false}],[2,{id:2,windowId:7,groupId:-1,pinned:false,active:false}],[3,{id:3,windowId:8,groupId:-1,pinned:false,active:false}],[4,{id:4,windowId:7,groupId:-1,pinned:true,active:false}],[5,{id:5,windowId:7,groupId:-1,pinned:false,active:true}]]);
const groups=new Map();let next=10,activator,session={};
const chrome={storage:{session:{get:async()=>session,set:async v=>Object.assign(session,v)},local:{set:async()=>{},remove:async()=>{}}},tabs:{onActivated:{addListener:f=>activator=f},get:async id=>tabs.get(id),query:async q=>[...tabs.values()].filter(t=>(q.groupId===undefined||t.groupId===q.groupId)&&(q.active===undefined||t.active===q.active)),group:async args=>{const id=args.groupId??next++;if(!groups.has(id))groups.set(id,{id,windowId:args.createProperties.windowId});for(const tid of args.tabIds)tabs.get(tid).groupId=id;return id;}},tabGroups:{get:async id=>{if(!groups.has(id))throw Error('Missing group');return groups.get(id)},query:async q=>[...groups.values()].filter(g=>g.windowId===q.windowId&&g.title===q.title),update:async(id,v)=>Object.assign(groups.get(id),v)}};
const c=vm.createContext({chrome,Promise});vm.runInContext(fs.readFileSync('project/inside-sales-toolbox-team/tab-group.js','utf8'),c);
(async()=>{
 await Promise.all([c.ToolboxTabGroup.add(tabs.get(1)),c.ToolboxTabGroup.add(tabs.get(2))]);assert.equal(groups.size,1);assert.equal(tabs.get(1).groupId,tabs.get(2).groupId);assert.equal(groups.get(10).collapsed,true);
 await c.ToolboxTabGroup.add(tabs.get(3));assert.equal(groups.size,2);await c.ToolboxTabGroup.add(tabs.get(4));assert.equal(tabs.get(4).groupId,-1);
 session={};await c.ToolboxTabGroup.add(tabs.get(2));assert.equal(groups.size,2);
 tabs.get(1).active=true;tabs.get(5).active=false;activator({tabId:1,windowId:7});await new Promise(r=>setImmediate(r));assert.equal(groups.get(10).collapsed,false);
 tabs.get(1).active=false;tabs.get(5).active=true;activator({tabId:5,windowId:7});await new Promise(r=>setImmediate(r));assert.equal(groups.get(10).collapsed,true);
 chrome.tabs.group=async()=>{throw Error('Grouping unavailable')};await c.ToolboxTabGroup.add(tabs.get(2));
 console.log('PASS concurrent reuse, windows, pinned tabs, restart recovery, collapse on leave and nonblocking failure');
})().catch(e=>{console.error(e);process.exit(1)});
