(()=>{
const items=[
 ['product','Rechercher dans D365 · Product Search'],
 ['contacts','Préparer les coordonnées du client'],
 ['append','Ajouter au texte de coordonnées'],
 ['name','Utiliser comme nom du client'],
 ['phone','Utiliser comme téléphone du client'],
 ['email','Utiliser comme courriel du client'],
 ['hs','Vérifier ce code HS'],
 ['upper','Texte en MAJUSCULES'],
 ['lower','Texte en minuscules'],
 ['title','Majuscule au début de chaque mot']
];
async function install(preferred){
 if(!chrome.contextMenus?.removeAll)return;
 const saved=await chrome.storage.local.get('toolboxLanguage');
 const translated=title=>(typeof preferred==='string'?preferred:saved.toolboxLanguage)==='en'?(ToolboxDictionary[title]||title):title;
 chrome.contextMenus.removeAll(()=>{
 chrome.contextMenus.create({id:'inside-sales',title:'Inside Sales Toolbox',contexts:['selection']});
 for(const [id,title] of items)chrome.contextMenus.create({id:'ist-'+id,parentId:'inside-sales',title:translated(title),contexts:['selection']});
 });
}
chrome.runtime.onInstalled.addListener(install);
chrome.runtime.onStartup.addListener(install);
chrome.storage.onChanged.addListener((changes,area)=>{
 if(area==='local'&&changes.toolboxLanguage)install();
 const key=area==='session'&&Object.keys(changes).find(k=>k.endsWith(':localChanged')&&changes[k].newValue?.keys?.includes('toolboxLanguage'));
 if(key&&globalThis.ToolboxInstances){const id=key.split(':')[2];ToolboxInstances.api(id).storage.local.get('toolboxLanguage').then(s=>install(s.toolboxLanguage)).catch(()=>{});}
});
chrome.tabs.onActivated?.addListener(info=>{if(globalThis.ToolboxInstances)ToolboxWindowSessions.resolve(info.windowId,info.tabId).then(({id})=>ToolboxInstances.api(id).storage.local.get('toolboxLanguage')).then(s=>install(s.toolboxLanguage)).catch(()=>{});});
async function act(info,tab){
 const id=globalThis.ToolboxWindowSessions?(await ToolboxWindowSessions.resolve(tab.windowId,tab.id)).id:'tab-'+tab.id,chrome=globalThis.ToolboxInstances?ToolboxInstances.api(id):globalThis.chrome;
 const ToolboxNavigation={remember:module=>chrome.storage.session.set({toolboxNavigation:{module,at:Date.now()}})};
 const action=String(info.menuItemId).replace(/^ist-/,'');
 if(!items.some(([id])=>id===action)||!info.selectionText?.trim())return;
 const text=info.selectionText.trim(),M=ContactModel;
 if(action==='product'){try{await (globalThis.ToolboxInstances?ToolboxInstances.run(id,()=>ToolboxInstances.worker('products',id).searchProduct(text)):globalThis.searchProduct(text));}catch{/* The result panel shows the error. */}return;}
 const saved=await chrome.storage.local.get(['toolboxContacts']);
 let d=saved.toolboxContacts||{raw:'',name:'',phone:'',email:'',warning:''};
 const update={toolboxContextTab:tab?.id||null};
 if(action==='hs'){update.hsInput=text;update.toolboxQuick=null;}
 else if(['upper','lower','title'].includes(action)){
 update.toolboxQuick={text:action==='upper'?text.toLocaleUpperCase('fr-CA'):action==='lower'?text.toLocaleLowerCase('fr-CA'):M.title(text),label:'Texte formaté'};
 }else{
 update.toolboxQuick=null;
 if(action==='contacts'){const parsed=M.parse(text);d={raw:text,...parsed,warning:parsed.warnings.join(' ')};}
 if(action==='append')d={...d,raw:[d.raw,text].filter(Boolean).join('\n')};
 if(action==='name')d={...d,name:M.title(text),warning:''};
 if(action==='phone')d={...d,phone:M.phone(text)||text,warning:M.phone(text)?'':'Téléphone à vérifier : format non reconnu.'};
 if(action==='email')d={...d,email:text.replace(/^mailto:/i,'').trim().toLowerCase(),warning:''};
 update.toolboxContacts=d;
 }
 await chrome.storage.local.set(update);
 await ToolboxNavigation.remember(action==='hs'?'hs':'contacts');
 // A separate extension window remains open while the user switches source tabs.
 const windowUrl=chrome.runtime.getURL('popup.html')+'?toolboxWindow=1&hostWindow='+tab.windowId;
 const session=await chrome.storage.session.get('toolboxContextWindow');
 let window;
 if(session.toolboxContextWindow){try{const existing=await chrome.windows.get(session.toolboxContextWindow,{populate:true});const page=existing.tabs?.find(t=>t.url===windowUrl);if(page){await chrome.tabs.reload(page.id);await chrome.windows.update(existing.id,{focused:true});window=existing;}}catch{}}
 if(!window)window=await chrome.windows.create({url:windowUrl,type:'popup',width:520,height:740});
 await chrome.storage.session.set({toolboxContextWindow:window.id});
}
let queue=Promise.resolve();
chrome.contextMenus.onClicked.addListener((info,tab)=>{
 if(!tab?.id||!Number.isInteger(tab.windowId))return;
 const fallback=()=>chrome.windows.create({url:chrome.runtime.getURL('popup.html')+'?toolboxWindow=1&hostWindow='+tab.windowId,type:'popup',width:440,height:850});
 // Call open directly during the context-menu gesture, before any asynchronous storage work.
 if(info.menuItemId==='ist-product'){
  if(chrome.sidePanel?.open)chrome.sidePanel.open({windowId:tab.windowId}).catch(fallback);else fallback();
 }
 queue=queue.catch(()=>{}).then(async()=>{
  const id=(await ToolboxWindowSessions.resolve(tab.windowId,tab.id)).id,api=ToolboxInstances.api(id);
  if(info.menuItemId==='ist-product')await api.storage.session.set({toolboxNavigation:{module:'products',at:Date.now()}});
  try{await act(info,tab);}catch(e){await api.storage.local.set({toolboxContextError:e.message});}
 }).catch(e=>console.error('Toolbox context menu:',e.message));
});
})();
