// Runs in the head before CSS: popup sizing must not depend on its initial viewport.
(()=>{
 const root=document.documentElement;
 if(root.dataset.toolboxView==='panel')return;
 root.dataset.toolboxView=new URLSearchParams(location.search).has('toolboxWindow')?'window':'popup';
})();
