// Functional smoke check of the self-contained preview. Layout still belongs to the browser.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const parsed=JSON.parse(execFileSync('python3',['-c',String.raw`
from html.parser import HTMLParser
from pathlib import Path
import json
class Parser(HTMLParser):
 def __init__(self):
  super().__init__();self.root={'tag':'document','attrs':{},'children':[]};self.stack=[self.root];self.scripts=[];self.code=None
 def handle_starttag(self,t,a):
  n={'tag':t,'attrs':dict(a),'children':[]};self.stack[-1]['children'].append(n)
  if t=='script':self.code=''
  if t not in ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']:self.stack.append(n)
 def handle_endtag(self,t):
  if t=='script':self.scripts.append(self.code);self.code=None
  if self.stack[-1]['tag']==t:self.stack.pop()
 def handle_data(self,d):
  if self.code is not None:self.code+=d
  elif self.stack[-1]['tag']!='style':self.stack[-1]['children'].append(d)
p=Parser();p.feed(Path('checks/redesign-preview/preview-document.html').read_text());print(json.dumps({'root':p.root,'scripts':p.scripts}))
`],{maxBuffer:2_000_000}).toString());
const animationCalls=[];let doc;
class Text{constructor(value){this.nodeValue=value;this.nodeType=3;}cloneNode(){return new Text(this.nodeValue);}get textContent(){return this.nodeValue;}set textContent(v){this.nodeValue=String(v);}}
const split=s=>s.split(',').map(x=>x.trim());
function matches(el,selector){
 const parts=selector.trim().split(/\s+/);if(parts.length>1){if(!matches(el,parts.pop()))return false;let p=el.parentElement;while(p){if(matches(p,parts.join(' ')))return true;p=p.parentElement;}return false;}
 if(!el.tagName)return false;
 const tag=selector.match(/^[\w-]+/);if(tag&&el.tagName!==tag[0].toUpperCase())return false;
 for(const c of selector.matchAll(/\.([\w-]+)/g))if(!el.classList.contains(c[1]))return false;
 const id=selector.match(/#([\w-]+)/);if(id&&el.id!==id[1])return false;
 for(const a of selector.matchAll(/\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]/g)){const v=el.getAttribute(a[1]);if(v===null||(a[2]!==undefined&&v!==a[2]))return false;}
 return true;
}
class Element{
 constructor(tag){this.tagName=tag.toUpperCase();this.childNodes=[];this.attrs={};this.dataset={};this.style={height:'',overflow:''};this.value='';this.hidden=false;this.open=false;this.disabled=false;this.checked=false;this.scrollTop=0;this.isConnected=true;this.events={};this.src='';this.srcdoc='';}
 cloneNode(deep){const e=new Element(this.tagName);for(const [k,v]of Object.entries(this.attrs))e.setAttribute(k,v);if(deep)e.append(...this.childNodes.map(n=>n.cloneNode(true)));return e;}
 removeAttribute(k){delete this.attrs[k];if(k==='disabled')this.disabled=false;}
 get children(){return this.childNodes.filter(n=>n instanceof Element);}get firstChild(){return this.childNodes[0];}
 set textContent(v){this.replaceChildren(new Text(String(v)));}get textContent(){return this.childNodes.map(n=>n.textContent).join('');}
 set id(v){this.attrs.id=v;}get id(){return this.attrs.id||'';}set className(v){this.attrs.class=v;}get className(){return this.attrs.class||'';}
 get classList(){const e=this;return {contains:k=>e.className.split(/\s+/).includes(k),add:k=>{if(!e.classList.contains(k))e.className+=' '+k;},remove:k=>{e.className=e.className.split(/\s+/).filter(v=>v!==k).join(' ');},toggle(k,on){const wanted=on??!e.classList.contains(k);if(wanted)this.add(k);else this.remove(k);return wanted;}};}
 append(...nodes){for(let n of nodes){if(typeof n==='string')n=new Text(n);n.parentElement=this;this.childNodes.push(n);}}
 add(n){this.append(n);}replaceChildren(...nodes){this.childNodes=[];this.append(...nodes);}remove(){if(this.parentElement)this.parentElement.childNodes=this.parentElement.childNodes.filter(n=>n!==this);}
 setAttribute(k,v){v=String(v);this.attrs[k]=v;if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;if(['hidden','checked','disabled','open'].includes(k))this[k]=true;if(k==='value')this.value=v;}
 getAttribute(k){return this.attrs[k]??null;}addEventListener(k,f){(this.events[k]??=[]).push(f);}
 querySelectorAll(s){const r=[];for(const c of this.children){if(split(s).some(x=>matches(c,x)))r.push(c);r.push(...c.querySelectorAll(s));}return r;}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}closest(s){let e=this;while(e){if(split(s).some(x=>matches(e,x)))return e;e=e.parentElement;}return null;}
 contains(n){return this===n||this.children.some(c=>c.contains(n));}focus(){doc.activeElement=this;}select(){}scrollIntoView(){}click(){return click(this);}
 getBoundingClientRect(){return {top:100,bottom:500,height:400,width:400};}
 animate(frames,opts){animationCalls.push({id:this.id,frames,opts});return {finished:Promise.resolve(),cancel(){}};}
}
function build(n){if(typeof n==='string')return new Text(n);const e=new Element(n.tag);for(const [k,v]of Object.entries(n.attrs))e.setAttribute(k,v??'');for(const c of n.children)if(typeof c==='string'||!['script','style'].includes(c.tag))e.append(build(c));return e;}
const root=build(parsed.root);doc={documentElement:root.querySelector('html'),body:root.querySelector('body'),activeElement:null,events:{},createElement:t=>new Element(t),getElementById:id=>root.querySelector('#'+id),querySelector:s=>root.querySelector(s),querySelectorAll:s=>root.querySelectorAll(s),addEventListener(k,f){(this.events[k]??=[]).push(f);},createTreeWalker(el){const all=[];function walk(n){for(const c of n.childNodes||[]){if(c instanceof Text)all.push(c);else walk(c);}}walk(el);let i=0;return {nextNode:()=>all[i++]||null};}};
const context=vm.createContext({document:doc,window:{addEventListener(){}},NodeFilter:{SHOW_TEXT:4},MutationObserver:class{observe(){}},Option:function(text,value){const e=new Element('option');e.textContent=text;e.value=value;return e;},URL,URLSearchParams,location:{search:''},Date,Intl,setTimeout,clearTimeout,queueMicrotask,console,matchMedia:()=>({matches:false}),getComputedStyle:()=>({})});
for(const code of parsed.scripts)vm.runInContext(code,context);
async function click(el,options={}){assert(el,'missing click target');const event={...options,target:el,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};if(el.onclick)await el.onclick(event);for(const f of el.events.click||[])await f(event);await new Promise(r=>setImmediate(r));}
const get=id=>doc.getElementById(id);
const ready=new Promise(r=>setImmediate(r));module.exports={root,doc,context,get,click,ready};
if(require.main===module)(async()=>{await ready;
 assert.equal(get('tool-access').hidden,true);assert.equal(get('tool-used').hidden,false);assert.equal(doc.body.dataset.module,'products');assert(get('editor').textContent.includes('Paramètres D365'));
 for(const name of ['bridge','contacts','products','powerbi','calculator','hs','home']){await click(root.querySelector('.module-tabs [data-module='+name+']'));assert.equal(doc.body.dataset.module,name);assert.equal(get(name==='home'?'tool-home-panel':'tool-'+name).hidden,false);}
 assert(get('hs-frame').srcdoc.includes('Données de démonstration'));assert.equal(get('powerbi-results').querySelectorAll('.record-row').length,8);assert.equal(get('used-results').children.length,36);assert.equal(get('used-filter-grid').children.length,6);
 assert(get('used-results').children[0].textContent.includes('NBV'));assert(get('product-results').textContent.includes('QUE-01'));assert(get('product-results').textContent.includes('YUL-01'));
 await click(root.querySelector('.module-tabs [data-module=products]'));await click(get('products-tab-used'));assert.equal(doc.body.dataset.module,'products');assert.equal(get('tool-used').hidden,false);
 get('used-query').value='SM58';get('used-query').oninput();assert.equal(get('used-results').children.length,6);get('used-filter-reset').onclick();assert.equal(get('used-results').children.length,36);
 await click(get('contact-from-lead'));assert.equal(get('contact-name').value,'Alex Martin');assert(get('contact-preview').value.includes('alex@example.test'));
 await click(get('tab-quote'));assert.equal(get('panel-quote').hidden,false);await click(get('quote'));assert(get('status').textContent.includes('Soumission créée'));
 await click(root.querySelector('[data-ui-language=en]'));assert.equal(doc.documentElement.lang,'en-CA');assert(get('hs-frame').srcdoc.includes('language="en"'));assert.equal(root.querySelector('[data-ui-language=en]').getAttribute('aria-pressed'),'true');
 await click(root.querySelector('[data-ui-language=fr]'));assert.equal(doc.documentElement.lang,'fr-CA');assert(animationCalls.some(a=>a.id==='tool-used'));assert(animationCalls.some(a=>a.id==='panel-quote'));
 console.log('PASS actual preview scripts: seven navigation entries, six modules, local data, filters, NBV, warehouse display, contact reuse, quotation demo, FR/EN and interaction animations');
})().catch(e=>{console.error(e);process.exitCode=1;});
