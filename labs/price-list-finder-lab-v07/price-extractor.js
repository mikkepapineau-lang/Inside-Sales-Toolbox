/* Inside Sales Toolbox – Price List Finder LAB 0.3
 * Identification des colonnes de prix à partir de leur intitulé.
 * Ne choisit pas un coût officiel D365 et ne modifie aucun fichier.
 */
'use strict';
const PriceExtractor=(()=>{
  const key=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  const isCurrency=s=>/^(?:CAD|USD|EUR|GBP)$/.test(key(s));
  function kindOf(label){
    const s=key(label);
    if(!s)return null;
    if(/\b(CUR COD|CURRENCY|DEVISE|CURR CODE|CURRENCY CODE)\b/.test(s))return 'currency';
    if(/^(?:PRICING UOM|UOM|UNIT OF MEASURE|UNITE DE MESURE)$/.test(s))return 'uom';
    // Prix conditionnel de règlement : doit rester distinct du coût de soumission.
    if(/(?:\bNET\s*60\b|\b20\s*NET\s*60\b|\bDISCOUNT TERMS\b|\bESCOMPTE\b)/.test(s))return 'terms';
    if(/\bSOLOTECH\b/.test(s)&&/\b(PRICE|PRIX|COST|COUT)\b/.test(s))return 'solotech';
    if(/\bDEALER\b/.test(s)&&/\b(PRICE|PRIX|COST|NET|PRICING)\b/.test(s))return 'dealer';
    if(/\bMAP\b/.test(s))return 'map';
    if(/\b(MSRP|RETAIL|SUGGESTED RETAIL|PUBLIC PRICE|PRIX PUBLIC|LIST PRICE|PRIX DE LISTE|PRIX CATALOGUE|CATALOG PRICE|UNIT LIST PRICE)\b/.test(s))return 'retail';
    if(/\b(NET COST|PURCHASE COST|BUY COST|PRIX ACHAT|COUT ACHAT|NET PRICE)\b/.test(s))return 'otherCost';
    return null;
  }
  function numberOf(input){
    let s=String(input??'').trim().replace(/[\s\u00a0\u202f$€£]/g,'');
    if(!s||/[A-Za-z%]/.test(s))return null;
    const negative=/^\((.*)\)$/.exec(s);if(negative)s='-'+negative[1];
    if(!/^-?[0-9.,]+$/.test(s))return null;
    const period=s.lastIndexOf('.'),comma=s.lastIndexOf(',');
    if(period>=0&&comma>=0){const decimal=period>comma?'.':',';s=s.replace(decimal==='.'?/,/g:/\./g,'');if(decimal===',')s=s.replace(',','.');}
    else if(comma>=0){const bits=s.split(',');s=bits.length>2||bits.at(-1).length===3?s.replace(/,/g,''):s.replace(',','.');}
    else if(period>=0){const bits=s.split('.');if(bits.length>2)s=s.replace(/\./g,'');}
    const n=Number(s);return Number.isFinite(n)&&n>=0?n:null;
  }
  function identify(cells){
    const data={solotech:[],dealer:[],terms:[],otherCost:[],map:[],retail:[],currency:null,uom:null};
    for(const cell of cells){
      const category=kindOf(cell.label);
      if(!category)continue;
      if(category==='currency'){
        const cur=key(cell.value);if(isCurrency(cur))data.currency=cur;
      }else if(category==='uom'){
        const uom=String(cell.value??'').trim();if(uom)data.uom=uom;
      }else{
        const n=numberOf(cell.value);
        if(n!==null)data[category].push({amount:n,label:cell.label,col:cell.col});
      }
    }
    const primary=data.solotech.length===1?{...data.solotech[0],type:'solotech'}:
      data.solotech.length>1?null:
      data.dealer.length===1?{...data.dealer[0],type:'dealer'}:
      data.dealer.length>1?null:
      data.otherCost.length===1?{...data.otherCost[0],type:'otherCost'}:null;
    let message;
    if(data.solotech.length>1||(!data.solotech.length&&data.dealer.length>1))message='Plusieurs colonnes candidates : comparaison manuelle nécessaire.';
    else if(primary?.type==='solotech')message='Colonne « Solotech Price » détectée. Montant candidat, à confirmer avant D365.';
    else if(primary?.type==='dealer')message='Colonne « Dealer Price » détectée. Le prix négocié Solotech pourrait être différent.';
    else if(primary)message='Coût potentiel détecté. Type de prix à confirmer.';
    else message='Aucun coût d’achat identifiable automatiquement dans les cellules affichées.';
    return {data,primary,message};
  }
  const format=(n,currency)=>new Intl.NumberFormat('fr-CA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+(currency?` ${currency}`:' (devise inconnue)');
  return {identify,numberOf,kindOf,format};
})();
