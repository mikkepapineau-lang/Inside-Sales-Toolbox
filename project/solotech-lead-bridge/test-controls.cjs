const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{
 constructor(tag,attrs={},kids=[]){this.tagName=tag.toUpperCase();this.attrs=attrs;this.children=kids;this.id=attrs.id||'';this.type=attrs.type||'';for(const k of kids)k.parentElement=this;}
 getAttribute(k){return this.attrs[k]??null}getClientRects(){return this.hidden?[]:[1]}
 matches(s){return s.split(',').some(x=>{x=x.trim();if(x.startsWith('[')){const m=x.match(/^\[([^=]+)="([^"]+)"\]$/);return m&&this.getAttribute(m[1])===m[2];}if(x.startsWith('input['))return this.tagName==='INPUT'&&x.includes('"'+this.type+'"');return this.tagName===x.toUpperCase()})}
 querySelectorAll(s){return this.children.flatMap(c=>[...(s==='*'||c.matches(s)?[c]:[]),...c.querySelectorAll(s)])}
 contains(e){return this===e||this.children.some(c=>c.contains(e))}
 closest(s){for(let n=this;n;n=n.parentElement)if(n.matches(s))return n;return null}
}
const save=new Element('button',{id:'DirPartyQuickCreateForm_17_OKButton'});
const wrong=new Element('button',{id:'OtherForm_4_OKButton'});
const quick=new Element('div',{id:'DirPartyQuickCreateForm_17'},[save]);
const sales=new Element('button',{'data-dyn-controlname':'mibSalesQuotationTableForNew'});
const fields=['ACTIVITY','DEPARTMENT','DIVISION','OFFICE','TERRITORY'].map(name=>{const input=new Element('input',{role:'combobox'}),description=new Element('input');description.readOnly=true;return new Element('div',{id:'smmBusRelTable_2_DimensionEntryControl_DECRowGroup_'+name},[input,description])});
const form=new Element('div',{'data-dyn-formname':'smmBusRelTable'},[sales,...fields]);
const root=new Element('div',{},[quick,wrong,form]);const context={document:root,getComputedStyle:()=>({visibility:'visible'})};vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/d365-controls.js','utf8'),context);
const C=context.D365Controls;
assert.equal(C.find('DirPartyQuickCreateForm','OKButton','action'),save);
assert.equal(C.find('smmBusRelTable','mibSalesQuotation TableForNew','action'),sales);
for(const row of fields){const name=row.id.split('smmBusRelTable_2_')[1];assert.equal(C.find('smmBusRelTable',name,'field'),row.children[0]);}
assert.equal(C.find('UnrelatedForm','OKButton','action'),null);
const duplicate=new Element('button',{'data-dyn-controlname':'mibSalesQuotation TableForNew'});duplicate.parentElement=form;form.children.push(duplicate);
assert.throws(()=>C.find('smmBusRelTable','mibSalesQuotation TableForNew','action'),/2 cible/);
form.attrs={'id':'smmbusinessrelationslistpage_1'};
sales.attrs={'id':'smmbusinessrelationslistpage_1_mibSalesQuotationTableForNew'};
form.children.pop();
assert.equal(C.find('smmBusRelTable','mibSalesQuotation TableForNew','action'),sales);
for(const row of fields){
 const dimension=row.id.split('_').pop();
 row.attrs={};
 row.children[0].attrs={id:'smmbusinessrelationslistpage_1_DimensionEntryControl_DECValue_'+dimension+'_input',name:'DimensionEntryControl_DECValue_'+dimension,role:'combobox'};
 assert.equal(C.find('smmBusRelTable','DimensionEntryControl_DECValue_'+dimension,'field'),row.children[0]);
 delete row.children[0].attrs.name;
 assert.equal(C.find('smmBusRelTable','DimensionEntryControl_DECValue_'+dimension,'field'),row.children[0]);
}
console.log('OK — diagnostic réel listpage / DECValue / _input, formulaires nommés, IDs dynamiques, espaces du contrôle Sales quotation, cinq lignes de dimensions, descriptions exclues, ambiguïtés bloquées.');
