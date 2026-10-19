(()=>{
 const origin='https://solotech.operations.dynamics.com';
 function matches(tab,modules){try{const u=new URL(tab.url);return u.origin===origin&&(u.searchParams.get('cmp')||'').toUpperCase()==='CAOP'&&modules.some(m=>m.toLowerCase()===(u.searchParams.get('mi')||'').toLowerCase());}catch{return false;}}
 async function find(modules,remembered){
  // Query open tabs afresh: extension updates can erase session tab IDs.
  const candidates=(await chrome.tabs.query({url:origin+'/*'})).filter(tab=>matches(tab,modules));
  return candidates.find(tab=>tab.id===remembered)||candidates.sort((a,b)=>Number(!!b.active)-Number(!!a.active)||(b.lastAccessed||0)-(a.lastAccessed||0)||a.id-b.id)[0]||null;
 }
 globalThis.ToolboxTabs={matches,find};
})();
