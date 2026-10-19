const assert=require('node:assert/strict'),fixture=require('./d365-fixture.cjs');
function form(){
 const f=fixture();f.body.innerText='Create prospect';
 const name=f.field('Name'),phone=f.field('Phone','OLD PHONE'),language=f.field('Language','en-US'),postal=f.field('ZIP/postal code'),email=f.field('Email address');
 postal.tagName='SELECT';postal.options=[{text:'Other',value:'Other'}];email.events.change=()=>{email.attrs['aria-invalid']='true';};
 const credit=f.field('Mandatory credit limit');credit.type='checkbox';credit.attrs.type='checkbox';credit.events.click=()=>credit.checked=true;
 const fields=[name,phone,language,postal,email],snapshot=f.c.solotechBridge.scan();
 const values=['Test Company','NEW PHONE','fr-CA','UNKNOWN','test@example.test'];
 const items=fields.map((e,i)=>({key:snapshot.fields.find(x=>x.label===e.labels[0].innerText).key,field:['company','phone','language','postal','email'][i],label:e.labels[0].innerText,value:values[i]}));
 return {...f,fields,items,snapshot,credit};
}
(async()=>{
 let f=form(),events=[];
 const report=await f.c.solotechBridge.fill({scanToken:f.snapshot.token,items:f.items,type:'Organization',overwrite:false,onProgress:async update=>{
  events.push({...JSON.parse(JSON.stringify(update)),nameAtEvent:f.fields[0].value});
 }});
 assert(events.every(e=>e.fields.total===6&&e.fields.current<=e.fields.total));assert.equal(events[0].fields.current,0);assert.equal(events[0].nameAtEvent,'');assert.equal(events[1].fields.current,1);assert.equal(events[1].nameAtEvent,'Test Company');
 assert.equal(events.length,12);assert.deepEqual(events.filter(e=>e.fields.state!=='writing').map(e=>e.fields.state),['filled','kept','filled','warning','warning','filled']);
 assert.deepEqual(events.filter(e=>e.fields.state==='writing').map(e=>e.fields.current),[0,1,2,3,4,5]);
 assert.equal(events.at(-1).fields.current,6);assert.equal(f.fields[1].value,'OLD PHONE');assert.equal(f.fields[2].value,'fr-CA');assert.equal(f.credit.checked,true);assert.equal(report.length,6);
 assert(!JSON.stringify(events).includes('test@example.test'),'progress contains field labels, not customer values');
 // A failed display update cannot cancel a successful CRM field write.
 f=form();await f.c.solotechBridge.fill({scanToken:f.snapshot.token,items:f.items,type:'Organization',onProgress:async()=>{throw Error('Panel closed');}});assert.equal(f.fields[0].value,'Test Company');assert.equal(f.fields[2].value,'fr-CA');
 console.log('PASS real field progress: before/after commit, processed counts, preserved values, preferred language override, validation/lookup warnings, mandatory credit limit and display-failure isolation');
})().catch(e=>{console.error(e);process.exitCode=1;});
