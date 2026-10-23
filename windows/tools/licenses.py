"""Bundle actual dependency notices, their source locations and the private JRE terms."""
import html
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[2]
runtime = root / 'windows/runtime'
dependencies = json.loads((root / 'windows/engine/dependencies.json').read_text())['dependencies']
parts = ['<!doctype html><html lang="de"><meta charset="utf-8">',
         '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'">',
         '<meta name="viewport" content="width=device-width,initial-scale=1">',
         '<title>Private Brain Pro · Lizenzen / Licenses</title>',
         '<style>body{font:16px system-ui;max-width:70rem;margin:2rem auto;padding:1rem}pre{white-space:pre-wrap;overflow-wrap:anywhere}summary{cursor:pointer;padding:1rem 0}code{overflow-wrap:anywhere}</style>',
         '<a href="../index.html">← Private Brain Pro</a><h1>Lizenzen / Licenses</h1>',
         '<p>Unveränderte Hinweise der Bibliotheken und der mitgelieferten Java-Laufzeit. Quellen und Prüfsummen stehen bei jedem Paket. / Original notices of the libraries and bundled Java runtime. Source locations and fingerprints are listed with each package.</p>']

def text(value):
    return html.escape(str(value), quote=True)

for dependency in dependencies:
    filename = f"{dependency['name']}-{dependency['version']}.jar"
    path = runtime / 'engine/lib' / filename
    if not path.is_file():
        raise SystemExit(f'Missing distribution dependency: {filename}')
    import hashlib
    if hashlib.sha256(path.read_bytes()).hexdigest() != dependency['sha256']:
        raise SystemExit(f'License input hash mismatch: {filename}')
    source = dependency['url'].removesuffix('.jar') + '-sources.jar'
    if dependency['name'] == 'pdfbox-app':
        source = f"https://repo.maven.apache.org/maven2/org/apache/pdfbox/pdfbox/{dependency['version']}/pdfbox-{dependency['version']}-sources.jar"
    parts.extend([f'<h2>{text(filename)}</h2><p>{text(dependency["license"])}</p>',
                  f'<p>Quellcode / Source: <code>{text(source)}</code></p>',
                  f'<p>SHA-256: <code>{text(dependency["sha256"])}</code></p>'])
    notices = []
    with zipfile.ZipFile(path) as archive:
        for name in archive.namelist():
            if name.lower() in ('meta-inf/license', 'meta-inf/license.md', 'meta-inf/license.txt', 'meta-inf/notice', 'meta-inf/notice.md', 'meta-inf/notice.txt'):
                notices.append((name, archive.read(name).decode('utf-8')))
    if not notices and dependency['license'] != 'Public Domain':
        raise SystemExit(f'Missing original license: {filename}')
    for name, value in notices:
        parts.append(f'<details><summary>{text(name)}</summary><pre>{text(value)}</pre></details>')

release = runtime / 'jre/release'
legal = runtime / 'jre/legal'
if not release.is_file() or not legal.is_dir():
    raise SystemExit('Missing private JRE release metadata or licenses')
parts.append('<h2>OpenJDK / Eclipse Temurin</h2><p>Quellcode / Source: <code>https://github.com/openjdk/jdk21u</code> · <code>https://github.com/adoptium/temurin21-binaries/releases</code></p>')
parts.append(f'<details><summary>Build / release</summary><pre>{text(release.read_text())}</pre></details>')
for path in sorted(legal.rglob('*')):
    if path.is_file():
        parts.append(f'<details><summary>{text(path.relative_to(runtime / "jre"))}</summary><pre>{text(path.read_text(encoding="utf-8"))}</pre></details>')
parts.append('</html>')
(runtime / 'windows-licenses.html').write_text('\n'.join(parts), encoding='utf-8')
print('Original library and bundled runtime notices prepared.')
