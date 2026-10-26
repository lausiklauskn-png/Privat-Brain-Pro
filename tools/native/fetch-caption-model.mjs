// Bildmodell (Sitzung 4, Klaus 2026-10-26): dieselbe Prüfung wie beim Bedeutungs-Modell (fetch-semantic-model.mjs),
// nur für tools/native/caption-model.json. Der Bau nimmt das Modell NICHT mit (enabled: false); die App lädt es per
// Schalter (ProCaption) mit genau diesen Fingerabdrücken. Diese Datei dient zwei Zwecken:
//   node tools/native/fetch-caption-model.mjs --learn <dir>   Lernlauf (CI): lädt alle Dateien, druckt je Datei
//                                                            "CAPTION-PIN <datei> <sha256> <bytes>" und die Revision,
//                                                            legt sie unter <dir>/models/<id>/ und <dir>/lib/ ab.
//   bundleCaptionModel(out)                                   aus prepare-web.mjs: ohne enabled bleibt es bei einem Satz.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile, copyFile, stat, rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const pinsPath = join(root, 'tools/native/caption-model.json');
const pins = JSON.parse(await readFile(pinsPath, 'utf8'));
const cache = join(root, '.cache/caption');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function download(url, target) {
  const response = await fetch(url, {redirect: 'follow'});
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await mkdir(dirname(target), {recursive: true});
  await writeFile(target, bytes);
  return {bytes, revision: response.headers.get('x-repo-commit')};
}

async function library() {
  const lib = pins.library, dir = join(cache, `transformers-${lib.version}`);
  if (Object.keys(lib.files).some(name => !existsSync(join(dir, name)))) {
    const tgz = join(cache, `transformers-${lib.version}.tgz`);
    const {bytes} = await download(lib.tarball, tgz);
    const [algo, expected] = lib.integrity.split('-');
    const actual = createHash(algo).update(bytes).digest('base64');
    if (actual !== expected) throw new Error(`transformers.js tarball integrity mismatch (${actual})`);
    const unpack = join(cache, 'unpack');
    await rm(unpack, {recursive: true, force: true}); await mkdir(unpack, {recursive: true});
    execFileSync('tar', ['-xzf', tgz, '-C', unpack]);
    await mkdir(dir, {recursive: true});
    for (const name of Object.keys(lib.files)) await copyFile(join(unpack, 'package/dist', name), join(dir, name));
    await rm(unpack, {recursive: true, force: true});
  }
  for (const [name, expected] of Object.entries(lib.files)) {
    const actual = sha256(await readFile(join(dir, name)));
    if (actual !== expected) throw new Error(`${name}: sha256 ${actual}, expected ${expected}`);
  }
  return dir;
}

/** Loads every model file into the cache. In learn mode a missing pin is printed instead of failing. */
async function model(learn) {
  const m = pins.model, dir = join(cache, m.id), learned = {files: {}, sizes: {}, revision: m.revision};
  for (const [name, expected] of Object.entries(m.files)) {
    const target = join(dir, name);
    let bytes = existsSync(target) ? await readFile(target) : null;
    if (!bytes || (expected && sha256(bytes) !== expected)) {
      const got = await download(`https://huggingface.co/${m.id}/resolve/${m.revision}/${name}`, target);
      bytes = got.bytes;
      if (got.revision) { learned.revision = got.revision; console.log(`CAPTION-REVISION ${m.id} ${got.revision}`); }
    }
    const actual = sha256(bytes);
    learned.files[name] = actual; learned.sizes['model/' + name] = bytes.length;
    if (!expected) console.log(`CAPTION-PIN ${name} ${actual} ${bytes.length}`);
    else if (actual !== expected) throw new Error(`${name}: sha256 ${actual}, expected ${expected}`);
  }
  const unpinned = Object.entries(m.files).filter(([, v]) => !v).map(([k]) => k);
  if (unpinned.length && !learn) throw new Error(`model files without pin: ${unpinned.join(', ')}`);
  return {dir, learned};
}

async function copyTree(from, names, to) {
  for (const name of names) { await mkdir(dirname(join(to, name)), {recursive: true}); await copyFile(join(from, name), join(to, name)); }
}

/** Returns true when the model is in the bundle (it is not: enabled is false). */
export async function bundleCaptionModel(out) {
  if (pins.enabled === false) { console.log('Caption model not bundled (caption-model.json enabled: false): ' + (pins.enabledNote || '')); return false; }
  const lib = await library(), {dir} = await model(false);
  await copyTree(lib, Object.keys(pins.library.files), join(out, `vendor/transformers-${pins.library.version}`));
  await copyTree(dir, Object.keys(pins.model.files), join(out, 'models', pins.model.id));
  return true;
}

/** Learn mode: downloads, prints pins and sizes, writes <dir>/lib and <dir>/models/<id> plus caption-pins-learned.json. */
export async function learnCaptionModel(outDir) {
  const lib = await library(), {dir, learned} = await model(true);
  await copyTree(lib, Object.keys(pins.library.files), join(outDir, 'lib'));
  await copyTree(dir, Object.keys(pins.model.files), join(outDir, 'models', pins.model.id));
  let total = 0;
  for (const name of Object.keys(pins.model.files)) total += (await stat(join(dir, name))).size;
  for (const name of Object.keys(pins.library.files)) { const size = (await stat(join(lib, name))).size; learned.sizes['lib/' + name] = size; total += size; }
  learned.totalBytes = total;
  await writeFile(join(outDir, 'caption-pins-learned.json'), JSON.stringify(learned, null, 2) + '\n');
  console.log(`CAPTION-TOTAL ${total} bytes (${(total / 1048576).toFixed(1)} MB, model + library)`);
  return learned;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv[2] === '--learn') { await learnCaptionModel(resolve(process.argv[3] || join(root, '.cache/caption-out'))); }
  else { const out = process.argv[2] ? resolve(process.argv[2]) : join(root, 'www'); process.exitCode = (await bundleCaptionModel(out)) ? 0 : 1; }
}
