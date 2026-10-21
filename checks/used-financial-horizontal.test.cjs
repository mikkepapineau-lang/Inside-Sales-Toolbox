const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const dir='project/inside-sales-toolbox-team/',source=['powerbi-reader.js','used-powerbi-reader.js'].map(file=>fs.readFileSync(dir+file,'utf8')).join('\n');
function fixture({ratio=.4,pointerOnly=false,blocked=false,ambiguous=false,onMove,missingFinancial=false,recycled=false,native=false,long=false,responseScale=1,movementOnly=false,documentMovesOnly=false,renderDelay=0}={}){
 let clock=0;class Clock extends Date{static now(){return clock;}}
 let x=ratio,y=120,gesture=null,filter='Tous';const events=[];
 let paintedX=x,paintedY=y,due=Infinity;const repaint=()=>{if(renderDelay)due=clock+renderDelay;else{paintedX=x;paintedY=y;}};
 const headers=['Sélection de ligne','D365 Item ID','Total Not Invoiced','QTY AVAILABLE','Description','Project ID','SKU','ModeOfDelivery','Customer Requisition','Payment','Status','Sales Rep Name','Coordo','ConfirmedShipDate','Sell Price',missingFinancial?'Other Column':'NBV'];
 const data=Array.from({length:long?400:10},(_,i)=>['',String(100001+i),String(100+i),'1','REF-'+i,'','Client '+i,'GROUND','','NET30','Open order','Alex','Alex','2026-10-20',String(100+i),i===1?'0':String(40+i)]);
 const base={tagName:'DIV',getClientRects:()=>[{}],getAttribute:()=>null,contains:()=>false,dispatchEvent(){},querySelectorAll:()=>[]};
 const trackRect={left:20,top:500,width:1260,height:9};
 const track={...base,className:'scroll-bar-div',clientWidth:1260,scrollWidth:1260,clientHeight:9,scrollHeight:9,getBoundingClientRect:()=>trackRect};
 const thumb={...base,className:'scroll-bar-part-bar',clientWidth:798,scrollWidth:798,clientHeight:6,scrollHeight:6,getBoundingClientRect:()=>({left:20+462*x,top:501.5,width:798,height:6}),dispatchEvent(event){if(documentMovesOnly&&!/down$/.test(event.type))return;handleDrag(event);}}
 function handleDrag(event){
  events.push(event.type);const pointer=event.type.startsWith('pointer');if(blocked||pointerOnly&&!pointer)return;
  if(/down$/.test(event.type))gesture={start:event.clientX,x};
  else if(/move$/.test(event.type)&&gesture){
   x=Math.max(0,Math.min(1,movementOnly?x+(event.movementX||0)/462*responseScale:gesture.x+(event.clientX-gesture.start)/462*responseScale));
   repaint();onMove?.({x,setFilter:v=>filter=v});
  }else if(/up$/.test(event.type))gesture=null;
 };track.querySelectorAll=s=>s==='.scroll-bar-part-bar'?[thumb]:[];
 const verticalTrack={...base,className:'scroll-bar-div',clientWidth:9,clientHeight:501,getBoundingClientRect:()=>({left:1280,top:10,width:9,height:501})};
 const verticalThumb={...base,className:'scroll-bar-part-bar',getBoundingClientRect:()=>({left:1281,top:10,width:6,height:329})};verticalTrack.querySelectorAll=()=>[verticalThumb];
 const v={...base,className:'mid-viewport',clientWidth:1261,scrollWidth:1261,clientHeight:441,scrollHeight:long?30000:667,overflowX:'hidden',overflowY:'auto',scrollLeft:0,get scrollTop(){return y;},set scrollTop(value){y=Math.max(0,Math.min(this.scrollHeight-this.clientHeight,value));repaint();}};
 const clips=Array.from({length:12},(_,i)=>({...base,className:'scrollable-cells-viewport ',clientWidth:1260,scrollWidth:1666,clientHeight:i?63:34,scrollHeight:i?63:34,overflowX:'clip',overflowY:'visible',get scrollLeft(){return 0;},set scrollLeft(value){},scrollTop:0}));
 const indices=()=>Array.from({length:12},(_,i)=>i+Math.min(4,Math.round(paintedX*4)));
 const cell=(value,index)=>({...base,innerText:value,textContent:value,getAttribute:name=>name==='aria-colindex'?String(index+1):null});
 // Stable DOM row identities replace unavailable ARIA/data row IDs.
 const rows=Array.from({length:7},(_,slot)=>({...base,querySelectorAll:selector=>selector==='a[href]'?[]:indices().map(col=>cell(data[Math.min(data.length-7,Math.floor(paintedY/75))+((recycled&&x>.8)?(slot+1)%7:slot)][col],col))}));
 const duplicate={...track,getBoundingClientRect:()=>({...trackRect,top:520})};duplicate.querySelectorAll=()=>[{...thumb,getBoundingClientRect:()=>({left:20+462*x,top:521.5,width:798,height:6})}];
 const nativeX={...base,clientWidth:400,scrollWidth:1200,clientHeight:12,scrollHeight:12,overflowX:'auto',get scrollLeft(){return x*800;},set scrollLeft(value){x=Math.max(0,Math.min(1,value/800));repaint();}};
 const root={...base,isConnected:true,clientWidth:1261,scrollWidth:1261,clientHeight:441,scrollHeight:441,closest:()=>null,querySelectorAll:selector=>selector==='*'?[...clips,v,...(native?[nativeX]:[track,thumb]),verticalTrack,verticalThumb,...(ambiguous?[duplicate]:[])]:selector.includes('columnheader')?indices().map(i=>cell(headers[i],i)):selector.includes('[role="row"]')?rows:[]};
 const combo={...base,get innerText(){return filter;}};
 const document={body:{innerText:'Display Currency CAD'},querySelector:()=>null,querySelectorAll:s=>s.includes('[role="grid"]')?[root]:s==='[role="combobox"]'?[combo]:[],dispatchEvent:event=>handleDrag(event)};
 class Mouse{constructor(type,options){this.type=type;Object.assign(this,options);Object.defineProperty(this,'movementX',{configurable:true,get:()=>0});}}
 const c=vm.createContext({document,location:{origin:'https://app.powerbi.com',href:'https://app.powerbi.com/'},getComputedStyle:e=>({visibility:'visible',display:'block',overflowX:e.overflowX||'visible',overflowY:e.overflowY||'visible'}),Date:Clock,setTimeout:(fn,ms)=>{clock+=ms;if(clock>=due){paintedX=x;paintedY=y;due=Infinity;}fn();},URL,Event:class{},MouseEvent:Mouse,PointerEvent:Mouse});
 vm.runInContext(source,c);return {c,events,data,position:()=>({x,y}),clock:()=>clock,read:(adaptive=true)=>c.ToolboxUsedPowerBIReader.read({prices:true,adaptive,externalRegions:['CANADA','UK','USA']}),diagnostic:()=>c.ToolboxPowerBIReader.diagnostic()};
}
(async()=>{
 for(const options of [{renderDelay:140},{pointerOnly:false},{pointerOnly:true},{native:true},{responseScale:.75},{movementOnly:true},{documentMovesOnly:true},{responseScale:.75,movementOnly:true,documentMovesOnly:true,pointerOnly:true}]){
  const f=fixture(options),pointerOnly=options.pointerOnly,before=f.position();let result=await f.read();
  while(result.more)result=await f.c.ToolboxUsedPowerBIReader.next();
  assert.equal(result.rows.length,10);assert.equal(result.headers.at(-1),'NBV');assert.equal(result.loadedToEnd,true);assert.equal(result.currency,'CAD');
  assert(result.horizontalSteps>0);if(!options.native)assert.equal(result.diagnostic.scan.horizontalControl.kind,'powerbi-custom-scrollbar');
  for(const row of result.rows){const i=Number(row.values[1])-100001;assert.equal(row.values[14],String(100+i));assert.equal(row.values[15],i===1?'0':String(40+i));}
  assert(Math.abs(f.position().x-before.x)<.012);assert.equal(f.position().y,before.y);
  if(pointerOnly)assert(f.events.includes('pointerdown'));
  vm.runInContext(fs.readFileSync(dir+'used-catalogue.js','utf8'),f.c);
  const C=f.c.ToolboxUsedCatalogue;
  const base=C.create({headers:['SKU','D365 Item ID','QTY AVAILABLE','Sell Price','NBV'],currency:'CAD',rows:[{values:['Client 1','100002','7','1','5']} ]});
  const updated=C.updatePrices(base,result);assert.equal(updated.rows[0].values[2],'7');assert.equal(updated.rows[0].values[3],'101');assert.equal(updated.rows[0].values[4],'0');
 }
 const large=fixture({long:true}),largeStart=large.position();let batch=await large.read(),chunks=0;
 while(batch.more){chunks++;batch=await large.c.ToolboxUsedPowerBIReader.next();}
 assert(chunks>0);assert.equal(batch.rows.length,400);assert(batch.steps>45);assert.equal(batch.loadedToEnd,true);
 assert(Math.abs(large.position().x-largeStart.x)<.012);assert.equal(large.position().y,largeStart.y);
 const conservative=fixture({long:true});let slow=await conservative.read(false);while(slow.more)slow=await conservative.c.ToolboxUsedPowerBIReader.next();
 assert.deepEqual(JSON.parse(JSON.stringify(batch.rows)),JSON.parse(JSON.stringify(slow.rows)));assert(large.clock()<conservative.clock()*.75,'adaptive settle must measurably reduce fixture waits without losing rows');
 console.log('Simulated 400-row waits: adaptive '+large.clock()+' ms; conservative '+conservative.clock()+' ms (not a connected benchmark)');
 const cancelled=fixture({long:true}),cancelStart=cancelled.position();const pending=await cancelled.read();assert.equal(pending.more,true);await cancelled.c.ToolboxUsedPowerBIReader.cancel();
 assert(Math.abs(cancelled.position().x-cancelStart.x)<.012);assert.equal(cancelled.position().y,cancelStart.y);
 let f=fixture({blocked:true}),before=f.position();await assert.rejects(f.read(),/n’a pas confirmé/);assert.deepEqual(f.position(),before);
 const retained=f.c.ToolboxUsedPowerBIReader.diagnostic().lastFinancialScan;assert(retained.scan.customMoves.length>0);assert.equal(retained.scan.phase,'Lecture interrompue');
 vm.runInContext(source,f.c);assert.equal(f.c.ToolboxUsedPowerBIReader.diagnostic().lastFinancialScan.scan.phase,'Lecture interrompue','failed movement evidence survives diagnostic reinjection');
 f=fixture({ambiguous:true});await assert.rejects(f.read(),/Plusieurs barres horizontales/);assert.equal(f.events.length,0);
 f=fixture({missingFinancial:true});before=f.position();await assert.rejects(f.read(),/NBV reste inaccessible/);assert(Math.abs(f.position().x-before.x)<.012);assert.equal(f.position().y,before.y);
 f=fixture({recycled:true});await assert.rejects(f.read(),/lignes ont changé|valeurs ont changé/);
 f=fixture({onMove:({setFilter})=>setFilter('UK')});await assert.rejects(f.read(),/rapport a changé/);
 console.log('PASS used financial 2D extraction: hidden price/NBV columns, custom mouse/pointer scrollbar, clipped overflow, D365 anchors, reused row windows, zero NBV, quantity preservation, position restoration, missing-column/blocked/ambiguous/filter/recycling guards');
})().catch(e=>{console.error(e);process.exitCode=1;});
