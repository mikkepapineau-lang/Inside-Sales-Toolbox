const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {DOMParser}=require('./xlsx-dom-adapter.cjs'),dir='project/inside-sales-toolbox-team/';
const c=vm.createContext({URL,Intl,DOMParser,TextDecoder,Blob,DecompressionStream,Uint8Array,DataView});for(const f of ['used-catalogue.js','used-excel.js'])vm.runInContext(fs.readFileSync(dir+f,'utf8'),c);
(async()=>{
 const buffer=fs.readFileSync('upload/data (11).xlsx'),file=new File([buffer],'data (11).xlsx'),got=await c.ToolboxUsedExcel.read(file),seed=JSON.parse(fs.readFileSync(dir+'used-catalogue-base.json','utf8'));
 assert.equal(got.rows.length,12851);assert.equal(got.currency,'CAD');assert.equal(got.headers.length,21);assert(got.filters.includes('SUBREGION'));assert.equal(got.rows.filter(r=>r.values[10]==='').length,304);assert.equal(got.rows.filter(r=>r.values[10]==='0').length,5065);
 for(let i=0;i<seed.rows.length;i++)for(let j=0;j<seed.headers.length;j++){
  const a=got.rows[i].values[j],b=seed.rows[i].values[j];if(a===b)continue;
  assert.equal(Number(a),Number(b),'source numeric value '+i+':'+j);
 }
 await assert.rejects(c.ToolboxUsedExcel.read(new File([buffer],'data.xlsm')),/xlsx/);await assert.rejects(c.ToolboxUsedExcel.read(new File(['invalid'],'data.xlsx')),/xlsx/);
 if(fs.existsSync('checks/xlsx-fixtures/shared.xlsx')){
  const f=new File([fs.readFileSync('checks/xlsx-fixtures/shared.xlsx')],'shared.xlsx'),x=await c.ToolboxUsedExcel.read(f);assert.equal(x.rows.length,1);assert.equal(x.rows[0].values[0],'SKU-<&');assert.equal(x.rows[0].values[1],'0');assert.equal(x.rows[0].values[2],'12.34567');assert.equal(x.currency,'CAD');assert.equal(x.rows[0].values[3],'<img src=x>');
 }
 console.log('PASS native XLSX ZIP/XML import on actual 12,851-row export, all 21 source columns, CAD filters, NBV zero/missing values, and invalid-file rejection');
})().catch(e=>{console.error(e);process.exit(1)});
