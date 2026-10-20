const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir='project/inside-sales-toolbox-team/',readerSource=fs.readFileSync(dir+'used-powerbi-reader.js','utf8');
const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
const names=['CANADA','UK','USA'],url='https://app.powerbi.com/groups/demo/reports/458f40a9-2b3f-4518-a3cb-d699fef65baa/ReportSection';
function fixture(){
 let clock=Date.parse('2026-10-17T18:00:00Z'),selected=new Set(names),registered=[],agents=[],generation=1,reloads=0,selectCalls=0,reads=0,failRegister=false,mutateOnRead=false,loseOnRead=false,duplicate=false,mutateOnNext=false,bareFrame=false;
 const listeners=[],local={},session={usedPowerBITab:7},report={id:7,url,status:'complete',windowId:2},specs=[];
 class Clock extends Date{static now(){return clock;}}
 class DOMEvent{constructor(type,options){this.type=type;Object.assign(this,options);}}
 const timeout=(fn,ms)=>{clock+=ms;fn();},visible=()=>[{}],style=()=>({visibility:'visible',display:'block'});
 const quantity=()=>[...selected].reduce((sum,name)=>sum+({CANADA:3,UK:7,USA:20}[name]),0);
 const headerNames=['SKU','D365 Item ID','Description','QTY OWNED','MAX QTY TO SELL','QTY AVAILABLE','NBV','Sell Price'];
 const cell=value=>({get innerText(){return typeof value==='function'?value():value;},getClientRects:visible,getAttribute:()=>null,contains:()=>false});
 const headers=headerNames.map(cell),values=[cell('A'),cell('01'),cell('Used item'),cell(()=>String(quantity())),cell(()=>String(quantity())),cell(()=>String(quantity())),cell('5'),cell('250')];
 const row={querySelectorAll:selector=>selector==='a[href]'?[]:values,querySelector:()=>null,getClientRects:visible};
 const table={getClientRects:visible,contains:()=>false,getAttribute:key=>key==='aria-rowcount'?'1':null,clientHeight:100,scrollHeight:100,scrollTop:0,scrollLeft:0,dispatchEvent(){},querySelectorAll:selector=>selector.includes('columnheader')?headers:selector.includes('[role="row"]')?[row]:[]};
 const emptyRoot={innerText:'Other visual',getClientRects:visible,getAttribute:()=>null,contains:()=>false,querySelectorAll:()=>[]};
 const frames=Array.from({length:4},()=>({getClientRects:visible,getAttribute:()=>null,get contentDocument(){throw Error('Opaque sandbox origin');}}));
 const mainDoc={body:{innerText:'Display Currency CAD'},querySelector:()=>null,querySelectorAll:selector=>selector==='iframe'?frames:selector.startsWith('.visualContainer')?Array(40).fill(emptyRoot):selector.includes('[role="grid"]')?[table]:[]};
 const dispatch=(message,sender)=>new Promise(resolve=>{let answered=false;const reply=value=>{if(!answered){answered=true;resolve(clone(value));}};for(const listener of listeners)listener(clone(message),sender,reply);if(!answered)resolve(undefined);});
 function makeAgent(index){
  const childListeners=[],documentId='child-'+index+'-'+generation;
  const controls=names.map(name=>({tagName:'BUTTON',innerText:name,getClientRects:visible,getAttribute:key=>key==='aria-pressed'?String(selected.has(name)):null,querySelector:()=>null,contains:()=>false,dispatchEvent:event=>{selectCalls++;if(!event.ctrlKey)selected.clear();if(selected.has(name))selected.delete(name);else selected.add(name);}}));
  const box={innerText:'SUBREGION',getClientRects:visible,getAttribute:()=>null,contains:node=>controls.includes(node),querySelectorAll:selector=>selector.includes('[aria-label]')?[]:controls};
  const childDoc={body:bareFrame&&index===1?box:{innerText:index===1?'SUBREGION CANADA UK USA':'Currency CAD EUR GBP USD'},querySelector:()=>null,querySelectorAll:selector=>selector.startsWith('.visualContainer')&&(index===1&&!bareFrame||duplicate&&index===2)?[box]:[]};
  const childChrome={runtime:{id:'self',onMessage:{addListener:fn=>childListeners.push(fn)},sendMessage:message=>dispatch(message,{id:'self',tab:report,frameId:index,documentId,origin:'null'})}};
  const context=vm.createContext({document:childDoc,location:{origin:'null',href:'about:srcdoc'},chrome:childChrome,getComputedStyle:style,Date:Clock,setTimeout:timeout,URL,Event:DOMEvent,MouseEvent:DOMEvent});
  vm.runInContext('window=globalThis;top={};',context);vm.runInContext(readerSource,context);vm.runInContext(readerSource,context);assert.equal(childListeners.length,1,'reinjection must keep one message listener');
  return {frameId:index,documentId,context,listeners:childListeners};
 }
 const main=vm.createContext({document:mainDoc,location:{origin:'https://app.powerbi.com',href:url},getComputedStyle:style,Date:Clock,setTimeout:timeout,URL,Event:DOMEvent,MouseEvent:DOMEvent});
 function injectAgents(){agents=[1,2,3,4].map(makeAgent);}
 const chrome={runtime:{id:'self',getURL:p=>p,onMessage:{addListener:fn=>listeners.push(fn)}},permissions:{contains:async()=>true},storage:{local:{get:async keys=>Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(k=>[k,local[k]])),set:async values=>Object.assign(local,clone(values))},session:{get:async()=>clone(session),set:async values=>Object.assign(session,clone(values))}},tabs:{get:async()=>({...report}),reload:async id=>{assert.equal(id,7);reloads++;generation++;selected=new Set(names);injectAgents();},sendMessage:async(id,message,target)=>{
  assert.equal(id,7);const targets=target?agents.filter(agent=>target.documentId?agent.documentId===target.documentId:agent.frameId===target.frameId):agents;
  if(!targets.length)throw Error('Could not establish connection');
  const responses=await Promise.all(targets.map(agent=>new Promise(resolve=>{let answered=false,pending=false;const reply=value=>{answered=true;resolve(clone(value));};for(const listener of agent.listeners)pending=listener(clone(message),{id:'self'},reply)===true||pending;if(!pending&&!answered)resolve(undefined);})));return responses.find(Boolean);
 }},scripting:{getRegisteredContentScripts:async()=>clone(registered),registerContentScripts:async scripts=>{if(failRegister)throw Error('Registration denied');specs.push(clone(scripts[0]));registered=clone(scripts);},updateContentScripts:async scripts=>{registered=clone(scripts);},executeScript:async options=>{
  if(options.files){vm.runInContext(readerSource,main);return [{frameId:0,documentId:'main-'+generation}];}
  main.__args=clone(options.args||[]);const result=await vm.runInContext('('+options.func.toString()+')(...__args)',main);
  if(Array.isArray(options.args?.[0])){reads++;if(mutateOnRead)selected=new Set(['UK']);if(loseOnRead)agents=[];}
  if(mutateOnNext&&options.func.toString().includes('.next()'))selected=new Set(['UK']);
  return [{frameId:0,documentId:'main-'+generation,result:clone(result)}];
 }}};
 const worker=vm.createContext({chrome,URL,Date:Clock,Intl,setTimeout:timeout,ToolboxTabGroup:{add:async()=>{}},console});
 for(const file of ['used-catalogue.js','used-regions.js','used-powerbi-worker.js'])vm.runInContext(fs.readFileSync(dir+file,'utf8'),worker);
 local.toolboxUsedPowerBI=clone(worker.ToolboxUsedCatalogue.create({headers:headerNames,currency:'CAD',rows:[{values:['A','01','Used item','14','14','14','40','100']}],filters:'SUBREGION est CANADA UK USA'},{at:0}));
 return {worker,main,local,specs,listeners,table,injectAgents,get reloads(){return reloads;},get selectCalls(){return selectCalls;},get reads(){return reads;},set failRegister(v){failRegister=v;},set mutateOnRead(v){mutateOnRead=v;},set loseOnRead(v){loseOnRead=v;},set duplicate(v){duplicate=v;},set mutateOnNext(v){mutateOnNext=v;},set bareFrame(v){bareFrame=v;},get selected(){return [...selected];}};
}
(async()=>{
 const f=fixture();await f.worker.ensureUsedRegionFrames();assert.equal(f.specs.length,1);const spec=f.specs[0];assert.deepEqual(spec.matches,['https://app.powerbi.com/*']);assert.deepEqual(spec.js,['used-powerbi-reader.js']);assert.equal(spec.allFrames,true);assert.equal(spec.matchOriginAsFallback,true);assert.equal(spec.world,'ISOLATED');
 const initial=JSON.stringify(f.local),diagnostic=await f.worker.readUsedPowerBI('usedPowerBIDiagnostic');assert.equal(diagnostic.diagnostics[0].subregionSelectors.rootCount,40);assert.equal(diagnostic.diagnostics[0].subregion.verified,false);assert.equal(diagnostic.diagnostics[0].embeddedFrames.length,4);assert.equal(diagnostic.diagnostics[0].embeddedFrames[0].documentAccessible,false);assert.equal(diagnostic.frameBridge.frames.length,0);assert.equal(f.reloads,0);assert.equal(JSON.stringify(f.local),initial);
 // Match the user's report: opaque slicer frame and readable main-frame table.
 const before=JSON.stringify(f.local.toolboxUsedPowerBI);await f.worker.readUsedPowerBI('usedPowerBIReadForce',{region:'CANADA+USA'});assert.equal(f.reloads,1);assert.deepEqual(f.selected,['CANADA','USA']);assert.equal(f.local.toolboxUsedRegionQuantities['CANADA+USA'].records[0][3],'23');assert.equal(JSON.stringify(f.local.toolboxUsedPowerBI),before);assert(f.selectCalls>0);
 await f.worker.readUsedPowerBI('usedPowerBIReadForce',{region:'UK+USA'});assert.equal(f.reloads,1);assert.equal(f.local.toolboxUsedRegionQuantities['UK+USA'].records[0][3],'27');assert.equal(f.local.toolboxUsedRegionQuantities['CANADA+USA'].records[0][3],'23');
 f.bareFrame=true;f.injectAgents();await f.worker.readUsedPowerBI('usedPowerBIReadForce',{region:'CANADA+UK'});assert.equal(f.local.toolboxUsedRegionQuantities['CANADA+UK'].records[0][3],'10');f.bareFrame=false;f.injectAgents();
 const d=await f.worker.readUsedPowerBI('usedPowerBIDiagnostic');assert.equal(d.frameBridge.frames.length,4);assert.equal(d.frameBridge.frames.filter(frame=>frame.probe.subregionSelectors.candidateGroups===1).length,1);assert.equal(f.reloads,1);
 // Financial updates use the same proven global selector and preserve every quantity cache.
 const quantities=JSON.stringify(f.local.toolboxUsedRegionQuantities);await f.worker.readUsedPowerBI('usedPowerBIReadPrices',{region:'CANADA'});assert.deepEqual(f.selected.sort(),[...names].sort());assert.equal(f.local.toolboxUsedPowerBI.rows[0].values[5],'14');assert.equal(f.local.toolboxUsedPowerBI.rows[0].values[6],'5');assert.equal(f.local.toolboxUsedPowerBI.rows[0].values[7],'250');assert.equal(JSON.stringify(f.local.toolboxUsedRegionQuantities),quantities);
 const saved=JSON.stringify({base:f.local.toolboxUsedPowerBI,regions:f.local.toolboxUsedRegionQuantities});f.mutateOnRead=true;await assert.rejects(f.worker.readUsedPowerBI('usedPowerBIReadForce',{region:'CANADA'}),/SUBREGION/);assert.equal(JSON.stringify({base:f.local.toolboxUsedPowerBI,regions:f.local.toolboxUsedRegionQuantities}),saved);assert.equal(f.local.toolboxUsedPowerBIStatus.state,'error');f.mutateOnRead=false;
 f.loseOnRead=true;await assert.rejects(f.worker.readUsedPowerBI('usedPowerBIReadForce',{region:'CANADA'}),/fermé ou rechargé/);assert.equal(JSON.stringify({base:f.local.toolboxUsedPowerBI,regions:f.local.toolboxUsedRegionQuantities}),saved);f.loseOnRead=false;f.injectAgents();
 f.duplicate=true;f.injectAgents();const clicked=f.selectCalls;await assert.rejects(f.worker.readUsedPowerBI('usedPowerBIReadForce',{region:'CANADA'}),/Plusieurs sélecteurs/);assert.equal(f.selectCalls,clicked);assert.equal(f.local.toolboxUsedPowerBIDiagnostic.diagnostics[0].subregionSelectors.rootCount,40);assert.equal(f.local.toolboxUsedPowerBIDiagnostic.frameBridge.frames.length,4);f.duplicate=false;f.injectAgents();
 // A country change between scroll chunks must discard the entire incoming read.
 f.table.scrollHeight=3000;f.mutateOnNext=true;await assert.rejects(f.worker.readUsedPowerBI('usedPowerBIReadForce',{region:'CANADA'}),/SUBREGION/);assert.equal(JSON.stringify({base:f.local.toolboxUsedPowerBI,regions:f.local.toolboxUsedRegionQuantities}),saved);
 const denied=fixture();denied.failRegister=true;await denied.worker.ensureUsedRegionFrames();const protectedBase=JSON.stringify(denied.local.toolboxUsedPowerBI);await assert.rejects(denied.worker.readUsedPowerBI('usedPowerBIReadForce',{region:'UK'}),/Accès direct|Registration denied/);assert.equal(denied.reloads,0);assert.equal(JSON.stringify(denied.local.toolboxUsedPowerBI),protectedBase);
 console.log('PASS native related-frame registration, opaque-frame messaging with actual production readers, one-report reload, main-table regional extraction, financial/cache preservation, diagnostic probes and ambiguity/selection/disappearance/chunk rollback guards');
})().catch(error=>{console.error(error);process.exitCode=1;});
