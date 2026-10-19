export const SOURCE = 'https://www.canada.ca/fr/ministere-finances/programmes/politiques-finances-echanges-internationaux/reponse-canada-droits-douane-americains/liste-complete-produits-americains-assujettis-contre-mesures-tarifaires.html';
const clean = s => s.replace(/\s+/g,' ').trim();
const plain = s => clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const months = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
export function period(text) {
  const t=plain(text), dates=[...t.matchAll(/(\d{1,2})(?:er)?\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+(\d{4})/g)].map(m=>`${m[3]}-${String(months.indexOf(m[2])+1).padStart(2,'0')}-${m[1].padStart(2,'0')}`);
  if (!dates.length) throw new Error('Période du tableau non reconnue. Consulter la source.');
  if(t.includes('jusqu')) return {start:'0000-01-01',end:dates[0]};
  if(!t.includes('a compter')) throw new Error('Période du tableau non reconnue.');
  return {start:dates[0],end:dates[1]||'9999-12-31'};
}
export function parseSource(html, today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Toronto'})) {
  const doc=new DOMParser().parseFromString(html,'text/html');
  const candidates=[];
  for(const table of doc.querySelectorAll('table')) {
    const headers=[...table.querySelectorAll('thead tr:first-child th')].map(x=>plain(x.textContent));
    if(!headers.includes('numero tarifaire')||!headers.includes('taux tarifaire')) continue;
    const section=table.closest('details');
    const label=clean(section?.querySelector('summary')?.textContent||'');
    const dates=period(label);
    if(dates.start<=today && today<=dates.end) candidates.push({table,headers,label,dates,section});
  }
  if(candidates.length!==1) throw new Error('Impossible d’identifier un seul tableau en vigueur. Consulter Canada.ca.');
  const {table,headers,label,dates,section}=candidates[0];
  const codeAt=headers.indexOf('numero tarifaire'),rateAt=headers.indexOf('taux tarifaire'),descAt=headers.indexOf('description');
  const headingAt=headers.findIndex(x=>x.startsWith('position du systeme'));
  if(descAt<0||headingAt<0) throw new Error('Les colonnes de la source ont changé.');
  const rows=[];
  for(const tr of table.querySelectorAll('tbody tr')) {
    const cells=[...tr.children].filter(x=>/^(TD|TH)$/.test(x.tagName)).map(x=>clean(x.textContent));
    if(!cells.length) continue;
    if(cells.length!==headers.length || !/^\d{4}\.\d{2}\.\d{2}$/.test(cells[codeAt])) throw new Error('Un numéro tarifaire ne peut pas être interprété.');
    const raw=cells[rateAt].replace(/\s|%/g,'').replace(',','.');
    if(!/^\d+(\.\d+)?$/.test(raw)||Number(raw)>100) throw new Error('Un taux ne peut pas être interprété.');
    rows.push({code:cells[codeAt],digits:cells[codeAt].replace(/\./g,''),heading:cells[headingAt],description:cells[descAt],rate:Number(raw)});
  }
  if(!rows.length || new Set(rows.map(r=>r.code)).size!==rows.length) throw new Error('Tableau vide ou numéros en double.');
  const updated=clean(section.textContent).match(/Liste mise à jour le [^\d]*\d{1,2}[^\d]+\d{4}/i)?.[0]||'';
  return {rows:rows.sort((a,b)=>a.code.localeCompare(b.code)),period:label,...dates,updated,fetchedAt:new Date().toISOString(),source:SOURCE};
}
export function search(rows, input) {
  const trimmed=input.trim();
  if(!/^[\d.\s]+$/.test(trimmed)) throw new Error('Entre uniquement un code HS, avec ou sans points.');
  const digits=trimmed.replace(/[.\s]/g,'');
  if(![4,6,8,10].includes(digits.length)) throw new Error('Entre un code de 4, 6, 8 ou 10 chiffres.');
  const key=digits.slice(0,8);
  return {partial:digits.length<8,key,rows:rows.filter(r=>r.digits.startsWith(key))};
}
