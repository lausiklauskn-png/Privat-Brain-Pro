// Build-only OCR payload. The app never downloads this engine or its models.
// All files are required: a missing or changed pin fails the native build.
import {createHash} from 'node:crypto';
import * as http from 'node:http';
import {createReadStream, createWriteStream} from 'node:fs';
import {copyFile, lstat, mkdir, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {gunzipSync} from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const manifestPath = join(root, 'tools/native/ocr-assets.json');
const cache = join(root, '.cache/ocr/pinned');
const sha = (algorithm, data, encoding = 'hex') => createHash(algorithm).update(data).digest(encoding);

function checkedPath(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_.\/-]+$/.test(value)
      || value.startsWith('/') || value.split('/').some(part => !part || part === '.' || part === '..'))
    throw new Error('Invalid OCR payload path');
  return value;
}

function checkedPin(file) {
  if (!/^[a-f0-9]{64}$/.test(file.sha256 || '') || !Number.isSafeInteger(file.size)
      || file.size <= 0 || file.size > 64 * 1024 * 1024)
    throw new Error('Invalid OCR SHA-256 or byte-size pin');
  if (file.gitBlobSha1 && !/^[a-f0-9]{40}$/.test(file.gitBlobSha1))
    throw new Error('Invalid OCR Git blob pin');
}

function validate(pins) {
  if (pins.version !== 1 || pins.engine?.name !== 'Tesseract.js'
      || pins.engine.version !== '7.0.0' || pins.engine.coreVersion !== '7.0.0'
      || pins.engine.oem !== 1 || pins.engine.gzip !== false || pins.engine.legacy !== false
      || pins.engine.basePath !== 'vendor/tesseract/'
      || JSON.stringify(pins.languages) !== JSON.stringify(['deu', 'eng', 'rus', 'pol'])
      || !/^[a-f0-9]{40}$/.test(pins.model?.revision || '') || pins.model.license !== 'Apache-2.0')
    throw new Error('Unreviewed OCR runtime configuration');
  const packages = new Map();
  for (const item of pins.packages || []) {
    checkedPin(item);
    if (!['tesseract.js', 'tesseract.js-core'].includes(item.id) || item.version !== '7.0.0'
        || item.url !== `https://registry.npmjs.org/${item.id}/-/${item.id}-7.0.0.tgz`
        || !/^sha512-[A-Za-z0-9+/]{86}==$/.test(item.integrity || '') || packages.has(item.id))
      throw new Error('Unreviewed OCR npm archive');
    packages.set(item.id, item);
  }
  if (packages.size !== 2 || !Array.isArray(pins.files)) throw new Error('Incomplete OCR archives');
  const paths = new Set();
  for (const file of pins.files) {
    checkedPin(file); checkedPath(file.path);
    if (paths.has(file.path)) throw new Error('Duplicate OCR payload path');
    paths.add(file.path);
    if (file.package) {
      if (!packages.has(file.package) || !checkedPath(file.member).startsWith('package/') || file.url)
        throw new Error('Invalid OCR archive member');
    } else if (file.localSource) {
      // Small upstream license texts are retained in source control verbatim.
      // Their public provenance is metadata; this branch never downloads it.
      if (!/^licenses\/[A-Za-z0-9_.-]+\.txt$/.test(file.path)
          || file.localSource !== 'native/ocr-' + file.path
          || file.url || !file.component || !file.license
          || !/^https:\/\/(?:raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[a-f0-9]{40}\/|registry\.npmjs\.org\/)/.test(file.provenance?.sourceUrl || ''))
        throw new Error('Invalid local OCR license');
    } else {
      const source = file.path.startsWith('lang/') ? file.path.slice(5)
        : file.path === 'licenses/tessdata_fast-APACHE-2.0.txt' ? 'LICENSE'
          : file.path === 'licenses/tessdata_fast-README.md' ? 'README.md' : null;
      if (!source || file.url !== `https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/${pins.model.revision}/${source}`)
        throw new Error('Unreviewed OCR model URL');
    }
  }
  for (const name of ['tesseract.min.js', 'worker.min.js', 'tesseract-core-lstm.wasm.js',
    'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js',
    ...pins.languages.map(language => `lang/${language}.traineddata`),
    'licenses/tesseract.js-APACHE-2.0.txt', 'licenses/tesseract.js-core-APACHE-2.0.txt',
    'tesseract.min.js.LICENSE.txt', 'worker.min.js.LICENSE.txt',
    'licenses/tessdata_fast-APACHE-2.0.txt', 'licenses/tessdata_fast-README.md'])
    if (!paths.has(name)) throw new Error('Missing required OCR asset: ' + name);
  if (pins.totals?.files !== paths.size
      || pins.totals.size !== pins.files.reduce((total, file) => total + file.size, 0))
    throw new Error('Incorrect OCR payload totals');
  return packages;
}

