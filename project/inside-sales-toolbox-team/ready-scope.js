// Explicit seller selection, independent of shared report bookmarks.
(()=>{
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
 function state(value){return {mode:value?.mode==='report'?'report':'seller',salesperson:typeof value?.salesperson==='string'?value.salesperson.trim().slice(0,160):''};}
 function requireSelection(value){const s=state(value);if(s.mode==='seller'&&(!s.salesperson||/[\x00-\x1f]/.test(s.salesperson)))throw Error('Choisis Sales Rep Name ou les filtres actuels du rapport avant d’actualiser.');return s;}
 function confirm(data,input){const scope=requireSelection(input);if(scope.mode==='seller'){const col=ToolboxOrderModel.columns(data.headers).salesperson;if(col<0&&!(data.readyFilter?.verified&&data.readyFilter.field==='Sales Rep Name'&&norm(data.readyFilter.salesperson)===norm(scope.salesperson)))throw Error('Sales Rep Name n’est pas confirmé dans le rapport.');if(col>=0&&data.rows.some(row=>row.unreadColumns?.includes(col)||norm(row.values[col])!==norm(scope.salesperson)))throw Error('Les commandes ne correspondent pas toutes au vendeur choisi. Aucun relevé remplacé.');}return {...data,readyScope:scope};}
 const same=(a,b)=>!!a&&state(a).mode===state(b).mode&&(state(a).mode==='report'||norm(state(a).salesperson)===norm(state(b).salesperson));
 globalThis.ToolboxReadyScope={state,requireSelection,confirm,same,norm};
})();
