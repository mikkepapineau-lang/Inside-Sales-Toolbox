"""Embed the actual extension UI with local demo adapters, never production data."""
import base64
import html
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / 'project/inside-sales-toolbox-team'
DEST = Path('/workspace/toolbox-nonreserved-preview.html' if '--nonreserved' in sys.argv else '/workspace/toolbox-used-preview.html')

def read(path):
    return path.read_text(encoding='utf-8')

def script(code):
    return '<script>' + re.sub(r'</script', r'<\\/script', code, flags=re.I) + '</script>'

def uri(path):
    mime = 'image/svg+xml' if path.suffix == '.svg' else 'image/png'
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()

def css(path):
    return re.sub(r"url\(['\"]?([^)'\"]+)['\"]?\)", lambda m: 'url("' + uri(path.parent / m[1]) + '")', read(path))

def hs_document(language):
    doc = read(APP / 'hs/popup.html')
    doc = re.sub(r'<link[^>]+href="([^"]+)"[^>]*>', lambda m: '<style>' + css(APP / 'hs' / m[1]) + '</style>', doc)
    core = read(APP / 'hs/core.js').replace('export ', '')
    code = re.sub(r'^import[^\n]+\n', '', read(APP / 'hs/popup.js'))
    refresh = """async function refresh(){if(fetching)return;fetching=true;$('refresh').disabled=true;render();await new Promise(r=>setTimeout(r,350));fetching=false;$('refresh').disabled=false;render();}\n"""
    code = re.sub(r'async function refresh\(\)\{.*?(?=\$\(\x27code\x27\)\.addEventListener)', lambda _: refresh, code, flags=re.S)
    sample = {'rows': [
        {'code': '9405.42.10', 'digits': '94054210', 'rate': 25, 'description': 'Appareil d’éclairage · exemple de démonstration', 'heading': 'Appareils d’éclairage · données fictives'},
        {'code': '9405.42.90', 'digits': '94054290', 'rate': 25, 'description': 'Autre appareil d’éclairage · exemple de démonstration', 'heading': 'Appareils d’éclairage · données fictives'}
    ], 'start': '0000-01-01', 'end': '9999-12-31', 'period': 'Démonstration visuelle seulement', 'updated': ''}
    init = "async function init(){language=" + json.dumps(language) + ";data=" + json.dumps(sample, ensure_ascii=False) + ";data.fetchedAt=new Date().toISOString();bundled=false;$('code').value='9405.42.10';$('origin').value='us';localize();render();$('source').href='#';$('source').onclick=e=>e.preventDefault();}\n"
    code = re.sub(r'async function init\(\)\{.*?(?=const labels=)', lambda _: init, code, flags=re.S)
    code = code.replace('Source synchronisée avec Canada.ca.', 'Données de démonstration.').replace('Source synchronized with Canada.ca.', 'Demo data.').replace('taux publié', 'taux de démonstration').replace('published rate', 'demo rate')
    adapter = 'globalThis.chrome={storage:{local:{set:async()=>{}},onChanged:{addListener(){}}}};'
    doc = re.sub(r'<script[^>]*src="\.\./motion.js"[^>]*></script>', lambda _: script(read(APP / 'motion.js')), doc)
    doc = re.sub(r'<script[^>]*src="\.\./appearance.js"[^>]*></script>', lambda _: script(read(APP / 'appearance.js')), doc)
    doc = re.sub(r'<script[^>]*src="popup.js"[^>]*></script>', lambda _: script(adapter + '\n' + core + '\n' + code), doc)
    assert not re.search(r'\bfetch\s*\(', doc)
    return doc

doc = read(APP / 'sidepanel.html')
doc = re.sub(r'<script src="instances.js"></script><script src="instance-ui.js" data-toolbox-scripts="([^"]+)"></script>', lambda m: ''.join('<script src="'+name+'"></script>' for name in m[1].split(',')), doc)
doc = re.sub(r'<link[^>]+href="([^"]+)"[^>]*>', lambda m: '<style>' + css(APP / m[1]) + '</style>', doc)
doc = re.sub(r'(<img\b[^>]*\bsrc=")([^"]+)(")', lambda m: m[1] + uri(APP / m[2]) + m[3], doc)
hs = {lang: hs_document(lang) for lang in ['fr', 'en']}
demo = read(ROOT / 'checks/redesign-preview/demo.js').replace("version:'3.5.6'", 'version:'+json.dumps(json.loads(read(APP / 'manifest.json'))['version']))
if '--overhaul' in sys.argv:
    demo = 'globalThis.__demoNonReserved=true;globalThis.__demoOverhaul=true;\n' + demo
