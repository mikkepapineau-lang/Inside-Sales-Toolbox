const assert=require('node:assert/strict'),fixture=require('./d365-fixture.cjs');
function typeFixture({native=false,rejected=false,duplicate=false}={}){
 const f=fixture();f.body.innerText='Create prospect';f.document.visibilityState='hidden';let clicks=0,wakes=0,choices=0;
 const type=f.field('Type','Organization','DirPartyQuickCreateForm_7_Type_input');type.readOnly=!native;type.attrs.role='combobox';
 let identity=[f.field('Name','','DirPartyQuickCreateForm_7_Name_input')];
 const mount=()=>{for(const n of identity)n.remove();identity=[f.field('First name','','DirPartyQuickCreateForm_7_FirstName_input'),f.field('Last name','','DirPartyQuickCreateForm_7_LastName_input')];};
 if(native){type.tagName='SELECT';type.options=[{value:'0',text:'Organisation'},{value:'1',text:'Personne'}];type.value='0';type.events.change=()=>{choices++;f.later(900,mount);};}
 else{
  type.events.click=()=>{clicks++;};
  f.document.visibilityState='hidden';
 }
 if(duplicate)f.field('Type','Person','DirPartyQuickCreateForm_7_OtherType_input');
 const onBlocked=async()=>{wakes++;f.document.visibilityState='visible';if(!native){const option=new f.Node('li',{role:'option'});option.innerText='Person';option.events.click=()=>{choices++;option.remove();if(!rejected)type.value='Person';f.later(900,mount);};}};
 return {...f,type,onBlocked,counts:()=>({clicks,wakes,choices})};
}
function prospectFixture({stuck=false,changeAccount=false,duplicateEdit=false,technicalEdit=false,disabledEdit=false,hiddenEdit=false,duplicateTechnical=false,listPage=false}={}){
 const f=fixture();f.document.visibilityState='hidden';let edits=0,saves=0,wakes=0,creates=0;
 const account=f.field('Account','CAOP-1234','smmBusRelTable_2_Account_input'),name=f.field('Name','Test Company','smmBusRelTable_2_Name_input');account.readOnly=name.readOnly=true;
 const dimensions=['ACTIVITY','DEPARTMENT','DIVISION','OFFICE','TERRITORY'].map(n=>{const e=f.field(n,'','smmBusRelTable_2_DimensionEntryControl_DECValue_'+n+'_input');e.readOnly=true;e.attrs.role='combobox';return e;});
 const form=listPage?'smmbusinessrelationslistpage_2':'smmBusRelTable_2';
 const edit=f.button(technicalEdit?'Icon only':'Edit Alt+E',form+'_'+(technicalEdit?'SystemDefinedViewEditButton':'Edit'),()=>{edits++;if(changeAccount)account.value='CAOP-9999';}),caption=new f.Node('span');caption.innerText=technicalEdit?'':'Edit';edit.append(caption);edit.disabled=disabledEdit;edit.hidden=hiddenEdit;
 if(technicalEdit==='child'){edit.id=form+'_ToolbarAction';caption.attrs['data-dyn-controlname']='SystemDefinedViewEditButton';}
 if(duplicateTechnical)f.button('Icon only',form+'_Other_SystemDefinedViewEditButton');
 if(duplicateEdit)f.button('Edit','smmBusRelTable_2_OtherEdit');
 f.button('Save','smmBusRelTable_2_Save',()=>saves++);
 const onBlocked=async()=>{wakes++;f.document.visibilityState='visible';if(!stuck)f.later(1200,()=>{for(const e of dimensions)e.readOnly=false;edit.remove();});};
 f.c.solotechBridge={setType:async()=>{},scan:()=>({token:'draft',fields:[{key:'0',label:'Name',value:name.value}]}),fill:async()=>[],createProspect:()=>{creates++;f.body.innerText='Prospect';return {clicked:true};}};
 return {...f,account,name,dimensions,onBlocked,counts:()=>({edits,saves,wakes,creates})};
}
(async()=>{
 let f=typeFixture();await f.c.solotechBridge.setType('Person',{onBlocked:f.onBlocked});assert.equal(f.type.value,'Person');assert.deepEqual(f.counts(),{clicks:1,wakes:1,choices:1});assert(f.time()>=2700);assert.equal(f.c.solotechBridge.scan().fields.filter(e=>['First name','Last name'].includes(e.label)).length,2);
 f=typeFixture({native:true});await f.c.solotechBridge.setType('Person',{onBlocked:f.onBlocked});assert.equal(f.type.value,'1');assert.equal(f.counts().choices,1);
 f=typeFixture({rejected:true});await assert.rejects(f.c.solotechBridge.setType('Person',{onBlocked:f.onBlocked}),/champs attendus/);assert.equal(f.counts().choices,1);
 f=typeFixture({duplicate:true});await assert.rejects(f.c.solotechBridge.setType('Person',{onBlocked:f.onBlocked}),/ambigu/);assert.deepEqual(f.counts(),{clicks:0,wakes:0,choices:0});
 const args={expectedName:'Test Company',expectedAccount:'CAOP-1234',office:'MONTREAL',territory:'MONTREAL'};
 f=prospectFixture();await f.c.solotechQuotation.fillDimensions({...args,onBlocked:f.onBlocked});assert.deepEqual(f.counts(),{edits:1,saves:1,wakes:1,creates:0});assert.deepEqual(f.dimensions.map(e=>e.value),['ECOMM','021','003','MONTREAL','MONTREAL']);
 // Technical Edit wins over unrelated captions and works with nested controls/list-page IDs.
 for(const options of [{technicalEdit:true},{technicalEdit:'child'},{technicalEdit:true,listPage:true}]){
  f=prospectFixture({...options,duplicateEdit:true});let unrelated=0;f.button('Edit','SalesTable_9_SystemDefinedViewEditButton',()=>unrelated++);
  await f.c.solotechQuotation.fillDimensions({...args,onBlocked:f.onBlocked});assert.equal(f.counts().edits,1);assert.equal(f.counts().saves,1);assert.equal(unrelated,0);
 }
 for(const options of [{disabledEdit:true},{hiddenEdit:true},{duplicateTechnical:true}]){
  f=prospectFixture({technicalEdit:true,stuck:true,duplicateEdit:true,...options});await assert.rejects(f.c.solotechQuotation.fillDimensions({...args,onBlocked:f.onBlocked}));assert.equal(f.counts().edits,0);assert.equal(f.counts().saves,0);assert(f.dimensions.every(e=>!e.value));
 }
 for(const options of [{stuck:true},{changeAccount:true},{duplicateEdit:true}]){f=prospectFixture(options);await assert.rejects(f.c.solotechQuotation.fillDimensions({...args,onBlocked:f.onBlocked}));assert.equal(f.counts().saves,0);assert(f.counts().edits<=1);assert(f.dimensions.every(e=>!e.value));}
 // The create transition saves the prospect once, then edits the created record for dimensions.
 for(const stuck of [false,true]){
  f=prospectFixture({stuck});f.body.innerText='Create prospect';const data={type:'Organization',company:'Test Company'};
  const prospect=f.field('Prospect','CAOP-1234','DirPartyQuickCreateForm_7_Prospect_input');
  await f.c.solotechFlow.fillDraft({data,overwrite:false,onBlocked:f.onBlocked});prospect.remove();
  const result=await f.c.solotechFlow.confirmProspect({...args,data,onBlocked:f.onBlocked});assert.equal(f.counts().creates,1);assert.equal(f.counts().edits,1);
  assert.equal(!!result.dimensionsPending,stuck);assert.equal(f.counts().saves,stuck?0:1);
  await assert.rejects(f.c.solotechFlow.confirmProspect({...args,data,onBlocked:f.onBlocked}),/Remplis d’abord/);assert.equal(f.counts().creates,1);
 }
 console.log('PASS prospect transitions: delayed type/fields, technical Edit by form/control including child captions and list-page IDs, hidden/disabled/ambiguous control guards, identity checks and no duplicate Save');
})().catch(e=>{console.error(e);process.exitCode=1;});
