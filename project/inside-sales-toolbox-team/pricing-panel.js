(()=>{
 const el=id=>document.getElementById(id),M=ToolboxPricing,key='toolboxPricing';
 let state={values:{cost:'',price:'',margin:''},locked:['cost','margin'],discount:'',tax:'14,975',costCurrency:'CAD',priceCurrency:'CAD',tab:'margin',conversionAmount:'',conversionFrom:'CAD',conversionTo:'USD'},rate=null,busy=false,restoring=true,lastResult=null,rateError='';
 const currency=v=>v==='USD'?'USD':'CAD';
 const locale=()=>ToolboxI18n.language==='en'?'en-CA':'fr-CA';
 const number=v=>new Intl.NumberFormat(locale(),{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);
 const money=(v,c)=>number(v)+' '+c;
 const t=s=>ToolboxI18n.t(s);
 function save(){if(restoring)return;chrome.storage.local.set({[key]:state}).catch(()=>message('pricing-status','Impossible de conserver les valeurs.','error'));}
 function message(id,text,kind=''){const p=el(id);p.textContent=text;p.dataset.state=kind;}
 function setValue(id,value,animate=false){const n=el(id),old=n.tagName==='INPUT'?n.value:n.textContent;if(n.tagName==='INPUT')n.value=value;else n.textContent=value;if(animate&&old!==value)ToolboxMotion.text(n);}
 function renderRate(){
  el('pricing-rate-refresh').disabled=busy;el('pricing-rate-refresh').textContent=busy?'Actualisation…':'Actualiser le taux';el('pricing-rate-refresh').setAttribute('aria-busy',String(busy));
  el('pricing-rate-value').textContent=rate?'1 USD = '+new Intl.NumberFormat(locale(),{maximumFractionDigits:6}).format(Number(rate.rate))+' CAD':t('Taux non chargé');
  el('pricing-rate-source').textContent=rateError||(rate?t('Banque du Canada')+' · '+rate.date+(rate.offline?' · '+t('taux conservé, actualisation impossible'):''):t('Banque du Canada'));
 }
 function render(){
  const target=state.locked.length===2?M.fields.find(f=>!state.locked.includes(f)):null;lastResult=null;
  for(const f of M.fields){
   const result=f===target,button=el('pricing-lock-'+f),row=el('pricing-field-'+f);row.classList.toggle('is-result',result);row.classList.remove('is-error');el('pricing-result-'+f).hidden=!result;el('pricing-'+f).readOnly=result;el('pricing-'+f).removeAttribute('aria-invalid');
   button.setAttribute('aria-pressed',String(state.locked.includes(f)));button.setAttribute('aria-label',(state.locked.includes(f)?'Déverrouiller ':'Verrouiller ')+{cost:'le coût',price:'le prix de vente',margin:'la marge'}[f]);
   if(result)el('pricing-'+f).value='';else if(document.activeElement!==el('pricing-'+f))el('pricing-'+f).value=state.values[f]||'';
  }
  for(const id of ['pricing-before','pricing-tax-amount','pricing-total'])setValue(id,'···');el('pricing-net').hidden=true;
  try{
   const result=M.calculate({...state,rate:rate?.rate});
   if(result.pending){message('pricing-status','Verrouille deux valeurs pour calculer la troisième.');return;}
   lastResult=result;setValue('pricing-'+result.target,number(result.display[result.target]),true);
   setValue('pricing-before',money(result.price,state.priceCurrency));setValue('pricing-tax-amount',money(result.taxAmount,state.priceCurrency));setValue('pricing-total',money(result.total,state.priceCurrency),true);
   if(M.parse(state.discount)>0){el('pricing-net').hidden=false;el('pricing-net').textContent=t('Coût après escompte')+' : '+money(result.netCost,state.costCurrency);}
   message('pricing-status',{cost:'Coût calculé automatiquement.',price:'Prix de vente calculé automatiquement.',margin:'Marge calculée automatiquement.'}[result.target],'success');
  }catch(e){
   if(!e.missing&&M.fields.includes(e.field)){el('pricing-field-'+e.field).classList.add('is-error');el('pricing-'+e.field).setAttribute('aria-invalid','true');}
   message('pricing-status',e.message,e.missing?'':'error');
  }
 }
 function renderConversion(){
  setValue('conversion-result','');
  try{const result=M.convert({amount:state.conversionAmount,from:state.conversionFrom,to:state.conversionTo,rate:rate?.rate});setValue('conversion-result',number(result),true);message('conversion-status','Conversion calculée automatiquement.','success');}
  catch(e){message('conversion-status',e.missing?'Entre un montant à convertir.':e.message,e.missing?'':'error');}
 }
 function renderAll(){render();renderConversion();renderRate();}
 async function refreshRate(force=false){
  if(busy)return;busy=true;rateError='';renderRate();
  try{const result=await chrome.runtime.sendMessage({kind:'pricingRate',force});if(result?.error)throw Error(result.error);if(!result?.value||!(Number(result.value.rate)>0))throw Error('Taux de change indisponible.');rate=result.value;rateError='';renderAll();ToolboxMotion.text(el('pricing-rate-value'));}
  catch(e){rateError=e.message;render();renderConversion();}
  finally{busy=false;renderRate();}
 }
 function needsRate(){return state.tab==='conversion'&&state.conversionFrom!==state.conversionTo||state.tab==='margin'&&state.costCurrency!==state.priceCurrency;}
 function activate(){if(needsRate())refreshRate();}
 function selectTab(name,animate=true){state.tab=name==='conversion'?'conversion':'margin';for(const tab of ['margin','conversion']){const selected=state.tab===tab;el('calculator-'+tab).hidden=!selected;el('calculator-tab-'+tab).setAttribute('aria-selected',String(selected));el('calculator-tab-'+tab).tabIndex=selected?0:-1;}if(animate)ToolboxMotion.enter(el('calculator-'+state.tab));save();if(document.body.dataset.module==='calculator')activate();}
 for(const f of M.fields){
  el('pricing-'+f).oninput=()=>{state.values[f]=el('pricing-'+f).value;render();save();};
  el('pricing-lock-'+f).onclick=()=>{
   if(state.locked.includes(f)){if(lastResult)state.values[lastResult.target]=lastResult.result.toFixed(12).replace(/\.?0+$/,'')||'0';state.locked=state.locked.filter(x=>x!==f);}
   else if(state.locked.length<2)state.locked.push(f);
   else{message('pricing-status','Déverrouille d’abord une valeur pour en choisir une autre.','error');ToolboxMotion.text(el('pricing-status'));return;}
   render();save();ToolboxMotion.text(el('pricing-field-'+f));
  };
 }
 for(const [id,prop]of [['pricing-discount','discount'],['pricing-tax','tax']])el(id).oninput=()=>{state[prop]=el(id).value;render();save();};
 for(const [id,prop]of [['pricing-cost-currency','costCurrency'],['pricing-price-currency','priceCurrency']])el(id).onchange=()=>{state[prop]=currency(el(id).value);render();save();activate();};
 el('pricing-clear').onclick=()=>{state.values={cost:'',price:'',margin:''};state.discount='';el('pricing-discount').value='';for(const f of M.fields)el('pricing-'+f).value='';render();save();el('pricing-'+(state.locked[0]||'cost')).focus();};
 for(const name of ['margin','conversion']){
  const b=el('calculator-tab-'+name);b.onclick=()=>selectTab(name);b.addEventListener('keydown',e=>{let next;if(['ArrowLeft','ArrowRight'].includes(e.key))next=name==='margin'?'conversion':'margin';if(e.key==='Home')next='margin';if(e.key==='End')next='conversion';if(next){e.preventDefault();selectTab(next);el('calculator-tab-'+next).focus();}});
 }
 el('conversion-amount').oninput=()=>{state.conversionAmount=el('conversion-amount').value;renderConversion();save();};
 for(const [id,prop]of [['conversion-from','conversionFrom'],['conversion-to','conversionTo']])el(id).onchange=()=>{state[prop]=currency(el(id).value);renderConversion();save();activate();};
 el('conversion-swap').onclick=()=>{[state.conversionFrom,state.conversionTo]=[state.conversionTo,state.conversionFrom];el('conversion-from').value=state.conversionFrom;el('conversion-to').value=state.conversionTo;renderConversion();save();activate();ToolboxMotion.text(el('conversion-result'));};
 el('conversion-clear').onclick=()=>{state.conversionAmount='';el('conversion-amount').value='';renderConversion();save();el('conversion-amount').focus();};
 el('pricing-rate-refresh').onclick=()=>refreshRate(true);
 chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;if(changes.toolboxLanguage)renderAll();if(changes.toolboxPricingRate?.newValue){rate=changes.toolboxPricingRate.newValue;renderAll();}});
 globalThis.ToolboxCalculator={activate};
 const controls=[...el('tool-calculator').querySelectorAll('button,input,select')];for(const c of controls)c.disabled=true;
 chrome.storage.local.get([key,'toolboxPricingRate']).then(saved=>{
  if(saved[key]){const d=saved[key];state={...state,...d,values:{...state.values,...d.values},locked:Array.isArray(d.locked)?[...new Set(d.locked)].filter(f=>M.fields.includes(f)).slice(0,2):state.locked,costCurrency:currency(d.costCurrency),priceCurrency:currency(d.priceCurrency),conversionFrom:currency(d.conversionFrom),conversionTo:currency(d.conversionTo||'USD')};}
  if(saved.toolboxPricingRate&&Number(saved.toolboxPricingRate.rate)>0)rate=saved.toolboxPricingRate;
  for(const f of M.fields)el('pricing-'+f).value=state.values[f]||'';
  for(const [id,prop]of [['pricing-discount','discount'],['pricing-tax','tax'],['pricing-cost-currency','costCurrency'],['pricing-price-currency','priceCurrency'],['conversion-amount','conversionAmount'],['conversion-from','conversionFrom'],['conversion-to','conversionTo']])el(id).value=state[prop];
 }).catch(()=>message('pricing-status','Impossible de restaurer les valeurs.','error')).finally(()=>{for(const c of controls)c.disabled=false;restoring=false;selectTab(state.tab,false);renderAll();});
})();
