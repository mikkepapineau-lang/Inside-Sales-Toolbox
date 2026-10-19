// Visible interaction feedback, bounded to a few elements and never looping.
(()=>{
 const active=new WeakMap(),disclosures=new WeakMap();
 const reduced=()=>globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
 function animate(element,frames,options){
  if(!element?.animate||reduced())return;
  active.get(element)?.cancel();
  const animation=element.animate(frames,{duration:160,easing:'cubic-bezier(.2,.7,.2,1)',...options});active.set(element,animation);
  animation.finished.then(()=>{if(active.get(element)===animation)active.delete(element);},()=>{});return animation;
 }
 function cascade(element){
  const rows=[...element?.querySelectorAll?.('.record-row,.product-card,.tool-tile')||[]].slice(0,7);
  rows.forEach((row,i)=>animate(row,[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,delay:40+i*32,fill:'backwards'}));
 }
 function enter(element){const a=animate(element,[{opacity:.12,transform:'translateX(18px)'},{opacity:1,transform:'translateX(0)'}],{duration:320});cascade(element);return a;}
 function results(element){const a=animate(element,[{opacity:.45,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:240});cascade(element);return a;}
 function navigation(button){return animate(button?.querySelector?.('svg'),[{transform:'scale(.75) rotate(-8deg)'},{transform:'scale(1.14) rotate(3deg)',offset:.6},{transform:'scale(1) rotate(0)'}],{duration:380});}
 function text(element,{duration=220}={}){return animate(element,[{opacity:.2,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration});}
 function success(element,{duration=420}={}){return animate(element,[{opacity:.2,transform:'scale(.55)'},{opacity:1,transform:'scale(1.12)',offset:.65},{opacity:1,transform:'scale(1)'}],{duration});}
 async function fillFields(root,{onStep}={}){
  if(!root)return;
  const hidden=()=>{if(root.isConnected===false||document.visibilityState==='hidden')return true;for(let e=root;e;e=e.parentElement)if(e.hidden)return true;return false;};
  const fields=[...root.querySelectorAll('input,select,textarea')].map(input=>{
   const label=input.closest?.('label')||input.parentElement,copy=[...label?.childNodes||[]].filter(n=>n.nodeType===3).map(n=>n.nodeValue).join('').trim();
   return {input,label,value:input.value,disabled:input.disabled,group:input.closest?.('fieldset'),copy:copy||input.id};
  }),filled=fields.filter(field=>String(field.value).trim());
  if(reduced()||hidden()||!filled.length)return;
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),host=root.closest?.('main')||root;let follow=true;
  const stopFollow=()=>{follow=false;};host.addEventListener?.('wheel',stopFollow,{passive:true});host.addEventListener?.('touchstart',stopFollow,{passive:true});
  root.dataset.importState='running';root.setAttribute('aria-busy','true');
  try{
   for(const field of fields)field.input.disabled=true;
   for(const field of filled){field.input.value='';field.label?.classList.add('lead-field-pending');}
   await pause(80);let previousGroup=null,current=0;
   for(const field of filled){
    if(reduced()||hidden()||!root.contains(field.input))break;
    if(previousGroup&&previousGroup!==field.group){await pause(55);if(reduced()||hidden()||!root.contains(field.input))break;}previousGroup=field.group;
    field.label?.classList.remove('lead-field-pending');field.label?.classList.add('lead-field-active');field.input.value=field.value;
    if(follow)field.label?.scrollIntoView?.({block:'nearest',behavior:'smooth'});
    animate(field.label,[{opacity:.3,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:210});
    onStep?.({current:++current,total:filled.length,label:field.copy});await pause(160);field.label?.classList.remove('lead-field-active');
   }
  }catch{
   // Presentation failure must not turn a successfully saved lead into a failed import.
  }finally{
   for(const field of fields){if(root.contains(field.input)){field.input.value=field.value;field.input.disabled=field.disabled;}field.label?.classList.remove('lead-field-pending');field.label?.classList.remove('lead-field-active');}
   delete root.dataset.importState;root.removeAttribute('aria-busy');host.removeEventListener?.('wheel',stopFollow);host.removeEventListener?.('touchstart',stopFollow);
  }
 }
 function exit(element,{collapse=false}={}){
  if(!element)return;
  const from={opacity:1,transform:'translateY(0)'},to={opacity:0,transform:'translateY(-7px)'};
  if(collapse){
   const css=getComputedStyle(element);from.height=element.getBoundingClientRect().height+'px';to.height='0px';from.minHeight=to.minHeight='0px';
   for(const key of ['paddingTop','paddingBottom','marginTop','marginBottom','borderTopWidth','borderBottomWidth']){from[key]=css[key]||'0px';to[key]='0px';}
  }
  return animate(element,[from,to],{duration:collapse?320:220,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
 }
 function reveal(element){[...element?.querySelectorAll?.('fieldset')||[]].slice(0,5).forEach((row,i)=>animate(row,[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,delay:i*70,fill:'backwards'}));}
 function toggle(details){
  const previous=disclosures.get(details),opening=previous?!previous.opening:!details.open;
  const start=details.getBoundingClientRect().height,original=previous?.original||{height:details.style.height,overflow:details.style.overflow};
  previous?.animation.cancel();details.style.height='';details.style.overflow='';details.open=true;
  const css=getComputedStyle(details),summary=details.querySelector('summary');
  const collapsed=summary.getBoundingClientRect().height+['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth'].reduce((n,k)=>n+(parseFloat(css[k])||0),0);
  const end=opening?details.getBoundingClientRect().height:collapsed;
  if(!details.animate){details.open=opening;return;}
  details.style.overflow='hidden';
  const animation=details.animate([{height:start+'px'},{height:end+'px'}],{duration:280,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'}),entry={animation,opening,original};disclosures.set(details,entry);
  animation.finished.then(()=>{
   if(disclosures.get(details)!==entry)return;
   details.open=opening;details.style.height=original.height;details.style.overflow=original.overflow;animation.cancel();disclosures.delete(details);
  },()=>{});
 }
 document.addEventListener('click',event=>{
  if(reduced())return;
  const button=event.target.closest?.('button');
  if(button&&!button.closest?.('.module-tabs'))animate(button,[{transform:'scale(1)'},{transform:'scale(.96)',offset:.3},{transform:'scale(1)'}],{duration:button.id==='capture'?300:240});
  if(event.defaultPrevented)return;
  const summary=event.target.closest?.('summary'),details=summary?.parentElement;
  if(!details||details.tagName!=='DETAILS'||details.classList.contains('used-facet')||event.target.closest('a,button,input,select,textarea'))return;
  if(!details.animate)return;event.preventDefault();toggle(details);
 });
 document.addEventListener('toggle',event=>{
  const details=event.target;
  if(details?.open&&details.classList?.contains('used-facet')){
   const popover=details.querySelector('.facet-popover');
   animate(popover,[{opacity:0,transform:'translateY('+((details.dataset.direction==='up')?10:-10)+'px) scale(.97)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:240});
  }
 },true);
 globalThis.ToolboxMotion={enter,results,navigation,text,success,reveal,exit,fillFields};
})();
