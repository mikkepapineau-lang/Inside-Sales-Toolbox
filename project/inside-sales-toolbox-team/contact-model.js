(()=>{
const title=s=>s.trim().replace(/\s+/g,' ').toLocaleLowerCase('fr-CA').replace(/(^|[\s\-'’])(\p{L})/gu,(_,a,b)=>a+b.toLocaleUpperCase('fr-CA'));
function phone(s){const m=String(s).trim().match(/^(?:\+?1[\s.-]*)?\(?([2-9]\d{2})\)?[\s.-]*(\d{3})[\s.-]*(\d{4})(?:\s*(?:#|poste|ext\.?|extension|x)\s*:?\s*(\d+))?$/i);return m?'('+m[1]+') '+m[2]+'-'+m[3]+(m[4]?' #'+m[4]:''):'';}
function parse(text){
 const emails=[...text.matchAll(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map(m=>m[0].toLowerCase());
 const pattern=/(?<!\d)(?:\+?1[ .-]*)?\(?[2-9]\d{2}\)?[ .-]*\d{3}[ .-]*\d{4}(?:[ \t]*(?:#|poste|ext\.?|extension|x)[ \t]*:?[ \t]*\d+)?(?!\d)/gi;
 const matches=[...text.matchAll(pattern)],phones=matches.map(m=>phone(m[0]));
 let rest=text.replace(pattern,'\n').replace(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'\n');
 const lines=rest.split(/[\n\r|;<>]+/).map(s=>s.replace(/^\s*(?:nom complet|nom|name|contact)\s*:\s*/i,'').replace(/^[\s,:-]+|[\s,:-]+$/g,'')).filter(s=>s&&!/^(?:t[eé]l(?:[eé]phone)?|phone|mobile|cell|fax|email|courriel|mailto)\s*:?$/i.test(s));
 const names=lines.filter(s=>/^[\p{L}\p{M} .’'-]+$/u.test(s)&&s.trim().split(/\s+/).length>=2);
 return {name:title(names[0]||''),phone:phones[0]||'',email:emails[0]||'',warnings:[
 ...(names.length!==1?['Vérifie le nom : le texte contient une signature ou une identité ambiguë.']:[]),
 ...(new Set(phones).size>1?['Plusieurs téléphones détectés. Choisis le bon numéro.']:[]),
 ...(new Set(emails).size>1?['Plusieurs courriels détectés. Choisis le bon courriel.']:[])
 ]};
}
function values(d){const name=title(d.name),p=phone(d.phone),email=d.email.trim().toLowerCase();if(!name||!p||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Complète le nom, un téléphone nord-américain valide et le courriel.');return {name,phone:p,email,notes:[name,p,email].join('\n'),delivery:name+' - '+p};}
function fromLead(d={}){
 const fullName=[d.first,d.last].filter(Boolean).join(' '),name=String(d.phoneName||d.contact||d.emailName||fullName||'').trim();
 const parsed=phone(String(d.phone||'')),extension=String(d.extension||parsed.match(/#(\d+)$/)?.[1]||'').trim();
 const base=parsed?parsed.replace(/\s+#\d+$/,''):String(d.phone||'').trim(),rawPhone=base+(extension?' #'+extension:'');
 return {name:name?title(name):'',phone:phone(rawPhone)||rawPhone,email:String(d.email||'').trim().toLowerCase()};
}
globalThis.ContactModel={title,phone,parse,values,fromLead};
})();
