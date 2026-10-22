// Local .xlsx reader for Power BI exports. No remote library, macros or formulas run.
(()=>{
 const MAX_XML=64*1024*1024,MAX_FILE=25*1024*1024;
 const decode=bytes=>new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 function xml(value){const doc=new DOMParser().parseFromString(value,'application/xml');if(doc.getElementsByTagName('parsererror').length||/<!DOCTYPE|<!ENTITY/i.test(value))throw Error('Le fichier Excel contient un XML invalide.');return doc;}
 const elements=(root,name)=>[...root.getElementsByTagNameNS('*',name)];
 const content=(root,name)=>elements(root,name).map(e=>e.textContent||'').join('');
 const safePath=(base,path)=>{if(!path||/^[a-z]+:|^\/\/|\\/i.test(path))throw Error('Lien interne Excel invalide.');const u=new URL(path,'https://xlsx.local/'+base);if(u.origin!=='https://xlsx.local')throw Error('Lien interne Excel invalide.');return u.pathname.slice(1);};
 function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
 async function zip(file){
  if(file.size>MAX_FILE)throw Error('Le fichier Excel dépasse 25 Mo.');
  const buffer=await file.arrayBuffer(),bytes=new Uint8Array(buffer),view=new DataView(buffer);let end=-1;
  for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(view.getUint32(p,true)===0x06054b50&&p+22+view.getUint16(p+20,true)===bytes.length){end=p;break;}
  if(end<0)throw Error('Ce fichier n’est pas un .xlsx valide.');
  const count=view.getUint16(end+10,true),size=view.getUint32(end+12,true),start=view.getUint32(end+16,true);
  if(view.getUint16(end+4,true)||view.getUint16(end+6,true)||view.getUint16(end+8,true)!==count||count>1000||start+size!==end)throw Error('Ce format de fichier Excel n’est pas pris en charge.');
  const files=new Map();let p=start,total=0;
  for(let i=0;i<count;i++){
   if(p+46>end||view.getUint32(p,true)!==0x02014b50)throw Error('Archive Excel invalide.');
   const flags=view.getUint16(p+8,true),method=view.getUint16(p+10,true),crc=view.getUint32(p+16,true),compressed=view.getUint32(p+20,true),expanded=view.getUint32(p+24,true),nameLength=view.getUint16(p+28,true),extra=view.getUint16(p+30,true),comment=view.getUint16(p+32,true),offset=view.getUint32(p+42,true);
   if(p+46+nameLength+extra+comment>end)throw Error('Archive Excel tronquée.');
   const name=decode(bytes.slice(p+46,p+46+nameLength));total+=expanded;
   if(flags&1||![0,8].includes(method)||expanded>MAX_XML||total>128*1024*1024||offset+30>start||files.has(name))throw Error('Archive Excel trop volumineuse, chiffrée ou non prise en charge.');
   files.set(name,{method,crc,compressed,expanded,offset});p+=46+nameLength+extra+comment;
  }
  if(p!==end)throw Error('Archive Excel invalide.');
  const cache=new Map();
  return async name=>{
   if(cache.has(name))return cache.get(name);
   const f=files.get(name);if(!f)return null;const o=f.offset;
   if(view.getUint32(o,true)!==0x04034b50||view.getUint16(o+8,true)!==f.method)throw Error('Entrée Excel invalide.');
   const data=o+30+view.getUint16(o+26,true)+view.getUint16(o+28,true);
   if(data+f.compressed>start)throw Error('Entrée Excel tronquée.');
   let output=bytes.slice(data,data+f.compressed);
   if(f.method===8){
    let stream;try{stream=new DecompressionStream('deflate-raw');}catch{throw Error('Mets Edge ou Chrome à jour pour importer un fichier Excel.');}
    const reader=new Blob([output]).stream().pipeThrough(stream).getReader(),chunks=[];let length=0;
    try{while(true){const next=await reader.read();if(next.done)break;length+=next.value.length;if(length>f.expanded||length>MAX_XML)throw Error('Taille Excel invalide.');chunks.push(next.value);}}finally{await reader.cancel().catch(()=>{});}
    output=new Uint8Array(length);let cursor=0;for(const chunk of chunks){output.set(chunk,cursor);cursor+=chunk.length;}
   }
   if(output.length!==f.expanded||crc32(output)!==f.crc)throw Error('Le fichier Excel est endommagé.');
   const value=decode(output);cache.set(name,value);return value;
  };
 }
 function grid(doc,strings,maxRows=60010){
  const rows=[];
  for(const row of elements(doc,'row')){
   if(rows.length>maxRows)throw Error('Le fichier contient trop de lignes.');
   const values=[];let nextCol=0;
   for(const cell of elements(row,'c')){
    const ref=cell.getAttribute('r')||'',letters=ref.match(/^[A-Z]+/i)?.[0];if(ref&&!letters)throw Error('Référence de cellule Excel invalide.');
    let col=nextCol;if(letters){col=0;for(const c of letters.toUpperCase())col=col*26+c.charCodeAt(0)-64;col--;}
    if(col>99||col<nextCol)throw Error('Le fichier contient trop de colonnes ou une référence de cellule invalide.');nextCol=col+1;
    const type=cell.getAttribute('t'),v=content(cell,'v');let value='';
    if(type==='s'){const i=Number(v);if(!/^\d+$/.test(v)||i>=strings.length)throw Error('Texte Excel invalide.');value=strings[i];}
    else if(type==='inlineStr')value=content(cell,'t');
    else if(type==='e')throw Error('Le fichier contient une cellule en erreur.');
    else value=v;
    if(value.length>32000)throw Error('Une cellule Excel est trop longue.');
    values[col]=value;
   }
   rows.push(Array.from({length:values.length},(_,i)=>values[i]??''));
  }
  return rows;
 }
 async function read(file,profile='used'){
  if(!['used','nonreserved'].includes(profile))throw Error('Type de catalogue Excel invalide.');
  const nonreserved=profile==='nonreserved';
  if(!/\.xlsx$/i.test(file.name||''))throw Error('Choisis un export Excel au format .xlsx.');
  const entry=await zip(file),workbook=await entry('xl/workbook.xml'),relations=await entry('xl/_rels/workbook.xml.rels');
  if(!workbook||!relations)throw Error('Classeur Excel introuvable.');
  const rels=new Map(elements(xml(relations),'Relationship').filter(e=>e.getAttribute('TargetMode')!=='External').map(e=>[e.getAttribute('Id'),e.getAttribute('Target')]));
  const shared=await entry('xl/sharedStrings.xml'),strings=shared?elements(xml(shared),'si').map(si=>content(si,'t')):[];
  const sheets=elements(xml(workbook),'sheet');let selected=null;
  for(const sheet of sheets){
   const id=sheet.getAttribute('r:id')||sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'),target=rels.get(id);if(!target)continue;
   const value=await entry(safePath('xl/workbook.xml',target));if(!value)continue;
   const rows=grid(xml(value),strings,nonreserved?150010:60010),headerRow=rows.findIndex((r,i)=>i<20&&(nonreserved?['itemid','productname','qtynotreserved','avgunitcost'].every(key=>r.some(v=>ToolboxUsedCatalogue.column(v)===key)):r.some(v=>ToolboxUsedCatalogue.column(v)==='sku')&&r.some(v=>ToolboxUsedCatalogue.column(v)==='qtyavailable')));
   if(headerRow<0)continue;
   if(selected)throw Error('Plusieurs feuilles de catalogue détectées. Exporte uniquement le tableau voulu.');
   const headers=rows[headerRow],sku=headers.findIndex(h=>ToolboxUsedCatalogue.column(h)===(nonreserved?'itemid':'sku')),link=headers.findIndex(h=>ToolboxUsedCatalogue.column(h)==='productweblink');
   const footer=rows.slice(headerRow+1).filter(r=>!r[sku]).map(r=>r.join('\n')).join('\n');
   const currency=(footer.match(/(?:Currency|Devise)\s+(?:est|is|=)\s+(CAD|USD|EUR|GBP)\b/i)||[])[1]||'';
   selected={headers,rows:rows.slice(headerRow+1).filter(r=>r[sku]&&!/^(total|totals|totaux)$/i.test(r[sku])).map(r=>({values:headers.map((_,i)=>r[i]??''),href:link>=0?r[link]||'':''})),currency,filters:footer,sourceName:file.name,sourceSheet:sheet.getAttribute('name'),complete:true};
  }
  if(!selected)throw Error(nonreserved?'Aucune feuille avec ITEMID, PRODUCTNAME, QtyNotReserved et AvgUnitCost. Choisis l’export Non-Reserved.':'Aucune feuille avec SKU et QTY AVAILABLE. Choisis l’export Used Gear.');
  return nonreserved?ToolboxNonReserved.validate(selected):ToolboxUsedCatalogue.validate(selected);
 }
 globalThis.ToolboxUsedExcel={read};
})();
