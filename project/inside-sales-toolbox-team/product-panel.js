(()=>{
 const el=id=>document.getElementById(id);let current=null;
 function render(r){
  current=r;el('product-status').textContent=r?.message||'Sélectionne un SKU sur une page, puis clic droit → Rechercher dans D365.';el('product-status').hidden=r?.state==='done';
  el('product-submit').disabled=r?.state==='loading';el('product-open').hidden=!r?.tabId;
  if(r?.query&&document.activeElement!==el('product-query'))el('product-query').value=r.query;
  const root=el('product-results');root.replaceChildren();if(r?.state!=='done')return;
  if(!r.rows.length){root.textContent='Aucun produit retourné par D365.';return;}
  const note=document.createElement('p');note.className='muted';note.setAttribute('role','status');root.append(note);
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const headers=r.headers.map(normalize);
  const index=pattern=>{const matches=headers.map((v,i)=>pattern.test(v)?i:-1).filter(i=>i>=0);return matches.length===1?matches[0]:-1;};
  const columns={sku:index(/^(productname|nomduproduit)$/),item:index(/^(itemnu|itemnumber|numerodarticle|numerodart)/),brand:index(/^(manufacturer|fabricant)$/),description:index(/^(description)$/),warehouse:index(/^(warehouse|entrepot)$/),location:index(/^(location|emplacement)$/),available:index(/^(availablephysical|disponiblephysique|physiquedisponible)/),physical:index(/^(physicalinventory|inventairephysique|stockphysique)$/),reserved:index(/^(physicalreserved|physiquereserve|reservephysique)$/),ordered:index(/^(orderedintotal|commandetotal|totalcommande)$/),onOrder:index(/^(onorder|encommande)$/),orderedReserved:index(/^(orderedreser|commandereserve|reservecommande)/)};
  const get=(row,key)=>columns[key]>=0?row[columns[key]]||'':'';
  // Exclude these codes before grouping, badges and source details, including cached results.
  const excluded=new Set(['mtl06','yul99']);
  r={...r,rows:r.rows.filter(row=>!['warehouse','location'].some(key=>excluded.has(normalize(get(row,key)))))};
  if(!r.rows.length){note.remove();root.textContent='Aucun produit à afficher après exclusion de MTL-06 et YUL-99.';return;}
  function node(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
  function number(value){if(!value.trim())return null;const cleaned=value.replace(/[ \u00a0\u202f]/g,'');if(!/^-?\d+(?:[.,]\d+)?$/.test(cleaned))return null;return Number(cleaned.replace(',','.'));}
  const available=row=>columns.available<0?null:number(get(row,'available'))??(get(row,'available').trim()?null:0);
  function stockQuantity(row){
   const q=available(row),box=node('div','stock-quantity '+(q>0?'is-available':q===null?'is-unverified':'is-empty'));
   box.append(node('strong','source-value',q===null?'?':get(row,'available')||'0'),node('span','stock-quantity-label',q===null?'À vérifier':'Dispo.'));return box;
  }
  const groups=new Map();
  r.rows.forEach((row,i)=>{const item=get(row,'item').trim();const key=item?'item:'+item:'unidentified:'+i;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);});
  note.textContent=groups.size+' article(s) · '+r.rows.length+' ligne(s) D365 affichée(s)';
  const list=node('div','product-card-list');
  for(const rows of groups.values()){
   const row=rows[0],card=node('article','product-card');
   const sku=get(row,'sku')||get(row,'item')||'Article D365';
   const heading=node('div','product-card-heading');heading.append(node('h3','product-sku',sku));
   const quantities=rows.map(available),positive=quantities.some(q=>q!==null&&q>0),uncertain=quantities.some(q=>q===null),onOrder=rows.some(row=>number(get(row,'onOrder'))>0);
   const stockState=positive?'En stock':uncertain?'À vérifier':onOrder?'En commande':'Indisponible';
   card.dataset.stock=positive?'available':uncertain?'unverified':onOrder?'ordered':'empty';
   heading.append(node('span','product-stock-badge'+(positive?' product-stock-positive':onOrder?' product-stock-ordered':''),stockState));card.append(heading);
   const meta=[get(row,'brand'),get(row,'item')?'Article '+get(row,'item'):'Numéro D365 non renseigné'].filter(Boolean).join(' · ');card.append(node('p','product-meta',meta));
   if(get(row,'description'))card.append(node('p','product-description',get(row,'description')));
   const stockKeys=['available','physical','reserved','onOrder','ordered','orderedReserved'];
   const activeRows=rows.filter(stockRow=>stockKeys.some(key=>{const value=get(stockRow,key).trim();return value!==''&&number(value)!==0;}));
   const warehouses=new Map();for(const itemRow of activeRows){const warehouse=get(itemRow,'warehouse').trim()||'Entrepôt non renseigné';if(!warehouses.has(warehouse))warehouses.set(warehouse,[]);warehouses.get(warehouse).push(itemRow);}
   const stocks=node('div','product-warehouses');
   const sortedWarehouses=[...warehouses].sort((a,b)=>Number(b[1].some(row=>available(row)>0))-Number(a[1].some(row=>available(row)>0)));
   for(const [warehouse,warehouseRows] of sortedWarehouses){
    const block=node('section','product-warehouse');
    const warehouseHeading=node('div','product-warehouse-heading');warehouseHeading.append(node('h4','source-value',warehouse));if(warehouseRows.length===1)warehouseHeading.append(stockQuantity(warehouseRows[0]));block.append(warehouseHeading);
    warehouseRows.forEach((stockRow,i)=>{
     const line=node('div','product-warehouse-line');const location=get(stockRow,'location');if(location||warehouseRows.length>1){const lineHeading=node('div','product-location-heading');lineHeading.append(node('p','product-location',location?'Emplacement : '+location:'Ligne D365 '+(i+1)+' · emplacement non renseigné'));if(warehouseRows.length>1)lineHeading.append(stockQuantity(stockRow));line.append(lineHeading);}
     const metrics=node('dl','product-metrics product-warehouse-metrics');
     const measures=[['physical','Inventaire physique'],['reserved','Réservé physique'],['onOrder','En commande']];
     if(columns.ordered>=0)measures.push(['ordered','Commandé au total']);if(columns.orderedReserved>=0)measures.push(['orderedReserved','Commandé réservé']);
     for(const [key,label] of measures){const value=get(stockRow,key);if(!value.trim()||number(value)===0)continue;const box=node('div','');box.append(node('dt','',label),node('dd','source-value',value));metrics.append(box);}line.append(metrics);block.append(line);
    });stocks.append(block);
   }if(warehouses.size)card.append(stocks);else card.append(node('p','product-no-stock','Aucune quantité en stock, réservée ou en commande sur les lignes chargées.'));
   const details=node('details','product-details');details.append(node('summary','','Toutes les informations · '+rows.length+' ligne(s)'));const values=node('div','product-source-lines');
   rows.forEach((sourceRow,i)=>{const section=node('section','product-source-line');section.append(node('h4','',get(sourceRow,'warehouse')||'Ligne D365 '+(i+1)));const fields=node('dl','product-all-values');r.headers.forEach((label,j)=>{const pair=node('div','');pair.append(node('dt','',label),node('dd',sourceRow[j]?'':stockKeys.some(key=>columns[key]===j)?'':'product-missing',sourceRow[j]||(stockKeys.some(key=>columns[key]===j)?'0':'Non renseigné')));fields.append(pair);});section.append(fields);values.append(section);});details.append(values);card.append(details);list.append(card);
  }
  root.append(list);
  globalThis.ToolboxMotion?.results(root);
 }
 el('product-form').onsubmit=async e=>{e.preventDefault();const text=el('product-query').value.trim();if(!text)return;el('product-submit').disabled=true;try{const r=await chrome.runtime.sendMessage({kind:'productSearch',text});if(r?.error)el('product-status').textContent=r.error;}catch(e){el('product-status').textContent=e.message;}finally{el('product-submit').disabled=false;}};
 el('product-open').onclick=async()=>{if(current?.tabId){try{const t=await chrome.tabs.update(current.tabId,{active:true});await chrome.windows.update(t.windowId,{focused:true});}catch{el('product-status').textContent='L’onglet D365 a été fermé. Relance la recherche.';}}};
 chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.toolboxProductSearch)render(changes.toolboxProductSearch.newValue);});
 chrome.storage.local.get('toolboxProductSearch').then(s=>render(s.toolboxProductSearch));
})();
