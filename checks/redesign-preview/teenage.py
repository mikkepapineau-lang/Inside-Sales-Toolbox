"""Generate an isolated visual study from the real UI and fictional adapters."""
import json
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(HERE / 'build.py'), '--overhaul'], cwd=ROOT, check=True, capture_output=True)
doc = (HERE / 'preview-document.html').read_text()
style = '<style data-preview-material="industrial">' + (HERE / 'teenage.css').read_text() + '</style>'
# Keep the embedded HS view consistent without changing any production file.
match = re.search(r'globalThis.__demoHS=(\{[^\n]+\});\n', doc)
assert match
hs = json.loads(match[1])
for language, page in hs.items():
    hs[language] = page.replace('</head>', style + '</head>', 1)
encoded = json.dumps(hs, ensure_ascii=False).replace('</script', '<\\/script')
doc = doc[:match.start(1)] + encoded + doc[match.end(1):]
doc, count = re.subn(r'</head>(\s*<body class="toolbox-app")', lambda m: style + '</head>' + m[1], doc)
assert count == 1

template = (HERE / 'overhaul.html').read_text()
template = template.replace('Liquid Glass · Clair & sombre', 'Teenage Engineering · Étude visuelle')
template = template.replace('Interface réelle du code en développement · Chaque panneau est interactif.', 'Exploration visuelle · Branche isolée · Quatre vues interactives.')
template = re.sub(r'<nav aria-label="Parcours de démonstration">.*?</nav>', '<nav aria-label="Parcours de démonstration"><button type="button" data-view="study" aria-pressed="true">Étude 01</button></nav>', template, count=1)
template = re.sub(r'const views=\{.*?\n\};', "const views={study:[['01 / Inventaire usagé','used'],['02 / Commandes prêtes','powerbi'],['03 / Calculateur','calculator'],['04 / Accueil','home']]};", template, count=1, flags=re.S)
template = template.replace("show('inventory');", "show('study');")
outer = '''<style>
html,body{background:#d3d4ca;color:#282c23;font-family:Arial,sans-serif}
header,.preview-note{background:#e4e5db;border-color:#b6b9ac;color:#54594d}header{border-top:4px solid #ee692b}
h1{font-weight:800;letter-spacing:-.5px}h1 span{font:10px/1.5 monospace;text-transform:uppercase;color:#54594d}
.preview-note,.preview-note strong,.preview-heading{font:10px/1.5 monospace;color:#505749;letter-spacing:.2px}
button,#preview-appearance,.preview-heading button{border-radius:2px;border-color:#b3b7a8;background:#eceee3;color:#303a26;font-family:monospace}
nav button[aria-pressed=true]{background:#ee692b;border-color:#c75925;color:#242b1e}
iframe{border:1px solid #aeb3a2;border-radius:4px;box-shadow:0 4px 10px #242e1812;background:#e5e5dd}
html[data-appearance=dark],html[data-appearance=dark] body{background:#21251e;color:#e1e5d6}
html[data-appearance=dark] header,html[data-appearance=dark] .preview-note{background:#2e3429;border-color:#606957}
html[data-appearance=dark] h1{color:#e1e5d6}
html[data-appearance=dark] h1 span,html[data-appearance=dark] .preview-note,html[data-appearance=dark] .preview-note strong,html[data-appearance=dark] .preview-heading{color:#bdc5af}
html[data-appearance=dark] button,html[data-appearance=dark] #preview-appearance{background:#3b4333;border-color:#606e53;color:#e0e8d3}
html[data-appearance=dark] nav button[aria-pressed=true]{background:#ef8248;color:#252e1d}
html[data-appearance=dark] iframe{background:#272a25;border-color:#65715b;box-shadow:none}
</style>'''
template = template.replace('</head>', outer + '</head>', 1)
payload = json.dumps(doc, ensure_ascii=False).replace('</', '<\\/')
target = Path('/workspace/toolbox-teenage-engineering-preview.html')
target.write_text(template.replace('__TOOLBOX_DOCUMENT__', payload))
assert target.stat().st_size < 1_200_000
print(f'Industrial visual study: {target}; four actual UI views, fictional data, preview-only CSS.')
