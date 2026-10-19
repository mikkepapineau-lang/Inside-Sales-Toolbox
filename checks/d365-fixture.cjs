// Small DOM and virtual clock for Dynamics transitions; no network or real records.
const vm=require('node:vm'),fs=require('node:fs');
module.exports=function fixture(){
 let clock=0;const nodes=[],jobs=[];
 class Clock extends Date{static now(){return clock;}}
 class Node{
  constructor(tag='input',attrs={},value=''){this.tagName=tag.toUpperCase();this.attrs={...attrs};this.id=attrs.id||'';this.name=attrs.name||'';this.type=attrs.type||'text';this._value=value;this.readOnly=false;this.disabled=false;this.hidden=false;this.parentElement=null;this.isConnected=true;this.labels=[];this.maxLength=0;this.children=[];this.textContent='';this.events={};nodes.push(this);}
  get value(){return this._value;}set value(v){this._value=String(v);}
  get innerText(){return this.textContent;}set innerText(v){this.textContent=v;}
  get selectedOptions(){return (this.options||[]).filter(o=>o.value===this.value);}
  getAttribute(k){return k==='id'?this.id:k==='name'?this.name:this.attrs[k]??null;}
  getRootNode(){return document;}
  getClientRects(){for(let n=this;n;n=n.parentElement)if(n.hidden||!n.isConnected)return [];return [{}];}
  matches(selector){return selector.split(',').some(part=>{
   let s=part.trim(),reject=false;s=s.replace(/:not\(([^)]+)\)/g,(_,negative)=>{if(this.matches(negative))reject=true;return '';});if(reject)return false;
   const tag=s.match(/^[\w-]+/);if(tag&&this.tagName!==tag[0].toUpperCase())return false;
   for(const [,key,value]of s.matchAll(/\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]/g)){const actual=this.getAttribute(key);if(actual===null||value!==undefined&&actual!==value)return false;}
   return true;
  });}
  contains(other){for(let n=other;n;n=n.parentElement)if(n===this)return true;return false;}
  closest(s){for(let n=this;n;n=n.parentElement)if(n.matches(s))return n;return null;}
  querySelectorAll(s){return nodes.filter(n=>n!==this&&n.isConnected&&this.contains(n)&&n.matches(s));}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  append(...children){for(const n of children){n.parentElement=this;this.children.push(n);}}
  remove(){this.isConnected=false;}
  focus(){}blur(){}
  dispatchEvent(event){this.events[event.type]?.(event);}
  click(){this.events.click?.();}
 }
 const body=new Node('body');
 const document={body,visibilityState:'visible',getElementById:id=>nodes.find(n=>n.isConnected&&n.id===id)||null,querySelectorAll:s=>nodes.filter(n=>n.isConnected&&(s==='*'||n.matches(s)))};
 function later(ms,fn){jobs.push({at:clock+ms,fn});}
 function timeout(fn,ms){clock+=ms;for(let i=0;i<jobs.length;)if(jobs[i].at<=clock){const [job]=jobs.splice(i,1);job.fn();i=0;}else i++;fn();}
 const c=vm.createContext({document,location:{origin:'https://solotech.operations.dynamics.com',hostname:'solotech.operations.dynamics.com',href:'https://solotech.operations.dynamics.com/?cmp=CAOP&mi=smmBusinessRelationsListPage'},getComputedStyle:()=>({visibility:'visible'}),HTMLInputElement:Node,HTMLTextAreaElement:Node,HTMLSelectElement:Node,Event:class{constructor(type){this.type=type;}},KeyboardEvent:class{constructor(type){this.type=type;}},crypto:{randomUUID:()=>String(Math.random())},Date:Clock,URL,setTimeout:timeout,console});
 function load(...files){for(const file of files)vm.runInContext(fs.readFileSync('project/inside-sales-toolbox-team/'+file,'utf8'),c);}
 function field(label,value='',id=''){const n=new Node('input',{id,'aria-label':label},value);n.labels=[{innerText:label,textContent:label}];body.append(n);return n;}
 function button(label,id='',click=()=>{}){const n=new Node('button',{id});n.innerText=label;n.events.click=click;body.append(n);return n;}
 load('model.js','warehouse-model.js','d365-controls.js','page.js','contact-fill.js','quotation.js','d365-flow.js');
 return {c,document,nodes,body,Node,field,button,later,load,time:()=>clock};
};
