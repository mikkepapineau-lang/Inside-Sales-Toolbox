// Visible interaction feedback, bounded to a few elements and never looping.
(()=>{
 const active=new WeakMap(),disclosures=new Map(),running=new Set();
 const reduced=()=>globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
 globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',event=>{
  if(!event.matches)return;
  for(const animation of running)animation.cancel();
  for(const entry of disclosures.values())entry.animation.finish();
 });
 function animate(element,frames,options){
  if(!element?.animate||reduced())return;
  active.get(element)?.cancel();
  const animation=element.animate(frames,{duration:160,easing:'cubic-bezier(.2,.7,.2,1)',...options});active.set(element,animation);running.add(animation);
  const cleanup=()=>{running.delete(animation);if(active.get(element)===animation)active.delete(element);};
  animation.finished.then(cleanup,cleanup);return animation;
 }
 function cascade(element){
  const rows=[...element?.querySelectorAll?.('.record-row,.product-card,.tool-tile')||[]].slice(0,4);
  rows.forEach((row,i)=>animate(row,[{opacity:.55,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:150,delay:i*12,fill:'backwards'}));
 }
 function enter(element){const a=animate(element,[{opacity:.5,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:170});cascade(element);return a;}
 function results(element){
  // Search results remain stationary while typing; a refresh gets one short confirmation.
  if(document.activeElement?.matches?.('input,select,textarea'))return;
  return animate(element,[{opacity:.65},{opacity:1}],{duration:140});
 }
 function navigation(button){return animate(button?.querySelector?.('svg'),[{transform:'translateY(1px)'},{transform:'translateY(0)'}],{duration:140});}
 function text(element,{duration=140}={}){return animate(element,[{opacity:.5},{opacity:1}],{duration});}
 function success(element,{duration=200}={}){return animate(element,[{opacity:.6,transform:'scale(.92)'},{opacity:1,transform:'scale(1)'}],{duration});}
 async function fillFields(root,{onStep}={}){
  if(!root||root.isConnected===false||document.visibilityState==='hidden')return;
  const fields=[...root.querySelectorAll('input,select,textarea')].filter(input=>String(input.value).trim());
  if(!fields.length)return;
  // Values are already saved and stay editable. Presentation never blanks or locks them.
  try{
   onStep?.({current:fields.length,total:fields.length,label:'Coordonnées importées'});
   if(reduced())return;
   const visible=fields.filter(input=>input.getClientRects?.().length).slice(0,6);
   const animations=visible.map(input=>animate(input,[{background:'#e8def6',borderColor:'#a78bbf'},{background:'#fff',borderColor:'#d4d1de'}],{duration:220}));
   await Promise.allSettled(animations.filter(Boolean).map(animation=>animation.finished));
  }catch{
   // Animation failure must not turn a saved lead into a failed import.
  }
 }
 function exit(element,{collapse=false}={}){
  if(!element)return;
  const from={opacity:1,transform:'translateY(0)'},to={opacity:0,transform:'translateY(-7px)'};
  if(collapse){
   const css=getComputedStyle(element);from.height=element.getBoundingClientRect().height+'px';to.height='0px';from.minHeight=to.minHeight='0px';
   for(const key of ['paddingTop','paddingBottom','marginTop','marginBottom','borderTopWidth','borderBottomWidth']){from[key]=css[key]||'0px';to[key]='0px';}
  }
  return animate(element,[from,to],{duration:collapse?180:140,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
 }
 function reveal(element){[...element?.querySelectorAll?.('fieldset')||[]].slice(0,5).forEach((row,i)=>animate(row,[{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:170,delay:i*15,fill:'backwards'}));}
 function toggle(details){
  const previous=disclosures.get(details),opening=previous?!previous.opening:!details.open;
  const start=details.getBoundingClientRect().height,original=previous?.original||{height:details.style.height,overflow:details.style.overflow};
  previous?.animation.cancel();details.style.height='';details.style.overflow='';details.open=true;
  // A product's summary sits in its heading, so its closed disclosure has zero height.
  // Measure the native closed layout instead of assuming the summary is in normal flow.
  details.open=false;const collapsed=details.getBoundingClientRect().height;details.open=true;
  const end=opening?details.getBoundingClientRect().height:collapsed;
  if(!details.animate){details.open=opening;return;}
  details.style.overflow='hidden';
  const animation=details.animate([{height:start+'px'},{height:end+'px'}],{duration:150,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'}),entry={animation,opening,original};disclosures.set(details,entry);
  const finish=()=>{
   if(disclosures.get(details)!==entry)return;
   details.open=opening;details.style.height=original.height;details.style.overflow=original.overflow;animation.cancel();disclosures.delete(details);
  };
  animation.finished.then(finish,finish);
 }
 document.addEventListener('click',event=>{
  if(reduced())return;
  const button=event.target.closest?.('button');
  if(button&&!button.closest?.('.module-tabs'))animate(button,[{opacity:.82},{opacity:1}],{duration:120});
  if(event.defaultPrevented)return;
  const summary=event.target.closest?.('summary'),details=summary?.parentElement;
  if(!details||details.tagName!=='DETAILS'||details.classList.contains('used-facet')||event.target.closest('a,button,input,select,textarea'))return;
  if(!details.animate)return;event.preventDefault();toggle(details);
 });
 document.addEventListener('toggle',event=>{
  const details=event.target;
  if(details?.open&&details.classList?.contains('used-facet')){
   const popover=details.querySelector('.facet-popover');
   animate(popover,[{opacity:0,transform:'translateY('+((details.dataset.direction==='up')?4:-4)+'px) scale(.99)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:150});
  }
 },true);
 globalThis.ToolboxMotion={enter,results,navigation,text,success,reveal,exit,fillFields};
})();
