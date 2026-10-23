// Erklärvideo Private Brain Pro (Klaus 2026-10-23: „genauso wie Workflow PDF mit dem Finger").
// Die ECHTE App (www-Bau von Privat-Brain-Pro) läuft auf der Bühne (buehne.html), die Comic-Hand fährt zu echten
// Knöpfen, jeder Klick ist ein echter Mausklick. Beispieldaten sind erfunden. Gerätefunktionen (Mail, Version) sind
// nachgestellt, weil im Browser kein Android läuft.
//
//   node aufnahme.mjs --probe        Anfang + Dateien hinzufügen + Suchen
//   node aufnahme.mjs                ganzes Video
//   node aufnahme.mjs --dev          ohne Aufnahme, nur Standbilder an den Szenenenden (zum Bauen)
import { chromium } from '/home/user/Privat-Brain-Pro/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { starteServer } from './server.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(process.env.APP || '/home/user/Privat-Brain-Pro/www');
const probe = process.argv.includes('--probe'), dev = process.argv.includes('--dev');
const NAME = probe ? 'probe' : 'quer';
const W = 1920, H = 1080;
const ZIEL = path.join(HIER, '_roh', NAME);
fs.rmSync(ZIEL, { recursive: true, force: true }); fs.mkdirSync(path.join(ZIEL, 'bilder'), { recursive: true });
const BSP = path.join(HIER, 'beispiel');
const DATEIEN = ['Rechnung-Zahnarzt-2026-09.pdf', 'Mietvertrag-Wohnung.pdf', 'Strand-Binz.jpg', 'Sonnenuntergang.jpg', 'Einkaufsliste.txt', 'Rezept-Apfelkuchen.txt'].map(f => path.join(BSP, f));

