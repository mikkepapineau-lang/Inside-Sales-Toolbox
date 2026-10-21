const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const base64=execFileSync('python3',['-c',String.raw`
import io,zipfile,base64
b=io.BytesIO()
with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:
 z.writestr('xl/workbook.xml','<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Used Gear" r:id="r1"/></sheets></workbook>')
 z.writestr('xl/_rels/workbook.xml.rels','<Relationships><Relationship Id="r1" Target="worksheets/sheet1.xml"/></Relationships>')
 rows=[['SKU','D365 Item ID','QTY AVAILABLE','Sell Price','NBV'],['TEST','123','7','250','0'],['','SUBREGION est CANADA'],['','Currency est CAD']]
 z.writestr('xl/worksheets/sheet1.xml','<worksheet><sheetData>'+''.join('<row>'+''.join('<c t="inlineStr"><is><t>'+s+'</t></is></c>' for s in r)+'</row>' for r in rows)+'</sheetData></worksheet>')
print(base64.b64encode(b.getvalue()).decode())
`],{encoding:'utf8'}).trim(),bytes=Buffer.from(base64,'base64'),sha256=createHash('sha256').update(bytes).digest('hex');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage();await p.route('https://toolbox.test/**',route=>route.fulfill({body:fs.readFileSync('checks/redesign-preview/preview-document.html','utf8'),contentType:'text/html'}));await p.goto('https://toolbox.test/');await p.waitForSelector('#used-results .record-row');
 await p.evaluate(({base64,sha256,size})=>{window.sent=[];const send=chrome.runtime.sendMessage;chrome.runtime.sendMessage=async m=>{if(m.kind==='usedPowerBIExportFile'){sent.push(m);return {value:{base64,sha256:window.corrupt?'wrong':sha256,size,exportId:'test-id',name:'Used-Gear.xlsx'}};}if(m.kind==='usedPowerBIImportExport'){sent.push(m);return {value:{count:m.data.rows.length,updated:1}};}return send(m);};},{base64,sha256,size:bytes.length});
 await p.click('#used-region-canada');await p.click('#used-export-excel');await p.waitForFunction(()=>sent.some(m=>m.kind==='usedPowerBIImportExport'));
 const messages=await p.evaluate(()=>sent);assert.equal(messages[0].region,'CANADA');assert.equal(messages[1].region,'CANADA');assert.equal(messages[1].exportId,'test-id');assert.equal(messages[1].sha256,sha256);assert.deepEqual(messages[1].data.rows[0].values,['TEST','123','7','250','0']);assert.equal(messages[1].data.currency,'CAD');
 await p.waitForFunction(()=>!document.querySelector('#used-export-excel').disabled);await p.evaluate(()=>{window.corrupt=true;sent=[];});await p.click('#used-export-excel');await p.waitForFunction(()=>document.querySelector('#used-status').textContent.includes('empreinte'));assert.equal(await p.evaluate(()=>sent.length),1);
 console.log('PASS real one-button UI, captured XLSX hash, production decompression/CRC/parser, selected region and receipt import, corrupted transfer blocks import');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
