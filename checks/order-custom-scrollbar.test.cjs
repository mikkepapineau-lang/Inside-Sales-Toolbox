const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const dir='project/inside-sales-toolbox-team/',source=fs.readFileSync(dir+'powerbi-reader.js','utf8');
function fixture({ratio=.4,pointerOnly=false,blocked=false,ambiguous=false,onMove}={}){
 let x=ratio,y=120,gesture=null,filter='Tous';const events=[];
 const headers=['Sélection de ligne','Sales Order Number','Total Not Invoiced','Physical Reserve Qty','Customer Reference','Project ID','Customer','ModeOfDelivery','Customer Requisition','Payment','Status','Sales Rep Name','Coordo','ConfirmedShipDate','InternalReference','Internal Notes'];
 const data=Array.from({length:10},(_,i)=>['','SO-CA'+(100001+i),String(100+i),'1','REF-'+i,'','Client '+i,'GROUND','','NET30','Open order','Alex','Alex','2026-10-20','Référence interne '+i,i===1?'':'Contact '+i+'\n514 555-01'+String(i).padStart(2,'0')+'\ncontact'+i+'@example.test']);
 const base={tagName:'DIV',getClientRects:()=>[{}],getAttribute:()=>null,contains:()=>false,dispatchEvent(){},querySelectorAll:()=>[]};
 const trackRect={left:20,top:500,width:1260,height:9};
 const track={...base,className:'scroll-bar-div',clientWidth:1260,scrollWidth:1260,clientHeight:9,scrollHeight:9,getBoundingClientRect:()=>trackRect};
 const thumb={...base,className:'scroll-bar-part-bar',clientWidth:798,scrollWidth:798,clientHeight:6,scrollHeight:6,getBoundingClientRect:()=>({left:20+462*x,top:501.5,width:798,height:6}),dispatchEvent(event){
  events.push(event.type);const pointer=event.type.startsWith('pointer');if(blocked||pointerOnly&&!pointer)return;
  if(/down$/.test(event.type))gesture={start:event.clientX,x};
  else if(/move$/.test(event.type)&&gesture){x=Math.max(0,Math.min(1,gesture.x+(event.clientX-gesture.start)/462));onMove?.({x,setFilter:v=>filter=v});}
  else if(/up$/.test(event.type))gesture=null;
 }};track.querySelectorAll=s=>s==='.scroll-bar-part-bar'?[thumb]:[];
 const verticalTrack={...base,className:'scroll-bar-div',clientWidth:9,clientHeight:501,getBoundingClientRect:()=>({left:1280,top:10,width:9,height:501})};
 const verticalThumb={...base,className:'scroll-bar-part-bar',getBoundingClientRect:()=>({left:1281,top:10,width:6,height:329})};verticalTrack.querySelectorAll=()=>[verticalThumb];
 const v={...base,className:'mid-viewport',clientWidth:1261,scrollWidth:1261,clientHeight:441,scrollHeight:667,overflowX:'hidden',overflowY:'auto',scrollLeft:0,get scrollTop(){return y;},set scrollTop(value){y=Math.max(0,Math.min(226,value));}};
 const clips=Array.from({length:12},(_,i)=>({...base,className:'scrollable-cells-viewport ',clientWidth:1260,scrollWidth:1666,clientHeight:i?63:34,scrollHeight:i?63:34,overflowX:'clip',overflowY:'visible',get scrollLeft(){return 0;},set scrollLeft(value){},scrollTop:0}));
 const indices=()=>Array.from({length:12},(_,i)=>i+Math.min(4,Math.round(x*4)));
 const cell=(value,index)=>({...base,innerText:value,textContent:value,getAttribute:name=>name==='aria-colindex'?String(index+1):null});
 // Stable DOM row identities replace unavailable ARIA/data row IDs.
 const rows=Array.from({length:7},(_,slot)=>({...base,querySelectorAll:selector=>selector==='a[href]'?[]:indices().map(col=>cell(data[Math.min(3,Math.floor(y/75))+slot][col],col))}));
 const duplicate={...track,getBoundingClientRect:()=>({...trackRect,top:520})};duplicate.querySelectorAll=()=>[{...thumb,getBoundingClientRect:()=>({left:20+462*x,top:521.5,width:798,height:6})}];
 const root={...base,isConnected:true,clientWidth:1261,scrollWidth:1261,clientHeight:441,scrollHeight:441,closest:()=>null,querySelectorAll:selector=>selector==='*'?[...clips,v,track,thumb,verticalTrack,verticalThumb,...(ambiguous?[duplicate]:[])]:selector.includes('columnheader')?indices().map(i=>cell(headers[i],i)):selector.includes('[role="row"]')?rows:[]};
 const combo={...base,get innerText(){return filter;}};
 const document={body:{innerText:'Order Completely Ready to PIK'},querySelector:()=>null,querySelectorAll:s=>s.includes('[role="grid"]')?[root]:s==='[role="combobox"]'?[combo]:[],dispatchEvent(){}};
 class Mouse{constructor(type,options){this.type=type;Object.assign(this,options);}}
 const c=vm.createContext({document,location:{origin:'https://app.powerbi.com',href:'https://app.powerbi.com/'},getComputedStyle:e=>({visibility:'visible',display:'block',overflowX:e.overflowX||'visible',overflowY:e.overflowY||'visible'}),setTimeout:fn=>fn(),URL,Event:class{},MouseEvent:Mouse,PointerEvent:Mouse});
 vm.runInContext(source,c);return {c,events,data,position:()=>({x,y}),read:()=>c.ToolboxPowerBIReader.read(),diagnostic:()=>c.ToolboxPowerBIReader.diagnostic()};
}
(async()=>{
 for(const pointerOnly of [false,true]){
  const f=fixture({pointerOnly}),before=f.position(),result=await f.read();assert.equal(result.rows.length,10);assert.equal(result.headers.at(-1),'Internal Notes');assert.equal(result.warning,undefined);
  assert.equal(result.diagnostic.scan.horizontalControl.kind,'powerbi-custom-scrollbar');assert.equal(result.diagnostic.scan.horizontalProbe.areas.every(a=>a.reason==='content-overflow'),true);
  for(const row of result.rows){const i=Number(row.values[1].slice(-6))-100001;assert.equal(row.values[15],f.data[i][15]);assert.equal(row.values[14],'Référence interne '+i);}
  assert(Math.abs(f.position().x-before.x)<.012);assert.equal(f.position().y,before.y);assert(f.events.includes('mousedown'));if(pointerOnly)assert(f.events.includes('pointerdown'));
  const moves=f.events.length;f.diagnostic();assert.equal(f.events.length,moves,'diagnostic never drags the bar');
 }
 let f=fixture({blocked:true}),before=f.position();await assert.rejects(f.read(),/n’a pas confirmé/);assert.deepEqual(f.position(),before);assert(f.diagnostic().scan.customMoves.some(m=>m.actual!==m.target));
 f=fixture({ambiguous:true});await assert.rejects(f.read(),/Plusieurs barres horizontales/);assert.equal(f.events.length,0);
 f=fixture({onMove:({setFilter})=>setFilter('UK')});await assert.rejects(f.read(),/rapport a changé/);assert.equal(f.diagnostic().scan.restoreSkipped,'report-changed');
 console.log('PASS actual custom-bar reader: supplied clip/scrollbar geometry, measured mouse and pointer drag, all row windows, stable DOM row anchors, blank notes, separate InternalReference, restored positions, blocked/ambiguous controls, filter guards and read-only diagnostics');
})().catch(e=>{console.error(e);process.exitCode=1;});
