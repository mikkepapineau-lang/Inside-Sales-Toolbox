(()=>{
 const el=id=>document.getElementById(id),M=ToolboxOrderModel,S=ToolboxReadyScope;let data=null,status={},filters=M.state(),scope=S.state(),touched=false,timer,scopeTimer;const noteStates=new Map();
 const {node,row:recordRow,fieldList,diagnostics,time}=ToolboxList;
 function options(id,values,placeholder,special=[]){
  const select=el(id),chosen=filters[id==='powerbi-delivery'?'delivery':'payment'];select.replaceChildren();
  for(const [value,label]of [['',placeholder],...special,...values.map(v=>[v,v])]){const o=node('option',value&&!value.startsWith('@')?'source-value':'',label);o.value=value;select.append(o);}
  if(chosen&&!special.some(([v])=>v===chosen)&&!values.includes(chosen)){const o=node('option','source-value',chosen);o.value=chosen;select.append(o);}select.value=chosen;
 }
 function controls(){el('powerbi-query').value=filters.query;el('powerbi-sort').value=filters.sort;}
 async function readNotes(order){
  if(noteStates.get(order)?.loading)return;
  noteStates.set(order,{loading:true});render();
  try{const response=await chrome.runtime.sendMessage({kind:'powerBIOrderNotes',order});if(response?.error)throw Error(response.error);noteStates.delete(order);}
  catch(e){noteStates.set(order,{error:e.message});}render();
 }
 function addNotes(record,r,selected){
  const info=selected.notes(r),order=selected.value(r,'order'),state=noteStates.get(order);
  if(info.value.trim())record.querySelector('.record-heading').append(node('span','record-order-notes source-value',info.value));
  const notesColumn=M.columns(data.headers).notes,headers=data.headers.filter((_,i)=>i!==notesColumn),values=r.values.filter((_,i)=>i!==notesColumn);
  const fields=fieldList(headers,values),pair=node('div','order-notes-field');
  pair.append(node('dt','','Internal Notes'),node('dd',info.available?'source-value':'order-notes-empty',info.available?(info.value||'Internal Notes vides.'):'Internal Notes non récupérées.'));
  // Empty is a confirmed result, while unavailable must remain explicit.
  if(info.available&&!info.value)pair.children[1].className='order-notes-empty';
  fields.append(pair);record.append(fields);
  const footer=node('div','order-notes-footer');
  if(info.available){const source=node('span','order-notes-source',info.source==='D365'?'Lu dans D365':'Source : Power BI');if(info.at)source.append(node('time','source-value',' · '+time(info.at)));footer.append(source);}
  if(info.source!=='Power BI'){
   const button=node('button','text-button order-notes-button',state?.loading?'Lecture des Internal Notes…':'Lire les Internal Notes dans D365');button.type='button';button.disabled=!!state?.loading||status.state==='loading';button.setAttribute('aria-busy',String(!!state?.loading));button.onclick=()=>readNotes(order);footer.append(button);
  }
  if(state?.error){const message=node('p','order-notes-error',state.error);message.setAttribute('role','status');footer.append(message);}
  if(footer.children.length)record.append(footer);
 }
 function render(){
  const root=el('powerbi-results');root.replaceChildren();el('powerbi-refresh').disabled=status.state==='loading';
  el('powerbi-status').textContent=status.state==='loading'?(status.message||'Lecture du rapport Power BI…'):status.message||(data?'Lecture terminée.':'Clique sur Actualiser. Ready to PIK sera sélectionné automatiquement dans le rapport.');
  el('powerbi-status').dataset.state=status.state||'idle';el('powerbi-status').hidden=!!data&&status.state!=='loading'&&status.state!=='error'&&!status.message;
  el('powerbi-salesperson-field').hidden=scope.mode==='report';el('powerbi-scope-mode').disabled=status.state==='loading';el('powerbi-salesperson').disabled=status.state==='loading';
  el('powerbi-scope-caption').textContent=scope.mode==='report'?'Périmètre : filtres actuels du rapport.':scope.salesperson?'Sales Rep Name : '+scope.salesperson:'Choisis Sales Rep Name avant d’actualiser.';
  const names=data?M.columns(data.headers).salesperson:-1,choices=names>=0?[...new Set(data.rows.map(r=>r.values[names]).filter(Boolean))]:[];el('powerbi-salespeople').replaceChildren(...choices.map(value=>{const option=node('option','source-value',value);option.value=value;return option;}));
  const confirmed=data&&S.same(data.readyScope,scope),selected=confirmed?M.select(data,filters):null;
  el('powerbi-scope-caption').hidden=!!confirmed;
  const activeFilters=[filters.delivery,filters.payment].filter(Boolean).length;
  el('powerbi-filter-count').textContent=activeFilters?'· '+activeFilters+' actif(s)':'';
  options('powerbi-delivery',selected?.deliveryChoices.filter(v=>!M.pickup(v))||[],'Tous les modes',[['@pickup','Ramassage · PICK UP'],['@other','Autres modes']]);
  options('powerbi-payment',selected?.paymentChoices||[],'Tous les paiements');
  if(!confirmed){el('powerbi-count').textContent='';el('powerbi-freshness').textContent='';if(data)root.append(node('p','muted','Actualise pour récupérer les commandes du périmètre choisi.'));return;}
  el('powerbi-freshness').textContent=time(data.at);el('powerbi-count').textContent=selected.rows.length+' / '+data.rows.length;
  let previousGroup;
  for(const r of selected.rows){
   const val=k=>selected.value(r,k),group=selected.group(r);
   if(group!==null&&group!==previousGroup){root.append(node('h3','order-group-heading source-value',globalThis.ToolboxI18n?.t(group)||group));previousGroup=group;}
   // The scope is already visible above the list. Each source field stays in the disclosure.
   const meta=[];for(const [key,label]of [['delivery',''],['payment',''],['qty','Réservé']])if(val(key))meta.push({label,value:val(key)});
   const record=recordRow({key:'order:'+val('order'),code:val('customer')||val('order'),name:val('customer')?val('order'):'',amount:val('amount'),href:r.href,host:'solotech.operations.dynamics.com',meta});
   addNotes(record,r,selected);root.append(record);
  }
  if(!selected.rows.length)root.append(node('p','muted','Aucune commande ne correspond aux filtres locaux.'));
 }
 function change(debounce=false){
  touched=true;filters=M.state({query:el('powerbi-query').value,delivery:el('powerbi-delivery').value,payment:el('powerbi-payment').value,sort:el('powerbi-sort').value});render();globalThis.ToolboxMotion?.results(el('powerbi-results'));
  clearTimeout(timer);const snapshot={...filters},save=()=>chrome.storage.local.set({toolboxOrderFilters:snapshot}).catch(()=>{});if(debounce)timer=setTimeout(save,150);else save();
 }
 async function action(kind){try{if(kind==='powerBIRead'){clearTimeout(scopeTimer);scope=S.requireSelection(scope);await chrome.storage.local.set({toolboxReadyScope:scope});}const r=await chrome.runtime.sendMessage({kind});if(r?.error)throw Error(r.error);if(kind==='powerBIDiagnostic')diagnostics('powerbi-diagnostic-output',r.value);if(kind==='powerBIBind')el('powerbi-status').textContent='Onglet associé. Clique sur Actualiser.';}catch(e){el('powerbi-status').textContent=e.message;}}
 function scopeChange(){scope=S.state({mode:el('powerbi-scope-mode').value,salesperson:el('powerbi-salesperson').value});render();clearTimeout(scopeTimer);const value={...scope};scopeTimer=setTimeout(()=>chrome.storage.local.set({toolboxReadyScope:value}).catch(()=>{}),150);}
 document.addEventListener('toolbox-before-session-change',event=>{clearTimeout(timer);clearTimeout(scopeTimer);event.detail.push(chrome.storage.local.set({toolboxOrderFilters:filters,toolboxReadyScope:scope}));});
 el('powerbi-scope-mode').onchange=scopeChange;el('powerbi-salesperson').oninput=scopeChange;
 el('powerbi-refresh').onclick=()=>action('powerBIRead');el('powerbi-open').onclick=()=>action('powerBIOpen');el('powerbi-diagnostic').onclick=()=>action('powerBIDiagnostic');el('powerbi-bind').onclick=()=>action('powerBIBind');
 el('powerbi-query').oninput=()=>change(true);for(const id of ['powerbi-delivery','powerbi-payment','powerbi-sort'])el(id).onchange=()=>change();
 el('powerbi-clear').onclick=async()=>{await chrome.storage.local.remove('toolboxPowerBI');data=null;el('powerbi-freshness').textContent='';render();};
 chrome.storage.onChanged.addListener((changes,area)=>{
  if(area!=='local')return;let changed=false;
  if(changes.toolboxPowerBI){data=changes.toolboxPowerBI.newValue;changed=true;}if(changes.toolboxPowerBIStatus){status=changes.toolboxPowerBIStatus.newValue||{};changed=true;}
  if(changes.toolboxReadyScope){scope=S.state(changes.toolboxReadyScope.newValue);el('powerbi-scope-mode').value=scope.mode;el('powerbi-salesperson').value=scope.salesperson;changed=true;}
  if(changes.toolboxOrderFilters){const next=M.state(changes.toolboxOrderFilters.newValue);if(JSON.stringify(next)!==JSON.stringify(filters)){touched=true;clearTimeout(timer);filters=next;controls();changed=true;}}
  if(changes.toolboxPowerBIDiagnostic)diagnostics('powerbi-diagnostic-output',changes.toolboxPowerBIDiagnostic.newValue);if(changes.toolboxLanguage)changed=true;if(changed)render();
 });
 chrome.storage.local.get(['toolboxPowerBI','toolboxPowerBIStatus','toolboxOrderFilters','toolboxReadyScope']).then(saved=>{data=saved.toolboxPowerBI;status=saved.toolboxPowerBIStatus||{};scope=S.state(saved.toolboxReadyScope);el('powerbi-scope-mode').value=scope.mode;el('powerbi-salesperson').value=scope.salesperson;if(!touched){filters=M.state(saved.toolboxOrderFilters);controls();}render();});
})();
