"""Package an already published installer unchanged; never build or sign an app."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--downloads', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--tag', required=True)
parser.add_argument('--source', required=True)
args = parser.parse_args()
match = re.fullmatch(r'windows-v(\d+\.\d+\.\d+-preview\.\d+)', args.tag)
if not match or not re.fullmatch(r'[a-f0-9]{40}', args.source):
    raise ValueError('Expected a fixed Windows preview tag and full source SHA.')
version = match.group(1)
repo = Path(__file__).resolve().parents[2]

def git(*fields):
    return subprocess.check_output(['git', *fields], cwd=repo)

if git('rev-parse', args.tag + '^{commit}').decode().strip() != args.source:
    raise ValueError('Published tag does not identify the expected source.')

def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

installer = f'Private-Brain-Pro-Windows-{version}-x64-setup.exe'
expected_files = {installer, 'windows-build.json', 'shared-source.json'}
seen = set()
for line in (args.downloads / 'SHA256SUMS').read_text().splitlines():
    expected, name = line.split('  ', 1)
    if name not in expected_files or name in seen or not re.fullmatch(r'[a-f0-9]{64}', expected):
        raise ValueError('Unexpected checksum entry.')
    if digest(args.downloads / name) != expected:
        raise ValueError('Downloaded checksum mismatch: ' + name)
    seen.add(name)
if seen != expected_files:
    raise ValueError('Incomplete release checksums.')
build = json.loads((args.downloads / 'windows-build.json').read_text())
if not (build['version'] == version and build['sourceCommit'] == args.source
        and build['architecture'] == 'x64' and build['signing'] == 'unsigned'
        and build['testEndpoint'] is False and build['installer'] == installer
        and build['sha256'] == digest(args.downloads / installer)
        and build['size'] == (args.downloads / installer).stat().st_size
        and re.fullmatch(r'[0-9]+', str(build['acceptanceRun']))
        and int(build['acceptanceRun']) > 0):
    raise ValueError('The published build receipt does not match this installer.')

args.output.mkdir(parents=True, exist_ok=False)
folder_name = f'Private-Brain-Pro-Windows-{version}'
folder = args.output / folder_name
folder.mkdir()
for name in sorted(expected_files):
    shutil.copyfile(args.downloads / name, folder / name)
shutil.copyfile(args.downloads / 'SHA256SUMS', folder / 'WINDOWS-ORIGINAL-SHA256SUMS')
for source_name, target in [('LICENSE', 'LICENSE.txt'), ('RECHTE.md', 'RECHTE.md')]:
    (folder / target).write_bytes(git('show', args.source + ':' + source_name))
handoff = git('show', args.source + ':docs/GESCHENKPAKET-WINDOWS.md').decode('utf-8').replace(
    'Die Links werden durch den beauftragten manuellen Windows-Release bereitgestellt.',
    'Der Windows-Release ist veröffentlicht; die öffentlichen Downloads wurden geprüft.')
handoff = '**Veröffentlicht und geprüft. Übergabe an Claude Code für das Geschenkpaket.**\n\n' + handoff
base = 'https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/' + args.tag
zip_name = folder_name + '-Geschenkpaket.zip'
handoff += f'''

## Tatsächlich veröffentlichter Download

Version: `{version}`. Tag: `{args.tag}`. Quelle: `{args.source}`.
Windows-Abnahme: `{build['acceptanceRun']}`.
Installer-SHA-256: `{build['sha256']}` ({build['size']} Bytes).

Der öffentliche Installer wurde erneut heruntergeladen und gegen die Prüfsummen
und den Baubeleg geprüft. Das Geschenkpaket enthält dieselbe unveränderte Exe,
Anleitung, Lizenzen und Belege. Keine persönlichen Daten oder Konten von Klaus.

- [Geschenkpaket (ZIP)]({base}/{zip_name})
- [Prüfsummen des Geschenkpakets]({base}/GESCHENK-SHA256SUMS)
'''
handoff_name = 'GESCHENK-WINDOWS-CLAUDE-CODE.md'
(folder / handoff_name).write_text(handoff, encoding='utf-8')
(args.output / handoff_name).write_text(handoff, encoding='utf-8')
(folder / 'LIES-MICH-ZUERST.txt').write_text(f'''Private Brain Pro für Windows — {version}

1. Dieses ZIP vollständig in einen eigenen Ordner entpacken.
2. {installer} starten und installieren.
3. Die App über das Startmenü öffnen. Eigene Postfächer und eigenen Speicherort einrichten.

Windows 10/11, 64 Bit (x64). Die Java-Laufzeit ist enthalten.
Microsoft WebView2 wird benötigt. Fehlt es, lädt das Setup es von Microsoft nach;
dann ist Internet für die Erstinstallation nötig. Das Setup ist unsigniert;
Windows kann einen unbekannten Herausgeber melden.

Zum Aktualisieren die neue Setup.exe über die bestehende App installieren.
Bei Deinstallation bleiben Nutzerdaten erhalten. Ordnerpasswort und Sicherungen
selbst aufbewahren. Für lokale Bedeutungssuche das Modell einmal in der App laden.
Spracherkennung benötigt Mikrofon und passendes Windows-Sprachpaket.

Dieses Paket enthält nur veröffentlichte App-Dateien. Zusätzliche Werkzeuge
können einen Freischaltcode benötigen. Die App-Lizenz steht in LICENSE.txt,
die Urheberschaft in RECHTE.md. Weitere Anleitung: {handoff_name}.
Prüfsummen aller enthaltenen Dateien: SHA256SUMS.
''', encoding='utf-8')
files = sorted(folder.iterdir())
(folder / 'SHA256SUMS').write_text(''.join(digest(p) + '  ' + p.name + '\n' for p in files))

# A retry produces identical bytes, so a partial upload can be verified safely.
timestamp = int(git('show', '-s', '--format=%ct', args.source).decode().strip())
date_time = datetime.fromtimestamp(timestamp, timezone.utc).timetuple()[:6]
zip_path = args.output / zip_name
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(folder.iterdir()):
        info = zipfile.ZipInfo(folder_name + '/' + path.name, date_time=date_time)
        info.create_system = 3
        info.external_attr = 0o100644 << 16
        info.compress_type = zipfile.ZIP_DEFLATED
        with archive.open(info, 'w') as out, path.open('rb') as source:
            shutil.copyfileobj(source, out)
with zipfile.ZipFile(zip_path) as archive:
    if archive.testzip() is not None:
        raise ValueError('Damaged gift archive.')
    if hashlib.sha256(archive.read(folder_name + '/' + installer)).hexdigest() != build['sha256']:
        raise ValueError('Installer changed while packaging.')
    if set(archive.namelist()) != {folder_name + '/' + p.name for p in folder.iterdir()}:
        raise ValueError('Unexpected gift archive contents.')
(args.output / 'GESCHENK-SHA256SUMS').write_text(''.join(
    digest(p) + '  ' + p.name + '\n' for p in [zip_path, args.output / handoff_name]))
print(json.dumps({'zip': zip_name, 'sha256': digest(zip_path), 'size': zip_path.stat().st_size,
                  'installerSha256': build['sha256'], 'source': args.source}))
