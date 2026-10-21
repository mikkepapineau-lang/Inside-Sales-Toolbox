// Automate the report's native Export data controls. The native XLSX stays
// local: no credentials, report API, dataset internals or external service.
(()=>{
 let active=null;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const label=e=>e.getAttribute?.('aria-label')||e.getAttribute?.('title')||e.innerText||e.textContent||'';
 const visible=e=>{
  if(!e.getClientRects().length)return false;
  for(let node=e;node instanceof Element;node=node.parentElement){const style=getComputedStyle(node);if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return false;}
  return true;
 };
 const enabled=e=>!e.disabled&&e.getAttribute?.('aria-disabled')!=='true';
 const unique=nodes=>nodes.filter((e,i)=>nodes.indexOf(e)===i&&!nodes.some(other=>other!==e&&e.contains(other)));
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function wait(find,job,message,ms=12000){const end=Date.now()+ms;do{if(job.cancelled)throw Error('Export Excel arrêté.');const value=find();if(value)return value;await delay(80);}while(Date.now()<end);const error=Error(message);error.exportPreparationTimeout=true;throw error;}
 function single(nodes,message){const choices=unique(nodes.filter(visible).filter(enabled));if(choices.length!==1)throw Error(message+' ('+choices.length+' cible).');return choices[0];}
 function reportTable(){
  const found=[...document.querySelectorAll('[role="grid"],[role="table"],table,.tableEx')].filter(visible).filter(root=>{
   const headers=[...root.querySelectorAll('[role="columnheader"],thead th,.columnHeader')].map(e=>norm(label(e)));
   return headers.filter(h=>['sku','description','d365itemid','d365itemnumber','qtyavailable','sellprice','nbv'].includes(h)).length>=2;
  });return single(found,'Tableau Used Gear absent ou ambigu');
 }
 const controlSelector='button,[role="button"],[role="menuitem"],[aria-haspopup],.vcMenu,.visualHeaderItem';
 const visualSelector='.visualContainer,visual-container,.visual-container,.visual-container-component,.visualContainerHost,.visualContainerParent,.tableEx';
 const menuLabels=e=>[e.getAttribute('aria-label'),e.getAttribute('title'),e.getAttribute('data-tooltip'),...(e.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean).map(id=>document.getElementById(id)?.textContent),e.innerText].filter(Boolean);
 const menuNamed=e=>menuLabels(e).some(value=>/^(moreoptions|plusdoptions|autresoptions|optionssupplementaires)(?:$|for|pour|du)/.test(norm(value)));
 function menuCandidates(root){
  const found=[...root.querySelectorAll(controlSelector)].filter(menuNamed);
  for(const named of root.querySelectorAll('[aria-label],[title],[data-tooltip],[aria-labelledby]'))if(menuNamed(named)){
   const control=named.closest(controlSelector+', [tabindex]');if(control&&root.contains(control))found.push(control);
  }
  return unique(found);
 }
 function menuScope(table){
  const roots=[];
  for(let node=table;node;node=node.parentElement)if(node.matches(visualSelector))roots.push(node);
  // Power BI can put the header beside the inner visual, in its outer host.
  return roots.find(root=>ownedMenuCandidates(table,root).length)||roots[0]||table;
 }
 function ownedMenuCandidates(table,root){
  return menuCandidates(root).filter(button=>{const owner=button.closest('.visualContainerHost,visual-container');return !owner||owner.contains(table);});
 }
 async function revealMenu(table,container,job){
  const candidates=()=>{container=menuScope(table);return ownedMenuCandidates(table,container);};
  const target=table.querySelector('[role="gridcell"],[role="cell"],td')||table;
  const rect=target.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
  const init={bubbles:true,clientX:x,clientY:y,view:window,relatedTarget:null};
  // DOM events can reveal event-driven headers; they do not move the physical
  // pointer or establish CSS :hover. Keyboard focus also supports :focus-within.
  if(typeof PointerEvent==='function')target.dispatchEvent(new PointerEvent('pointerover',{...init,pointerType:'mouse',pointerId:1}));
  target.dispatchEvent(new MouseEvent('mouseover',init));
  for(let node=target;node&&container.contains(node);node=node.parentElement){
   if(typeof PointerEvent==='function')node.dispatchEvent(new PointerEvent('pointerenter',{...init,bubbles:false,pointerType:'mouse',pointerId:1}));
   node.dispatchEvent(new MouseEvent('mouseenter',{...init,bubbles:false}));
  }
  if(typeof PointerEvent==='function')target.dispatchEvent(new PointerEvent('pointermove',{...init,pointerType:'mouse',pointerId:1}));
  target.dispatchEvent(new MouseEvent('mousemove',init));
  let focused=null;const started=Date.now();
  return wait(()=>{
   if(!table.isConnected||!container.isConnected)throw Error('Le tableau a changé avant l’ouverture du menu.');
   const buttons=candidates(),shown=buttons.filter(visible).filter(enabled);
   if(shown.length>1||buttons.length>1&&shown.length!==1)throw Error('Plusieurs boutons Plus d’options correspondent au tableau ('+buttons.length+'). Aucun export lancé.');
   job.menuState={candidates:buttons.length,visible:shown.length,disabled:buttons.filter(e=>!enabled(e)).length};
   if(shown.length===1)return shown[0];
   // A hover-only CSS header can still expose its unique native button in DOM.
   // Activate that control directly; do not alter styles, disabled state or any
   // report internals. The next stage must confirm the actual export menu.
   if(Date.now()-started>=600&&buttons.length===1&&enabled(buttons[0])){job.menuState.activation='native-button';return buttons[0];}
   if(buttons.length===1&&enabled(buttons[0])&&focused!==buttons[0]){focused=buttons[0];focused.focus({preventScroll:true});}
   return null;
  },job,'EXPORT_MENU : aucun bouton Plus d’options utilisable. Le diagnostic des contrôles est disponible dans Options du catalogue.',4000).catch(error=>{
   if(error.message.startsWith('EXPORT_MENU')){
    const state=job.menuState||{},reason=state.candidates===0?'aucun contrôle reconnu':state.disabled===state.candidates?'contrôle désactivé':'contrôle non utilisable';
    const detail=Error('EXPORT_MENU : '+reason+' ('+(state.candidates??0)+' candidat, '+(state.disabled??0)+' désactivé). Détails dans Options du catalogue → diagnostic.');detail.exportPreparationTimeout=state.candidates===0;throw detail;
   }
   throw error;
  });
 }
 async function openExportDialog(job){
  const menuItems=()=>{
   const matches=unique([...document.querySelectorAll('[role="menuitem"],button,[role="button"]')].filter(visible).filter(e=>/^(exportdata|exporterlesdonnees|exporterdesdonnees|exporterdonnees)$/.test(norm(label(e)))));
   if(matches.length>1)throw Error('Plusieurs commandes Exporter les données.');
   if(matches[0]&&!enabled(matches[0]))throw Error('Exporter les données est désactivé par le rapport.');return matches[0];
  };
  if([...document.querySelectorAll('[role="dialog"]')].some(visible))throw Error('Une fenêtre est déjà ouverte dans Power BI. Ferme-la puis relance l’actualisation.');
  for(let attempt=1;attempt<=2;attempt++){
   job.preparationAttempts=attempt;
   try{
    const table=reportTable(),more=await revealMenu(table,menuScope(table),job);job.menuButton=more;
    // A prior click may have opened the native menu without the first lookup
    // seeing it. Do not toggle an already open menu closed on preparation retry.
    if(!(job.openedMenu&&menuItems())){more.click();job.openedMenu=true;}
    const menu=await wait(menuItems,job,'Le menu Exporter les données ne s’ouvre pas.',2800);menu.click();
    return await wait(()=>{const dialogs=unique([...document.querySelectorAll('[role="dialog"]')].filter(visible));if(dialogs.length>1)throw Error('Plusieurs fenêtres d’export sont ouvertes.');return dialogs[0];},job,'La fenêtre d’export Power BI ne s’ouvre pas.',2800);
   }catch(error){
    if(job.cancelled||job.armed||attempt===2||!error.exportPreparationTimeout)throw error;
    await delay(180);
   }
  }
 }
 function exportOption(dialog,kind){
  const names=kind==='layout'?/^(datawithcurrentlayout|donneesavecdispositionactuelle)/:/^(summarizeddata|summarydata|donneesresumees)/;
  const candidates=[];
  for(const node of dialog.querySelectorAll('label,[role="radio"],input[type="radio"]')){
   let candidate=node;
   for(let depth=0;candidate&&candidate!==dialog&&depth<4;depth++,candidate=candidate.parentElement)if(names.test(norm(label(candidate)))){candidates.push(candidate);break;}
  }
  const found=unique(candidates.filter(visible));if(found.length>1)throw Error('Plusieurs choix d’export '+kind+' ont été détectés.');return found[0];
 }
 const optionEnabled=node=>!!node&&enabled(node)&&!node.closest('[aria-disabled="true"],[disabled]')&&![...node.querySelectorAll('input[type="radio"],[role="radio"]')].some(e=>!enabled(e));
 async function chooseExportOption(dialog,job){
  const layout=exportOption(dialog,'layout');let chosen=layout;
  if(optionEnabled(layout))job.exportMode='layout';
  else{chosen=exportOption(dialog,'summarized');if(!optionEnabled(chosen))throw Error('Aucun export Excel de tableau n’est disponible (disposition actuelle et données résumées désactivées ou absentes).');job.exportMode='summarized';}
  chosen.click();
  await wait(()=>[chosen,...chosen.querySelectorAll('input[type="radio"],[role="radio"]')].some(e=>e.matches('input[type="radio"]')?e.checked:e.getAttribute('aria-checked')==='true'),job,'Power BI n’a pas confirmé le choix d’export Excel. Aucun export lancé.',2000);
 }
 function diagnostic(){return {dialogs:[...document.querySelectorAll('[role="dialog"]')].filter(visible).slice(0,3).map(e=>({buttons:[...e.querySelectorAll('button,[role="button"]')].filter(visible).map(label).slice(0,12),options:[...e.querySelectorAll('label,[role="radio"],[role="combobox"],select')].filter(visible).map(label).slice(0,12)}))};}
 function exportDiagnostic(job){
  const info=e=>({tag:e.tagName,role:e.getAttribute('role')||'',ariaLabel:(e.getAttribute('aria-label')||'').slice(0,120),title:(e.getAttribute('title')||'').slice(0,120),classes:String(e.className||'').slice(0,180),popup:e.getAttribute('aria-haspopup')||'',disabled:!enabled(e),visible:visible(e)});
  let table;try{table=reportTable();}catch{}
  const ancestors=[];for(let node=table;node&&ancestors.length<12;node=node.parentElement){
   ancestors.push({...info(node),controls:[...node.querySelectorAll(controlSelector)].slice(0,24).map(info)});
   if(node.matches?.('body'))break;
  }
  return {version:'native-export-5',preparationAttempts:job?.preparationAttempts,exportMode:job?.exportMode,menu:job?.menuState,tableAncestors:ancestors,headers:[...document.querySelectorAll('.visualHeader,.visual-header,.visualHeaderItemContainer,.visualHeaderItem,.vcMenu')].slice(0,32).map(info),...diagnostic()};
 }
 async function run(){
  if(active)throw Error('Un export Excel est déjà en cours.');
  const job={cancelled:false,armed:false,candidates:[],problem:null,urls:new Set(),controllers:new Set()},original=URL.createObjectURL,originalClick=HTMLAnchorElement.prototype.click,originalDispatch=EventTarget.prototype.dispatchEvent,originalOpen=window.open;active=job;
  const capture=(blob,key)=>{
   if(!job.armed||!(blob instanceof Blob)||blob.size<4||blob.size>25*1024*1024||!/^(?:application\/(?:vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|octet-stream|zip))?$/.test(blob.type||''))return;
   if(key&&job.urls.has(key))return;if(key)job.urls.add(key);
   const candidate={ready:false};job.candidates.push(candidate);
   blob.arrayBuffer().then(buffer=>{
    const bytes=new Uint8Array(buffer);if(bytes[0]!==80||bytes[1]!==75){job.candidates=job.candidates.filter(c=>c!==candidate);return;}
    let encoded='';for(let i=0;i<bytes.length;i+=24576)encoded+=btoa(String.fromCharCode(...bytes.subarray(i,i+24576)));
    candidate.value={base64:encoded,size:bytes.length,name:'Used-Gear.xlsx'};candidate.ready=true;
   }).catch(()=>{job.problem='Le fichier Excel généré ne peut pas être lu.';});
  };
  const captureURL=(value,download=false)=>{
   if(!job.armed||!value)return;
   let url;try{url=new URL(String(value),location.href);}catch{return;}
   // Only the exact native link used by this action; never enumerate downloads
   // or replay guessed report endpoints. Blob URLs may originate in a worker.
   if(url.origin!==location.origin||!['blob:','https:'].includes(url.protocol)||url.protocol!=='blob:'&&!download&&!/\.xlsx(?:$|[?#])/i.test(url.href)||job.urls.has(url.href))return;
   job.urls.add(url.href);const candidate={ready:false};job.candidates.push(candidate);
   const controller=new AbortController();job.controllers.add(controller);
   fetch(url.href,{signal:controller.signal,credentials:'same-origin'}).then(async response=>{
    if(!response.ok)throw Error('download');const size=Number(response.headers.get('content-length'));if(size>25*1024*1024)throw Error('size');
    const reader=response.body.getReader(),chunks=[];let length=0;
    try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>25*1024*1024)throw Error('size');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
    const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    if(bytes.length<4||bytes[0]!==80||bytes[1]!==75)throw Error('xlsx');
    let base64='';for(let i=0;i<bytes.length;i+=24576)base64+=btoa(String.fromCharCode(...bytes.subarray(i,i+24576)));
    candidate.value={base64,size:bytes.length,name:'Used-Gear.xlsx'};candidate.ready=true;
   }).catch(()=>{if(!job.cancelled)job.problem='Le lien d’export a été détecté, mais son fichier Excel ne peut pas être lu automatiquement. Les données précédentes sont conservées.';}).finally(()=>job.controllers.delete(controller));
  };
  const anchor=e=>{if(e instanceof HTMLAnchorElement)captureURL(e.href,e.hasAttribute('download'));};
  const clicked=event=>{const path=event.composedPath?.()||[];anchor(path.find(node=>node instanceof HTMLAnchorElement)||event.target?.closest?.('a[href]'));};
  const wrappedClick=function(){anchor(this);return Reflect.apply(originalClick,this,arguments);};
  const wrappedDispatch=function(event){if(event?.type==='click')anchor(this);return Reflect.apply(originalDispatch,this,arguments);};
  const wrappedOpen=function(url){captureURL(url,true);return Reflect.apply(originalOpen,this,arguments);};
  const wrapped=function(blob){const url=Reflect.apply(original,this,arguments);capture(blob,url);return url;};
  try{
   HTMLAnchorElement.prototype.click=wrappedClick;EventTarget.prototype.dispatchEvent=wrappedDispatch;window.open=wrappedOpen;document.addEventListener('click',clicked,true);
   URL.createObjectURL=wrapped;if(URL.createObjectURL!==wrapped)throw Error('Capture du fichier Excel indisponible dans ce navigateur.');
   const dialog=await openExportDialog(job);await chooseExportOption(dialog,job);
   const selects=[...dialog.querySelectorAll('select')].filter(visible);
   if(selects.length){const selected=selects.filter(e=>[...e.options].some(o=>/\.xlsx/i.test(o.textContent||'')));if(selected.length!==1)throw Error('Le format Excel .xlsx n’est pas disponible.');const option=[...selected[0].options].find(o=>/\.xlsx/i.test(o.textContent||''));if(selected[0].value!==option.value){if(selected[0].disabled)throw Error('Le format XLSX ne peut pas être sélectionné.');selected[0].value=option.value;selected[0].dispatchEvent(new Event('change',{bubbles:true}));}}
   else if(!/\.xlsx\b/i.test(dialog.innerText||dialog.textContent||'')){
    const combo=single([...dialog.querySelectorAll('[role="combobox"]')],'Choix du format Excel absent ou ambigu');combo.click();
    const option=await wait(()=>{const choices=unique([...document.querySelectorAll('[role="option"]')].filter(visible).filter(e=>/\.xlsx\b/i.test(label(e))));if(choices.length>1)throw Error('Plusieurs formats XLSX proposés.');return choices[0];},job,'Le format Excel .xlsx n’est pas disponible.');option.click();
   }
   const confirm=single([...dialog.querySelectorAll('button,[role="button"]')].filter(e=>/^(export|exporter)$/.test(norm(label(e)))),'Bouton Exporter absent ou ambigu');
   job.armed=true;confirm.click();
   const file=await wait(()=>{if(job.problem)throw Error(job.problem);if(job.candidates.length>1)throw Error('Plusieurs fichiers générés pendant l’export. Aucun import automatique.');return job.candidates[0]?.ready?job.candidates[0].value:null;},job,'Power BI n’a pas fourni de fichier XLSX capturable. Le téléchargement peut être repris avec Importer Excel.',60000);
   await delay(160);if(job.candidates.length!==1)throw Error('Plusieurs fichiers Excel détectés. Aucun import automatique.');return {...file,exportMode:job.exportMode,preparationAttempts:job.preparationAttempts};
  }catch(error){return {error:String(error.message||error),diagnostic:exportDiagnostic(job)};}
  finally{
   job.armed=false;for(const controller of job.controllers)controller.abort();document.removeEventListener('click',clicked,true);
   if(URL.createObjectURL===wrapped)URL.createObjectURL=original;
   if(HTMLAnchorElement.prototype.click===wrappedClick)HTMLAnchorElement.prototype.click=originalClick;
   if(EventTarget.prototype.dispatchEvent===wrappedDispatch)EventTarget.prototype.dispatchEvent=originalDispatch;
   if(window.open===wrappedOpen)window.open=originalOpen;active=null;
  }
 }
 function cancel(){if(active)active.cancelled=true;return {cancelled:true};}
 globalThis.ToolboxUsedExportUI={run,cancel,diagnostic};
})();
