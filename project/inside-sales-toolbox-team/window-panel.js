(()=>{
 const I=globalThis.ToolboxInstances,button=document.getElementById('toolbox-windows');
 if(!button)return;if(!I?.base||!Number.isInteger(I.windowId)){button.disabled=true;return;}
 const t=s=>globalThis.ToolboxI18n?.t(s)||s,dialog=document.createElement('dialog');dialog.id='toolbox-window-dialog';dialog.className='window-dialog';dialog.setAttribute('aria-labelledby','window-dialog-title');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls',dialog.id);document.body.append(dialog);
 const send=async(action,extra={})=>{const result=await I.base.runtime.sendMessage({kind:'windowSession',action,windowId:I.windowId,...extra});if(result?.error)throw Error(result.error);return result?.value;};
 const node=(tag,text,className)=>{const element=document.createElement(tag);if(text)element.textContent=t(text);if(className)element.className=className;return element;};
 let changing=false;
 const working=()=>!!document.querySelector('[aria-busy="true"],.used-export-excel:disabled,#nonreserved-refresh:disabled,#powerbi-refresh:disabled,#product-submit:disabled');
 async function change(action,extra={}){if(changing)return;const status=dialog.querySelector('[role=status]');try{if(working())throw Error(t('Attends la fin de l’opération en cours avant de changer la liaison.'));changing=true;const flush=[];document.dispatchEvent(new CustomEvent('toolbox-before-session-change',{detail:flush}));await Promise.all(flush);await send(action,extra);}catch(e){status.textContent=e.message;}finally{changing=false;}}
 function action(label,fn){const b=node('button',label,'secondary');b.type='button';b.onclick=fn;dialog.append(b);return b;}
 async function refresh(){const info=await send('info');if(!info)return;button.setAttribute('aria-pressed',String(info.linked));button.title=t(info.linked?'Fenêtres liées':'Fenêtres indépendantes');button.setAttribute('aria-label',button.title);if(!dialog.open)return;
  dialog.replaceChildren();const heading=node('div',null,'window-dialog-heading'),title=node('strong','Fenêtres du Toolbox');title.id='window-dialog-title';const close=node('button','×','text-button');close.setAttribute('aria-label',t('Fermer'));close.onclick=()=>dialog.close();heading.append(title,close);dialog.append(heading,node('p',info.linked?'Ces fenêtres partagent leur navigation, leurs brouillons et leurs résultats.':'Le travail reste dans cette fenêtre quand tu changes d’onglet.','muted'));
  if(info.linked)action('Séparer cette fenêtre',()=>change('split'));
  const targets=info.windows.filter(w=>!w.linked);if(targets.length){dialog.append(node('p','Lier adopte le travail de la fenêtre choisie. Ton travail précédent reste conservé.','fine-print'));for(const target of targets)action(t('Lier à la fenêtre')+' '+target.windowId+(target.title?' · '+target.title:''),()=>change('link',{targetWindowId:target.windowId}));}
  if(info.backup)action('Reprendre ma session précédente',()=>change('restore'));
  action('Afficher la fenêtre de travail',async()=>{try{await send('showWork');dialog.close();}catch(e){dialog.querySelector('[role=status]').textContent=e.message;}});
  const status=node('p',null,'window-dialog-status');status.setAttribute('role','status');dialog.append(status);
 }
 button.onclick=()=>{dialog.showModal();refresh().catch(e=>{dialog.replaceChildren(node('p',e.message));});};
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>button.focus());
 I.base.storage.onChanged.addListener((changes,area)=>{if(area==='session'&&changes.toolboxWindowSessions)refresh().catch(()=>{});});chrome.storage.onChanged.addListener(changes=>{if(changes.toolboxLanguage)refresh().catch(()=>{});});refresh().catch(()=>{});
})();