function verifyBytes(bytes, pin) {
  if (bytes.length !== pin.size || sha('sha256', bytes) !== pin.sha256)
    throw new Error('OCR SHA-256 or size mismatch: ' + (pin.path || pin.id));
  if (pin.integrity && `sha512-${sha('sha512', bytes, 'base64')}` !== pin.integrity)
    throw new Error('OCR npm SRI mismatch: ' + pin.id);
  if (pin.gitBlobSha1
      && sha('sha1', Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])) !== pin.gitBlobSha1)
    throw new Error('OCR Git blob mismatch: ' + pin.path);
}

async function verifiedFile(path, pin) {
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size !== pin.size) return false;
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(path)) hash.update(chunk);
    if (hash.digest('hex') !== pin.sha256) return false;
    // npm SRI and Git provenance are checked again before extracting or copying.
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function directory(path) {
  const absolute = resolve(path);
  const parent = dirname(absolute);
  if (parent !== absolute) await directory(parent);
  try {
    const info = await lstat(absolute);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new Error('OCR asset directories must not be symlinks');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await mkdir(absolute);
  }
}

async function cached(pin) {
  const target = join(cache, pin.sha256);
  await directory(cache);
  if (await verifiedFile(target, pin)) return target;
  await rm(target, {force:true});
  // Managed build environments inject their approved egress proxy. Node's
  // fetch does not use those variables by default; never bypass that proxy.
  if (process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy) {
    if (typeof http.setGlobalProxyFromEnv !== 'function')
      throw new Error('This proxied OCR build needs Node 24.5+ environment-proxy support');
    http.setGlobalProxyFromEnv();
  }
  let last;
  for (let attempt = 0; attempt < 3; attempt++) {
    const partial = `${target}.${process.pid}.${attempt}.partial`;
    try {
      await rm(partial, {force:true});
      const response = await fetch(pin.url, {redirect:'error', signal:AbortSignal.timeout(120000), headers:{
        'accept-encoding':'identity', 'user-agent':'Private-Brain-Pro-pinned-offline-OCR-build'
      }});
      if (!response.ok || !response.body) {
        await response.body?.cancel();
        throw new Error('HTTP ' + response.status);
      }
      const announced = Number(response.headers.get('content-length'));
      if (announced && announced !== pin.size) {
        await response.body.cancel(); throw new Error('Unexpected OCR download size');
      }
      let received = 0;
      const hash = createHash('sha256');
      const checker = new Transform({transform(chunk, encoding, done) {
        received += chunk.length;
        if (received > pin.size) { done(new Error('OCR download exceeds pinned size')); return; }
        hash.update(chunk); done(null, chunk);
      }});
      await pipeline(response.body, checker, createWriteStream(partial, {flags:'wx'}));
      if (received !== pin.size || hash.digest('hex') !== pin.sha256)
        throw new Error('Downloaded OCR bytes differ from pin');
      verifyBytes(await readFile(partial), pin);
      await rename(partial, target);
      console.log(`OCR ${pin.path || pin.id}: downloaded and verified ${received} bytes`);
      return target;
    } catch (error) {
      last = error; await rm(partial, {force:true});
      if (attempt < 2) await new Promise(done => setTimeout(done, 500 * (attempt + 1)));
    }
  }
  throw new Error(`Required offline OCR asset unavailable (${pin.path || pin.id}): ${last?.message}`);
}

