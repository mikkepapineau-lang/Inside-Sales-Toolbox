// DOM-only extraction. No tokens, cookies, private API or report internals.
(()=>{
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const text=e=>String(e?.innerText||e?.textContent||e?.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim();
 const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none';
 function tables(){
  const nodes=[...document.querySelectorAll('[role="grid"],[role="table"],table,.tableEx')].filter(visible);
  return nodes.map(root=>{
   let headings=[...root.querySelectorAll('[role="columnheader"],thead th,.columnHeader')];
   headings=headings.filter(e=>!headings.some(other=>other!==e&&e.contains(other)));
   const headers=headings.map(text),keys=headers.map(norm);
   const order=keys.findIndex(v=>/^(d365itemid|d365itemnumber|itemnumber)$/.test(v));
   const sku=keys.findIndex(v=>v==='sku'),available=keys.findIndex(v=>v==='qtyavailable');
   const customer=keys.findIndex(v=>v==='description');
   return {root,headers,order,customer,sku,available};
  }).filter(t=>t.sku>=0&&t.available>=0&&t.customer>=0).filter((t,_,all)=>!all.some(o=>o!==t&&t.root.contains(o.root)));
 }
 function rows(t){
  const records=[];
  for(const row of t.root.querySelectorAll('[role="row"],tr,.row')){
   if(!visible(row))continue;
   let cells=[...row.querySelectorAll('[role="gridcell"],[role="cell"],td,.cell')];
   cells=cells.filter(e=>!cells.some(other=>other!==e&&e.contains(other)));
   if(!cells.length)continue;
   const values=Array(t.headers.length).fill('');
   const indexed=cells.every(e=>Number(e.getAttribute('aria-colindex'))>0);
   if(!indexed&&cells.length!==t.headers.length)continue;
   cells.forEach((cell,i)=>{const j=indexed?Number(cell.getAttribute('aria-colindex'))-1:i;if(j<values.length)values[j]=text(cell);});
   if(!values[t.sku]||/^(total|totaux)$/i.test(values[t.sku]))continue;
   const link=[...row.querySelectorAll('a[href]')].find(a=>text(a)===values[t.sku]);
   let href='';try{const u=new URL(link?.getAttribute('href')||'',location.href);if(link&&u.protocol==='https:'&&!u.username&&!u.password)href=u.href;}catch{}
   records.push({values,href});
  }
  return records;
 }
 const regionNames=['CANADA','UK','USA'];
 const readerVersion='1.2.1';
 const regionRoots='.visualContainer,visual-container,.visual-container-component,.slicerContainer,[data-visualtype="slicer"],[role="group"],[role="listbox"],[role="combobox"],[role="region"],filter-card,.filterCard,.filter-card,.chicletSlicer,.chiclet-slicer,.slicer';
 const regionOptions='[role="option"],[role="checkbox"],[role="menuitemcheckbox"],[role="button"],button,input[type="checkbox"],.slicerItemContainer,.chiclet,.chicletItem,.slicerText,.slicerItemText,.chicletItemText';
 const regionLabel=e=>[e.getAttribute?.('aria-label'),e.getAttribute?.('title'),text(e),...[...e.labels||[]].map(text)].filter(Boolean).map(value=>String(value).trim().toUpperCase()).filter(value=>new Set(value.match(/\b(?:CANADA|UK|USA)\b/g)||[]).size===1).map(value=>value.match(/^(CANADA|UK|USA)(?:$|[\s,;(:.])/)).find(Boolean)?.[1]||null;
 const regionHeading=e=>[e.getAttribute?.('aria-label'),e.getAttribute?.('title'),text(e)].some(value=>/^(?:subregions?|sousregions?)/.test(norm(value)));
 // Custom report visuals can put their controls in a same-origin iframe.
 // Inspect only accessible DOM documents; blocked frames remain diagnostic evidence.
 function regionDocuments(){
  const documents=[document];
  for(let i=0;i<documents.length&&documents.length<16;i++)for(const frame of documents[i].querySelectorAll('iframe')){
   if(!visible(frame))continue;let child;try{child=frame.contentDocument;}catch{}
   if(child?.querySelectorAll&&(child.body||child.documentElement)&&!documents.includes(child))documents.push(child);
   if(documents.length>=16)break;
  }
  return documents;
 }
 function discoverRegions(){
  const documents=regionDocuments(),roots=documents.flatMap(doc=>[...doc.querySelectorAll(regionRoots)].filter(visible)),groups=[],named=[];
  // A custom visual's frame can itself be the only container for its buttons.
  if(typeof window!=='undefined'&&window.top!==window&&document.body?.querySelectorAll&&visible(document.body)&&!roots.includes(document.body))roots.push(document.body);
  for(const root of roots){
   const heading=[root,...root.querySelectorAll('[aria-label],[title],[role="heading"],h1,h2,h3,h4,label,legend,.slicer-header-text,.visualTitle,.filterCardTitle')].some(regionHeading);if(heading)named.push(root);
   const options=[...root.querySelectorAll(regionOptions)].filter(e=>visible(e)&&regionLabel(e));
   // Text labels and native inputs can belong to the same selectable option.
   const targets=[...new Set(options.map(e=>e.closest?.('[role="option"],[role="checkbox"],[role="menuitemcheckbox"],button,.slicerItemContainer,.chiclet,.chicletItem')||e))];
   const unique=targets.filter(e=>!targets.some(other=>other!==e&&e.contains(other)));
   const controls=regionNames.map(name=>{const found=unique.filter(e=>regionLabel(e)===name);return found.length===1?found[0]:null;});
   if(controls.every(Boolean))groups.push({root,controls,named:heading});
  }
  const labelled=groups.filter(group=>group.named),pool=labelled.length?labelled:groups;
  // The report may put the SUBREGION caption in a separate text visual.
  const candidates=pool.filter(group=>!pool.some(other=>other!==group&&group.root.contains(other.root)));
  return {named,candidates,documents,rootCount:roots.length};
 }
 function regionControls(){const {candidates}=discoverRegions();return candidates.length===1?candidates[0]:null;}
 const selectionAttributes=['aria-selected','aria-checked','aria-pressed','data-selected'];
 const selectionSelector=selectionAttributes.map(name=>'['+name+']').join(',')+',input[type="checkbox"]';
 function selectionSignals(node){
  const values=[];let invalid=false;
  if(node?.tagName==='INPUT'&&node.type==='checkbox'){
   if(node.indeterminate||typeof node.checked!=='boolean')invalid=true;else values.push(node.checked);
  }
  for(const name of selectionAttributes){
   const value=node?.getAttribute?.(name);
   if(value==='true'||value==='false')values.push(value==='true');
   else if(value!==null&&value!==undefined)invalid=true;
  }
  return {values,invalid};
 }
 function selectionState(control,root){
  const nested=control.querySelectorAll?[...control.querySelectorAll(selectionSelector)]:[
   control.querySelector?.('input[type="checkbox"]'),
   control.querySelector?.(selectionSelector),
   control.querySelector?.('[aria-checked],[aria-selected],[aria-pressed]')
  ].filter(Boolean);
  if(nested.length>24)return null;
  const signals=[control,...new Set(nested)].map(selectionSignals);
  if(signals.some(signal=>signal.invalid))return null;
  const values=signals.flatMap(signal=>signal.values),distinct=[...new Set(values)];
  if(distinct.length)return distinct.length===1?distinct[0]:null;
  // Never inherit a state from the shared SUBREGION container or another country.
  for(let node=control.parentElement,depth=0;node&&node!==root&&depth<3;node=node.parentElement,depth++){
   if(regionLabel(node)!==regionLabel(control))break;
   const signal=selectionSignals(node),states=[...new Set(signal.values)];
   if(signal.invalid||states.length>1)return null;
   if(states.length)return states[0];
  }
  return null;
 }
 // Some custom slicers expose only visual styling. Record bounded evidence without
 // treating colors or a requested country as proof of the applied selection.
 function visualSelectionDiagnostic(node){
  const computedStyle={},dataSelection={};
  try{
   const readStyle=node.ownerDocument?.defaultView?.getComputedStyle;
   const style=readStyle?readStyle.call(node.ownerDocument.defaultView,node):getComputedStyle(node);
   for(const key of ['backgroundColor','color','borderTopColor','borderTopWidth','opacity','display','visibility']){
    const value=style?.[key];if(typeof value==='string'&&value)computedStyle[key]=value.slice(0,100);
   }
  }catch{/* A detached or inaccessible node must not break the diagnostic. */}
  try{
   const datum=node.__data__;
   for(const key of ['selected','isSelected'])if(typeof datum?.[key]==='boolean')dataSelection[key]=datum[key];
  }catch{/* Do not inspect or serialize the rest of a visual's data. */}
  return {computedStyle,dataSelection};
 }
 function regionControlDiagnostic(control,root){
  const describe=node=>({tag:node.tagName||'',role:node.getAttribute?.('role')||'',
   ...visualSelectionDiagnostic(node),
   classes:String(node.getAttribute?.('class')||'').slice(0,160),
   attributes:Object.fromEntries(selectionAttributes.map(name=>[name,node.getAttribute?.(name)]).filter(([,value])=>value!==null&&value!==undefined)),
   ...(node.tagName==='INPUT'&&node.type==='checkbox'?{checked:!!node.checked,indeterminate:!!node.indeterminate}:{})});
  const descendants=[];
  function visit(node,depth){
   if(depth>3||descendants.length>=16)return;
   for(const child of node.children||[]){
    if(descendants.length>=16)break;
    descendants.push({...describe(child),depth});visit(child,depth+1);
   }
  }
  visit(control,1);
  return {country:regionLabel(control),...describe(control),state:selectionState(control,root),descendants};
 }
 function regionState(){
  const group=regionControls();if(!group)return {verified:false,selected:[],reason:'Sélecteur SUBREGION introuvable ou ambigu.'};
  const states=group.controls.map(control=>selectionState(control,group.root));
  if(states.some(value=>value===null))return {verified:false,selected:[],reason:'L’état du sélecteur SUBREGION n’est pas accessible ou est contradictoire.'};
  const empty=states.every(value=>value===false),selected=empty?[...regionNames]:regionNames.filter((_,i)=>states[i]);return {verified:true,selected,empty};
 }
 const filterPaneNames=new Set(['filters','filtres','filterpane','filterspane','voletdesfiltres','showfilters','showfilterpane','showfilterspane','expandfilterpane','expandfilterspane','afficherlesfiltres','afficherlevoletdesfiltres','developperlevoletdesfiltres']);
 function filterPaneButtons(documents){
  return documents.flatMap(doc=>[...doc.querySelectorAll('button,[role="button"],[role="tab"]')]).filter(node=>visible(node)&&[node.getAttribute?.('aria-label'),node.getAttribute?.('title'),text(node)].some(label=>filterPaneNames.has(norm(label))));
 }
 const enabled=node=>!node.disabled&&node.getAttribute?.('aria-disabled')!=='true';
 async function openRegionDropdown(discovery){
  const targets=[];
  const roots=discovery.named.filter(root=>!discovery.named.some(other=>other!==root&&root.contains(other)));
  for(const root of roots){
   const nodes=[root,...root.querySelectorAll('[role="combobox"],[aria-expanded="false"],.slicer-dropdown-menu,.slicerDropdown,.dropdown-toggle')];
   for(const node of nodes){if(!visible(node)||!enabled(node)||node.getAttribute?.('aria-expanded')==='true')continue;
    if(node.getAttribute?.('role')==='combobox'||node.getAttribute?.('aria-expanded')==='false'||node.matches?.('.slicer-dropdown-menu,.slicerDropdown,.dropdown-toggle'))targets.push(node);
   }
  }
  const unique=[...new Set(targets)].filter(node=>!targets.some(other=>other!==node&&node.contains(other)));
  if(unique.length!==1)return false;unique[0].dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));return true;
 }
 async function revealRegionControls(){
  let discovery=discoverRegions();if(discovery.candidates.length)return;
  const tried=new Set();let paneTried=false;const deadline=Date.now()+7000;
  do{
   const pending={...discovery,named:discovery.named.filter(root=>!tried.has(root))};
   if(pending.named.length){pending.named.forEach(root=>tried.add(root));await openRegionDropdown(pending);}
   else if(!discovery.named.length&&!paneTried){
    paneTried=true;const buttons=filterPaneButtons(discovery.documents).filter(node=>enabled(node)&&node.getAttribute?.('aria-expanded')!=='true'&&(node.getAttribute?.('aria-expanded')==='false'||node.getAttribute?.('aria-selected')==='false'||[node.getAttribute?.('aria-label'),node.getAttribute?.('title'),text(node)].some(label=>/^(?:show|expand|afficher|developper)/.test(norm(label)))));
    const unique=buttons.filter(node=>!buttons.some(other=>other!==node&&node.contains(other)));
    if(unique.length===1)unique[0].dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
   }
   await new Promise(resolve=>setTimeout(resolve,200));discovery=discoverRegions();if(discovery.candidates.length)return;
  }while(Date.now()<deadline);
 }
 function regionDiagnostic(){const found=discoverRegions();return {documents:found.documents.length,rootCount:found.rootCount,namedRoots:found.named.length,candidateGroups:found.candidates.length,filterPaneButtons:filterPaneButtons(found.documents).slice(0,5).map(node=>({label:node.getAttribute?.('aria-label')||node.getAttribute?.('title')||text(node),expanded:node.getAttribute?.('aria-expanded')||'',enabled:enabled(node)})),controls:found.candidates.slice(0,5).map(group=>({labelled:group.named,role:group.root.getAttribute?.('role')||'',countries:group.controls.map(regionLabel),states:group.controls.map(control=>regionControlDiagnostic(control,group.root))})),named:found.named.slice(0,8).map(root=>({tag:root.tagName||'',role:root.getAttribute?.('role')||'',label:root.getAttribute?.('aria-label')||root.getAttribute?.('title')||'',expanded:root.getAttribute?.('aria-expanded')||''}))};}
 async function ensureRegion(region='ALL',options={}){
  const requested=region==='ALL'?[...regionNames]:Array.isArray(region)?region:typeof region==='string'?region.split('+'):[];
  if(!requested.length||requested.length>3||requested.some(name=>!regionNames.includes(name)))throw Error('Sous-région invalide.');
  const desired=regionNames.filter(name=>requested.includes(name));
  const same=state=>state.verified&&JSON.stringify([...state.selected].sort())===JSON.stringify([...desired].sort());
  await revealRegionControls();let state=regionState();if(!state.verified)throw Error(state.reason+' Ouvre le filtre dans Power BI, puis utilise Diagnostic inventaire usagé.');
  for(let attempt=0;attempt<7&&!same(state);attempt++){
   const group=regionControls();if(!group)throw Error('Le sélecteur SUBREGION a changé.');
   let name=state.empty&&desired.length<regionNames.length?desired[0]:regionNames.find(n=>state.selected.includes(n)!==desired.includes(n));
   const control=group.controls[regionNames.indexOf(name)];if(!control||control.disabled||control.getAttribute('aria-disabled')==='true')throw Error('La sous-région ne peut pas être sélectionnée.');
   const before=JSON.stringify(state.selected);control.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:!state.empty}));
   const deadline=Date.now()+2500;do{await new Promise(r=>setTimeout(r,150));state=regionState();if(!state.verified)throw Error(state.reason);if(JSON.stringify(state.selected)!==before)break;}while(Date.now()<deadline);
   if(JSON.stringify(state.selected)===before)throw Error('La sélection SUBREGION ne répond pas. Aucun relevé régional n’a été enregistré.');
  }
  if(!same(state))throw Error('La sous-région sélectionnée ne correspond pas à la demande.');
  if(options.slicerOnly)return desired;
  await waitForTable(desired);return desired;
 }
 async function waitForTable(expected=null){
  const same=state=>state.verified&&JSON.stringify([...state.selected].sort())===JSON.stringify([...(expected||[])].sort());
  const start=Date.now(),deadline=start+15000;let stable=0,previous='';
  do{
   await new Promise(r=>setTimeout(r,300));if(expected&&!same(regionState()))throw Error('La sous-région a changé pendant son chargement.');
   const table=tables()[0],signature=table?JSON.stringify([table.headers,rows(table).slice(0,4).map(r=>r.values)]):'';
   if(!diagnostic().busy&&signature&&signature===previous)stable++;else stable=0;previous=signature;
   if(stable>=3&&Date.now()-start>=2000)return;
  }while(Date.now()<deadline);
  throw Error('La mise à jour du tableau après sélection de la sous-région n’est pas confirmée.');
 }
 function diagnostic(){return {readerVersion,subregion:regionState(),subregionSelectors:regionDiagnostic(),embeddedFrames:[...document.querySelectorAll('iframe')].filter(visible).slice(0,8).map(frame=>{let origin='',documentAccessible=false;try{origin=new URL(frame.getAttribute('src')||'',location.href).origin;}catch{}try{documentAccessible=!!(frame.contentDocument?.body||frame.contentDocument?.documentElement);}catch{}return {title:frame.getAttribute('title')||'',origin,documentAccessible};}),tables:tables().map(t=>({headers:t.headers,rowCount:rows(t).length})),gridCount:document.querySelectorAll('[role="grid"],[role="table"],table,.tableEx').length,frame:location.origin,readyLabel:tables().length===1,currency:(String(document.body?.innerText||'').match(/Display\s+Currency\s+(CAD|USD|EUR|GBP)\b/i)||[])[1]||'',busy:!!document.querySelector('[aria-busy="true"]')};}
 async function ensureReady(){
  if(diagnostic().readyLabel)return;
  const name=e=>[text(e),e.getAttribute('aria-label'),e.getAttribute('title')].filter(Boolean).some(s=>/^LP\s+Catalog\s*[-–]\s*Used\s+Gear$/i.test(String(s).trim()));
  let unique=[];const loadingDeadline=Date.now()+12000;
  do{
   if(diagnostic().readyLabel)return;
   const candidates=[...document.querySelectorAll('[role="tab"],[role="treeitem"],button,a,[role="button"],.navigationItem')].filter(e=>visible(e)&&name(e)&&!e.disabled&&e.getAttribute('aria-disabled')!=='true');
   unique=candidates.filter(e=>!candidates.some(other=>other!==e&&e.contains(other)));
   if(unique.length)break;
   await new Promise(r=>setTimeout(r,250));
  }while(Date.now()<loadingDeadline);
  if(unique.length!==1)throw Error('La page LP Catalog - Used Gear ne peut pas être sélectionnée automatiquement ('+unique.length+' cible). Ouvre le panneau des pages du rapport ou utilise Diagnostic Power BI.');
  unique[0].click();
  const deadline=Date.now()+12000;
  while(Date.now()<deadline){if(diagnostic().readyLabel&&!diagnostic().busy){await new Promise(r=>setTimeout(r,500));return;}await new Promise(r=>setTimeout(r,250));}
  throw Error('LP Catalog - Used Gear a été sélectionné, mais son chargement n’est pas confirmé. Réessaie après le chargement.');
 }
 let scan=null;
 const scope=()=>JSON.stringify({regions:regionState(),filters:[...document.querySelectorAll('[role="combobox"]')].filter(visible).map(text)});
 function restore(){if(scan)for(const [e,top,left] of scan.saved){e.scrollTop=top;e.scrollLeft=left;e.dispatchEvent(new Event('scroll',{bubbles:true}));}}
 function cancel(){restore();scan=null;return {cancelled:true};}
 async function read(options={}){
  cancel();
  const external=options.externalRegions;
  if(external!==undefined&&(!Array.isArray(external)||!external.length||external.length>3||new Set(external).size!==external.length||external.some(name=>!regionNames.includes(name))))throw Error('Sous-région externe invalide.');
  const state=regionState();
  if(external&&state.verified&&JSON.stringify([...external].sort())!==JSON.stringify([...state.selected].sort()))throw Error('Les sélecteurs SUBREGION ne concordent pas.');
  const candidates=tables();if(candidates.length!==1)return {error:candidates.length?'Plusieurs tableaux d’inventaire usagé détectés. Affiche uniquement LP Catalog - Used Gear.':'Tableau d’inventaire usagé non accessible. Ouvre LP Catalog - Used Gear; au besoin, sélectionne le tableau et utilise Alt + Maj + F11.',diagnostic:diagnostic()};
  if(diagnostic().busy)return {error:'Power BI charge encore le rapport. Réessaie après le chargement.',diagnostic:diagnostic()};
  const t=candidates[0],scrollers=[t.root,...t.root.querySelectorAll('*')].filter(e=>e.clientHeight>40&&e.scrollHeight>e.clientHeight+5);
  const declared=Number(t.root.getAttribute('aria-rowcount'));
  const headerRows=[...t.root.querySelectorAll('[role="row"],tr')].filter(e=>e.querySelector('[role="columnheader"],th')).length;
  const expected=Number.isInteger(declared)&&declared>0?Math.max(0,declared-headerRows):null;
  scan={regions:external?[...external]:state.verified?state.selected:null,t,scrollers,saved:scrollers.map(e=>[e,e.scrollTop,e.scrollLeft]),collected:new Map(),scope:scope(),currency:diagnostic().currency,steps:0,endStable:0,lastEnd:'',stalled:0,expected};
  scrollers.forEach(e=>{e.scrollTop=0;e.dispatchEvent(new Event('scroll',{bubbles:true}));});
  await new Promise(r=>setTimeout(r,500));return next();
 }
 async function next(){
  if(!scan)throw Error('La lecture du catalogue a été interrompue. Relance Actualiser.');
  const deadline=Date.now()+6500;
  try{
   do{
    if(scope()!==scan.scope||diagnostic().currency!==scan.currency||tables()[0]?.root!==scan.t.root)throw Error('Les filtres ou le tableau ont changé pendant la lecture. Relance Actualiser.');
    if(diagnostic().busy){await new Promise(r=>setTimeout(r,400));continue;}
    for(const r of rows(scan.t))scan.collected.set(JSON.stringify(r.values),r);
    const before=scan.scrollers.map(e=>e.scrollTop);
    const atEnd=scan.scrollers.every(e=>e.scrollTop+e.clientHeight>=e.scrollHeight-2);
    if(atEnd){
     const signature=JSON.stringify([scan.collected.size,scan.scrollers.map(e=>e.scrollHeight)]);
     scan.endStable=signature===scan.lastEnd?scan.endStable+1:0;scan.lastEnd=signature;
     if(scan.endStable>=3){
      if(!scan.collected.size)throw Error('Aucune ligne d’inventaire lisible. Cela ne confirme pas l’absence d’articles.');
      const complete=scan.expected!==null&&scan.expected===scan.collected.size;
      const result={regions:scan.regions,headers:scan.t.headers,rows:[...scan.collected.values()],currency:scan.currency,filters:scan.scope,steps:scan.steps,loadedToEnd:true,expected:scan.expected,complete,partial:!complete,more:false,diagnostic:diagnostic()};
      restore();scan=null;return result;
     }
    }else{
     scan.endStable=0;scan.scrollers.forEach(e=>{e.scrollTop+=Math.max(40,e.clientHeight*.75);e.dispatchEvent(new Event('scroll',{bubbles:true}));});scan.steps++;
     scan.stalled=scan.scrollers.every((e,i)=>e.scrollTop===before[i])?scan.stalled+1:0;
     if(scan.stalled>=6)throw Error('Le défilement Power BI ne progresse plus. Le chargement complet n’est pas confirmé.');
    }
    await new Promise(r=>setTimeout(r,350));
   }while(Date.now()<deadline);
   return {regions:scan.regions,more:true,count:scan.collected.size,expected:scan.expected,steps:scan.steps,diagnostic:diagnostic()};
  }catch(e){cancel();throw e;}
 }
 const regionProbe=()=>({readerVersion,subregion:regionState(),subregionSelectors:regionDiagnostic()});
 globalThis.ToolboxUsedPowerBIReader={read,next,cancel,diagnostic,ensureReady,regionState,ensureRegion,waitForTable,regionProbe};
 // Registered in related Power BI frames, including sandboxed about:/blob: visuals.
 // Only extension messages are accepted; no page postMessage or report internals.
 if(!globalThis.chrome?.runtime?.id||typeof window==='undefined'||window.top===window||globalThis.ToolboxUsedRegionAgent)return;
 globalThis.ToolboxUsedRegionAgent={version:1};
 chrome.runtime.onMessage.addListener((message,sender,reply)=>{
  if(sender.id!==chrome.runtime.id)return;
  const reader=globalThis.ToolboxUsedPowerBIReader;
  if(message?.kind==='usedRegionDiscover'&&typeof message.nonce==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(message.nonce)){
   chrome.runtime.sendMessage({kind:'usedRegionFrameFound',nonce:message.nonce,probe:reader.regionProbe()}).then(()=>reply({announced:true}),error=>reply({error:String(error.message||error)}));return true;
  }
  if(message?.kind==='usedRegionProbe'){reply({probe:reader.regionProbe()});return;}
  if(message?.kind!=='usedRegionSelect')return;
  if(typeof message.region!=='string'||message.region.length>32){reply({error:'Sous-région invalide.'});return;}
  reader.ensureRegion(message.region,{slicerOnly:true}).then(()=>reply({probe:reader.regionProbe()}),error=>reply({error:String(error.message||error),probe:reader.regionProbe()}));return true;
 });
})();