const { srv, url } = await starteServer(HIER, APP);
const browser = await chromium.launch({ executablePath: process.env.CB_CHROMIUM, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, locale: 'de-DE' });
await ctx.route('**/*', r => r.request().url().startsWith(url) ? r.continue() : r.abort());
await ctx.addInitScript(() => {
  if (!location.pathname.startsWith('/app/')) return;
  const acc = { id: '11111111-1111-4111-8111-111111111111', email: 'jens@example.invalid', provider: 'telekom' };
  const now = Date.now(), h = 3600e3;
  const inbox = [['Ihre Rechnung Oktober', 'Stadtwerke Musterstadt', 1], ['Termin bestätigt: Zahnarzt Dr. Weiß', 'Praxis Dr. Weiß', 3], ['Fotos vom Wochenende', 'Anna', 5],
    ['Ihr Paket ist unterwegs', 'Paketdienst', 8], ['Angebot Ferienwohnung Ostsee', 'Ferienhof Sonnenblick', 20], ['Protokoll Elternabend', 'Grundschule am Park', 26],
    ['Versicherungsschein 2027', 'Hausrat Plus', 30], ['Einladung Grillfest', 'Familie Berger', 50], ['Newsletter Oktober', 'Gartencenter Grün', 60]];
  const acc2 = { id: '22222222-2222-4222-8222-222222222222', email: 'familie@example.invalid', provider: 'webde' };
  const inbox2 = [['Fotos vom Wochenende', 'Anna', 4], ['Einladung Grillfest', 'Familie Berger', 9], ['Zeugnis Schuljahr', 'Grundschule am Park', 30], ['Ihre Rechnung Oktober', 'Stadtwerke Musterstadt', 33], ['Reiseplan Ostsee', 'Ferienhof Sonnenblick', 70]];
  window.__mail = { T: { INBOX: 128, Spam: 2, Trash: 6 } };
  window.Capacitor = { isNativePlatform: () => true, Plugins: {
    ProDevice: { async getInfo() { return { platform: 'android', versionName: '1.0.0-preview.28', nativeMail: true }; } },
    ProVault: new Proxy({ async state() { return { configured: true, unlocked: true, location: 'sdcard', folder: 'Private Brain', reachable: true, attachments: 3, attachmentBytes: 4.2e6 }; },
      async volumes() { return { items: [] }; } }, { get: (o, k) => o[k] || (async () => ({ items: [], ok: true })) }),
    ProNetwork: { async getState() { return { offline: false }; }, async setOffline({ offline }) { return { offline }; } },
    ProMail: {
      async accounts() { return { items: [acc, acc2] }; },
      async index(a) { if (a.folder !== 'INBOX') return { validity: '1', items: [], next: null };
        const L = a.account === acc.id ? inbox : inbox2;
        return { validity: '1', next: null, items: L.map(([s, f, x], i) => ({ uid: 100 - i, messageId: `<${a.account.slice(0, 4)}-${i}@example.invalid>`, subject: s, from: `${f} <${f.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14)}@example.invalid>`, to: a.account === acc.id ? acc.email : acc2.email, date: now - x * h, flags: ['\\Seen'], size: 20000 })) }; },
      async indexText(a) { return { items: a.uids.map(uid => ({ uid, text: 'Guten Tag, anbei die Informationen. Freundliche Grüße', html: '', attachments: false })) }; },
      async folders() { const T = window.__mail.T; return { items: [{ path: 'INBOX', name: 'INBOX', specialUse: '\\Inbox', total: T.INBOX, unread: 3 }, { path: 'Sent', name: 'Sent', specialUse: '\\Sent', total: 42 }, { path: 'Drafts', name: 'Drafts', specialUse: '\\Drafts', total: 1 }, { path: 'Spam', name: 'Spam', specialUse: '\\Junk', total: T.Spam }, { path: 'Trash', name: 'Papierkorb', specialUse: '\\Trash', total: T.Trash }, { path: 'Urlaub', name: 'Urlaub', specialUse: '', total: 14 }] }; },
      async messages(a) { if (a.folder === 'Trash') return { validity: '2', total: window.__mail.T.Trash, next: null, items: [{ uid: 5, subject: 'Newsletter Oktober', from: 'Gartencenter Grün <post@example.invalid>', date: now - 60 * h, flags: ['\\Seen'], size: 9000 }] };
        return { validity: '1', total: 128, next: null, items: inbox.map(([s, f, x], i) => ({ uid: 100 - i, subject: s, from: f + ' <post@example.invalid>', date: now - x * h, flags: i < 3 ? [] : ['\\Seen'], size: 20000 })) }; },
      async message() { return { subject: 'Termin bestätigt: Zahnarzt Dr. Weiß', from: 'Praxis Dr. Weiß <post@example.invalid>', to: acc.email, messageId: '<t@example.invalid>', text: 'Guten Tag,\n\nwir bestätigen Ihren Termin am Dienstag, 4. November, um 9:30 Uhr.\nBitte bringen Sie Ihre Versichertenkarte mit.\n\nFreundliche Grüße\nIhre Praxis Dr. Weiß', attachments: [] }; },
      async action() { return { ok: true }; }, async actions(a) { const T = window.__mail.T; if (a.action === 'move' && a.target in T) { T[a.target] += a.uids.length; if (a.folder in T) T[a.folder] -= a.uids.length; } return { ok: true, done: a.uids.length, missing: 0 }; },
      async saved() { return { items: [] }; }, async savedDraft() { return null; } } } };
});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  [Seitenfehler]', String(e).slice(0, 160)));
page.on('dialog', d => d.accept());
await page.goto(`${url}/buehne.html?w=${W}&h=${H}`);
await page.waitForFunction(() => window.__bereit);
await page.evaluate(u => B.laden(u), `${url}/app/index.html`);
const app = page.frames().find(f => f.url().includes('/app/'));
await app.waitForFunction(() => window.PBWorkspace && typeof db !== 'undefined' && db);
await app.waitForTimeout(800);

