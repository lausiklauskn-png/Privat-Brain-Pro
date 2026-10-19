// Regel-Beweis für den Kategorie-Vorschlag (Klaus-Feld-Befund 2026-07-17):
// Zahlen allein / eine Marktanalyse / eine Beispielrechnung sind KEINE Rechnung.
// Eine echte Rechnung (Rechnungsnummer, zahlbar bis, Gesamtbetrag) bleibt Rechnung.
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
const PORT=server.address().port;
const browser = await chromium.launch({executablePath:EXEC, args:['--no-sandbox']});
const page = await browser.newPage();
const errors=[]; page.on('pageerror', e=>errors.push(e.message));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, {waitUntil:'load'});
await page.waitForTimeout(300);
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`);};
const cat = (name,text)=>page.evaluate(([n,t])=>suggestCategory(n,t), [name,text]);

// 1) Marktanalyse mit Zahlen/Finanzwörtern -> NICHT Rechnung (der eigentliche Befund)
const c1 = await cat("papas-marktanalyse.pdf",
  "Marktanalyse und Kosten-Nutzen-Studie. Umsatz 2020: 15.000 EUR, 2021: 18.000 EUR. MwSt 19%. Betrag gesamt, Prognose und Kennzahlen zum Wettbewerb.");
ok('Marktanalyse ist NICHT „Rechnung"', c1!=='Rechnung', c1);
ok('Marktanalyse landet in „Analyse/Bericht"', c1==='Analyse/Bericht', c1);

// 2) Zahlen allein (kein Rechnungs-Merkmal) -> NICHT Rechnung
const c2 = await cat("zahlen-uebersicht.pdf", "Umsatz 15000, Kosten 8000, Betrag 7000, Summe über mehrere Jahre.");
ok('Zahlen allein sind NICHT „Rechnung"', c2!=='Rechnung', c2);

// 3) Beispiel-/Musterrechnung -> NICHT Rechnung
const c3 = await cat("Beispielrechnung.pdf", "Rechnung — Musterbeispiel. Betrag 100 EUR, MwSt 19%. Beispiel zur Veranschaulichung.");
ok('Beispielrechnung ist NICHT „Rechnung"', c3!=='Rechnung', c3);

// 4) echte Rechnung -> Rechnung
const c4 = await cat("dok-2019-045.pdf",
  "Rechnungsnummer 2019-045, Rechnungsdatum 12.03.2019. Gesamtbetrag 240,00 EUR. Zahlbar bis 26.03.2019. MwSt 19%.");
ok('Echte Rechnung bleibt „Rechnung"', c4==='Rechnung', c4);

// 5) Regression: Name „rechnung_..." bleibt Rechnung
const c5 = await cat("rechnung_2026.txt", "");
ok('Regression: rechnung_2026.txt bleibt „Rechnung"', c5==='Rechnung', c5);

// 6) „Kopie einer Rechnung" bleibt Rechnung (Kopie ist kein Gegen-Signal)
const c6 = await cat("Kopie-Rechnung-2019-045.pdf", "Kopie. Rechnungsnummer 2019-045, Gesamtbetrag 240,00 EUR, zahlbar bis 26.03.2019.");
ok('Kopie einer echten Rechnung bleibt „Rechnung"', c6==='Rechnung', c6);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,140));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
