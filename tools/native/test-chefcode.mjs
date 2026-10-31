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
ok('Kein Netz außer Modul 23; eigener Speicher nur für den Prüfwert der Chef-PIN (pro_chef_v1_), nie Code oder PIN', !/fetch\(|XMLHttpRequest|WebSocket|indexedDB|console\./.test(js)
  && /SPEICHER_PRAEFIX = 'pro_chef_v1_'/.test(js) && !/setItem\([^)]*(code|pin)\b/i.test(js.replace(/rec\.\w+/g, '')));
ok('PIN: PBKDF2-SHA-256 mit 600 000 Runden und eigenem Salz', /PIN_RUNDEN = 600000/.test(js) && /name: 'PBKDF2', salt: salz, iterations: PIN_RUNDEN, hash: 'SHA-256'/.test(js) && /getRandomValues\(new Uint8Array\(16\)\)/.test(js));
ok('Fassung 2', /const FASSUNG = 2;/.test(js));
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
  const K = '#pbChefcode ';
  const meldung = (p = page) => p.$eval(K + '[data-pro-cc-meldung]', n => n.textContent);
  const da = (sel, p = page) => p.evaluate(s => !!document.querySelector('#pbChefcode ' + s), sel);
  async function tipp(name, bis, p = page) {
    await p.evaluate(() => { document.querySelector('#pbChefcode [data-pro-cc-meldung]').textContent = ''; });
    await p.$eval(K + `[data-pro-knopf="${name}"]`, b => b.click());
    await p.waitForFunction(bis || (() => document.querySelector('#pbChefcode [data-pro-cc-meldung]').textContent !== ''), null, { timeout: 30000 });
  }
  const schluessel = await page.evaluate(() => 'pro_chef_v1_' + (SbkimRendezvous._meta.dbSuffix || 'app'));
  const eintrag = (p = page) => p.evaluate(k => localStorage.getItem(k), schluessel);
  const PIN = '482913', CODE = 'buero-mueller-2026-kasse';

  ok('Ab Werk: öffentliches Netz, kein Code-Feld, kein Entfernen; Wahl „Ich bin der Chef“ / „Mit Zettel beitreten“', await page.evaluate(() => {
    const k = document.getElementById('pbChefcode');
    return k.querySelector('[data-pro-cc-lage]').dataset.proCcLage === 'oeffentlich' && k.querySelector('[data-pro-info-inhalt]').hidden
      && !k.querySelector('[data-pro-cc-feld]') && !k.querySelector('[data-pro-knopf="chefcode-entfernen"]')
      && !!k.querySelector('[data-pro-knopf="chefcode-chef"]') && !!k.querySelector('[data-pro-knopf="chefcode-zettel"]') && ProChefcode.zustand(SbkimRendezvous).pin === false;
  }));
  await page.$eval(K + '[data-pro-knopf="chefcode-chef"]', b => b.click());
  await page.waitForSelector(K + '[data-pro-cc-pin2]', { state: 'attached' });
  ok('Chef-Formular: PIN, PIN wiederholen, Code — alle verdeckt, ohne Mikrofon, PIN mit Zifferntastatur', await page.evaluate(() => {
    const f = ['[data-pro-cc-pin]', '[data-pro-cc-pin2]', '[data-pro-cc-feld]'].map(s => document.querySelector('#pbChefcode ' + s));
    return f.every(x => x && x.type === 'password' && 'keinMikro' in x.dataset && x.autocomplete === 'off') && f[0].inputMode === 'numeric';
  }));
  await page.$eval(K + '[data-pro-cc-pin]', (f, v) => { f.value = v; }, '12345'); await page.$eval(K + '[data-pro-cc-pin2]', (f, v) => { f.value = v; }, '12345'); await page.$eval(K + '[data-pro-cc-feld]', (f, v) => { f.value = v; }, CODE);
  await tipp('chefcode-uebernehmen');
  ok('PIN zu kurz: Satz „6 bis 12“, nichts gespeichert', /6 bis 12/.test(await meldung()) && !(await eintrag()) && !(await page.evaluate(() => SbkimRendezvous.readNetwork().present)));
  await page.$eval(K + '[data-pro-cc-pin]', (f, v) => { f.value = v; }, PIN); await page.$eval(K + '[data-pro-cc-pin2]', (f, v) => { f.value = v; }, '482914'); await page.$eval(K + '[data-pro-cc-feld]', (f, v) => { f.value = v; }, CODE);
  await tipp('chefcode-uebernehmen');
  ok('PINs ungleich: eigener Satz, nichts gespeichert', /nicht gleich/.test(await meldung()) && !(await eintrag()));
  await page.$eval(K + '[data-pro-cc-pin]', (f, v) => { f.value = v; }, PIN); await page.$eval(K + '[data-pro-cc-pin2]', (f, v) => { f.value = v; }, PIN); await page.$eval(K + '[data-pro-cc-feld]', (f, v) => { f.value = v; }, 'KURZ123');
  await tipp('chefcode-uebernehmen');
  ok('Code zu kurz: Satz „mindestens 12“, weder PIN noch Netz gespeichert', /^Zu kurz: mindestens 12/.test(await meldung()) && !(await eintrag()) && !(await page.evaluate(() => SbkimRendezvous.readNetwork().present))
    && await page.evaluate(() => !ProChefcode.pruefen('ABCDEFGHJKL').ok && ProChefcode.pruefen('ABCDEFGHJKLM').ok && !ProChefcode.pinPruefen('12a456').ok && ProChefcode.pinPruefen('123456').ok));
  await page.$eval(K + '[data-pro-cc-pin]', (f, v) => { f.value = v; }, PIN); await page.$eval(K + '[data-pro-cc-pin2]', (f, v) => { f.value = v; }, PIN); await page.$eval(K + '[data-pro-cc-feld]', (f, v) => { f.value = v; }, CODE);
  await tipp('chefcode-uebernehmen', () => document.querySelector('#pbChefcode [data-pro-cc-lage]').dataset.proCcLage === 'eigen' && document.querySelector('#pbChefcode [data-pro-cc-meldung]').textContent !== '');
  ok('Chef eingerichtet: Modul 23 im eigenen Netz (Raum-Marke aus dem Code), gespeichert unter „Chefcode“, normalisiert', await page.evaluate(() => {
    const s = SbkimRendezvous.readNetwork(); return SbkimRendezvous._meta.network === 'eigen' && /^sbkim-netzq-/.test(SbkimRendezvous._meta.queryTag) && s.ok && s.setting.name === 'Chefcode' && s.setting.code === 'BUEROMUELLER2026KASSE';
  }));
  const rec = JSON.parse(await eintrag());
  ok('Gespeichert ist nur der Prüfwert der PIN (Salz 16 B, Wert 32 B, Rolle Chef) — weder PIN noch Code', rec && rec.rolle === 'chef' && atob(rec.s).length === 16 && atob(rec.h).length === 32
    && !JSON.stringify(rec).includes(PIN) && !/BUERO|MUELLER/i.test(JSON.stringify(rec)));
  ok('Weder Code noch PIN stehen danach im Bild (Felder leer, nicht in Text oder Attributen)', await page.evaluate(p => {
    const h = document.body.innerText + document.body.innerHTML; return !/BUEROMUELLER|buero-mueller/i.test(h) && !h.includes(p) && [...document.querySelectorAll('#pbChefcode input[type=password]')].every(i => i.value === '');
  }, PIN));
  ok('Entsperrt: Zustand „gehört dem Chef“, Knöpfe Zettel · PIN ändern · Entfernen · Sperren', await page.evaluate(() => {
    const k = document.getElementById('pbChefcode');
    return k.dataset.proCcOffen === 'ja' && /dem Chef/.test(k.querySelector('[data-pro-cc-lage]').textContent)
      && ['chefcode-zettel-bauen', 'chefcode-pin-aendern', 'chefcode-entfernen', 'chefcode-sperren'].every(n => k.querySelector(`[data-pro-knopf="${n}"]`));
  }));
  await page.$eval(K + '[data-pro-knopf="chefcode-zettel-bauen"]', b => b.click());
  await page.waitForSelector(K + '[data-pro-cc-zettel-ausgabe] textarea', { state: 'attached' });
  const zettel1 = await page.$eval(K + '[data-pro-cc-zettel-ausgabe] textarea', t => t.value);
  ok('Beitritts-Zettel: „CHEF1-…“, lesbar zurück auf denselben Code und denselben Prüfwert, ohne den Code im Klartext', /^CHEF1-[A-Za-z0-9_-]{80,}$/.test(zettel1) && !/BUEROMUELLER/.test(zettel1)
    && await page.evaluate(async ([z, r]) => { const l = await ProChefcode.zettelLesen(z); return l.ok && l.code === 'BUEROMUELLER2026KASSE' && l.pin.s === r.s && l.pin.h === r.h; }, [zettel1, rec]));
  ok('Verdorbener Zettel (ein Byte im PIN-Prüfwert anders, Aufbau sonst heil) wird an der Prüfsumme abgelehnt', await page.evaluate(async z => {
    const t = z.slice(6).replace(/-/g, '+').replace(/_/g, '/'), roh = atob(t + '==='.slice((t.length + 3) % 4)), u = Uint8Array.from(roh, c => c.charCodeAt(0));
    u[2 + u[1] + 16 + 5] ^= 1;
    const neu = 'CHEF1-' + btoa(String.fromCharCode(...u)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const l = await ProChefcode.zettelLesen(neu); return neu !== z && !l.ok && l.grund === 'zettelFalsch';
  }, zettel1));
  await page.$eval(K + '[data-pro-knopf="chefcode-sperren"]', b => b.click());
  await page.waitForFunction(() => document.getElementById('pbChefcode').dataset.proCcOffen === 'nein');
  ok('Gesperrt: kein Code-Feld, kein Entfernen, kein Zettel im Bild; nur PIN-Feld und „Entsperren“', await page.evaluate(z => {
    const k = document.getElementById('pbChefcode');
    return !k.querySelector('[data-pro-cc-feld]') && !k.querySelector('[data-pro-knopf="chefcode-entfernen"]') && !document.body.innerHTML.includes(z)
      && !!k.querySelector('[data-pro-cc-pin]') && !!k.querySelector('[data-pro-knopf="chefcode-entsperren"]');
  }, zettel1));
  ok('Gesperrt: auch über die Schnittstelle weder ändern, entfernen, Zettel bauen noch neu einrichten', await page.evaluate(async () => {
    const r = SbkimRendezvous;
    const a = await ProChefcode.setzen(r, 'ANDERERCODE2026'), b = await ProChefcode.entfernen(r), c = await ProChefcode.zettelBauen(r);
    const d = await ProChefcode.chefEinrichten(r, { pin: '111111', pin2: '111111', code: 'ANDERERCODE2026' });
    return a.grund === 'gesperrt' && b.grund === 'gesperrt' && c.grund === 'gesperrt' && d.grund === 'pinDa' && r.readNetwork().setting.code === 'BUEROMUELLER2026KASSE';
  }));
  for (let i = 0; i < 5; i++) { await page.$eval(K + '[data-pro-cc-pin]', (f, v) => { f.value = v; }, '000000'); await tipp('chefcode-entsperren'); }
  ok('Fünf falsche PINs: „Chef-PIN falsch“, dann Wartezeit; bleibt gesperrt', /falsch/.test(await meldung()) && /warten/.test(await meldung())
    && JSON.parse(await eintrag()).bis > Date.now() && await page.evaluate(() => document.getElementById('pbChefcode').dataset.proCcOffen === 'nein'));
  await page.$eval(K + '[data-pro-cc-pin]', (f, v) => { f.value = v; }, PIN); await tipp('chefcode-entsperren');
  ok('Während der Wartezeit hilft auch die richtige PIN nicht', /warten/.test(await meldung()) && await page.evaluate(() => document.getElementById('pbChefcode').dataset.proCcOffen === 'nein'));
  await page.evaluate(k => { const r = JSON.parse(localStorage.getItem(k)); r.f = 0; r.bis = 0; localStorage.setItem(k, JSON.stringify(r)); }, schluessel);   // Probe: Wartezeit abkürzen
  await page.$eval(K + '[data-pro-cc-pin]', (f, v) => { f.value = v; }, PIN); await tipp('chefcode-entsperren', () => document.getElementById('pbChefcode').dataset.proCcOffen === 'ja');
  ok('Richtige PIN entsperrt (Fehlzähler zurück auf 0)', JSON.parse(await eintrag()).f === 0);
  const marke1 = await page.evaluate(() => SbkimRendezvous._meta.queryTag);
  await page.$eval(K + '[data-pro-cc-feld]', (f, v) => { f.value = v; }, 'NEUERCODE2026XYZ');
  await tipp('chefcode-uebernehmen', () => document.querySelector('#pbChefcode [data-pro-cc-meldung]').textContent !== '');
  await page.waitForFunction(m => SbkimRendezvous._meta.queryTag !== m && SbkimRendezvous._meta.network === 'eigen', marke1, { timeout: 20000 });
  ok('Neuer Code (entsperrt) gilt sofort, alter Raum ist verlassen', await page.evaluate(() => SbkimRendezvous.readNetwork().setting.code === 'NEUERCODE2026XYZ'));
  await page.$eval(K + '[data-pro-knopf="chefcode-zettel-bauen"]', b => b.click());
  await page.waitForSelector(K + '[data-pro-cc-zettel-ausgabe] textarea', { state: 'attached' });
  const zettel2 = await page.$eval(K + '[data-pro-cc-zettel-ausgabe] textarea', t => t.value);
  ok('Neuer Zettel trägt den neuen Code', zettel2 !== zettel1 && await page.evaluate(async z => (await ProChefcode.zettelLesen(z)).code === 'NEUERCODE2026XYZ', zettel2));

  // Mitarbeiter-Gerät: eigener Speicher (zweiter Kontext)
  const ctx2 = await browser.newContext({ viewport: { width: 360, height: 900 } });
  const m = await ctx2.newPage(), mErr = [];
  m.on('pageerror', e => mErr.push(e.message));
  await m.route('**/*', async route => {
    const url = route.request().url(); if (!url.startsWith(origin)) return route.abort();
    const path = resolve(root, '.' + new URL(url).pathname.replace(/\/$/, '/index.html'));
    if (!path.startsWith(root + '/')) return route.abort();
    try { return route.fulfill({ contentType: types[extname(path)] || 'application/octet-stream', body: await readFile(path) }); }
    catch { return route.fulfill({ status: 404, body: '' }); }
  });
  await m.addInitScript(() => { window.Capacitor = { Plugins: { ProDevice: { async getInfo() { return { platform: 'android', versionName: '1.0.43', nativeMail: true }; } } } }; });
  await m.goto(origin);
  await m.waitForFunction(() => window.ProChefcode && document.getElementById('pbChefcode') && window.SbkimRendezvous && typeof window.SbkimRendezvous.saveNetwork === 'function', null, { timeout: 30000 });
  await m.$eval(K + '[data-pro-knopf="chefcode-zettel"]', b => b.click());
  await m.waitForSelector(K + '[data-pro-cc-zettel]', { state: 'attached' });
  await m.$eval(K + '[data-pro-cc-zettel]', (f, v) => { f.value = v; }, zettel2.slice(0, -4));
  await tipp('chefcode-beitreten', null, m);
  ok('Mitarbeiter: unvollständiger Zettel → klarer Satz, nichts gespeichert', /kein gültiger/.test(await meldung(m)) && !(await eintrag(m)) && !(await m.evaluate(() => SbkimRendezvous.readNetwork().present)));
  await m.$eval(K + '[data-pro-cc-zettel]', (f, v) => { f.value = v; }, zettel2);
  await tipp('chefcode-beitreten', () => document.querySelector('#pbChefcode [data-pro-cc-lage]').dataset.proCcLage === 'eigen' && document.querySelector('#pbChefcode [data-pro-cc-meldung]').textContent !== '', m);
  ok('Mitarbeiter tritt mit dem Zettel bei: dieselbe Raum-Marke wie der Chef', await m.evaluate(() => SbkimRendezvous._meta.queryTag) === await page.evaluate(() => SbkimRendezvous._meta.queryTag));
  ok('Mitarbeiter: Rolle „beigetreten“, gesperrt, kein Code-Feld, kein Entfernen, Code und Zettel nirgends im Bild', await m.evaluate(z => {
    const k = document.getElementById('pbChefcode'), h = document.body.innerText + document.body.innerHTML;
    return k.dataset.proCcRolle === 'mitarbeiter' && k.dataset.proCcOffen === 'nein' && /beigetreten/.test(k.querySelector('[data-pro-cc-lage]').textContent)
      && !k.querySelector('[data-pro-cc-feld]') && !k.querySelector('[data-pro-knopf="chefcode-entfernen"]') && !/NEUERCODE/.test(h) && !h.includes(z);
  }, zettel2));
  ok('Mitarbeiter: ohne Chef-PIN weder ändern noch entfernen (Schnittstelle)', await m.evaluate(async () => {
    const a = await ProChefcode.setzen(SbkimRendezvous, 'MEINCODE20261234'), b = await ProChefcode.entfernen(SbkimRendezvous);
    return a.grund === 'gesperrt' && b.grund === 'gesperrt' && SbkimRendezvous.readNetwork().setting.code === 'NEUERCODE2026XYZ';
  }));
  await m.$eval(K + '[data-pro-knopf="chefcode-zettel"]', b => b.click());
  await m.waitForSelector(K + '[data-pro-cc-zettel]', { state: 'attached' });
  await m.$eval(K + '[data-pro-cc-zettel]', (f, v) => { f.value = v; }, zettel1);
  await tipp('chefcode-beitreten', null, m);
  ok('Mitarbeiter: einen neuen Zettel des Chefs nimmt das Gerät ohne PIN an (Codewechsel ohne Gang zu jedem Gerät)', await m.evaluate(() => SbkimRendezvous.readNetwork().setting.code === 'BUEROMUELLER2026KASSE' && document.getElementById('pbChefcode').dataset.proCcOffen === 'nein'));
  await m.$eval(K + '[data-pro-cc-pin]', (f, v) => { f.value = v; }, PIN); await tipp('chefcode-entsperren', () => document.getElementById('pbChefcode').dataset.proCcOffen === 'ja', m);
  ok('Am Mitarbeiter-Gerät entsperrt die Chef-PIN (Prüfwert kam mit dem Zettel)', true);
  await tipp('chefcode-entfernen', () => document.querySelector('#pbChefcode [data-pro-cc-lage]').dataset.proCcLage === 'oeffentlich', m);
  ok('Chef entfernt am Mitarbeiter-Gerät: öffentlich, Prüfwert weg', !(await eintrag(m)) && await m.evaluate(() => !SbkimRendezvous.readNetwork().present && SbkimRendezvous._meta.network === 'oeffentlich'));
  ok('Mitarbeiter-Gerät: keine Seitenfehler', mErr.length === 0 || (console.log(mErr), false));
  await ctx2.close();

  // Chef: PIN ändern, alte gilt nicht mehr
  await page.$eval(K + '[data-pro-knopf="chefcode-pin-aendern"]', b => b.click());
  await page.waitForSelector(K + '[data-pro-cc-pin2]', { state: 'attached' });
  await page.$eval(K + '[data-pro-cc-pin]', (f, v) => { f.value = v; }, '77665544'); await page.$eval(K + '[data-pro-cc-pin2]', (f, v) => { f.value = v; }, '77665544');
  await tipp('chefcode-pin-neu');
  ok('Chef-PIN geändert, Satz nennt den neuen Zettel', /neuen Zettel/.test(await meldung()));
  await page.$eval(K + '[data-pro-knopf="chefcode-sperren"]', b => b.click());
  await page.waitForFunction(() => document.getElementById('pbChefcode').dataset.proCcOffen === 'nein');
  await page.$eval(K + '[data-pro-cc-pin]', (f, v) => { f.value = v; }, PIN); await tipp('chefcode-entsperren');
  ok('Alte PIN entsperrt nicht mehr', /falsch/.test(await meldung()));
  await page.$eval(K + '[data-pro-cc-pin]', (f, v) => { f.value = v; }, '77665544'); await tipp('chefcode-entsperren', () => document.getElementById('pbChefcode').dataset.proCcOffen === 'ja');
  ok('Neue PIN entsperrt', true);
  await tipp('chefcode-entfernen', () => document.querySelector('#pbChefcode [data-pro-cc-lage]').dataset.proCcLage === 'oeffentlich');
  ok('Entfernen: zurück ins öffentliche Netz, Einstellung und Prüfwert gelöscht', await page.evaluate(() => SbkimRendezvous._meta.network === 'oeffentlich' && !SbkimRendezvous.readNetwork().present) && !(await eintrag()) && /entfernt/.test(await meldung()));

  // Netz aus Fassung 1 (Code ohne PIN): nur der Zustand, „Chef-PIN festlegen“ ohne Code-Feld
  await page.evaluate(async () => { const r = SbkimRendezvous; const s = r.saveNetwork({ name: 'Chefcode', relay: 'wss://relay.family-projekt.de', code: 'ALTERCODE2026AB', auto: true }); await r.applyNetwork(s.setting); window.PBChefcode.zeichnen(); });
  await page.waitForFunction(() => document.querySelector('#pbChefcode [data-pro-cc-lage]').dataset.proCcLage === 'eigen');
  ok('Netz aus Fassung 1: Satz „noch ohne Chef-PIN“, kein Code-Feld, kein Entfernen', await page.evaluate(() => {
    const k = document.getElementById('pbChefcode');
    return /noch ohne Chef-PIN/.test(k.querySelector('[data-pro-cc-lage]').textContent) && !k.querySelector('[data-pro-cc-feld]') && !k.querySelector('[data-pro-knopf="chefcode-entfernen"]')
      && /Chef-PIN festlegen/.test(k.querySelector('[data-pro-knopf="chefcode-chef"]').textContent);
  }));
  await page.$eval(K + '[data-pro-knopf="chefcode-chef"]', b => b.click());
  await page.waitForSelector(K + '[data-pro-cc-pin2]', { state: 'attached' });
  ok('… das Formular fragt nur die PIN, nicht den Code', !(await da('[data-pro-cc-feld]')));
  await page.$eval(K + '[data-pro-cc-pin]', (f, v) => { f.value = v; }, PIN); await page.$eval(K + '[data-pro-cc-pin2]', (f, v) => { f.value = v; }, PIN);
  await tipp('chefcode-uebernehmen');
  ok('PIN festgelegt: Rolle Chef, Code unverändert', /festgelegt/.test(await meldung()) && JSON.parse(await eintrag()).rolle === 'chef' && await page.evaluate(() => SbkimRendezvous.readNetwork().setting.code === 'ALTERCODE2026AB'));
  await tipp('chefcode-entfernen', () => document.querySelector('#pbChefcode [data-pro-cc-lage]').dataset.proCcLage === 'oeffentlich');

  ok('Hat die App vorher geantwortet, antwortet sie im neuen Netz wieder; sonst bleibt es aus', await page.evaluate(async () => {
    const stell = an => { const r = { n: 0, _meta: { answering: an, dbSuffix: 'probe' + Math.random().toString(36).slice(2) }, readNetwork: () => ({ present: false }), saveNetwork: x => ({ ok: true, setting: x }),
      applyNetwork: async () => ({ ok: true }), clearNetwork: () => ({ ok: true }), enableAnswering: async () => { r.n++; return { ok: true }; } }; return r; };
    const a = stell(true), b = stell(false);
    await ProChefcode.chefEinrichten(a, { pin: '123456', pin2: '123456', code: 'ABCDEFGHJKLMN' }); await ProChefcode.chefEinrichten(b, { pin: '123456', pin2: '123456', code: 'ABCDEFGHJKLMN' });
    await ProChefcode.entfernen(a);
    return a.n === 2 && b.n === 0;
  }));
  ok('360 px: nichts läuft quer hinaus', await page.evaluate(() => { const k = document.getElementById('pbChefcode'); return k.scrollWidth <= k.clientWidth + 1; }));
  await page.evaluate(() => { document.documentElement.lang = 'en'; });
  ok('Englisch: ProChefcode.wort spricht Englisch', await page.evaluate(() => ProChefcode.wort('titel') === 'Boss code' && ProChefcode.wort('ichChef') === 'I am the boss'));
  await page.evaluate(() => { document.documentElement.lang = 'de'; });
  ok('Jedes einzeilige Wort (≥ 50) in allen fünf Sprachen', [...js.matchAll(/^    (\w+):\s*\[(.*)\],?$/gm)].length >= 50 && [...js.matchAll(/^    (\w+):\s*\[(.*)\],?$/gm)].every(x => (x[2].match(/'(?:[^'\\]|\\.)*'/g) || []).length === 5));

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
