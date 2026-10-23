(()=>{
 const button=document.getElementById('open-sidepanel');
 if(location.pathname.endsWith('/sidepanel.html')){button.hidden=true;return;}
 button.addEventListener('click',async()=>{
  try{
   if(!chrome.sidePanel?.open)throw Error('Le panneau latéral nécessite une version récente d’Edge.');
   let tabId=globalThis.ToolboxInstances?.sourceTabId;
   if(!Number.isInteger(tabId)){const tabs=await chrome.tabs.query({active:true,currentWindow:true});tabId=tabs[0]?.id;}
   if(!Number.isInteger(tabId))throw Error('Ouvre le Toolbox depuis l’onglet à utiliser.');
   const id=globalThis.ToolboxInstances?.current||'tab-'+tabId;
   await chrome.sidePanel.setOptions({tabId,path:'sidepanel.html?instance='+id,enabled:true});
   await chrome.sidePanel.open({tabId});
   if(!new URLSearchParams(location.search).has('toolboxWindow'))globalThis.close();
  }catch(e){button.textContent=e.message;}
 });
})();
