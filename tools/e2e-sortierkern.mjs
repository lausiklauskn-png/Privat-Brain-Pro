// Sortier-Kern in Private Brain (Klaus 15.11.2026): Einordnung beim Einlesen und Nachordnen, Suche über Felder, Kästchen, Sortierung.
// Echter Chromium-Lauf, nur erfundene Dateien („Nordlicht Labs“, „Stadtwerke Beispielstadt“ …), kein Netz.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {join,extname} from 'node:path';
import {chromium} from 'playwright-core';
const root=new URL('..',import.meta.url).pathname;
const TYP={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{const raw=decodeURIComponent(req.url.split('?')[0]);const path=raw==='/'?'index.html':raw;const data=await readFile(join(root,path));res.setHeader('content-type',TYP[extname(path)]||'application/octet-stream');res.end(data);}
  catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
let checks=0,rot=0;
function ok(name,condition,info=''){if(condition){console.log('✓ '+name);checks++;}else{console.log('✗ ROT: '+name+(info?' – '+info:''));rot++;}}
export const DATEIEN=[
  ['Receipt-2817-0001.txt','Nordlicht Labs, Inc.\n548 Market Street\nSan Francisco, CA 94104\n\nReceipt from Nordlicht Labs, Inc.\n\nAmount paid $20.00\nDate paid October 3, 2026\nPayment method Visa - 4242\n\nReceipt number 2817-0001\nInvoice number AB12CD-0001\n\nSummary\nPro plan, monthly $20.00\nTotal $20.00\nAmount paid $20.00\n\nIf you have any questions, contact us at support@nordlicht.example'],
  ['Invoice-AB12CD-0002.txt','Invoice\nInvoice number AB12CD-0002\nDate of issue November 3, 2026\nDate due November 3, 2026\n\nNordlicht Labs, Inc.\n548 Market Street\nSan Francisco, CA 94104\n\nBill to\nMax Mustermann\n\n$20.00 due November 3, 2026\n\nDescription Qty Unit price Amount\nPro plan 1 $20.00 $20.00\nSubtotal $20.00\nTotal $20.00\nAmount due $20.00'],
  ['Abschlag_November.txt','Stadtwerke Beispielstadt GmbH\nHafenstraße 4, 12345 Beispielstadt\n\nHerrn Max Mustermann\nLindenweg 3\n12345 Beispielstadt\n\nBeispielstadt, 02.11.2026\n\nRechnung Nr. 4711 – Abschlag Strom November\n\nSehr geehrter Herr Mustermann,\nfür November berechnen wir Ihnen den Abschlag von 84,00 EUR. Zahlbar bis 15.11.2026.\n\nMit freundlichen Grüßen\nIhre Stadtwerke Beispielstadt'],
  ['Mietvertrag_Lindenweg.txt','Wohnungsbau Beispielstadt eG\nMarktplatz 1, 12345 Beispielstadt\n\nMietvertrag über Wohnraum\n\nZwischen der Wohnungsbau Beispielstadt eG (Vermieterin) und Herrn Max Mustermann (Mieter) wird folgender Mietvertrag geschlossen.\n§ 1 Mietsache: Lindenweg 3, 2. OG links.\n§ 2 Mietzeit: Das Mietverhältnis beginnt am 01.12.2026.\n\nBeispielstadt, 20.10.2026'],
  ['Urlaubsfotos_Notiz.txt','Notiz: Fotos vom Urlaub an der Ostsee aussortieren, die schönsten für das Album drucken lassen.'],
];
try{
  const context=await browser.newContext();
  await context.route('**/*',route=>route.request().url().startsWith(url)?route.continue():route.abort());
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(()=>window.PBWorkspace && typeof db!=='undefined' && db && window.PBSortierkern);
  ok('Sortier-Kern geladen, Fassung aus dem Pin',await page.evaluate(()=>/^[0-9a-f]{12}$/.test(PBSortierkern.fassung)));
  await page.evaluate(async(dateien)=>{await signBatch(dateien.map(([n,t])=>({file:new File([t],n,{type:'text/plain'}),path:'Eingang/'+n,dirId:null})));},DATEIEN);
  await page.waitForFunction(()=>CATALOG.length>=5 && CATALOG.every(r=>r.kern&&r.kern.v===PBSortierkern.fassung),null,{timeout:20000});
  const k=await page.evaluate(()=>Object.fromEntries(CATALOG.map(r=>[r.name,r.kern])));
  ok('Englische Quittung: Art Rechnung, Absender Nordlicht Labs',k['Receipt-2817-0001.txt'].art==='Rechnung'&&/^Nordlicht Labs/.test(k['Receipt-2817-0001.txt'].absender),JSON.stringify(k['Receipt-2817-0001.txt']));
  ok('Englische Rechnung: Art Rechnung, Absender Nordlicht Labs',k['Invoice-AB12CD-0002.txt'].art==='Rechnung'&&/^Nordlicht Labs/.test(k['Invoice-AB12CD-0002.txt'].absender),JSON.stringify(k['Invoice-AB12CD-0002.txt']));
  ok('Deutsche Rechnung: Art, Absender und Frist',k['Abschlag_November.txt'].art==='Rechnung'&&/Stadtwerke/.test(k['Abschlag_November.txt'].absender)&&k['Abschlag_November.txt'].frist==='2026-11-15',JSON.stringify(k['Abschlag_November.txt']));
  ok('Mietvertrag: Art Vertrag, Bereich gesetzt',k['Mietvertrag_Lindenweg.txt'].art==='Vertrag'&&!!k['Mietvertrag_Lindenweg.txt'].bereich,JSON.stringify(k['Mietvertrag_Lindenweg.txt']));
  ok('Alte Kategorie bleibt daneben stehen',await page.evaluate(()=>CATALOG.every(r=>typeof r.category==='string')));
  const gespeichert=await page.evaluate(async()=>{const r=await idbGet('catalog',CATALOG.find(x=>x.name==='Abschlag_November.txt').hash);return r.kern&&r.kern.art;});
  ok('Einordnung steht auch im gespeicherten Katalog',gespeichert==='Rechnung');
  // Nachordnen: ein Eintrag ohne Einordnung (wie aus einer älteren Fassung) wird von selbst nachgeordnet.
  await page.evaluate(async()=>{const r=CATALOG.find(x=>x.name==='Mietvertrag_Lindenweg.txt');delete r.kern;await PBSortierkern.nachordnen();});
  await page.waitForFunction(()=>CATALOG.find(x=>x.name==='Mietvertrag_Lindenweg.txt').kern,null,{timeout:5000}).catch(()=>{});
  ok('Ältere Einträge ohne Einordnung werden nachgeordnet',await page.evaluate(()=>CATALOG.find(x=>x.name==='Mietvertrag_Lindenweg.txt').kern?.art==='Vertrag'));
  // Mail mit Absender aus „Von:“
  await page.setInputFiles('#mailInput',{name:'abo.eml',mimeType:'message/rfc822',buffer:Buffer.from('From: Nordlicht Labs <billing@nordlicht.example>\r\nTo: max@example.test\r\nSubject: Your receipt from Nordlicht Labs #2817-0003\r\nDate: Mon, 02 Nov 2026 10:00:00 +0000\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nReceipt from Nordlicht Labs, Inc.\r\nAmount paid $20.00\r\nReceipt number 2817-0003')});
  await page.waitForFunction(()=>CATALOG.some(r=>r.mail&&r.kern&&r.kern.v===PBSortierkern.fassung),null,{timeout:20000});
  const mk=await page.evaluate(()=>CATALOG.find(r=>r.mail).kern);
  ok('Mail: Absender aus „Von:“, Art Rechnung',/^Nordlicht Labs$/.test(mk.absender)&&mk.absenderSicher&&mk.art==='Rechnung',JSON.stringify(mk));
  // ---------- Explorer: ein Suchfeld für alles (Punkte 2–5) ----------
  await page.click('[data-tab="explorer"]');
  await page.waitForSelector('#explorerFilter',{state:'visible'});
  const namen=()=>page.$$eval('#explorerFiles .explorer-row strong',n=>n.map(x=>x.textContent.trim()));
  const suche=async q=>{await page.fill('#explorerFilter',q);await page.waitForTimeout(80);return namen();};
  const nord=n=>n.length&&n.every(x=>/Receipt-2817|Invoice-AB12|receipt from Nordlicht/i.test(x));
  let n=await suche('Rechnungen von Nordlicht');
  ok('„Rechnungen von Nordlicht“ findet die drei Nordlicht-Belege',n.length===3&&nord(n),n.join(' | '));
  n=await suche('ich suche alle Rechnungen von Nordlicht Labs');
  ok('„ich suche alle Rechnungen von Nordlicht Labs“ findet sie trotz Füllwörtern',n.length===3&&nord(n),n.join(' | '));
  ok('Erkannte Teile stehen als Kästchen im Suchfeld (Rechnung, Nordlicht)',await page.$$eval('#explorerChips .explorer-chip-erkannt',c=>c.map(x=>x.dataset.feld).sort().join())==='absender,art');
  ok('Mehrzahl gruppiert nach Absender',(await page.$$eval('#explorerFiles .explorer-group',h=>h.map(x=>x.textContent))).some(t=>/Nordlicht/.test(t)));
  n=await suche('Invoice');
  ok('„Invoice“ (Einzahl) zeigt die passendste oben, darunter Weitere',nord([n[0]])&&await page.locator('#explorerFiles .explorer-best').count()===1,n.join(' | '));
  n=await suche('Rechnungen');
  ok('„Rechnungen“ findet alle vier Rechnungen (auch die deutsche)',n.length===4&&n.some(x=>/Abschlag/.test(x)),n.join(' | '));
  n=await suche('rechnungen von anthropic');
  ok('Unbekannter Absender: keine falschen Treffer, ehrlich „keine Dateien“',n.length===0&&await page.locator('#explorerFiles .explorer-empty').count()===1);
  n=await suche('Rechnungen Mai');
  ok('Kästchen ohne Treffer: Angebot „Ohne Mai: … Treffer“',n.length===0&&/Ohne „Mai“/.test(await page.locator('#explorerFiles .explorer-without').innerText().catch(()=>'')));
  n=await suche('Mietsache');
  ok('Inhalt wird von selbst durchsucht (kein Haken nötig)',n.length===1&&/Mietvertrag/.test(n[0])&&!await page.locator('#explorerContent').isVisible(),n.join(' | '));
  // Kategorie links → festes Kästchen
  await page.fill('#explorerFilter','');
  const kat=page.locator('#explorerTree [data-category="category:Rechnung"]');
  if(await kat.count()){await kat.click();
    ok('Klick auf „Rechnung“ links setzt ein festes Kästchen „Rechnung ×“',await page.locator('#explorerChips .explorer-chip:not(.explorer-chip-erkannt)').count()===1&&(await namen()).length>=2);
    n=await suche('nordlicht');
    ok('Weitere Wörter grenzen ein, das Kästchen bleibt',nord(n)&&await page.locator('#explorerChips .explorer-chip:not(.explorer-chip-erkannt)').count()===1,n.join(' | '));
    await page.fill('#explorerFilter','');await page.click('#explorerChips .explorer-chip:not(.explorer-chip-erkannt)');
    ok('× nimmt das Kästchen weg, alle Dateien wieder da',await page.locator('#explorerChips .explorer-chip').count()===0&&(await namen()).length>=5);
  }else ok('Kategorie „Rechnung“ steht links',false,await page.locator('#explorerTree').innerText());
  // × an einem erkannten Kästchen liest das Wort als Text
  await suche('Rechnungen Nordlicht');await page.click('#explorerChips .explorer-chip-erkannt[data-feld="absender"]');
  ok('× an „Nordlicht“ sucht das Wort als Text weiter',await page.locator('#explorerChips .explorer-chip-erkannt[data-feld="absender"]').count()===0&&nord(await namen()));
  // Sortierung nach Bereich/Art/Absender
  await page.fill('#explorerFilter','');
  await page.evaluate(()=>{const s=document.getElementById('explorerSort');s.value='art';s.dataset.chosen='1';s.dispatchEvent(new Event('change'));});
  ok('Sortierung „Art“ bildet Gruppen mit Überschrift',(await page.$$eval('#explorerFiles .explorer-group',h=>h.map(x=>x.textContent))).includes('Rechnung'));
  ok('Zustand merkt Kästchen und Sortierung',await page.evaluate(()=>{const st=PBWorkspace.explorerState();return st.sort==='art'&&Array.isArray(st.chips);}));
  // ---------- Eigene Kategorien (Punkt 3, Klaus 15.11.) ----------
  await page.evaluate(()=>{const s=document.getElementById('explorerSort');s.value='date';s.dataset.chosen='';s.dispatchEvent(new Event('change'));});
  await page.fill('#explorerFilter','Receipt-2817-0001');
  const zeileR=page.locator('#explorerFiles .explorer-row').first();
  await zeileR.locator('.pb-eigene-knopf').click();
  await page.fill('.pb-eigene-menue input','Abos');await page.click('.pb-eigene-menue button:has-text("Anlegen")');
  ok('Eigene Kategorie anlegen: danach Frage „Alles von Nordlicht Labs …?“',/Alles von „Nordlicht Labs/.test(await page.locator('.pb-eigene-frage').innerText().catch(()=>'')));
  await page.click('.pb-eigene-frage button.primary');
  await page.waitForFunction(()=>CATALOG.filter(r=>r.eigeneKategorie==='Abos').length>=3,null,{timeout:5000}).catch(async()=>console.log('DBG',await page.evaluate(()=>JSON.stringify({abos:CATALOG.filter(r=>r.eigeneKategorie).map(r=>[r.name,r.eigeneKategorie,PBEigeneKategorien.absender(r)]),st:PBEigeneKategorien.stand,alle:CATALOG.map(r=>[r.name,PBEigeneKategorien.absender(r)])}))));
  ok('Ja: alle Nordlicht-Belege und die Mail bekommen „Abos“, die übrigen nicht',await page.evaluate(()=>CATALOG.filter(r=>r.eigeneKategorie==='Abos').length===3&&!CATALOG.some(r=>/Abschlag|Mietvertrag/.test(r.name)&&r.eigeneKategorie)));
  await page.fill('#explorerFilter','');
  ok('Links „Eigene Kategorien“ mit Zahl',await page.locator('#explorerTree [data-eigene-kategorie="Abos"]').innerText().then(t=>t.includes('(3)')));
  await page.click('#explorerTree [data-eigene-kategorie="Abos"]');
  ok('Klick setzt das Kästchen „Abos“, Liste zeigt die drei',await page.locator('#explorerChips .explorer-chip[data-feld="eigene"]').count()===1&&(await namen()).length===3);
  await page.click('#explorerChips .explorer-chip[data-feld="eigene"]');
  n=await suche('abos');
  ok('Eigene Kategorie als Wort im Suchfeld wird zum Kästchen',n.length===3&&await page.locator('#explorerChips .explorer-chip-erkannt[data-feld="eigene"]').count()===1,n.join(' | '));
  const gesichert=await page.evaluate(async()=>{const r=CATALOG.find(x=>x.eigeneKategorie==='Abos');return (await idbGet('catalog',r.hash)).eigeneKategorie;});
  ok('Eigene Kategorie steht im gespeicherten Katalog',gesichert==='Abos');
  // Regel lösen
  await page.fill('#explorerFilter','Invoice-AB12CD');
  await page.locator('#explorerFiles .explorer-row').first().locator('.pb-eigene-knopf').click();
  await page.click('.pb-eigene-menue button:has-text("Regel für")');
  await page.waitForFunction(()=>CATALOG.filter(r=>r.eigeneKategorie==='Abos').length===1);
  ok('Regel lösen: nur die von Hand zugeordnete Datei behält „Abos“',await page.evaluate(()=>CATALOG.find(r=>r.eigeneKategorie==='Abos')?.name==='Receipt-2817-0001.txt'));
  await page.fill('#explorerFilter','');
  ok('Zeile zeigt die Einordnung (Art · Absender · Bereich)',(await page.locator('#explorerFiles .explorer-kern').first().textContent()).length>3);
  // Klaus 15.11.2026: „Anthropic“ fand auf der ersten Seite nichts. Hängt das Bedeutungs-Modell, darf die Wortsuche nicht warten.
  const sofort=await page.evaluate(async()=>{window.__CB_EMBED_STUB__={embedQuery:()=>new Promise(()=>{})};MODE='mean';
    const t=Date.now();await renderResults('Nordlicht');return {n:document.querySelectorAll('#results .card').length,ms:Date.now()-t};});
  ok('Erste Seite: Treffer sofort, auch wenn das Modell nicht antwortet',sofort.n>=3&&sofort.ms<1000,JSON.stringify(sofort));
  ok('Erste Seite: schon „anth“-artige Anfänge finden (hier „nordl“)',await page.evaluate(async()=>{await renderResults('nordl');return document.querySelectorAll('#results .card').length>=1;}));
  await page.evaluate(()=>{delete window.__CB_EMBED_STUB__;});
  ok('Keine Seitenfehler',errors.length===0,errors.join(' | '));
}finally{await browser.close();server.close();}
console.log(`Sortier-Kern in Private Brain: ${checks} grün · ${rot} ROT`);
process.exit(rot?1:0);
