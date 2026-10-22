// Large BI catalogues live in the extension's IndexedDB, outside storage.local's quota.
(()=>{
 function open(){return new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB){reject(Error('Le stockage du catalogue non réservé est indisponible.'));return;}
  const request=indexedDB.open('toolbox-nonreserved',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('catalogue');
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });}
 async function transaction(mode,value){
  const db=await open();return new Promise((resolve,reject)=>{
   const tx=db.transaction('catalogue',mode),store=tx.objectStore('catalogue'),request=mode==='readonly'?store.get('current'):store.put(value,'current');let result;
   request.onsuccess=()=>{result=request.result;};tx.oncomplete=()=>{db.close();resolve(mode==='readonly'?result:value);};
   const fail=()=>{db.close();reject(tx.error||request.error||Error('Le catalogue non réservé n’a pas été enregistré.'));};tx.onerror=fail;tx.onabort=fail;
  });
 }
 globalThis.ToolboxNonReservedStore={get:()=>transaction('readonly'),put:value=>transaction('readwrite',value)};
})();
