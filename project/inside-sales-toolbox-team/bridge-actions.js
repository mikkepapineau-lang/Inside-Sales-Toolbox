// Presentation only: one running action, explicit outcomes, no extra CRM calls.
(()=>{
 const entries=new Map();let running=false;
 const el=id=>document.getElementById(id),node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 function label(entry,text,state){
  const {button}=entry;button.dataset.actionState=state;const mark=node('span','action-mark');mark.setAttribute('aria-hidden','true');
  if(state==='busy'){for(let i=0;i<3;i++)mark.append(node('i',''));}else mark.textContent=state==='success'?'✓':state==='warning'?'!':state==='error'?'!':'';
  button.replaceChildren(mark,node('span','action-label',text));
 }
 function clearProgress(entry){delete entry.button.dataset.importStage;const p=el(entry.id+'-feedback');if(p){delete p.dataset.presentation;p.setAttribute('aria-live','polite');}}
 function feedback(entry,text,state){const p=el(entry.id+'-feedback');if(!p)return;p.hidden=false;p.dataset.state=state;p.setAttribute('aria-live','polite');p.replaceChildren(node('span','action-feedback-mark',state==='busy'?'':state==='success'?'✓':'!'),node('span','action-feedback-copy',text));p.firstChild.setAttribute('aria-hidden','true');globalThis.ToolboxMotion?.text(p,{duration:entry.config.successDuration||220});if(state!=='busy')globalThis.ToolboxMotion?.success(p.firstChild,{duration:entry.config.successDuration||420});}
 function reset(id,hideFeedback=true){const e=entries.get(id);if(!e)return;clearTimeout(e.timer);clearProgress(e);e.button.replaceChildren(...e.original.map(n=>n.cloneNode(true)));delete e.button.dataset.actionState;e.button.removeAttribute('aria-busy');const p=el(id+'-feedback');if(p&&hideFeedback)p.hidden=true;}
 function progress(id,{current,total,label:field,state=''}){
  const entry=entries.get(id);if(!entry||entry.button.dataset.actionState!=='busy'||!Number.isInteger(current)||!Number.isInteger(total)||total<1||current<0||total<current)return;
  const t=value=>globalThis.ToolboxI18n?.t(value)||value,button=entry.button;
  if(button.dataset.importStage!=='fields'){label(entry,t(entry.config.progressLabel||'Importation du lead…'),'busy');button.dataset.importStage='fields';const rail=node('span','lead-import-rail');rail.setAttribute('aria-hidden','true');rail.append(node('span','lead-import-fill'));button.append(rail);button.querySelector('.action-label').append(node('small','action-detail'));}
  const states={writing:'En cours',filled:'Saisi',kept:'Conservé',warning:'À vérifier'},status=states[state];
  const detail=current+' / '+total+' · '+t(field)+(status?' · '+t(status):'');button.querySelector('.action-detail').textContent=detail;button.querySelector('.lead-import-fill').style.width=(current/total*100)+'%';
  const p=el(id+'-feedback');if(p){p.dataset.presentation='fields';p.setAttribute('aria-live',id==='capture'?'off':'polite');const copy=p.querySelector('.action-feedback-copy');if(copy)copy.textContent=(id==='capture'?t('Champ'):t('Champs traités'))+' '+detail;}
 }
 function bind(id,config){
  const button=el(id),task=button?.onclick;if(!task)return;const entry={id,button,config,original:[...button.childNodes].map(n=>n.cloneNode(true)),timer:null};entries.set(id,entry);
  button.onclick=async()=>{
   if(running||button.disabled)return;running=true;clearTimeout(entry.timer);clearProgress(entry);
   const locks=[...document.querySelectorAll('#tool-bridge button,[data-step]')].filter(b=>b!==button).map(b=>({b,disabled:b.disabled}));for(const {b}of locks)b.disabled=true;
   button.disabled=true;button.setAttribute('aria-busy','true');el('tool-bridge').setAttribute('aria-busy','true');label(entry,config.busy,'busy');feedback(entry,config.busy,'busy');
   let result,state='error';
   try{
    result=await task();if(result?.toolboxError)throw Error(result.toolboxError);
    state=config.state?.(result)||'success';label(entry,state==='warning'?'Vérification requise':config.done,state);feedback(entry,state==='warning'?(config.warning||'Vérifie le résultat dans D365.'):config.message,state);
    globalThis.ToolboxMotion?.success(button.querySelector('.action-mark'),{duration:config.successDuration||420});
    if(state==='success'){config.after?.(result);globalThis.ToolboxMotion?.success(el('bridge-next'),{duration:config.successDuration||420});}
   }catch(e){result={toolboxError:e.message};label(entry,'À réessayer','error');feedback(entry,e.message,'error');}
   finally{
    button.removeAttribute('aria-busy');el('tool-bridge').removeAttribute('aria-busy');for(const {b,disabled}of locks)if(b.disabled)b.disabled=disabled;
    const terminal=state!=='error'&&config.terminal?.(result);button.disabled=!!terminal;running=false;
    if(!terminal)entry.timer=setTimeout(()=>reset(id,false),config.resetAfter||2800);
   }
   return result;
  };
 }
 globalThis.BridgeActions={bind,reset,progress,get busy(){return running;}};
})();
