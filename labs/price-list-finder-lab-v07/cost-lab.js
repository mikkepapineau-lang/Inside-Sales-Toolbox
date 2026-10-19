'use strict';
/* LAB 0.7: local-only, read-only cost estimator. Explicit user selection,
   source replacement and category confirmation. Never writes to D365. */
const PriceLabCalc=(()=>{
  const $=id=>document.getElementById(id);
  const msg=(text,cls='')=>{const el=$('costStatus');el.textContent=text;el.className='notice '+cls;};
  const fmt=(n,currency)=>new Intl.NumberFormat('fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+(currency?' '+currency:' (devise à confirmer)');
  let portal=null,candidate=null,ruleMap=[],calculated=null,editing=false;
  const normalize=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  function portalCurrency(){return portal?.fields?.currency?.match(/\b(CAD|USD|EUR|GBP)\b/i)?.[1]?.toUpperCase()||'';}
  function extractStandardRules(raw){
    // Stop at RENTAL: never suggest conditional rental / volume discounts.
    const text=String(raw||'').replace(/\r/g,'');
    const primary=text.split(/\bDISCOUNT\s+FOR\s+RENTAL\b|\bRABAIS\s+LOCATION\b/i)[0];
    const lines=primary.split(/\n|(?<=:)\s*(?=\d+(?:[.,]\d+)?\s*%)/).map(s=>s.trim()).filter(Boolean);
    const rules=[];
    for(const line of lines){
      const match=line.match(/^(\d{1,2}(?:[.,]\d{1,2})?)\s*%\s*(.*)$/);
      if(!match)continue;
      const percentage=Number(match[1].replace(',','.'));
      if(!(percentage>=0&&percentage<100))continue;
      const tail=match[2].replace(/^[-:]\s*/,'').replace(/\s+/g,' ').trim();
      if(!tail || !/(DISCOUNT|RABAIS)/i.test(tail))continue;
      const tag=normalize(tail);
      const category=/(fog fluids?|liquides? a fumee)/i.test(tag)?'fog':/(generators?|generatrices?|accessories|accessoires)/i.test(tag)?'generator':null;
      rules.push({percentage,label:line.slice(0,180),category});
    }
    return rules.filter((r,i,a)=>a.findIndex(x=>x.percentage===r.percentage && x.label===r.label)===i);
  }
  function readNumber(s){
    let x=String(s??'').trim().replace(/[\u00a0\u202f\s$]/g,'');
    if(!/^[0-9.,]+$/.test(x))return null;
    const c=x.lastIndexOf(','),p=x.lastIndexOf('.');
    if(c>=0&&p>=0){if(c>p)x=x.replace(/\./g,'').replace(',','.');else x=x.replace(/,/g,'');}
    else if(c>=0){const parts=x.split(',');x=parts.length>2||parts.at(-1).length===3?x.replace(/,/g,''):x.replace(',','.');}
    const n=Number(x);return Number.isFinite(n)&&n>=0&&n<=1e9?n:null;
  }
  function clearSelection(message){
    candidate=null;calculated=null;
    $('costPublic').value='';$('costCurrency').value=portalCurrency();
    $('costProgram').value='';$('costCustom').value='';$('costCategory').value='';
    $('costConfirm').checked=false;
    $('costCandidate').textContent=message||'Aucune source active. Choisis un prix public Excel ou un PDF à vérifier.';
    $('costMatch').textContent='';recompute();
  }
  function setPortal(data){
    portal=data?.ok?data:null;
    const fields=portal?.fields||{};
    ruleMap=extractStandardRules(fields.pricingSpecifications);
    $('costSupplier').textContent=portal ? `Fiche active : ${fields.manufacturer || fields.priceListName || 'Fabricant non identifié'}` : 'Aucune fiche Procurement Portal analysée';
    $('costSourceRule').textContent=portal ? `Cost Column : ${fields.costColumn || 'non indiquée'} · Devise : ${fields.currency||'à vérifier'}` : 'Analyse une fiche Salesforce pour connaître les conditions tarifaires.';
    const select=$('costProgram');select.replaceChildren();
    select.add(new Option('Sélectionne un programme ou un rabais...', ''));
    for(const [i,r] of ruleMap.entries())select.add(new Option(`${r.percentage} % · ${r.label.replace(/^\d+(?:[.,]\d+)?\s*%\s*/,'')}`,String(i)));
    select.add(new Option('Aucun rabais (prix public)', 'none'));
    select.add(new Option('Rabais manuel, après vérification', 'manual'));
    $('costRentalNote').hidden=!/\bDISCOUNT\s+FOR\s+RENTAL\b|\bRABAIS\s+LOCATION\b/i.test(String(fields.pricingSpecifications||''));
    clearSelection('Nouvelle fiche Procurement Portal analysée : sélectionne à nouveau la source tarifaire. Les anciens calculs ont été effacés pour éviter les mélanges de fabricants.');
  }
  function sourceWarnings(){
    const arr=[];
    if(!candidate)return arr;
    const manufacturer=normalize(portal?.fields?.manufacturer||'');
    const file=normalize(candidate.file||'');
    if(manufacturer && !file.includes(manufacturer))arr.push('Le nom du fichier ne confirme pas le fabricant de la fiche (vérification manuelle nécessaire).');
    if(candidate.currency && portalCurrency() && candidate.currency!==portalCurrency())arr.push(`Devise fichier (${candidate.currency}) différente de la fiche (${portalCurrency()}).`);
    if(!candidate.currency)arr.push('Devise non indiquée dans la ligne Excel; valeur préremplie depuis la fiche à confirmer.');
    if(candidate.archived)arr.push('ATTENTION : fichier situé dans un dossier d’archives. Ne présume pas que le prix est courant.');
    if(candidate.kind==='pdf')arr.push('PDF : la page a été repérée, mais le prix doit être lu et saisi manuellement.');
    if(candidate.manualOverride)arr.push('Le prix Excel a été modifié : il est désormais considéré comme une saisie manuelle.');
    if(candidate.manualMapping)arr.push('Colonne C proposée d’après la structure MDG, non identifiée par un en-tête Public Price : vérification manuelle obligatoire.');
    return arr;
  }
  function updateSourceWarning(){
    $('costMatch').textContent=sourceWarnings().join(' ') || 'Confirme la catégorie, la liste courante, la devise, l’unité et la validité du tarif avant de copier.';
  }
  function setCandidate(args){
    candidate={...args,kind:'excel',manualOverride:false};
    $('costPublic').value=String(args.amount);
    $('costCurrency').value=args.currency||portalCurrency();
    $('costCategory').value='';$('costProgram').value='';$('costCustom').value='';$('costConfirm').checked=false;
    $('costCandidate').textContent=`SOURCE ACTIVE · EXCEL · SKU ${args.sku||'à vérifier'} · ${args.file} · ${args.sheet} · ligne ${args.row} · colonne ${args.col} (${args.type})${args.description?` · ${args.description}`:''}. Le prix ne sera utilisé que si tu confirmes la catégorie et la règle.`;
    updateSourceWarning();recompute();$('costPanel').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function setPdfReference(args){
    candidate={...args,kind:'pdf',manualOverride:true};
    $('costPublic').value='';$('costCurrency').value=portalCurrency();
    $('costCategory').value='';$('costProgram').value='';$('costCustom').value='';$('costConfirm').checked=false;
    $('costCandidate').textContent=`SOURCE ACTIVE · PDF (SAISIE MANUELLE) · SKU ${args.sku||'à vérifier'} · ${args.file} · page ${args.page}. Aucun montant PDF n’a été extrait comme prix : vérifie le document et entre toi-même le prix public.`;
    updateSourceWarning();recompute();$('costPanel').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function selectedRule(){
    const program=$('costProgram').value;
    if(program==='none')return {percentage:0,label:'Sans rabais',category:null};
    if(program==='manual')return {percentage:readNumber($('costCustom').value),label:'Rabais manuel (à confirmer)',category:null};
    if(/^\d+$/.test(program)&&ruleMap[Number(program)])return ruleMap[Number(program)];
    return null;
  }
  function recompute(){
    calculated=null;
    const amount=readNumber($('costPublic').value),currency=$('costCurrency').value.trim().toUpperCase();
    const rule=selectedRule(),cat=$('costCategory').value;
    $('costCustomWrap').hidden=$('costProgram').value!=='manual';
    if(amount===null || !rule || rule.percentage===null || !(rule.percentage>=0&&rule.percentage<100)){
      $('costResult').textContent='À calculer';$('costFormula').textContent='Sélectionne une source, un montant et une règle.';
      msg('En attente d’un prix public et d’une règle explicite.','');return;
    }
    const cents=Math.round((amount+Number.EPSILON)*100);
    const result=Math.round(cents*(100-rule.percentage)/100)/100;
    $('costResult').textContent=fmt(result,currency);
    $('costFormula').textContent=`${fmt(amount,currency)} × (1 − ${rule.percentage} %) = ${fmt(result,currency)} · ${rule.label}`;
    const alerts=[];
    if(!portal)alerts.push('Aucune fiche Procurement Portal active.');
    if(!candidate)alerts.push('Aucune source de prix explicitement sélectionnée.');
    if(!/^(CAD|USD|EUR|GBP)$/.test(currency))alerts.push('Devise non confirmée.');
    if(candidate?.currency && currency!==candidate.currency)alerts.push('Devise sélectionnée différente de celle du fichier, sans conversion prise en charge.');
    if(portalCurrency() && currency!==portalCurrency())alerts.push('Devise sélectionnée différente de la fiche Procurement Portal.');
    if(rule.category && (!cat || rule.category!==cat))alerts.push('Catégorie incompatible ou non confirmée pour ce rabais.');
    if(candidate?.kind==='excel'&&!candidate.manualOverride && Math.abs(amount-candidate.amount)>0.00001)alerts.push('Le prix a été modifié depuis la source Excel.');
    if(alerts.length){msg('ESTIMATION À VÉRIFIER : '+alerts.join(' '),'bad');return;}
    calculated={result,currency,source:candidate,rule};
    msg($('costConfirm').checked?'Calcul vérifié manuellement pour ce test. Ce n’est pas une validation du coût comptable D365.':'ESTIMATION NON VALIDÉE : vérifie catégorie, source, devise et conditions.',''+($('costConfirm').checked?'ok':'bad'));
  }
  // Any manual edit invalidates the prior confirmation and updates provenance.
  $('costPublic').addEventListener('input',()=>{
    if(candidate?.kind==='excel'){
      const typed=readNumber($('costPublic').value);
      candidate.manualOverride=typed===null||Math.abs(typed-candidate.amount)>0.00001;
      updateSourceWarning();
    }
    $('costConfirm').checked=false;recompute();
  });
  for(const id of ['costCurrency','costCustom'])$(id).addEventListener('input',()=>{$('costConfirm').checked=false;recompute();});
  for(const id of ['costProgram','costCategory'])$(id).addEventListener('change',()=>{$('costConfirm').checked=false;recompute();});
  $('costConfirm').addEventListener('change',recompute);
  $('costClear').addEventListener('click',()=>clearSelection());
  $('costCopy').addEventListener('click',async()=>{
    recompute();
    if(!$('costConfirm').checked||!calculated){msg('Copie bloquée : confirme une source, la devise, la catégorie applicable et les conditions avant de copier.','bad');return;}
    try{await navigator.clipboard.writeText(calculated.result.toFixed(2));msg('Coût estimé copié. Valide-le avant saisie dans D365.','ok');}
    catch{msg('Edge n’a pas autorisé la copie.','bad');}
  });
  clearSelection();
  return {setPortal,setCandidate,setPdfReference,clearSelection,extractStandardRules};
})();
