(function(root){
const tax={QC:'GST&QST',ON:'HST_ON',BC:'GST&BC',MB:'GST&MB',AB:'GST',SK:'GST&SK',NB:'HST_NB',NL:'HST_NL',NS:'HST_NS',PE:'HST_PEI'};
const areas={QC:'263 354 367 418 438 450 468 514 579 581 819 873',ON:'226 249 289 343 365 382 416 437 519 548 613 647 683 705 742 753 807 905 942',BC:'236 250 257 604 672 778',MB:'204 431 584',AB:'368 403 587 780 825',SK:'306 474 639',NB:'428 506',NL:'709 879'};
function phone(raw=''){const ext=raw.match(/(?:ext\.?|poste|x|#)\s*(\d+)\s*$/i);let s=ext?raw.slice(0,ext.index):raw;let digits=s.replace(/\D/g,'');if(digits.length===11&&digits[0]==='1')digits=digits.slice(1);const north=digits.length===10&&(!s.trim().startsWith('+')||s.trim().startsWith('+1'));return {value:north?digits.replace(/^(\d{3})(\d{3})(\d{4})$/,'$1-$2-$3'):s.trim(),area:north?digits.slice(0,3):'',extension:ext?.[1]||''};}
function suggest(raw){const a=phone(raw).area;const province=Object.keys(areas).find(k=>areas[k].split(' ').includes(a));return {province:province||'',tax:tax[province]||'',note:['902','782'].includes(a)?'902/782 : choisir Nouvelle-Écosse ou Île-du-Prince-Édouard manuellement.':province?'Taxe proposée selon le téléphone : vérifier avec l’adresse du client.':'Indicatif inconnu, partagé ou international : taxe à choisir manuellement.'};}
function normalize(x){const ph=phone(x.phone||x.mobile||'');const company=/^(\[\[unknown\]\]|unknown|inconnu|n\/a|null|-)$/i.test((x.company||'').trim())?'':(x.company||'').trim();const name=capitalizeName(x.contact||'');const parts=name.split(/\s+/);const country=(x.country||'').trim();return {type:isPersonalEmail(x.email)?'Person':'Organization',company,contact:name,first:capitalizeName(x.first||parts[0]||''),last:capitalizeName(x.last||parts.slice(1).join(' ')),phone:ph.value,extension:x.extension||ph.extension,email:x.email||'',phoneName:name,emailName:name,currency:x.currency||'CAD',typeId:'Prospect',delivery:'PICK UP',terms:'_PICK UP',language:/^(french|français|fr)/i.test((x.preferredLanguage||x.language||'').trim())?'fr-CA':/^(english|anglais|en)/i.test((x.preferredLanguage||x.language||'').trim())?'en-US':'',country:!country||/^can(ada)?$/i.test(country)?'CAN':/^united states|^usa$/i.test(country)?'USA':country,street:x.street||'',city:x.city||'',state:x.state||'',postal:x.postal||'',tax:suggest(ph.value).tax};}

const provinceNames={qc:'QC',quebec:'QC',pq:'QC',on:'ON',ontario:'ON',bc:'BC','british columbia':'BC','colombie britannique':'BC',mb:'MB',manitoba:'MB',ab:'AB',alberta:'AB',sk:'SK',saskatchewan:'SK',nb:'NB','new brunswick':'NB','nouveau brunswick':'NB',nl:'NL','newfoundland and labrador':'NL','terre neuve et labrador':'NL',ns:'NS','nova scotia':'NS','nouvelle ecosse':'NS',pe:'PE',pei:'PE','prince edward island':'PE','ile du prince edouard':'PE',yt:'YT',yukon:'YT',nt:'NT',nu:'NU',nunavut:'NU'};
function taxForData(d){
 const country=(d.country||'').trim().toUpperCase();
 if(country&&!['CA','CAN','CANADA'].includes(country))return {tax:'',source:'address',note:'Adresse hors Canada : code de taxe à choisir manuellement.'};
 const region=(d.state||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^ca[- ]/,'').replace(/[.]/g,'').replace(/[-_]/g,' ').replace(/\s+/g,' ').trim();
 const province=provinceNames[region]||'';
 const postal=(d.postal||'').replace(/\s/g,'').toUpperCase();
 const postalProvince=/^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]\d[ABCEGHJKLMNPRSTVWXYZ]\d$/.test(postal)?({A:'NL',B:'NS',C:'PE',E:'NB',G:'QC',H:'QC',J:'QC',K:'ON',L:'ON',M:'ON',N:'ON',P:'ON',R:'MB',S:'SK',T:'AB',V:'BC',Y:'YT',X:'NORTH'})[postal[0]]:'';
 if(province&&postalProvince&&province!==postalProvince&&!(postalProvince==='NORTH'&&['NT','NU'].includes(province)))return {tax:'',source:'address',note:'Province et code postal incohérents : vérifie l’adresse et choisis la taxe.'};
 const resolved=province||postalProvince;
 if(resolved)return {tax:tax[resolved]||'',source:'address',note:tax[resolved]?'Taxe selon l’adresse ('+resolved+'), prioritaire sur le téléphone.':'Adresse dans un territoire : code de taxe à choisir manuellement.'};
 if(d.addressImported||region||postal)return {tax:'',source:'address',note:'Province de l’adresse non reconnue : complète l’adresse ou choisis la taxe.'};
 return {...suggest(d.phone),source:'phone'};
}
function updateTax(d){const result=taxForData(d);d.tax=result.tax;d.taxSource=result.source;d.taxNote=result.note;return d;}
function applyCompany(d,candidate){
 if(candidate.company)d.company=String(candidate.company);
 for(const key of ['street','city','state','postal','country'])d[key]=String(candidate[key]||'');
 if(/^(CA|Canada)$/i.test(d.country))d.country='CAN';
 d.addressImported=true;d.type='Organization';return updateTax(d);
}
const fields=[['type','Type'],['company','Name — compagnie'],['first','First name'],['last','Last name'],['currency','Currency'],['typeId','Type ID'],['delivery','Mode of delivery'],['terms','Delivery terms'],['language','Language'],['country','Country/region'],['street','Street'],['city','City'],['state','State'],['postal','ZIP/postal code'],['tax','Sales tax'],['phoneName','Name (Phone)'],['phone','Phone'],['extension','Extension'],['emailName','Name (Email)'],['email','Email address']];

const aliases={company:['Name','Nom'],first:['First name','Prénom'],last:['Last name','Nom de famille'],currency:['Currency','Devise'],typeId:['Type ID'],delivery:['Mode of delivery','Mode de livraison'],terms:['Delivery terms','Conditions de livraison'],language:['Language','Langue'],country:['Country/region','Pays/région'],street:['Street','Rue'],city:['City','Ville'],state:['State','Province','État'],postal:['ZIP/postal code','Code postal'],tax:['Sales tax','Groupe de taxes'],phoneName:['Name (Phone)'],phone:['Phone','Téléphone'],extension:['Extension','Ext.'],emailName:['Name (Email)'],email:['Email address','Adresse e-mail','Courriel']};
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[*:]/g,'').trim();
function mapFields(all,type){
 const result={};
 for(const [key,names] of Object.entries(aliases)){const found=all.filter(f=>names.some(n=>norm(n)===norm(f.label)||norm(n)===norm(f.label+' ('+f.context+')')));if(found.length===1)result[key]=found[0].key;}
 const plainNames=all.filter(f=>['name','nom'].includes(norm(f.label)));
 // The Create prospect layout has identity, phone contact, then email contact.
 const expected=type==='Organization'?3:2;
 if(plainNames.length===expected){let i=0;if(type==='Organization')result.company=plainNames[i++].key;result.phoneName=plainNames[i++].key;result.emailName=plainNames[i].key;}
 if(type==='Person')delete result.company;else{delete result.first;delete result.last;}
 const used=new Set();for(const key of Object.keys(result)){if(used.has(result[key]))delete result[key];else used.add(result[key]);}
 return result;
}
// Exact provider domains: gmail.com.example.ca must remain an organization.
const personalDomains=new Set(('gmail.com googlemail.com hotmail.com hotmail.ca hotmail.fr hotmail.co.uk outlook.com outlook.ca outlook.fr live.com live.ca live.fr msn.com yahoo.com yahoo.ca yahoo.fr yahoo.co.uk ymail.com rocketmail.com icloud.com me.com mac.com aol.com aol.ca aol.fr proton.me protonmail.com pm.me gmx.com gmx.fr gmx.de mail.com zoho.com tutanota.com tuta.com tutamail.com fastmail.com hey.com').split(' '));
function emailHost(email){const d=String(email||'').trim().split('@');if(d.length!==2||!d[0]||/\s/.test(d[0])||!/^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(d[1]))return '';return d[1].toLowerCase();}
function isPersonalEmail(email){return personalDomains.has(emailHost(email));}
function domain(email){const host=emailHost(email);return personalDomains.has(host)?'':host;}
function capitalizeName(value=''){return String(value).trim().replace(/(^|[\s\-'’])\p{L}/gu,s=>s.toLocaleUpperCase('fr-CA'));}
function capitalizeNames(data){for(const key of ['company','contact','first','last','phoneName','emailName'])if(typeof data[key]==='string')data[key]=capitalizeName(data[key]);return data;}
function switchType(data,nextType){
 if(!['Organization','Person'].includes(nextType))return data;
 // Keep both identities in the draft; changing the visible form never erases one.
 if(data.type==='Person'){
  const full=[data.first,data.last].filter(Boolean).join(' ').trim();
  if(full){data.contact=full;data.phoneName=full;data.emailName=full;}
 }
 if(nextType==='Person'&&!data.first&&!data.last){
  const full=(data.contact||data.phoneName||data.emailName||'').trim();
  const parts=full.split(/\s+/);data.first=parts.shift()||'';data.last=parts.join(' ');
 }
 if(nextType==='Organization'&&!data.company?.trim())data.company=[data.first,data.last].filter(Boolean).join(' ').trim()||data.contact||'';
 data.type=nextType;return capitalizeNames(data);
}
root.Bridge={tax,phone,suggest,normalize,fields,mapFields,taxForData,updateTax,applyCompany,domain,isPersonalEmail,switchType,capitalizeName,capitalizeNames};if(typeof module!=='undefined')module.exports=root.Bridge;
})(globalThis);
