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
function install(){
 chrome.contextMenus.removeAll(()=>{
 chrome.contextMenus.create({id:'inside-sales',title:'Inside Sales Toolbox',contexts:['selection']});
 for(const [id,title] of items)chrome.contextMenus.create({id:'ist-'+id,parentId:'inside-sales',title,contexts:['selection']});
 });
}
chrome.runtime.onInstalled.addListener(install);
chrome.runtime.onStartup.addListener(install);
async function act(info,tab){
 const action=String(info.menuItemId).replace(/^ist-/,'');
 if(!items.some(([id])=>id===action)||!info.selectionText?.trim())return;
 const text=info.selectionText.trim(),M=ContactModel;
 if(action==='product'){try{await searchProduct(text);}catch{/* The result panel shows the error. */}return;}
 const saved=await chrome.storage.local.get(['toolboxContacts']);
 let d=saved.toolboxContacts||{raw:'',name:'',phone:'',email:'',warning:''};
 const update={toolboxModule:'contacts',toolboxContextTab:tab?.id||null};
 if(action==='hs'){update.toolboxModule='hs';update.hsInput=text;update.toolboxQuick=null;}
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
 // A separate extension window remains open while the user switches source tabs.
 const windowUrl=chrome.runtime.getURL('popup.html')+'?toolboxWindow=1';
 const session=await chrome.storage.session.get('toolboxContextWindow');
 let window;
 if(session.toolboxContextWindow){try{const existing=await chrome.windows.get(session.toolboxContextWindow,{populate:true});const page=existing.tabs?.find(t=>t.url===windowUrl);if(page){await chrome.tabs.reload(page.id);await chrome.windows.update(existing.id,{focused:true});window=existing;}}catch{}}
 if(!window)window=await chrome.windows.create({url:windowUrl,type:'popup',width:520,height:740});
 await chrome.storage.session.set({toolboxContextWindow:window.id});
}
let queue=Promise.resolve();
chrome.contextMenus.onClicked.addListener((info,tab)=>{if(info.menuItemId==='ist-product'){chrome.storage.local.set({toolboxModule:'products'});const fallback=()=>chrome.windows.create({url:chrome.runtime.getURL('popup.html')+'?toolboxWindow=1',type:'popup',width:520,height:740});if(chrome.sidePanel?.open&&tab?.windowId!==undefined){chrome.sidePanel.open({windowId:tab.windowId}).catch(fallback);}else fallback();}queue=queue.catch(()=>{}).then(()=>act(info,tab)).catch(e=>chrome.storage.local.set({toolboxContextError:e.message}));});
})();
