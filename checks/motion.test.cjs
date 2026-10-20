const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let reduce=false,events={},calls=[];
const document={addEventListener:(k,f)=>events[k]=f};
const c=vm.createContext({document,matchMedia:()=>({matches:reduce}),getComputedStyle:()=>({paddingTop:'8',paddingBottom:'8',borderTopWidth:'1',borderBottomWidth:'1'})});
vm.runInContext(fs.readFileSync('project/inside-sales-toolbox-team/motion.js','utf8'),c);
function animated(){let pending=[];return {pending,animate:(frames,options)=>{let resolve,reject;const finished=new Promise((a,b)=>{resolve=a;reject=b;}),a={finished,cancel:()=>{a.cancelled=true;reject(Error('cancelled'));},finish:resolve};pending.push(a);calls.push({frames,options});return a;}};}
(async()=>{
 let e=animated();c.ToolboxMotion.enter(e);assert.equal(calls.at(-1).options.duration,320);c.ToolboxMotion.results(e);assert.equal(e.pending[0].cancelled,true);assert.equal(calls.at(-1).options.duration,240);
 reduce=true;const count=calls.length;c.ToolboxMotion.enter(e);assert.equal(calls.length,count);reduce=false;
 const summary={getBoundingClientRect:()=>({height:20})},d={...animated(),tagName:'DETAILS',classList:{contains:()=>false},style:{height:'',overflow:''},open:false,getBoundingClientRect(){return {height:this.open?140:38};},querySelector:()=>summary};summary.parentElement=d;
 const target={closest:s=>s==='summary'?summary:null};let prevented=0;const event={target,preventDefault:()=>prevented++};
 events.click(event);assert.equal(prevented,1);assert.equal(d.open,true);assert.equal(calls.at(-1).frames[1].height,'140px');d.pending.at(-1).finish();await Promise.resolve();assert.equal(d.style.overflow,'');
 events.click(event);assert.equal(calls.at(-1).frames[1].height,'38px');d.pending.at(-1).finish();await Promise.resolve();assert.equal(d.open,false);
 events.click(event);events.click(event);d.pending.at(-1).finish();await Promise.resolve();assert.equal(d.open,false);assert.equal(d.style.height,'');
 reduce=true;events.click(event);assert.equal(prevented,4);assert.equal(d.open,false);reduce=false;
 const pop=animated();events.toggle({target:{open:true,classList:{contains:()=>true},dataset:{direction:'up'},querySelector:()=>pop}});assert.equal(calls.at(-1).options.duration,240);
 const children=Array.from({length:20},()=>animated()),panel={...animated(),querySelectorAll:()=>children};const before=calls.length;c.ToolboxMotion.enter(panel);assert.equal(calls.length-before,8);assert(calls.at(-1).options.delay>calls.at(-7).options.delay);assert(children[0].pending.length===1&&children[7].pending.length===0);
 const icon=animated();c.ToolboxMotion.navigation({querySelector:()=>icon});assert.equal(calls.at(-1).options.duration,380);reduce=true;const saved=calls.length;c.ToolboxMotion.enter(panel);assert.equal(calls.length,saved);
 reduce=false;const departing={...animated(),getBoundingClientRect:()=>({height:58})};c.ToolboxMotion.exit(departing,{collapse:true});assert.equal(calls.at(-1).frames[0].height,'58px');assert.equal(calls.at(-1).frames[1].height,'0px');assert.equal(calls.at(-1).frames[1].paddingBottom,'0px');assert.equal(calls.at(-1).options.duration,320);departing.pending.at(-1).finish();await Promise.resolve();
 reduce=true;const beforeExit=calls.length;assert.equal(c.ToolboxMotion.exit(departing,{collapse:true}),undefined);assert.equal(calls.length,beforeExit);
 console.log('PASS navigation and filter transitions, disclosure reversal/cleanup, measured exit collapse, reduced motion and upward popover animation');
})().catch(e=>{console.error(e);process.exit(1)});
