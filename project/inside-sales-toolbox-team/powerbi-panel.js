(()=>{
 const el=id=>document.getElementById(id),M=ToolboxOrderModel;let data=null,status={},filters=M.state(),touched=false,timer;
 const {node,row:recordRow,fieldList,diagnostics,time}=ToolboxList;
 function options(id,values,placeholder,special=[]){
  const select=el(id),chosen=filters[id==='powerbi-delivery'?'delivery':'payment'];select.replaceChildren();
  for(const [value,label]of [['',placeholder],...special,...values.map(v=>[v,v])]){const o=node('option',value&&!value.startsWith('@')?'source-value':'',label);o.value=value;select.append(o);}
  if(chosen&&!special.some(([v])=>v===chosen)&&!values.includes(chosen)){const o=node('option','source-value',chosen);o.value=chosen;select.append(o);}select.value=chosen;
 }
 function controls(){el('powerbi-query').value=filters.query;el('powerbi-sort').value=filters.sort;}
 function render(){
  const root=el('powerbi-results');root.replaceChildren();el('powerbi-refresh').disabled=status.state==='loading';
  el('powerbi-status').textContent=status.state==='loading'?'Lecture du rapport Power BI…':status.state==='error'?status.message:data?'Lecture terminée.':'Clique sur Actualiser. Ready to PIK sera sélectionné automatiquement dans le rapport.';
  el('powerbi-status').dataset.state=status.state||'idle';el('powerbi-status').hidden=!!data&&status.state!=='loading'&&status.state!=='error';
  const selected=data?M.select(data,filters):null;
  options('powerbi-delivery',selected?.deliveryChoices.filter(v=>!M.pickup(v))||[],'Tous les modes',[['@pickup','Ramassage · PICK UP'],['@other','Autres modes']]);
  options('powerbi-payment',selected?.paymentChoices||[],'Tous les paiements');
  if(!data){el('powerbi-count').textContent='';return;}
  el('powerbi-freshness').textContent=time(data.at);el('powerbi-count').textContent=selected.rows.length+' / '+data.rows.length;
  let previousGroup;
  for(const r of selected.rows){
   const val=k=>selected.value(r,k),group=selected.group(r);
   if(group!==null&&group!==previousGroup){root.append(node('h3','order-group-heading source-value',globalThis.ToolboxI18n?.t(group)||group));previousGroup=group;}
   const meta=[];for(const [key,label]of [['delivery',''],['payment',''],['qty','Réservé']])if(val(key))meta.push({label,value:val(key)});
   const record=recordRow({key:'order:'+val('order'),code:val('customer')||val('order'),name:val('customer')?val('order'):'',amount:val('amount'),href:r.href,host:'solotech.operations.dynamics.com',meta});
   record.append(fieldList(data.headers,r.values));root.append(record);
  }
  if(!selected.rows.length)root.append(node('p','muted','Aucune commande ne correspond aux filtres locaux.'));
 }
 function change(debounce=false){
  touched=true;filters=M.state({query:el('powerbi-query').value,delivery:el('powerbi-delivery').value,payment:el('powerbi-payment').value,sort:el('powerbi-sort').value});render();globalThis.ToolboxMotion?.results(el('powerbi-results'));
  clearTimeout(timer);const snapshot={...filters},save=()=>chrome.storage.local.set({toolboxOrderFilters:snapshot}).catch(()=>{});if(debounce)timer=setTimeout(save,150);else save();
 }
 async function action(kind){try{const r=await chrome.runtime.sendMessage({kind});if(r?.error)throw Error(r.error);if(kind==='powerBIDiagnostic')diagnostics('powerbi-diagnostic-output',r.value);if(kind==='powerBIBind')el('powerbi-status').textContent='Onglet associé. Clique sur Actualiser.';}catch(e){el('powerbi-status').textContent=e.message;}}
 el('powerbi-refresh').onclick=()=>action('powerBIRead');el('powerbi-open').onclick=()=>action('powerBIOpen');el('powerbi-diagnostic').onclick=()=>action('powerBIDiagnostic');el('powerbi-bind').onclick=()=>action('powerBIBind');
 el('powerbi-query').oninput=()=>change(true);for(const id of ['powerbi-delivery','powerbi-payment','powerbi-sort'])el(id).onchange=()=>change();
 el('powerbi-clear').onclick=async()=>{await chrome.storage.local.remove('toolboxPowerBI');data=null;el('powerbi-freshness').textContent='';render();};
 chrome.storage.onChanged.addListener((changes,area)=>{
  if(area!=='local')return;let changed=false;
  if(changes.toolboxPowerBI){data=changes.toolboxPowerBI.newValue;changed=true;}if(changes.toolboxPowerBIStatus){status=changes.toolboxPowerBIStatus.newValue||{};changed=true;}
  if(changes.toolboxOrderFilters){const next=M.state(changes.toolboxOrderFilters.newValue);if(JSON.stringify(next)!==JSON.stringify(filters)){touched=true;clearTimeout(timer);filters=next;controls();changed=true;}}
  if(changes.toolboxPowerBIDiagnostic)diagnostics('powerbi-diagnostic-output',changes.toolboxPowerBIDiagnostic.newValue);if(changes.toolboxLanguage)changed=true;if(changed)render();
 });
 chrome.storage.local.get(['toolboxPowerBI','toolboxPowerBIStatus','toolboxOrderFilters']).then(saved=>{data=saved.toolboxPowerBI;status=saved.toolboxPowerBIStatus||{};if(!touched){filters=M.state(saved.toolboxOrderFilters);controls();}render();});
})();
