(()=>{
if(globalThis.D365Controls?.version==='1.7.1')return;
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
 if(nodes.length)throw Error(control+' repéré dans '+form+', mais '+unique.length+' cible(s) utilisable(s). Aucun choix automatique.');
 return null;
}
globalThis.D365Controls={version:'1.7.1',find};
})();