if '--nonreserved' in sys.argv:
    demo = "globalThis.__demoNonReserved=true;\n" + demo.replace("module:globalThis.__demoStart||'used',at:now", "module:'nonreserved',at:now")
if '--prospect' in sys.argv:
    demo = demo.replace("module:globalThis.__demoStart||'used',at:now", "module:'bridge',at:now").replace("uiStep:globalThis.__demoStep||'lead'", "uiStep:'prospect'")
if '--quote' in sys.argv:
    demo = demo.replace("module:globalThis.__demoStart||'used',at:now", "module:'bridge',at:now").replace("uiStep:globalThis.__demoStep||'lead'", "uiStep:'quote'")
if '--contacts' in sys.argv:
    demo = demo.replace("module:globalThis.__demoStart||'used',at:now", "module:'contacts',at:now").replace("uiStep:globalThis.__demoStep||'lead'", "uiStep:'quote'")
    doc = doc.replace('<details id="quote-contact-preview" class="report-card">', '<details id="quote-contact-preview" class="report-card" open>')
adapter = script('globalThis.__demoHS=' + json.dumps(hs, ensure_ascii=False) + ';\n' + demo)

def inline_script(match):
    name = match[1]
    if name == 'sidepanel.js':
        return ''
    code = read(APP / name).replace('navigator.clipboard.writeText(', 'globalThis.__demoCopy(')
    if name == 'toolbox.js':
        code = code.replace("el('hs-frame').src", "el('hs-frame').srcdoc").replace("'hs/popup.html'", "globalThis.__demoHS[document.documentElement.lang==='en-CA'?'en':'fr']")
    return script(code)

first = doc.index('<script src=')
doc = doc[:first] + adapter + doc[first:]
doc = re.sub(r'<script\b[^>]*\bsrc="([^"]+)"[^>]*></script>', inline_script, doc)
doc = doc.replace('</head>', '<style>#open-sidepanel{display:none!important}#demo-toast{position:fixed;z-index:100;bottom:14px;left:14px;right:14px;padding:12px 15px;border:1px solid #dacbe9;border-radius:9px;background:#2e1b5a;color:white;font:12px/1.5 system-ui;box-shadow:0 5px 25px #21182e24;pointer-events:none}</style></head>')
assert not re.search(r'\b(fetch|XMLHttpRequest|WebSocket)\s*\(', doc)
assert not re.search(r'<(?:script|link)\b[^>]+(?:src|href)=', doc)
(ROOT / 'checks/redesign-preview/preview-document.html').write_text(doc, encoding='utf-8')
if '--overhaul' in sys.argv:
    target = Path('/workspace/toolbox-overhaul-preview.html')
    payload = json.dumps(doc, ensure_ascii=False).replace('</', '<\\/')
    target.write_text(read(ROOT / 'checks/redesign-preview/overhaul.html').replace('__TOOLBOX_DOCUMENT__', payload), encoding='utf-8')
    assert target.stat().st_size < 1_200_000
    print(f'Complete interactive preview: {target}; actual UI, 12 views, fictional data, no external calls.')
    raise SystemExit(0)
if '--document-only' in sys.argv:
    print('Actual UI document rebuilt for script checks; published preview unchanged.')
    raise SystemExit(0)
