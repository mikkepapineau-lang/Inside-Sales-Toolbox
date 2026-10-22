// Open a reusable, collapsed workspace. No CRM writes or report reads are run here.
(()=>{
 const registryKey='toolboxWorkspaceTabs';let running=null,registryQueue=Promise.resolve();
 const usedId='458f40a9-2b3f-4518-a3cb-d699fef65baa';
 const reportId=value=>{
  try{
   const url=new URL(value),ids=/^\/reportEmbed\/?$/i.test(url.pathname)?url.searchParams.getAll('reportId'):[url.pathname.match(/\/reports\/([\da-f-]{36})(?:\/|$)/i)?.[1]||''];
   return url.origin==='https://app.powerbi.com'&&ids.length===1&&/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(ids[0])?ids[0].toLowerCase():'';
  }catch{return '';}
 };
 const urlOf=tab=>tab?.pendingUrl||tab?.url||'';
 function bi(url){try{return new URL(url).origin==='https://app.powerbi.com'&&!/singleSignOn|signin|login/i.test(new URL(url).pathname);}catch{return false;}}
 function ready(url,known){
  if(!bi(url)||[usedId,'d8c07521-770e-41bd-be72-a23a1dbf41ff'].includes(reportId(url)))return false;
  const u=new URL(url),id=reportId(url),knownId=reportId(known);
  return id==='37ddaf7f-5526-4fd7-b85e-bc6630d5ae33'||u.pathname.includes('/links/lNdArEWzXE')||u.searchParams.get('bookmarkGuid')==='ff596301-8009-4b69-be11-40ae01525ce3'||!!known&&(url===known||!!knownId&&id===knownId);
 }
 function updateRegistry(update){const job=registryQueue.then(async()=>{const saved=(await chrome.storage.local.get(registryKey))[registryKey]||{};const next=update(saved);if(next)await chrome.storage.local.set({[registryKey]:next});});registryQueue=job.catch(()=>{});return job;}
 async function normalWindow(id){try{const w=await chrome.windows.get(id);if(w.type==='normal')return w.id;}catch{}const windows=await chrome.windows.getAll({windowTypes:['normal']});const w=windows.find(w=>w.focused)||windows[0];if(!w)throw Error('Ouvre une fenêtre normale du navigateur pour préparer les onglets.');return w.id;}
 async function run(windowId){
  if(!await chrome.permissions.contains({origins:['https://solotech.operations.dynamics.com/*','https://app.powerbi.com/*']}))throw Error('Autorise les accès D365 et Power BI avant de préparer les onglets.');
  if(!chrome.tabs.group||!chrome.tabGroups)throw Error('Le regroupement des onglets n’est pas disponible dans ce navigateur.');
  windowId=await normalWindow(windowId);
  const [session,local,tabs,groups]=await Promise.all([chrome.storage.session.get(['d365TargetId','productSearchTab','powerBITab','powerBIResolvedURL','usedPowerBITab','usedPowerBIResolvedURL']),chrome.storage.local.get([registryKey,'toolboxPowerBI','toolboxPowerBIResolvedURL']),chrome.tabs.query({url:['https://solotech.operations.dynamics.com/*','https://app.powerbi.com/*']}),chrome.tabGroups.query({title:'Solotech Toolbox'})]);
  const registry=local[registryKey]||{},groupIds=new Set(groups.map(g=>g.id)),knownReady=session.powerBIResolvedURL||local.toolboxPowerBIResolvedURL||registry.ready?.url;
  const definitions=[
   {slot:'prospects',key:'d365TargetId',url:D365_URL,matches:t=>ToolboxTabs.matches({...t,url:urlOf(t)},['smmBusinessRelationsListPage'])},
   {slot:'products',key:'productSearchTab',url:PRODUCT_SEARCH_URL,matches:t=>ToolboxTabs.matches({...t,url:urlOf(t)},['SOLMCRProductQuickQuote'])},
   {slot:'ready',key:'powerBITab',url:POWERBI_REPORT_URL,matches:t=>ready(urlOf(t),knownReady)||!knownReady&&bi(urlOf(t))&&![usedId,'d8c07521-770e-41bd-be72-a23a1dbf41ff'].includes(reportId(urlOf(t)))&&t.id===local.toolboxPowerBI?.tabId&&groupIds.has(t.groupId)},
   {slot:'used',key:'usedPowerBITab',url:USED_POWERBI_REPORT_URL,matches:t=>bi(urlOf(t))&&reportId(urlOf(t))===usedId}
  ];
  const results=await Promise.allSettled(definitions.map(async d=>{
   const candidates=tabs.filter(t=>!t.pinned&&d.matches(t));
   const tab=candidates.find(t=>t.id===session[d.key])||candidates.find(t=>t.id===registry[d.slot]?.id)||candidates.find(t=>t.windowId===windowId)||candidates[0]||await chrome.tabs.create({windowId,url:d.url,active:false});
   const continuation=d.slot==='prospects'&&tabs.some(t=>t.id===session.d365TargetId&&ToolboxTabs.matches({...t,url:urlOf(t)},['smmBusRelTable','SalesQuotationTable']));
   if(!continuation)await chrome.storage.session.set({[d.key]:tab.id});return {d,tab,reused:candidates.some(t=>t.id===tab.id)};
  }));
  const successes=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
  await updateRegistry(saved=>{for(const {d,tab}of successes)saved[d.slot]={id:tab.id,url:urlOf(tab)||d.url};return saved;});
  const grouped=successes.length?await ToolboxTabGroup.prepare(successes.map(x=>x.tab),windowId):null;
  const failed=results.find(r=>r.status==='rejected');if(failed)throw Error('Certains onglets n’ont pas pu être ouverts. Réessaie; les onglets déjà préparés seront réutilisés. '+String(failed.reason?.message||failed.reason));
  const latest=await Promise.all(successes.map(async item=>({...item,tab:await chrome.tabs.get(item.tab.id)})));
  await updateRegistry(saved=>{for(const {d,tab,reused}of latest){const url=urlOf(tab);if(d.matches(tab)||d.slot==='ready'&&!reused&&bi(url)&&reportId(url)&&reportId(url)!==usedId)saved[d.slot]={id:tab.id,url};}return saved;});
  const result={total:successes.length,opened:successes.filter(x=>!x.reused).length,reused:successes.filter(x=>x.reused).length,groupId:grouped.groupId,windowId};
  await chrome.storage.local.set({toolboxWorkspaceDay:{date:ToolboxUsedCatalogue.day(Date.now()),status:'prepared',at:Date.now(),...result}});return result;
 }
 function prepare(windowId){if(running)return running;running=run(windowId).finally(()=>{running=null;});return running;}
 chrome.runtime.onMessage.addListener((message,sender,reply)=>{if(sender.id!==chrome.runtime.id||message?.kind!=='workspacePrepare')return;prepare(message.windowId).then(value=>reply({value}),e=>reply({error:e.message}));return true;});
 // Capture the Ready report's first redirect so browser restarts can recover it.
 chrome.tabs.onUpdated?.addListener((id,change)=>{
  if(!change.url||!bi(change.url))return;
  updateRegistry(saved=>{const r=saved.ready;if(!r||r.id!==id||[usedId,'d8c07521-770e-41bd-be72-a23a1dbf41ff'].includes(reportId(change.url)))return null;const old=reportId(r.url),fresh=reportId(change.url);if(!fresh||old&&old!==fresh)return null;r.url=change.url;return saved;}).catch(()=>{});
 });
 globalThis.ToolboxWorkspace={prepare};
})();
