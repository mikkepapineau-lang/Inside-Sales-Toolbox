'use strict';
/* LAB 0.6 experimental, dependency-free, local-only PDF text inspection.
 * Does not interpret table columns or return a trusted public price.
 * Does not support OCR, encryption, many custom font mappings or all PDF filters.
 * For a production-grade PDF extraction engine use vetted, bundled PDF.js.
 */
const PdfLite=(()=>{
  const MAX_PDF=24*1024*1024,MAX_TEXT=2*1024*1024,MAX_OBJECTS=14000;
  const normalize=s=>String(s||'').normalize('NFKC').toUpperCase().replace(/[\s._\-/]/g,'');
  function unescapeLiteral(s){
    return s.replace(/\\([0-7]{1,3}|[nrtbf()\\]|\r?\n)/g,(all,esc)=>{
      if(/^[0-7]{1,3}$/.test(esc))return String.fromCharCode(parseInt(esc,8));
      return ({n:'\n',r:'\r',t:'\t',b:'',f:'','(':'(',')':')','\\':'\\'})[esc]??'';
    });
  }
  function decodeToken(src){
    if(src.startsWith('('))return unescapeLiteral(src.slice(1,-1));
    const hex=src.slice(1,-1).replace(/\s/g,'');const n=Math.floor(hex.length/2);const arr=[];
    for(let i=0;i<n;i++)arr.push(parseInt(hex.slice(i*2,i*2+2),16));
    if(arr[0]===254&&arr[1]===255){let out='';for(let i=2;i+1<arr.length;i+=2)out+=String.fromCharCode(arr[i]*256+arr[i+1]);return out;}
    return new TextDecoder('windows-1252').decode(Uint8Array.from(arr));
  }
  const tokenPattern=/(?:\((?:\\[\s\S]|[^\\)])*\)|<[\dA-Fa-f\s]+>)/g;
  function streamText(s){
    let output='';const blocks=s.match(/BT\b[\s\S]*?\bET/g)||[];
    for(const block of blocks){
      // Capture text-showing operands, in content order; avoid guessing table geometry.
      const op=/(\((?:\\[\s\S]|[^\\)])*\)|<[\da-fA-F\s]+>)\s*(?:Tj|'|\")|\[([\s\S]*?)\]\s*TJ/g;
      let m, found=0;
      while((m=op.exec(block))){
        const parts=m[1]?[m[1]]:(m[2].match(tokenPattern)||[]);
        const text=parts.map(decodeToken).join('');
        if(text){output+=text+' ';found++;}
        if(output.length>MAX_TEXT)break;
      }
      if(found)output+='\n';
      if(output.length>MAX_TEXT)break;
    }
    return output;
  }
  function decodeAscii85(bytes){
    const text=new TextDecoder('ascii').decode(bytes).replace(/^\s*<~/,'');
    const out=[];let tuple=[];
    const push=(vals,count=4)=>{let n=0;for(const v of vals)n=n*85+v;for(let j=0;j<count;j++)out.push(Math.floor(n/256**(3-j))%256);};
    for(const ch of text){
      if(ch==='~')break;
      if(/\s/.test(ch))continue;
      if(ch==='z' && !tuple.length){out.push(0,0,0,0);continue;}
      const x=ch.charCodeAt(0)-33;if(x<0||x>84)throw Error('ASCII85 invalide');
      tuple.push(x);
      if(tuple.length===5){push(tuple);tuple=[];}
    }
    if(tuple.length>1){const size=tuple.length;while(tuple.length<5)tuple.push(84);push(tuple,size-1);}
    if(out.length>MAX_TEXT*4)throw Error('PDF décodé trop volumineux.');
    return Uint8Array.from(out);
  }
  async function decodeStream(obj, bytes){
    const m=/\bstream\r?\n/.exec(obj.body);if(!m)return '';
    const at=obj.offset+m.index+m[0].length;
    const stop=obj.body.indexOf('endstream',m.index+m[0].length);
    if(stop<0)return '';
    const end=obj.offset+stop;
    let stream=bytes.subarray(at,end);
    while(stream.length&&(stream.at(-1)===10||stream.at(-1)===13))stream=stream.subarray(0,stream.length-1);
    const filterField=obj.body.slice(0,m.index).match(/\/Filter\s*(\[[^\]]*\]|\/[A-Za-z0-9]+)/);
    const filters=filterField?[...filterField[1].matchAll(/\/([A-Za-z0-9]+)/g)].map(x=>x[1]):[];
    for(const filter of filters){
      if(filter==='ASCII85Decode')stream=decodeAscii85(stream);
      else if(filter==='FlateDecode'){
        const data=await new Response(new Blob([stream]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer();
        if(data.byteLength>MAX_TEXT*4)throw Error('Flux PDF trop volumineux.');
        stream=new Uint8Array(data);
      }else return '';
    }
    return new TextDecoder('windows-1252').decode(stream);
  }
  async function searchPDF(file,sku,maxMatches=8){
    if(file.size>MAX_PDF)throw Error('PDF dépassant 24 Mo : recherche expérimentale non effectuée.');
    const bytes=new Uint8Array(await file.arrayBuffer());
    if(!new TextDecoder('ascii').decode(bytes.subarray(0,8)).startsWith('%PDF-'))throw Error('Signature PDF incorrecte.');
    // One byte mapped to one character, preserving stream offset indices.
    const latin=new TextDecoder('windows-1252').decode(bytes);
    const re=/(\d+)\s+(\d+)\s+obj\b([\s\S]*?)\bendobj/g;
    const objs=new Map();let m,qty=0;
    while((m=re.exec(latin))){
      if(++qty>MAX_OBJECTS)throw Error('PDF trop complexe pour le lecteur expérimental.');
      objs.set(Number(m[1]),{body:m[3],offset:m.index+m[0].indexOf(m[3])});
    }
    const pages=[...objs.entries()].filter(([,o])=>/\/Type\s*\/Page\b/.test(o.body)&&!/\/Type\s*\/Pages\b/.test(o.body));
    if(!pages.length)return {matches:[],pages:0,reason:'Pages non identifiées',unsupported:true};
    const matches=[];let decodedPages=0;
    for(const [index,[,page]] of pages.entries()){
      const field=page.body.match(/\/Contents\s*(\[[^\]]*\]|\d+\s+\d+\s+R)/);
      if(!field)continue;
      const ids=[...field[1].matchAll(/(\d+)\s+\d+\s+R/g)].map(x=>Number(x[1]));
      let text='';
      for(const id of ids){const obj=objs.get(id);if(!obj)continue;
        try{text+=streamText(await decodeStream(obj,bytes))+' ';}catch{/* unsupported stream */}
      }
      if(!text.trim())continue;
      decodedPages++;
      // Match exact SKU boundaries first; normalized evidence is a potential match only.
      const upper=text.toUpperCase();const wanted=String(sku).toUpperCase();
      let at=0,found=0;
      while((at=upper.indexOf(wanted,at))!==-1&&found<2){
        const before=upper[at-1]||'',after=upper[at+wanted.length]||'';
        if((!before||!/[A-Z0-9]/.test(before))&&(!after||!/[A-Z0-9]/.test(after))){
          const start=Math.max(0,at-150),end=Math.min(text.length,at+wanted.length+210);
          matches.push({kind:'exact',sheet:`Page ${index+1}`,row:0,fileType:'PDF expérimental',page:index+1,context:text.slice(start,end).replace(/\s+/g,' ').trim()});found++;
        }
        at+=wanted.length;
      }
      // Do not promote concatenated/glyph-normalized text to a reliable SKU match.
      if(matches.length>=maxMatches)break;
    }
    return {matches,pages:pages.length,decodedPages,unsupported:decodedPages===0,reason:decodedPages===0?'Texte PDF non extractible par le lecteur expérimental. Vérifie directement le PDF.':''};
  }
  return {searchPDF};
})();
