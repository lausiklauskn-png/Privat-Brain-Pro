// Beweis: das Mikrofon der Pinnwand hört die Sprache, die gesprochen wird —
// nicht immer Deutsch. Und ein Fehler wird SICHTBAR, statt lautlos zu
// verschwinden.
//
// Klaus 2026-08-11: „wenn ich in Arabisch etwas hineinspreche, muss auch
// Arabisch als Text herauskommen." Und die Nachfrage: „wird auch in Paschtu /
// Afghanisch …?"
//
// Vorher stand hier fest `rec.lang = 'de-DE'` UND `rec.onerror` war LEER. Für
// jeden, der kein Deutsch spricht, war das Mikrofon damit doppelt kaputt: es
// hörte die falsche Sprache und sagte kein Wort darüber. Von den drei
// baugleichen Pinnwänden (Kimboard, Sage, hier) war diese die stillste.
//
// GEPRÜFT WIRD DIE TAT, NICHT DER WORTLAUT: eine eigene SpeechRecognition wird
// eingehängt, die mitschreibt, welches `lang` das Widget WIRKLICH gesetzt hat.
// Ein Blick in den Quelltext („steht da `micLang`?") würde auch dann grün
// melden, wenn die Zuweisung nie ausgeführt wird.
//
// Sabotage-Probe gemacht: `rec.lang` wieder fest auf 'de-DE' → drei Proben rot.
//
// EHRLICHE EINORDNUNG: die Browser-Spracherkennung hat KEINE Sprach-Erkennung.
// Sie hört genau die Sprache, die man ihr sagt; eine abfragbare Liste der
// gekonnten Sprachen gibt es nicht. Man kann eine Sprache nur anbieten und dann
// sauber sagen, wenn es nicht ging — darum die Fehler-Probe unten.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const EXEC = process.env.CB_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html','.json':'application/json','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2' };
const server = createServer(async (req,res)=>{ try{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html';
  const b=await readFile(join(ROOT,p)); res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'}); res.end(b);
} catch{ res.writeHead(404); res.end('nf'); }});
await new Promise(r=>server.listen(0,r));
const PORT = server.address().port;