// ── Aufnahme: CDP-Screencast, jedes Bild mit seinem Zeitstempel ──
const cdp = await ctx.newCDPSession(page);
const bilder = []; let nr = 0, laeuft = false;
cdp.on('Page.screencastFrame', async f => {
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  if (!laeuft) return;
  const datei = `b${String(nr++).padStart(6, '0')}.jpg`;
  fs.writeFileSync(path.join(ZIEL, 'bilder', datei), Buffer.from(f.data, 'base64'));
  bilder.push({ datei, t: f.metadata.timestamp });
});
const start = async () => { if (dev) return; laeuft = true; await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 }); };
const stop = async () => { if (dev) return; await cdp.send('Page.stopScreencast'); laeuft = false; };

// ── Werkzeuge fürs Drehbuch (wie Workflow PDF) ──
const warte = ms => page.waitForTimeout(ms >= 1200 ? ms * .7 : ms);   // Ruhepausen um 30 % kürzer (Länge 2–3 min)
const text = async html => { await page.evaluate(h => B.text(h), html); await warte(250); };
const kapitel = (n, t) => page.evaluate(([n, t]) => B.kapitel(n, t), [n, t]);
const rect = sel => page.evaluate(s => B.rect(s), sel);
const szenen = [];
const szene = async n => { szenen.push({ n, t: await page.evaluate(() => (performance.timeOrigin + performance.now()) / 1000) }); };
const standbild = async n => { if (dev) await page.screenshot({ path: path.join(ZIEL, `stand-${n}.jpg`), type: 'jpeg', quality: 70 }); };
async function warteAuf(sel, ms = 30000) { await app.waitForSelector(sel, { state: 'visible', timeout: ms }); }
async function insBild(sel) {
  await warteAuf(sel);
  const bewegt = await app.evaluate(s => {
    const el = document.querySelector(s); const r = el.getBoundingClientRect();
    const aussen = r.top < 60 || r.bottom > innerHeight - 10;
    if (aussen) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return aussen;
  }, sel);
  if (bewegt) await warte(900);
}
let gezoomt = false;
async function ruhigesRect(sel) {   // warten, bis die Kamerafahrt steht (unter Last dauert sie länger)
  let a = await rect(sel);
  for (let i = 0; i < 30; i++) { await warte(80); const b = await rect(sel); if (Math.abs(a.x - b.x) < .5 && Math.abs(a.y - b.y) < .5 && Math.abs(a.w - b.w) < .5) return b; a = b; }
  return a;
}
async function tippe(sel, { vorher = 250, nachher = 700, dx = 0, dy = 0, lesen = 0 } = {}) {
  await warteAuf(sel); await insBild(sel);
  if (lesen) {   // Klaus: „der Zoom muss so sein, dass er lesen kann, das wird jetzt gerade gemacht“
    if (gezoomt) { await page.evaluate(() => B.zoom(null)); gezoomt = false; await warte(1100); }
    const r0 = await rect(sel); await page.evaluate(([r, f]) => B.zoom(r, f), [{ x: r0.x - 120, y: r0.y - 40, w: r0.w + 240, h: r0.h + 80 }, lesen]); gezoomt = true; await warte(1150); await ruhigesRect(sel);
  }
  const r = await rect(sel);
  const x = r.x + r.w / 2 + dx, y = r.y + r.h * 0.62 + dy;
  await page.evaluate(([x, y]) => B.handZu(x, y), [x, y]);
  await warte(vorher);
  await page.evaluate(() => B.druck());
  await page.mouse.click(x, y);
  await warte(nachher);
}
async function zeige(sel, { halten = 900 } = {}) {   // nur hinzeigen, nicht klicken
  await warteAuf(sel); await insBild(sel);
  const r = await rect(sel);
  await page.evaluate(([x, y]) => B.handZu(x, y), [r.x + r.w / 2, r.y + r.h * 0.7]);
  await warte(halten);
}
async function tippeText(sel, wort) {
  await tippe(sel, { nachher: 250, lesen: 1.9 });
  await app.evaluate(s => { const e = document.querySelector(s); e.value = ''; e.dispatchEvent(new Event('input', { bubbles: true })); }, sel);
  for (const z of wort) { await page.keyboard.type(z); await warte(55); }
  await warte(450);
}
const karte = (html, rein, raus, halten, klasse) => page.evaluate(a => B.karte(...a), [html, rein, raus, halten, klasse]);
const kartenWeg = raus => page.evaluate(r => B.kartenWeg(r), raus);
const zoom = async (sel, f) => { if (sel && gezoomt) { await page.evaluate(() => B.zoom(null)); await warte(1100); } const r = sel ? await rect(sel) : null; await page.evaluate(([r, f]) => B.zoom(r, f), [r, f]); gezoomt = !!sel; };
const handWeg = () => page.evaluate(() => B.handWeg());
// Element per Text markieren (data-film), damit Hand und Zoom es finden
async function markiere(sel, text, name) {
  const ok = await app.evaluate(([sel, text, name]) => { const el = [...document.querySelectorAll(sel)].find(e => e.getClientRects().length && (!text || e.textContent.includes(text))); if (el) el.dataset.film = name; return !!el; }, [sel, text, name]);
  if (!ok) throw new Error(`nicht gefunden: ${sel} «${text}»`);
  return `[data-film="${name}"]`;
}

