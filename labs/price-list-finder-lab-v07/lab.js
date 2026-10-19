'use strict';
const $=(x)=>document.querySelector(x);
const supported=new Set(['xlsx','xlsm','csv']);
const RE_ARCHIVE=/(^|\/)(archived|archives?|archivées?|archivés?)(\/|$)/i;
const MAX_ENTRIES=16000,MAX_SEARCH=200,MAX_RESULTS=120;
let root=null,entries=[],scanErrors=0,cancelled=false,running=false;
const extOf=n=>n.split('.').pop().toLowerCase();
const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('fr-CA').replace(/[\s._\-]/g,'');
const fmt=n=>new Intl.NumberFormat('fr-CA').format(n);
const isArchive=path=>RE_ARCHIVE.test(`/${path}/`);
function setInfo(id,text,kind=''){const el=$(id);el.textContent=text;el.className=`notice ${kind}`;}
function show(el,show=true){$(el).hidden=!show;}
async function enumerate(handle,prefix,state){
  try{
    for await(const h of handle.values()){
      state.visited++;
      if(state.visited>MAX_ENTRIES){state.stopped=true;return;}
      const path=prefix?`${prefix}/${h.name}`:h.name;
      if(h.kind==='directory'){
        await enumerate(h,path,state);
        if(state.stopped)return;
      }else if(h.kind==='file' && !h.name.startsWith('~$')){
        const ext=extOf(h.name);
        if(supported.has(ext)||ext==='pdf'||ext==='xls'||ext==='xlsb')entries.push({path,handle:h,ext,archived:isArchive(path)});
      }
    }
  }catch(err){scanErrors++;}
}
function counts(){
  const n=e=>entries.filter(e);
  $('#currentCount').textContent=fmt(n(x=>supported.has(x.ext)&&!x.archived).length);
  $('#archiveCount').textContent=fmt(n(x=>supported.has(x.ext)&&x.archived).length);
  $('#pdfCount').textContent=fmt(n(x=>x.ext==='pdf').length);
  $('#errCount').textContent=fmt(scanErrors);
  show('#metrics');
}
$('#choose').addEventListener('click',async()=>{
  if(running)return;
  if(!window.showDirectoryPicker){setInfo('#folderStatus','Sélection de dossier non prise en charge sur cet Edge.','bad');return;}
  try{
    const handle=await showDirectoryPicker({id:'solotech-price-list-lab-v02',mode:'read'});
    root=handle;entries=[];scanErrors=0;cancelled=false;PriceLabCalc.clearSelection('Dossier changé : sélectionne de nouveau une source tarifaire.');
    $('#choose').disabled=true;
    $('#folder').textContent=`Dossier sélectionné : ${handle.name}`;
    setInfo('#folderStatus','Inventaire des dossiers en cours…');
    const state={visited:0,stopped:false};
    await enumerate(handle,'',state);
    counts();
    const n=entries.filter(f=>(supported.has(f.ext)||f.ext==='pdf')&&!f.archived).length;
    $('#search').disabled=n===0;
    setInfo('#folderStatus',`${fmt(state.visited)} éléments parcourus · ${fmt(n)} fichiers Excel/CSV/PDF courants.${state.stopped?' Limite de 16 000 éléments atteinte.':''}${scanErrors?` ${scanErrors} sous-dossier(s) inaccessible(s).`:''}`,(scanErrors||state.stopped)?'bad':'ok');
    show('#resultPanel',false);
  }catch(err){if(err.name!=='AbortError')setInfo('#folderStatus',`Impossible de choisir le dossier : ${err.name}: ${err.message}`,'bad');}
  finally{$('#choose').disabled=false;}
});
const newEl=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function clear(el){el.replaceChildren();}
function appendMatch(m,file){
  const node=newEl('article',`resultItem${file.archived?' archived':''}`);
  const top=newEl('div','itemTop');const left=newEl('div');
  left.append(newEl('div','fileTitle',file.path.split('/').at(-1)),newEl('div','filePath',file.path));
  const tag=newEl('span',`tag${file.archived?' archive':m.kind!=='exact'?' partial':''}`,file.archived?'ARCHIVES':m.kind==='exact'?'SKU EXACT':m.kind==='normalized'?'SKU NORMALISÉ':'SKU DANS LE TEXTE');
  top.append(left,tag);node.append(top);
  node.append(newEl('div','resultMeta',`${m.fileType} · ${m.sheet} · Ligne ${m.row}${m.headerRow?` · En-têtes possibles ligne ${m.headerRow}`:''}`));
  const p=PriceExtractor.identify(m.cells);
  // MDG list observed in production: column A = SKU, B = description,
  // C = numeric list price. This is only a suggested cell, never an
  // automatic classification as Retail/Public or an official cost.
  const isMdg=/\bmdg\b/i.test(file.path.replace(/[\/_-]/g,' '));
  const mdgCols=Object.fromEntries(m.cells.filter(c=>['A','B','C'].includes(c.col)).map(c=>[c.col,c]));
  const cNum=mdgCols.C?PriceExtractor.numberOf(mdgCols.C.value):null;
  const manualMdgPrice=!!(isMdg && !p.data.retail.length && m.cells.length<=4 &&
    mdgCols.A && mdgCols.B && mdgCols.C && cNum!==null &&
    norm(mdgCols.A.value)===norm($('#sku').value.trim()) &&
    PriceExtractor.numberOf(mdgCols.B.value)===null);
  if(p.primary || p.data.dealer.length || p.data.solotech.length || p.data.terms.length || p.data.retail.length || manualMdgPrice){
    const summary=newEl('section',`priceSummary${file.archived?' priceArchived':''}`);
    const eyebrow=newEl('div','priceEyebrow',file.archived?'PRIX HISTORIQUE · ARCHIVES':'PRIX CANDIDAT · NON VALIDÉ');summary.append(eyebrow);
    if(p.primary){
      const line=newEl('div','pricePrimary');
      const wrap=newEl('div');
      const label=p.primary.type==='solotech'?'Solotech Price':p.primary.type==='dealer'?'Dealer Price':'Coût potentiel';
      wrap.append(newEl('div','priceCaption',label),newEl('div','priceLarge',PriceExtractor.format(p.primary.amount,p.data.currency)));
      line.append(wrap);
      const copy=newEl('button','button ghost copyPrice','Copier le montant');copy.type='button';
      copy.addEventListener('click',async()=>{
        try{await navigator.clipboard.writeText(String(p.primary.amount));copy.textContent='Copié!';}
        catch{copy.textContent='Copie indisponible';}
      });
      line.append(copy);summary.append(line);
    }
    if(manualMdgPrice){
      const hint=newEl('div','priceCaution','MDG : structure candidate A = SKU, B = description, C = montant. Vérifie manuellement dans le fichier original que C est bien le prix public et que la devise est CAD.');
      summary.append(hint);
      const pick=newEl('button','button ghost copyPrice',`Vérifier et utiliser la colonne C (${PriceExtractor.format(cNum,p.data.currency||'CAD')})`);
      pick.type='button';
      pick.addEventListener('click',()=>PriceLabCalc.setCandidate({amount:cNum,currency:p.data.currency||'',file:file.path,sheet:m.sheet,row:m.row,col:'C',type:'Montant colonne C (prix public à confirmer)',sku:$('#sku').value.trim(),archived:file.archived,manualMapping:true,description:String(mdgCols.B.value)}));
      summary.append(pick);
    }
    // The user explicitly chooses to carry a PUBLIC/RETAIL price into the estimator.
    // Never forward Solotech/Dealer/MAP as if they were public prices.
    for(const retail of p.data.retail){
      const usePrice=newEl('button','button ghost copyPrice',`Utiliser prix public (${retail.col}) dans le calculateur`);
      usePrice.type='button';
      usePrice.addEventListener('click',()=>PriceLabCalc.setCandidate({amount:retail.amount,currency:p.data.currency,file:file.path,sheet:m.sheet,row:m.row,col:retail.col,type:retail.label,sku:$('#sku').value.trim(),archived:file.archived,description:m.cells.find(c=>/description/i.test(c.label||''))?.value||''}));
      summary.append(usePrice);
    }
    summary.append(newEl('div','priceCaution',p.message));
    const extras=newEl('div','priceExtras');
    for(const type of ['dealer','solotech','terms','map','retail']){
      for(const val of p.data[type]){
        if(p.primary?.col===val.col&&p.primary.type===type)continue;
        const label=type==='terms'?'Tarif soumis aux modalités':type==='dealer'?'Dealer Price':type==='solotech'?'Solotech Price':type==='map'?'MAP':'Retail';
        const item=newEl('div','priceExtra');item.append(newEl('span','',label),newEl('strong','',PriceExtractor.format(val.amount,p.data.currency)));extras.append(item);
      }
    }
    if(extras.childElementCount)summary.append(extras);
    const metadata=[];
    if(p.data.currency)metadata.push(`Devise : ${p.data.currency}`);else metadata.push('Devise non détectée');
    if(p.data.uom)metadata.push(`Unité : ${p.data.uom}`);
    summary.append(newEl('div','priceMetadata',metadata.join(' · ')));
    node.append(summary);
  }

  const values=newEl('div','values');
  for(const c of m.cells){const cell=newEl('div','cell');cell.append(newEl('small','',`${c.col}${c.label?` · ${String(c.label).slice(0,90)}`:''}`),newEl('strong','',String(c.value).slice(0,500)));values.append(cell);}
  node.append(values);
  if(m.hiddenCells)node.append(newEl('div','headerHint',`${m.hiddenCells} autre(s) cellule(s) non affichée(s).`));
  node.append(newEl('div','headerHint','Vérifie les montants dans la liste originale : un prix candidat n’est pas un coût D365 confirmé.'));
  $('#results').append(node);
}
async function openLocalPdf(f){
  // Open an empty tab synchronously from the click (popup-blocker safe).
  const popup=window.open('about:blank','_blank');
  if(!popup){window.alert('Edge a bloqué la fenêtre PDF. Ouvre le fichier depuis OneDrive dans Windows.');return;}
  try{
    popup.opener=null;
    const file=await f.handle.getFile();const url=URL.createObjectURL(file);
    popup.location.replace(url);
    // Kept for the duration of the LAB session so the PDF viewer can finish reading.
  }catch(e){popup.close();window.alert(`Impossible d’ouvrir le PDF : ${e.message}`);}
}
function appendPdfMatch(m,file){
  const node=newEl('article',`resultItem pdfCandidate${file.archived?' archived':''}`);
  const top=newEl('div','itemTop'),left=newEl('div');
  left.append(newEl('div','fileTitle',file.path.split('/').at(-1)),newEl('div','filePath',file.path));
  top.append(left,newEl('span','tag partial',file.archived?'ARCHIVES · PDF':'PDF · SKU REPÉRÉ'));
  node.append(top,newEl('div','resultMeta',`PDF · Page ${m.page} · Extraction de texte expérimentale`));
  node.append(newEl('div','notice muted',`Contexte extrait : ${m.context.slice(0,460)}`));
  node.append(newEl('div','priceCaution','La mise en page du PDF n’est pas interprétée. Aucun montant à proximité du SKU n’est considéré comme son prix automatiquement.'));
  const actions=newEl('div','actions');
  const open=newEl('button','button ghost','Ouvrir le PDF');open.type='button';open.addEventListener('click',()=>openLocalPdf(file));
  const choose=newEl('button','button ghost','Référence PDF → calculateur');choose.type='button';
  choose.addEventListener('click',()=>PriceLabCalc.setPdfReference({file:file.path,page:m.page,sku:$('#sku').value.trim(),archived:file.archived}));
  actions.append(open,choose);node.append(actions);
  $('#results').append(node);
}
function updateProgress(done,total,label){$('#progressBar').style.width=`${total?Math.min(100,(done/total)*100):100}%`;$('#progressText').textContent=`${fmt(done)} / ${fmt(total)} fichier(s) parcouru(s)${label?` · ${label}`:''}`;}
$('#cancel').addEventListener('click',()=>{cancelled=true;$('#cancel').disabled=true;});
$('#search').addEventListener('click',async()=>{
  if(running||!root)return;
  const sku=$('#sku').value.trim(),brand=$('#brand').value.trim();
  if(sku.length<3||sku.length>120){window.alert('Entre un SKU de 3 à 120 caractères.');return;}
  const include=$('#archives').checked;
  const includePdf=$('#includePdf').checked;
  // When the user selects a manufacturer folder itself, its name is a valid brand filter.
  const rootIsBrand=brand&&norm(root.name).includes(norm(brand));
  const files=entries.filter(f=>{
    if(!(supported.has(f.ext)||(includePdf&&f.ext==='pdf'))||(!include&&f.archived))return false;
    if(!brand||rootIsBrand)return true;
    return f.path.split('/').slice(0,-1).some(seg=>norm(seg).includes(norm(brand)));
  }).sort((a,b)=>Number(a.archived)-Number(b.archived)||Number(a.ext==='pdf')-Number(b.ext==='pdf')||Number(!/revised|révis|updated|update|nouveau/i.test(a.path))-Number(!/revised|révis|updated|update|nouveau/i.test(b.path))||a.path.localeCompare(b.path,'fr'));
  if(!files.length){window.alert('Aucun fichier pris en charge pour ce fabricant. Vérifie le dossier, le filtre archives et la case PDF.');return;}
  PriceLabCalc.clearSelection('Nouvelle recherche : les références antérieures ont été effacées. Choisis un prix public dans les nouveaux résultats.');
  running=true;cancelled=false;$('#search').disabled=true;$('#choose').disabled=true;$('#cancel').disabled=false;
  show('#resultPanel');$('#resultCount').textContent='0 correspondance';clear($('#results'));clear($('#errorsList'));show('#errorsBox',false);
  updateProgress(0,Math.min(MAX_SEARCH,files.length),'Départ');
  const errors=[];let found=0,processed=0;
  try{
    for(const f of files.slice(0,MAX_SEARCH)){
      if(cancelled)break;
      try{
        const file=await f.handle.getFile();
        let res;
        if(f.ext==='pdf')res=await PdfLite.searchPDF(file,sku);
        else if(f.ext==='csv')res=await XlsxLite.searchCSV(file,sku);
        else res=await XlsxLite.searchExcel(file,sku);
        if(res.unsupported)errors.push(`${f.path} : ${res.reason || 'PDF sans texte extractible par le lecteur expérimental.'}`);
        for(const m of res.matches){if(found>=MAX_RESULTS)break; if(f.ext==='pdf')appendPdfMatch(m,f); else appendMatch(m,f);found++;}
        for(const failure of res.failures||[])errors.push(`${f.path} : ${failure}`);
      }catch(err){errors.push(`${f.path} : ${err.name||'Erreur'} : ${err.message}`);}
      processed++;
      $('#resultCount').textContent=`${fmt(found)} correspondance${found>1?'s':''}`;
      updateProgress(processed,Math.min(MAX_SEARCH,files.length),f.path);
      if(found>=MAX_RESULTS)break;
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    if(!found)$('#results').append(newEl('div','empty',cancelled?'Recherche arrêtée. Aucun résultat dans les fichiers parcourus.':'Aucune correspondance trouvée dans les fichiers analysés. Vérifie la référence ou essaie les archives.'));
    const suffix=cancelled?'Recherche arrêtée.':found>=MAX_RESULTS?'Limite de 120 résultats atteinte.':files.length>MAX_SEARCH?'Limite de 200 fichiers par recherche atteinte.':'Recherche terminée.';
    updateProgress(processed,Math.min(MAX_SEARCH,files.length),suffix);
    if(errors.length){show('#errorsBox');$('#errorNum').textContent=errors.length;for(const e of errors.slice(0,60))$('#errorsList').append(newEl('div','',e));}
  }finally{running=false;$('#search').disabled=false;$('#choose').disabled=false;$('#cancel').disabled=true;}
});
$('#sku').addEventListener('keydown',e=>{if(e.key==='Enter'&&!$('#search').disabled)$('#search').click();});