// Der Spion: schreibt jedes `lang` mit, mit dem eine Aufnahme startet, und kann
// auf Wunsch einen Fehler werfen (Testschalter `__fehlerAls`).
const SPION = `
  window.__gehoert = [];
  window.__fehlerAls = null;
  window.__ergebnis = null;        // Testschalter: dieses Ergebnis liefern
  window.SpeechRecognition = function () {
    this.start = function () {
      window.__gehoert.push(this.lang);
      if (this.onstart) this.onstart();
      if (window.__ergebnis !== null && this.onresult) {
        this.onresult({ results: [[{ transcript: window.__ergebnis }]] });
      }
      if (window.__fehlerAls && this.onerror) this.onerror({ error: window.__fehlerAls });
      if ((window.__ergebnis !== null || window.__fehlerAls) && this.onend) this.onend();
    };
    this.stop = function () { if (this.onend) this.onend(); };
  };
  window.webkitSpeechRecognition = window.SpeechRecognition;
`;

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
let pass = 0, fail = 0;
const ok = (n, c, x='') => { (c ? pass++ : fail++); console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`); };

async function seite(locale) {
  const ctx = await browser.newContext({ locale });
  await ctx.addInitScript(SPION);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  return { ctx, page, errors };
}

// 1) Die Geräte-Sprache entscheidet vor — OHNE dass jemand etwas einstellt.
//    Das ist der Fall, der zählt: wer erst eine Einstellung finden muss, um
//    verstanden zu werden, benutzt das Mikrofon nicht.
//    `ja-JP` ist die Gegenprobe für „Sprache nicht in der Liste": dann bleibt
//    Deutsch — ehrliche Vorgabe statt Raten.
for (const [locale, erwartet] of [['de-DE','de-DE'], ['ar-EG','ar-SA'], ['ps-AF','ps-AF'], ['ru-RU','ru-RU'], ['ja-JP','de-DE']]) {
  const { ctx, page, errors } = await seite(locale);
  const r = await page.evaluate(() => {
    if (!window.PBPinnwand) return { da:false };
    window.PBPinnwand.open();
    const s = document.getElementById('pbpin-miclang');
    const m = document.getElementById('pbpin-mic');
    if (m) m.click();
    const q = document.getElementById('pbpin-qmsg');
    return { da:true, anzahl: s ? s.options.length : 0, wahl: s ? s.value : null,
             dir: q ? q.getAttribute('dir') : null, gehoert: window.__gehoert[0] || null };
  });
  ok(`Gerät ${locale} → Mikrofon hört ${r.gehoert}`, r.da && r.gehoert === erwartet, 'erwartet ' + erwartet);
  if (locale === 'de-DE') {
    ok('zwölf Sprachen zur Wahl (mit Paschtu und Dari)', r.anzahl >= 12, String(r.anzahl));
    ok('Frage-Feld hat inhalts-abhängige Leserichtung', r.dir === 'auto', String(r.dir));
    ok('keine Seiten-Fehler', errors.length === 0, errors[0] || '');
  }
  await ctx.close();
}

// 2) Umschalten wirkt ab dem nächsten Antippen.
{
  const { ctx, page } = await seite('de-DE');
  const r = await page.evaluate(async () => {
    window.PBPinnwand.open();
    const s = document.getElementById('pbpin-miclang');
    const m = document.getElementById('pbpin-mic');
    m.click();                                   // startet auf Deutsch
    m.click();                                   // Umschalter: stoppt wieder
    s.value = 'ar-SA'; s.dispatchEvent(new Event('change'));
    m.click();                                   // jetzt muss Arabisch kommen
    return window.__gehoert;
  });
  ok('nach dem Umschalten hört das Mikrofon Arabisch', r[r.length-1] === 'ar-SA', String(r));
  await ctx.close();
}

// 3) Kann der Browser die Sprache NICHT, erscheint ein SATZ — und er bleibt
//    stehen. Vorher verschwand jeder Fehler lautlos (`onerror` war leer); und
//    selbst wenn dort etwas gestanden hätte, hätte `updateSendState()` es im
//    selben Wimpernschlag mit dem Verbindungs-Status überschrieben.
{
  const { ctx, page } = await seite('de-DE');
  const r = await page.evaluate(async () => {
    window.PBPinnwand.open();
    const s = document.getElementById('pbpin-miclang');
    s.value = 'ps-AF'; s.dispatchEvent(new Event('change'));
    window.__fehlerAls = 'language-not-supported';
    document.getElementById('pbpin-mic').click();
    await new Promise((r2) => setTimeout(r2, 200));
    const sofort = document.getElementById('pbpin-sendhint').textContent.trim();
    await new Promise((r2) => setTimeout(r2, 400));
    const spaeter = document.getElementById('pbpin-sendhint').textContent.trim();
    return { sofort, spaeter };
  });
  // Bewusst NICHT „ist lang genug": eine solche Prüfung wurde an der Schwester
  // Kimboard auf dem Text „kein Relay verbunden…" grün — sie prüfte nichts.
  ok('Fehlermeldung nennt die betroffene Sprache', /پښتو/.test(r.sofort), r.sofort);
  ok('kein roher Fehlercode in der Meldung', !/language-not-supported/.test(r.sofort), r.sofort);
  ok('die Meldung bleibt stehen', r.spaeter === r.sofort, r.spaeter);
  await ctx.close();
}

// 4) Der STILLE Fehlschlag (Klaus' Sichttest 2026-08-11).
//    Russisch kam als „Здравствуйте" zurück, Arabisch als „سلام عليكم" — beides
//    richtig. Paschtu kam als „Salaam" zurück, in LATEINISCHEN Buchstaben, und
//    OHNE Fehler: Chrome hat stillschweigend etwas anderes gehört. Die
//    Fehlermeldung kann da nicht greifen, weil es keinen Fehler gibt.
//    Geprüft wird, dass die Schrift-Kontrolle anschlägt — UND dass sie schweigt,
//    wenn die Schrift stimmt (sonst wäre sie nur lästig).
{
  const { ctx, page } = await seite('de-DE');
  const r = await page.evaluate(async () => {
    window.PBPinnwand.open();
    const s = document.getElementById('pbpin-miclang');
    const hin = () => document.getElementById('pbpin-sendhint').textContent.trim();
    const q = document.getElementById('pbpin-qmsg');

    s.value = 'ps-AF'; s.dispatchEvent(new Event('change'));
    q.value = ''; window.__ergebnis = 'Salaam';
    document.getElementById('pbpin-mic').click();
    await new Promise((x) => setTimeout(x, 250));
    const schief = hin();

    s.value = 'ar-SA'; s.dispatchEvent(new Event('change'));
    q.value = ''; window.__ergebnis = 'سلام عليكم';
    document.getElementById('pbpin-mic').click();
    await new Promise((x) => setTimeout(x, 250));
    const passt = hin(), passtFeld = q.value;

    s.value = 'de-DE'; s.dispatchEvent(new Event('change'));
    q.value = ''; window.__ergebnis = 'Guten Tag';
    document.getElementById('pbpin-mic').click();
    await new Promise((x) => setTimeout(x, 250));
    return { schief, passt, passtFeld, deutsch: hin(), deutschFeld: q.value };
  });
  ok('Hinweis beim stillen Fehlschlag (Paschtu → lateinischer Text)',
     /پښتو/.test(r.schief) && /lateinischer Schrift/.test(r.schief), r.schief);
  /* NACHGESCHÄRFT 2026-08-12. Vorher stand hier nur „enthält nicht
   * 'lateinischer Schrift'". Das war grün, WÄHREND im Hinweisfeld
   * „kein Relay verbunden…" stand — also auf einem Lauf, in dem die Erkennung
   * das Feld nie erreicht hatte. Eine Prüfung, die nur eine Abwesenheit
   * verlangt, ist auf fast jedem Text wahr und beweist nichts.
   * Jetzt wird zusätzlich verlangt, dass der gesprochene Text WIRKLICH im
   * Frage-Feld gelandet ist — das ist die Tat, um die es geht. */
  ok('kein falscher Alarm, wenn die Schrift stimmt (Arabisch)',
     r.passtFeld === 'سلام عليكم' && !/lateinischer Schrift/.test(r.passt), r.passtFeld + ' | ' + r.passt);
  ok('kein falscher Alarm bei Deutsch',
     r.deutschFeld === 'Guten Tag' && !/lateinischer Schrift/.test(r.deutsch), r.deutschFeld + ' | ' + r.deutsch);
  await ctx.close();
}

await browser.close();
server.close();
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
