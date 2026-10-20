// Read only the visible SalesTable record. Never enter Edit or save a form.
(()=>{
 const C=globalThis.D365Controls,form='SalesTable';
 const clean=s=>String(s??'').replace(/\r\n?/g,'\n').trim();
 const key=s=>clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const orderPattern=/\bSO-[A-Z0-9]+(?:-[A-Z0-9]+)*\b/gi;
 function identity(){
  const nodes=C.all().filter(e=>C.visible(e)&&C.formMatch(e,form)),numbers=new Set();
  for(const e of nodes){
   if(C.controlMatch(e,'SalesId')||C.controlMatch(e,'SalesTable_SalesId')){const v=clean(e.matches('input,textarea')?e.value:e.innerText||e.textContent);if(/^SO-[A-Z0-9]+(?:-[A-Z0-9]+)*$/i.test(v))numbers.add(v.toUpperCase());}
   if(e.matches('h1,h2,[role="heading"]')||C.controlMatch(e,'FormCaption')||C.controlMatch(e,'FormTitle'))for(const v of clean(e.innerText||e.textContent||e.getAttribute('aria-label')).match(orderPattern)||[])numbers.add(v.toUpperCase());
  }
  return numbers.size===1?[...numbers][0]:'';
 }
 const isNote=e=>C.formMatch(e,form)&&(C.controlMatch(e,'SOLInternalNotes')||e.matches('input,textarea,[role="textbox"]')&&[e.getAttribute('aria-label'),...(e.labels||[])].some(label=>/^(internalnotes|notesinternes)$/.test(key(typeof label==='string'?label:label.textContent))));
 function fields(){
  const targets=new Set();
  for(const root of C.all().filter(isNote)){
   const inputs=[...(root.matches('input:not([type="hidden"]),textarea,[role="textbox"]')?[root]:[]),...root.querySelectorAll('input:not([type="hidden"]),textarea,[role="textbox"]')].filter(C.visible);
   for(const e of inputs)targets.add(e);
  }
  return [...targets].filter(e=>![...targets].some(other=>other!==e&&e.contains(other)));
 }
 async function read(wanted=[]){
  if(!C||location.hostname!=='solotech.operations.dynamics.com')return {error:'Commande D365 inaccessible.'};
  const company=new URL(location.href).searchParams.get('cmp');
  if(company?.toUpperCase()!=='CAOP')return {error:'La commande ouverte ne fait pas partie de CAOP.'};
  const order=identity();if(!order)return {error:'Numéro de commande D365 absent ou ambigu.'};
  if(wanted.length&&!wanted.includes(order))return {error:'Cette commande n’est pas dans la sélection demandée.'};
  const verify=()=>{if(identity()!==order)throw Error('La commande a changé pendant la lecture des Internal Notes.');};
  let headerOpened=false;const expanded=new WeakSet();
  try{
   const ready=()=>{
    verify();let found=fields();if(found.length>1)throw Error('Plusieurs champs Internal Notes sont visibles.');if(found.length)return found[0];
    C.reveal?.(form,C.all().filter(isNote),verify,expanded);
    if(!headerOpened){const header=C.action(form,['Header','En-tête']);if(header&&header.getAttribute('aria-selected')!=='true'){verify();headerOpened=true;header.click();}}
    return false;
   };
   const field=await C.waitFor(ready,{timeout:3000});verify();
   const value=clean('value'in field?field.value:field.innerText||field.textContent);
   return {order,value,source:'D365',at:Date.now()};
  }catch(e){return {order,error:e.message};}
 }
 globalThis.ToolboxOrderNotesReader={read};
})();
