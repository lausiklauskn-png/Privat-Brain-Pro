// Gegenprobe zu test-verbund-karte.mjs: in einer Wegwerf-Kopie des Webpakets fehlt je eine Sache;
// die Probe muss dann rot werden. Die Quelle bleibt unangetastet.
import {spawnSync} from 'node:child_process';
import {cp, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
const www = resolve('www');
const FAELLE = [
  ['Eintrag fehlt (Skript nicht geladen)', async d => { const f = join(d, 'index.html'); const s = await readFile(f, 'utf8'); const t = s.replace('<script src="native-verbund-karte.js"></script>', ''); if (t === s) throw new Error('toter Anker'); await writeFile(f, t); }],
  ['Karte fehlt im Paket', async d => { await rm(join(d, 'assets/pro-verbund.html')); }],
  ['Rahmen ohne Karte', async d => { const f = join(d, 'native-verbund-karte.js'); const s = await readFile(f, 'utf8'); const t = s.replace("const SEITE = 'assets/pro-verbund.html';", "const SEITE = 'about:blank';"); if (t === s) throw new Error('toter Anker'); await writeFile(f, t); }]
];
let gefangen = 0, durch = 0;
for (const [name, eingriff] of FAELLE) {
  const d = await mkdtemp(join(tmpdir(), 'pb-verbund-'));
  try {
    await cp(www, d, {recursive: true});
    await eingriff(d);
    const r = spawnSync(process.execPath, ['tools/native/test-verbund-karte.mjs'], {env: {...process.env, PB_WWW: d}, encoding: 'utf8', timeout: 180000});
    if (r.status !== 0) { gefangen++; console.log('gefangen: ' + name); } else { durch++; console.log('DURCHGERUTSCHT: ' + name); }
  } finally { await rm(d, {recursive: true, force: true}); }
}
console.log(`\n${gefangen} gefangen · ${durch} durchgerutscht`);
if (durch) process.exit(1);
