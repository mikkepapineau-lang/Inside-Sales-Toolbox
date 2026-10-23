// Large BI catalogues live in the extension's IndexedDB, outside storage.local's quota.
(()=>{
 function open(){return new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB){reject(Error('Le stockage du catalogue non réservé est indisponible.'));return;}
  const request=indexedDB.open('toolbox-nonreserved',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('catalogue');
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });}
 async function transaction(mode,value,key='current'){
  const db=await open();return new Promise((resolve,reject)=>{
   const tx=db.transaction('catalogue',mode==='initialize'?'readwrite':mode),store=tx.objectStore('catalogue'),request=mode==='readonly'||mode==='initialize'?store.get(key):store.put(value,key);let result;
   request.onsuccess=()=>{result=request.result;if(mode==='initialize'&&result===undefined){store.put(value,key);result=value;}};tx.oncomplete=()=>{db.close();resolve(mode==='readwrite'?value:result);};
   const fail=()=>{db.close();reject(tx.error||request.error||Error('Le catalogue non réservé n’a pas été enregistré.'));};tx.onerror=fail;tx.onabort=fail;
  });
 }
 function forInstance(id=''){return {get:async()=>{if(!id)return transaction('readonly');const key=await ToolboxInstances.prefix(id)+'nonreserved',value=await transaction('readonly',undefined,key);if(value!==undefined)return value;const legacy=await transaction('readonly');if(legacy!==undefined)return transaction('initialize',legacy,key);return legacy;},put:async value=>transaction('readwrite',value,id?await ToolboxInstances.prefix(id)+'nonreserved':'current')};}
 globalThis.ToolboxNonReservedStore={get:()=>forInstance(globalThis.ToolboxInstances?.current||'').get(),put:value=>forInstance(globalThis.ToolboxInstances?.current||'').put(value),forInstance};
})();
