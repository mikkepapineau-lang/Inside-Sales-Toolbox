(function(root){
'use strict';
// Site membership is an explicit business mapping. Never infer it from a code prefix.
const sites=[
 {id:'MTL',name:'Montréal',defaultWarehouse:'YUL-01',warehouses:[
  ['ANJ-01','ANJOU VENTES ET INT SYSTEMES'],['ANJ-08','ANJOU EQUIPEMENTS USAGES À VENDRE'],
  ['CA-TRANSIT','TRANSIT WAREHOUSE'],['MTL-01','MONTREAL VENTES ET INT SYSTEMES'],
  ['MTL-02','MONTREAL EXPRESS'],['MTL-03','MONTREAL CAMIONS'],['MTL-04','MONTREAL CENTRE DE SERVICES'],
  ['MTL-05','MONTREAL REPARATION COFFRE'],['MTL-06','MONTREAL SOLUTIONS EVENEMENTIELLES'],
  ['MTL-07','MONTREAL PIECES SOLUTIONS EVENEMENTIELLES'],['MTL-08','MONTREAL EQUIPEMENTS USAGÉS À VENDRE'],
  ['MTL-09','MONTREAL SOFTGOODS RAW MATERIAL'],['MTL-61','MONTREAL QUARANTINE'],['MTL-62','MONTREAL CONSIGNATION'],
  ['YUL-01','MONTREAL VENTES ET INT SYSTEMES'],['YUL-99','Equipment out of hub']
 ]},
 {id:'QUE',name:'Québec',defaultWarehouse:'QUE-01',warehouses:[
  ['FOY-01','STE-FOY VENTES ET INT SYSTEMES'],['QUE-01','QUEBEC VENTES ET INT SYSTEMES'],
  ['QUE-02','QUEBEC BOUTIQUE'],['QUE-03','QUEBEC CAMIONS'],['QUE-04','QUEBEC CENTRE DE SERVICES'],
  ['QUE-06','QUEBEC SOLUTIONS EVENEMENTIELLES'],['QUE-07','QUEBEC PIECES SOLUTIONS EVENEMENTIELLES'],
  ['QUE-08','QUEBEC BOUTIQUE'],['QUE-61','QUARANTINE'],['QUE-62','QUEBEC CONSIGNATION']
 ]},
 {id:'HAL',name:'Halifax',defaultWarehouse:'HAL-01',warehouses:[['HAL-01','HALIFAX SALES & SYSTEMS INT']]},
 {id:'OTT',name:'Ottawa',defaultWarehouse:'OTT-01',warehouses:[
  ['OTT-01','OTTAWA SALES AND INTEGRATION'],['OTT-03','OTTAWA TRUCKS'],['OTT-04','OTTAWA SERVICE CENTRE'],['OTT-61','OTTAWA QUARANTINE']
 ]},
 {id:'TOR',name:'Toronto',defaultWarehouse:'TOR-01',warehouses:[
  ['TOR-01','TORONTO SALES & SYSTEMS INT'],['TOR-03','TORONTO TRUCKS'],['TOR-04','TORONTO SERVICE CENTRE'],
  ['TOR-05','TORONTO MANUFACTURING'],['TOR-06','TORONTO LIVE PRODUCTION'],['TOR-61','QUARANTINE']
 ]},
 {id:'USED-CA',name:'Usagé Canada',defaultWarehouse:'',warehouses:[
  ['USED-INC','PO SO INTERCO'],['USED-MTL','USED MTL'],['USED-OTT','USED OTTAWA'],
  ['USED-PO-SO','USED PO SO INTERCO'],['USED-QUE','USAGES QUEBEC']
 ]},
 {id:'CAL',name:'Calgary',defaultWarehouse:'CAL-01',warehouses:[['CAL-01','CALGARY SALES & SYSTEMS INT'],['CAL-04','CALGARY SERVICE CENTRE']]}
];
const code=value=>String(value||'').trim().toUpperCase();
const find=site=>sites.find(s=>s.id===code(site));
const siteFor=warehouse=>sites.find(s=>s.warehouses.some(([id])=>id===code(warehouse)))?.id||'';
const valid=(site,warehouse)=>!!find(site)?.warehouses.some(([id])=>id===code(warehouse));
function assertPair(site,warehouse){
 if(!valid(site,warehouse))throw Error('Combinaison Site / Warehouse invalide : '+(code(site)||'site à choisir')+' / '+(code(warehouse)||'entrepôt à choisir')+'. Choisis un entrepôt appartenant au site.');
 return {site:code(site),warehouse:code(warehouse)};
}
function defaults(territory){
 const site=({MONTREAL:'MTL',QUEBEC:'QUE',SAGUENAY:'QUE',HALIFAX:'HAL',OTTAWA:'OTT',TORONTO:'TOR',CALGARY:'CAL'})[code(territory)]||'MTL';
 return {site,warehouse:find(site).defaultWarehouse,warehouseManual:false};
}
function selection(data,territory,reset=false){
 if(reset)return defaults(territory);
 const warehouse=code(data.warehouse),site=code(data.site)||siteFor(warehouse);
 if(site||warehouse){
  // An invalid saved pair must require a choice, never silently move warehouses between sites.
  if(!find(site))return {site:'',warehouse:'',warehouseManual:true};
  return {site,warehouse:valid(site,warehouse)?warehouse:'',warehouseManual:data.warehouseManual===undefined?true:!!data.warehouseManual};
 }
 return data.warehouseManual?{site:'',warehouse:'',warehouseManual:true}:defaults(territory);
}
for(const site of sites){for(const row of site.warehouses)Object.freeze(row);Object.freeze(site.warehouses);Object.freeze(site);}
root.ToolboxWarehouses=Object.freeze({sites:Object.freeze(sites),find,siteFor,valid,assertPair,defaults,selection});
if(typeof module!=='undefined')module.exports=root.ToolboxWarehouses;
})(globalThis);
