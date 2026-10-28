// Misst die Bedeutungs-Modelle (klein = Modul-03-Modell zum Vergleich, mittel = e5-base, groß = e5-large) im echten
// headless Chromium, so wie die App sie später aus dem App-Speicher beantwortet: Ladezeit, Zeit je Abschnitt, JS-Heap,
// Arbeitsspeicher des Renderers (Spitze) und eine kleine Trefferprobe aus ERFUNDENEN deutschen Texten (keine Daten von
// Klaus): je Frage muss der passende Text vorne liegen, ohne dass dieselben Wörter vorkommen. Nichts geht ins Netz.
//   node tools/native/measure-meaning-models.mjs <dir aus fetch-meaning-models.mjs --learn>
// Ergebnis: <dir>/meaning-measured.json und Zeilen "MEANING-MEASURED <stufe> {...}".
import {createServer} from 'node:http';
import {readFile, writeFile, stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve, extname, join} from 'node:path';
import {chromium} from 'playwright-core';
const dir = resolve(process.argv[2] || '.cache/meaning-out');
const pins = JSON.parse(await readFile(new URL('./meaning-models.json', import.meta.url), 'utf8'));
const types = {'.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm', '.onnx': 'application/octet-stream', '.html': 'text/html'};
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  if (path === '/' ) { res.writeHead(200, {'content-type': 'text/html'}).end('<!doctype html><meta charset="utf-8"><title>Bedeutungs-Messung</title>'); return; }
  try { const file = join(dir, path), size = (await stat(file)).size; res.writeHead(200, {'content-type': types[extname(file)] || 'application/octet-stream', 'content-length': size}); res.end(await readFile(file)); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const TEXTE = [
  'Rechnung der Zahnarztpraxis: professionelle Zahnreinigung und eine Füllung, Gesamtbetrag 214,50 Euro, zahlbar in 14 Tagen.',
  'Mietvertrag für die Wohnung im zweiten Stock, Kaltmiete 780 Euro, Nebenkostenvorauszahlung 190 Euro, Kaution drei Monatsmieten.',
  'Ihre Kfz-Haftpflicht und Teilkasko für das Fahrzeug mit dem Kennzeichen B-XY 123: Jahresbeitrag 612 Euro ab dem 1. Januar.',
  'Buchungsbestätigung: zwei Wochen Ferienhaus am Gardasee in Italien, Anreise 3. August, Abreise 17. August.',
  'Arztbrief der Hausarztpraxis: Blutbild unauffällig, Cholesterin leicht erhöht, Kontrolle in sechs Monaten empfohlen.',
  'Hiermit kündige ich meine Mitgliedschaft im Fitnessstudio fristgerecht zum Ende der Vertragslaufzeit.',
  'Stromabrechnung 2025: Verbrauch 2.430 Kilowattstunden, Nachzahlung 86 Euro, neuer Abschlag 72 Euro im Monat.',
  'Zeugnis der Grundschule: Deutsch gut, Mathematik sehr gut, Sachunterricht gut, Verhalten lobenswert.'
];
const FRAGEN = [
  ['Was hat die Behandlung beim Zahnarzt gekostet?', 0], ['Wie hoch ist die Miete für die Wohnung?', 1], ['Was zahle ich für die Autoversicherung?', 2],
  ['Wann fahren wir in den Urlaub nach Italien?', 3], ['Wie waren meine Laborwerte?', 4], ['Sportstudio Vertrag beenden', 5],
  ['Wie viel Strom haben wir verbraucht?', 6], ['Noten meines Kindes', 7],
  ['How much was the dentist bill?', 0], ['When is our holiday at the lake?', 3]
];
let rssPeak = 0;
const sampler = setInterval(() => {
  try { for (const row of execFileSync('ps', ['-eo', 'rss,args'], {encoding: 'utf8'}).split('\n').filter(l => /--type=renderer/.test(l))) rssPeak = Math.max(rssPeak, parseInt(row.trim().split(/\s+/)[0], 10) || 0); } catch {}
}, 250);
const browser = await chromium.launch({executablePath: process.env.CB_CHROMIUM || undefined, args: ['--no-sandbox', '--enable-precise-memory-info']});
const ergebnis = {run: process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : 'lokal', stufen: {}};
let fehler = 0;
for (const [stufe, m] of Object.entries(pins.models)) {
  rssPeak = 0;
  const page = await browser.newPage(), errors = [], outside = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); if (u.startsWith(origin)) return r.continue(); outside.push(u); r.abort(); });
  await page.goto(origin + '/');
  const r = await page.evaluate(async ({origin, id, TEXTE, FRAGEN}) => {
    const mem = () => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null);
    const t0 = performance.now();
    const T = await import(origin + '/lib/transformers.min.js');
    T.env.allowLocalModels = true; T.env.localModelPath = origin + '/models/'; T.env.allowRemoteModels = false; T.env.useBrowserCache = false;
    T.env.backends.onnx.wasm.wasmPaths = origin + '/lib/'; T.env.backends.onnx.wasm.numThreads = 1;
    const pipe = await T.pipeline('feature-extraction', id, {quantized: true});
    const loadMs = Math.round(performance.now() - t0), heapLoaded = mem();
    const vec = async s => Array.from((await pipe(s, {pooling: 'mean', normalize: true})).data);
    const t1 = performance.now(); const docs = []; for (const s of TEXTE) docs.push(await vec('passage: ' + s));
    const msJeAbschnitt = Math.round((performance.now() - t1) / TEXTE.length);
    const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
    let treffer = 0; const abstaende = [];
    for (const [frage, soll] of FRAGEN) {
      const q = await vec('query: ' + frage), sc = docs.map(d => dot(q, d)), best = sc.indexOf(Math.max(...sc));
      if (best === soll) treffer++;
      const andere = sc.filter((_, i) => i !== soll); abstaende.push(+(sc[soll] - Math.max(...andere)).toFixed(4));
    }
    return {loadMs, msJeAbschnitt, dim: docs[0].length, heapLoadedMB: heapLoaded, heapAfterMB: mem(), treffer, fragen: FRAGEN.length, abstaende};
  }, {origin, id: m.id, TEXTE, FRAGEN}).catch(e => ({fehler: String(e && e.message || e)}));
  await page.close();
  let bytes = 0; for (const name of Object.keys(m.files)) { try { bytes += (await stat(join(dir, 'models', m.id, name))).size; } catch {} }
  const zeile = {id: m.id, downloadMB: +(bytes / 1048576).toFixed(1), ...r, rendererRssPeakMB: Math.round(rssPeak / 1024), errors, outsideRequests: outside};
  ergebnis.stufen[stufe] = zeile;
  console.log(`MEANING-MEASURED ${stufe} ${JSON.stringify(zeile)}`);
  if (r.fehler || outside.length || r.dim !== m.dim) fehler++;
}
clearInterval(sampler); await browser.close(); server.close();
await writeFile(join(dir, 'meaning-measured.json'), JSON.stringify(ergebnis, null, 2) + '\n');
if (fehler) { console.error('Mindestens eine Stufe ohne gültiges Ergebnis.'); process.exitCode = 1; }
