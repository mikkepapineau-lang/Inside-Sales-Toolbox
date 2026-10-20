(()=>{
 const button=document.getElementById('open-sidepanel');
 if(location.pathname.endsWith('/sidepanel.html')){button.hidden=true;return;}
 button.addEventListener('click',async()=>{
  try{
   if(!chrome.sidePanel?.open)throw Error('Le panneau latéral nécessite une version récente d’Edge.');
   const window=await chrome.windows.getCurrent();
   await chrome.sidePanel.open({windowId:window.id});
   if(!new URLSearchParams(location.search).has('toolboxWindow'))globalThis.close();
  }catch(e){button.textContent=e.message;}
 });
})();
