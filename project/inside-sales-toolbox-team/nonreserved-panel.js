(()=>{
 const el=id=>document.getElementById(id),{node}=ToolboxList,M=ToolboxNonReserved,N=ToolboxUsedCatalogue.number;
 let data=null,status={},busy=false,cancelled=false,limit=80,loadId=0,index=[],filterState={},filtersTouched=false;
 const controls=['query','entity','site','warehouse','manufacturer','category','category1','category2','category3','category4'];
 function filterValues(){return {...Object.fromEntries(controls.map(k=>[k,el('nonreserved-'+k).value])),available:el('nonreserved-available').checked};}
 function applyFilters(value){filterState=value&&typeof value==='object'?value:{};for(const key of controls)el('nonreserved-'+key).value=typeof filterState[key]==='string'?filterState[key]:'';el('nonreserved-available').checked=!!filterState.available;}
 function saveFilters(){filtersTouched=true;filterState=filterValues();return chrome.storage.local.set({toolboxNonReservedFilters:filterState}).catch(()=>{});}
 const date=at=>new Intl.DateTimeFormat(document.documentElement.lang==='en-CA'?'en-CA':'fr-CA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(at));
 const money=value=>{const number=N(value);if(number===null)return value||'Non renseigné';return new Intl.NumberFormat(document.documentElement.lang==='en-CA'?'en-CA':'fr-CA',data.currency?{style:'currency',currency:data.currency}:{minimumFractionDigits:2,maximumFractionDigits:2}).format(number);};
 function render(){
  const root=el('nonreserved-results');root.replaceChildren();const loading=busy||status.state==='loading';
  el('nonreserved-refresh').disabled=loading;el('nonreserved-import').disabled=loading;el('nonreserved-stop').hidden=!loading;
  el('nonreserved-refresh').textContent=loading?'Actualisation en cours…':'Actualiser par Excel';el('nonreserved-status').textContent=status.message||'';
  el('nonreserved-status').dataset.state=status.state||'idle';el('nonreserved-time').textContent=data?'Dernier import Excel : '+date(data.importedAt||data.at):'Aucun export Non-Reserved importé.';
  el('nonreserved-currency').textContent=data?.currency||'Devise non renseignée';
  if(!data){el('nonreserved-count').textContent='';root.append(node('p','muted','Actualise par Excel ou importe un fichier Non-Reserved pour commencer.'));el('nonreserved-more').hidden=true;return;}
  const cols=M.indexes(data.headers),get=(r,key)=>String(cols[key]>=0?r.values[cols[key]]??'':'');
  const query=M.norm(el('nonreserved-query').value),available=el('nonreserved-available').checked;
  const active=controls.slice(1).filter(key=>el('nonreserved-'+key).value).length;el('nonreserved-filter-count').textContent=active?'· '+active+' actif(s)':'';
  const filtered=index.filter(x=>(!query||x.search.includes(query))&&(!available||x.quantity>0)&&controls.slice(1).every(key=>!el('nonreserved-'+key).value||get(x.row,key)===el('nonreserved-'+key).value));
  const groups=new Map();for(const {row,i}of filtered){const key=get(row,'item')?'item:'+get(row,'item'):'row:'+i;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
  el('nonreserved-count').textContent=groups.size+' article(s) · '+filtered.length+' / '+data.rows.length+' ligne(s)';el('nonreserved-more').hidden=groups.size<=limit;
  for(const rows of [...groups.values()].slice(0,limit)){
   const first=rows[0],card=node('article','product-card'),heading=node('div','product-card-heading');heading.append(node('h3','product-sku source-value',get(first,'sku')||get(first,'item')));card.append(heading,node('p','product-meta source-value',[get(first,'manufacturer'),get(first,'item')?'D365 '+get(first,'item'):''].filter(Boolean).join(' · ')));
   if(get(first,'description'))card.append(node('p','product-description source-value',get(first,'description')));
   const stocks=node('div','product-warehouses');
   for(const row of rows){
    const block=node('section','product-warehouse'),h=node('div','product-warehouse-heading'),q=N(get(row,'quantity')),stock=node('div','stock-quantity '+(q===null?'is-unverified':q>0?'is-available':'is-empty'));
    stock.append(node('strong','source-value',q===null?'?':get(row,'quantity')),node('span','stock-quantity-label',q===null?'À vérifier':'Qté'));h.append(node('h4','source-value',[get(row,'warehouse')||'Entrepôt non renseigné',get(row,'entity'),get(row,'site')].filter(Boolean).join(' · ')),stock);block.append(h);
    block.append(node('p','product-location source-value',[get(row,'entity'),get(row,'site')].filter(Boolean).join(' · ')));
    const dl=node('dl','product-metrics product-warehouse-metrics'),pair=node('div','');pair.append(node('dt','','Coût moy.'),node('dd','source-value',money(get(row,'cost'))));dl.append(pair);block.append(dl);stocks.append(block);
   }card.append(stocks);
   const details=node('details','product-details');details.append(node('summary','','Toutes les informations · '+rows.length+' ligne(s)'));const source=node('div','product-source-lines');
   rows.forEach((row,i)=>{const section=node('section','product-source-line');section.append(node('h4','source-value',[get(row,'entity'),get(row,'site'),get(row,'warehouse')].filter(Boolean).join(' · ')||'Ligne source '+(i+1)));const dl=node('dl','product-all-values');data.headers.forEach((label,j)=>{const pair=node('div','');pair.append(node('dt','',label),node('dd','source-value',row.values[j]||'Non renseigné'));dl.append(pair);});section.append(dl);source.append(section);});details.append(source);card.append(details);root.append(card);
  }
  if(!filtered.length)root.append(node('p','muted','Aucun article ne correspond aux filtres locaux.'));
 }
 function install(catalogue){
  data=catalogue;const cols=data?M.indexes(data.headers):{};index=(data?.rows||[]).map((row,i)=>({row,i,search:M.norm(row.values.join(' ')),quantity:N(row.values[cols.quantity])}));
  for(const key of controls.slice(1)){const select=el('nonreserved-'+key),selected=select.value;select.replaceChildren(node('option','','Tous'));select.children[0].value='';const values=data&&cols[key]>=0?[...new Set(data.rows.map(r=>r.values[cols[key]]).filter(Boolean))].sort((a,b)=>a.localeCompare(b)):[];for(const value of values){const option=node('option','source-value',value);option.value=value;select.append(option);}select.disabled=!values.length;if(values.includes(selected))select.value=selected;else select.value='';}
  el('nonreserved-source').textContent=data?.filters||'';applyFilters(filterState);limit=80;render();
 }
 async function reload(){const id=++loadId;try{const value=await ToolboxNonReservedStore.get();if(id===loadId)install(value||null);}catch(e){if(id===loadId){status={state:'error',message:e.message};render();}}}
 async function command(kind,payload={}){const result=await chrome.runtime.sendMessage({kind,...payload});if(result?.error)throw Error(result.error);return result?.value;}
 async function refresh(file){
  if(busy||status.state==='loading')return;busy=true;cancelled=false;status={state:'loading',message:file?'Lecture du fichier Non-Reserved…':'Préparation de l’export Non-Reserved…'};render();
  try{
   let receipt;
   if(!file){receipt=await command('nonReservedExport');if(!receipt?.base64||receipt.base64.length>35000000)throw Error('Le fichier Excel Non-Reserved n’a pas été reçu.');const bytes=Uint8Array.from(atob(receipt.base64),c=>c.charCodeAt(0)),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');if(bytes.length!==receipt.size||hash!==receipt.sha256)throw Error('L’empreinte du fichier Non-Reserved ne correspond pas.');file=new File([bytes],'Non-Reserved.xlsx');}
   const parsed=await ToolboxUsedExcel.read(file,'nonreserved');if(cancelled)throw Error('Actualisation Non-Reserved arrêtée.');
   const result=await command('nonReservedImport',{data:parsed,...(receipt?{exportId:receipt.exportId,sha256:receipt.sha256}:{manual:true})});status={state:'done',message:'Catalogue Non-Reserved importé : '+result.count+' lignes.'};await reload();
  }catch(e){status={state:'error',message:e.message};await chrome.storage.local.set({toolboxNonReservedStatus:status}).catch(()=>{});}
  finally{busy=false;el('nonreserved-file').value='';render();}
 }
 let queryTimer;el('nonreserved-query').oninput=()=>{clearTimeout(queryTimer);saveFilters();queryTimer=setTimeout(()=>{limit=80;render();},120);};
 for(const key of controls.slice(1))el('nonreserved-'+key).onchange=()=>{saveFilters();limit=80;render();};el('nonreserved-available').onchange=()=>{saveFilters();limit=80;render();};
 el('nonreserved-filter-reset').onclick=()=>{for(const key of controls.slice(1))el('nonreserved-'+key).value='';saveFilters();limit=80;render();};
 el('nonreserved-more').onclick=()=>{limit+=80;render();};el('nonreserved-refresh').onclick=()=>refresh();el('nonreserved-import').onclick=()=>el('nonreserved-file').click();el('nonreserved-file').onchange=()=>{const file=el('nonreserved-file').files?.[0];if(file)return refresh(file);};
 el('nonreserved-stop').onclick=async()=>{cancelled=true;try{await command('nonReservedStop');}catch(e){status={state:'error',message:e.message};render();}};
 el('nonreserved-open').onclick=async()=>{try{await command('nonReservedOpen');}catch(e){status={state:'error',message:e.message};render();}};
 el('nonreserved-url-save').onclick=async()=>{try{await command('nonReservedSetURL',{url:el('nonreserved-url').value.trim()});el('nonreserved-url-status').textContent='Lien du rapport enregistré.';}catch(e){el('nonreserved-url-status').textContent=e.message;}};
 chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;if(changes.toolboxNonReservedStatus){status=changes.toolboxNonReservedStatus.newValue||{};render();}if(changes.toolboxNonReservedFilters&&JSON.stringify(changes.toolboxNonReservedFilters.newValue)!==JSON.stringify(filterState)){filtersTouched=true;applyFilters(changes.toolboxNonReservedFilters.newValue);limit=80;render();}if(changes.toolboxNonReservedStamp)reload();if(changes.toolboxLanguage)render();});
 command('nonReservedInit').then(()=>chrome.storage.local.get(['toolboxNonReservedStatus','toolboxNonReservedReportURL','toolboxNonReservedFilters'])).then(saved=>{if(!filtersTouched)applyFilters(saved.toolboxNonReservedFilters);status=saved.toolboxNonReservedStatus||{};el('nonreserved-url').value=saved.toolboxNonReservedReportURL||M.reportURL;return reload();}).catch(e=>{status={state:'error',message:e.message};render();});
})();
