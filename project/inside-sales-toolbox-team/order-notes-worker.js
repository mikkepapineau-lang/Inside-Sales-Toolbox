// Enrich report rows from already-open, authorized D365 order forms only.
async function collectPowerBIOrderNotes(data,requestedOrder=''){
 const M=ToolboxOrderModel,cols=M.columns(data.headers),wanted=new Set(data.rows.filter(r=>requestedOrder?String(r.values[cols.order])===requestedOrder:!M.notes(data,r).available).map(r=>String(r.values[cols.order]).toUpperCase()));
 if(!wanted.size)return {data,matched:0};
 const fail=message=>{if(requestedOrder)throw Error(message);return {data,matched:0};};
 if(!await chrome.permissions.contains({origins:['https://solotech.operations.dynamics.com/*']}))return fail('Autorise l’accès à D365 pour lire les Internal Notes.');
 const tabs=(await chrome.tabs.query({url:'https://solotech.operations.dynamics.com/*'})).filter(t=>{try{const u=new URL(t.url);return u.origin==='https://solotech.operations.dynamics.com'&&u.searchParams.get('cmp')?.toUpperCase()==='CAOP'&&t.status==='complete'&&!t.discarded&&!t.frozen;}catch{return false;}});
 const found=new Map();
 // Each tab is independent; read each in place, without navigation or new tabs.
 const results=await Promise.allSettled(tabs.map(async tab=>{
  await chrome.scripting.executeScript({target:{tabId:tab.id},files:['d365-controls.js','order-notes-reader.js']});
  const [response]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:orders=>globalThis.ToolboxOrderNotesReader.read(orders),args:[[...wanted]]});
  return response?.result;
 }));
 for(const result of results){
  if(result.status!=='fulfilled')continue;
  const value=result.value;if(value?.error||!wanted.has(value?.order)||typeof value.value!=='string'||!Number.isFinite(value.at))continue;
  const matches=found.get(value.order)||[];matches.push(value);found.set(value.order,matches);
 }
 const updates=new Map();
 for(const [order,matches]of found)if(new Set(matches.map(n=>n.value)).size===1)updates.set(order,matches[0]);
 if(requestedOrder&&!updates.has(requestedOrder.toUpperCase()))return fail(found.has(requestedOrder.toUpperCase())?'Plusieurs onglets donnent des Internal Notes différentes pour cette SO. Ferme les anciennes fiches puis réessaie.':'Ouvre la commande '+requestedOrder+' dans D365 avec ses Internal Notes visibles, puis réessaie.');
 return {matched:updates.size,data:{...data,rows:data.rows.map(row=>{const note=updates.get(String(row.values[cols.order]).toUpperCase());return note?{...row,internalNotes:{...note,order:String(row.values[cols.order])}}:row;})}};
}
async function readPowerBIOrderNotes(order){
 if(typeof order!=='string'||!/^SO-[A-Z0-9]+(?:-[A-Z0-9]+)*$/i.test(order))throw Error('Numéro de SO invalide.');
 if(powerBIBusy)throw Error('Une lecture des commandes est déjà en cours.');powerBIBusy=true;
 try{
  const data=(await chrome.storage.local.get('toolboxPowerBI')).toolboxPowerBI;
  if(!data?.rows?.some(r=>String(r.values[ToolboxOrderModel.columns(data.headers).order])===order))throw Error('Cette SO n’est plus dans le relevé courant. Actualise la liste.');
  const result=await collectPowerBIOrderNotes(data,order);
  const current=(await chrome.storage.local.get('toolboxPowerBI')).toolboxPowerBI;
  if(JSON.stringify(current)!==JSON.stringify(data))throw Error('Le relevé a changé. Relance la lecture des Internal Notes.');
  await chrome.storage.local.set({toolboxPowerBI:result.data});return {order,matched:result.matched};
 }finally{powerBIBusy=false;}
}
