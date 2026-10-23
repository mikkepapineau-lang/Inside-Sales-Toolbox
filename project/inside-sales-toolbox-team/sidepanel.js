(()=>{
 const button=document.getElementById('open-sidepanel');
 if(location.pathname.endsWith('/sidepanel.html')){button.hidden=true;return;}
 button.addEventListener('click',async()=>{
  try{
   if(!chrome.sidePanel?.open)throw Error('Le panneau latéral nécessite une version récente d’Edge.');
   const windowId=globalThis.ToolboxInstances?.windowId;
   if(!Number.isInteger(windowId))throw Error('Ouvre le Toolbox depuis la fenêtre à utiliser.');
   await chrome.sidePanel.open({windowId});
   if(!new URLSearchParams(location.search).has('toolboxWindow'))globalThis.close();
  }catch(e){button.textContent=e.message;}
 });
})();