// Read only reviewed regular files, without extracting arbitrary archive paths.
// Both pinned npm archives use ordinary tar members and have no PAX or links.
function members(archive, requested) {
  const tar = gunzipSync(archive, {maxOutputLength:64 * 1024 * 1024});
  const result = new Map();
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) break;
    const field = (start, end) => header.subarray(start, end).toString('utf8').replace(/\0.*$/s, '').trim();
    const prefix = field(345, 500), name = (prefix ? prefix + '/' : '') + field(0, 100);
    checkedPath(name);
    const type = header[156], sizeText = field(124, 136), checksumText = field(148, 156);
    if ((type !== 0 && type !== 48) || !/^[0-7]+$/.test(sizeText) || !/^[0-7]+$/.test(checksumText))
      throw new Error('Unsupported OCR archive member');
    const checksum = header.reduce((sum, byte, index) => sum + (index >= 148 && index < 156 ? 32 : byte), 0);
    if (checksum !== parseInt(checksumText, 8)) throw new Error('Invalid OCR tar header checksum');
    const size = parseInt(sizeText, 8), start = offset + 512, end = start + size;
    if (!Number.isSafeInteger(size) || end > tar.length) throw new Error('Truncated OCR archive');
    if (requested.has(name)) {
      if (result.has(name)) throw new Error('Duplicate OCR archive member');
      result.set(name, tar.subarray(start, end));
    }
    offset = start + Math.ceil(size / 512) * 512;
  }
  for (const member of requested) if (!result.has(member)) throw new Error('Missing OCR archive member: ' + member);
  return result;
}

/** Bundle all OCR engine variants, four language models and upstream notices. */
export async function bundleOcrAssets(out) {
  const pins = JSON.parse(await readFile(manifestPath, 'utf8'));
  const packages = validate(pins);
  const destination = join(resolve(out), 'vendor/tesseract');
  await directory(destination);
  // Prepare and validate every input before writing the web payload.
  const data = new Map();
  for (const item of packages.values()) {
    const archive = await readFile(await cached(item));
    verifyBytes(archive, item);
    const files = pins.files.filter(file => file.package === item.id);
    const extracted = members(archive, new Set(files.map(file => file.member)));
    for (const file of files) {
      const bytes = extracted.get(file.member); verifyBytes(bytes, file); data.set(file.path, bytes);
    }
  }
  for (const file of pins.files.filter(file => !file.package)) {
    let source;
    if (file.localSource) {
      source = join(root, file.localSource);
      await directory(dirname(source));
      const info = await lstat(source);
      if (!info.isFile() || info.isSymbolicLink()) throw new Error('Unsafe local OCR license');
    } else source = await cached(file);
    const bytes = await readFile(source); verifyBytes(bytes, file); data.set(file.path, bytes);
  }
  for (const file of pins.files) {
    const target = join(destination, file.path);
    await directory(dirname(target));
    const info = await lstat(target).catch(error => {if (error.code !== 'ENOENT') throw error; return null;});
    if (info && (!info.isFile() || info.isSymbolicLink())) throw new Error('Unsafe OCR output file');
    await writeFile(target, data.get(file.path));
  }
  // The manifest remains available for installed-APK and Windows bundle audits.
  const outputManifest = join(resolve(out), 'ocr-assets.json');
  const info = await lstat(outputManifest).catch(error => {if (error.code !== 'ENOENT') throw error; return null;});
  if (info && (!info.isFile() || info.isSymbolicLink())) throw new Error('Unsafe OCR output manifest');
  await copyFile(manifestPath, outputManifest);
  console.log(`Offline OCR bundled: ${pins.totals.files} pinned files, ${pins.totals.size} bytes; DE/EN/RU/PL, Tesseract.js 7.0.0 LSTM.`);
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2]) throw new Error('Usage: node tools/native/fetch-ocr-assets.mjs <native-web-output-or-public-fixture-directory>');
  await bundleOcrAssets(process.argv[2]);
}
