(function(root){
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
 return [...new Map(found.map(c=>[JSON.stringify({...c,source:''}),c])).values()];
}
root.CompanyLookup={extract};if(typeof module!=='undefined')module.exports=root.CompanyLookup;
})(globalThis);
