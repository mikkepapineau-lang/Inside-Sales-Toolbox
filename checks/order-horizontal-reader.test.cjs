const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('project/inside-sales-toolbox-team/powerbi-reader.js','utf8');
function fixture({indexed=true,rowKeys=true,frozen=false,initialLeft=800,sibling=false,omitNote=false,onRight,falseAreas=0,overflow='',noNative=false,recycle=false,neverReveal=false}={}){
 let x=initialLeft,y=120,reversed=false,filter='Tous',moved=0;
 const headers=['Sélection de ligne','Sales Order Number','Customer','Total Not Invoiced','ModeOfDelivery','Payment','Status','Sales Rep Name','Coordo','Référence','Divers','Internal Notes'];
 const rows=Array.from({length:10},(_,i)=>['','SO-CA'+(100001+i),'Client '+i,String(100+i),'GROUND','NET30','Open order','Alex','Alex','REF-'+i,'Texte '+i,i===1?'':'Contact '+i+'\n514 555-01'+String(i).padStart(2,'0')+'\ncontact'+i+'@example.test']);
 const base={getClientRects:()=>[{}],contains:()=>false,getAttribute:()=>null,dispatchEvent(){}};
 const h={...base,clientWidth:400,scrollWidth:1200,clientHeight:12,scrollHeight:12,get scrollLeft(){return x;},set scrollLeft(value){x=Math.max(0,Math.min(800,value));if(x>0){moved++;onRight?.({x,setY:value=>y=value,reverse:()=>reversed=true,filter:value=>filter=value,root});}},scrollTop:0};
 const v={...base,clientWidth:400,scrollWidth:400,clientHeight:200,scrollHeight:500,scrollLeft:0,get scrollTop(){return y;},set scrollTop(value){y=Math.max(0,Math.min(300,value));}};
 const falseScrollers=Array.from({length:falseAreas},(_,i)=>({...base,tagName:'DIV',className:'row content-overflow-'+i,overflowX:overflow,clientWidth:1260,scrollWidth:1871,clientHeight:[34,63,82,44][i%4],scrollHeight:[34,63,82,44][i%4],get scrollLeft(){return 0;},set scrollLeft(value){},scrollTop:0}));
 const ports=Array.from({length:3},(_,i)=>({...h,get scrollLeft(){return x;},set scrollLeft(value){h.scrollLeft=value;},get isConnected(){return Math.min(2,Math.floor(y/150))===i;}}));
 const scrollNodes=()=>[...(noNative?[]:[recycle?ports[Math.min(2,Math.floor(y/150))]:h]),v,...falseScrollers];
 const indices=()=>{const start=neverReveal?0:Math.floor(x/100),p=Array.from({length:4},(_,i)=>start+i);return frozen&&!p.includes(1)?[1,...p]:p;};
 const element=(value,col)=>({...base,innerText:value,textContent:value,getAttribute:name=>name==='aria-colindex'&&indexed?String(col+1):null});
 const visibleRows=()=>Array.from({length:4},(_,slot)=>{
  const index=Math.floor(y/50)+slot,i=reversed?9-index:index;
  return {...base,getAttribute:name=>name==='aria-rowindex'&&rowKeys?String(slot+2):null,querySelectorAll:selector=>selector==='a[href]'?[]:indices().filter(col=>!(omitNote&&i===2&&col===11)).map(col=>element(rows[i][col],col))};
 });
 const container={...base,querySelectorAll:()=>scrollNodes()};
 const root={...base,isConnected:true,clientHeight:200,scrollHeight:200,clientWidth:400,scrollWidth:400,closest:()=>sibling?container:null,querySelectorAll:selector=>selector==='*'?(sibling?[v]:scrollNodes()):selector.includes('columnheader')?indices().map(i=>element(headers[i],i)):selector.includes('[role="row"]')?visibleRows():[]};
 const combo={...base,get innerText(){return filter;}};
 const document={body:{innerText:'Order Completely Ready to PIK'},querySelector:()=>null,querySelectorAll:selector=>selector.includes('[role="grid"]')?[root]:selector==='[role="combobox"]'?[combo]:[]};
 const c=vm.createContext({document,location:{origin:'https://app.powerbi.com',href:'https://app.powerbi.com/'},getComputedStyle:e=>({visibility:'visible',display:'block',overflowX:e.overflowX||''}),setTimeout:fn=>fn(),URL,Event:class{}});vm.runInContext(source,c);
 return {read:()=>c.ToolboxPowerBIReader.read(),position:()=>({x,y}),moved:()=>moved,rows,headers,c,diagnostic:()=>c.ToolboxPowerBIReader.diagnostic(),reinject:()=>vm.runInContext(source,c)};
}
async function success(options={}){
 const f=fixture(options),original=f.position(),result=await f.read();
 assert.equal(result.error,undefined);assert.equal(result.rows.length,10);assert.deepEqual(Array.from(result.headers),f.headers);
 for(const record of result.rows){const index=Number(record.values[1].slice(-6))-100001;assert.equal(record.values[2],'Client '+index);assert.equal(record.values[11],options.omitNote&&index===2?'':f.rows[index][11]);if(options.omitNote&&index===2)assert(record.unreadColumns.includes(11));else assert(!record.unreadColumns?.includes(11));}
 assert(result.horizontalSteps>=9);assert.equal(result.steps,2);assert.equal(result.diagnostic.readerVersion,'2.2.0');assert.deepEqual(f.position(),original);assert(f.moved()>0);
 return result;
}
 async function workerRead(f){
 const previous={at:123,headers:['Sales Order Number','Customer'],rows:[{values:['SO-CA000000','Previous data']}]},local={toolboxPowerBI:previous},session={powerBITab:2};
 const tab={id:2,status:'complete',url:'https://app.powerbi.com/links/lNdArEWzXE'};
 const storage=store=>({get:async keys=>typeof keys==='string'?{[keys]:store[keys]}:Object.fromEntries(keys.map(k=>[k,store[k]])),set:async values=>Object.assign(store,values)});
 const chrome={storage:{local:storage(local),session:storage(session)},permissions:{contains:async()=>true},tabs:{get:async()=>tab},runtime:{id:'test',onMessage:{addListener(){}}},scripting:{executeScript:async options=>options.files?[]:[{frameId:0,result:await options.func(...options.args)}]}};
 const c=vm.createContext({chrome,URL,Date,setTimeout:fn=>fn(),ToolboxTabGroup:{add:async()=>{}},ToolboxPowerBIReader:f.c.ToolboxPowerBIReader,collectPowerBIOrderNotes:async data=>({data})});
 vm.runInContext(fs.readFileSync('project/inside-sales-toolbox-team/powerbi-worker.js','utf8'),c);
 return {local,previous,read:()=>c.readPowerBI('powerBIRead')};
 }
