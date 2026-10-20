const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),Bridge=require('./model.js');
let ticks=0,type='Organization';
const field=(id,label,value)=>({id,value,labels:[{innerText:label}],tagName:'INPUT',getClientRects:()=>[1],getAttribute:()=>null,getRootNode:()=>({getElementById:()=>null}),closest:()=>null});
const t=field('t','Type','Organization');t.tagName='SELECT';t.options=[{text:'Organization',value:'Organization'},{text:'Person',value:'Person'}];t.selectedOptions=[t.options[0]];t.dispatchEvent=()=>{type=t.value;t.selectedOptions=[t.options[1]]};
const document={body:{innerText:'Create prospect'},getElementById:()=>null,querySelectorAll:s=>s==='*'?[]:ticks<2?[]:ticks<6?[t]:[t,...(type==='Person'?[field('f','First name',''),field('l','Last name','')]:[field('n','Name','')])]};
class Select{};Object.defineProperty(Select.prototype,'value',{set(v){Object.defineProperty(this,'value',{value:v,writable:true,configurable:true})}});
const c={Bridge,document,location:{hostname:'solotech.operations.dynamics.com'},getComputedStyle:()=>({visibility:'visible'}),crypto:{randomUUID:()=>String(ticks)},HTMLSelectElement:Select,Event:class{},setTimeout:f=>{ticks++;f()},Date:{now:()=>ticks*250}};
vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/page.js','utf8'),c);
(async()=>{await c.solotechBridge.setType('Person');assert.equal(type,'Person');assert.ok(ticks>=9);assert.equal(Bridge.mapFields(c.solotechBridge.scan().fields,'Person').first,'1');console.log('OK — premier appel attend le chargement tardif et le remplacement des champs Person.');})().catch(e=>{console.error(e);process.exitCode=1});
