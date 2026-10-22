// Only visible report controls and headers are used; no Power BI private APIs.
(()=>{
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const label=e=>e.getAttribute('aria-label')||e.innerText||e.textContent||'';
 const visible=e=>e.getClientRects().length&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden';
 function tables(){const all=[...document.querySelectorAll('[role="grid"],[role="table"],table,.tableEx')].filter(visible).filter(e=>{const h=[...e.querySelectorAll('[role="columnheader"],thead th,.columnHeader')].map(n=>norm(label(n)));return h.includes('itemid')&&h.includes('qtynotreserved')&&h.some(k=>['avgunitcost','productname'].includes(k));});return all.filter(e=>!all.some(other=>e!==other&&e.contains(other)));}
 function probe(){
  const found=tables();if(found.length!==1)return {ready:false,error:found.length?'Plusieurs tableaux Non-Reserved correspondent.':'Tableau Non-Reserved non détecté.'};
  const controls=[...document.querySelectorAll('select,input:not([type="radio"]):not([type="checkbox"]),[role="combobox"],.slicerContainer,.slicerText')].filter(visible).filter(e=>!e.closest('[role="dialog"],[role="menu"]')&&!found[0].contains(e)).map(e=>({label:(e.getAttribute('aria-label')||e.getAttribute('title')||'').slice(0,200),value:String(e.value??e.getAttribute('aria-valuetext')??e.innerText??e.textContent??'').slice(0,5000)}));
  const currencyValues=[...document.querySelectorAll('.slicerContainer,.slicerVisualContainer,select,[role="combobox"]')].filter(visible).filter(e=>/currency|devise/i.test(label(e)+' '+(e.closest('.visualContainer,visual-container')?.innerText||''))).flatMap(e=>(String(e.value||e.getAttribute('aria-valuetext')||e.innerText||e.textContent||'').match(/\b(?:CAD|USD|EUR|GBP)\b/g)||[]));
  const currencies=[...new Set(currencyValues)],headers=[...found[0].querySelectorAll('[role="columnheader"],thead th,.columnHeader')].map(e=>label(e));
  return {ready:true,currency:currencies.length===1?currencies[0]:'',context:JSON.stringify({url:location.href,headers,controls})};
 }
 async function prepare(){
  // The worker confirms the exact report page before probing its documents.
  const end=Date.now()+10000;do{const value=probe();if(value.ready)return value;await new Promise(r=>setTimeout(r,150));}while(Date.now()<end);return probe();
 }
 globalThis.ToolboxNonReservedReader={prepare,probe};
})();
