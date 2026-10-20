// Local presentation of Ready to PIK rows. Source strings remain unchanged.
(()=>{
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim(),key=s=>norm(s).replace(/[^a-z0-9]/g,'');
 const pickup=value=>/^(pickup|ramassage|cueillette|collect|collection)$/.test(key(value));
 const defaults={query:'',delivery:'',payment:'',sort:'delivery'};
 function state(value={}){return {...defaults,...Object.fromEntries(Object.keys(defaults).map(k=>[k,typeof value?.[k]==='string'?value[k]:defaults[k]])),sort:['delivery','payment','amount-desc','amount-asc','customer'].includes(value?.sort)?value.sort:defaults.sort};}
 function number(value){
  let s=String(value??'').trim();if(!s||!/^[\d\s\u00a0\u202f.,()+\-\p{Sc}A-Za-z]+$/u.test(s))return null;
  const negative=/^\(.*\)$/.test(s);s=s.replace(/[A-Za-z\p{Sc}\s\u00a0\u202f()]/gu,'');
  if(s.includes(',')&&s.includes('.'))s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');
  else if(s.includes(','))s=/^[+-]?\d{1,3}(,\d{3})+$/.test(s)?s.replace(/,/g,''):s.replace(',','.');
  if(!/^[+-]?\d+(\.\d+)?$/.test(s))return null;return Number(s)*(negative?-1:1);
 }
 function columns(headers){
  const keys=headers.map(key),find=names=>{for(const name of names){const i=keys.indexOf(name);if(i>=0)return i;}return -1;};
  return {order:find(['salesordernumber','sonumber','numerodecommande','numerocommande']),customer:find(['accountname','customername','nomducompte','nomduclient','customer','client']),amount:find(['totalnotinvoiced','totalnonfacture','amount','montant']),qty:find(['physicalreserveqty','quantitereserveephysiquement']),delivery:find(['modeofdelivery','deliverymode','modedelivraison']),payment:find(['paymentterms','termsofpayment','termesdepaiement','conditionsdepaiement','payment','paiement']),notes:find(['internalnotes','internalnote','solinternalnotes','notesinternes','noteinterne'])};
 }
 function notes(data,row){
  const cols=columns(data.headers),i=cols.notes;
  if(i>=0&&row.values[i]!==undefined&&row.values[i]!==null&&!row.unreadColumns?.includes(i))return {available:true,value:String(row.values[i]),source:'Power BI'};
  const saved=row.internalNotes,order=String(row.values[cols.order]??'');
  if(saved?.order===order&&saved.source==='D365'&&typeof saved.value==='string'&&Number.isFinite(saved.at))return {available:true,value:saved.value,source:'D365',at:saved.at};
  return {available:false,value:'',source:''};
 }
 function select(data,input){
  const filters=state(input),cols=columns(data.headers),value=(r,k)=>String(cols[k]>=0?r.values[cols[k]]??'':'');
  const compare=new Intl.Collator('fr-CA',{numeric:true,sensitivity:'base'}).compare;
  const choices=k=>[...new Set(data.rows.map(r=>value(r,k)).filter(Boolean))].sort(compare);
  const rows=data.rows.filter(r=>{const delivery=value(r,'delivery'),d=filters.delivery;return (!filters.query||norm(r.values.join(' ')+' '+notes(data,r).value).includes(norm(filters.query)))&&(!filters.payment||value(r,'payment')===filters.payment)&&(!d||(d==='@pickup'?pickup(delivery):d==='@other'?!!delivery&&!pickup(delivery):delivery===d));}).map((r,i)=>({r,i}));
  rows.sort((a,b)=>{
   let result=0;
   if(filters.sort.startsWith('amount')){const x=number(value(a.r,'amount')),y=number(value(b.r,'amount'));result=x===null?(y===null?0:1):y===null?-1:(x-y)*(filters.sort==='amount-desc'?-1:1);}
   else if(filters.sort==='delivery'){const x=value(a.r,'delivery'),y=value(b.r,'delivery');result=Number(!pickup(x))-Number(!pickup(y))||Number(!x)-Number(!y)||compare(pickup(x)?'':x,pickup(y)?'':y);}
   else if(filters.sort==='payment'){const x=value(a.r,'payment'),y=value(b.r,'payment');result=Number(!x)-Number(!y)||compare(x,y);}
   return result||compare(value(a.r,'customer'),value(b.r,'customer'))||compare(value(a.r,'order'),value(b.r,'order'))||a.i-b.i;
  });
  return {rows:rows.map(x=>x.r),value,notes:r=>notes(data,r),deliveryChoices:choices('delivery'),paymentChoices:choices('payment'),group:r=>filters.sort==='delivery'?(pickup(value(r,'delivery'))?'Ramassage · PICK UP':value(r,'delivery')||'Non renseigné'):filters.sort==='payment'?(value(r,'payment')||'Non renseigné'):null};
 }
 globalThis.ToolboxOrderModel={state,select,columns,notes,number,pickup};
})();
