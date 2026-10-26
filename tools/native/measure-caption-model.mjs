// Misst das Bildmodell im echten headless Chromium (Lernlauf, Sitzung 4): Ladezeit, Zeit je Bild, JS-Heap und den
// Arbeitsspeicher des Renderer-Prozesses (RSS, Spitze). Die Dateien kommen aus dem Lernlauf (fetch-caption-model.mjs
// --learn <dir>) und werden von einem lokalen Server unter /models/ und /lib/ ausgeliefert — genau so, wie die App
// sie später aus dem App-Speicher beantwortet. Nichts geht dabei ins Netz. Ergebnis: <dir>/caption-measured.json.
import {createServer} from 'node:http';
import {readFile, writeFile, stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve, extname, join} from 'node:path';
import {chromium} from 'playwright-core';
const dir = resolve(process.argv[2] || '.cache/caption-out');
const pins = JSON.parse(await readFile(new URL('./caption-model.json', import.meta.url), 'utf8'));
const types = {'.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm', '.onnx': 'application/octet-stream', '.html': 'text/html'};
const page_html = `<!doctype html><meta charset="utf-8"><title>Bildmodell-Messung</title><canvas id="c" width="640" height="480"></canvas>`;
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  if (path === '/' || path === '/index.html') { res.writeHead(200, {'content-type': 'text/html'}).end(page_html); return; }
  try {
    const file = join(dir, path); const size = (await stat(file)).size;
    res.writeHead(200, {'content-type': types[extname(file)] || 'application/octet-stream', 'content-length': size, 'access-control-allow-origin': '*'});
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
// Renderer-Arbeitsspeicher: alle 250 ms die Chromium-Renderer-Prozesse ansehen, Spitze merken (Linux).
let rssPeak = 0, rssPeakSum = 0, sampling = true;
const sampler = setInterval(() => {
  try {
    const rows = execFileSync('ps', ['-eo', 'rss,args'], {encoding: 'utf8'}).split('\n').filter(l => /--type=renderer/.test(l));
    let sum = 0; for (const row of rows) { const kb = parseInt(row.trim().split(/\s+/)[0], 10) || 0; sum += kb; rssPeak = Math.max(rssPeak, kb); }
    rssPeakSum = Math.max(rssPeakSum, sum);
  } catch {}
}, 250);
const browser = await chromium.launch({executablePath: process.env.CB_CHROMIUM || undefined, args: ['--no-sandbox', '--enable-precise-memory-info']});
const page = await browser.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const outside = [];
await page.route('**/*', r => { const u = r.request().url(); if (u.startsWith(origin)) return r.continue(); outside.push(u); r.abort(); });
await page.goto(origin + '/');
const result = await page.evaluate(async ({origin, modelId, version}) => {
  const mem = () => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null);
  const heapBefore = mem();
  const t0 = performance.now();
  const T = await import(origin + '/lib/transformers.min.js');
  T.env.allowLocalModels = true; T.env.localModelPath = origin + '/models/'; T.env.allowRemoteModels = false;
  T.env.backends.onnx.wasm.wasmPaths = origin + '/lib/'; T.env.backends.onnx.wasm.numThreads = 1;
  const files = {};
  const pipe = await T.pipeline('image-to-text', modelId, {quantized: true, progress_callback: d => { if (d && d.file && d.status === 'done') files[d.file] = true; }});
  const loadMs = Math.round(performance.now() - t0);
  const heapLoaded = mem();
  // Zwei erfundene Bilder (kein Foto von Klaus): Himmel, Wiese, Sonne, Haus — und ein Tisch mit Tasse.
  const c = document.getElementById('c'), x = c.getContext('2d');
  const draw = which => {
    if (which === 0) {
      const sky = x.createLinearGradient(0, 0, 0, 300); sky.addColorStop(0, '#5aa0e6'); sky.addColorStop(1, '#cfe6ff'); x.fillStyle = sky; x.fillRect(0, 0, 640, 300);
      x.fillStyle = '#5ea33e'; x.fillRect(0, 300, 640, 180); x.fillStyle = '#ffd34d'; x.beginPath(); x.arc(520, 90, 48, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#b5693a'; x.fillRect(120, 220, 200, 140); x.fillStyle = '#7a2e1d'; x.beginPath(); x.moveTo(100, 220); x.lineTo(220, 130); x.lineTo(340, 220); x.closePath(); x.fill();
      x.fillStyle = '#3b2a1a'; x.fillRect(200, 290, 44, 70); x.fillStyle = '#e8f4ff'; x.fillRect(140, 240, 36, 36); x.fillRect(270, 240, 36, 36);
      x.fillStyle = '#2f7a2a'; x.beginPath(); x.arc(470, 280, 60, 0, Math.PI * 2); x.fill(); x.fillStyle = '#5a3b1e'; x.fillRect(460, 330, 20, 60);
    } else {
      x.fillStyle = '#efe6d6'; x.fillRect(0, 0, 640, 480); x.fillStyle = '#8b5a2b'; x.fillRect(0, 300, 640, 180);
      x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(320, 300, 110, 34, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#f2f2f2'; x.fillRect(280, 200, 80, 100); x.fillStyle = '#4a2c17'; x.beginPath(); x.ellipse(320, 205, 36, 14, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#f2f2f2'; x.lineWidth = 10; x.beginPath(); x.arc(372, 250, 24, -Math.PI / 2, Math.PI / 2); x.stroke();
    }
    return c.toDataURL('image/jpeg', 0.9);
  };
  const captions = [], times = [];
  for (const which of [0, 1]) {
    const url = draw(which); const t1 = performance.now();
    const out = await pipe(url);
    times.push(Math.round(performance.now() - t1));
    captions.push(String((Array.isArray(out) ? out[0] && out[0].generated_text : out && out.generated_text) || '').trim());
  }
  return {loadMs, times, captions, heapBefore, heapLoaded, heapAfter: mem(), files: Object.keys(files), ua: navigator.userAgent};
}, {origin, modelId: pins.model.id, version: pins.library.version});
sampling = false; clearInterval(sampler);
await browser.close(); server.close();
let downloadBytes = 0;
for (const name of Object.keys(pins.model.files)) downloadBytes += (await stat(join(dir, 'models', pins.model.id, name))).size;
for (const name of Object.keys(pins.library.files)) downloadBytes += (await stat(join(dir, 'lib', name))).size;
const measured = {
  run: process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : 'lokal',
  downloadBytes, downloadMB: +(downloadBytes / 1048576).toFixed(1),
  chromium: (result.ua.match(/Chrome\/([\d.]+)/) || [])[1] || result.ua,
  loadMs: result.loadMs, firstCaptionMs: result.times[0], secondCaptionMs: result.times[1],
  jsHeapBeforeMB: result.heapBefore, jsHeapLoadedMB: result.heapLoaded, jsHeapAfterMB: result.heapAfter,
  rendererRssPeakMB: Math.round(rssPeak / 1024), rendererRssPeakSumMB: Math.round(rssPeakSum / 1024),
  captions: result.captions, loadedFiles: result.files, errors, outsideRequests: outside
};
await writeFile(join(dir, 'caption-measured.json'), JSON.stringify(measured, null, 2) + '\n');
console.log('CAPTION-MEASURED ' + JSON.stringify(measured));
if (outside.length) { console.error('Requests outside the local server: ' + outside.join(', ')); process.exitCode = 1; }
if (!result.captions.every(Boolean)) { console.error('No caption produced'); process.exitCode = 1; }
