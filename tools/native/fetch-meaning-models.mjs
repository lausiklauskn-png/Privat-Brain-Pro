// Zweites Bedeutungs-Modell (Pro-Umbau 4, Klaus 2026-10-28): Lernlauf für tools/native/meaning-models.json.
//   node tools/native/fetch-meaning-models.mjs --learn <dir>
// lädt transformers.js (npm, Integrität geprüft) und je Stufe die Modelldateien von Hugging Face, prüft vorhandene
// Fingerabdrücke, druckt fehlende als "MEANING-PIN <stufe> <datei> <sha256> <bytes>" und die Revision
// ("MEANING-REVISION <stufe> <id> <commit>"), legt alles unter <dir>/lib und <dir>/models/<id>/ ab und schreibt
// <dir>/meaning-pins-learned.json. Ein vorhandener, falscher Fingerabdruck bricht ab.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile, copyFile, rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const pins = JSON.parse(await readFile(join(root, 'tools/native/meaning-models.json'), 'utf8'));
const out = resolve(process.argv[process.argv.indexOf('--learn') + 1] || join(root, '.cache/meaning-out'));
const sha256 = b => createHash('sha256').update(b).digest('hex');
async function download(url, target) {
  const r = await fetch(url, {redirect: 'follow'});
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  const bytes = Buffer.from(await r.arrayBuffer());
  await mkdir(dirname(target), {recursive: true}); await writeFile(target, bytes);
  return {bytes, revision: r.headers.get('x-repo-commit')};
}
const lib = pins.library, libDir = join(out, 'lib');
{
  const tgz = join(out, 'transformers.tgz'), {bytes} = await download(lib.tarball, tgz);
  const [algo, expected] = lib.integrity.split('-');
  if (createHash(algo).update(bytes).digest('base64') !== expected) throw new Error('transformers.js tarball integrity mismatch');
  const unpack = join(out, 'unpack'); await rm(unpack, {recursive: true, force: true}); await mkdir(unpack, {recursive: true});
  execFileSync('tar', ['-xzf', tgz, '-C', unpack]); await mkdir(libDir, {recursive: true});
  for (const [name, want] of Object.entries(lib.files)) {
    await copyFile(join(unpack, 'package/dist', name), join(libDir, name));
    if (sha256(await readFile(join(libDir, name))) !== want) throw new Error(`${name}: library sha256 mismatch`);
  }
  await rm(unpack, {recursive: true, force: true});
}
const learned = {};
for (const [stufe, m] of Object.entries(pins.models)) {
  const dir = join(out, 'models', m.id), e = learned[stufe] = {id: m.id, revision: m.revision, dim: m.dim, files: {}, bytes: {}, totalBytes: 0};
  for (const [name, want] of Object.entries(m.files)) {
    const target = join(dir, name);
    const got = existsSync(target) ? {bytes: await readFile(target)} : await download(`https://huggingface.co/${m.id}/resolve/${m.revision}/${name}`, target);
    if (got.revision && got.revision !== e.revision) { e.revision = got.revision; console.log(`MEANING-REVISION ${stufe} ${m.id} ${got.revision}`); }
    const actual = sha256(got.bytes);
    if (want && actual !== want) throw new Error(`${stufe} ${name}: sha256 ${actual}, expected ${want}`);
    if (!want) console.log(`MEANING-PIN ${stufe} ${name} ${actual} ${got.bytes.length}`);
    e.files[name] = actual; e.bytes[name] = got.bytes.length; e.totalBytes += got.bytes.length;
  }
  console.log(`MEANING-TOTAL ${stufe} ${m.id} ${(e.totalBytes / 1048576).toFixed(1)} MB`);
}
await writeFile(join(out, 'meaning-pins-learned.json'), JSON.stringify(learned, null, 2) + '\n');
