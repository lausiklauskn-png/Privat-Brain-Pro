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
    for (const r of CATALOG) { const tk = tokens(r.name + ' ' + (r.snippet || '')); r.tf = termFreq(tk); r.vector = buildVector(tk); HASHSET.add(r.hash); } rebuildIndex();
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
  // Klaus 2026-11-16 (Gerätetest 1.0.52, V1): kein eigener Kasten mehr. Eine Suche, eine Liste; die Treffer der anderen Programme
  // stehen als Gruppen unter der Trefferliste. Vorher füllte „Suchen“ nur die Liste im Kasten, die große Liste blieb leer.
  ok('Kein Kasten „Überall suchen“ mehr vor der Trefferliste; der Bereich der anderen Programme steht darunter und ist anfangs leer', await page.evaluate(() => {
    const k = document.getElementById('pbUeberall'), r = document.getElementById('results');
    return !!k && k.hidden && !k.querySelector('h3') && !!(r.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING);
  }));
  ok('Suchfeld mit × (nur bei Text) und Lupe; „Bildbeschreibung“, „Bedeutung“ und „Überall“ (mit Pfeil für die Quellen, kein zweites Zahnrad) in einer Reihe direkt unter dem Suchfeld', await page.evaluate(() => {
    const f = document.querySelector('#panel-search .pb-such-feld'), box = document.getElementById('pb-bild-row') || document.getElementById('pbSuchReihe');
    return !!f && f.contains(document.getElementById('q')) && document.getElementById('pbSuchLeeren').hidden && !!document.getElementById('pbSuchLos').getAttribute('aria-label')
      && box.contains(document.getElementById('mode')) && !document.querySelector('#panel-search .searchbox #mode') && box.contains(document.getElementById('pbUeberallKnopf')) && box.contains(document.getElementById('pbUeberallRad')) && document.getElementById('pbUeberallKnopf').getAttribute('aria-pressed') === 'true';
  }));
  ok('Quellen stehen hinter dem Pfeil am Knopf „Überall“ (zu): Private Brain fest, Tresorordner an, Netz aus', await page.evaluate(() => {
    const q = document.getElementById('pbUeberallQuellen');
    return q.hidden && !q.getClientRects().length && getComputedStyle(document.getElementById('pbSuchLos')).backgroundColor !== getComputedStyle(document.getElementById('pbSuchLeeren')).backgroundColor && [...q.querySelectorAll('[data-pro-ue-quelle]')].map(c => c.dataset.proUeQuelle + '=' + c.checked + (c.disabled ? '!' : '')).join() === 'app=true!,tresor=true,netz=false';
  }));
  ok('Filter tragen Namen, Sortierung steht am Ende, kein doppeltes „Text/Notiz“', await page.evaluate(() => {
    const namen = [...document.querySelectorAll('#filterbar .pb-filter')].map(l => l.dataset.pbFilter + ':' + l.querySelector('small').textContent).join();
    const art = [...document.querySelectorAll('#fType option')].map(o => o.textContent).join();
    return namen === 'art:Art,kategorie:Kategorie,zeitraum:Zeitraum,tag:Tag,sortieren:Sortieren' && document.querySelector('#filterbar').lastElementChild.dataset.pbFilter === 'sortieren'
      && art === 'Alle,Dokumente,Notizen,Fotos und Bilder,Tabellen';
  }));
  ok('Flach und gleichmäßig: Reihe unter dem Suchfeld und alle Filter 32 px hoch, Suchfeld 34 px, Filter stehen auf einer Linie', await page.evaluate(() => {
    const h = n => Math.round(n.getBoundingClientRect().height), reihe = [document.getElementById('pb-bild-filter'), document.querySelector('#mode [data-m="mean"]'), document.getElementById('pbUeberallKnopf'), document.getElementById('pbUeberallRad')].filter(Boolean);
    const filter = [...document.querySelectorAll('#filterbar .pb-filter, #filterbar > button')].filter(n => n.getClientRects().length);
    return reihe.every(n => h(n) === 32) && filter.every(n => h(n) === 32) && h(document.querySelector('#panel-search .pb-such-feld')) === 34 && new Set(reihe.map(n => Math.round(n.getBoundingClientRect().top))).size === 1;
  }));
  await page.evaluate(() => { document.getElementById('q').value = 'Mietvertrag'; });   // wie nach dem Diktat: Text steht da, noch nichts gesucht
  await page.click('#pbSuchLos');
  await page.waitForFunction(() => /Treffer/.test(document.querySelector('#pbUeberall [data-pro-ue-status]').textContent));
  ok('Lupe füllt die große Trefferliste (vorher blieb sie leer)', await page.evaluate(() => document.querySelectorAll('#results li').length >= 1 && /Mietvertrag Wohnung/.test(document.getElementById('results').textContent)));
  ok('Darunter mit Herkunft: Workflow PDF Pro, Eingang-BookLedgerPro (diese App steht nur in der Liste oben)', (await gruppen(page)).join() === 'tresor:workflow-pdf-pro:1,tresor:eingang-bookledgerpro:1');
  ok('Eigenes Fach „Private Brain“ wird nicht gelesen (das ist der Katalog)', await page.evaluate(() => !window.__tresor.gelesen.includes('private-brain') && window.__tresor.gelesen.includes('bookledgerpro')));
  ok('Netz ohne Haken nie gefragt', await page.evaluate(() => window.__netz === 0));
  ok('Zeilen anderer Apps sind kein Knopf', await page.evaluate(() => document.querySelector('[data-pro-ue-gruppe="tresor:workflow-pdf-pro"] .pro-ue-name').tagName === 'SPAN'));
  ok('Fremdes Format sagt, wo es sich öffnet', await page.evaluate(() => /öffnen in Workflow PDF Pro/.test(document.querySelector('[data-pro-ue-gruppe="tresor:workflow-pdf-pro"] .pro-ue-stelle').textContent)));
  ok('Enter im Suchfeld sucht ebenfalls', await (async () => { await page.fill('#q', 'Mietvertrag'); await page.evaluate(() => { document.querySelector('#pbUeberall [data-pro-ue-liste]').replaceChildren(); }); await page.press('#q', 'Enter');
    await page.waitForFunction(() => document.querySelector('#pbUeberall [data-pro-ue-gruppe]')); return true; })());
  await page.evaluate(() => { window.__tresor.offen = false; });
  await page.click('#pbSuchLos');
  await page.waitForFunction(() => /gesperrt/.test(document.querySelector('#pbUeberall [data-pro-ue-status]').textContent));
  ok('Tresorordner gesperrt: Trefferliste bleibt, ruhiger Hinweis', (await gruppen(page)).join() === '' && await page.evaluate(() => document.querySelectorAll('#results li').length >= 1));
  await page.evaluate(() => { window.__tresor.offen = true; });
  await page.click('#pbUeberallRad');
  await page.check('#pbUeberallQuellen [data-pro-ue-quelle="netz"]');
  await page.click('#pbSuchLos');
  await page.waitForFunction(() => document.querySelector('#pbUeberall [data-pro-ue-gruppe="netz"]'));
  ok('Mit Haken „Netz“: andere Arbeitsplätze gefragt (Modul 23), Zeile nennt den Knoten', await page.evaluate(() => window.__netz === 1 && /von Büro-PC/.test(document.querySelector('[data-pro-ue-gruppe="netz"] .pro-ue-stelle').textContent)));
  await page.click('#pbSuchLeeren');
  ok('× leert das Feld, die Gruppen der anderen Programme und verschwindet wieder', await page.evaluate(() => document.getElementById('q').value === '' && document.getElementById('pbSuchLeeren').hidden && document.getElementById('pbUeberall').hidden && document.activeElement === document.getElementById('q')));
  await page.click('#pbUeberallKnopf');
  await page.fill('#q', 'Mietvertrag'); await page.evaluate(() => { window.__netz = 0; window.__tresor.gelesen = []; }); await page.click('#pbSuchLos'); await page.waitForTimeout(300);
  ok('„Überall“ aus: nur diese App, Tresor und Netz werden nicht gefragt', await page.evaluate(() => document.getElementById('pbUeberall').hidden && window.__netz === 0 && window.__tresor.gelesen.length === 0 && document.querySelectorAll('#results li').length >= 1));
  await page.click('#pbUeberallKnopf');
  await page.evaluate(() => { document.documentElement.lang = 'en'; });
  ok('Englisch: Filter und Knöpfe übersetzt', await page.evaluate(() => document.querySelector('#filterbar [data-pb-filter="zeitraum"] small').textContent === 'Period' && document.getElementById('pbUeberallKnopf').textContent === 'Everywhere'));
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
  ok('Ohne Tresor-Brücke (PWA, Windows): kein Haken „Tresorordner“', await B.page.evaluate(() => [...document.querySelectorAll('#pbUeberallQuellen [data-pro-ue-quelle]')].map(c => c.dataset.proUeQuelle).join() === 'app,netz'));
  await B.page.fill('#q', 'Mietvertrag'); await B.page.click('#pbSuchLos'); await B.page.waitForTimeout(300);
  ok('… sucht dann nur im Katalog', await B.page.evaluate(() => document.getElementById('pbUeberall').hidden && document.querySelectorAll('#results li').length >= 1));
  ok('360 px: nichts läuft quer hinaus, keine Seitenfehler', await B.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector('#panel-search .searchbox').scrollWidth <= document.querySelector('#panel-search .searchbox').clientWidth + 1) && B.errors.length === 0);
  await B.context.close();
} finally { await browser.close(); }
console.log(count + ' Proben „Überall suchen“ und Schriftgröße in Private Brain Pro bestanden (Brücke und Mycel gestellt; nicht am Gerät).');
