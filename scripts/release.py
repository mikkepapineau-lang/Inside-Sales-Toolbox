"""Préparer, vérifier et publier une archive immutable par édition."""
from pathlib import Path
from html.parser import HTMLParser
import argparse
import hashlib
import json
import os
import re
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
EDITIONS = {'equipe': ('project/inside-sales-toolbox-team', 'Equipe'), 'michael': ('project/inside-sales-toolbox-personal', 'Michael')}

class References(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('src', 'href') and value:
                self.refs.append(value)

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def source(edition):
    directory, label = EDITIONS[edition]
    app = ROOT / directory
    version = json.loads((app / 'manifest.json').read_text())['version']
    assert re.fullmatch(r'\d+\.\d+\.\d+(?:\.\d+)?', version), 'Version invalide'
    files = sorted(p for p in app.rglob('*') if p.is_file())
    assert files, 'Sources absentes'
    for path in files:
        assert not any(x.startswith('.') or x in ('node_modules', '__pycache__') for x in path.relative_to(app).parts), 'Fichier temporaire dans les sources'
    for page in app.rglob('*.html'):
        parser = References(); parser.feed(page.read_text())
        for ref in parser.refs:
            if ref.startswith(('#', 'http:', 'https:', 'data:', 'mailto:')):
                continue
            assert (page.parent / ref.split('#')[0].split('?')[0]).is_file(), f'Référence absente : {page} {ref}'
    return app, files, version, label

def verify(meta):
    app, files, version, _ = source(meta['edition'])
    assert version == meta['version'], 'Manifest différent de la publication'
    archive = ROOT / meta['archive']
    assert digest(archive) == meta['sha256'], 'Empreinte différente'
    assert (ROOT / meta['notes']).is_file(), 'Notes de version absentes'
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None, 'CRC du ZIP invalide'
        names = [p.relative_to(app).as_posix() for p in files]
        assert len(z.namelist()) == len(set(z.namelist())), 'Membres ZIP dupliqués'
        assert set(z.namelist()) == set(names), 'Liste des fichiers du ZIP différente'
        for path, name in zip(files, names):
            assert z.read(name) == path.read_bytes(), 'Source différente : ' + name
    return archive

def prepare(edition):
    app, files, version, label = source(edition)
    archive = ROOT / 'downloads' / f'Inside-Sales-Toolbox-{label}-v{version}.zip'
    notes = ROOT / 'docs/releases' / f'{edition}-{version}.md'
    assert notes.is_file(), f'Écrire les notes avant de publier : {notes}'
    archive.parent.mkdir(exist_ok=True)
    if not archive.exists():
        with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
            for path in files:
                info = zipfile.ZipInfo(path.relative_to(app).as_posix(), (1980, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED; info.external_attr = 0o100644 << 16
                z.writestr(info, path.read_bytes())
    meta = {'schema_version': 1, 'edition': edition, 'version': version,
            'archive': archive.relative_to(ROOT).as_posix(), 'sha256': digest(archive),
            'notes': notes.relative_to(ROOT).as_posix(), 'prerelease': True}
    verify(meta)
    destination = ROOT / '.release' / (edition + '.json')
    destination.parent.mkdir(exist_ok=True)
    destination.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n')
    return meta

def gh(*args, **kwargs):
    return subprocess.run(['gh', *args], cwd=ROOT, check=True, text=True, **kwargs)

def publish(meta):
    archive = verify(meta)
    tag = meta['edition'] + '-v' + meta['version']
    checksum = archive.with_suffix('.zip.sha256')
    checksum.write_text(meta['sha256'] + '  ' + archive.name + '\n')
    existing = subprocess.run(['gh', 'release', 'view', tag, '--json', 'tagName'], cwd=ROOT, capture_output=True, text=True)
    if existing.returncode == 0:
        with tempfile.TemporaryDirectory() as d:
            gh('release', 'download', tag, '--pattern', archive.name, '--dir', d)
            assert digest(Path(d) / archive.name) == meta['sha256'], 'Publication existante différente; refus de remplacer'
        print('Publication existante identique : ' + tag)
        return
    # Un tag existant ne doit jamais désigner d'autres sources.
    ref = subprocess.run(['git', 'rev-parse', '--verify', 'refs/tags/' + tag], cwd=ROOT, capture_output=True)
    if ref.returncode == 0:
        subprocess.run(['git', 'diff', '--exit-code', tag, 'HEAD', '--', EDITIONS[meta['edition']][0]], cwd=ROOT, check=True)
    args = ['release', 'create', tag, str(archive), str(checksum), '--target', os.environ['GITHUB_SHA'],
            '--title', f"Inside Sales Toolbox {EDITIONS[meta['edition']][1]} v{meta['version']}",
            '--notes-file', str(ROOT / meta['notes'])]
    if meta.get('prerelease', True):
        args.append('--prerelease')
    gh(*args)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--edition', choices=EDITIONS, default='equipe')
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument('--prepare', action='store_true')
    action.add_argument('--check', action='store_true')
    action.add_argument('--publish', action='store_true')
    args = parser.parse_args()
    meta = prepare(args.edition) if args.prepare else json.loads((ROOT / '.release' / (args.edition + '.json')).read_text())
    verify(meta)
    if args.publish:
        publish(meta)
    print(json.dumps(meta, ensure_ascii=False))

if __name__ == '__main__':
    main()
