// Resolve the owning browser window before any module reads session state.
(async()=>{
 const script=document.currentScript,files=script.dataset.toolboxScripts.split(','),I=ToolboxInstances,query=new URLSearchParams(location.search);let id,source;
 try{
  const windowId=Number(query.get('hostWindow'))||(await chrome.windows.getCurrent()).id;
  const tabs=await chrome.tabs.query({active:true,windowId});source=tabs.find(tab=>!tab.url?.startsWith(chrome.runtime.getURL('')));
  const response=await I.base.runtime.sendMessage({kind:'windowSession',action:'resolve',windowId,sourceTabId:source?.id});if(response?.error||!I.valid(response?.value?.id))throw Error(response?.error||'Session de fenêtre indisponible.');id=response.value.id;
  I.current=id;I.windowId=windowId;globalThis.chrome=I.api(id,windowId);
  I.base.storage.onChanged.addListener((changes,area)=>{const value=changes.toolboxWindowSessions?.newValue;if(area!=='session'||!value)return;const next=value.windows?.[windowId]?.id||Object.keys(value.work||{}).find(key=>value.work[key]===windowId);if(next&&next!==id)location.reload();});
  for(const file of files)await new Promise((resolve,reject)=>{const node=document.createElement('script');node.src=chrome.runtime.getURL(file);node.onload=resolve;node.onerror=reject;document.body.append(node);});
 }catch(e){console.error(e);const p=document.createElement('p');p.setAttribute('role','alert');p.textContent='Le Toolbox n’a pas pu démarrer. '+(e.message||'Recharge l’extension.');document.body.append(p);}
})();
