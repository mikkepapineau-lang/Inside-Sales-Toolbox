'use strict';
// Injected in the currently authorized tab only after the user presses Analyze.
// Returns an allowlisted set of pricing-record fields, never a full page dump.
(() => {
  const FIELDS = [
    ['priceListName', 'Price List Name'],
    ['manufacturer', 'Manufacturer'],
    ['preferredSupplier', 'Preferred Supplier'],
    ['vendorNumber', 'Preferred Supplier D365 Vendor Number'],
    ['currency', 'Currency'],
    ['pricingSpecifications', 'Pricing Specifications'],
    ['costColumn', 'Price List Cost Column'],
    ['priceListLink', 'Price List Link'],
    ['effectiveDate', 'Price List Effective Date'],
    ['lastVerification', 'Price List Last Verification'],
    ['nextVerification', 'Price List Next Verification'],
    ['legalEntities', 'Applicable Legal Entities'],
    ['applicableSites', 'Applicable Sites'],
    ['tradeAgreement', 'D365 Trade Agreement'],
    ['activelyMonitored', 'Actively Monitored'],
    ['volumeDiscount', 'Volume Discount'],
    ['upcomingIncrease', 'Upcoming Increase'],
    ['transportation', 'Transportation'],
    ['warranty', 'Warranty'],
    ['otherInformation', 'Other Information']
  ];
  const idFromLabel = new Map(FIELDS.map(([id, label]) => [label.toLocaleLowerCase('en'), id]));
  const normalize = s => String(s || '').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  const trunc = (s,limit=5000) => String(s||'').trim().slice(0,limit);
  const text = e => trunc(e?.innerText || e?.textContent || '',8000);
  const out = {}, method={}, warnings=[];
  const forbidden = /^(?:javascript:|data:|file:)/i;
  const validHref = value => {
    const raw=String(value||'').trim();
    if(!raw || forbidden.test(raw))return '';
    try{const u=new URL(raw,location.href);return u.protocol==='https:'?u.href:'';}catch{return '';}
  };
  const labelNodes = document.querySelectorAll(
    '.test-id__field-label, .slds-form-element__label, lightning-output-field label, records-record-layout-item label, [data-field-label]'
  );
  const labels = new Map();
  // Prefer the Salesforce record field wrappers over raw document text.
  for(const node of labelNodes){
    const label = normalize(text(node)).replace(/:$/,'').toLocaleLowerCase('en');
    const id = idFromLabel.get(label);
    if(!id)continue;
    const wrap = node.closest('records-record-layout-item, .slds-form-element, lightning-output-field, .recordLayout, [data-field-label]') || node.parentElement?.parentElement;
    if(!wrap)continue;
    const value = wrap.querySelector('.test-id__field-value, .slds-form-element__static, .slds-form-element__control, [data-output-element-id], lightning-formatted-rich-text, lightning-formatted-text');
    let val = text(value);
    const source = value || wrap;
    if(!val && node.nextElementSibling)val=text(node.nextElementSibling);
    if(!val && node.parentElement?.nextElementSibling)val=text(node.parentElement.nextElementSibling);
    if(!val || normalize(val).toLocaleLowerCase('en')===label || val.length > 6000)continue;
    if(!out[id] || out[id].length<val.length){out[id]=trunc(val);method[id]='Champ Salesforce';}
    if(id==='priceListLink'){
      const url=[...source.querySelectorAll('a[href]')].map(a=>validHref(a.href)).find(h=>h.includes('sharepoint.com')) || validHref(val);
      if(url)out[id]=url;
    }
    labels.set(id,true);
  }
  // Secondary strategy: find a leaf text-node label and its nearest form field.
  // Most Salesforce Lightning templates include labels as simple spans.
  if(Object.keys(out).length < 6){
    const walker=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node,visits=0;
    while((node=walker.nextNode()) && visits++<35000){
      const raw=normalize(node.nodeValue).replace(/:$/,'');
      const id=idFromLabel.get(raw.toLocaleLowerCase('en'));
      if(!id || out[id])continue;
      const el=node.parentElement;
      if(!el || el.closest('script,style,nav,header,footer,[aria-hidden="true"]'))continue;
      const wrap=el.closest('records-record-layout-item,.slds-form-element,lightning-output-field') || el.parentElement?.parentElement;
      if(!wrap)continue;
      const value=wrap.querySelector('.test-id__field-value,.slds-form-element__static,.slds-form-element__control') || el.nextElementSibling || el.parentElement?.nextElementSibling;
      const val=text(value);
      if(val && normalize(val).toLocaleLowerCase('en')!==raw.toLocaleLowerCase('en') && val.length<6000){out[id]=val;method[id]='Champ adjacent';}
    }
  }
  // Final fallback: label-per-line layout. Only allowlisted sections are returned.
  // Never return document.body.innerText or user notes/chatter by accident.
  const bodyText=trunc(document.body?.innerText||'',220000);
  const lines=bodyText.replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
  const normalizedLines=lines.map(l=>normalize(l).replace(/:$/,'').toLocaleLowerCase('en'));
  const stopHeadings=new Set(['information','pricing','system information','price list contact','related','details','activity','chatter','post','follow','share an update','view all','sort by','vir/gir program','dealer registration','competitive flip','marketing development fund','jetbuilt access','demand management']);
  for(const [id,label] of FIELDS){
    if(out[id])continue;
    const needle=label.toLocaleLowerCase('en');
    // The exact label must have its own line to prevent picking up random content.
    const indexes=[];
    for(let i=0;i<normalizedLines.length;i++)if(normalizedLines[i]===needle)indexes.push(i);
    for(const start of indexes){
      const vals=[];
      for(let i=start+1;i<Math.min(lines.length,start+21);i++){
        const str=normalizedLines[i];
        if(idFromLabel.has(str)||stopHeadings.has(str))break;
        if(/^https?:\/\//i.test(lines[i]) && id!=='priceListLink' && vals.length>0)break;
        vals.push(lines[i]);
        if(vals.join('\n').length>4400)break;
        if(id!=='pricingSpecifications' && id!=='otherInformation' && id!=='transportation' && id!=='warranty' && id!=='volumeDiscount' && id!=='upcomingIncrease')break;
      }
      const value=trunc(vals.join('\n'));
      if(value){out[id]=value;method[id]='Texte visible';break;}
    }
  }
  // Salesforce Lightning may append a "Preview" affordance to linked record names.
  // Remove only that UI suffix, never arbitrary words in actual business names.
  for (const nameField of ['manufacturer','preferredSupplier']) {
    if (out[nameField]) out[nameField]=out[nameField].replace(/\s+Preview\s*$/i,'').trim();
  }
  // Empty Salesforce fields should remain absent. In some Lightning layouts the
  // fallback text scanner previously captured the NEXT unrelated field heading.
  const knownEmptyHeading = /^(?:VIR\/GIR Program|Dealer Registration|Competitive Flip|Marketing Development Fund|Jetbuilt Access|Price List Contact(?: \(.*\))?|System Information|Demand Management)$/i;
  for (const nameField of ['upcomingIncrease','nextVerification','volumeDiscount','transportation','warranty','otherInformation']) {
    if (out[nameField]) {
      const value=out[nameField].trim();
      if (knownEmptyHeading.test(value) || (nameField==='upcomingIncrease' && /^(?:VIR\/GIR Program|Dealer Registration|Competitive Flip)/i.test(value))) {
        delete out[nameField]; delete method[nameField];
      }
    }
  }
  // Prefer an actual link URL from the associated field (not other links).
  if(out.priceListLink){
    const linkMatch=out.priceListLink.match(/https:\/\/[^\s)]+/i);
    if(linkMatch)out.priceListLink=validHref(linkMatch[0]) || out.priceListLink;
  }
  // A record must look like a Price List. Do not read unrelated Salesforce pages.
  const evidence=['priceListName','pricingSpecifications','costColumn','priceListLink','effectiveDate'].filter(key=>out[key]);
  const isLikelyPriceList=evidence.length>=2 || (out.priceListName && out.manufacturer);
  if(!isLikelyPriceList){
    return {ok:false, reason:'La page ne ressemble pas à une fiche « Price List » du Procurement Portal. Ouvre une fiche fabricant et réessaie.', found:Object.keys(out).length, sourceTitle:document.title.slice(0,140)};
  }
  if(!out.pricingSpecifications)warnings.push('Pricing Specifications non trouvé : vérifier la section Pricing et son contenu.');
  if(!out.costColumn)warnings.push('Price List Cost Column non trouvé : aucune méthode de calcul à présumer.');
  if(!out.priceListLink)warnings.push('Price List Link non trouvé : la source SharePoint devra être vérifiée.');
  if(!out.lastVerification)warnings.push('Dernière vérification tarifaire non trouvée.');
  return {
    ok:true,sourceTitle:document.title.slice(0,140),
    fields:out,method,warnings,
    foundCount:Object.keys(out).length,
    // This is only the path origin, no Salesforce data attached to a remote URL.
    sourceSite:location.origin
  };
})();
