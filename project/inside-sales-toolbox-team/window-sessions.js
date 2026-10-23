// Browser-window membership is separate from report-tab ownership. Never keyed by the active tab.
(()=>{
 const I=ToolboxInstances,C=I.base,key='toolboxWindowSessions';let queue=Promise.resolve();
 const read=async()=>({windows:{},work:{},...(await C.storage.session.get(key))[key]});
 const write=value=>C.storage.session.set({[key]:value});
 const serial=fn=>{const task=queue.then(fn);queue=task.catch(()=>{});return task;};
 const members=(state,id)=>Object.entries(state.windows).filter(([,v])=>v.id===id).map(([w])=>Number(w));
 async function resolve(windowId,sourceTabId){return serial(async()=>{
  const window=await C.windows.get(windowId);if(window.type!=='normal')throw Error('Ouvre le Toolbox depuis une fenêtre normale du navigateur.');
  const state=await read();let id=Object.keys(state.work).find(id=>state.work[id]===windowId)||state.windows[windowId]?.id;
  if(!id){id=Number.isInteger(sourceTabId)?'tab-'+sourceTabId:'window-'+windowId+'-'+crypto.randomUUID();state.windows[windowId]={id};await write(state);}return {id,windowId};
 });}
 async function allowed(id){const state=await read(),list=members(state,id);if(state.work[id])list.push(state.work[id]);return list.length?list:undefined;}
 async function host(id){const state=await read();return members(state,id)[0]||state.work[id];}
 async function work(id,firstOptions){const state=await read();let windowId=state.work[id];if(windowId){try{const window=await C.windows.get(windowId);if(window.type==='normal')return {windowId};}catch{}}
  if(!members(state,id).length)throw Error('La fenêtre de cette session est fermée.');
  const window=await C.windows.create({type:'normal',focused:false,url:firstOptions?.url||C.runtime.getURL('workspace.html')});
  windowId=window.id;state.work[id]=windowId;await write(state);const tab=window.tabs?.[0]||(await C.tabs.query({windowId}))[0];if(tab)await I.claim(id,tab.id);return {windowId,tab};
 }
 async function createTab(id,options={}){return serial(async()=>{const state=await read();if(!members(state,id).length&&!state.work[id]){const tab=await C.tabs.create(options);await I.claim(id,tab.id);return tab;}
  const target=await work(id,options);if(target.tab){if(options.active)await C.tabs.update(target.tab.id,{active:true});return target.tab;}
  const tab=await C.tabs.create({...options,windowId:target.windowId});await I.claim(id,tab.id);return tab;
 });}
 async function workWindow(id){return serial(async()=>{const result=await work(id);return result.windowId;});}
 async function info(windowId){const state=await read(),id=Object.keys(state.work).find(id=>state.work[id]===windowId)||state.windows[windowId]?.id;if(!id)throw Error('Session introuvable.');const windows=await C.windows.getAll({windowTypes:['normal'],populate:true});const workIds=Object.values(state.work);return {id,windowId,linked:members(state,id).length>1,workWindowId:state.work[id]||null,backup:!!state.windows[windowId]?.backup,windows:windows.filter(w=>w.id!==windowId&&!workIds.includes(w.id)).map(w=>({windowId:w.id,title:String(w.tabs?.find(t=>t.active)?.title||'').slice(0,80),linked:state.windows[w.id]?.id===id})),busy:I.busy(id)};}
 async function change(windowId,targetWindowId,split,restore){return serial(async()=>{
  const state=await read(),entry=state.windows[windowId];if(!entry)throw Error('Cette fenêtre de travail ne peut pas changer de session.');
  let next;if(split){next='window-'+windowId+'-'+crypto.randomUUID();}else if(restore){next=entry.backup;if(!next)throw Error('Aucune session précédente à reprendre.');}else{const target=await C.windows.get(targetWindowId);if(target.type!=='normal'||Object.values(state.work).includes(targetWindowId)||targetWindowId===windowId)throw Error('Choisis une autre fenêtre Toolbox.');next=state.windows[targetWindowId]?.id;if(!next){next='window-'+targetWindowId+'-'+crypto.randomUUID();state.windows[targetWindowId]={id:next};}}
  if(I.busy(entry.id)||I.busy(next))throw Error('Attends la fin de l’opération en cours avant de changer la liaison.');
  if(split)await I.copy(entry.id,next);
  state.windows[windowId]={id:next,backup:restore?entry.id:entry.backup||entry.id};if(I.rebindWindow)await I.rebindWindow(entry.id,next,windowId,state);else await write(state);return {id:next};
 });}
 C.runtime.onMessage.addListener((message,sender,reply)=>{
  if(message?.kind!=='windowSession'||sender.id!==C.runtime.id||!sender.url?.startsWith(C.runtime.getURL('')))return;
  const run=async()=>{const w=Number(message.windowId);if(!Number.isInteger(w))throw Error('Fenêtre introuvable.');
   if(message.action==='resolve')return resolve(w,message.sourceTabId);
   if(message.action==='info')return info(w);
   if(message.action==='createTab'){const current=await info(w);return createTab(current.id,message.options||{});}
   if(['link','split','restore'].includes(message.action))return change(w,Number(message.targetWindowId),message.action==='split',message.action==='restore');
   if(message.action==='showWork'){const current=await info(w),id=await workWindow(current.id);const window=await C.windows.get(id);await C.windows.update(id,{focused:true,...(window.state==='minimized'?{state:'normal'}:{})});return {windowId:id};}
   throw Error('Action de fenêtre inconnue.');
  };run().then(value=>reply({value}),e=>reply({error:e.message}));return true;
 });
 C.windows.onRemoved?.addListener(windowId=>{serial(async()=>{const state=await read();delete state.windows[windowId];for(const [id,w]of Object.entries(state.work))if(w===windowId)delete state.work[id];await write(state);}).catch(e=>console.error('Toolbox window cleanup:',e.message));});
 globalThis.ToolboxWindowSessions={resolve,allowed,host,workWindow,createTab,info,change,key};
})();
