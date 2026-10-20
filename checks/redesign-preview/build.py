"""Embed the actual extension UI with local demo adapters, never production data."""
import base64
import html
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / 'project/inside-sales-toolbox-team'
DEST = Path('/workspace/toolbox-order-contacts-preview.html' if '--orders' in sys.argv else '/workspace/toolbox-used-preview.html')

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
    doc = re.sub(r'<script[^>]*src="popup.js"[^>]*></script>', lambda _: script(adapter + '\n' + core + '\n' + code), doc)
    assert not re.search(r'\bfetch\s*\(', doc)
    return doc

doc = read(APP / 'sidepanel.html')
doc = re.sub(r'<link[^>]+href="([^"]+)"[^>]*>', lambda m: '<style>' + css(APP / m[1]) + '</style>', doc)
doc = re.sub(r'(<img\b[^>]*\bsrc=")([^"]+)(")', lambda m: m[1] + uri(APP / m[2]) + m[3], doc)
hs = {lang: hs_document(lang) for lang in ['fr', 'en']}
demo = read(ROOT / 'checks/redesign-preview/demo.js')
if '--orders' in sys.argv:
    demo = demo.replace("module:'used',at:now", "module:'powerbi',at:now")
if '--prospect' in sys.argv:
    demo = demo.replace("module:'used',at:now", "module:'bridge',at:now").replace("uiStep:'lead'", "uiStep:'prospect'")
if '--quote' in sys.argv:
    demo = demo.replace("module:'used',at:now", "module:'bridge',at:now").replace("uiStep:'lead'", "uiStep:'quote'")
if '--contacts' in sys.argv:
    demo = demo.replace("module:'used',at:now", "module:'contacts',at:now").replace("uiStep:'lead'", "uiStep:'quote'")
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
if '--document-only' in sys.argv:
    print('Actual UI document rebuilt for script checks; published preview unchanged.')
    raise SystemExit(0)
fragment = read(ROOT / 'checks/redesign-preview/order-contacts-preview.html') if '--orders' in sys.argv else read(DEST)
if 'TOOLBOX_DOCUMENT' in fragment:
    fragment = fragment.replace('TOOLBOX_DOCUMENT', html.escape(doc, quote=True))
else:
    fragment = re.sub(r'(\bsrcdoc=")[^"]*(")', lambda m: m[1] + html.escape(doc, quote=True) + m[2], fragment)
DEST.write_text(fragment, encoding='utf-8')
assert DEST.stat().st_size < 1_000_000
print(f'Interactive preview: {DEST.stat().st_size:,} bytes; actual UI, local fixtures, no network calls.')
