// Automate only the report's visible Export data dialog. The native XLSX stays
// local: no credentials, report API, dataset internals or external service.
(()=>{
 let active=null;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const label=e=>e.getAttribute?.('aria-label')||e.getAttribute?.('title')||e.innerText||e.textContent||'';
 const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden';
 const enabled=e=>!e.disabled&&e.getAttribute?.('aria-disabled')!=='true';
 const unique=nodes=>nodes.filter((e,i)=>nodes.indexOf(e)===i&&!nodes.some(other=>other!==e&&e.contains(other)));
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function wait(find,job,message,ms=12000){const end=Date.now()+ms;do{if(job.cancelled)throw Error('Export Excel arrêté.');const value=find();if(value)return value;await delay(80);}while(Date.now()<end);throw Error(message);}
 function single(nodes,message){const choices=unique(nodes.filter(visible).filter(enabled));if(choices.length!==1)throw Error(message+' ('+choices.length+' cible).');return choices[0];}
 function reportTable(){
  const found=[...document.querySelectorAll('[role="grid"],[role="table"],table,.tableEx')].filter(visible).filter(root=>{
   const headers=[...root.querySelectorAll('[role="columnheader"],thead th,.columnHeader')].map(e=>norm(label(e)));
   return headers.filter(h=>['sku','description','d365itemid','d365itemnumber','qtyavailable','sellprice','nbv'].includes(h)).length>=2;
  });return single(found,'Tableau Used Gear absent ou ambigu');
 }
 function diagnostic(){return {dialogs:[...document.querySelectorAll('[role="dialog"]')].filter(visible).slice(0,3).map(e=>({buttons:[...e.querySelectorAll('button,[role="button"]')].filter(visible).map(label).slice(0,12),options:[...e.querySelectorAll('label,[role="radio"],[role="combobox"],select')].filter(visible).map(label).slice(0,12)}))};}
 async function run(){
  if(active)throw Error('Un export Excel est déjà en cours.');
  const job={cancelled:false,armed:false,candidates:[],problem:null},original=URL.createObjectURL;active=job;
  const capture=blob=>{
   if(!job.armed||!(blob instanceof Blob)||blob.size<4||blob.size>25*1024*1024||!/^(?:application\/(?:vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|octet-stream|zip))?$/.test(blob.type||''))return;
   const candidate={ready:false};job.candidates.push(candidate);
   blob.arrayBuffer().then(buffer=>{
    const bytes=new Uint8Array(buffer);if(bytes[0]!==80||bytes[1]!==75){job.candidates=job.candidates.filter(c=>c!==candidate);return;}
    let encoded='';for(let i=0;i<bytes.length;i+=24576)encoded+=btoa(String.fromCharCode(...bytes.subarray(i,i+24576)));
    candidate.value={base64:encoded,size:bytes.length,name:'Used-Gear.xlsx'};candidate.ready=true;
   }).catch(()=>{job.problem='Le fichier Excel généré ne peut pas être lu.';});
  };
  const wrapped=function(blob){const url=Reflect.apply(original,this,arguments);capture(blob);return url;};
  try{
   URL.createObjectURL=wrapped;if(URL.createObjectURL!==wrapped)throw Error('Capture du fichier Excel indisponible dans ce navigateur.');
   const table=reportTable(),container=table.closest('.visualContainer,visual-container,.visual-container,.visual-container-component')||table.closest('.tableEx')||table;
   container.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));
   const more=single([...container.querySelectorAll('button,[role="button"]')].filter(e=>/^(moreoptions|plusdoptions|autresoptions|optionssupplementaires)$/.test(norm(label(e)))),'Menu du tableau non accessible. Affiche les trois points du tableau Power BI puis réessaie');more.click();
   const menu=await wait(()=>{
    const items=[...document.querySelectorAll('[role="menuitem"],button,[role="button"]')].filter(visible).filter(enabled).filter(e=>/^(exportdata|exporterlesdonnees|exporterdesdonnees|exporterdonnees)$/.test(norm(label(e))));
    const values=unique(items);if(values.length>1)throw Error('Plusieurs commandes Exporter les données.');return values[0];
   },job,'Exporter les données est indisponible. Vérifie les droits d’export de ce rapport.');menu.click();
   const dialog=await wait(()=>{const dialogs=unique([...document.querySelectorAll('[role="dialog"]')].filter(visible));if(dialogs.length>1)throw Error('Plusieurs fenêtres d’export sont ouvertes.');return dialogs[0];},job,'La fenêtre d’export Power BI ne s’ouvre pas.');
   const optionNames=/^(datawithcurrentlayout|donneesavecdispositionactuelle)/;
   const candidates=[];
   for(const node of dialog.querySelectorAll('label,[role="radio"],input[type="radio"]')){
    let candidate=node;
    for(let depth=0;candidate&&candidate!==dialog&&depth<4;depth++,candidate=candidate.parentElement){
     if(optionNames.test(norm(label(candidate)))){candidates.push(candidate);break;}
    }
   }
   const layout=single(candidates,'L’option Données avec disposition actuelle est absente ou ambiguë');
   if(layout.querySelector?.('input[type="radio"]')?.disabled)throw Error('L’export avec disposition actuelle est désactivé.');
   layout.click();await delay(100);
   const selects=[...dialog.querySelectorAll('select')].filter(visible);
   if(selects.length){const selected=selects.filter(e=>[...e.options].some(o=>/\.xlsx/i.test(o.textContent||'')));if(selected.length!==1)throw Error('Le format Excel .xlsx n’est pas disponible.');const option=[...selected[0].options].find(o=>/\.xlsx/i.test(o.textContent||''));if(selected[0].value!==option.value){if(selected[0].disabled)throw Error('Le format XLSX ne peut pas être sélectionné.');selected[0].value=option.value;selected[0].dispatchEvent(new Event('change',{bubbles:true}));}}
   else if(!/\.xlsx\b/i.test(dialog.innerText||dialog.textContent||'')){
    const combo=single([...dialog.querySelectorAll('[role="combobox"]')],'Choix du format Excel absent ou ambigu');combo.click();
    const option=await wait(()=>{const choices=unique([...document.querySelectorAll('[role="option"]')].filter(visible).filter(e=>/\.xlsx\b/i.test(label(e))));if(choices.length>1)throw Error('Plusieurs formats XLSX proposés.');return choices[0];},job,'Le format Excel .xlsx n’est pas disponible.');option.click();
   }
   const confirm=single([...dialog.querySelectorAll('button,[role="button"]')].filter(e=>/^(export|exporter)$/.test(norm(label(e)))),'Bouton Exporter absent ou ambigu');
   job.armed=true;confirm.click();
   const file=await wait(()=>{if(job.problem)throw Error(job.problem);if(job.candidates.length>1)throw Error('Plusieurs fichiers générés pendant l’export. Aucun import automatique.');return job.candidates[0]?.ready?job.candidates[0].value:null;},job,'Power BI n’a pas fourni de fichier XLSX capturable. Le téléchargement peut être repris avec Importer Excel.',60000);
   await delay(160);if(job.candidates.length!==1)throw Error('Plusieurs fichiers Excel détectés. Aucun import automatique.');return file;
  }catch(error){return {error:String(error.message||error),diagnostic:diagnostic()};}
  finally{job.armed=false;if(URL.createObjectURL===wrapped)URL.createObjectURL=original;active=null;}
 }
 function cancel(){if(active)active.cancelled=true;return {cancelled:true};}
 globalThis.ToolboxUsedExportUI={run,cancel,diagnostic};
})();
