const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let clock=0,selected=new Set(['CANADA','UK','USA']),unknown=false,ambiguous=false,clicks=0,separate=false,dropdown=false,opened=false,native=false;
let surface='legacy',paneOpened=false,paneClicks=0,blocked=false,delayUntil=0,filtersAmbiguous=false,duplicateFrame=false;
class Clock extends Date{static now(){return clock;}}
const visible=()=>[{}],control=name=>({tagName:'DIV',innerText:name,getClientRects:visible,getAttribute:k=>k==='aria-checked'&&!unknown?String(selected.has(name)):null,querySelector:s=>native&&s==='input[type="checkbox"]'?{tagName:'INPUT',type:'checkbox',get checked(){return selected.has(name);}}:null,contains:()=>false,dispatchEvent:e=>{clicks++;if(!e.ctrlKey)selected.clear();if(selected.has(name))selected.delete(name);else selected.add(name);}});
const controls=['CANADA','UK','USA'].map(control),heading={innerText:'SUBREGION',getClientRects:visible,getAttribute:()=>null},toggle={getClientRects:visible,getAttribute:k=>k==='role'?'combobox':k==='aria-expanded'?String(opened):null,contains:()=>false,dispatchEvent:()=>{opened=true;}},box={get innerText(){return separate?'CANADA UK USA':'SUBREGION';},getClientRects:visible,getAttribute:()=>null,contains:n=>controls.includes(n)||n===heading,querySelectorAll:s=>s.includes('[aria-label]')?(separate?controls:[heading,...controls]):s.includes('aria-expanded')?(dropdown?[toggle]:[]):dropdown?[]:controls},caption={innerText:'SUBREGION',getClientRects:visible,getAttribute:()=>null,contains:()=>false,querySelectorAll:()=>[]},portal={innerText:'CANADA UK USA',getClientRects:visible,getAttribute:k=>k==='role'?'listbox':null,contains:n=>controls.includes(n),querySelectorAll:s=>s.includes('[aria-label]')?[]:controls};
const cell=v=>({get innerText(){return typeof v==='function'?v():v;},getClientRects:visible,getAttribute:()=>null,contains:()=>false});
const headers=['SKU','Description','QTY AVAILABLE'].map(cell),cells=[cell('A'),cell('Used item'),cell(()=>String([...selected].reduce((sum,r)=>sum+({CANADA:3,UK:7,USA:20}[r]),0)))];
const row={querySelectorAll:()=>cells,querySelector:()=>null,getClientRects:visible},table={getClientRects:visible,contains:()=>false,getAttribute:()=>null,clientHeight:100,scrollHeight:100,querySelectorAll:s=>s.includes('columnheader')?headers:s.includes('[role="row"]')?[row]:[]};
const boxes=s=>!s.startsWith('.visualContainer')||clock<delayUntil||surface!=='legacy'&&!s.includes('visual-container')?[]:ambiguous?[box,{...box}]:[box,...(separate?[caption]:[]),...(dropdown&&opened?[portal]:[])];
const childDoc={body:{innerText:'SUBREGION'},querySelectorAll:boxes},secondDoc={body:{innerText:'SUBREGION'},querySelectorAll:s=>s.startsWith('.visualContainer')?[{...box}]:[]};
const frame={getClientRects:visible,getAttribute:k=>k==='src'?'about:blank':null,get contentDocument(){if(blocked)throw Error('Denied frame');return childDoc;}},secondFrame={...frame,get contentDocument(){return secondDoc;}};
const filters={getClientRects:visible,getAttribute:k=>k==='aria-label'?'Show filters pane':k==='aria-expanded'?String(paneOpened):null,contains:()=>false,dispatchEvent:()=>{paneClicks++;paneOpened=true;}};
const doc={body:{innerText:'Display Currency CAD'},querySelector:()=>null,querySelectorAll:s=>s==='iframe'?(surface==='iframe'?[frame,...(duplicateFrame?[secondFrame]:[])]:[]):s==='button,[role="button"],[role="tab"]'?(surface==='pane'?[filters,...(filtersAmbiguous?[{...filters}]:[])]:[]):s.startsWith('.visualContainer')?(surface==='iframe'||surface==='pane'&&!paneOpened?[]:boxes(s)):s.includes('[role="grid"]')?[table]:[]};
const c=vm.createContext({document:doc,location:{origin:'https://app.powerbi.com',href:'https://app.powerbi.com/'},getComputedStyle:()=>({visibility:'visible',display:'block'}),Date:Clock,setTimeout:(f,n)=>{clock+=n;f();},URL,Event:class{},MouseEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}}});
vm.runInContext(fs.readFileSync('project/inside-sales-toolbox-team/used-powerbi-reader.js','utf8'),c);const R=c.ToolboxUsedPowerBIReader;
(async()=>{
 assert.deepEqual([...R.regionState().selected],['CANADA','UK','USA']);await R.ensureRegion('CANADA');assert.deepEqual([...R.regionState().selected],['CANADA']);assert.equal(clicks,2);
 let r=await R.read();assert.deepEqual([...r.regions],['CANADA']);assert.equal(r.rows[0].values[2],'3');
 await R.ensureRegion('UK');assert.deepEqual([...R.regionState().selected],['UK']);r=await R.read();assert.equal(r.rows[0].values[2],'7');
 await R.ensureRegion('ALL');assert.equal(R.regionState().selected.length,3);selected.clear();await R.ensureRegion('USA');assert.deepEqual([...R.regionState().selected],['USA']);
 for(const scope of ['CANADA+UK','CANADA+USA','UK+USA']){await R.ensureRegion(scope);assert.deepEqual([...R.regionState().selected],scope.split('+'));r=await R.read();assert.deepEqual([...r.regions],scope.split('+'));assert.equal(r.rows[0].values[2],String(scope.split('+').reduce((sum,name)=>sum+({CANADA:3,UK:7,USA:20}[name]),0)));}
 selected.clear();await R.ensureRegion('CANADA+USA');assert.deepEqual([...R.regionState().selected],['CANADA','USA']);const invalidClicks=clicks;await assert.rejects(R.ensureRegion('CANADA+MEXICO'),/invalide/);assert.equal(clicks,invalidClicks);
 separate=true;await R.ensureRegion('UK+USA');assert.deepEqual([...R.regionState().selected],['UK','USA']);assert.equal(R.diagnostic().subregionSelectors.candidateGroups,1);separate=false;
 dropdown=true;opened=false;await R.ensureRegion('CANADA+USA');assert(opened);assert.deepEqual([...R.regionState().selected],['CANADA','USA']);dropdown=false;
 native=true;unknown=true;await R.ensureRegion('CANADA+UK');assert.deepEqual([...R.regionState().selected],['CANADA','UK']);native=false;unknown=false;
 // Modern visual containers and delayed control rendering must not be treated as absent immediately.
 surface='modern';delayUntil=clock+1000;await R.ensureRegion('USA');assert.deepEqual([...R.regionState().selected],['USA']);assert(clock>=delayUntil);delayUntil=0;
 // The table is in the top document; a custom slicer lives in an accessible about:blank frame.
 surface='iframe';await R.ensureRegion('UK+USA');assert.deepEqual([...R.regionState().selected],['UK','USA']);r=await R.read();assert.equal(r.rows[0].values[2],'27');assert.deepEqual([...r.regions],['UK','USA']);let diagnostic=R.diagnostic();assert.equal(diagnostic.readerVersion,'1.2.4');assert.equal(diagnostic.subregionSelectors.documents,2);assert.equal(diagnostic.embeddedFrames[0].documentAccessible,true);
 const frameClicks=clicks;blocked=true;await assert.rejects(R.ensureRegion('CANADA'),/introuvable/);assert.equal(clicks,frameClicks);assert.equal(R.diagnostic().embeddedFrames[0].documentAccessible,false);blocked=false;
 duplicateFrame=true;await assert.rejects(R.ensureRegion('CANADA'),/introuvable/);assert.equal(clicks,frameClicks);duplicateFrame=false;
 // Open the explicitly collapsed Filters pane, then its named SUBREGION dropdown.
 surface='pane';paneOpened=false;dropdown=true;opened=false;await R.ensureRegion('CANADA+USA');assert.equal(paneClicks,1);assert.equal(opened,true);assert.deepEqual([...R.regionState().selected],['CANADA','USA']);await R.ensureRegion('CANADA');assert.equal(paneClicks,1);
 paneOpened=false;opened=false;filtersAmbiguous=true;const paneBefore=clicks;await assert.rejects(R.ensureRegion('UK'),/introuvable/);assert.equal(paneClicks,1);assert.equal(clicks,paneBefore);filtersAmbiguous=false;surface='legacy';dropdown=false;
 // Match the reported custom visual: countries found, no accessible state, color only.
 unknown=true;
 c.getComputedStyle=node=>({visibility:'visible',display:'block',backgroundColor:node===controls[0]?'rgb(246, 168, 205)':'rgb(255, 255, 255)',color:'rgb(53, 33, 88)'});
 controls[0].__data__={selected:true,privateCustomerData:'must not appear'};
 let visual=R.diagnostic().subregionSelectors.controls[0].states;
 assert.equal(visual[0].computedStyle.backgroundColor,'rgb(246, 168, 205)');
 assert.equal(visual[1].computedStyle.backgroundColor,'rgb(255, 255, 255)');
 assert.equal(visual[0].dataSelection.selected,true);assert.equal(visual[0].state,null);
 assert(!JSON.stringify(visual).includes('must not appear'));
 const oldStyle=c.getComputedStyle;
 controls[0].ownerDocument={defaultView:{getComputedStyle:()=>{throw Error('Detached');}}};
 Object.defineProperty(controls[0],'__data__',{configurable:true,get(){throw Error('Inaccessible');}});
 visual=R.diagnostic().subregionSelectors.controls[0].states;
 assert.equal(Object.keys(visual[0].computedStyle).length,0);assert.equal(Object.keys(visual[0].dataSelection).length,0);
 delete controls[0].ownerDocument;delete controls[0].__data__;c.getComputedStyle=oldStyle;
 unknown=true;const before=clicks;await assert.rejects(R.ensureRegion('CANADA'),/accessible/);assert.equal(clicks,before);unknown=false;ambiguous=true;await assert.rejects(R.ensureRegion('CANADA'),/introuvable/);
 // Reproduce the live custom slicer profile, independently of the requested country.
 ambiguous=false;unknown=true;
 for(const control of controls){
  control.tagName='LI';const read=control.getAttribute;
  control.getAttribute=k=>k==='class'?'slicerItemContainer':read(k);
 }
 const profile=node=>({visibility:'visible',display:'flex',opacity:'1',backgroundColor:selected.has(node.innerText)?'rgb(248, 163, 195)':'rgb(255, 255, 255)',color:'rgb(46, 27, 90)',borderTopColor:'rgb(0, 0, 0)'});
 c.getComputedStyle=profile;selected=new Set(['CANADA']);
 assert.deepEqual([...R.regionState().selected],['CANADA']);assert.equal(R.regionState().selectionSource,'custom-slicer-pink-v1');
 for(const scope of ['UK','USA','CANADA','CANADA+UK','CANADA+USA','UK+USA','ALL']){
  await R.ensureRegion(scope);const expected=scope==='ALL'?['CANADA','UK','USA']:scope.split('+');
  assert.deepEqual([...R.regionState().selected],expected);
  r=await R.read();assert.deepEqual([...r.regions],expected);
 }
 const guardClicks=clicks;
 for(const invalid of [{backgroundColor:'rgb(0, 0, 0)'},{color:'rgb(0, 0, 0)'},{opacity:'0.5'}]){
  c.getComputedStyle=node=>({...profile(node),...invalid});await assert.rejects(R.ensureRegion('CANADA'),/accessible/);assert.equal(clicks,guardClicks);
 }
 c.getComputedStyle=profile;selected.clear();await assert.rejects(R.ensureRegion('CANADA'),/accessible/);assert.equal(clicks,guardClicks);
 selected=new Set(['UK']);const readAttr=controls[0].getAttribute;
 controls[0].getAttribute=k=>k==='aria-checked'?'mixed':readAttr(k);
 await assert.rejects(R.ensureRegion('CANADA'),/accessible/);assert.equal(clicks,guardClicks);controls[0].getAttribute=readAttr;
 // Even matching colors cannot resolve multiple groups or an unlabelled container.
 ambiguous=true;await assert.rejects(R.ensureRegion('CANADA'),/introuvable/);assert.equal(clicks,guardClicks);ambiguous=false;
 separate=true;await assert.rejects(R.ensureRegion('CANADA'),/accessible/);assert.equal(clicks,guardClicks);separate=false;
 console.log('PASS observed custom SUBREGION profile: live Canada/UK styles, all seven combinations, actual reads and guards for unknown paint, theme, opacity, all-white, contradictory state and ambiguous groups');
 console.log('PASS all seven SUBREGION combinations, separate caption, modern containers, delayed rendering, same-origin custom slicers, blocked/ambiguous frame guards, collapsed Filters pane/dropdown opening, native checkbox states and no clicks on unreadable or ambiguous selectors');
})().catch(e=>{console.error(e);process.exitCode=1;});
