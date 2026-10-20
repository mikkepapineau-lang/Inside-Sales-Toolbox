importScripts('model.js','company.js');
async function lookup(domain){
 if(Bridge.domain('lookup@'+domain)!==domain)throw Error('Domaine non valide.');
 const hosts=[domain,'www.'+domain];
 const allowed=await chrome.permissions.contains({origins:hosts.map(h=>'https://'+h+'/*')});
 if(!allowed)throw Error('Accès au site requis. Relance la recherche.');
 const fetchPage=async(url)=>{
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),7000);
  try{const response=await fetch(url,{credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});
   const final=new URL(response.url);if(!response.ok||final.protocol!=='https:'||!hosts.includes(final.hostname))return [];
   if(!/text\/html|application\/xhtml\+xml/i.test(response.headers.get('content-type')||''))return [];
   const reader=response.body.getReader();let count=0;const decoder=new TextDecoder();let html='';
   while(true){const {done,value}=await reader.read();if(done)break;count+=value.length;if(count>1500000){await reader.cancel();return [];}html+=decoder.decode(value,{stream:true});}html+=decoder.decode();
   return CompanyLookup.extract(html,final.href);
  }catch{return [];}finally{clearTimeout(timeout);}
 };
 const home=await Promise.all(hosts.map(h=>fetchPage('https://'+h+'/')));
 let candidates=home.flat();
 if(!candidates.length){const contact=await Promise.all(hosts.flatMap(h=>['/contact/','/contact-us/'].map(path=>fetchPage('https://'+h+path))));candidates=contact.flat();}
 return {candidates:[...new Map(candidates.map(c=>[JSON.stringify({...c,source:''}),c])).values()]};
}
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
 if(sender.id!==chrome.runtime.id||message?.kind!=='companyLookup')return;
 lookup(message.domain).then(sendResponse,e=>sendResponse({error:e.message}));return true;
});
async function geocodeAddress(address){
 if(!await chrome.permissions.contains({origins:['https://photon.komoot.io/*']}))throw Error('Accès au service de localisation non autorisé.');
 if(typeof address!=='string'||address.length<5||address.length>600)throw Error('Adresse insuffisante.');
 const response=await fetch('https://photon.komoot.io/api/?limit=3&q='+encodeURIComponent(address),{credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('Service de localisation indisponible. Choisis le territoire manuellement.');
 const body=await response.json();return {locations:(body.features||[]).filter(f=>f.geometry?.type==='Point').map(f=>({lat:f.geometry.coordinates[1],lon:f.geometry.coordinates[0],country:f.properties.countrycode,label:[f.properties.name,f.properties.street,f.properties.city,f.properties.state,f.properties.postcode,f.properties.country].filter(Boolean).join(', ')}))};
}
chrome.runtime.onMessage.addListener((m,s,reply)=>{if(s.id!==chrome.runtime.id||m?.kind!=='geocodeAddress')return;geocodeAddress(m.address).then(reply,e=>reply({error:e.message}));return true;});
importScripts('d365-worker.js');
