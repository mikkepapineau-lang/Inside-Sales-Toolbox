// Resolve the host tab before any module reads or writes its session state.
(async()=>{
 const script=document.currentScript,files=script.dataset.toolboxScripts.split(','),I=ToolboxInstances,query=new URLSearchParams(location.search);let id=query.get('instance'),source;
 try{
  if(!I.valid(id)){const tabs=await chrome.tabs.query({active:true,currentWindow:true});source=tabs.find(tab=>!tab.url?.startsWith(chrome.runtime.getURL('')));id=source?'tab-'+source.id:'view-'+crypto.randomUUID();}
  else if(/^tab-\d+$/.test(id))source={id:Number(id.slice(4))};
  I.current=id;I.sourceTabId=source?.id;globalThis.chrome=I.api(id);
  const response=await chrome.runtime.sendMessage({kind:'instanceRegister',sourceTabId:source?.id});if(response?.error)throw Error(response.error);if(!response?.value?.sourceOwned)I.sourceTabId=undefined;
  for(const file of files)await new Promise((resolve,reject)=>{const node=document.createElement('script');node.src=chrome.runtime.getURL(file);node.onload=resolve;node.onerror=reject;document.body.append(node);});
 }catch(e){console.error(e);const p=document.createElement('p');p.setAttribute('role','alert');p.textContent='Le Toolbox n’a pas pu démarrer. '+(e.message||'Recharge l’extension.');document.body.append(p);}
})();
