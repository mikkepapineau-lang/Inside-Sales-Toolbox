// DOM-only extraction. No tokens, cookies, private API or report internals.
(()=>{
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const text=e=>String(e?.innerText||e?.textContent||e?.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim();
 const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none';
 function tables(){
  const nodes=[...document.querySelectorAll('[role="grid"],[role="table"],table,.tableEx')].filter(visible);
  return nodes.map(root=>{
   let headings=[...root.querySelectorAll('[role="columnheader"],thead th,.columnHeader')];
   headings=headings.filter(e=>!headings.some(other=>other!==e&&e.contains(other)));
   const headers=headings.map(text),keys=headers.map(norm);
   const order=keys.findIndex(v=>/^(salesordernumber|sonumber|numerodecommande|numerocommande)$/.test(v));
   const customer=keys.findIndex(v=>/^(accountname|customername|nomducompte|nomduclient|customer|client)$/.test(v));
   return {root,headers,order,customer};
  }).filter(t=>t.order>=0&&t.customer>=0).filter((t,_,all)=>!all.some(o=>o!==t&&t.root.contains(o.root)));
 }
 function rows(t){
  const records=[];
  for(const row of t.root.querySelectorAll('[role="row"],tr,.row')){
   if(!visible(row))continue;
   let cells=[...row.querySelectorAll('[role="gridcell"],[role="cell"],td,.cell')];
   cells=cells.filter(e=>!cells.some(other=>other!==e&&e.contains(other)));
   if(!cells.length)continue;
   const values=Array(t.headers.length).fill('');
   const indexed=cells.every(e=>Number(e.getAttribute('aria-colindex'))>0);
   if(!indexed&&cells.length!==t.headers.length)continue;
   cells.forEach((cell,i)=>{const j=indexed?Number(cell.getAttribute('aria-colindex'))-1:i;if(j<values.length)values[j]=text(cell);});
   if(!/^SO-[A-Z0-9-]+$/i.test(values[t.order]))continue;
   const link=[...row.querySelectorAll('a[href]')].find(a=>text(a)===values[t.order]);
   let href='';try{const u=new URL(link?.getAttribute('href')||'',location.href);if(link&&u.protocol==='https:'&&u.hostname==='solotech.operations.dynamics.com')href=u.href;}catch{}
   records.push({values,href});
  }
  return records;
 }
 function diagnostic(){return {tables:tables().map(t=>({headers:t.headers,rowCount:rows(t).length})),gridCount:document.querySelectorAll('[role="grid"],[role="table"],table,.tableEx').length,frame:location.origin,readyLabel:/Order Completely Ready to PIK|SO Completely Ready To PIK/i.test(document.body?.innerText||''),busy:!!document.querySelector('[aria-busy="true"]')};}
 async function ensureReady(){
  if(diagnostic().readyLabel)return;
  const name=e=>[text(e),e.getAttribute('aria-label'),e.getAttribute('title')].filter(Boolean).some(s=>/^ready\s+to\s+pik$/i.test(String(s).trim()));
  const candidates=[...document.querySelectorAll('[role="tab"],[role="treeitem"],button,a,[role="button"],.navigationItem')].filter(e=>visible(e)&&name(e)&&!e.disabled&&e.getAttribute('aria-disabled')!=='true');
  const unique=candidates.filter(e=>!candidates.some(other=>other!==e&&e.contains(other)));
  if(unique.length!==1)throw Error('La page Ready to PIK ne peut pas être sélectionnée automatiquement ('+unique.length+' cible). Ouvre le panneau des pages du rapport ou utilise Diagnostic Power BI.');
  unique[0].click();
  const deadline=Date.now()+12000;
  while(Date.now()<deadline){if(diagnostic().readyLabel&&!diagnostic().busy){await new Promise(r=>setTimeout(r,500));return;}await new Promise(r=>setTimeout(r,250));}
  throw Error('Ready to PIK a été sélectionné, mais son chargement n’est pas confirmé. Réessaie après le chargement.');
 }
 async function read(){
  const candidates=tables();if(candidates.length!==1)return {error:candidates.length?'Plusieurs tableaux de commandes détectés. Affiche uniquement Ready to PIK.':'Tableau de commandes non accessible. Ouvre Ready to PIK; au besoin, sélectionne le tableau et utilise Alt + Maj + F11.',diagnostic:diagnostic()};
  const t=candidates[0];if(!diagnostic().readyLabel)return {error:'La page Ready to PIK n’est pas confirmée. Ouvre cette page du rapport.',diagnostic:diagnostic()};
  if(diagnostic().busy)return {error:'Power BI charge encore le rapport. Réessaie après le chargement.',diagnostic:diagnostic()};
  const scope=()=>JSON.stringify([...document.querySelectorAll('[role="combobox"]')].filter(visible).map(text));
  const initialScope=scope();
  const scrollers=[t.root,...t.root.querySelectorAll('*')].filter(e=>e.clientHeight>40&&e.scrollHeight>e.clientHeight+5);
  const saved=scrollers.map(e=>[e,e.scrollTop,e.scrollLeft]);
  const collected=new Map();let steps=0,limited=false;
  const capture=()=>{for(const record of rows(t)){const key=record.values[t.order];if(collected.has(key)&&JSON.stringify(collected.get(key).values)!==JSON.stringify(record.values))throw Error('Les valeurs ont changé pendant la lecture. Réessaie après le chargement.');collected.set(key,record);}};
  try{
   scrollers.forEach(e=>{e.scrollTop=0;e.dispatchEvent(new Event('scroll',{bubbles:true}));});
   await new Promise(r=>setTimeout(r,350));capture();
   for(let i=0;i<45&&scrollers.some(e=>e.scrollTop+e.clientHeight<e.scrollHeight-2);i++){
    scrollers.forEach(e=>{e.scrollTop+=Math.max(40,e.clientHeight*.8);e.dispatchEvent(new Event('scroll',{bubbles:true}));});
    await new Promise(r=>setTimeout(r,250));capture();steps++;
   }
   limited=scrollers.some(e=>e.scrollTop+e.clientHeight<e.scrollHeight-2);
   if(diagnostic().busy||!diagnostic().readyLabel||scope()!==initialScope)throw Error('Le rapport a changé pendant la lecture. Réessaie.');
   if(!collected.size)return {error:'Aucune ligne SO lisible. Cela ne confirme pas l’absence de commandes. Essaie la vue accessible du tableau.',diagnostic:diagnostic()};
   return {headers:t.headers,rows:[...collected.values()],partial:true,limited,steps,diagnostic:diagnostic()};
  }finally{for(const [e,top,left] of saved){e.scrollTop=top;e.scrollLeft=left;e.dispatchEvent(new Event('scroll',{bubbles:true}));}}
 }
 globalThis.ToolboxPowerBIReader={read,diagnostic,ensureReady};
})();
