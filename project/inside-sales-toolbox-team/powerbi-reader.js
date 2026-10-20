// DOM-only extraction of both virtualized axes. No report internals or private API.
(()=>{
 const version='2.1.0',norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 if(globalThis.ToolboxPowerBIReader?.version===version)return;
 const text=e=>String(e?.innerText||e?.textContent||e?.getAttribute?.('aria-label')||'').replace(/\s+/g,' ').trim();
 const noteText=e=>String(e?.innerText||e?.textContent||e?.getAttribute?.('aria-label')||'').replace(/\r\n?/g,'\n').replace(/[\t\u00a0\u202f]+/g,' ').trim();
 const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none';
 const orderHeader=s=>/^(salesordernumber|sonumber|numerodecommande|numerocommande)$/.test(norm(s));
 const customerHeader=s=>/^(accountname|customername|nomducompte|nomduclient|customer|client)$/.test(norm(s));
 const notesHeader=s=>/^(internalnotes|internalnote|solinternalnotes|notesinternes|noteinterne)$/.test(norm(s));
 const isOrder=s=>/^SO-[A-Z0-9]+(?:-[A-Z0-9]+)*$/i.test(String(s||''));
 const busy=()=>!!document.querySelector('[aria-busy="true"]');
 const ready=()=>/Order Completely Ready to PIK|SO Completely Ready To PIK/i.test(document.body?.innerText||'');
 const delay=ms=>new Promise(r=>setTimeout(r,ms));let lastScan;
 function attribute(e,name,root){for(let n=e;n;n=n.parentElement){const value=n.getAttribute?.(name);if(value!==null&&value!==undefined&&value!=='')return value;if(n===root)break;}return '';}
 function headings(root){
  const nodes=[...root.querySelectorAll('[role="columnheader"],thead th,.columnHeader')].filter(visible);
  return nodes.filter(e=>!nodes.some(other=>other!==e&&e.contains(other))).map(e=>({label:text(e),position:Number(attribute(e,'aria-colindex',root))||0}));
 }
 function tables(all=false){
  const found=[...document.querySelectorAll('[role="grid"],[role="table"],table,.tableEx')].filter(visible).map(root=>({root,headers:headings(root).map(h=>h.label)})).filter(t=>t.headers.length);
  const leaf=found.filter(t=>!found.some(o=>o!==t&&t.root.contains(o.root)));
  return all?leaf:leaf.filter(t=>t.headers.some(orderHeader)&&t.headers.some(customerHeader));
 }
 function visualNodes(root){
  const nodes=new Set([root,...root.querySelectorAll('*')]);
  // A visual can put its scrollbar beside, rather than inside, the ARIA grid.
  const containers=new Set([root.closest?.('.tableEx'),root.closest?.('.visual-container,.visualContainer')].filter(Boolean));
  for(const container of containers){nodes.add(container);for(const e of container.querySelectorAll('*'))nodes.add(e);}
  for(let p=root.parentElement,i=0;p&&i<4&&p!==document.body&&p!==document.documentElement;p=p.parentElement,i++){nodes.add(p);if(containers.has(p))break;}
  return [...nodes].filter(visible);
 }
 function scrollAreas(root){return visualNodes(root).filter(e=>e.clientHeight>40&&e.scrollHeight>e.clientHeight+5||e.clientWidth>40&&e.scrollWidth>e.clientWidth+5);}
 const vertical=e=>e.clientHeight>40&&e.scrollHeight>e.clientHeight+5;
 const horizontal=e=>e.clientWidth>40&&e.scrollWidth>e.clientWidth+5;
 const endY=e=>Number(e.scrollTop||0)+e.clientHeight>=e.scrollHeight-2;
 const endX=e=>Number(e.scrollLeft||0)+e.clientWidth>=e.scrollWidth-2;
 function elementInfo(e){const css=getComputedStyle(e);return {tag:e.tagName||'',className:String(e.getAttribute?.('class')||e.className||'').slice(0,200),role:e.getAttribute?.('role')||'',overflowX:css.overflowX||'',overflowY:css.overflowY||'',horizontal:horizontal(e),vertical:vertical(e),left:e.scrollLeft||0,top:e.scrollTop||0,width:e.clientWidth,scrollWidth:e.scrollWidth,height:e.clientHeight,scrollHeight:e.scrollHeight};}
 function diagnostic(){return {readerVersion:version,tables:tables(true).map(t=>({headers:t.headers,rowCount:t.root.querySelectorAll('[role="row"],tr,.row').length,scrollAreas:scrollAreas(t.root).map(elementInfo),scrollControls:visualNodes(t.root).filter(e=>e.getAttribute?.('role')==='scrollbar'||/scroll.?bar/i.test(String(e.getAttribute?.('class')||e.className||''))).slice(0,16).map(e=>({...elementInfo(e),orientation:e.getAttribute?.('aria-orientation')||'',valueNow:e.getAttribute?.('aria-valuenow'),valueMin:e.getAttribute?.('aria-valuemin'),valueMax:e.getAttribute?.('aria-valuemax')}))})),gridCount:document.querySelectorAll('[role="grid"],[role="table"],table,.tableEx').length,frame:location.origin,readyLabel:ready(),busy:busy(),...(lastScan?{scan:lastScan}:{})};}
 async function ensureReady(){
  if(ready())return;
  const name=e=>[text(e),e.getAttribute('aria-label'),e.getAttribute('title')].filter(Boolean).some(s=>/^ready\s+to\s+pik$/i.test(String(s).trim()));
  const candidates=[...document.querySelectorAll('[role="tab"],[role="treeitem"],button,a,[role="button"],.navigationItem')].filter(e=>visible(e)&&name(e)&&!e.disabled&&e.getAttribute('aria-disabled')!=='true');
  const unique=candidates.filter(e=>!candidates.some(other=>other!==e&&e.contains(other)));
  if(unique.length!==1)throw Error('La page Ready to PIK ne peut pas être sélectionnée automatiquement ('+unique.length+' cible). Ouvre le panneau des pages du rapport ou utilise Diagnostic Power BI.');
  unique[0].click();
  const deadline=Date.now()+12000;
  while(Date.now()<deadline){if(ready()&&!busy()){await delay(500);return;}await delay(250);}
  throw Error('Ready to PIK a été sélectionné, mais son chargement n’est pas confirmé. Réessaie après le chargement.');
 }
 async function read(){
  lastScan={headers:[],horizontalSteps:0,verticalSteps:0,rows:0,phase:'Identification du tableau'};
  const known=tables(),candidates=known.length?known:tables(true);
  if(candidates.length!==1)return {error:candidates.length?'Plusieurs tableaux de commandes détectés. Affiche uniquement Ready to PIK.':'Tableau de commandes non accessible. Ouvre Ready to PIK; au besoin, sélectionne le tableau et utilise Alt + Maj + F11.',diagnostic:diagnostic()};
  const root=candidates[0].root;
  if(!ready())return {error:'La page Ready to PIK n’est pas confirmée. Ouvre cette page du rapport.',diagnostic:diagnostic()};
  if(busy())return {error:'Power BI charge encore le rapport. Réessaie après le chargement.',diagnostic:diagnostic()};
  const scope=()=>JSON.stringify([...document.querySelectorAll('[role="combobox"]')].filter(visible).map(text)),initialScope=scope();
  const areas=scrollAreas(root),ys=areas.filter(vertical),saved=areas.map(e=>[e,Number(e.scrollTop||0),Number(e.scrollLeft||0)]),savedNodes=new Set(areas),probed=new WeakMap();let xs=[];
  const columns=[],byPosition=new Map(),byName=new Map(),collected=new Map();
  const check=()=>{if(root.isConnected===false||!ready()||scope()!==initialScope)throw Error('Le rapport a changé pendant la lecture. Réessaie.');};
  const settled=async ms=>{await delay(ms);for(let i=0;i<12&&busy();i++)await delay(150);check();if(busy())throw Error('Power BI charge encore les cellules. Réessaie après le chargement.');};
  const dispatch=e=>e.dispatchEvent(new Event('scroll',{bubbles:true}));
  const left=()=>{for(const e of xs){e.scrollLeft=0;dispatch(e);}};
  function refreshHorizontal(){
   const candidates=scrollAreas(root).filter(horizontal),details=[];xs=[];
   for(const e of candidates){
    if(!savedNodes.has(e)){savedNodes.add(e);saved.push([e,Number(e.scrollTop||0),Number(e.scrollLeft||0)]);}
    let result=probed.get(e);
    if(!result){
     const overflow=getComputedStyle(e).overflowX||'';
     if(overflow==='visible'||overflow==='clip')result={movable:false,reason:'content-overflow'};
     else{
      const before=Number(e.scrollLeft||0),max=e.scrollWidth-e.clientWidth,target=before<max-1?Math.min(max,before+24):Math.max(0,before-24);
      e.scrollLeft=target;const after=Number(e.scrollLeft||0);e.scrollLeft=before;
      result={movable:Math.abs(after-before)>.5,reason:Math.abs(after-before)>.5?'native-scroll':'offset-unchanged'};
      if(result.movable)dispatch(e);
     }
     probed.set(e,result);
    }
    details.push({...elementInfo(e),...result});if(result.movable&&e.isConnected!==false)xs.push(e);
   }
   lastScan.horizontalProbe={candidates:candidates.length,movable:xs.length,areas:details};
   if(candidates.length&&!xs.length&&!headings(root).some(h=>notesHeader(h.label)))throw Error('Aucun conteneur horizontal n’a répondu au défilement. Utilise Diagnostic Power BI pour identifier la barre du tableau.');
  }
  function position(column,index){
   if(!index)return;
   if(column.position&&column.position!==index||byPosition.has(index)&&byPosition.get(index)!==column)throw Error('Les colonnes ont changé pendant la lecture. Réessaie.');
   column.position=index;byPosition.set(index,column);
  }
  function headerColumns(){
   const headers=headings(root),counts=new Map();for(const h of headers)counts.set(norm(h.label),(counts.get(norm(h.label))||0)+1);
   const result=headers.map(h=>{
    const name=norm(h.label),named=byName.get(name)||[];let column=h.position?byPosition.get(h.position):null;
    if(column&&column.name!==name)throw Error('Les colonnes ont changé pendant la lecture. Réessaie.');
    if(!column){
     if(!h.position&&(counts.get(name)>1||named.length>1))throw Error('Plusieurs colonnes portent le même nom sans index accessible. Utilise la vue accessible du tableau.');
     column=named.length===1&&(!h.position||!named[0].position||named[0].position===h.position)?named[0]:null;
     if(!column){column={name,label:h.label,position:h.position||0,id:columns.length};columns.push(column);byName.set(name,[...named,column]);}
    }
    position(column,h.position);return column;
   });
   lastScan.headers=columns.map(c=>c.label);return result;
  }
  function snapshot(){
   check();const currentHeaders=headerColumns(),fragments=[];
   for(const row of root.querySelectorAll('[role="row"],tr,.row')){
    if(!visible(row))continue;
    let cells=[...row.querySelectorAll('[role="gridcell"],[role="cell"],td,.cell')];cells=cells.filter(e=>!cells.some(other=>other!==e&&e.contains(other)));if(!cells.length)continue;
    const indexes=cells.map(e=>Number(attribute(e,'aria-colindex',row))||0),indexed=indexes.every(i=>i>0);
    if(indexed&&new Set(indexes).size!==indexes.length)throw Error('Index de colonnes ambigu. Utilise la vue accessible du tableau.');
    if(indexed&&cells.length===currentHeaders.length&&currentHeaders.every((c,i)=>!c.position||c.position===indexes[i]))currentHeaders.forEach((c,i)=>position(c,indexes[i]));
    const values=new Map();
    cells.forEach((cell,i)=>{
     const column=indexes[i]?byPosition.get(indexes[i]):cells.length===currentHeaders.length?currentHeaders[i]:null;
     if(column)values.set(column,notesHeader(column.label)?noteText(cell):text(cell));
    });
    const orders=[...values].filter(([column,value])=>orderHeader(column.label)&&isOrder(value)).map(([,v])=>v),unique=[...new Set(orders)];
    if(unique.length>1)throw Error('Plusieurs numéros de SO sont présents sur une même ligne. Lecture annulée.');
    const order=unique[0]||'',rowKey=['aria-rowindex','data-row-key','data-row-index','row-index'].map(a=>{const v=row.getAttribute?.(a);return v!==null&&v!==undefined&&v!==''?a+':'+v:'';}).find(Boolean)||'';
    let href='';const link=[...row.querySelectorAll('a[href]')].find(a=>text(a)===order);
    try{const u=new URL(link?.getAttribute('href')||'',location.href);if(link&&u.protocol==='https:'&&u.hostname==='solotech.operations.dynamics.com')href=u.href;}catch{}
    fragments.push({order,rowKey,values,href});
   }
   return fragments;
  }
  function merge(map,order,fragment){
   let record=map.get(order);if(!record){record={values:new Map(),href:fragment.href};map.set(order,record);}
   for(const [column,value]of fragment.values){if(record.values.has(column)&&record.values.get(column)!==value)throw Error('Les valeurs ont changé pendant la lecture. Réessaie après le chargement.');record.values.set(column,value);}
   if(fragment.href)record.href=fragment.href;
  }
  async function sweep(){
   lastScan.phase='Lecture des colonnes';const previousTops=ys.map(e=>Number(e.scrollTop||0));refreshHorizontal();left();await settled(250);
   if(ys.some((e,i)=>Math.abs(Number(e.scrollTop||0)-previousTops[i])>1))throw Error('Les lignes ont bougé pendant la préparation du défilement horizontal. Lecture annulée.');
   const tops=ys.map(e=>Number(e.scrollTop||0)),baseline=snapshot(),page=new Map(),anchors=new Map(),ignored=new Set();
   for(const row of baseline){
    if(row.order){merge(page,row.order,row);if(row.rowKey){if(anchors.has(row.rowKey)&&anchors.get(row.rowKey)!==row.order)throw Error('Index de ligne ambigu. Lecture annulée.');anchors.set(row.rowKey,row.order);}}
    else if(row.rowKey)ignored.add(row.rowKey);
   }
   if(!page.size)throw Error('Aucune SO lisible à gauche du tableau. Essaie la vue accessible du tableau.');
   const baselineOrders=new Set(page.keys());
   for(let step=0;xs.some(e=>e.isConnected!==false&&!endX(e));step++){
    if(step>=32)throw Error('La dernière colonne n’a pas pu être atteinte. Aucune nouvelle donnée enregistrée.');
    xs=xs.filter(e=>e.isConnected!==false);const before=xs.map(e=>Number(e.scrollLeft||0));
    for(const e of xs){e.scrollLeft=Math.min(e.scrollWidth-e.clientWidth,Number(e.scrollLeft||0)+Math.max(40,e.clientWidth*.75));dispatch(e);}
    await settled(200);lastScan.horizontalSteps++;
    if(ys.some((e,i)=>Math.abs(Number(e.scrollTop||0)-tops[i])>1))throw Error('Les lignes ont bougé pendant le défilement horizontal. Lecture annulée.');
    if(xs.every((e,i)=>Number(e.scrollLeft||0)===before[i]))throw Error('Le défilement horizontal est bloqué. Ouvre la vue accessible du tableau.');
    for(const row of snapshot()){
     if(ignored.has(row.rowKey)&&!row.order)continue;
     const anchored=row.rowKey?anchors.get(row.rowKey):'',order=row.order||anchored;
     if(row.order&&anchored&&row.order!==anchored||order&&!baselineOrders.has(order))throw Error('Les lignes ont changé pendant la lecture des colonnes. Lecture annulée.');
     if(!order){if([...row.values].some(([c,v])=>notesHeader(c.label)&&v.trim()))throw Error('Internal Notes visibles, mais sans SO ni identifiant de ligne stable. Utilise la vue accessible du tableau.');continue;}
     merge(page,order,row);
    }
   }
   // Recheck the original SO anchors before committing any right-hand cells.
   left();await settled(200);const checked=snapshot(),checkedOrders=new Set(checked.filter(r=>r.order).map(r=>r.order));
   if(checkedOrders.size!==baselineOrders.size||[...baselineOrders].some(order=>!checkedOrders.has(order)))throw Error('Les lignes ont changé pendant la lecture des colonnes. Lecture annulée.');
   for(const row of checked)if(row.order){if(row.rowKey&&anchors.has(row.rowKey)&&anchors.get(row.rowKey)!==row.order)throw Error('Les identifiants de ligne ont changé pendant la lecture.');merge(page,row.order,row);}
   for(const [order,record]of page)merge(collected,order,record);
   lastScan.rows=collected.size;
  }
  try{
   for(const e of ys){e.scrollTop=0;dispatch(e);}left();await settled(350);
   await sweep();
   for(let i=0;i<45&&ys.some(e=>!endY(e));i++){
    for(const e of ys){e.scrollTop=Math.min(e.scrollHeight-e.clientHeight,Number(e.scrollTop||0)+Math.max(40,e.clientHeight*.8));dispatch(e);}
    await settled(250);lastScan.verticalSteps++;await sweep();
   }
   check();if(busy())throw Error('Le rapport charge encore. Réessaie.');
   if(!columns.some(c=>orderHeader(c.label))||!columns.some(c=>customerHeader(c.label)))throw Error('Le tableau de commandes n’est pas confirmé. Ouvre Ready to PIK.');
   const ordered=columns.every(c=>c.position)?[...columns].sort((a,b)=>a.position-b.position):columns;
   const headers=ordered.map(c=>c.label),rows=[...collected.values()].map(record=>{const unreadColumns=ordered.map((c,i)=>record.values.has(c)?-1:i).filter(i=>i>=0);return {values:ordered.map(c=>record.values.get(c)??''),href:record.href,...(unreadColumns.length?{unreadColumns}:{})};});
   lastScan={...lastScan,headers,phase:'Lecture terminée'};
   const warning=lastScan.horizontalSteps&&!headers.some(notesHeader)?'Le défilement a été effectué, mais Internal Notes n’est pas encore lisible dans le rapport. Consulte Diagnostic Power BI.':'';
   return {headers,rows,partial:true,limited:ys.some(e=>!endY(e)),steps:lastScan.verticalSteps,horizontalSteps:lastScan.horizontalSteps,...(warning?{warning}:{}),diagnostic:diagnostic()};
  }catch(e){lastScan={...lastScan,phase:'Lecture interrompue',error:e.message};throw e;}
  finally{for(const [e,top,left]of [...saved].reverse()){if(e.isConnected===false)continue;e.scrollTop=top;e.scrollLeft=left;dispatch(e);}}
 }
 globalThis.ToolboxPowerBIReader={version,read,diagnostic,ensureReady};
})();
