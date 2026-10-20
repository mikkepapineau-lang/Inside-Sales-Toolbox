const assert=require('node:assert/strict'),{context:c,root,doc,get,click,ready}=require('./redesign-preview/runtime.cjs');
const numeric=id=>c.ToolboxPricing.parse(get(id).tagName==='INPUT'?get(id).value:get(id).textContent);
const input=(id,value)=>{get(id).value=value;get(id).oninput();};
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{await ready;
 await click(root.querySelector('.module-tabs [data-module=calculator]'));assert.equal(doc.body.dataset.module,'calculator');assert.equal(get('pricing-price').readOnly,true);assert.equal(numeric('pricing-price'),373.63);assert.equal(numeric('pricing-total'),429.58);
 await click(get('pricing-lock-price'));assert.equal(get('pricing-lock-price').getAttribute('aria-pressed'),'false');assert(get('pricing-status').textContent.includes('Déverrouille'));
 await click(get('pricing-lock-margin'));assert.equal(get('pricing-price').readOnly,false);assert.equal(numeric('pricing-price'),373.625);await click(get('pricing-lock-price'));assert.equal(get('pricing-margin').readOnly,true);
 input('pricing-price','400');assert.equal(numeric('pricing-margin'),25.28);assert.equal(get('pricing-lock-cost').getAttribute('aria-pressed'),'true');
 input('pricing-cost','oops');assert.equal(get('pricing-margin').value,'');assert.equal(get('pricing-total').textContent,'···');assert.equal(get('pricing-cost').getAttribute('aria-invalid'),'true');
 input('pricing-cost','100');input('pricing-price','200');assert.equal(numeric('pricing-margin'),50);
 const saved=(await c.chrome.storage.local.get('toolboxPricing')).toolboxPricing;assert.equal(saved.values.cost,'100');assert(saved.locked.includes('cost'));assert(saved.locked.includes('price'));
 await click(get('calculator-tab-conversion'));assert.equal(get('calculator-conversion').hidden,false);assert.equal(get('calculator-margin').hidden,true);assert.equal(numeric('conversion-result'),140);
 input('conversion-amount','140');get('conversion-from').value='CAD';get('conversion-from').onchange();get('conversion-to').value='USD';get('conversion-to').onchange();assert.equal(numeric('conversion-result'),100);
 await click(get('conversion-swap'));assert.equal(get('conversion-from').value,'USD');assert.equal(get('conversion-to').value,'CAD');assert.equal(numeric('conversion-result'),196);
 input('conversion-amount','-1');assert.equal(get('conversion-result').value,'');assert.equal(get('conversion-status').dataset.state,'error');
 await click(get('conversion-clear'));assert.equal(get('conversion-amount').value,'');
 await click(root.querySelector('[data-ui-language=en]'));assert.equal(get('calculator-tab-margin').textContent,'Margin');assert.equal(get('pricing-field-cost').querySelector('label').textContent,'Cost');
 await click(root.querySelector('[data-ui-language=fr]'));
 // Product family: same data and filters, one primary entry, independent scroll panels.
 await click(get('products-tab-new'));const product=get('product-results').textContent,used=get('used-results').textContent;assert.equal(root.querySelector('.module-tabs [data-module=used]'),null);
 await click(root.querySelector('.module-tabs [data-module=products]'));assert.equal(get('tool-products').hidden,false);assert.equal(get('products-new-panel').hidden,false);assert.equal(get('tool-used').hidden,true);
 await click(get('products-tab-used'));assert.equal(doc.body.dataset.module,'products');assert.equal(get('tool-used').hidden,false);assert.equal(get('products-new-panel').hidden,true);assert.equal(get('products-tab-used').getAttribute('aria-selected'),'true');
 get('used-query').value='SM58';get('used-query').oninput();const filtered=get('used-results').textContent;
 await click(root.querySelector('.module-tabs [data-module=calculator]'));await click(root.querySelector('.module-tabs [data-module=products]'));assert.equal(get('tool-used').hidden,false);assert.equal(get('used-results').textContent,filtered);
 // The legacy Used selection restores inside Products; a D365 context search explicitly selects New.
 await c.chrome.storage.session.set({toolboxNavigation:{module:'used',at:Date.now()}});assert.equal(get('tool-used').hidden,false);assert.equal(root.querySelector('.module-tabs [data-module=products]').getAttribute('aria-current'),'page');
 await c.ToolboxNavigation.remember('products');assert.equal(get('products-new-panel').hidden,false);assert.equal(get('tool-used').hidden,true);assert.equal(get('product-results').textContent,product);assert(used.includes('NBV'));
 // Keyboard activation follows the product tab roles.
 let prevented=false;for(const f of get('products-tab-new').events.keydown)f({key:'ArrowRight',preventDefault(){prevented=true;}});assert(prevented);assert.equal(get('tool-used').hidden,false);assert.equal(doc.activeElement.id,'products-tab-used');
 await click(root.querySelector('.module-tabs [data-module=calculator]'));await click(get('calculator-tab-margin'));assert.equal(numeric('pricing-margin'),50);
 console.log('PASS calculator inputs, lock limit and handoff, invalid-result clearing, local persistence, conversion and swap, FR/EN, grouped New/Used navigation, preserved filters and legacy/context selection');
})().catch(e=>{console.error(e);process.exitCode=1;});
