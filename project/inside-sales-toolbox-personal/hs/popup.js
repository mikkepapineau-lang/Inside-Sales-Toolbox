import {SOURCE,parseSource,search} from './core.js';
const $=id=>document.getElementById(id);
let language='fr';
const t=(fr,en)=>language==='en'?en:fr;
let data,fetching=false,problem='',bundled=false;
$('source').href=SOURCE;
const date=s=>new Date(s).toLocaleString(language==='en'?'en-CA':'fr-CA');
function text(tag,value,parent,cls){const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;parent.append(e);return e;}
function render(){
  $('result').replaceChildren();$('rows').replaceChildren();
  if(!data){$('status').textContent=problem||t("Chargement…","Loading\u2026");return;}
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Toronto'});
  const expired=data && (today<data.start||today>data.end);
  const stale=data && Date.now()-new Date(data.fetchedAt).getTime()>86400000;
  $('status').textContent=fetching?t("Vérification de la source en cours…","Checking the source\u2026"):problem?t(`${problem} Résultats provenant de la copie du ${date(data.fetchedAt)}; leur actualité n’est pas confirmée.`, `Refresh unavailable. Results from the copy dated ${date(data.fetchedAt)}; they may be out of date.`):bundled?t("Copie incluse à l’installation. Actualise pour confirmer les données actuelles.","Included installation snapshot. Refresh to confirm current data."):stale?t("Dernière vérification de plus de 24 h. Actualise avant utilisation.","Last checked over 24 hours ago. Refresh before use."):t("Source synchronisée avec Canada.ca.","Source synchronized with Canada.ca.");
  $('metadata').textContent=t(`${data.rows.length} articles · Récupérés le ${date(data.fetchedAt)}${data.updated?' · '+data.updated:''}`, `${data.rows.length} items · Retrieved ${date(data.fetchedAt)}`);
  $('period').textContent=t(data.period,`Effective period: ${data.start==='0000-01-01'?'…':data.start} – ${data.end==='9999-12-31'?'open-ended':data.end}. Product descriptions below are official French source text.`);
  if(expired){text('strong',t("Période expirée","Period expired"),$('result'));text('p',t("Actualise la source avant de consulter les taux.","Refresh the source before checking rates."),$('result'));return;}
  if($('origin').value==='other'){text('strong',t("Hors du périmètre","Outside scope"),$('result'));text('p',t("Cette liste vise les produits américains. Elle ne permet pas de déterminer les surtaxes pour un autre pays.","This list covers U.S. products. It cannot determine surtaxes for another country."),$('result'));return;}
  if(!$('code').value.trim()){text('strong',t("Quel est le code HS ?","What is the HS code?"),$('result'));text('p',t("Saisis un code pour voir les articles et les taux publiés.","Enter a code to see the listed items and rates."),$('result'));return;}
  let match;
  try{match=search(data.rows,$('code').value);}catch(e){text('p',t(e.message,/^[\d.\s]+$/.test($('code').value.trim())?'Enter a 4, 6, 8 or 10-digit code.':'Enter only an HS code, with or without dots.'),$('result'));return;}
  if(!match.rows.length){text('strong',t("Aucune correspondance","No matches"),$('result'));text('p',t("Ce code ne figure pas dans le tableau consulté. Cela ne confirme ni sa validité ni une absence de droits.","This code does not appear in the table. This confirms neither its validity nor the absence of duties."),$('result'));return;}
  const rates=[...new Set(match.rows.map(r=>r.rate))].sort((a,b)=>a-b);
  const tentative=fetching||!!problem||bundled||stale;
  text('strong',match.partial?t(`${match.rows.length} article${match.rows.length>1?'s':''} dans la liste`,`${match.rows.length} item${match.rows.length>1?'s':''} listed`):t(`${rates.join(' / ')} % · taux publié`,`${rates.join(' / ')}% · published rate`),$('result'));
  text('p',match.partial?t(`Taux trouvés : ${rates.join(' %, ')} %. Choisis l’article exact; ce taux ne s’applique pas automatiquement à toute la famille.`,`Rates found: ${rates.join('%, ')}%. Choose the exact item; this rate does not automatically apply to the entire group.`):`Article ${match.rows[0].code}. ${$('origin').value==='unknown'?t("Origine américaine à confirmer.","U.S. origin must be confirmed."):t("Pour un produit d’origine américaine, sous réserve des conditions applicables.","For a U.S.-origin product, subject to applicable conditions.")}`,$('result'));
  if(tentative) text('p',t("Actualité des résultats à confirmer auprès de la source.","Confirm that the results are current with the source."),$('result'));
  for(const row of match.rows){const card=text('article','',$('rows'),'item');const top=text('div','',card,'item-top');const b=text('button',row.code,top);b.type='button';b.title=t("Rechercher cet article exact","Search this exact item");b.addEventListener('click',()=>{$('code').value=row.code;save();render();});text('span',`${row.rate} %`,top,'rate');text('p',row.description,card);const detail=text('details','',card);text('summary',t("Position du Système harmonisé","Harmonized System heading (source text in French)"),detail);text('p',row.heading,detail);}
}
async function save(){try{await chrome.storage.local.set({hsInput:$('code').value,hsOrigin:$('origin').value,hsLanguage:language});}catch{/* Search remains usable if storage is unavailable. */}}
async function refresh(){
  if(fetching)return;fetching=true;problem='';$('refresh').disabled=true;render();
  try{
    const r=await fetch(SOURCE,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(20000)});
    if(!r.ok)throw new Error(`Réponse HTTP ${r.status}.`);
    if(new URL(r.url).origin!=='https://www.canada.ca')throw new Error('Redirection inattendue de la source.');
    const fresh=parseSource(await r.text());
    await chrome.storage.local.set({hsDataset:fresh});data=fresh;bundled=false;
  }catch(e){problem=`Actualisation impossible. ${e.name==='TimeoutError'?'Délai dépassé.':e.message}`;}
  finally{fetching=false;$('refresh').disabled=false;render();}
}
$('code').addEventListener('input',()=>{save();render();});$('origin').addEventListener('change',()=>{save();render();});$('refresh').addEventListener('click',refresh);
async function init(){
  try{
    const saved=await chrome.storage.local.get(['hsDataset','hsInput','hsOrigin','hsLanguage']);
    language=saved.hsLanguage==='en'?'en':'fr';localize();data=saved.hsDataset;
    if(!data){data=await (await fetch('snapshot.json')).json();bundled=true;}
    $('code').value=saved.hsInput||'';$('origin').value=saved.hsOrigin||'unknown';render();await refresh();
  }catch(e){problem=`Chargement impossible : ${e.message}`;$('status').textContent=t(problem,'Unable to load the data.');}
}


