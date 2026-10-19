#!/usr/bin/env python3
"""Sabotage only throwaway copies; require the intended behavior test to fail."""
from pathlib import Path
import tempfile, shutil, subprocess
root=Path(__file__).resolve().parents[1]
source=(root/'mail-service/server.mjs').read_text()
cases=[
 ('Authentifizierung', 'if (\n      incoming.length !== expected.length ||\n      !timingSafeEqual(incoming, expected)\n    )', 'if(false)', 'Token und Origin zwingend'),
 ('Serverfreigabe', 'if (!allowed.has(host))', 'if(false)', 'Server- und Header-Manipulation'),
 ('UIDVALIDITY', 'if (\n      String(c.mailbox.uidValidity) !==\n      String(req.query.validity || req.body?.validity)\n    )', 'if(false)', 'UIDVALIDITY schützt'),
 ('Doppelversand', 'if (store.submission(key))', 'if(false)', 'Gleicher Schlüssel sendet nicht erneut')
]
for name,anchor,replacement,expected in cases:
 assert source.count(anchor)==1, f'{name}: Anker nicht eindeutig'
 with tempfile.TemporaryDirectory(prefix='pb-mail-gegenprobe-') as tmp:
  path=Path(tmp)
  (path/'server.mjs').write_text(source.replace(anchor,replacement))
  shutil.copy(root/'mail-service/test.mjs',path/'test.mjs')
  (path/'node_modules').symlink_to(root/'mail-service/node_modules',target_is_directory=True)
  run=subprocess.run(['node','--test','test.mjs'],cwd=path,capture_output=True,text=True,timeout=45)
  output=run.stdout+run.stderr
  assert run.returncode!=0 and any(expected in line and ('not ok' in line or '✖' in line) for line in output.splitlines()), f'{name}: nicht korrekt gefangen\n{output}'
  print('✓ '+name+': absichtlichen Fehler gefangen')
print('4 Gegenproben gefangen, Originaldateien unverändert')
