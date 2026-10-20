// Reuse the address displayed by Google Maps. No inferred spelling or geocoder substitution.
(function(root){
function parse(raw,expected){
 const value=String(raw||'').replace(/^(?:Address|Adresse)\s*:\s*/i,'').trim();
 const m=value.match(/^([^,]+),\s*([^,]+),\s*(QC|ON|BC|AB|MB|SK|NB|NS|NL|PE|YT|NT|NU)\s+([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d)(?:,\s*Canada)?$/i);
 if(!m)return null;
 const clean=s=>String(s||'').replace(/\s/g,'').toUpperCase();
 const number=s=>String(s||'').match(/^\d+[A-Za-z]?(?:-\d+)?/)?.[0];
 if(!expected.postal||clean(m[4])!==clean(expected.postal)||!number(expected.street)||number(m[1])!==number(expected.street))return null;
 if(expected.state&&m[3].toUpperCase()!==expected.state.toUpperCase())return null;
 return {street:m[1].trim(),city:m[2].trim(),state:m[3].toUpperCase(),postal:m[4].toUpperCase().replace(/\s/g,'').replace(/^(.{3})/,'$1 '),country:'CAN',formatted:value};
}
root.GoogleAddress={parse};if(typeof module!=='undefined')module.exports=root.GoogleAddress;
})(globalThis);