// ── Seitenwechsel (Klaus 2026-10-23): heranzoomen, damit man liest, was angetippt wird; dann setzt sich die neue
//    Seite als Puzzle zusammen, jedes Mal anders. Während die Bilder geholt werden, ruht die Aufnahme kurz.
let wechselNr = 0;
const schirmBild = async () => 'data:image/jpeg;base64,' + (await page.locator('#schirm').screenshot({ type: 'jpeg', quality: 92 })).toString('base64');
async function ohneAufnahme(f) { const war = laeuft; laeuft = false; await page.evaluate(() => { document.getElementById('hand').style.visibility = 'hidden'; document.getElementById('puzzle').style.visibility = 'hidden'; });
  try { return await f(); } finally { await page.evaluate(() => { document.getElementById('hand').style.visibility = ''; document.getElementById('puzzle').style.visibility = ''; });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); laeuft = war; } }
async function seitenwechsel(sel, { faktor = 2.3, warteNeu = 450 } = {}) {
  await warteAuf(sel); if (gezoomt) { await zoom(null); await warte(1150); } await insBild(sel); await warte(150);
  const alt = await ohneAufnahme(schirmBild);
  const r = await rect(sel);
  const pad = { x: r.x - 150, y: r.y - 45, w: r.w + 300, h: r.h + 90 };
  await page.evaluate(([r, f]) => B.zoom(r, f), [pad, faktor]); gezoomt = true;
  await warte(1000);
  const z = await ruhigesRect(sel); const x = z.x + z.w / 2, y = z.y + z.h * .62;
  await page.evaluate(([x, y]) => B.handZu(x, y), [x, y]); await warte(250);
  await page.evaluate(u => B.wechselAlt(u), alt);
  const vorher = await app.evaluate(() => document.body.innerHTML.length + '|' + (document.querySelector('.tab.on')?.dataset.tab || ''));
  await page.evaluate(() => B.druck()); await page.mouse.click(x, y);
  await warte(250);
  // Sicherheitsnetz: traf der Tipp nicht (die alte Seite liegt noch als Bild darüber), den Knopf direkt drücken
  if (await app.evaluate(v => document.body.innerHTML.length + '|' + (document.querySelector('.tab.on')?.dataset.tab || '') === v, vorher)) { console.log('  ↻ Tipp nachgeholt:', sel); await app.click(sel, { force: true }).catch(() => {}); }
  await warte(warteNeu);
  if (process.env.DEBUG) { await page.screenshot({ path: path.join(ZIEL, `klick-${wechselNr}.jpg`), type: 'jpeg', quality: 60 }); console.log('klick', sel, x, y, JSON.stringify(await app.evaluate(([x, y]) => { const el = document.elementFromPoint(1, 1); return document.querySelector('.tab.on')?.dataset.tab; }, [x, y]))); }
  const neu = await ohneAufnahme(async () => {
    await page.mouse.move(8, H - 8);
    const vor = await page.evaluate(() => { B.wechselVerbergen(true); return B.kameraSofort(''); });
    const bild = await schirmBild();
    await page.evaluate(v => { B.kameraSofort(v); B.wechselVerbergen(false); B.kameraWeich(); }, vor);
    return bild; });
  const G = await page.evaluate(() => window.__geraet);
  await handWeg();
  await page.evaluate(() => B.zoom(null)); gezoomt = false;
  await page.evaluate(([u, a, ox, oy]) => B.wechselPuzzle(u, a, ox, oy), [neu, wechselNr++, r.x + r.w / 2 - G.gx - 22, r.y + r.h / 2 - G.gy - 22]);
  await warte(200);
}
const sicher = async (n, f) => { try { await f(); } catch (e) { console.log(`  ⚠ Szene ${n}:`, String(e).split('\n')[0]); await standbild('fehler-' + n); } };

