// „Überall suchen“ in Private Brain Pro (Pro-Umbau 12, Klaus m7): der gemeinsame Kasten (native/pro-ueberall.js) auf der Suchseite,
// diese App = Katalog, Tresorordner = Fächer der anderen Pro-Apps über ProVault.tresorFach (gestellt), Netz = Modul 23 (gestellt).
// Läuft gegen das gebaute www/ (npm run build:web). Simulation im Browser: kein Gerät, kein echtes Relais.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright-core';
const root = resolve('www'), origin = 'https://localhost/';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };
let count = 0; const ok = (name, value) => { assert.ok(value, name); console.log('✓ ' + name); count++; };

const browser = await chromium.launch({ executablePath: process.env.CB_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] });
async function seite({ mitBruecke = true, breite = 1280 } = {}) {
  const context = await browser.newContext({ viewport: { width: breite, height: 900 } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', async route => {
    const url = route.request().url(); if (!url.startsWith(origin)) return route.abort();
    const path = resolve(root, '.' + new URL(url).pathname.replace(/\/$/, '/index.html'));
    if (!path.startsWith(root + '/')) return route.abort();
    try { return route.fulfill({ contentType: types[extname(path)] || 'application/octet-stream', body: await readFile(path) }); }
    catch { return route.fulfill({ status: 404, body: '' }); }
  });
  if (mitBruecke) await page.addInitScript(() => {
    const faecher = {
      'private-brain': [{ id: 'p1', name: 'Mietvertrag (eigenes Fach)', datum: 1, verschluesselung: 'app' }],
      'workflow-pdf-pro': [{ id: 'w1', name: 'Scan Mietvertrag Garage.pdf', auszug: 'Mietvertrag Garage Hauptstraße 3', datum: 5, verschluesselung: 'app' }],
      'eingang-bookledgerpro': [{ id: 'e1', name: 'Rechnung Hausverwaltung.eml', auszug: 'Nebenkosten zum Mietvertrag', datum: 7, verschluesselung: 'fpt1' }]
    };
    window.__tresor = { offen: true, gelesen: [] };
    window.Capacitor = { Plugins: {
      ProVault: {
        state: async () => ({ configured: false, unlocked: false }),
        tresorZustand: async () => ({ gewaehlt: true, offen: window.__tresor.offen, eingezogen: true, pruefung: 'PASST' }),
        tresorFach: async ({ fach }) => { window.__tresor.gelesen.push(fach); if (!window.__tresor.offen) throw { code: 'TRESOR_GESPERRT' }; return { fach, eintraege: faecher[fach] || [] }; }
      },
      ProDevice: { async getInfo() { return { platform: 'android', versionName: '1.0.43', nativeMail: true }; } }
    } };
  });
  await page.goto(origin);
  await page.waitForFunction(() => typeof CATALOG !== 'undefined' && window.ProUeberall && document.querySelector('#panel-search [data-pro-ue]'));
  await page.evaluate(() => {
    CATALOG.push({ hash: 'a'.repeat(64), name: 'Mietvertrag Wohnung', ext: 'pdf', type: 'application/pdf', date: Date.UTC(2026, 9, 1), size: 4096, snippet: 'Mietvertrag Wohnung Lindenweg', path: 'Dokumente/mietvertrag.pdf', tf: { mietvertrag: 2, wohnung: 2 }, vector: {}, nameTokens: ['mietvertrag', 'wohnung'], tags: [], dupes: [] });
    CATALOG.push({ hash: 'b'.repeat(64), name: 'Urlaub', ext: 'jpg', type: 'image/jpeg', date: Date.UTC(2026, 6, 1), size: 2048, snippet: '', path: 'Bilder/urlaub.jpg', tf: { urlaub: 2 }, vector: {}, nameTokens: ['urlaub'], tags: [], dupes: [] });
    window.__geoeffnet = []; window.openFile = async h => { window.__geoeffnet.push(h); };
    window.SbkimRendezvous = window.SbkimRendezvous || {};
    window.__netz = 0;
    window.SbkimRendezvous.discover = async () => ({ ok: true, cards: [{ nodeName: 'Büro-PC' }] });
    window.SbkimRendezvous.askNode = async () => { window.__netz++; return { ok: true, results: [{ label: 'Mietvertrag Lager · 2025', anchorId: 'n1' }] }; };
  });
  return { page, errors, context };
}
const gruppen = page => page.evaluate(() => [...document.querySelectorAll('#pbUeberall [data-pro-ue-gruppe]')].map(g => g.dataset.proUeGruppe + ':' + g.querySelectorAll('li').length));
try {
  const A = await seite();
  const { page } = A;
  ok('Kasten „Überall suchen“ steht auf der Suchseite vor der Trefferliste', await page.evaluate(() => {
    const k = document.getElementById('pbUeberall'), r = document.getElementById('results');
    return !!k && k.parentElement.id === 'panel-search' && !!(k.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING) && k.querySelector('h3').textContent === 'Überall suchen';
  }));
  ok('Kurzer Satz oben, Erklärung hinter ⓘ (zu), Haken: App, Tresorordner, Netz (aus)', await page.evaluate(() => {
    const k = document.getElementById('pbUeberall');
    return k.querySelector('.pro-ue-kurz').textContent === 'Dokumente finden in allen deinen verbundenen Programmen.' && k.querySelector('[data-pro-info-inhalt]').hidden
      && [...k.querySelectorAll('[data-pro-ue-quelle]')].map(c => c.dataset.proUeQuelle + '=' + c.checked).join() === 'app=true,tresor=true,netz=false';
  }));
  ok('Nutzt das Suchfeld oben (kein zweites Eingabefeld)', await page.evaluate(() => !document.querySelector('#pbUeberall input[type=search]')));
  await page.fill('#q', 'Mietvertrag');
  await page.click('#pbUeberall [data-pro-knopf="ueberall-suchen"]');
  await page.waitForFunction(() => /Treffer/.test(document.querySelector('#pbUeberall [data-pro-ue-status]').textContent));
  ok('Liste mit Herkunft: Katalog, Workflow PDF Pro, Eingang-BookLedgerPro', (await gruppen(page)).join() === 'app:1,tresor:workflow-pdf-pro:1,tresor:eingang-bookledgerpro:1');
  ok('Eigenes Fach „Private Brain“ wird nicht gelesen (das ist der Katalog)', await page.evaluate(() => !window.__tresor.gelesen.includes('private-brain') && window.__tresor.gelesen.includes('bookledgerpro')));
  ok('Netz ohne Haken nie gefragt', await page.evaluate(() => window.__netz === 0));
  ok('Zeilen anderer Apps sind kein Knopf, Katalogzeile schon', await page.evaluate(() =>
    document.querySelector('[data-pro-ue-gruppe="app"] .pro-ue-name').tagName === 'BUTTON' && document.querySelector('[data-pro-ue-gruppe="tresor:workflow-pdf-pro"] .pro-ue-name').tagName === 'SPAN'));
  ok('Fremdes Format sagt, wo es sich öffnet', await page.evaluate(() => /öffnen in Workflow PDF Pro/.test(document.querySelector('[data-pro-ue-gruppe="tresor:workflow-pdf-pro"] .pro-ue-stelle').textContent)));
  await page.click('[data-pro-ue-gruppe="app"] button.pro-ue-name');
  ok('Tipp auf die Katalogzeile öffnet die Datei (openFile)', await page.evaluate(() => window.__geoeffnet[0] === 'a'.repeat(64)));
  await page.evaluate(() => { window.__tresor.offen = false; });
  await page.click('#pbUeberall [data-pro-knopf="ueberall-suchen"]');
  await page.waitForFunction(() => /gesperrt/.test(document.querySelector('#pbUeberall [data-pro-ue-status]').textContent));
  ok('Tresorordner gesperrt: Katalog bleibt, ruhiger Hinweis', (await gruppen(page)).join() === 'app:1');
  await page.evaluate(() => { window.__tresor.offen = true; });
  await page.check('#pbUeberall [data-pro-ue-quelle="netz"]');
  await page.click('#pbUeberall [data-pro-knopf="ueberall-suchen"]');
  await page.waitForFunction(() => document.querySelector('#pbUeberall [data-pro-ue-gruppe="netz"]'));
  ok('Mit Haken „Netz“: andere Arbeitsplätze gefragt (Modul 23), Zeile nennt den Knoten', await page.evaluate(() => window.__netz === 1 && /von Büro-PC/.test(document.querySelector('[data-pro-ue-gruppe="netz"] .pro-ue-stelle').textContent)));
  await page.evaluate(() => { document.documentElement.lang = 'en'; });
  await page.evaluate(() => { document.documentElement.lang = 'de'; });
  // Leitfaden § 1.8: Schriftgröße „A··A“ im ☰-Menü (in der Kopfleiste bliebe am Handy kein Platz für das Siegel).
  await page.click('header .native-options > summary');
  await page.click('.native-options-panel [data-pro-schrift-knopf]');
  ok('A··A im ☰-Menü: Tipp lässt das Menü offen und zeigt den Regler', await page.evaluate(() => document.querySelector('header .native-options').open && !document.querySelector('.native-options-panel .pro-schrift-feld').hidden));
  await page.evaluate(() => { const r = document.querySelector('.native-options-panel .pro-schrift-feld input[type=range]'); r.value = '120'; r.dispatchEvent(new Event('input')); });
  ok('Regler 120 %: Grundschrift der App wächst', await page.evaluate(() => document.documentElement.style.fontSize === '120%'));
  await page.evaluate(() => ProBedienung.schriftSetzen(100));
  const java = await readFile(resolve('android/app/src/main/java/de/familyprojekt/privatebrain/pro/MainActivity.java'), 'utf8');
  ok('Android startet mit Schriftzoom 100 % (nicht der Systemschrift)', /getSettings\(\)\.setTextZoom\(100\);/.test(java));
  ok('Keine Seitenfehler', A.errors.length === 0 || (console.log(A.errors), false));
  await A.context.close();

  const B = await seite({ mitBruecke: false, breite: 360 });
  ok('Ohne Tresor-Brücke (PWA, Windows): kein Haken „Tresorordner“', await B.page.evaluate(() => [...document.querySelectorAll('#pbUeberall [data-pro-ue-quelle]')].map(c => c.dataset.proUeQuelle).join() === 'app,netz'));
  await B.page.fill('#q', 'Mietvertrag'); await B.page.click('#pbUeberall [data-pro-knopf="ueberall-suchen"]');
  await B.page.waitForFunction(() => /Treffer/.test(document.querySelector('#pbUeberall [data-pro-ue-status]').textContent));
  ok('… sucht dann nur im Katalog', (await gruppen(B.page)).join() === 'app:1');
  ok('360 px: nichts läuft quer hinaus, keine Seitenfehler', await B.page.evaluate(() => document.getElementById('pbUeberall').scrollWidth <= document.getElementById('pbUeberall').clientWidth + 1) && B.errors.length === 0);
  await B.context.close();
} finally { await browser.close(); }
console.log(count + ' Proben „Überall suchen“ und Schriftgröße in Private Brain Pro bestanden (Brücke und Mycel gestellt; nicht am Gerät).');
