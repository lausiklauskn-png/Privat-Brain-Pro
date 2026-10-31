// „Chefcode“ (Pro-Umbau 13, Klaus 2026-10-30: „Ja, Schritt 1+2“, „Chef legt fest, alle 3“): der gemeinsame Kasten
// (native/pro-chefcode.js) in den Einstellungen von Private Brain Pro, gegen das ECHTE Modul 23 (byte-1:1 aus Sage) im gebauten www/.
// Das Relais ist nicht erreichbar (nichts geht hinaus); geprüft wird, dass Modul 23 danach im eigenen Netz steht, dass der Code
// nirgends im Bild bleibt, dass zu kurze Codes nichts ändern und dass „Entfernen“ zurück ins öffentliche Netz führt.
// Dazu Fassung 2 von pro-ueberall.js: eigene Gruppen (`gruppe`) und der Rückruf nachSuche.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright-core';
const root = resolve('www'), origin = 'https://localhost/';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };
let count = 0; const ok = (name, value) => { assert.ok(value, name); console.log('✓ ' + name); count++; };

const js = await readFile(resolve('native/pro-chefcode.js'), 'utf8');
ok('Keine Emojis im Baustein', !/\p{Extended_Pictographic}/u.test(js.replace(/[↗©™®↔↕↺↻]/g, '')));
ok('Kein eigenes Netz, kein eigener Speicher: nur Modul 23 speichert (saveNetwork)', !/fetch\(|XMLHttpRequest|WebSocket|indexedDB|localStorage\.|console\./.test(js));
ok('Mindestlänge wie Modul 23 (12)', /const MIN = 12;/.test(js) && /NETZ_CODE_MIN = 12;/.test(await readFile(resolve('modules/23_rendezvous.js'), 'utf8')));

const browser = await chromium.launch({ executablePath: process.env.CB_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const context = await browser.newContext({ viewport: { width: 360, height: 900 } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', async route => {
    const url = route.request().url(); if (!url.startsWith(origin)) return route.abort();
    const path = resolve(root, '.' + new URL(url).pathname.replace(/\/$/, '/index.html'));
    if (!path.startsWith(root + '/')) return route.abort();
    try { return route.fulfill({ contentType: types[extname(path)] || 'application/octet-stream', body: await readFile(path) }); }
    catch { return route.fulfill({ status: 404, body: '' }); }
  });
  await page.addInitScript(() => { window.Capacitor = { Plugins: { ProDevice: { async getInfo() { return { platform: 'android', versionName: '1.0.43', nativeMail: true }; } } } }; });
  await page.goto(origin);
  await page.waitForFunction(() => window.ProChefcode && document.getElementById('pbChefcode') && window.SbkimRendezvous && typeof window.SbkimRendezvous.saveNetwork === 'function', null, { timeout: 30000 });
  ok('Kasten „Chefcode“ steht in den Einstellungen nach dem Mycel-Kasten, vor „Installieren“', await page.evaluate(() => {
    const k = document.getElementById('pbChefcode'), m = document.getElementById('mycelPlace'), i = document.getElementById('install-box');
    const nach = (a, b) => !a || !b || !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    return !!k.closest('#panel-settings') && nach(m, k) && nach(k, i) && k.querySelector('h3').textContent === 'Chefcode';
  }));
  ok('Ab Werk: öffentliches Netz, Erklärung hinter ⓘ (zu), „Entfernen“ nicht da', await page.evaluate(() => {
    const k = document.getElementById('pbChefcode');
    return k.querySelector('[data-pro-cc-lage]').dataset.proCcLage === 'oeffentlich' && k.querySelector('[data-pro-info-inhalt]').hidden
      && k.querySelector('[data-pro-knopf="chefcode-entfernen"]').hidden && ProChefcode.zustand(SbkimRendezvous).lage === 'oeffentlich';
  }));
  ok('Feld ist verdeckt (Passwort-Art), ohne Mikrofon', await page.evaluate(() => { const f = document.querySelector('[data-pro-cc-feld]'); return f.type === 'password' && 'keinMikro' in f.dataset && f.autocomplete === 'off'; }));
  await page.evaluate(() => { document.querySelector('[data-pro-cc-feld]').value = 'KURZ123'; document.querySelector('[data-pro-knopf="chefcode-uebernehmen"]').click(); });
  ok('Zu kurz: Satz „mindestens 12“, Netz bleibt öffentlich, nichts gespeichert', await page.evaluate(() =>
    /^Zu kurz: mindestens 12/.test(document.querySelector('[data-pro-cc-meldung]').textContent) && !ProChefcode.pruefen('ABCDEFGHJKL').ok && ProChefcode.pruefen('ABCDEFGHJKLM').ok && ProChefcode.zustand(SbkimRendezvous).lage === 'oeffentlich'
    && !SbkimRendezvous.readNetwork().present));
  await page.evaluate(() => { document.querySelector('[data-pro-cc-feld]').value = 'ÄÖÜ-ABCDEFGHIJKL'; document.querySelector('[data-pro-knopf="chefcode-uebernehmen"]').click(); });
  ok('Falsche Zeichen: eigener Satz, nichts gespeichert', await page.evaluate(() => /Nur Buchstaben/.test(document.querySelector('[data-pro-cc-meldung]').textContent) && !SbkimRendezvous.readNetwork().present));
  const code = 'buero-mueller-2026-kasse';
  await page.evaluate(c => { document.querySelector('[data-pro-cc-feld]').value = c; document.querySelector('[data-pro-knopf="chefcode-uebernehmen"]').click(); }, code);
  await page.waitForFunction(() => document.querySelector('[data-pro-cc-lage]').dataset.proCcLage === 'eigen', null, { timeout: 20000 });
  ok('Gültiger Code: Modul 23 steht im eigenen Netz (Raum-Marke aus dem Code)', await page.evaluate(() => SbkimRendezvous._meta.network === 'eigen' && /^sbkim-netzq-/.test(SbkimRendezvous._meta.queryTag)));
  ok('Gespeichert von Modul 23 unter „Chefcode“, normalisiert (ohne Bindestriche, groß)', await page.evaluate(() => { const s = SbkimRendezvous.readNetwork(); return s.ok && s.setting.name === 'Chefcode' && s.setting.code === 'BUEROMUELLER2026KASSE' && /^wss:\/\//.test(s.setting.relay); }));
  ok('Der Code steht danach nirgends im Bild (Feld leer, nicht in Text oder Attributen)', await page.evaluate(() =>
    document.querySelector('[data-pro-cc-feld]').value === '' && !/BUEROMUELLER|buero-mueller/i.test(document.body.innerText + document.body.innerHTML)));
  ok('„Entfernen“ ist jetzt da, Zustand „Eigenes Netz mit Chefcode“', await page.evaluate(() => !document.querySelector('[data-pro-knopf="chefcode-entfernen"]').hidden && /Eigenes Netz mit Chefcode/.test(document.querySelector('[data-pro-cc-lage]').textContent)));
  ok('Hat die App vorher geantwortet, antwortet sie im neuen Netz wieder; sonst bleibt es aus', await page.evaluate(async () => {
    const stell = an => { const r = { n: 0, _meta: { answering: an }, readNetwork: () => ({ present: false }), saveNetwork: x => ({ ok: true, setting: x }),
      applyNetwork: async () => ({ ok: true }), clearNetwork: () => ({ ok: true }), enableAnswering: async () => { r.n++; return { ok: true }; } }; return r; };
    const a = stell(true), b = stell(false);
    await ProChefcode.setzen(a, 'ABCDEFGHJKLMN'); await ProChefcode.setzen(b, 'ABCDEFGHJKLMN'); await ProChefcode.entfernen(a);
    return a.n === 2 && b.n === 0;
  }));
  // Wechsel: neuer Code ersetzt den alten sofort
  const marke1 = await page.evaluate(() => SbkimRendezvous._meta.queryTag);
  await page.evaluate(() => { document.querySelector('[data-pro-cc-feld]').value = 'NEUERCODE2026XYZ'; document.querySelector('[data-pro-knopf="chefcode-uebernehmen"]').click(); });
  await page.waitForFunction(m => SbkimRendezvous._meta.queryTag !== m && SbkimRendezvous._meta.network === 'eigen', marke1, { timeout: 20000 });
  ok('Neuer Code gilt sofort, alter Raum ist verlassen', await page.evaluate(m => SbkimRendezvous._meta.queryTag !== m && SbkimRendezvous.readNetwork().setting.code === 'NEUERCODE2026XYZ', marke1));
  await page.evaluate(() => document.querySelector('[data-pro-knopf="chefcode-entfernen"]').click());
  await page.waitForFunction(() => document.querySelector('[data-pro-cc-lage]').dataset.proCcLage === 'oeffentlich');
  ok('Entfernen: zurück ins öffentliche Netz, Einstellung gelöscht', await page.evaluate(() => SbkimRendezvous._meta.network === 'oeffentlich' && !SbkimRendezvous.readNetwork().present && /entfernt/.test(document.querySelector('[data-pro-cc-meldung]').textContent)));
  ok('360 px: nichts läuft quer hinaus', await page.evaluate(() => { const k = document.getElementById('pbChefcode'); return k.scrollWidth <= k.clientWidth + 1; }));
  await page.evaluate(() => { document.documentElement.lang = 'en'; });
  ok('Englisch: ProChefcode.wort spricht Englisch', await page.evaluate(() => ProChefcode.wort('titel') === 'Boss code'));
  await page.evaluate(() => { document.documentElement.lang = 'de'; });

  // pro-ueberall.js Fassung 2: eigene Gruppen der App und nachSuche
  const g = await page.evaluate(async () => {
    const erg = await ProUeberall.suchen('Angebot Meier', { app: () => [{ id: 'a', name: 'Angebot Meier', typ: 'beleg' }, { id: 'c', name: 'Angebot Meier (Planer)', typ: 'angebot', gruppe: 'Angebotsplaner' }], quellen: { tresor: false } });
    return ProUeberall.gruppieren(erg.treffer).map(x => x.schluessel + ':' + x.liste.length + ':' + (x.gruppe || '')).join();
  });
  ok('Überall suchen: Zeilen mit `gruppe` stehen in eigener Gruppe direkt nach der App', g === 'app:1:,app:Angebotsplaner:1:Angebotsplaner');
  ok('Überall suchen: Fassung 2', await page.evaluate(() => ProUeberall.FASSUNG === 2));
  ok('Keine Seitenfehler', errors.length === 0 || (console.log(errors), false));
  await context.close();
} finally { await browser.close(); }
console.log(count + ' Proben „Chefcode“ in Private Brain Pro bestanden (echtes Modul 23, kein Relais; nicht am Gerät).');
