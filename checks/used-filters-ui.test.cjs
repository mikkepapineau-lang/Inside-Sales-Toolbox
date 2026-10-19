const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir='project/inside-sales-toolbox-team/',nodes=new Map(),events={};let doc;
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this._text='';this._id='';this.value='';this.className='';this.dataset={};this.style={};this.events={};this.hidden=false;this.open=false;this.checked=false;this.scrollTop=0;this.isConnected=true;}
 set id(v){this._id=v;nodes.set(v,this);}get id(){return this._id;}
 set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
 append(...n){for(const x of n){x.parentElement=this;this.children.push(x);}}replaceChildren(...n){this._text='';this.children=[];this.append(...n);}
 setAttribute(k,v){this[k]=v;}getAttribute(k){return this[k]??null;}addEventListener(k,f){this.events[k]=f;}contains(n){return n===this||this.children.some(x=>x.contains(n));}focus(){doc.activeElement=this;}closest(){return null;}
}
for(const id of [...fs.readFileSync(dir+'sidepanel.html','utf8').matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]))new Element('div').id=id;
doc={documentElement:{lang:'fr-CA'},getElementById:id=>nodes.get(id),createElement:tag=>new Element(tag),activeElement:null,addEventListener:(k,f)=>events[k]=f};
const data=JSON.parse(fs.readFileSync(dir+'used-catalogue-base.json','utf8')),saved={toolboxUsedPowerBI:data,toolboxUsedFilters:{query:'SM58',expanded:false,selections:{manufacturer:['SHURE']}}},listeners=[],messages=[];
const chrome={storage:{onChanged:{addListener:f=>listeners.push(f)},local:{get:async keys=>Object.fromEntries(keys.map(k=>[k,saved[k]])),set:async values=>{const changes={};for(const [k,v]of Object.entries(values)){changes[k]={newValue:v,oldValue:saved[k]};saved[k]=v;}for(const f of listeners)f(changes,'local');}}},runtime:{sendMessage:async m=>{messages.push(m.kind);return {value:{}};}}};
const context=vm.createContext({document:doc,chrome,URL,Intl,Date,setTimeout,clearTimeout});
for(const file of ['used-catalogue.js','list-ui.js','used-regions.js','used-refresh-ui.js','used-filter-model.js','used-filters.js','used-powerbi-panel.js'])vm.runInContext(fs.readFileSync(dir+file,'utf8'),context);
const get=id=>nodes.get(id),control=key=>{const details=get('used-facet-'+key),popover=details.children[1];return {details,summary:details.children[0],search:popover.children[0],count:popover.children[1].children[0],list:popover.children[2],more:popover.children[3]};};
function open(key){const c=control(key);c.details.open=true;c.details.events.toggle();return c;}
function choose(key,value,checked=true){const c=open(key);c.search.value=value;c.search.oninput();const label=c.list.children.find(x=>x.children[1]?.textContent===value);assert(label,'Choice '+value+' in '+key);label.children[0].checked=checked;label.children[0].focus();label.children[0].onchange();return c;}
setImmediate(async()=>{try{
 assert.equal(get('used-filter-grid').children.length,6);assert.equal(get('used-query').value,'SM58');assert.equal(get('used-filter-grid').hidden,true);assert(get('used-results').textContent.includes('SM58'));assert.equal(get('used-filter-active').textContent,'2 actif(s)');
 get('used-filter-reset').onclick();assert.equal(get('used-query').value,'');assert.equal(get('used-results').children.length,80);assert.equal(get('used-filter-reset').hidden,true);get('used-filter-toggle').onclick();assert.equal(get('used-filter-grid').hidden,false);
 let c=open('sku');assert.equal(c.list.children.length,60);assert.equal(c.more.hidden,false);assert(c.count.textContent.includes('12851'));c.more.onclick();assert.equal(c.list.children.length,120);
 const last=data.rows.at(-1).values[3];choose('sku',last);assert.equal(get('used-results').children.length,1);assert(get('used-results').textContent.includes(last));assert.equal(saved.toolboxUsedFilters.selections.sku[0],last);
 get('used-filter-reset').onclick();choose('category','AUDIO');choose('manufacturer','SHURE');const shureAudio=data.rows.filter(r=>r.values[0]==='AUDIO'&&r.values[2]==='SHURE').length;assert(get('used-count').textContent.startsWith(shureAudio+' article(s)'));assert(get('used-results').children[0].children[0].textContent.includes('NBV'));
 c=choose('manufacturer','SENNHEISER');assert.equal(saved.toolboxUsedFilters.selections.manufacturer.length,2);assert.equal(get('used-filter-active').textContent,'2 actif(s)');assert.equal(control('manufacturer').summary.children[1].textContent,'2 sélection(s)');assert.equal(doc.activeElement.type,'checkbox');
 c=open('subcategory');const matchingSubcategories=new Set(data.rows.filter(r=>r.values[0]==='AUDIO'&&['SHURE','SENNHEISER'].includes(r.values[2])).map(r=>r.values[1]));assert(c.list.children.every(x=>matchingSubcategories.has(x.children[1]?.textContent)));get('used-filter-grid').events.keydown({key:'Escape',preventDefault(){}});assert.equal(c.details.open,false);assert.equal(doc.activeElement,c.summary);
 c=open('manufacturer');events.pointerdown({target:get('used-query')});assert.equal(c.details.open,false);
 get('tool-used').getBoundingClientRect=()=>({top:100,bottom:600});c.summary.getBoundingClientRect=()=>({top:550,bottom:590});c.details.children[1].getBoundingClientRect=()=>({height:275});c.list.getBoundingClientRect=()=>({height:185});c=open('manufacturer');assert.equal(c.details.dataset.direction,'up');c.summary.getBoundingClientRect=()=>({top:150,bottom:190});c.search.oninput();assert.equal(c.details.dataset.direction,'down');
 get('used-query').value='MICRO';get('used-query').oninput();get('used-available').checked=true;get('used-available').onchange();assert.equal(saved.toolboxUsedFilters.query,'MICRO');assert.equal(saved.toolboxUsedFilters.availableOnly,true);
 get('used-filter-reset').onclick();assert.equal(get('used-available').checked,false);assert.equal(get('used-query').value,'');assert.equal(get('used-results').children.length,80);assert(Object.values(saved.toolboxUsedFilters.selections).every(x=>!x.length));
 await chrome.storage.local.set({toolboxUsedFilters:{selections:{d365itemid:['']},expanded:false}});assert.equal(get('used-filter-grid').hidden,true);assert(get('used-count').textContent.startsWith('5489 article(s)'));assert.equal(control('d365itemid').summary.children[1].textContent,'Non renseigné');
 assert.deepEqual(messages,['usedPowerBIInit']);assert.equal(data.rows[0].values[10],'0');
 console.log('PASS six compact menus, saved selections, search beyond first 60/80, bounded choices, multi-select, cascading categories, keyboard focus/Escape, outside close, reset, cross-panel sync, NBV and no Power BI reread');
}catch(e){console.error(e);process.exitCode=1;}});
