// Puts the meaning model and transformers.js into the native web bundle (Klaus 2026-10-21:
// "Modell fest einbauen"). Downloads once into .cache/semantic/, checks every file against
// tools/native/semantic-model.json and copies it to:
//   <out>/models/Xenova/multilingual-e5-small/…   (Modul 03 probes /models/ first)
//   <out>/vendor/transformers-2.17.2/…             (served for Modul 03's jsDelivr address by MainActivity)
// Without network or pins the bundle is built without the model, unless PB_SEMANTIC_STRICT=1
// (then it fails). A missing pin is printed as "SEMANTIC-PIN <file> <sha256> <bytes>".
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile, copyFile, stat, rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname, join, resolve} from 'node:path';

const root = resolve(dirname(new URL(import.meta.url).pathname), '../..');
const pins = JSON.parse(await readFile(join(root, 'tools/native/semantic-model.json'), 'utf8'));
const cache = join(root, '.cache/semantic');
const pinned = Object.values(pins.model.files).every(Boolean);
// Strict on GitHub once every file is pinned: a build there must not ship without the model.
const strict = process.env.PB_SEMANTIC_STRICT === '1' || (process.env.GITHUB_ACTIONS === 'true' && pinned);

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
  const missing = Object.keys(lib.files).some(name => !existsSync(join(dir, name)));
  if (missing) {
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

async function model() {
  const m = pins.model, dir = join(cache, m.id), unpinned = [];
  for (const [name, expected] of Object.entries(m.files)) {
    const target = join(dir, name);
    let bytes = existsSync(target) ? await readFile(target) : null;
    if (!bytes || (expected && sha256(bytes) !== expected)) {
      const got = await download(`https://huggingface.co/${m.id}/resolve/${m.revision}/${name}`, target);
      bytes = got.bytes;
      if (got.revision) console.log(`SEMANTIC-REVISION ${m.id} ${got.revision}`);
    }
    const actual = sha256(bytes);
    if (!expected) { unpinned.push(name); console.log(`SEMANTIC-PIN ${name} ${actual} ${bytes.length}`); }
    else if (actual !== expected) throw new Error(`${name}: sha256 ${actual}, expected ${expected}`);
  }
  if (unpinned.length) throw new Error(`model files without pin: ${unpinned.join(', ')}`);
  return dir;
}

async function copyTree(from, names, to) {
  for (const name of names) { await mkdir(dirname(join(to, name)), {recursive: true}); await copyFile(join(from, name), join(to, name)); }
}

/** Returns true when the model is in the bundle. */
export async function bundleSemanticModel(out) {
  if (pins.enabled === false) { console.log('Semantic model switched off in semantic-model.json: ' + (pins.enabledNote || '')); return false; }
  try {
    const lib = await library();
    const mod = await model();
    await copyTree(lib, Object.keys(pins.library.files), join(out, `vendor/transformers-${pins.library.version}`));
    await copyTree(mod, Object.keys(pins.model.files), join(out, 'models', pins.model.id));
    let bytes = 0;
    for (const name of Object.keys(pins.model.files)) bytes += (await stat(join(mod, name))).size;
    for (const name of Object.keys(pins.library.files)) bytes += (await stat(join(lib, name))).size;
    console.log(`Semantic model bundled: ${(bytes / 1048576).toFixed(1)} MB`);
    return true;
  } catch (error) {
    if (strict) throw error;
    console.warn(`⚠ Semantic model NOT bundled (${error.message}). The app falls back to keyword search.`);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = process.argv[2] ? resolve(process.argv[2]) : join(root, 'www');
  process.exitCode = (await bundleSemanticModel(out)) ? 0 : 1;
}
