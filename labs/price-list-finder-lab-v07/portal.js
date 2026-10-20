'use strict';
(() => {
  const el=id=>document.getElementById(id);
  const btn=el('analyzePortal'),status=el('portalStatus'),panel=el('portalResults');
  const sourceTabId=Number(new URLSearchParams(location.search).get('sourceTabId'));
  const validId=Number.isSafeInteger(sourceTabId) && sourceTabId>0;
  const fields=[
    ['priceListName','Nom de la liste'],
    ['manufacturer','Fabricant'],
    ['preferredSupplier','Fournisseur privilégié'],
    ['vendorNumber','Numéro fournisseur D365'],
    ['currency','Devise'],
    ['pricingSpecifications','Pricing Specifications'],
    ['costColumn','Price List Cost Column'],
    ['priceListLink','Lien SharePoint'],
    ['effectiveDate','Date d’entrée en vigueur'],
    ['lastVerification','Dernière vérification'],
    ['nextVerification','Prochaine vérification'],
    ['legalEntities','Entités légales'],
    ['applicableSites','Sites applicables'],
    ['tradeAgreement','D365 Trade Agreement'],
    ['activelyMonitored','Actively Monitored'],
    ['volumeDiscount','Volume Discount'],
    ['upcomingIncrease','Upcoming Increase'],
    ['transportation','Transportation'],
    ['warranty','Warranty'],
    ['otherInformation','Other Information']
  ];
  const setStatus=(str,type='')=>{status.textContent=str;status.className=`notice ${type}`;};
  const val=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
  function show(data){
    panel.hidden=false;
    PriceLabCalc.setPortal(data);
    const manufacturer=String(data.fields?.manufacturer||'').trim();
    // Each analysis may target a different supplier; never retain the old brand.
    if(manufacturer) el('brand').value=manufacturer;
    const grid=el('portalFields');grid.replaceChildren();
    el('portalCount').textContent=`${data.foundCount} champ(s)`;
    el('portalPage').textContent=data.sourceTitle||'Fiche Salesforce';
    for(const [key,label] of fields){
      const raw=data.fields[key];
      const article=val('div',`portal-field${raw?'':' portal-missing'}`);
      const heading=val('div','portal-label',label);
      const value=val('div','portal-value',raw||'Non détecté');
      if(raw && key==='priceListLink' && /^https:\/\//i.test(raw)){
        const link=document.createElement('a');link.href=raw;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Ouvrir le lien SharePoint ↗';
        value.append(document.createElement('br'),link);
      }
      article.append(heading,value);
      if(raw){const method=val('div','portal-method',data.method[key]||'');article.append(method);}
      grid.append(article);
    }
    const w=el('portalWarnings');w.replaceChildren();
    if(data.warnings.length){for(const msg of data.warnings)w.append(val('p','',msg));w.hidden=false;}else w.hidden=true;
    el('portalDisclosure').textContent='Résultat non enregistré. Les remises et conditions doivent être confirmées avant tout calcul. « Discount for Rental » ne doit pas être appliqué automatiquement aux ventes régulières.';
    el('copyPortalDiagnostic').disabled=false;
    const keys=Object.keys(data.fields);
    el('copyPortalDiagnostic').onclick=async()=>{
      // No prices, discount rates, supplier names, URLs or confidential field values.
      const msg=`Price List Finder LAB 0.7 - Diagnostic sans valeurs\nPage analysée : ${data.ok?'oui':'non'}\nChamps détectés (${keys.length}) : ${keys.join(', ')}\nChamps non détectés : ${fields.map(f=>f[0]).filter(k=>!keys.includes(k)).join(', ')||'aucun'}\nAvertissements : ${data.warnings.join(' | ')||'aucun'}`;
      try{await navigator.clipboard.writeText(msg);el('copyPortalDiagnostic').textContent='Diagnostic copié';}
      catch{el('copyPortalDiagnostic').textContent='Copie indisponible';}
    };
  }
  btn.disabled=!validId;
  if(!validId){setStatus('Ouvre d’abord la fiche MDG dans le Procurement Portal Salesforce, puis clique sur l’icône de cette extension depuis cet onglet.','bad');return;}
  setStatus('Onglet source repéré. Clique sur « Analyser la fiche Salesforce » pour lire uniquement les champs nécessaires.');
  btn.addEventListener('click',async()=>{
    btn.disabled=true;panel.hidden=true;setStatus('Lecture ponctuelle de la fiche en cours…');
    try{
      const tab=await chrome.tabs.get(sourceTabId);
      if(!/^https?:\/\//i.test(tab.url||''))throw Error('L’onglet source n’est pas une page web accessible.');
      const result=await chrome.scripting.executeScript({target:{tabId:sourceTabId},files:['portal-extractor.js']});
      const data=result?.[0]?.result;
      if(!data?.ok){setStatus(data?.reason || 'Aucune donnée structurée trouvée sur cette page. Vérifie que la fiche « Price List » est ouverte et complètement chargée.','bad');return;}
      show(data);
      setStatus(`${data.foundCount} champ(s) reconnu(s) · Extraction en lecture seule · Aucun envoi réseau.`,data.foundCount>=7?'ok':'');
    }catch(error){
      const msg=String(error?.message||error);
      const help=/permission|cannot access|cannot be scripted|missing host permission/i.test(msg)
        ? 'La permission temporaire sur l’onglet source a expiré ou Edge bloque cette page. Reviens à la fiche Salesforce, clique de nouveau sur l’icône de l’extension et refais le test.'
        : 'Impossible de lire la fiche : '+msg;
      setStatus(help,'bad');
    }finally{btn.disabled=false;}
  });
})();
