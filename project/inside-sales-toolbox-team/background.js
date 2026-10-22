importScripts('navigation.js','tab-group.js','i18n-dictionary.js','model.js','company.js');
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
   return {candidates:CompanyLookup.extract(html,final.href),links:CompanyLookup.contactLinks(html,final.href)};
  }catch{return [];}finally{clearTimeout(timeout);}
 };
 const home=await Promise.all(hosts.map(h=>fetchPage('https://'+h+'/')));
 let candidates=home.flatMap(p=>p.candidates||[]);
 if(!candidates.length){const links=[...new Set(home.flatMap(p=>p.links||[]))];const fallback=hosts.flatMap(h=>['/contact/','/contact-us/','/contactez-nous/','/nous-joindre/','/a-propos/','/info/'].map(path=>'https://'+h+path));const urls=[...new Set([...links,...fallback])].slice(0,12);const contact=await Promise.all(urls.map(fetchPage));candidates=contact.flatMap(p=>p.candidates||[]);}
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
importScripts('warehouse-model.js','tab-routing.js','d365-worker.js');

importScripts('product-search.js','contact-model.js','context-menu.js');

importScripts('google-address-worker.js');

importScripts('order-model.js','order-notes-worker.js','powerbi-worker.js');

importScripts('used-catalogue.js','used-regions.js','used-powerbi-worker.js');
importScripts('workspace-worker.js');

importScripts('pricing-rate.js');

importScripts('nonreserved-model.js','nonreserved-store.js','nonreserved-worker.js');