(async()=>{
 await success(); // Start fully scrolled right; SO disappears during the scan.
 await success({sibling:true}); // Thin horizontal bar outside the ARIA grid.
 await success({indexed:false}); // Match visible cells against each live header window.
 await success({rowKeys:false,frozen:true}); // Exact SO remains frozen when row indexes are absent.
 await success({omitNote:true}); // Missing is never a confirmed blank note.
 await success({falseAreas:8}); // Content width alone does not make a native scrollport.
 await success({falseAreas:8,overflow:'visible'});
 await success({recycle:true}); // Renew the real scrollports after vertical virtualization.
 let f=fixture({rowKeys:false}),original=f.position();await assert.rejects(f.read(),/identifiant de ligne stable/);assert.deepEqual(f.position(),original);
 f=fixture({initialLeft:0,onRight:({x,reverse})=>{if(x>=800)reverse();}});original=f.position();await assert.rejects(f.read(),/lignes ont changé|identifiants de ligne|valeurs ont changé/);assert.deepEqual(f.position(),original);
 f=fixture({initialLeft:0,onRight:({filter})=>filter('CANADA')});original=f.position();await assert.rejects(f.read(),/rapport a changé/);assert.deepEqual(f.position(),original);
 f=fixture({initialLeft:0,onRight:({setY})=>setY(50)});original=f.position();await assert.rejects(f.read(),/lignes ont bougé/);assert.deepEqual(f.position(),original);
 f=fixture({initialLeft:0,onRight:({root})=>root.isConnected=false});original=f.position();await assert.rejects(f.read(),/rapport a changé/);assert.deepEqual(f.position(),original);
 let w=await workerRead(fixture());await w.read();assert.equal(w.local.toolboxPowerBI.rows.length,10);assert.equal(w.local.toolboxPowerBI.headers.at(-1),'Internal Notes');assert.equal(w.local.toolboxPowerBIStatus.state,'done');
 w=await workerRead(fixture({initialLeft:0,onRight:({filter})=>filter('CANADA')}));await assert.rejects(w.read(),/rapport a changé/);assert.equal(w.local.toolboxPowerBI,w.previous);assert.equal(w.local.toolboxPowerBIStatus.state,'error');
 f=fixture({falseAreas:8});await f.read();assert.equal(f.diagnostic().scan.horizontalProbe.candidates,9);assert.equal(f.diagnostic().scan.horizontalProbe.movable,1);assert.equal(f.diagnostic().scan.horizontalProbe.areas.filter(a=>a.reason==='offset-unchanged').length,8);
 const scan=JSON.stringify(f.diagnostic().scan),position=f.position(),moves=f.moved();f.reinject();assert.equal(JSON.stringify(f.diagnostic().scan),scan);assert.deepEqual(f.position(),position);assert.equal(f.moved(),moves,'diagnostics must not perform scroll probes');
 f=fixture({falseAreas:8,initialLeft:0,noNative:true});await assert.rejects(f.read(),/Aucun conteneur horizontal/);f.reinject();assert.equal(f.diagnostic().scan.phase,'Lecture interrompue');assert.equal(f.diagnostic().scan.horizontalProbe.movable,0);assert.match(f.diagnostic().scan.error,/Aucun conteneur/);
 w=await workerRead(fixture({initialLeft:0,neverReveal:true}));await w.read();assert.match(w.local.toolboxPowerBIStatus.message,/pas encore lisible/);assert.equal(w.local.toolboxPowerBI.headers.includes('Internal Notes'),false);
 console.log('PASS 2D report reading: right-only virtualized notes, all vertical windows, recycled row indexes, global/absent column indexes, frozen SO, sibling thin scrollbar, blank/missing values, changed rows/filter/position/document guards and scroll restoration');
})().catch(e=>{console.error(e);process.exitCode=1;});