const labels={".eyebrow": ["IMPORTATION AU CANADA", "IMPORTING INTO CANADA"], "h1": ["Vérificateur de surtaxes", "Surtax checker"], ".scope": ["Contre-mesures sur les produits américains", "Countermeasures on U.S. products"], "label[for=\"origin\"]": ["Origine du produit", "Product origin"], "option[value=\"unknown\"]": ["À confirmer", "To be confirmed"], "option[value=\"us\"]": ["États-Unis", "United States"], "option[value=\"other\"]": ["Autre pays", "Other country"], "label[for=\"code\"]": ["Code HS / SH", "HS code"], ".hint": ["4 ou 6 chiffres : explorer · 8 ou 10 chiffres : article précis", "4 or 6 digits: explore · 8 or 10 digits: exact item"], ".source > summary": ["Source et actualisation", "Source and updates"], "#source": ["Consulter le tableau sur Canada.ca ↗", "View the table on Canada.ca (French) ↗"], "#refresh": ["Actualiser maintenant", "Refresh now"], "footer": ["Un code absent de cette liste ne signifie pas 0 % de droits. Les autres droits, exemptions, remises et conditions d’application ne sont pas calculés ici. L’origine ne correspond pas nécessairement au pays d’expédition.", "A code missing from this list does not mean 0% duty. Other duties, exemptions, remissions and conditions are not calculated here. Origin is not necessarily the country of shipment. Product descriptions are shown in their original French."]};
function localize(){
 document.documentElement.lang=language==='en'?'en-CA':'fr-CA';document.title=t('Vérificateur HS','HS checker');
 for(const [selector,values] of Object.entries(labels))document.querySelector(selector).textContent=t(...values);
 $('code').placeholder=t('Ex. : 9405.42.10','E.g. 9405.42.10');
 $('language').textContent=t('EN','FR');$('language').setAttribute('aria-label',t('Switch to English','Passer en français'));
}
$('language').addEventListener('click',()=>{language=language==='fr'?'en':'fr';localize();save();render();});

localize();init();
