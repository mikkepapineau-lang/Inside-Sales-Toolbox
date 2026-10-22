// Navigation belongs to this browser session; business data remains persistent.
(()=>{
 const key='toolboxNavigation',idle=30*60*1000,names=new Set(['home','bridge','contacts','products','powerbi','used','nonreserved','hs','calculator']);
 const normalize=name=>names.has(name)?name:'home';
 function resolve(value,now=Date.now()){
  const age=now-value?.at;
  return value&&Number.isFinite(value.at)&&age>=0&&age<idle?normalize(value.module):'home';
 }
 const remember=module=>chrome.storage.session.set({[key]:{module:normalize(module),at:Date.now()}});
 const forget=()=>chrome.storage.session.remove(key);
 globalThis.ToolboxNavigation={key,idle,normalize,resolve,remember,forget};
 if(typeof document==='undefined'){
  chrome.runtime.onStartup?.addListener(()=>forget().catch(()=>{}));
  // Edge can keep running after its last normal window closes.
  chrome.windows?.onRemoved?.addListener(async()=>{
   try{const windows=await chrome.windows.getAll({windowTypes:['normal']});if(!windows.length)await forget();}catch{}
  });
 }
})();
