#!/usr/bin/env python3
"""Verify recovered original archives and the Git references holding their sources."""
from pathlib import Path
import argparse, base64, gzip, hashlib, json, subprocess, sys, zipfile

ROOT=Path(__file__).resolve().parents[1]

def sha256(data): return hashlib.sha256(data).hexdigest()
def git(*args): return subprocess.check_output(['git','-C',str(ROOT),*args],stderr=subprocess.PIPE)

def resolve(ref):
    for candidate in ['refs/heads/'+ref,'refs/remotes/origin/'+ref,ref]:
        try:return git('rev-parse','--verify',candidate+'^{commit}').decode().strip()
        except subprocess.CalledProcessError:pass
    raise AssertionError('Git reference unavailable: '+ref+'; fetch all version branches first')

def verify_files(commit, expected, root):
    actual=set(git('ls-tree','-r','--name-only',commit,'--',root).decode().splitlines())
    wanted={p for p in expected if p.startswith(root+'/')}
    assert actual==wanted, f'{commit}: source paths differ: missing={wanted-actual}, extra={actual-wanted}'
    for path,data in expected.items():
        assert git('show',commit+':'+path)==data, f'{commit}:{path}: bytes differ'

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archives-only',action='store_true',help='Verify stored archives only, without Git or working-source comparisons')
    args=parser.parse_args()
    inventory=json.loads((ROOT/'docs/version-inventory.json').read_text())
    files_checked=0
    for s in inventory['snapshots']:
        p=ROOT/s['source_path'];stored=p.read_bytes()
        raw=gzip.decompress(stored) if p.suffix=='.gz' else stored
        assert sha256(raw)==s['source_sha256'],str(p)+': SHA-256 differs'
        assert len(raw)==s['source_bytes'],str(p)+': length differs'
        if s.get('stored_sha256'):assert sha256(stored)==s['stored_sha256']
        expected={}
        if s['kind']=='release-archive':
            with zipfile.ZipFile(p) as z:
                assert z.testzip() is None,str(p)+': ZIP checksum error'
                for name in z.namelist():
                    if name.endswith('/'):continue
                    prefix=s['source_prefix'];assert name.startswith(prefix)
                    path=s['source_root']+'/'+name[len(prefix):]
                    assert path not in expected,'Duplicate archive member: '+path
                    expected[path]=z.read(name)
                manifest=json.loads(expected[s['source_root']+'/manifest.json'])
                assert manifest['version']==s['version']
        else:
            checkpoint=json.loads(raw)
            assert checkpoint['baseRelease']==s['base_release']
            for f in checkpoint['files']:
                data=base64.b64decode(f['content'],validate=True) if f['encoding']=='base64' else f['content'].encode('utf-8')
                assert sha256(data)==f['sha256'],'Checkpoint hash differs: '+f['path']
                assert f['path'] not in expected,'Duplicate checkpoint path'
                expected[f['path']]=data
        assert len(expected)==s['source_file_count']
        if not args.archives_only:
            verify_files(resolve(s['git_ref']),expected,s['source_root'])
            files_checked+=len(expected)
        print('OK',s['git_ref'],len(expected),'files')
    imported=inventory.get('imported_archives',[])
    for entry in imported:
        path=ROOT/entry['source_path']; data=path.read_bytes()
        assert len(data)==entry['source_bytes'] and sha256(data)==entry['source_sha256'],str(path)+': size/hash differs'
        with zipfile.ZipFile(path) as z:
            assert z.testzip() is None,str(path)+': ZIP checksum error'
            names=z.namelist(); assert len(names)==len(set(names)),'Duplicate ZIP members'
            for name in names:
                parts=Path(name).parts
                assert not Path(name).is_absolute() and '..' not in parts and chr(92) not in name,'Unsafe ZIP path'
            manifests=[n for n in names if n=='manifest.json' or n.endswith('/manifest.json')]
            assert len(manifests)==1,'Ambiguous manifest'
            assert json.loads(z.read(manifests[0]))['version']==entry['version'],'Manifest version differs'
        print('OK imported original',entry['source_path'])
    if not args.archives_only:
        # Keep all historical comparisons above; follow main's actual manifest version.
        current_root='project/inside-sales-toolbox-team'
        commit=resolve('main')
        version=json.loads(git('show',commit+':'+current_root+'/manifest.json'))['version']
        candidates=[e for e in inventory['snapshots']+imported if e['edition']=='equipe' and e['version']==version and e['kind'] in ('release-archive','imported-original-archive')]
        assert len(candidates)==1,'Current version has no unique original archive'
        entry=candidates[0]
        with zipfile.ZipFile(ROOT/entry['source_path']) as z:
            prefix=entry.get('source_prefix','')
            expected={current_root+'/'+n[len(prefix):]:z.read(n) for n in z.namelist() if not n.endswith('/')}
        verify_files(commit,expected,current_root)
        actual={p.relative_to(ROOT).as_posix():p.read_bytes() for p in (ROOT/current_root).rglob('*') if p.is_file()}
        assert actual==expected,'Current working sources differ from original ZIP'
        print('OK current production source against original ZIP:',version,len(expected),'files')
    print('OK imported originals:',len(imported))
    print('PASS:',len(inventory['snapshots']),'snapshots;',files_checked,'source files compared')

if __name__=='__main__':
    try:main()
    except (AssertionError,KeyError,ValueError,OSError,subprocess.CalledProcessError) as exc:
        print('FAIL:',str(exc),file=sys.stderr);sys.exit(1)
