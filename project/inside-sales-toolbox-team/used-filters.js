// Small native disclosure menus with searchable checkbox lists. Source labels stay plain text.
(()=>{
 const M=ToolboxUsedFilterModel,{node}=ToolboxList,el=id=>document.getElementById(id),PAGE=60;
 function mount(onChange){
  let current=M.state(),evaluation=null,availableFields=new Set(),busy=false;const controls=new Map(),grid=el('used-filter-grid'),regionButtons=ToolboxUsedRegions.names.map(value=>({value,button:el('used-region-'+value.toLowerCase())}));
  function close(){for(const c of controls.values())c.details.open=false;}
  function notify(results=true){paint();onChange(results);}
  function paintRegions(){
   el('used-region').dataset.region=current.subregion;el('used-region').setAttribute('aria-busy',String(busy));
   const chosen=ToolboxUsedRegions.selection(current.subregion);el('used-region-all').disabled=busy||current.subregion==='ALL';
   for(const {value,button} of regionButtons){button.setAttribute('aria-pressed',String(chosen.includes(value)));button.disabled=busy;}
  }
  function paint(){
   grid.hidden=!current.expanded;el('used-filter-toggle').setAttribute('aria-expanded',String(current.expanded));
   paintRegions();const count=M.activeCount(current);el('used-filter-active').textContent=count?count+' actif(s)':'';el('used-filter-reset').hidden=!count;
   for(const [key,c] of controls){
    const chosen=[...current.selections[key]];
    c.value.textContent=chosen.length===1?(chosen[0]||'Non renseigné'):chosen.length?chosen.length+' sélection(s)':'Tout';
    c.value.className='facet-value'+(chosen.length===1&&chosen[0]!==''?' source-value':'');
    c.summary.className='facet-summary'+(chosen.length?' is-selected':'');
    c.summary.setAttribute('aria-disabled',String(!availableFields.has(key)));
   }
  }
  function position(c){
   const field=c.summary.getBoundingClientRect?.(),bounds=el('tool-used').getBoundingClientRect?.();if(!field||!bounds)return;
   c.list.style.maxHeight='185px';
   const menu=c.popover.getBoundingClientRect(),list=c.list.getBoundingClientRect(),below=Math.max(0,bounds.bottom-field.bottom-6),above=Math.max(0,field.top-bounds.top-6);
   const up=below<menu.height&&above>below;c.details.dataset.direction=up?'up':'down';
   c.list.style.maxHeight=Math.min(185,Math.max(45,(up?above:below)-(menu.height-list.height)))+'px';
  }
  function options(c){
   if(!evaluation)return;
   const counts=evaluation.facets[c.key],selected=current.selections[c.key],query=M.norm(c.search.value),collator=new Intl.Collator(document.documentElement.lang||'fr-CA',{numeric:true,sensitivity:'base'});
   const emptyLabel=globalThis.ToolboxI18n?.t('Non renseigné')||'Non renseigné';
   const values=[...new Set([...counts.keys(),...selected])].filter(v=>!query||M.norm(v||emptyLabel).includes(query)).sort((a,b)=>a===b?0:a===''?-1:b===''?1:collator.compare(a,b));
   const focusValue=[...c.checks].find(([,input])=>input===document.activeElement)?.[0],scrollTop=c.list.scrollTop;
   c.list.replaceChildren();c.checks.clear();
   for(const value of values.slice(0,c.limit)){
    const label=node('label','facet-choice'),input=node('input');input.type='checkbox';input.checked=selected.has(value);
    const title=node('span','facet-choice-name'+(value!==''?' source-value':''),value||'Non renseigné'),count=node('span','facet-choice-count',counts.get(value)||0);count.setAttribute('aria-hidden','true');
    input.onchange=()=>{if(input.checked)selected.add(value);else selected.delete(value);notify();};label.append(input,title,count);c.list.append(label);c.checks.set(value,input);
   }
   if(!values.length)c.list.append(node('p','facet-empty','Aucune valeur ne correspond.'));
   c.count.textContent=Math.min(values.length,c.limit)+' / '+values.length+' valeur(s)';c.more.hidden=values.length<=c.limit;c.clear.hidden=!selected.size;
   c.list.scrollTop=scrollTop;
   position(c);
   if(focusValue!==undefined)c.checks.get(focusValue)?.focus({preventScroll:true});
  }
  for(const f of M.fields){
   const details=node('details','used-facet'),summary=node('summary','facet-summary'),label=node('span','facet-label',f.label),value=node('span','facet-value','Tout'),arrow=node('span','facet-arrow','⌄');
   details.id='used-facet-'+f.key;label.id=details.id+'-label';arrow.setAttribute('aria-hidden','true');summary.append(label,value,arrow);
   const popover=node('div','facet-popover'),search=node('input','facet-search');search.type='search';search.placeholder='Rechercher une valeur…';search.setAttribute('aria-label',f.label+' · rechercher une valeur');
   const tools=node('div','facet-tools'),count=node('span','facet-count'),clear=node('button','facet-clear','Tout afficher');clear.type='button';tools.append(count,clear);
   const list=node('div','facet-choices');list.setAttribute('role','group');list.setAttribute('aria-labelledby',label.id);
   const more=node('button','facet-more','Afficher 60 valeurs de plus');more.type='button';more.hidden=true;popover.append(search,tools,list,more);details.append(summary,popover);grid.append(details);
   const c={key:f.key,details,summary,value,search,count,clear,list,more,popover,limit:PAGE,checks:new Map()};controls.set(f.key,c);
   summary.onclick=e=>{if(!availableFields.has(f.key))e.preventDefault();};
   details.addEventListener('toggle',()=>{if(details.open){for(const other of controls.values())if(other!==c)other.details.open=false;c.limit=PAGE;options(c);search.focus({preventScroll:true});}});
   search.oninput=()=>{c.limit=PAGE;c.list.scrollTop=0;options(c);};
   clear.onclick=()=>{current.selections[f.key].clear();notify();};
   more.onclick=()=>{c.limit+=PAGE;options(c);};
  }
  grid.addEventListener('keydown',e=>{if(e.key==='Escape'){const c=[...controls.values()].find(c=>c.details.open);if(c){e.preventDefault();c.details.open=false;c.summary.focus();}}});
  document.addEventListener('pointerdown',e=>{if(!grid.contains(e.target))close();});
  for(const {value,button} of regionButtons)button.onclick=event=>{
   if(busy)return;const chosen=new Set(ToolboxUsedRegions.selection(current.subregion));
   if(event?.ctrlKey||event?.metaKey){if(chosen.has(value)){if(chosen.size===1)return;chosen.delete(value);}else chosen.add(value);}else{chosen.clear();chosen.add(value);}
   const next=ToolboxUsedRegions.normalize([...chosen]);if(next===current.subregion)return;close();current.subregion=next;notify();
  };
  el('used-region-all').onclick=()=>{if(busy||current.subregion==='ALL')return;close();current.subregion='ALL';notify();};
  el('used-filter-toggle').onclick=()=>{current.expanded=!current.expanded;if(!current.expanded)close();notify(false);};
  el('used-filter-reset').onclick=()=>{const expanded=current.expanded;current=M.state({expanded});el('used-query').value='';el('used-available').checked=false;for(const c of controls.values()){c.search.value='';c.limit=PAGE;}notify();};
  paint();
  return {get state(){return current;},controls,
   setBusy(value){busy=!!value;paintRegions();},
   restore(value){current=M.state(value);el('used-query').value=current.query;el('used-available').checked=current.availableOnly;if(!current.expanded)close();paint();},
   serialize(){return M.serialize(current);},
   render(result,fields){evaluation=result;availableFields=fields;paint();for(const c of controls.values())if(c.details.open)options(c);},close};
 }
 globalThis.ToolboxUsedFilters={mount};
})();
