// Counts come from the reader. No simulated progress or assumed total in production.
(()=>{
 const el=id=>document.getElementById(id),node=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;return e;},previous=new Map();
 function render(status={},pending=false,{buttonId='used-refresh',financial=false}={}){
  const t=s=>globalThis.ToolboxI18n?.t(s)||s;
  const b=el(buttonId),busy=pending||status.state==='loading',done=['done','cached'].includes(status.state)&&Number.isFinite(status.at)&&ToolboxUsedCatalogue.day(status.at)===ToolboxUsedCatalogue.day(Date.now()),error=status.state==='error',state=busy?'busy':error?'error':done?'success':'idle';
  const count=Number.isFinite(status.count)&&status.count>=0?Math.floor(status.count):null,announced=Number.isFinite(status.expected)&&status.expected>0?Math.floor(status.expected):null,expected=count!==null&&announced!==null&&count>announced?null:announced;
  const percent=busy&&count!==null&&expected!==null&&count<=expected?Math.min(99,Math.floor(count/expected*100)):done?100:null;
  b.dataset.refreshState=state;b.setAttribute('aria-busy',String(busy));b.disabled=busy;
  const mark=node('span','used-refresh-mark');mark.setAttribute('aria-hidden','true');if(busy){for(let i=0;i<3;i++)mark.append(node('i',''));}else mark.textContent=error?'!':done?'✓':'↻';
  const label=financial?'Prix + NBV':'Quantités';
  const copy=node('span','used-refresh-copy'),title=node('strong','',t(label));
  const phases={starting:'Préparation…',catalogue:'Catalogue enregistré',opening:'Ouverture de Power BI',page:'Chargement du rapport',region:'Filtre de sous-région',reading:'Lecture des lignes',merging:financial?'Enregistrement des prix et NBV':'Enregistrement des quantités'};
  const format=n=>new Intl.NumberFormat(document.documentElement.lang||'fr-CA').format(n);
  let detail=busy?t(phases[status.phase]||'Lecture en cours…'):error?t('Réessayer'):done?t(status.state==='cached'?'Déjà à jour':'À jour'):t(financial?'Catalogue global':'Sélection actuelle');
  if(busy&&count!==null)detail=format(count)+(expected!==null?' / '+format(expected):'')+' '+t('lignes')+(percent!==null?' · '+percent+' %':'');
  else if(done&&count!==null)detail+=' · '+(financial&&Number.isFinite(status.updated)?format(status.updated)+' '+t('articles actualisés'):format(count)+' '+t('lignes'));
  if(status.region&&status.region!=='ALL'&&(!busy||count===null))detail=[detail,ToolboxUsedRegions.label(status.region)].filter(Boolean).join(' · ');
  copy.append(title);if(detail)copy.append(node('small','',detail));const rail=node('span','used-refresh-rail');rail.setAttribute('aria-hidden','true');const fill=node('span','used-refresh-fill');rail.append(fill);
  if(percent===null)rail.className+=' is-indeterminate';else fill.style.width=percent+'%';
  b.replaceChildren(mark,copy,rail);b.setAttribute('aria-label',[t(financial?'Actualiser les prix de vente et le NBV du catalogue depuis Power BI.':'Actualiser les quantités de la sélection.'),detail].filter(Boolean).join(' · '));
  if(previous.get(buttonId)!==state&&(done||error))globalThis.ToolboxMotion?.success(mark);previous.set(buttonId,state);
 }
 globalThis.ToolboxUsedRefresh={render};
})();
