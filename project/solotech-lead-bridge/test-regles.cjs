const assert=require('node:assert/strict');
const fs=require('node:fs');
const B=require('./model.js');
assert.equal(B.phone('+1 (514) 563-8596 ext. 204').value,'514-563-8596');
assert.equal(B.phone('+1 (514) 563-8596 ext. 204').extension,'204');
assert.equal(B.phone('+33 1 42 68 53 00').value,'+33 1 42 68 53 00');
for(const [n,t] of [['514','GST&QST'],['416','HST_ON'],['604','GST&BC'],['204','GST&MB'],['403','GST'],['306','GST&SK'],['506','HST_NB'],['709','HST_NL'],['902',''],['782',''],['867',''],['800','']])assert.equal(B.suggest(n+'5551234').tax,t);
assert.equal(B.normalize({company:'ABC Inc',contact:'Jean Tremblay'}).company,'ABC Inc');
assert.equal(B.normalize({company:'[[Unknown]]',contact:'Xuan Hoang'}).type,'Organization');
assert.equal(B.normalize({company:'[[Unknown]]',contact:'Xuan Hoang'}).last,'Hoang');
console.log('OK — normalisation des téléphones, taxes, Company et Person');

for(const raw of ['123-456-7890','(123) 456-7890','1234567890','123 456 7890','123.456.7890','+1 (123) 456-7890','1-123-456-7890'])assert.equal(B.phone(raw).value,'123-456-7890');
assert.equal(B.domain('ed@alwhittletheatre.ca'),'alwhittletheatre.ca');
assert.equal(B.domain('client@gmail.com'),'');
assert.equal(B.domain('ed@invalid/path'),'');
const org=B.mapFields([{key:'a',label:'Name'},{key:'b',label:'Name'},{key:'c',label:'Name'},{key:'d',label:'Phone'}],'Organization');
assert.equal(org.company,'a');assert.equal(org.phoneName,'b');assert.equal(org.emailName,'c');assert.equal(org.phone,'d');
const person=B.mapFields([{key:'a',label:'First name'},{key:'b',label:'Last name'},{key:'c',label:'Name'},{key:'d',label:'Name'}],'Person');
assert.equal(person.first,'a');assert.equal(person.last,'b');assert.equal(person.phoneName,'c');assert.equal(person.emailName,'d');assert.equal(person.company,undefined);
const ambiguous=B.mapFields([{key:'a',label:'Name'},{key:'b',label:'Name'},{key:'c',label:'Name'},{key:'d',label:'Name'}],'Organization');assert.equal(ambiguous.company,undefined);
console.log('OK — formats supplémentaires, domaines et champs Organisation/Personne');

assert.equal(B.capitalizeName('michaël papineau'),'Michaël Papineau');
assert.equal(B.capitalizeName('jean-pierre'),'Jean-Pierre');
assert.equal(B.capitalizeName('équipements ABC inc.'),'Équipements ABC Inc.');
assert.equal(B.capitalizeName('McGill QSC'),'McGill QSC');
assert.equal(B.capitalizeName("d’angelo"),"D’Angelo");
assert.equal(B.capitalizeNames({company:'al whittle theatre',phoneName:'ed smith',emailName:'ed smith'}).company,'Al Whittle Theatre');
console.log('OK — majuscules noms de compagnie et contact, accents, sigles et noms composés');

for(const email of ['client@gmail.com','client@hotmail.com','client@outlook.com','client@live.ca','client@yahoo.ca','client@icloud.com','client@proton.me',' CLIENT@GMAIL.COM ']){
 assert.equal(B.normalize({email}).type,'Person');
 assert.equal(B.normalize({email,company:'ABC Inc.'}).type,'Person');
 assert.equal(B.domain(email),'');
}
for(const email of ['',null,'invalid','ed@alwhittletheatre.ca','client@gmail.com.example.ca','client@outlook.company.ca'])assert.equal(B.normalize({email,company:'[[Unknown]]'}).type,'Organization');
assert.equal(B.normalize({}).type,'Organization');
console.log('OK — Organisation par défaut; Personne seulement pour les domaines personnels reconnus.');

const draft=B.normalize({company:'Acme Inc.',contact:'Jean Tremblay',email:'jean@acme.ca',phone:'5145551234',street:'123 Main',city:'Montréal'});
B.switchType(draft,'Person');assert.equal(draft.first,'Jean');assert.equal(draft.last,'Tremblay');assert.equal(draft.company,'Acme Inc.');
draft.first='Jean-Pierre';B.switchType(draft,'Organization');assert.equal(draft.company,'Acme Inc.');assert.equal(draft.phoneName,'Jean-Pierre Tremblay');assert.equal(draft.email,'jean@acme.ca');assert.equal(draft.street,'123 Main');assert.equal(draft.phone,'514-555-1234');
B.switchType(draft,'Person');assert.equal(draft.first,'Jean-Pierre');
const individual=B.normalize({contact:'ed smith',email:'ed@gmail.com'});B.switchType(individual,'Organization');assert.equal(individual.company,'Ed Smith');B.switchType(individual,'Person');assert.equal(individual.first,'Ed');assert.equal(individual.last,'Smith');
console.log('OK — changements de type aller-retour, identités et coordonnées conservées.');
const quebec=B.updateTax(B.normalize({phone:'5145551234',language:'English'}));assert.equal(quebec.tax,'GST&QST');assert.equal(quebec.language,'en-US');
B.applyCompany(quebec,{company:'Test Inc.',city:'Toronto',state:'Ontario',postal:'M5V 2T6',country:'Canada',street:'123 Test St'});assert.equal(quebec.tax,'HST_ON');assert.equal(quebec.language,'en-US');
quebec.phone='4505551234';B.updateTax(quebec);assert.equal(quebec.tax,'HST_ON');
B.applyCompany(quebec,{company:'Test Inc.',city:'Montréal',state:'Québec',postal:'H2X 1Y4',country:'CA'});assert.equal(quebec.tax,'GST&QST');assert.equal(quebec.street,'');
B.applyCompany(quebec,{company:'Test Inc.',postal:'B4P 2A1',country:'CAN'});assert.equal(quebec.tax,'HST_NS');assert.equal(quebec.state,'');
assert.equal(B.taxForData({phone:'5145551234',state:'ON',postal:'H2X 1Y4',country:'CAN'}).tax,'');
assert.equal(B.taxForData({phone:'5145551234',state:'CA',country:'USA'}).tax,'');
assert.equal(B.taxForData({phone:'5145551234',addressImported:true,country:'CAN'}).tax,'');
assert.equal(B.taxForData({phone:'9025551234',state:'PE',country:'CAN'}).tax,'HST_PEI');
assert.equal(B.normalize({preferredLanguage:' English ',language:'French',state:'QC'}).language,'en-US');
assert.equal(B.normalize({preferredLanguage:'Français',language:'English',state:'ON'}).language,'fr-CA');
assert.equal(B.normalize({language:'German'}).language,'');
console.log('OK — priorité adresse, recalcul à l’importation, incohérences et langue du lead conservée.');
