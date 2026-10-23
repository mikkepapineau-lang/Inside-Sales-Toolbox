"""Contrôles du noyau; aucune connexion D365 ou Power BI n'est simulée comme validation live."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
TESTS = (
    'window-sessions', 'appearance', 'pricing-model', 'pricing-rate', 'order-custom-scrollbar', 'order-horizontal-reader',
    'ready-report-routing', 'order-notes-report', 'order-notes', 'workspace',
    'used-reader', 'used-financial-horizontal', 'used-regions', 'used-regional-prices', 'used-prices-worker', 'used-native-export', 'used-country-catalogue', 'used-country-worker', 'used-embedded-frames', 'used-regional-worker', 'used-subregion-reader',
    'ready-scope', 'ready-seller-worker', 'nonreserved-catalogue', 'nonreserved-worker',
)

def main():
    app = ROOT / 'project/inside-sales-toolbox-team'
    scripts = sorted(app.rglob('*.js'))
    for path in scripts:
        result = subprocess.run(['node', '--input-type=module', '--check'], input=path.read_text(), text=True, capture_output=True)
        if result.returncode:
            raise SystemExit(str(path.relative_to(ROOT)) + '\n' + result.stderr)
    print(f'OK syntaxe : {len(scripts)} scripts', flush=True)
    for name in TESTS:
        subprocess.run(['node', str(ROOT / 'checks' / (name + '.test.cjs'))], cwd=ROOT, check=True)
    print(f'PASS : syntaxe et {len(TESTS)} suites du noyau. Essais dans les applications connectées distincts.')

if __name__ == '__main__':
    main()
