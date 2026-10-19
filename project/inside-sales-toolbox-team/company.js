(function(root){
function decode(s){return s.replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n))).replace(/&(?:nbsp|amp|quot|apos|lt|gt);/gi,m=>({'&nbsp;':' ','&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'}[m.toLowerCase()]));}
function text(html){return decode(html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ').replace(/<\/(?:p|div|li|h[1-6]|footer|address)>|<br\b[^>]*>/gi,'\n').replace(/<[^>]*>/g,' ')).replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n');}
function attrs(tag){const a={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))a[m[1].toLowerCase()]=decode(m[2]??m[3]);return a;}
function siteName(html){for(const m of html.matchAll(/<meta\b[^>]*>/gi)){const a=attrs(m[0]);if(a.property==='og:site_name'&&a.content)return a.content.trim();}return '';}
function contactLinks(html,source){const urls=[];const base=new URL(source);for(const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)){const a=attrs(m[1]);if(!a.href||!/(?:contact|contactez|nous-joindre|about|a-propos|à propos|information|\binfo\b)/i.test(a.href+' '+text(m[2])))continue;try{const u=new URL(a.href,base);if(u.protocol!=='https:'||u.hostname.replace(/^www\./,'')!==base.hostname.replace(/^www\./,''))continue;u.hash='';urls.push(u.href);}catch{}}return [...new Set(urls)].slice(0,8);}
function extract(html,source){
 const found=[];
 const scalar=v=>typeof v==='string'?v.trim():'';
 function walk(x,depth=0){if(!x||typeof x!=='object'||depth>25)return;if(Array.isArray(x)){x.forEach(v=>walk(v,depth+1));return;}
 const types=[x['@type']].flat().join(' ');
 if(scalar(x.name)&&/Organization|Business|Theater|PerformingArts|Store|Corporation|School|College|Venue/i.test(types)){
 for(const a of (Array.isArray(x.address)?x.address:[x.address]))if(a&&typeof a==='object'){
 const c={company:scalar(x.name),street:scalar(a.streetAddress),city:scalar(a.addressLocality),state:scalar(a.addressRegion),postal:scalar(a.postalCode),country:scalar(a.addressCountry)||scalar(a.addressCountry?.name),source};
 if(c.street||c.postal)found.push(c);
 }}
 for(const v of Object.values(x))if(typeof v==='object')walk(v,depth+1);
 }
 for(const match of html.matchAll(/<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)){try{walk(JSON.parse(match[1]));}catch{}}
 const plain=text(html),company=siteName(html);
 // Canadian postal codes anchor the nearby address. Preserve uncertain text for review.
 for(const m of plain.matchAll(/\b([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z])[ -]?(\d[ABCEGHJ-NPRSTV-Z]\d)\b/gi)){
  const before=plain.slice(Math.max(0,m.index-220),m.index);
  const match=before.match(/(?:adresse|address)\s*:?\s*([\s\S]+)$/i);
  let block=(match?match[1]:before.split(/\n\s*\n/).pop()).trim().replace(/[,\s]+$/,'');
  let state='';const preState=block.match(/[,\n ]+(QC|ON|BC|AB|MB|SK|NB|NS|NL|PE|YT|NT|NU|Québec|Quebec)\.?$/i);
  if(preState){state=preState[1].toUpperCase();block=block.slice(0,preState.index).trim();}
  if(!state)state=plain.slice(m.index+m[0].length,m.index+m[0].length+35).match(/^[,\s]*(QC|ON|BC|AB|MB|SK|NB|NS|NL|PE|YT|NT|NU|Québec|Quebec)\b/i)?.[1]?.toUpperCase()||'';
  if(/QUEBEC|QUÉBEC/.test(state))state='QC';
  const address=block.match(/(?:^|\n)\s*(\d+[A-Za-z-]*\s+[^\n]+)(?:\n([\s\S]+))?$/);
  if(!address)continue;
  let street=address[1].trim(),city=(address[2]||'').trim();
  if(!city){const pieces=street.split(/\s*[,\n]\s*|\.\s+/);if(pieces.length<2)continue;city=pieces.pop();street=pieces.join(', ');}
  if(!street||!city||street.length>150||city.length>90)continue;
  found.push({company,street,city,state,postal:(m[1]+' '+m[2]).toUpperCase(),country:'CAN',source,evidence:street+', '+city+', '+m[0]+(state?', '+state:''),method:'Adresse visible sur le site, à vérifier'});
 }
 return [...new Map(found.map(c=>[JSON.stringify({...c,source:''}),c])).values()];
}
root.CompanyLookup={extract,contactLinks,siteName};if(typeof module!=='undefined')module.exports=root.CompanyLookup;
})(globalThis);
