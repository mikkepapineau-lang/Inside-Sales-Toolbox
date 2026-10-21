"""Publier uniquement les métadonnées modifiées par cette livraison."""
from pathlib import Path
import os
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
if os.environ.get('GITHUB_EVENT_NAME') == 'workflow_dispatch':
    editions = [os.environ.get('REQUESTED_EDITION') or 'equipe']
else:
    before = os.environ.get('BEFORE', '')
    if not before or set(before) == {'0'}:
        raise SystemExit('Référence précédente absente; utiliser le lancement manuel explicite.')
    paths = subprocess.check_output(['git', 'diff', '--name-only', before, os.environ['GITHUB_SHA'], '--', '.release/'], text=True, cwd=root).splitlines()
    editions = [edition for edition in ('equipe', 'michael') if '.release/' + edition + '.json' in paths]
for edition in editions:
    if edition not in ('equipe', 'michael'):
        raise SystemExit('Édition inconnue')
    subprocess.run([sys.executable, str(root / 'scripts/release.py'), '--edition', edition, '--publish'], cwd=root, check=True)
