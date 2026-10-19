/* Minimal local read-only XLSX parser for this laboratory prototype.
 * No external dependencies, network access, macros, or writes.
 * It reads cached values and text from OOXML .xlsx/.xlsm files.
 * Not a replacement for a fully validated financial spreadsheet parser.
 */
'use strict';
const XlsxLite = (() => {
  const te = new TextDecoder('utf-8');
  const MAX_XML = 20 * 1024 * 1024;
  const MAX_ZIP_ENTRIES = 16000;
  const MAX_FILE = 32 * 1024 * 1024;
  const u16 = (d,i) => d.getUint16(i,true);
  const u32 = (d,i) => d.getUint32(i,true);
  const basename = (name) => name.split('/').pop();
  function zipRead(bytes){
    if(bytes.byteLength > MAX_FILE) throw Error('Classeur dépassant 32 Mo : non traité par ce prototype.');
    const dv = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    let e = -1;
    for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){
      if(u32(dv,i)===0x06054b50){e=i;break;}
    }
    if(e<0) throw Error('Archive XLSX ZIP illisible.');
    const count = u16(dv,e+10);
    if(count===65535 || count>MAX_ZIP_ENTRIES) throw Error('Trop d’entrées dans le classeur.');
    let pos = u32(dv,e+16);
    const items=new Map();
    for(let n=0;n<count;n++){
      if(pos+46>bytes.length || u32(dv,pos)!==0x02014b50) throw Error('Index ZIP endommagé.');
      const flags=u16(dv,pos+8),method=u16(dv,pos+10);
      const comp=u32(dv,pos+20),uncomp=u32(dv,pos+24);
      const nameLen=u16(dv,pos+28),extra=u16(dv,pos+30),comment=u16(dv,pos+32);
      const local=u32(dv,pos+42);
      if(pos+46+nameLen+extra+comment>bytes.length) throw Error('Nom ZIP invalide.');
      const name=te.decode(bytes.subarray(pos+46,pos+46+nameLen));
      if(name && !name.endsWith('/')) items.set(name.replace(/^\/+/,''),{flags,method,comp,uncomp,local});
      pos+=46+nameLen+extra+comment;
    }
    async function read(name){
      const p = items.get(name.replace(/^\/+/,''));
      if(!p)return null;
      if(p.flags&1)throw Error('Classeur chiffré/non pris en charge.');
      if(p.uncomp>MAX_XML||p.comp>MAX_XML)throw Error('Partie XML trop volumineuse.');
      const start=p.local;
      if(start+30>bytes.length||u32(dv,start)!==0x04034b50)throw Error('En-tête ZIP endommagé.');
      const dataAt=start+30+u16(dv,start+26)+u16(dv,start+28);
      if(dataAt+p.comp>bytes.length)throw Error('Données ZIP tronquées.');
      const data=bytes.subarray(dataAt,dataAt+p.comp);
      if(p.method===0)return data;
      if(p.method!==8)throw Error('Compression ZIP non prise en charge.');
      const ds = new DecompressionStream('deflate-raw');
      const stream = new Blob([data]).stream().pipeThrough(ds);
      const buf = await new Response(stream).arrayBuffer();
      if(buf.byteLength>MAX_XML)throw Error('XML décompressé trop volumineux.');
      return new Uint8Array(buf);
    }
    return {read,items};
  }
  function xmlDoc(data){
    const doc = new DOMParser().parseFromString(te.decode(data),'application/xml');
    if(doc.querySelector('parsererror'))throw Error('XML non valide.');
    return doc;
  }
  const all = (node,tag) => Array.from(node.getElementsByTagNameNS('*',tag));
  const first = (node,tag) => all(node,tag)[0];
  function childText(node,tag){const el=first(node,tag);return el?el.textContent:'';}
  function resolve(base,target){
    if(target.startsWith('/'))return target.replace(/^\/+/, '');
    const path=base.split('/').slice(0,-1).concat(target.split('/'));
    const clean=[];
    for(const seg of path){if(!seg||seg==='.')continue;if(seg==='..')clean.pop();else clean.push(seg);}
    return clean.join('/');
  }
  const colLetters = ref => (String(ref).match(/^[A-Z]+/i)||[''])[0].toUpperCase();
  function findCellValue(cell,shared){
    const t=cell.getAttribute('t')||'';
    if(t==='inlineStr')return childText(cell,'is');
    const v=childText(cell,'v');
    if(t==='s')return shared[Number(v)]||'';
    if(t==='b')return v==='1'?'TRUE':'FALSE';
    if(t==='e')return `ERREUR : ${v}`;
    if(t==='str')return v;
    return v;
  }
  function simplify(text){return String(text??'').normalize('NFKC').replace(/\u00A0/g,' ').trim().toUpperCase();}
  const compact = (text) => simplify(text).replace(/[\s._\-/]/g,'');
  function matchKind(content,sku){
    const value=simplify(content), wanted=simplify(sku);
    if(!value||!wanted)return null;
    if(value===wanted)return 'exact';
    if(compact(value)===compact(wanted))return 'normalized';
    // A SKU mentioned in a longer cell is merely a candidate, never validated.
    const escaped=wanted.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const re = new RegExp(`(^|[^A-Z0-9])${escaped}(?=$|[^A-Z0-9])`);
    return re.test(value)?'mentioned':null;
  }
  const rank={exact:0,normalized:1,mentioned:2};
  function headerFor(rows, index, cols){
    let best=null,bestScore=-1;
    for(let i=Math.max(0,index-20);i<index;i++){
      const row=rows[i]; if(!row)continue;
      let score=0;
      for(const [k,v] of row.cells){
        if(/DEALER|NET COST|COST|MSRP|MAP|PRICE|PRIX|LIST|SKU|ITEM|PRODUCT|PART|MODEL|MODÈLE|DESCRIPTION/i.test(v))score+=3;
        if(cols.includes(k)&&String(v).length<42)score+=.3;
      }
      if(score>bestScore){bestScore=score;best=row;}
    }
    return best && bestScore>=2?best:null;
  }
  function extractMatches(rowData,sku,base,limit){
    const matches=[];
    for(let i=0;i<rowData.length;i++){
      const row=rowData[i];
      let kind=null;
      for(const val of row.cells.values()){
        const k=matchKind(val,sku);
        if(k && (!kind||rank[k]<rank[kind]))kind=k;
      }
      if(!kind)continue;
      const cols=Array.from(row.cells.keys());
      const header=headerFor(rowData,i,cols);
      const cells=cols.filter(c=>String(row.cells.get(c)).trim()).slice(0,24).map(c=>({col:c,label:header?.cells.get(c)||'',value:String(row.cells.get(c))}));
      matches.push({...base,row:row.n,kind,cells,hiddenCells:Math.max(0,cols.length-24),headerRow:header?.n||null});
      if(matches.length>=limit)break;
    }
    return matches;
  }
  function parseSheet(doc,shared,sku,base,limit){
    const sheetData=first(doc,'sheetData');
    if(!sheetData)return [];
    const data=[];
    const rows=all(sheetData,'row');
    if(rows.length>220000)throw Error('Plus de 220 000 lignes dans une feuille.');
    for(const row of rows){
      const cells=new Map();
      for(const c of all(row,'c')){
        const ref=c.getAttribute('r')||'';
        const col=colLetters(ref);
        const value=findCellValue(c,shared);
        if(col && String(value).trim()) cells.set(col,String(value));
      }
      data.push({n:Number(row.getAttribute('r'))||data.length+1,cells});
    }
    return extractMatches(data,sku,base,limit);
  }
  async function searchExcel(file,sku,limit=24){
    const zip=zipRead(new Uint8Array(await file.arrayBuffer()));
    const wd=await zip.read('xl/workbook.xml');
    if(!wd)throw Error('Classeur Office XML introuvable.');
    const workbook=xmlDoc(wd);
    const relBytes=await zip.read('xl/_rels/workbook.xml.rels');
    if(!relBytes)throw Error('Relations du classeur introuvables.');
    const relXml=xmlDoc(relBytes);
    const rels=new Map();
    for(const r of all(relXml,'Relationship'))rels.set(r.getAttribute('Id'),r.getAttribute('Target'));
    const sharedBytes=await zip.read('xl/sharedStrings.xml');
    const shared=[];
    if(sharedBytes){
      const strings=xmlDoc(sharedBytes);
      for(const si of all(strings,'si')) shared.push(all(si,'t').map(x=>x.textContent).join(''));
    }
    const matches=[], failures=[];
    for(const sheet of all(workbook,'sheet')){
      const id=sheet.getAttribute('r:id')||sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
      const target=rels.get(id);
      if(!target)continue;
      const path=resolve('xl/workbook.xml',target);
      try{
        const bytes=await zip.read(path);
        if(!bytes)continue;
        const doc=xmlDoc(bytes);
        matches.push(...parseSheet(doc,shared,sku,{sheet:sheet.getAttribute('name')||basename(path),fileType:'Excel'},limit-matches.length));
        if(matches.length>=limit)break;
      }catch(err){failures.push(`${sheet.getAttribute('name')}: ${err.message}`);}
    }
    return {matches,failures};
  }
  function parseCsv(text){
    const lines=text.slice(0,3000).split(/\r?\n/).slice(0,15);
    const seps=['\t',';',','];
    let best=';',max=-1;
    for(const sep of seps){const count=lines.reduce((n,l)=>n+l.split(sep).length-1,0);if(count>max){max=count;best=sep;}}
    const rows=[];let row=[],field='',quote=false;
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(quote){if(c==='"'&&text[i+1]==='"'){field+='"';i++;}else if(c==='"')quote=false;else field+=c;}
      else if(c==='"')quote=true;
      else if(c===best){row.push(field);field='';}
      else if(c==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field='';if(rows.length>220000)throw Error('Fichier CSV trop volumineux.');}
      else field+=c;
    }
    if(field||row.length){row.push(field.replace(/\r$/,''));rows.push(row);}
    return rows;
  }
  function colName(index){let s='';for(let n=index+1;n>0;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
  async function searchCSV(file,sku,limit=24){
    if(file.size>MAX_FILE)throw Error('CSV dépassant 32 Mo.');
    const buffer=await file.arrayBuffer();
    let text=te.decode(buffer);
    if(text.includes('\uFFFD'))text=new TextDecoder('windows-1252').decode(buffer);
    const parsed=parseCsv(text), rows=parsed.map((values,index)=>({n:index+1,cells:new Map(values.map((v,i)=>[colName(i),v]).filter(x=>String(x[1]).trim()))}));
    return {matches:extractMatches(rows,sku,{sheet:'CSV',fileType:'CSV'},limit),failures:[]};
  }
  return {searchExcel,searchCSV,matchKind};
})();
