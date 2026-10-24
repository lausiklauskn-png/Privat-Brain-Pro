// CI-only public inference fixture. Never called by the app and never reads mail,
// accounts, API keys or credentials. Every byte must match the reviewed pins.
import {createHash} from 'node:crypto';
import {createReadStream, createWriteStream} from 'node:fs';
import {lstat, mkdir, readFile, rename, rm} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';

if (!process.argv[2]) throw new Error('Usage: node tools/native/fetch-translation-fixtures.mjs <public-fixture-directory>');
const destination = resolve(process.argv[2]);
const pins = JSON.parse(await readFile(new URL('./translation-models.json', import.meta.url), 'utf8'));
const semantic = JSON.parse(await readFile(new URL('./semantic-model.json', import.meta.url), 'utf8'));
if (pins.version !== 1 || pins.library?.version !== '2.17.2') throw new Error('Unreviewed translation runtime');
const model = pins.models?.['de-en'];
if (model?.id !== 'Xenova/opus-mt-de-en' || model.source !== 'de' || model.target !== 'en'
    || !/^[a-f0-9]{40}$/.test(model.revision || '') || model.license !== 'apache-2.0')
  throw new Error('Unreviewed DE→EN model');

const runtimeNames = ['transformers.min.js', 'ort-wasm-simd.wasm', 'ort-wasm.wasm'];
const requiredNames = ['config.json', 'tokenizer.json', 'tokenizer_config.json',
  'onnx/encoder_model_quantized.onnx', 'onnx/decoder_model_merged_quantized.onnx'];
const optionalNames = ['generation_config.json', 'special_tokens_map.json'];
const entries = [];
function entry(path, sha256, size, urls) {
  if (!/^[a-f0-9]{64}$/.test(sha256 || '') || !Number.isSafeInteger(size) || size <= 0 || size > 256 * 1024 * 1024
      || !urls.length) throw new Error('Invalid pinned file: ' + path);
  entries.push({path, sha256, size, urls});
}
for (const name of runtimeNames) {
  const hash = pins.library.files[name], size = pins.library.sizes['lib/' + name];
  if (hash !== semantic.library.files[name] || size !== semantic.sizes['lib/' + name]) throw new Error('Runtime differs from reviewed semantic pins');
  const urls = pins.library.sources.map(template => template.replace('{version}', '2.17.2').replace('{file}', name));
  const allowed = [
    'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/' + name,
    'https://unpkg.com/@xenova/transformers@2.17.2/dist/' + name
  ];
  if (urls.some(url => !allowed.includes(url))) throw new Error('Unreviewed runtime download URL');
  entry('lib/' + name, hash, size, urls);
}
for (const name of requiredNames) if (!model.files?.[name]) throw new Error('Missing pinned model file: ' + name);
for (const [name, file] of Object.entries(model.files)) {
  if (![...requiredNames, ...optionalNames].includes(name)) throw new Error('Unreviewed model filename: ' + name);
  const url = `https://huggingface.co/${model.id}/resolve/${model.revision}/${name}`;
  if (file.url !== url) throw new Error('Model URL is not the pinned immutable revision');
  entry('models/' + model.id + '/' + name, file.sha256, file.size, [url]);
}

async function verified(path, file) {
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size !== file.size) return false;
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(path)) hash.update(chunk);
    return hash.digest('hex') === file.sha256;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function fetchChecked(file) {
  const path = join(destination, file.path);
  await mkdir(dirname(path), {recursive:true});
  if (await verified(path, file)) { console.log(file.path + ': verified cached bytes'); return; }
  const partial = path + '.partial';
  let last;
  for (const url of file.urls) for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await rm(partial, {force:true});
      const response = await fetch(url, {signal:AbortSignal.timeout(180000), headers:{
        'accept-encoding':'identity', 'user-agent':'Private-Brain-Pro-public-translation-fixture'
      }});
      if (!response.ok || !response.body) {
        await response.body?.cancel();
        throw new Error('HTTP ' + response.status);
      }
      const announced = Number(response.headers.get('content-length'));
      if (announced && announced !== file.size) {
        await response.body.cancel();
        throw new Error('Unexpected Content-Length');
      }
      let received = 0;
      const hash = createHash('sha256');
      const checker = new Transform({transform(chunk, encoding, done) {
        received += chunk.length;
        if (received > file.size) { done(new Error('File exceeds pinned size')); return; }
        hash.update(chunk); done(null, chunk);
      }});
      await pipeline(response.body, checker, createWriteStream(partial, {flags:'wx'}));
      if (received !== file.size || hash.digest('hex') !== file.sha256) throw new Error('Pinned SHA-256 or byte size mismatch');
      await rename(partial, path);
      console.log(file.path + ': downloaded and verified ' + received + ' bytes');
      return;
    } catch (error) {
      last = error;
      await rm(partial, {force:true});
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw new Error('Could not fetch public pinned fixture ' + file.path + ': ' + (last?.message || 'no source'));
}

for (const file of entries) await fetchChecked(file);
console.log('Public DE→EN translation fixture ready: ' + entries.length + ' SHA-verified files, '
  + entries.reduce((sum, file) => sum + file.size, 0) + ' bytes. No mail or credentials were read.');
