(()=>{
 const el=id=>document.getElementById(id),day=()=>ToolboxUsedCatalogue.day(Date.now()),t=s=>globalThis.ToolboxI18n?.t(s)||s;
 let daily={},busy=false,problem='',phase='idle',completed=false,total=0,feedbackTimer,feedbackToken=0,feedbackMessage='',loading=true,buttonState='';
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function renderButton(){
  const state=phase==='preparing'?'busy':completed?'success':problem?'error':'ready',label=t(state==='busy'?'Préparation…':state==='success'?'Prêt !':state==='error'?'Réessayer':'Préparer'),b=el('workspace-start');
  b.disabled=busy;b.setAttribute('aria-busy',String(phase==='preparing'));b.dataset.actionState=state;
  const key=state+'|'+label;if(buttonState===key)return;buttonState=key;
  const mark=document.createElement('span');mark.className='action-mark'+(state==='ready'?' action-mark-open':'');mark.setAttribute('aria-hidden','true');
  if(state==='busy'){for(let i=0;i<3;i++)mark.append(document.createElement('i'));}else mark.textContent=state==='success'?'✓':state==='error'?'!':'↗';
  const text=document.createElement('span');text.className='action-label';text.textContent=label;b.replaceChildren(mark,text);
  if(state==='success')globalThis.ToolboxMotion?.success(mark);
 }
 function render(){
  const banner=el('workspace-prep'),wasHidden=banner.hidden;
  banner.hidden=loading||!busy&&!problem&&daily.date===day();
  banner.dataset.state=phase==='leaving'?'leaving':problem?'error':phase==='preparing'?'loading':completed?'success':'ready';banner.dataset.complete=String(completed);
  el('workspace-open').disabled=busy;el('workspace-dismiss').disabled=busy;renderButton();
  el('workspace-prep-state').textContent=problem||t(completed?total+' onglets ouverts ou réutilisés · groupe réduit.':phase==='preparing'?'Ouverture et regroupement des onglets…':'D365 · Product Search · 2 rapports Power BI');
  if(feedbackMessage&&!el('workspace-feedback').hidden)el('workspace-feedback').textContent=t(feedbackMessage);
  if(wasHidden&&!banner.hidden)globalThis.ToolboxMotion?.enter(banner);
 }
 async function refresh(){try{daily=(await chrome.storage.local.get('toolboxWorkspaceDay')).toolboxWorkspaceDay||{};if(!busy&&daily.date!==day())completed=false;}finally{loading=false;render();}}
 async function leaveBanner(){
  phase='leaving';render();const banner=el('workspace-prep'),animation=globalThis.ToolboxMotion?.exit(banner,{collapse:true});
  try{if(animation)await animation.finished;}catch{/* A cancelled animation must not repeat the operation. */}
  banner.hidden=true;animation?.cancel();
 }
 function clearFeedback(){feedbackToken++;feedbackMessage='';clearTimeout(feedbackTimer);el('workspace-feedback').hidden=true;}
 function feedback(message){
  clearFeedback();feedbackMessage=message;const token=feedbackToken,box=el('workspace-feedback');box.textContent=t(message);box.hidden=false;globalThis.ToolboxMotion?.enter(box);
  feedbackTimer=setTimeout(async()=>{if(token!==feedbackToken)return;const animation=globalThis.ToolboxMotion?.exit(box);try{if(animation)await animation.finished;}catch{}if(token===feedbackToken)box.hidden=true;animation?.cancel();},3500);
 }
 async function start(){
  if(busy||loading)return;busy=true;problem='';completed=false;phase='preparing';clearFeedback();render();
  try{
   await ToolboxAccess.requireAccess({origins:['https://solotech.operations.dynamics.com/*','https://app.powerbi.com/*']},'D365 et Power BI');
   const current=await chrome.windows.getCurrent(),response=await chrome.runtime.sendMessage({kind:'workspacePrepare',windowId:current.id});
   if(response?.error)throw Error(response.error);
   if(!response?.value||response.value.total!==4)throw Error('La préparation n’a pas été confirmée. Réessaie.');
   daily={date:day(),status:'prepared'};total=response.value.total;completed=true;phase='success';render();
   // This short hold makes the real confirmation visible before the banner collapses.
   await pause(900);await leaveBanner();feedback(total+' onglets ouverts ou réutilisés · groupe réduit.');
  }catch(e){problem=e.message;completed=false;}finally{busy=false;phase='idle';render();}
 }
 el('workspace-start').onclick=start;el('workspace-open').onclick=start;
 el('workspace-dismiss').onclick=async()=>{
  if(busy||loading)return;busy=true;phase='dismissing';completed=false;problem='';render();
  try{daily={date:day(),status:'dismissed'};await chrome.storage.local.set({toolboxWorkspaceDay:daily});await leaveBanner();}
  catch(e){problem=e.message;}finally{busy=false;phase='idle';render();}
 };
 chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;if(changes.toolboxWorkspaceDay){daily=changes.toolboxWorkspaceDay.newValue||{};if(!busy&&daily.date!==day())completed=false;render();}else if(changes.toolboxLanguage)render();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh().catch(()=>{});});window.addEventListener('focus',()=>refresh().catch(()=>{}));refresh().catch(()=>{});
})();