// ── Drehbuch ──
async function szeneAnfang() {
  await szene('Anfang');
  await karte(`<div class="floh hopst"></div><h1 class="auf">Private Brain <span>Pro</span></h1>
    <p class="auf">So funktioniert es · in sieben Kapiteln</p>`, 'blende', null, 1900);
  await kartenWeg('fliessen');
}
async function szeneDateien() {
  await szene('Dateien hinzufügen');
  await kapitel('1', 'Dateien hinzufügen');
  await text('Mails, Dokumente, Fotos, Notizen: <b>alles an einem Ort</b>');
  await warte(1300);
  await seitenwechsel('[data-tab="intake"]');
  await text('„Dateien wählen“ — <b>die Originale bleiben unverändert</b>');
  await warte(900);
  const [wahl] = await Promise.all([page.waitForEvent('filechooser'), tippe('#pickFiles', { nachher: 200, lesen: 2.2 })]);
  await wahl.setFiles(DATEIEN);
  await handWeg();
  await text('Jede Datei wird <b>einmal gelesen und geprüft</b>');
  await app.waitForFunction(n => typeof CATALOG !== 'undefined' && CATALOG.length >= n && !window.signing, DATEIEN.length, { timeout: 90000 });
  await insBild('#pbImportDone');
  await text('Danach steht da, <b>wo alles hingekommen ist</b>');
  await zoom('#pbImportDone', 1.4);
  await warte(3200);
  await standbild('dateien');
  await zoom(null);
  await warte(1000);
}
async function szeneSuchen() {
  await szene('Suchen');
  await kapitel('2', 'Suchen');
  await text('Suchen wie man denkt: <b>„Rechnung vom Zahnarzt“</b>');
  await seitenwechsel('[data-tab="search"]');
  await tippeText('#q', 'Rechnung vom Zahnarzt');
  await page.keyboard.press('Enter');
  await handWeg();
  await warte(1200);
  await text('Oder klassisch nach dem <b>Namen</b>: ein Tipp schaltet um');
  const nm = await markiere('#mode button, #mode *', 'Namenssuche', 'namens');
  await zeige(nm, { halten: 1400 });
  await zeige('#mic', { halten: 400 });
  await text('Mit 🎤 einfach <b>sprechen</b> statt tippen');
  await warte(1600);
  await handWeg();
  await zoom('#results', 1.3);
  await text('Die Suche nach <b>Bedeutung</b> findet auch, was anders heißt');
  await warte(3400);
  await standbild('suchen');
  await zoom(null);
  await warte(1000);
}

