// Guard the three opening contexts before any business script or storage restoration.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root='project/inside-sales-toolbox-team/',source=fs.readFileSync(root+'view-mode.js','utf8'),css=fs.readFileSync(root+'popup.css','utf8');
const read=name=>fs.readFileSync(root+name,'utf8');
function boot(html,search=''){
 const view=html.match(/<html\b[^>]*data-toolbox-view="([^"]+)"/)[1],document={documentElement:{dataset:{toolboxView:view}}};
 vm.runInNewContext(source,{document,location:{search},URLSearchParams});return document.documentElement.dataset.toolboxView;
}
const popup=read('popup.html'),panel=read('sidepanel.html');
assert.equal(boot(popup),'popup');assert.equal(boot(popup,'?toolboxWindow=1'),'window');assert.equal(boot(panel),'panel');assert.equal(boot(panel,'?toolboxWindow=1'),'panel');
for(const html of [popup,panel]){
 const bootstrap=html.indexOf('<script src="view-mode.js"></script>'),firstStyle=html.indexOf('<link rel="stylesheet"');assert(bootstrap>0&&bootstrap<firstStyle);assert(bootstrap<html.indexOf('<body'));
}
const rules=Object.fromEntries([...css.matchAll(/([^{}]+)\{([^{}]+)\}/g)].filter(m=>!m[1].trim().startsWith('@')).map(m=>[m[1].trim(),Object.fromEntries([...m[2].matchAll(/([\w-]+)\s*:\s*([^;]+)/g)].map(a=>[a[1],a[2].trim()]))]));
// Select by its literal selector, independent of comments preceding it.
const fixedRule=Object.entries(rules).find(([s])=>s.endsWith('html[data-toolbox-view=popup]'))[1],htmlRule=rules.html,bodyRule=rules['body.toolbox-app'];
assert.equal(fixedRule.width,'520px');assert.equal(fixedRule['min-width'],'520px');assert.equal(fixedRule.height,'600px');
assert.equal(bodyRule.width,'100%');assert.equal(bodyRule.height,'100%');assert.equal(htmlRule.width,'100%');assert.equal(htmlRule['min-width'],'0');assert.equal(bodyRule['min-width'],'0');assert(!/\b100vw\b/.test(css));
assert(popup.replace('data-toolbox-view="popup"','data-toolbox-view="panel"').replace('class="toolbox-app"','class="toolbox-app toolbox-sidepanel"')===panel);
console.log('PASS opening-mode bootstrap before CSS, fixed 520×600 popup independent of initial viewport, fluid panel/window, no viewport width cap and equivalent UI documents');
