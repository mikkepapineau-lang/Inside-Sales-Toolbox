(()=>{
if(globalThis.D365Controls?.version==='2.2.2')return;
const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
const compact=s=>String(s||'').toLowerCase().replace(/[\s_-]/g,'');
const attrs=e=>['id','name','data-dyn-controlname','data-dyn-formname','data-control-name','data-form-name'].map(a=>e.getAttribute(a)||'').filter(Boolean);
function all(){const roots=[document],out=[];for(let i=0;i<roots.length;i++)for(const e of roots[i].querySelectorAll('*')){out.push(e);if(e.shadowRoot)roots.push(e.shadowRoot);}return out;}
function formMatch(e,form){
 if(form==='smmBusRelTable'&&formMatch(e,'smmbusinessrelationslistpage'))return true;
 const f=compact(form);
 for(let n=e;n;n=n.parentElement){if(attrs(n).some(v=>{const c=compact(v);return c===f||c.startsWith(f)&&/^\d/.test(c.slice(f.length))||v.toLowerCase().startsWith(form.toLowerCase()+'_');}))return true;}
 return false;
}
function kindInputSuffix(value,control){const c=compact(value.replace(/_input$/i,''));return /_input$/i.test(value)&&(c===compact(control)||c.endsWith(compact(control))&&value.toLowerCase().includes('_'+control.toLowerCase()+'_input'));}
function controlMatch(e,control){
 const wanted=compact(control);
 return attrs(e).some(v=>{
  const c=compact(v);if(c===wanted)return true;
  if(kindInputSuffix(v,control))return true;
  // Dynamic IDs prefix the control with a form instance; only allow whole suffixes.
  return c.endsWith(wanted)&&/[\s_-]/.test(v.slice(0,Math.max(0,v.length-control.length)));
 });
}
function find(form,control,kind){
 const nodes=all().filter(e=>visible(e)&&formMatch(e,form)&&controlMatch(e,control));
 const targets=new Set();
 const selector=kind==='field'?'input,select,textarea':'button,a,[role="button"],[role="menuitem"],input[type="button"],input[type="submit"]';
 const eligible=e=>visible(e)&&!e.disabled&&e.getAttribute('aria-disabled')!=='true'&&!(kind==='field'&&(e.readOnly||['hidden','button','submit','checkbox','radio'].includes(e.type)));
 for(const node of nodes){
  let candidates=[...(node.matches(selector)?[node]:[]),...node.querySelectorAll(selector)].filter(eligible);
  if(kind==='field'&&candidates.length>1){
   const lookups=candidates.filter(e=>e.tagName==='SELECT'||e.getAttribute('role')==='combobox'||e.getAttribute('aria-haspopup')==='listbox');
   if(lookups.length===1)candidates=lookups;
  }
  if(kind==='action'&&!candidates.length){const parent=node.closest(selector);if(parent&&formMatch(parent,form)&&eligible(parent))candidates=[parent];}
  if(candidates.length===1)targets.add(candidates[0]);
 }
 const unique=[...targets].filter(e=>![...targets].some(other=>other!==e&&e.contains(other)));
 if(unique.length===1)return unique[0];
 if(nodes.length){const error=Error(control+' repéré dans '+form+', mais '+unique.length+' cible(s) utilisable(s). Aucun choix automatique.');error.unavailable=unique.length===0;throw error;}
 return null;
}
const caption=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[*:]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
function action(form,names,{allowUnscoped=false}={}){
 const wanted=names.map(caption),selector='button,a,[role="button"],[role="tab"],[role="menuitem"]';
 const nodes=all(),enabled=e=>visible(e)&&!e.disabled&&e.getAttribute('aria-disabled')!=='true';
 let matches=nodes.filter(e=>e.matches(selector)&&enabled(e)&&[e.innerText,e.getAttribute('aria-label'),e.getAttribute('title')].some(v=>wanted.includes(caption(v))));
 for(const node of nodes){
  if(!node.matches('span,div')||node.children?.length||!visible(node)||!wanted.includes(caption(node.textContent||node.innerText)))continue;
  const target=node.closest(selector);if(target&&enabled(target))matches.push(target);
 }
 matches=[...new Set(matches)];
 matches=matches.filter(e=>!matches.some(other=>other!==e&&e.contains?.(other)));
 const scoped=matches.filter(e=>formMatch(e,form));
 if(scoped.length)matches=scoped;else if(!allowUnscoped)return null;
 if(matches.length>1)throw Error('Action '+names[0]+' ambiguë dans '+form+'. Aucun clic automatique.');
 return matches[0]||null;
}
async function waitFor(check,{timeout=18000,onBlocked}={}){
 const start=Date.now();let woken=false;
 while(Date.now()-start<timeout){
  const result=await check();if(result)return result;
  // Some F&O transitions wait for a visible tab. Wake it once without replaying the action.
  if(!woken&&onBlocked&&document.visibilityState==='hidden'&&Date.now()-start>=1800){woken=true;await onBlocked();}
  await new Promise(r=>setTimeout(r,200));
 }
 throw Error('D365 ne présente pas encore les champs attendus. Affiche D365 pour vérifier.');
}
function reveal(form,targets,verify=()=>{},clicked=new WeakSet()){
 const nodes=all(),buttons=nodes.filter(e=>visible(e)&&formMatch(e,form)&&e.matches('button,[role="button"],[role="tab"]'));
 for(const target of targets){
  for(let n=target.parentElement;n;n=n.parentElement){
   if(!clicked.has(n)&&visible(n)&&n.matches('button[aria-expanded="false"],[role="button"][aria-expanded="false"]')){verify();clicked.add(n);n.click();}
  }
  for(const b of buttons){
   if(b.getAttribute('aria-expanded')!=='false'&&!(b.getAttribute('role')==='tab'&&b.getAttribute('aria-selected')==='false'))continue;
   const panels=String(b.getAttribute('aria-controls')||'').split(/\s+/).filter(Boolean).map(id=>document.getElementById(id));
   if(!clicked.has(b)&&panels.some(p=>p&&(p===target||p.contains(target)))){verify();clicked.add(b);b.click();}
  }
 }
}
async function prepareForm(form,{ready,verify=()=>{},onBlocked,timeout=18000}={}){
 let editClicked=false;
 return waitFor(()=>{
  verify();
  const result=ready();if(result)return result;
  if(!editClicked){
   let edit;
   // Prefer a known Edit control whenever this exact form exposes it.
   const control='SystemDefinedViewEditButton';
   try{edit=find(form,control,'action');}catch(e){if(!e.unavailable)throw e;return false;}
   // A hidden/disabled known control must become available before any click.
   if(!edit&&all().some(e=>formMatch(e,form)&&controlMatch(e,control)))return false;
   if(!edit)edit=action(form,['Edit','Modifier'],{allowUnscoped:form!=='smmBusRelTable'});
   if(edit){verify();editClicked=true;edit.click();}
  }
  return false;
 },{timeout,onBlocked});
}
globalThis.D365Controls={version:'2.2.2',find,all,visible,formMatch,controlMatch,action,waitFor,reveal,prepareForm};
})();