if (process.argv.includes('--erkunde')) {
  const [wahl] = await Promise.all([page.waitForEvent('filechooser'), (async () => { await app.click('[data-tab="intake"]'); await app.click('#pickFiles'); })()]);
  await wahl.setFiles(DATEIEN);
  await app.waitForFunction(n => CATALOG.length >= n && !window.signing, DATEIEN.length, { timeout: 90000 });
  const dump = async n => { await warte(1500); await page.screenshot({ path: path.join(ZIEL, `e-${n}.jpg`), type: 'jpeg', quality: 60 });
    const t = await app.evaluate(() => [...document.querySelectorAll('button,a,[role=button],summary,.explorer-folder,[data-live-uid],h2,h3')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height && r.top < innerHeight; }).slice(0, 90).map(e => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${[...e.classList].join('.')}${Object.keys(e.dataset).map(k => `[${k}=${e.dataset[k]}]`).join('')} «${(e.textContent || e.title || '').trim().replace(/\s+/g, ' ').slice(0, 40)}»`).join('\n'));
    fs.writeFileSync(path.join(ZIEL, `e-${n}.txt`), t); };
  for (const tab of ['explorer', 'mail', 'dash', 'dupes', 'order', 'settings']) { await app.click(`[data-tab="${tab}"]`); await dump(tab); }
  await app.click('[data-tab="mail"]'); await app.click('#mailWorkspace [data-live-text="connect"]').catch(() => {}); await dump('mail2');
  await browser.close(); srv.close(); process.exit(0);
}
async function szeneExplorer() {
  await szene('Explorer');
  await kapitel('3', 'Explorer');
  await seitenwechsel('[data-tab="explorer"]');
  await text('Der Explorer ordnet alles <b>von selbst</b>');
  await zoom('#explorerTree', 1.6);
  await warte(2200);
  await zoom(null);
  await tippe('.explorer-folder[data-path="kind:photo"]', { nachher: 1000 });
  await text('Ein Tipp öffnet den Ordner, noch einer die Datei');
  const auf = await markiere('#explorerFiles button', 'Öffnen', 'oeffnen');
  await tippe(auf, { nachher: 1800 });
  await standbild('explorer');
  await text('Das <b>Original</b> bleibt dabei unverändert');
  await warte(2000);
  await page.keyboard.press('Escape'); await warte(300);
  await app.evaluate(() => document.querySelector('#lightboxClose')?.click());
  await warte(800);
}
async function szenePruefen() {
  await szene('Prüfen');
  await kapitel('4', 'Prüfen');
  await text('Jede Datei bekommt eine <b>Prüfmarke</b>');
  const marke = await markiere('#explorerFiles .pb-check-badge', '', 'marke');
  await zeige(marke, { halten: 1200 });
  await seitenwechsel(marke, { faktor: 2.0 });
  await text('Der Prüfbericht sagt <b>in einfachen Worten</b>, was geprüft ist und was nicht');
  await standbild('pruefen');
  await warte(3200);
  await page.keyboard.press('Escape'); await warte(700);
}
async function szeneMail() {
  await szene('Postfach');
  await kapitel('5', 'Postfach');
  await seitenwechsel('[data-tab="mail"]');
  if (await app.$('#mailWorkspace [data-live-text="connect"]').then(e => e && e.isVisible())) await tippe('#mailWorkspace [data-live-text="connect"]', { nachher: 1500 });
  await text('Deine Mail-Konten, <b>direkt vom Gerät</b>, ohne fremden Server');
  await warte(1600);
  await tippe('[data-live-uid="99"]', { nachher: 1500, lesen: 1.9 });
  await text('Lesen, antworten, aufräumen: <b>Löschen geht in den Papierkorb</b> deines Anbieters');
  await standbild('mail');
  await warte(2600);
  const alle = await markiere('#mailWorkspace button, #mailWorkspace a, #mailWorkspace li', 'Alle Konten', 'alle');
  await tippe(alle, { nachher: 1000 });
  const abruf = await markiere('#mailWorkspace button', 'abrufen', 'abruf');
  await tippe(abruf, { nachher: 3000 });
  await text('„Alle Konten“: <b>jede Mail aus jedem Konto</b> an einem Ort, nach Absender gebündelt');
  await standbild('allekonten');
  await warte(3000);
}
async function szeneUebersicht() {
  await szene('Übersicht');
  await kapitel('6', 'Übersicht');
  await seitenwechsel('[data-tab="dash"]');
  await text('Die Übersicht zählt mit: Einträge, Kategorien, <b>Doppelte</b>');
  await zoom('#panel-dash', 1.15);
  await warte(2600);
  await zoom(null);
}
async function szenePrivat() {
  await szene('Privat');
  await kapitel('6', 'Privat');
  await seitenwechsel('[data-tab="settings"]');
  await text('Eigener Speicherort: Tablet oder SD-Karte, <b>mit deinem Passwort verschlüsselt</b>');
  await insBild('#vault-choose');
  const karte = await app.evaluate(() => { const b = document.querySelector('#vault-choose'); let c = b; while (c && c.parentElement && c.getBoundingClientRect().width < 900) c = c.parentElement; c.dataset.film = 'vault'; return true; });
  await zoom('[data-film="vault"]', 1.2);
  await warte(3000);
  await standbild('privat');
  await zoom(null);
  await text('Die Lampe oben: <b>ein Tipp trennt die App vom Internet</b>');
  await tippe('.native-net-lamp', { nachher: 1600, lesen: 2.4 });
  await standbild('lampe');
  await tippe('.native-net-lamp', { nachher: 1000 });
}
async function szeneWerkzeuge() {
  await szene('Werkzeuge');
  await kapitel('7', 'Werkzeuge');
  await text('Im Menü ☰ warten <b>weitere Apps</b> aus der Familie');
  const menue = await markiere('summary', 'App-Menü', 'menue');
  await seitenwechsel(menue, { faktor: 2.2 });
  await standbild('werkzeuge');
  await warte(2600);
  const auf = async () => { if (!await app.evaluate(() => [...document.querySelectorAll('details')].some(d => d.open && d.textContent.includes('Mycel')))) await tippe(menue, { nachher: 900 }); };
  await text('Vier Sprachen: <b>Deutsch, English, Русский, Polski</b>');
  await tippe('button[data-lang="en"]', { nachher: 2200, lesen: 2.2 });
  await standbild('englisch');
  await auf();
  await tippe('button[data-lang="de"]', { nachher: 1200 });
  await auf();
  await text('Hell oder <b>dunkel</b>, wie es deinen Augen guttut');
  await tippe('#themeToggle', { nachher: 2400 });
  await standbild('dunkel');
  await auf();
  await tippe('#themeToggle', { nachher: 1000 });
  if (await app.evaluate(() => [...document.querySelectorAll('details')].some(d => d.open && d.textContent.includes('Mycel')))) await tippe(menue, { nachher: 600 });

}
async function szeneSchluss() {
  await szene('Schluss');
  await handWeg();
  await karte(`<div class="floh hopst"></div><h1 class="auf">Private Brain <span>Pro</span></h1>
    <p class="auf">Deine Daten bleiben bei dir · in Heimarbeit gebaut</p>`, 'iris', null, 3800);
}

await start();
await szeneAnfang();
await szeneDateien();
await szeneSuchen();
if (!probe) {
  await sicher('explorer', szeneExplorer);
  await sicher('pruefen', szenePruefen);
  await sicher('mail', szeneMail);
  await sicher('privat', szenePrivat);
  await sicher('werkzeuge', szeneWerkzeuge);
  await szeneSchluss();
}
if (probe) { await karte(`<div class="floh"></div><h1 class="auf">Private Brain <span>Pro</span></h1><p class="auf">Probeclip · Fortsetzung folgt</p>`, 'irisMitte', null, 2200); }
await stop();
const klicks = await page.evaluate(() => (window.__klicks || []).map(k => performance.timeOrigin + k));
const puzzle = await page.evaluate(() => (window.__puzzleTon || []).map(k => (performance.timeOrigin + k) / 1000));
fs.writeFileSync(path.join(ZIEL, 'zeiten.json'), JSON.stringify({ W, H, bilder, klicks: klicks.map(k => k / 1000), puzzle, szenen }, null, 1));
console.log(`${NAME}: ${bilder.length} Bilder, ${klicks.length} Klicks → ${ZIEL}`);
await browser.close(); srv.close();
