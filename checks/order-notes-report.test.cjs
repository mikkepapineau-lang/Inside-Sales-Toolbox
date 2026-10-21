const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
async function readReport({column='Internal Notes',note='Alex Martin\n514 555-0123\nalex@example.test',missing=false}={}){
 const cell=(text,index)=>({innerText:text,textContent:text,getAttribute:k=>k==='aria-colindex'?String(index):null,contains:()=>false,getClientRects:()=>[{}]});
 const headings=['Sales Order Number','Customer',column].map((v,i)=>cell(v,i+1));
 const cells=['SO-CA153790','École Démo',note].map((v,i)=>cell(v,i+1));if(missing)cells.pop();
 const row={querySelectorAll:s=>s==='a[href]'?[]:cells,getClientRects:()=>[{}]};
 const table={getClientRects:()=>[{}],contains:()=>false,clientHeight:100,scrollHeight:100,querySelectorAll:s=>s.includes('columnheader')?headings:s.includes('[role="row"]')?[row]:[]};
 const doc={body:{innerText:'Order Completely Ready to PIK'},querySelector:()=>null,querySelectorAll:s=>s.includes('[role="grid"]')?[table]:[]};
 const c=vm.createContext({document:doc,location:{origin:'https://app.powerbi.com',href:'https://app.powerbi.com/'},getComputedStyle:()=>({visibility:'visible',display:'block'}),setTimeout:fn=>fn(),URL,Event:class{}});
 vm.runInContext(fs.readFileSync('project/inside-sales-toolbox-team/powerbi-reader.js','utf8'),c);
 return c.ToolboxPowerBIReader.read();
}
(async()=>{
 const note='Alex Martin\n514 555-0123\nalex@example.test';
 for(const column of ['Internal Notes','InternalNote','SOLInternalNotes','Notes internes']){const r=await readReport({column,note});assert.equal(r.rows[0].values[2],note);assert.equal(r.rows[0].unreadColumns,undefined);}
 let r=await readReport({note:''});assert.equal(r.rows[0].values[2],'');assert.equal(r.rows[0].unreadColumns,undefined);
 r=await readReport({missing:true});assert.equal(r.rows[0].values[2],'');assert.deepEqual(Array.from(r.rows[0].unreadColumns),[2]);
 console.log('PASS actual Power BI reader: Internal Notes headers in FR/EN, preserved line breaks, confirmed blank and unrendered note columns');
})().catch(e=>{console.error(e);process.exitCode=1;});
