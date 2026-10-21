// Actual panel and XLSX parser; fictional reports and native file transport only.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const files=JSON.parse(execFileSync('python3',['-c',String.raw`
import io,zipfile,base64,json
out={}
for country,qty,nbv in [('CANADA','7','0'),('UK','3','10'),('USA','2','20')]:
 b=io.BytesIO()
 with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:
  z.writestr('xl/workbook.xml','<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Used Gear" r:id="r1"/></sheets></workbook>')
  z.writestr('xl/_rels/workbook.xml.rels','<Relationships><Relationship Id="r1" Target="worksheets/sheet1.xml"/></Relationships>')
  rows=[['SKU','D365 Item ID','QTY AVAILABLE','Sell Price','NBV'],['TEST','123',qty,'250',nbv],['','SUBREGION est '+country],['','Currency est CAD']]
  z.writestr('xl/worksheets/sheet1.xml','<worksheet><sheetData>'+''.join('<row>'+''.join('<c t="inlineStr"><is><t>'+s+'</t></is></c>' for s in r)+'</row>' for r in rows)+'</sheetData></worksheet>')
 out[country]=base64.b64encode(b.getvalue()).decode()
print(json.dumps(out))
`],{encoding:'utf8'}));
for(const [country,base64]of Object.entries(files)){const bytes=Buffer.from(base64,'base64');files[country]={base64,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),exportId:'receipt-'+country,name:'Used-Gear.xlsx'};}
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:390,height:1000}});await p.route('https://toolbox.test/**',route=>route.fulfill({body:fs.readFileSync('checks/redesign-preview/preview-document.html','utf8'),contentType:'text/html'}));await p.goto('https://toolbox.test/');await p.waitForSelector('#used-results .product-card');
 assert.equal(await p.locator('#used-updates').getAttribute('open'),null);assert.equal(await p.locator('#used-fallback').getAttribute('open'),null);assert.equal(await p.locator('#used-export-excel').evaluate(e=>e.classList.contains('primary')),true);await p.locator('#used-updates > summary').click();assert(await p.locator('.used-excel-daily').isVisible());
 await p.evaluate(files=>{window.sent=[];window.fileTimes={};const send=chrome.runtime.sendMessage;chrome.runtime.sendMessage=async m=>{
  if(m.kind==='usedPowerBIBeginCountries'){sent.push(m);return {value:{batchId:'test-batch'}};}
  if(m.kind==='usedPowerBIExportFile'){sent.push(m);fileTimes[m.region]=Date.now();return {value:{...files[m.region],sha256:window.corrupt?'wrong':files[m.region].sha256}};}
  if(m.kind==='usedPowerBIImportCountries'){
   sent.push(m);const saved=await chrome.storage.local.get('toolboxUsedPowerBI'),input=m.exports.map(file=>({region:file.region,at:fileTimes[file.region],data:{...file.data,regions:[file.region]}})),r=ToolboxUsedRegions.countryCatalogue(saved.toolboxUsedPowerBI,input);
   await chrome.storage.local.set({toolboxUsedPowerBI:r.catalogue,toolboxUsedRegionQuantities:r.quantities,toolboxUsedRegionPrices:r.prices,toolboxUsedCountryCatalogue:r.meta,toolboxUsedPowerBIStatus:{state:'done',operation:'export',region:'ALL',at:r.meta.at,count:3}});return {value:{count:3,countries:3}};
  }
  if(m.kind==='usedPowerBIAbortCountries'){sent.push(m);return {value:{aborted:true}};}
  return send(m);
 };},files);
 await p.locator('#used-fallback > summary').click();await p.click('#used-region-canada');await p.click('#used-export-excel');await p.waitForFunction(()=>sent.some(m=>m.kind==='usedPowerBIImportCountries'));await p.waitForFunction(()=>!document.querySelector('#used-export-excel').disabled);
 const messages=await p.evaluate(()=>sent);assert.deepEqual(messages.filter(m=>m.kind==='usedPowerBIExportFile').map(m=>m.region),['CANADA','UK','USA']);assert.equal(messages.filter(m=>m.kind==='usedPowerBIImportCountries').length,1);assert.equal(await p.locator('#used-region').getAttribute('data-region'),'ALL');
 const row=p.locator('#used-results .product-card');assert.equal(await row.count(),1,'three exports must yield one product card');assert.deepEqual(await row.locator('.product-warehouse-heading h4').allTextContents(),['Canada','UK','USA']);assert.deepEqual(await row.locator('.stock-quantity strong').allTextContents(),['7','3','2']);assert((await row.textContent()).includes('0,00 $'));assert((await p.locator('#used-excel-time').textContent()).includes('Derniers exports Excel'));assert.equal(await p.locator('#used-country-export-times p').count(),3);
 assert.deepEqual(await row.locator('.product-selling-price dd').allTextContents(),['250,00 $']);assert.deepEqual(await row.locator('.product-nbv-metrics dd').allTextContents(),['0,00 $','10,00 $','20,00 $']);await p.locator('#used-updates > summary').click();await p.waitForFunction(()=>!document.querySelector('#used-updates').open);assert(await p.locator('#used-excel-time').isVisible());assert.equal(await p.locator('#used-export-excel').isVisible(),false);await row.scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/common-price-product.png'});await p.locator('#used-updates > summary').click();
 await p.waitForTimeout(350);assert.deepEqual(await p.locator('#used-region button').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-pressed'))),['true','true','true']);await p.locator('#used-fallback').evaluate(e=>e.open=false);await p.locator('#used-export-excel').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/country-toolbox.png'});await row.scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/country-product.png'});
 const before=await p.evaluate(async()=>JSON.stringify(await chrome.storage.local.get(['toolboxUsedPowerBI','toolboxUsedCountryCatalogue','toolboxUsedRegionQuantities','toolboxUsedRegionPrices'])));
 await p.evaluate(()=>{window.corrupt=true;sent=[];});await p.click('#used-export-excel');await p.waitForFunction(()=>document.querySelector('#used-status').textContent.includes('empreinte'));assert.equal(await p.evaluate(()=>sent.filter(m=>m.kind==='usedPowerBIImportCountries').length),0);assert.equal(await p.evaluate(()=>sent.filter(m=>m.kind==='usedPowerBIExportFile').length),1);assert.equal(await p.evaluate(async()=>JSON.stringify(await chrome.storage.local.get(['toolboxUsedPowerBI','toolboxUsedCountryCatalogue','toolboxUsedRegionQuantities','toolboxUsedRegionPrices']))),before);
 console.log('PASS one primary click, three distinct XLSX files with production parser/CRC, atomic country models, grouped product rows and per-country zero/quantity/NBV, daily guidance and exact export dates, rollback on corrupted file');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
