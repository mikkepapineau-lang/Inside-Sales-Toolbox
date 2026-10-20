// Only the public exchange rate is requested. Calculator amounts stay local.
(()=>{
 const key='toolboxPricingRate',endpoint='https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1';let pending;
 function valid(value){const time=Date.parse(value?.date+'T00:00:00Z');return Number.isFinite(Number(value?.rate))&&Number(value?.rate)>0&&/^\d{4}-\d{2}-\d{2}$/.test(value?.date||'')&&Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===value.date;}
 function decode(body){const row=body?.observations?.at(-1),value={rate:row?.FXUSDCAD?.v,date:row?.d};if(!valid(value))throw Error('Taux de change indisponible.');return {rate:String(value.rate),date:value.date,checkedAt:Date.now()};}
 async function read(force=false){
  const saved=(await chrome.storage.local.get(key))[key];
  if(!force&&valid(saved)&&Date.now()-saved.checkedAt<3600000&&Date.now()>=saved.checkedAt)return {...saved,offline:false};
  if(pending)return pending;
  pending=(async()=>{try{
   if(!await chrome.permissions.contains({origins:['https://www.bankofcanada.ca/*']}))throw Error('Autorise les accès pour actualiser le taux de change.');
   const response=await fetch(endpoint,{credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Taux de change indisponible.');
   const result=decode(await response.json());await chrome.storage.local.set({[key]:result});return {...result,offline:false};
  }catch(e){if(valid(saved))return {...saved,offline:true};throw e;}finally{pending=null;}})();return pending;
 }
 chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{if(sender.id!==chrome.runtime.id||message?.kind!=='pricingRate')return;read(message.force===true).then(value=>sendResponse({value}),e=>sendResponse({error:e.message}));return true;});
 globalThis.ToolboxPricingRate={decode,read};
})();
