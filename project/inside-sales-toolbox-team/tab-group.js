// One work group per browser window; grouping never aborts a CRM operation.
(()=>{
 const title='Solotech Toolbox';let queue=Promise.resolve();
 async function groupFor(windowId){
  const saved=(await chrome.storage.session.get('toolboxTabGroups')).toolboxTabGroups||{};
  let group;
  if(Number.isInteger(saved[windowId]))try{const g=await chrome.tabGroups.get(saved[windowId]);if(g.windowId===windowId)group=g;}catch{}
  if(!group)group=(await chrome.tabGroups.query({windowId,title}))[0];
  return {group,saved};
 }
 async function addNow(tab){
  if(!chrome.tabs.group||!chrome.tabGroups||tab.pinned)return;
  const current=await chrome.tabs.get(tab.id),{group,saved}=await groupFor(current.windowId);
  const groupId=await chrome.tabs.group({tabIds:[current.id],...(group?{groupId:group.id}:{createProperties:{windowId:current.windowId}})});
  saved[current.windowId]=groupId;
  await chrome.storage.session.set({toolboxTabGroups:saved});
  const active=(await chrome.tabs.query({groupId,active:true})).length>0;
  await chrome.tabGroups.update(groupId,{title,color:'purple',collapsed:!active});
  await chrome.storage.local.remove('toolboxTabGroupWarning');
 }
 async function add(tab){
  const job=queue.then(()=>addNow(tab));queue=job.catch(()=>{});
  try{await job;}catch(e){await chrome.storage.local.set({toolboxTabGroupWarning:String(e.message||e)}).catch(()=>{});}
  return tab;
 }
 chrome.tabs.onActivated.addListener(info=>{
  const job=queue.then(async()=>{
   if(!chrome.tabGroups)return;
   const {group}=await groupFor(info.windowId);if(!group)return;
   const tab=await chrome.tabs.get(info.tabId);
   await chrome.tabGroups.update(group.id,{collapsed:tab.groupId!==group.id});
  });queue=job.catch(()=>{});
 });
 async function prepareNow(tabs,windowId){
  if(!chrome.tabs.group||!chrome.tabGroups)throw Error('Le regroupement des onglets n’est pas disponible dans ce navigateur.');
  const [initialActive]=await chrome.tabs.query({windowId,active:true});
  const ids=[];
  for(const tab of tabs){let current=await chrome.tabs.get(tab.id);if(current.pinned)throw Error('Un onglet de travail est épinglé. Réessaie pour préparer un onglet non épinglé.');if(current.windowId!==windowId)current=await chrome.tabs.move(current.id,{windowId,index:-1});ids.push(current.id);}
  const {group,saved}=await groupFor(windowId),groupId=await chrome.tabs.group({tabIds:ids,...(group?{groupId:group.id}:{createProperties:{windowId}})});
  saved[windowId]=groupId;await chrome.storage.session.set({toolboxTabGroups:saved});
  const open=await chrome.tabs.query({windowId}),active=open.find(t=>t.active);
  if(active?.groupId===groupId){
   const outside=open.find(t=>t.id===initialActive?.id&&t.groupId!==groupId)||open.find(t=>t.groupId!==groupId);
   if(outside)await chrome.tabs.update(outside.id,{active:true});
   else await chrome.tabs.create({windowId,url:chrome.runtime.getURL('popup.html')+'?toolboxWindow=1',active:true});
  }
  const updated=await chrome.tabGroups.update(groupId,{title,color:'purple',collapsed:true});if(!updated.collapsed)throw Error('Le groupe n’a pas pu être réduit. Réessaie.');await chrome.storage.local.remove('toolboxTabGroupWarning');
  return {groupId};
 }
 function prepare(tabs,windowId){const job=queue.then(()=>prepareNow(tabs,windowId));queue=job.catch(()=>{});return job;}
 globalThis.ToolboxTabGroup={add,prepare};
})();