fragment = read(DEST) if DEST.exists() and '--nonreserved' not in sys.argv else '''<!doctype html><html lang="fr-CA"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Toolbox · Aperçu interactif</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f1f8;color:#2e1b5a;font-family:system-ui,sans-serif}main{max-width:1120px;margin:auto;display:grid;grid-template-columns:1fr 440px;gap:56px;padding:32px;align-items:start}aside{padding-top:56px}small{font-weight:700;letter-spacing:.08em}h1{font-size:36px;line-height:1.15;margin:20px 0}p,li{font-size:16px;line-height:1.7}li{margin:12px 0}iframe{width:440px;height:calc(100vh - 64px);min-height:660px;border:1px solid #ddd1ec;border-radius:14px;box-shadow:0 12px 40px #28163f18;background:white}button{background:#2e1b5a;color:white;border:0;border-radius:8px;padding:12px 16px;font:600 14px system-ui;cursor:pointer}footer{font-size:13px;line-height:1.6;color:#78658b;margin-top:28px}@media(max-width:800px){main{display:block;padding:16px}aside{padding:0 0 24px}h1{font-size:28px}iframe{width:100%;height:85vh}li{margin:6px 0}}</style><main><aside><small>APERÇU INTERACTIF · DONNÉES FICTIVES</small><h1>Recherche de produits</h1><p>Neuf, usagé et non réservé dans la même interface.</p><ul><li>Change les onglets et essaie les filtres.</li><li>Les fiches regroupent les lignes par produit et conservent chaque entrepôt.</li><li>Déplie les détails pour voir les colonnes du fichier.</li></ul><button onclick="document.querySelector('iframe').contentDocument.querySelector('#nonreserved-results').scrollIntoView({block:'center',behavior:'smooth'})">Voir les produits non réservés ↓</button><footer>Interface du code en développement. Données entièrement fictives. Les actions Power BI sont simulées et ne lancent aucun export réel. Le bloc d’actualisation se trouve tout en bas.</footer></aside><iframe title="Interface Toolbox de démonstration" srcdoc="TOOLBOX_DOCUMENT"></iframe></main></html>'''
if '--nonreserved' in sys.argv:
    fragment = fragment.replace('max-width:1120px', 'max-width:1400px').replace('grid-template-columns:1fr 440px', 'grid-template-columns:minmax(220px,1fr) 390px 390px').replace('gap:56px', 'gap:28px').replace('width:440px', 'width:390px').replace('padding-top:56px', 'padding-top:24px').replace('max-width:800px', 'max-width:1100px')
    fragment = fragment.replace('<h1>Recherche de produits</h1>', '<h1>Plus de produits à l’écran.</h1>').replace('Neuf, usagé et non réservé dans la même interface.', 'Fiches compactes, filtres repliés et inventaire par entrepôt.').replace('Change les onglets et essaie les filtres.', 'Change les onglets ou ouvre les filtres au besoin.').replace('Déplie les détails pour voir les colonnes du fichier.', 'Dans Commandes prêtes, choisis Sales Rep Name avant de relire le rapport.')
    fragment = fragment.replace('<iframe title="Interface Toolbox de démonstration" srcdoc="TOOLBOX_DOCUMENT"></iframe>', '<section><small>PRODUITS · NON RÉSERVÉ</small><iframe title="Produits non réservés" srcdoc="TOOLBOX_DOCUMENT"></iframe></section><section><small>COMMANDES PRÊTES</small><iframe title="Commandes prêtes" srcdoc="READY_DOCUMENT"></iframe></section>')
    ready = doc.replace("module:'nonreserved',at:now", "module:'powerbi',at:now").replace('globalThis.__demoNonReserved=true;', "globalThis.__demoNonReserved=true;globalThis.__demoInstance='preview-orders';globalThis.__demoResponsible='ALEX MARTIN';", 1)
    fragment = fragment.replace('READY_DOCUMENT', html.escape(ready, quote=True))
if 'TOOLBOX_DOCUMENT' in fragment:
    fragment = fragment.replace('TOOLBOX_DOCUMENT', html.escape(doc, quote=True))
else:
    fragment = re.sub(r'(\bsrcdoc=")[^"]*(")', lambda m: m[1] + html.escape(doc, quote=True) + m[2], fragment)
DEST.write_text(fragment, encoding='utf-8')
assert DEST.stat().st_size < (2_000_000 if '--nonreserved' in sys.argv else 1_000_000)
print(f'Interactive preview: {DEST.stat().st_size:,} bytes; actual UI, local fixtures, no network calls.')
