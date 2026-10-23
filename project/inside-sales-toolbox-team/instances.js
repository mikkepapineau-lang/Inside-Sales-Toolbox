// Each Toolbox view owns its drafts, results, jobs and target tabs. Legacy data is retained.
(()=>{
 const base=globalThis.chrome,valid=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,90}$/.test(id),factories=new Map(),contexts=new Map();
 const inherited=new Set(['toolboxContacts','toolboxPricing','toolboxLanguage','hsLanguage','hsInput','hsOrigin','toolboxUsedPowerBI','toolboxUsedCountryCatalogue','toolboxUsedRegionQuantities','toolboxUsedRegionPrices']);
 const shared=new Set(['toolboxPricingRate','hsDataset']),targetKeys=new Set(['d365TargetId','productSearchTab','powerBITab','usedPowerBITab','nonReservedTab']);
 let epochJob,claimQueue=Promise.resolve();
 const epoch=()=>epochJob??=(async()=>{const saved=await base.storage.session.get('toolboxInstanceEpoch');if(saved.toolboxInstanceEpoch)return saved.toolboxInstanceEpoch;const value=crypto.randomUUID();await base.storage.session.set({toolboxInstanceEpoch:value});return value;})();
 const prefix=async id=>'toolboxInstance:'+await epoch()+':'+id+':';
 async function records(mode,operations){const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('toolbox-instances',1);r.onupgradeneeded=()=>r.result.createObjectStore('data');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return new Promise((resolve,reject)=>{const tx=db.transaction('data',mode==='initialize'?'readwrite':mode),store=tx.objectStore('data'),result={};for(const [key,value]of operations){if(mode==='initialize'){const r=store.get(key);r.onsuccess=()=>{if(r.result!==undefined)result[key]=r.result;else{result[key]={value};store.put({value},key);}};}else{const r=mode==='readonly'?store.get(key):store.put({value},key);r.onsuccess=()=>{result[key]=r.result;};}}tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=tx.onabort=()=>{db.close();reject(tx.error||Error('Le stockage de cette session est indisponible.'));};});}
 async function owners(){return (await base.storage.session.get('toolboxInstanceOwners')).toolboxInstanceOwners||{};}
 function claim(id,tabId){if(!id||!Number.isInteger(tabId))return Promise.resolve();const task=claimQueue.then(async()=>{const saved=await owners();if(saved[tabId]&&saved[tabId]!==id)throw Object.assign(Error('Cet onglet appartient à une autre session du Toolbox. Ouvre un autre onglet pour cette session.'),{code:'INSTANCE_TAB_BUSY'});if(saved[tabId]!==id){saved[tabId]=id;await base.storage.session.set({toolboxInstanceOwners:saved});}});claimQueue=task.catch(()=>{});return task;}
 function context(id=''){
  if(id&&!valid(id))throw Error('Session Toolbox invalide.');if(contexts.has(id))return contexts.get(id);
  const listeners=[],modules=new Map(),cache=new Map(),eventListeners=[];const ctx={id,listeners,modules};contexts.set(id,ctx);
  function area(name){if(!id)return base.storage[name];const raw=base.storage[name];return {
   async get(keys){const pre=await prefix(id);let names=typeof keys==='string'?[keys]:Array.isArray(keys)?keys:keys&&typeof keys==='object'?Object.keys(keys):[];const out={};
    if(name==='session'){const values=await raw.get(names.map(k=>pre+k));for(const key of names)if(values[pre+key]!==undefined)out[key]=values[pre+key];return out;}
    const own=names.filter(k=>!shared.has(k)),values=own.length?await records('readonly',own.map(k=>[pre+k])):{};
    for(const key of names){let record=values[pre+key];if(shared.has(key)){const value=(await raw.get(key))[key];if(value!==undefined)out[key]=value;continue;}
     if(!record){const value=inherited.has(key)?(await raw.get(key))[key]:undefined;record=value===undefined?{value}:(await records('initialize',[[pre+key,value]]))[pre+key];}if(record.value!==undefined)out[key]=record.value;else if(keys&&!Array.isArray(keys)&&typeof keys==='object'&&keys[key]!==undefined)out[key]=keys[key];cache.set(key,record.value);
    }return out;
   },
   async set(values){const pre=await prefix(id);if(name==='session'){for(const key of targetKeys)if(Number.isInteger(values[key]))await claim(id,values[key]);await raw.set(Object.fromEntries(Object.entries(values).map(([k,v])=>[pre+k,v])));return;}
    const own=Object.entries(values).filter(([k])=>!shared.has(k)),common=Object.fromEntries(Object.entries(values).filter(([k])=>shared.has(k)));if(own.length){await records('readwrite',own.map(([k,v])=>[pre+k,v]));await base.storage.session.set({[pre+'localChanged']:{keys:own.map(([k])=>k),nonce:crypto.randomUUID()}});}if(Object.keys(common).length)await raw.set(common);
   },
   async remove(keys){const names=typeof keys==='string'?[keys]:keys;if(name==='local')return this.set(Object.fromEntries(names.map(k=>[k,undefined])));const pre=await prefix(id);await raw.remove(names.map(k=>pre+k));},
   async clear(){throw Error('Efface les données depuis le module voulu pour cette session.');}
  };}
  const storage={local:area('local'),session:area('session'),onChanged:{addListener:fn=>{eventListeners.push(fn);},removeListener:fn=>{const i=eventListeners.indexOf(fn);if(i>=0)eventListeners.splice(i,1);}}};
  if(id)base.storage.onChanged.addListener((changes,name)=>{(async()=>{const pre=await prefix(id),mapped={};for(const [key,value]of Object.entries(changes)){if(shared.has(key))mapped[key]=value;else if(key.startsWith(pre)&&key!==pre+'localChanged')mapped[key.slice(pre.length)]=value;}
   if(Object.keys(mapped).length)for(const fn of eventListeners)fn(mapped,name);
   const signal=changes[pre+'localChanged']?.newValue;if(name==='session'&&signal?.keys){const values=await records('readonly',signal.keys.map(k=>[pre+k])),local={};for(const key of signal.keys){const value=values[pre+key]?.value;local[key]={oldValue:cache.get(key),newValue:value};cache.set(key,value);}for(const fn of eventListeners)fn(local,'local');}
  })().catch(e=>console.error('Toolbox session update:',e.message));});
  else storage.onChanged=base.storage.onChanged;
  const runtime=new Proxy(base.runtime,{get(target,key){if(key==='onMessage')return {addListener:fn=>listeners.push(fn)};if(key==='sendMessage'&&id)return (message,...args)=>base.runtime.sendMessage({...message,instanceId:id},...args);return target[key];}});
  const tabs=new Proxy(base.tabs,{get(target,key){if(!id)return target[key];if(key==='query')return async query=>{const found=await target.query(query),saved=await owners();return found.filter(t=>!saved[t.id]||saved[t.id]===id||query?.active&&!query?.url);};if(key==='create')return async options=>{const tab=await target.create(options);await claim(id,tab.id);return tab;};if(['update','reload','move','sendMessage'].includes(key))return async(tabId,...args)=>{if(key!=='update'||Object.keys(args[0]||{}).some(k=>k!=='active'))await claim(id,tabId);return target[key](tabId,...args);};if(key==='group')return async options=>{for(const tabId of [].concat(options.tabIds))await claim(id,tabId);return target.group(options);};return target[key];}});
  const scripting=base.scripting&&new Proxy(base.scripting,{get(target,key){if(key==='executeScript'&&id)return async options=>{await claim(id,options.target.tabId);return target.executeScript(options);};return target[key];}});
  ctx.chrome=new Proxy(base,{get(target,key){return key==='storage'?storage:key==='runtime'?runtime:key==='tabs'?tabs:key==='scripting'?scripting:key==='__toolboxScope'?id:target[key];}});return ctx;
 }
 function worker(name,id=''){const c=context(id);if(!c.modules.has(name)){const build=factories.get(name);if(!build)throw Error('Module Toolbox indisponible : '+name);c.modules.set(name,build(c.chrome));}return c.modules.get(name);}
 function register(name,build){factories.set(name,build);return worker(name);}
 const api=id=>context(id).chrome;
 async function reserve(api,tab,options){try{await claim(api.__toolboxScope,tab.id);return tab;}catch(e){if(e.code!=='INSTANCE_TAB_BUSY')throw e;return api.tabs.create({...options,active:false});}}
 const send=(c,m,s,reply)=>{let handled=false;for(const name of factories.keys())worker(name,c.id);for(const listener of c.listeners)if(listener(m,s,reply)===true)handled=true;return handled||undefined;};
 if(typeof document==='undefined'){
  const configure=tabId=>base.sidePanel?.setOptions?.({tabId,path:'sidepanel.html?instance=tab-'+tabId,enabled:true}).catch(()=>{});
  base.tabs.onActivated?.addListener(info=>configure(info.tabId));
  const configureTabs=()=>base.tabs.query({}).then(tabs=>Promise.all(tabs.map(tab=>configure(tab.id)))).catch(()=>{});
  base.runtime.onInstalled?.addListener(configureTabs);base.runtime.onStartup?.addListener(configureTabs);
  base.runtime.onMessage.addListener((m,s,reply)=>{if(s.id!==base.runtime.id)return;if(m?.kind==='instanceRegister'){if(!valid(m.instanceId))return;const job=epoch().then(async()=>{try{if(m.sourceTabId)await claim(m.instanceId,m.sourceTabId);return !!m.sourceTabId;}catch(e){if(e.code!=='INSTANCE_TAB_BUSY')throw e;return false;}});job.then(sourceOwned=>reply({value:{id:m.instanceId,sourceOwned}}),e=>reply({error:e.message}));return true;}
   if(m?.instanceId){if(!valid(m.instanceId)||s.url&&!s.url.startsWith(base.runtime.getURL('')))return;return send(context(m.instanceId),m,s,reply);}
   if(s.tab?.id&&['d365Attention','d365Progress','usedRegionFrameFound'].includes(m?.kind)){owners().then(saved=>{if(!send(context(saved[s.tab.id]||''),m,s,reply))reply(null);},e=>reply({error:e.message}));return true;}return send(context(),m,s,reply);
  });
  base.tabs.onRemoved?.addListener(tabId=>{const task=claimQueue.then(async()=>{const saved=await owners();delete saved[tabId];await base.storage.session.set({toolboxInstanceOwners:saved});});claimQueue=task.catch(()=>{});});
 }
 globalThis.ToolboxInstances={api,register,worker,claim,reserve,valid,prefix,base,current:''};
})();
