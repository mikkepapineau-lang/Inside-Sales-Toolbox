// Exact decimal arithmetic for prices, discounts and tax rounding.
(()=>{
 const fields=['cost','price','margin'];
 const fail=(field,message,missing=false)=>{throw Object.assign(Error(message),{field,missing});};
 function compact(value){
  let s=String(value??'').trim().replace(/(?:CAD|USD)/gi,'').replace(/[$%\s\u00a0\u202f]/g,'');
  if(s.includes(',')&&s.includes('.')){
   if(s.lastIndexOf(',')>s.lastIndexOf('.')){if(!/^-?\d{1,3}(?:\.\d{3})*,\d+$/.test(s))return null;s=s.replace(/\./g,'').replace(',','.');}
   else{if(!/^-?\d{1,3}(?:,\d{3})*\.\d+$/.test(s))return null;s=s.replace(/,/g,'');}
  }else s=s.replace(',','.');
  return s===''?'':/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)&&s.length<=40?s:null;
 }
 function fraction(value,field){
  const s=compact(value);if(s==='')fail(field,'Entre les deux valeurs verrouillées.',true);if(s===null)fail(field,'Entre une valeur numérique valide.');
  const neg=s.startsWith('-'),[whole,dec='']=s.replace('-','').split('.');return {n:BigInt((whole||'0')+dec)*(neg?-1n:1n),d:10n**BigInt(dec.length)};
 }
 const n=v=>({n:BigInt(v),d:1n}),mul=(a,b)=>({n:a.n*b.n,d:a.d*b.d}),sub=(a,b)=>({n:a.n*b.d-b.n*a.d,d:a.d*b.d}),div=(a,b)=>({n:a.n*b.d,d:a.d*b.n});
 const num=a=>Number(a.n)/Number(a.d);
 function rounded(a,digits=2){
  const scale=10n**BigInt(digits),negative=a.n<0n,abs=negative?-a.n:a.n;let q=abs*scale/a.d;
  if((abs*scale%a.d)*2n>=a.d)q++;return Number(negative?-q:q)/Number(scale);
 }
 function parse(value){const s=compact(value);return s===''?null:s===null?NaN:Number(s);}
 function calculate(state){
  const locks=[...new Set(state.locked||[])].filter(f=>fields.includes(f));if(locks.length!==2)return {pending:true};
  const target=fields.find(f=>!locks.includes(f)),one=n(1),hundred=n(100),v={};
  for(const field of locks)v[field]=fraction(state.values?.[field],field);
  const discount=fraction(state.discount||'0','discount'),tax=fraction(state.tax??'14.975','tax');
  if(num(discount)<0||num(discount)>=100)fail('discount','L’escompte doit être entre 0 % et moins de 100 %.');
  if(num(tax)<0||num(tax)>100)fail('tax','Le taux de taxes doit être entre 0 % et 100 %.');
  if(v.cost&&v.cost.n<0n)fail('cost','Le coût ne peut pas être négatif.');
  if(v.price&&(v.price.n<0n||(target==='margin'&&v.price.n===0n)))fail('price',target==='margin'?'Le prix de vente doit être supérieur à 0.':'Le prix de vente ne peut pas être négatif.');
  if(v.margin&&(num(v.margin)<0||num(v.margin)>=100))fail('margin','La marge doit être entre 0 % et moins de 100 %.');
  const costCurrency=state.costCurrency==='USD'?'USD':'CAD',priceCurrency=state.priceCurrency==='USD'?'USD':'CAD';let fx=one;
  if(costCurrency!==priceCurrency){
   if(!state.rate||!Number.isFinite(parse(state.rate))||parse(state.rate)<=0)fail('rate','Actualise le taux de change pour calculer entre CAD et USD.');
   const r=fraction(state.rate,'rate');fx=costCurrency==='USD'?r:div(one,r);
  }
  const discountFactor=sub(one,div(discount,hundred));
  if(target==='price')v.price=div(mul(mul(v.cost,discountFactor),fx),sub(one,div(v.margin,hundred)));
  if(target==='cost')v.cost=div(div(mul(v.price,sub(one,div(v.margin,hundred))),fx),discountFactor);
  const net=mul(v.cost,discountFactor);
  if(target==='margin')v.margin=mul(div(sub(v.price,mul(net,fx)),v.price),hundred);
  const values=Object.fromEntries(fields.map(f=>[f,num(v[f])]));
  if(Object.values(values).some(x=>!Number.isFinite(x)||Math.abs(x)>1e12))fail(target,'Le montant est trop élevé.');
  const price=rounded(v.price),taxAmount=rounded(mul(fraction(price.toFixed(2),'price'),div(tax,hundred)));
  return {target,values,result:rounded(v[target],12),display:Object.fromEntries(fields.map(f=>[f,rounded(v[f])])),netCost:rounded(net),price,taxAmount,total:Math.round((price+taxAmount)*100)/100};
 }
 function convert({amount,from='CAD',to='USD',rate}){
  let value=fraction(amount,'conversion');if(value.n<0n)fail('conversion','Le montant ne peut pas être négatif.');
  if(from!==to){if(!rate||!Number.isFinite(parse(rate))||parse(rate)<=0)fail('rate','Actualise le taux de change pour convertir.');const fx=fraction(rate,'rate');value=from==='USD'?mul(value,fx):div(value,fx);}
  if(!Number.isFinite(num(value))||num(value)>1e12)fail('conversion','Le montant est trop élevé.');return rounded(value);
 }
 globalThis.ToolboxPricing={fields,parse,calculate,convert};
})();
