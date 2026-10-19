(()=>{
 const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none';
 const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
 const norm=s=>clean(s).toLowerCase().replace(/[^a-z0-9]/g,'');
 function read(e){
  const input=[...(e.matches('input,textarea')?[e]:[]),...e.querySelectorAll('input,textarea')].find(x=>visible(x)&&x.type!=='hidden');
  return clean(input?input.value:e.innerText||e.textContent);
 }
 function snapshot(){
  if(!globalThis.D365Controls?.find('SOLMCRProductQuickQuote','MCRSearchString','field'))throw Error('Product Search n’est pas prêt.');
  const grids=[...document.querySelectorAll('[role="grid"],table')].filter(visible).map(grid=>{
   const headers=[...grid.querySelectorAll('[role="columnheader"],th')].filter(visible).map((e,i)=>({index:Number(e.getAttribute('aria-colindex'))||i+1,label:clean(e.getAttribute('title')||e.getAttribute('aria-label')||read(e))}));
   return {grid,headers};
  }).filter(({headers})=>headers.some(h=>norm(h.label).includes('description'))&&headers.some(h=>/productname|searchname|manufacturer/.test(norm(h.label))));
  if(grids.length!==1)return {recognized:false,headers:[],rows:[],summary:''};
  const {grid,headers}=grids[0];const rows=[];
  for(const row of grid.querySelectorAll('[role="row"],tbody tr')){
   if(!visible(row)||row.querySelector('[role="columnheader"],th'))continue;
   const cells=[...row.querySelectorAll('[role="gridcell"],[role="cell"],td')].filter(visible);
   if(!cells.length)continue;
   const indexed=new Map(cells.map((e,i)=>[Number(e.getAttribute('aria-colindex'))||i+1,read(e)]));
   const values=headers.map(h=>indexed.get(h.index)||'');
   if(values.some(Boolean))rows.push(values);
   if(rows.length===100)break;
  }
  const text=document.body.innerText+'\n'+[...document.querySelectorAll('input[readonly],textarea[readonly]')].map(e=>e.value).join('\n');
  const summary=text.match(/The search returned\s+\d+\s+products?[^\n]*/i)?.[0]||'';
  const total=summary.match(/returned\s+(\d+)/i)?.[1];
  return {recognized:true,headers:headers.map(h=>h.label),rows,summary,total:total===undefined?null:Number(total),busy:!!grid.closest('[aria-busy="true"]')||grid.getAttribute('aria-busy')==='true'};
 }
 globalThis.ProductGrid={snapshot};
})();
