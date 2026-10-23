importScripts('google-address.js');
(()=>{
const build=chrome=>{
let googleAddressBusy=false;
async function googleAddress(candidate,email){
 if(googleAddressBusy)throw Error('Une recherche Google est déjà en cours.');
 googleAddressBusy=true;
 const addressKey=d=>[d.street,d.city,d.state,d.postal,/^(CA|Canada|CAN)$/i.test(d.country||'')?'CAN':d.country].join('|');
 const originalKey=addressKey(candidate);
 try{
 if(!await chrome.permissions.contains({origins:['https://www.google.com/*']}))throw Error('Autorise l’accès à Google avec « Autoriser tous les accès ».');
 const query=[candidate.street,candidate.city,candidate.state,candidate.postal,'Canada'].filter(Boolean).join(', ');
 const tab=await chrome.tabs.create({url:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query)+'&hl=fr',active:false});
 await chrome.storage.session.set({googleAddressStatus:'Recherche du format de l’adresse dans Google Maps…'});
 const end=Date.now()+25000;let addresses=[];
 while(Date.now()<end){
 const current=await chrome.tabs.get(tab.id);
 if(current.status==='complete'){
 const u=new URL(current.url);if(!['www.google.com','www.google.ca','maps.google.com'].includes(u.hostname)||!u.pathname.startsWith('/maps'))break;
 const [result]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>{
  const buttons=[...document.querySelectorAll('[data-item-id="address"]')].filter(e=>e.getClientRects().length);
  return [...new Set(buttons.map(e=>e.getAttribute('aria-label')||e.innerText).filter(Boolean))];
 }});
 addresses=result?.result||[];if(addresses.length)break;
 }
 await new Promise(r=>setTimeout(r,500));
 }
 const matches=addresses.map(a=>GoogleAddress.parse(a,candidate)).filter(Boolean);
 if(addresses.length!==1||matches.length!==1)throw Error('Google n’a pas confirmé une adresse unique avec le même numéro et code postal. L’adresse du site est conservée; vérifie l’onglet Google Maps.');
 const saved=await chrome.storage.session.get('lead');
 if(!saved.lead||saved.lead.data.email!==email||addressKey(saved.lead.data)!==originalKey)throw Error('Les coordonnées ont changé pendant la recherche. Aucun remplacement effectué.');
 const normalized=matches[0];const data=Bridge.applyCompany({...saved.lead.data},{...normalized,company:candidate.company});
 data.addressGoogleAt=Date.now();data.addressGoogleSource=(await chrome.tabs.get(tab.id)).url;data.addressGoogleFormatted=normalized.formatted;
 const message='Adresse reprise de Google Maps : '+normalized.formatted+'. Vérifie les champs avant de créer le prospect.';
 await chrome.storage.session.set({lead:{...saved.lead,data},googleAddressStatus:message});
 return {data,message};
 }catch(e){await chrome.storage.session.set({googleAddressStatus:e.message});throw e;}finally{googleAddressBusy=false;}
}
chrome.runtime.onMessage.addListener((m,s,reply)=>{
 if(s.id!==chrome.runtime.id||m?.kind!=='googleAddress')return;
 googleAddress(m.candidate,m.email).then(value=>reply({value}),e=>reply({error:e.message}));return true;
});

return {googleAddress};
};
const values=globalThis.ToolboxInstances?ToolboxInstances.register('google',build):build(globalThis.chrome);
Object.defineProperties(globalThis,Object.getOwnPropertyDescriptors(values));
})();
