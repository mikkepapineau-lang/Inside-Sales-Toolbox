// Production UI with fictional adapters: density, workflows, accessibility and portability.
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
execFileSync('python3',['checks/redesign-preview/build.py','--overhaul']);
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1600,height:900}}),errors=[],external=[];
  context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  const document=fs.readFileSync('checks/redesign-preview/preview-document.html','utf8');
  await context.route('**/*',r=>{
   const url=r.request().url();
   if(url==='https://toolbox.test/')return r.fulfill({body:fs.readFileSync('/workspace/toolbox-overhaul-preview.html','utf8'),contentType:'text/html'});
   if(url==='https://toolbox.test/panel')return r.fulfill({body:document,contentType:'text/html'});
   if(url==='https://toolbox.test/popup')return r.fulfill({body:document.replace('data-toolbox-view="panel"','data-toolbox-view="popup"'),contentType:'text/html'});
   external.push(url);return r.abort();
  });
  const p=await context.newPage();await p.goto('https://toolbox.test/');
  const frames=async()=>Promise.all((await p.locator('main > section > iframe').elementHandles()).map(h=>h.contentFrame()));
  let [fresh,used,nr,ready]=await frames();
  await fresh.waitForSelector('#product-results .product-card');await used.waitForFunction(()=>document.querySelectorAll('#used-results .product-card').length===36&&document.querySelector('#used-results').textContent.includes('Canada'));
  await nr.waitForFunction(()=>document.querySelectorAll('#nonreserved-results .product-card').length===9);
  await ready.waitForFunction(()=>document.querySelectorAll('#powerbi-results .record-row').length===8);
  for(const frame of [fresh,used,nr,ready])assert(await frame.evaluate(()=>[...document.querySelectorAll('.module-tabs button')].every(button=>!button.textContent.trim()&&button.title.trim()&&button.getAttribute('aria-label')===button.title)),'Icon-only navigation retains native tooltips and accessible names');

  const measure=frame=>frame.evaluate(()=>{
   const full=selector=>[...document.querySelectorAll(selector)].filter(e=>{const r=e.getBoundingClientRect();return r.height&&r.top>=0&&r.bottom<=innerHeight;}).length;
   return {width:innerWidth,height:innerHeight,orders:full('#powerbi-results .record-row'),nonreserved:full('#nonreserved-results .product-card'),firstOrder:document.querySelector('#powerbi-results .record-row')?.getBoundingClientRect().top};
  });
  const density={ready:await measure(ready),nonreserved:await measure(nr)};
  assert(density.ready.orders>=6,'At least six complete orders must fit: '+JSON.stringify(density));
  assert(density.ready.firstOrder<310,'Orders must start near the controls: '+JSON.stringify(density));
  assert(density.nonreserved.nonreserved>=4,'At least four complete NR products must fit: '+JSON.stringify(density));
  assert.equal(await ready.locator('#powerbi-filters').getAttribute('open'),null);
  assert.equal(await ready.locator('#powerbi-salesperson').inputValue(),'ALEX MARTIN');
  assert.deepEqual(await used.locator('#used-results .product-card').first().locator('.product-warehouse-heading h4').allTextContents(),['Canada','UK','USA']);
  const sizes=await used.locator('#used-results .product-card').first().evaluate(card=>({price:parseFloat(getComputedStyle(card.querySelector('.product-selling-price dd')).fontSize),nbv:parseFloat(getComputedStyle(card.querySelector('.product-nbv-metrics dd')).fontSize)}));
  assert(sizes.price>=16&&sizes.nbv>=14,'Financial values retain emphasis');
  assert(await used.evaluate(()=>Boolean(document.querySelector('#used-results').compareDocumentPosition(document.querySelector('#used-updates'))&Node.DOCUMENT_POSITION_FOLLOWING)));
  await p.screenshot({path:'/workspace/toolbox-overhaul-preview.png'});
  await p.screenshot({path:'/workspace/toolbox-liquid-glass-light.png'});
  await p.click('#preview-appearance');
  for(const frame of [fresh,used,nr,ready])await frame.waitForFunction(()=>document.documentElement.dataset.appearance==='dark');
  assert.equal((await measure(ready)).orders,density.ready.orders,'Dark mode preserves list density');
  assert.equal((await measure(nr)).nonreserved,density.nonreserved.nonreserved);
  await p.screenshot({path:'/workspace/toolbox-liquid-glass-dark.png'});
  // Text colours remain readable over the actual semi-opaque row material.
  for(const mode of ['dark','light']){
   if(mode==='light')await p.click('#preview-appearance');
   const contrast=await ready.evaluate(()=>{
    const rgb=value=>value.match(/[\d.]+/g).map(Number),linear=n=>(n/=255)<=.04045?n/12.92:((n+.055)/1.055)**2.4;
    const luminance=values=>values.slice(0,3).reduce((sum,value,i)=>sum+linear(value)*[.2126,.7152,.0722][i],0);
    const row=document.querySelector('.record-row'),style=getComputedStyle(row),bg=rgb(style.backgroundColor),base=rgb(getComputedStyle(document.documentElement).backgroundColor);
    const mixed=bg.slice(0,3).map((v,i)=>v*(bg[3]??1)+base[i]*(1-(bg[3]??1)));
    return ['.record-code','.record-name','.record-amount'].map(selector=>{const fg=rgb(getComputedStyle(row.querySelector(selector)).color),a=luminance(fg),b=luminance(mixed);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
   });assert(contrast.every(value=>value>=4.5),mode+' order text contrast '+contrast);
  }

  // Explicit seller changes hide old results until a new confirmed extraction.
  await ready.fill('#powerbi-salesperson','JULIE EXEMPLE');assert.equal(await ready.locator('#powerbi-results .record-row').count(),0);await ready.click('#powerbi-refresh');
  await ready.waitForFunction(()=>document.querySelectorAll('#powerbi-results .record-row').length===8);assert.equal(await nr.locator('#nonreserved-results .product-card').count(),9);
  await ready.locator('#powerbi-filters>summary').click();await ready.selectOption('#powerbi-delivery','@pickup');assert.equal(await ready.locator('#powerbi-filter-count').textContent(),'· 1 actif(s)');assert.equal(await ready.locator('#powerbi-results .record-row').count(),8);await ready.selectOption('#powerbi-delivery','');
  await nr.fill('#nonreserved-query','ADAPTATEUR-DÉMO');await nr.waitForFunction(()=>document.querySelectorAll('#nonreserved-results .product-card').length===1);await nr.fill('#nonreserved-query','');await nr.waitForFunction(()=>document.querySelectorAll('#nonreserved-results .product-card').length===9);
  await nr.locator('#nonreserved-filters>summary').click();await nr.selectOption('#nonreserved-entity','UKGR');assert.equal(await nr.locator('#nonreserved-results .product-warehouse').count(),1);await nr.click('#nonreserved-filter-reset');
  await nr.locator('#nonreserved-filters>summary').click();
  const disclosure=nr.locator('#nonreserved-results .product-details').first();
  await disclosure.locator('summary').click();await nr.waitForFunction(()=>document.querySelector('#nonreserved-results .product-details').open);
  assert.equal(await disclosure.locator('.product-source-line').count(),3);assert((await disclosure.textContent()).includes('NonReservedInventoryCategory'));
  await disclosure.locator('summary').press('Enter');await nr.waitForFunction(()=>!document.querySelector('#nonreserved-results .product-details').open);
  await p.click('[data-view=crm]');
  const [lead,prospect,quote,contacts]=await frames();
  await lead.waitForSelector('#value-company');await prospect.waitForSelector('#fill');await quote.waitForSelector('#warehouse');await contacts.waitForSelector('#contact-name');
  assert.equal(await lead.locator('.editor-section').getAttribute('open'),null);
  await contacts.fill('#contact-name','Camille Démo');assert((await contacts.locator('#contact-preview').inputValue()).toUpperCase().includes('CAMILLE DÉMO'));
  await contacts.locator('.contact-import>summary').click();await contacts.fill('#contact-raw','Sam Exemple\n(514) 555-0100\nsam@example.test');await contacts.click('#contact-parse');assert.equal((await contacts.locator('#contact-email').inputValue()).toLowerCase(),'sam@example.test');
  await contacts.locator('.contact-import>summary').click();
  await lead.click('#capture');await lead.waitForFunction(()=>document.querySelector('#capture').dataset.actionState==='success');assert.equal(await lead.locator('#value-company').inputValue(),'Équipements Démo');assert.equal(await lead.locator('#value-company').isEnabled(),true);
  await p.screenshot({path:'/workspace/toolbox-overhaul-crm.png'});
  await p.screenshot({path:'/workspace/toolbox-liquid-glass-crm-light.png'});
  await p.click('#preview-appearance');for(const frame of [lead,prospect,quote,contacts])await frame.waitForFunction(()=>document.documentElement.dataset.appearance==='dark');await p.screenshot({path:'/workspace/toolbox-liquid-glass-crm-dark.png'});

  await p.click('[data-view=tools]');
  const [home,hs,margin,conversion]=await frames();
  await home.waitForSelector('.tool-tile');await margin.waitForFunction(()=>document.querySelector('#pricing-total').textContent.trim()!=='···');await conversion.waitForSelector('#calculator-conversion:visible');
  await hs.waitForSelector('#hs-frame');const innerHS=await(await hs.locator('#hs-frame').elementHandle()).contentFrame();await innerHS.waitForSelector('#result strong');
  assert.equal(await home.locator('.tool-tile').count(),6);assert((await innerHS.locator('#result').textContent()).includes('démonstration'));
  await innerHS.waitForFunction(()=>document.documentElement.dataset.appearance==='dark');
  await p.screenshot({path:'/workspace/toolbox-liquid-glass-tools-dark.png'});
  await p.click('#preview-appearance');await innerHS.waitForFunction(()=>document.documentElement.dataset.appearance==='light');
  await p.screenshot({path:'/workspace/toolbox-overhaul-tools.png'});
  await p.screenshot({path:'/workspace/toolbox-liquid-glass-tools-light.png'});

  // Navigation, all product kinds and every result family stay usable at narrow widths.
  const panel=await context.newPage();await panel.goto('https://toolbox.test/panel');await panel.waitForSelector('#used-results .product-card');
  await panel.emulateMedia({colorScheme:'dark'});await panel.waitForFunction(()=>document.documentElement.dataset.appearance==='dark');
  await panel.emulateMedia({colorScheme:'light'});await panel.waitForFunction(()=>document.documentElement.dataset.appearance==='light');
  for(const mode of ['light','dark']){
   if(mode==='dark')await panel.click('#toolbox-appearance');
  for(const width of [320,390,520,900]){
   await panel.setViewportSize({width,height:820});
   for(const module of ['home','bridge','contacts','products','powerbi','calculator','hs']){
    await panel.click('.module-tabs [data-module='+module+']');
    const layout=await panel.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,nav:[...document.querySelectorAll('.module-tabs button')].map(e=>{const r=e.getBoundingClientRect();return [r.left,r.right];}),title:document.querySelector('#tool-label').getBoundingClientRect().height}));
    assert(layout.scroll<=width+1,'No horizontal document overflow: '+JSON.stringify({width,module,layout}));assert(layout.nav.every(([left,right])=>left>=0&&right<=width+1));assert(layout.title>0);
    assert(await panel.evaluate(()=>[...document.querySelectorAll('.module-tabs button')].every(button=>{const icon=button.querySelector('svg').getBoundingClientRect(),box=button.getBoundingClientRect();return !button.textContent.trim()&&icon.left>=box.left&&icon.right<=box.right&&icon.top>=box.top&&icon.bottom<=box.bottom;})),'Icons fit their buttons without text overlap');
   }
   await panel.click('.module-tabs [data-module=products]');
   for(const kind of ['new','used','nonreserved']){
    await panel.click('#products-tab-'+kind);
    const overflow=await panel.evaluate(()=>[...document.querySelectorAll('.tool-panel:not([hidden]) input:not([type=checkbox]):not([type=file]),.tool-panel:not([hidden]) .product-card,.tool-panel:not([hidden]) select')].filter(e=>e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth+1;}).map(e=>e.id||e.className));
    assert.deepEqual(overflow,[],width+'px '+kind+' visible controls/results fit');
   }
  }
  }
  await panel.click('#toolbox-appearance');await panel.waitForFunction(()=>document.documentElement.dataset.appearance==='light');
  await panel.setViewportSize({width:390,height:820});await panel.click('.module-tabs [data-module=powerbi]');await panel.screenshot({path:'/workspace/toolbox-overhaul-ready.png'});
  await panel.click('[data-ui-language=en]');await panel.waitForFunction(()=>document.documentElement.lang==='en-CA');assert.equal(await panel.locator('#powerbi-filters>summary').textContent(),'Filters and sorting ');assert.equal(await panel.locator('.ready-scope>label:first-child').textContent(),'Scope');assert.equal(await panel.locator('.module-tabs [data-module=products]').getAttribute('title'),'Products');assert.equal(await panel.locator('.module-tabs [data-module=products]').getAttribute('aria-label'),'Products');await panel.hover('.module-tabs [data-module=products]');assert.equal(await panel.locator('#toolbox-appearance').getAttribute('aria-label'),'Switch to dark mode');await panel.click('#toolbox-appearance');assert.equal(await panel.locator('#toolbox-appearance').getAttribute('aria-label'),'Switch to light mode');
  await panel.emulateMedia({reducedMotion:'reduce'});await panel.click('.module-tabs [data-module=contacts]');assert.equal(await panel.evaluate(()=>document.getAnimations().length),0);
  const touchContext=await browser.newContext({viewport:{width:390,height:820},hasTouch:true});
  await touchContext.route('https://toolbox.test/panel',r=>r.fulfill({body:document,contentType:'text/html'}));
  const touch=await touchContext.newPage();touch.on('pageerror',e=>errors.push(e.message));await touch.goto('https://toolbox.test/panel');await touch.waitForSelector('#used-results .product-card');await touch.click('.module-tabs [data-module=powerbi]');
  await touch.selectOption('#powerbi-scope-mode','seller');
  assert(await touch.evaluate(()=>matchMedia('(pointer:coarse)').matches));
  assert(await touch.locator('#powerbi-salesperson').evaluate(e=>e.getBoundingClientRect().height>=44&&parseFloat(getComputedStyle(e).fontSize)>=16));
  await touchContext.close();
  const popup=await context.newPage();await popup.setViewportSize({width:520,height:600});await popup.goto('https://toolbox.test/popup');await popup.waitForSelector('#used-results .product-card');assert.equal(await popup.evaluate(()=>document.documentElement.scrollWidth),520);
  await p.click('[data-view=inventory]');await p.locator('[data-expand]').first().click();assert.equal(await p.locator('main>section:visible').count(),1);await p.click('#overview');assert.equal(await p.locator('main>section:visible').count(),4);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log('PASS complete GUI: 12 live demo views in light/dark modes with system preference, accessible text contrast and HS inheritance, '+density.ready.orders+' complete orders / '+density.nonreserved.nonreserved+' complete NR products initially visible at '+density.ready.width+'x'+density.ready.height+', exact seller refresh, three-country finances, contact parsing, CRM import, HS, margin/conversion, icon-only navigation with native tooltips/accessibility FR/EN, all modules at 320/390/520/900px, popup 520x600, FR/EN, reduced motion and no external calls');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
