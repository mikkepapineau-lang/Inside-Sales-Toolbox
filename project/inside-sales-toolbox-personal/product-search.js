const PRODUCT_SEARCH_URL='https://solotech.operations.dynamics.com/?cmp=CAOP&mi=SOLMCRProductQuickQuote';
let productSearchBusy=false;
async function searchProduct(selection){
 const text=String(selection||'').trim();
 if(!text||text.length>500)throw Error('Sélectionne un SKU ou un texte de recherche de 500 caractères maximum.');
 if(productSearchBusy)throw Error('Une recherche Product Search est déjà en cours.');
 productSearchBusy=true;
 try{
 const previous=(await chrome.storage.local.get('toolboxProductSearch')).toolboxProductSearch;
 if(!await chrome.permissions.contains({origins:['https://solotech.operations.dynamics.com/*']}))throw Error('Autorise D365 avec « Autoriser tous les accès », puis relance le clic droit.');
 // Recover an existing Product Search tab even after the extension has been updated.
 const saved=await chrome.storage.session.get('productSearchTab');
 let tab=await ToolboxTabs.find(['SOLMCRProductQuickQuote'],saved.productSearchTab);
 if(!tab)tab=await chrome.tabs.create({url:PRODUCT_SEARCH_URL,active:false});
 await chrome.storage.session.set({productSearchTab:tab.id});
 await chrome.storage.local.set({toolboxModule:'products',toolboxProductSearch:{query:text,state:'loading',message:'Recherche dans D365…',rows:[],headers:[],tabId:tab.id}});
 const deadline=Date.now()+45000;let ready=false,before=null;
 while(Date.now()<deadline){
 const current=await chrome.tabs.get(tab.id);
 if(current.status==='complete'){
 const u=new URL(current.url);
 if(ToolboxTabs.matches(current,['SOLMCRProductQuickQuote'])){
 await chrome.scripting.executeScript({target:{tabId:tab.id},files:['d365-controls.js','product-grid.js']});
 const [r]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:async value=>{
  const field=globalThis.D365Controls.find('SOLMCRProductQuickQuote','MCRSearchString','field');
  if(!field)return {ready:false};
  const before=globalThis.ProductGrid.snapshot();
  field.focus();const proto=field.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto,'value').set.call(field,value);
  field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));
  await new Promise(r=>setTimeout(r,250));
  const target=globalThis.D365Controls.find('SOLMCRProductQuickQuote','MCRSearchString','field');
  if(!target||target.value!==value)throw Error('Le texte de recherche n’a pas été retenu.');
  target.focus();
  for(const type of ['keydown','keypress','keyup'])target.dispatchEvent(new KeyboardEvent(type,{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true,cancelable:true}));
  return {ready:true,before};
 },args:[text]});
 if(r?.result?.ready){ready=true;before=r.result.before;break;}
 }
 }
 await new Promise(r=>setTimeout(r,600));
 }
 if(!ready)throw Error('Product Search ne présente pas le champ MCRSearchString. Vérifie la connexion D365 et l’onglet ouvert, puis relance le clic droit.');
 await chrome.storage.local.remove('toolboxContextError');
 const initial=JSON.stringify(before);const repeat=previous?.state==='done'&&previous.query===text&&previous.tabId===tab.id&&JSON.stringify(previous.rows)===JSON.stringify(before?.rows)&&JSON.stringify(previous.headers)===JSON.stringify(before?.headers);let last='',stableSince=0,result=null;
 const resultDeadline=Date.now()+25000;
 while(Date.now()<resultDeadline){
  const [r]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>globalThis.ProductGrid.snapshot()});
  const value=r?.result,signature=JSON.stringify(value);
  if(value?.recognized&&!value.busy&&(signature!==initial||repeat)&&(value.rows.length||value.total===0)){
   if(signature!==last){last=signature;stableSince=Date.now();}
   else if(Date.now()-stableSince>=1200){result=value;break;}
  }else{last='';stableSince=0;}
  await new Promise(r=>setTimeout(r,400));
 }
 if(!result)throw Error('Impossible de confirmer les résultats de cette recherche. Clique sur « Ouvrir dans D365 » pour vérifier la page.');
 await chrome.storage.local.set({toolboxProductSearch:{...result,query:text,state:'done',message:result.rows.length+' ligne(s) chargée(s) depuis D365.',tabId:tab.id,at:Date.now()}});
 return {tabId:tab.id,text};
 }catch(e){await chrome.storage.local.set({toolboxModule:'products',toolboxProductSearch:{query:text,state:'error',message:e.message,headers:[],rows:[],tabId:(await chrome.storage.session.get('productSearchTab')).productSearchTab}});throw e;}finally{productSearchBusy=false;}
}
chrome.runtime.onMessage.addListener((m,s,reply)=>{if(s.id!==chrome.runtime.id||m?.kind!=='productSearch')return;searchProduct(m.text).then(value=>reply({value}),e=>reply({error:e.message}));return true;});
