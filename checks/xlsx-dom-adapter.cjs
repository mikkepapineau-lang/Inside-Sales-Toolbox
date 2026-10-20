// Test-only DOMParser adapter: an independent SAX XML parser, not shipped in the extension.
const sax=require('sax');
class XmlNode{
 constructor(name='',attrs={}){this.localName=name.split(':').pop();this.attrs=attrs;this.children=[];this.parts=[];}
 get textContent(){return this.parts.map(x=>typeof x==='string'?x:x.textContent).join('');}
 getAttribute(name){return this.attrs[name]?.value??null;}
 getAttributeNS(ns,name){return Object.values(this.attrs).find(a=>a.uri===ns&&a.local===name)?.value??null;}
 getElementsByTagNameNS(ns,name){return this.children.flatMap(c=>[...(name==='*'||c.localName===name?[c]:[]),...c.getElementsByTagNameNS(ns,name)]);}
 getElementsByTagName(name){return this.getElementsByTagNameNS('*',name);}
}
class DOMParser{
 parseFromString(input){const root=new XmlNode(),stack=[root],p=sax.parser(true,{xmlns:true,trim:false,normalize:false});p.onopentag=t=>{const n=new XmlNode(t.name,t.attributes);stack.at(-1).children.push(n);stack.at(-1).parts.push(n);stack.push(n);};p.onclosetag=()=>stack.pop();p.ontext=p.oncdata=t=>stack.at(-1).parts.push(t);p.write(input).close();return root;}
}
module.exports={DOMParser};
