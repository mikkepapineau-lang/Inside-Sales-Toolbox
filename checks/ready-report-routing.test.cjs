const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const id='37ddaf7f-5526-4fd7-b85e-bc6630d5ae33',used='458f40a9-2b3f-4518-a3cb-d699fef65baa';
const direct='https://app.powerbi.com/groups/me/reports/'+id+'/ReportSection16a57238ce9621584668?pbi_source=shareVisual&visual=e012a952be9d5b6b572d&bookmarkGuid=80a177f0-91d7-4d7e-a04e-282a39ddbc81',embed='https://app.powerbi.com/reportEmbed?reportId='+id+'&autoAuth=true&actionBarEnabled=true',legacy='https://app.powerbi.com/links/lNdArEWzXE?ctid=tenant&pbi_source=linkShare';
function fixture(tabs,session={},local={}){
 const created=[];const store=s=>({get:async keys=>Object.fromEntries((typeof keys==='string'?[keys]:keys).map(k=>[k,s[k]])),set:async values=>Object.assign(s,values)});
 const chrome={storage:{session:store(session),local:store(local)},runtime:{onMessage:{addListener(){}}},tabs:{get:async id=>{const t=tabs.find(t=>t.id===id);if(!t)throw Error('closed');return t;},query:async()=>tabs,create:async options=>{created.push(options);return {id:99,...options};}}};
 const c=vm.createContext({chrome,URL,Promise,ToolboxTabGroup:{add:async()=>{}}});vm.runInContext(fs.readFileSync('project/inside-sales-toolbox-team/powerbi-worker.js','utf8'),c);return {c,created,session};
}
(async()=>{
 let f=fixture([]);for(const url of [direct,embed,legacy])assert.equal(f.c.isReadyPowerBI({url}),true,url);
 for(const url of ['https://app.powerbi.com/reportEmbed?reportId='+used,'https://app.powerbi.com/groups/me/reports/'+used,'https://app.powerbi.com/reportEmbed?reportId='+id+'&reportId='+used,'https://app.powerbi.com.evil.test/groups/me/reports/'+id,'https://user:pass@app.powerbi.com/groups/me/reports/'+id])assert.equal(f.c.isReadyPowerBI({url}),false,url);
 const nonreserved='https://app.powerbi.com/groups/me/reports/d8c07521-770e-41bd-be72-a23a1dbf41ff/page';assert.equal(f.c.isReadyPowerBI({url:nonreserved},nonreserved),false,'Non-Reserved must never become the Ready report, even from an old binding');
 for(const url of [direct,embed,legacy]){f=fixture([{id:3,url},{id:4,url:'https://app.powerbi.com/reportEmbed?reportId='+used}],{powerBITab:4});assert.equal((await f.c.powerBITab()).id,3);assert.equal(f.created.length,0);assert.equal(f.session.powerBITab,3);}
 f=fixture([{id:3,url:embed,active:true},{id:4,url:direct}]);assert.equal((await f.c.powerBITab()).id,4);assert.equal(f.created.length,0);
 f=fixture([{id:3,url:'https://app.powerbi.com/',pendingUrl:embed}]);assert.equal((await f.c.powerBITab()).id,3);
 f=fixture([{id:3,url:'https://app.powerbi.com/reportEmbed?reportId='+used}]);assert.equal((await f.c.powerBITab()).id,99);assert(f.created[0].url.includes(id));assert(f.created[0].url.includes('visual=e012a952be9d5b6b572d'));
 const custom='https://app.powerbi.com/groups/me/reports/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/ReportSection';f=fixture([{id:8,url:custom}],{}, {toolboxPowerBIResolvedURL:custom});assert.equal((await f.c.powerBITab()).id,8);assert.equal(f.created.length,0);
 console.log('PASS Open Orders routing: user visual URL, embedded URL and short link, Used rejection, duplicate/host guards, stale-tab recovery, persisted binding, pending navigation and no duplicate report tabs');
})().catch(e=>{console.error(e);process.exitCode=1;});
