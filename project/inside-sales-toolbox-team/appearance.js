/* Appearance belongs to the current Toolbox instance, just like its language. */
(()=>{
 const root=document.documentElement,button=document.getElementById('toolbox-appearance');
 const valid=value=>value==='light'||value==='dark';
 function apply(value){if(root.dataset.appearance!==value)root.dataset.appearance=value;}
 // The embedded HS document follows its owning Toolbox, without its own preference.
 try{if(parent!==window&&parent.ToolboxAppearance){
  const owner=parent.document.documentElement;
  apply(owner.dataset.appearance);
  const observer=new MutationObserver(()=>apply(owner.dataset.appearance));
  observer.observe(owner,{attributes:true,attributeFilter:['data-appearance']});
  globalThis.addEventListener?.('pagehide',()=>observer.disconnect(),{once:true});
  return;
 }}catch{/* A standalone document can still use its own appearance. */}
 const media=globalThis.matchMedia?.('(prefers-color-scheme: dark)');
 let explicit=false,revision=0,pending=0,writes=Promise.resolve();
 function render(value){
  apply(value);
  if(!button)return;
  const label=value==='dark'?'Activer le mode clair':'Activer le mode sombre';
  button.setAttribute('aria-pressed',String(value==='dark'));
  button.setAttribute('aria-label',globalThis.ToolboxI18n?.t(label)||label);
  button.setAttribute('title',globalThis.ToolboxI18n?.t(label)||label);
 }
 render(media?.matches?'dark':'light');
 media?.addEventListener?.('change',event=>{if(!explicit)render(event.matches?'dark':'light');});
 const storage=globalThis.chrome?.storage;
 button?.addEventListener('click',()=>{
  explicit=true;revision++;pending++;
  const value=root.dataset.appearance==='dark'?'light':'dark';render(value);
  // Preserve click order even when the scoped IndexedDB storage is slow.
  writes=writes.then(()=>storage?.local.set({toolboxAppearance:value})).catch(()=>{}).finally(()=>{pending--;});
 });
 storage?.onChanged.addListener((changes,area)=>{
  if(area==='local'&&changes.toolboxLanguage)render(root.dataset.appearance);
  if(area==='local'&&!pending&&valid(changes.toolboxAppearance?.newValue)){
   explicit=true;revision++;render(changes.toolboxAppearance.newValue);
  }
 });
 const before=revision;
 Promise.resolve().then(()=>storage?.local.get('toolboxAppearance')).then(saved=>{
  if(before===revision&&valid(saved?.toolboxAppearance)){explicit=true;render(saved.toolboxAppearance);}
 }).catch(()=>{});
 globalThis.ToolboxAppearance={get value(){return root.dataset.appearance;}};
})();
