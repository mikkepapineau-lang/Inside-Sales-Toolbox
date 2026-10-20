(()=>{
if(globalThis.solotechFlow?.version==='1.7.6')return;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[*:]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
function all(selector){const roots=[document],out=[];for(let i=0;i<roots.length;i++){out.push(...roots[i].querySelectorAll(selector));for(const e of roots[i].querySelectorAll('*'))if(e.shadowRoot)roots.push(e.shadowRoot);}return [...new Set(out)];}
function label(e){return Array.from(e.labels||[]).map(x=>x.innerText).join(' ')||e.getAttribute('aria-label')||(e.getAttribute('aria-labelledby')||'').split(' ').map(id=>e.getRootNode().getElementById?.(id)?.textContent||'').join(' ');}
function value(name){const found=all('input,select,textarea').filter(e=>visible(e)&&norm(label(e))===norm(name));return found.length===1?found[0].value:'';}
function buttons(name){return all('button,a,[role="button"],[role="menuitem"]').filter(e=>visible(e)&&!e.disabled&&norm(e.innerText||e.getAttribute('aria-label'))===norm(name));}
function guard(){const u=new URL(location.href);if(u.origin!=='https://solotech.operations.dynamics.com'||(u.searchParams.get('cmp')||'').toUpperCase()!=='CAOP')throw Error('D365 doit être ouvert dans la société CAOP. Clique sur Afficher D365 pour vérifier.');}
async function wait(fn,ms=30000,onBlocked){if(globalThis.D365Controls?.waitFor)return D365Controls.waitFor(fn,{timeout:ms,onBlocked});const end=Date.now()+ms;while(Date.now()<end){if(fn())return;await sleep(300);}throw Error('D365 ne présente pas encore l’écran attendu. Affiche D365 pour vérifier la connexion ou un message.');}
let pending=null;
async function fillDraft({data,overwrite,onBlocked,onProgress=async()=>{}}){
 guard();Bridge.capitalizeNames(data);
 const progress=async update=>{try{await onProgress(update);}catch{/* Status updates must never abort prospect preparation. */}};
 await progress('Ouverture du formulaire prospect…');
 if(!/create prospect/i.test(document.body.innerText)){
  if((new URL(location.href)).searchParams.get('mi')!=='smmBusinessRelationsListPage')throw Error('Ouvre All prospects dans l’onglet D365.');
  if(value('Account'))throw Error('Une fiche prospect est déjà ouverte. Reviens à All prospects pour préparer un nouveau prospect.');
  await wait(()=>buttons('New').length===1,30000,onBlocked);buttons('New')[0].click();await wait(()=>/create prospect/i.test(document.body.innerText),30000,onBlocked);
 }
 await progress('Sélection du type '+(data.type==='Person'?'Personne':'Organisation')+'…');
 await solotechBridge.setType(data.type,{onBlocked});await progress('Repérage des champs du prospect…');const scan=solotechBridge.scan();const map=Bridge.mapFields(scan.fields,data.type);const items=[],skipped=[];
 for(const [key,label] of Bridge.fields){if(key==='type'||data.type==='Person'&&key==='company'||data.type==='Organization'&&['first','last'].includes(key))continue;
 if(!data[key])continue;if(map[key]!==undefined)items.push({field:key,key:map[key],value:data[key],label});else skipped.push(label+' : introuvable, non rempli');}
 for(const k of data.type==='Person'?['first','last']:['company'])if(!data[k]||map[k]===undefined)throw Error('Identité incomplète : vérifie le nom dans l’extension.');
 const report=await solotechBridge.fill({scanToken:scan.token,items,overwrite,type:data.type,onProgress:progress});
 pending={type:data.type,name:data.type==='Organization'?data.company:[data.first,data.last].join(' '),account:value('Prospect'),draft:JSON.stringify(Bridge.fields.map(([k])=>data[k]||''))};
 const actual=items.map(i=>{const f=scan.fields.find(f=>f.key===i.key);return i.label+' = '+value(f.label);});
 return {report:[...report,...skipped],actual,message:'Formulaire rempli en arrière-plan. Vérifie le récapitulatif avant de confirmer la création.'};
}
async function confirmProspect({expectedName,data,territory,office,onBlocked}){
 guard();if(!pending||norm(expectedName)!==norm(pending.name)||pending.draft!==JSON.stringify(Bridge.fields.map(([k])=>data?.[k]||'')))throw Error('Remplis d’abord le prospect avec les données actuelles.');
 const snapshot=solotechBridge.scan(),mapping=Bridge.mapFields(snapshot.fields,pending.type);
 const get=k=>snapshot.fields.find(f=>f.key===mapping[k])?.value||'';
 const actual=pending.type==='Organization'?get('company'):[get('first'),get('last')].join(' ');
 if(norm(actual)!==norm(expectedName))throw Error('Le nom saisi dans D365 ne correspond pas au lead. Affiche D365 pour vérifier.');
 const result=solotechBridge.createProspect();let account=pending.account;pending=null;
 // Never click Save again if the subsequent navigation or dimensions fail.
 try{
  await wait(()=>!/create prospect/i.test(document.body.innerText),30000,onBlocked);
  account=account||value('Account');
  await openRecord(account,{onBlocked});
  const dimensions=await solotechQuotation.fillDimensions({expectedName,expectedAccount:account,territory:territory||'MONTREAL',office:office||'MONTREAL',onBlocked});
  return {...result,account,dimensions,verified:true,message:'Prospect créé et dimensions financières remplies et enregistrées.'};
 }catch(e){return {...result,account,dimensionsPending:true,message:'Save a été cliqué. Ne recrée pas le prospect. Dimensions à terminer : '+e.message};}
}
async function openRecord(account,{onBlocked}={}){
 guard();if(!/^CAOP-\d+$/i.test(account||''))throw Error('Numéro de prospect indisponible. Crée-le depuis l’extension ou ouvre sa fiche dans D365.');
 await wait(()=>!/create prospect/i.test(document.body.innerText),30000,onBlocked);
 if(value('Account')===account||value('Prospect')===account&&/create quotation/i.test(document.body.innerText))return;
 await wait(()=>all('a,[role="link"]').some(e=>visible(e)&&e.textContent.trim()===account),30000,onBlocked);
 const links=all('a,[role="link"]').filter(e=>visible(e)&&e.textContent.trim()===account);
 if(links.length!==1)throw Error('Lien du prospect ambigu : ouvre '+account+' dans D365.');links[0].click();await wait(()=>value('Account')===account,30000,onBlocked);
}
globalThis.solotechFlow={version:'1.7.6',fillDraft,confirmProspect,openRecord};
})();
