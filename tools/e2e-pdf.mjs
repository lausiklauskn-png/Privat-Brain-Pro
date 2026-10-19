// Beweis: PDF-Datensalat kommt nicht mehr in die Karte/Suche. Wenn aus einem PDF kein
// lesbarer Text herauskommt, liefert die Box LEEREN Text (nicht %PDF/FlateDecode/obj-Müll)
// und die Karte ist sauber. Mistral-OCR-Rückfall ist verdrahtet + fail-soft (ohne Schlüssel).
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
await page.waitForTimeout(400);
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`);};

// looksLikeText: PDF-Innereien = false, echter Satz = true
const g = await page.evaluate(()=>({
  garbage: looksLikeText("2 0 obj <</Length 3 0 R/Filter/FlateDecode>> stream endstream endobj xref trailer"),
  real: looksLikeText("Dies ist ein echter deutscher Satz mit vielen Woertern und einer klaren Bedeutung."),
}));
ok('looksLikeText: PDF-Struktur = kein Text', g.garbage===false);
ok('looksLikeText: echter Satz = Text', g.real===true);

// „PDF" das nur aus Struktur/komprimiertem Müll besteht -> extractPdf liefert LEER
const GARBAGE = "%PDF-1.7\n2 0 obj <</Length 40/Filter/FlateDecode>> stream\n\x78\x9c\x01\x02\x03\x04\xff\xfe\x00\x99\x88\x77 endstream endobj\ntrailer <</Root 1 0 R>>\n%%EOF";
const r = await page.evaluate(async (raw)=>{
  const u8=new Uint8Array([...raw].map(c=>c.charCodeAt(0)&0xff));
  const t=await extractPdf(u8);
  const f=new File([u8], "kaputt.pdf", {type:"application/pdf"});
  const rc=await readContent(f, u8.buffer);
  return { extract:t, rcText:rc.text, via:rc.via };
}, GARBAGE);
ok('extractPdf(Müll-PDF) = leer', r.extract==="", JSON.stringify(r.extract).slice(0,40));
ok('readContent(Müll-PDF) = leer, kein %PDF/FlateDecode', r.rcText==="" && !/FlateDecode|%PDF|endobj/.test(r.rcText||""));
ok('via = „nur Name/Metadaten" (ehrlich)', r.via==="nur Name/Metadaten", r.via);

// signieren -> Katalog-Eintrag hat KEINEN Struktur-Müll im Snippet, kein Crash ohne Schlüssel
const sn = await page.evaluate(async (raw)=>{
  const u8=new Uint8Array([...raw].map(c=>c.charCodeAt(0)&0xff));
  const f=new File([u8], "kaputt2.pdf", {type:"application/pdf"});
  const res=await signFile(f, "kaputt2.pdf", null);
  const rec=CATALOG.find(x=>x.hash===res.hash);
  return { snippet: rec? rec.snippet : "(fehlt)", cat: rec&&rec.category };
}, GARBAGE);
ok('Signiertes Müll-PDF: Snippet ohne Struktur-Müll', !/FlateDecode|%PDF|endstream|endobj/.test(sn.snippet||""), (sn.snippet||"").slice(0,30));
ok('Müll-PDF ohne Text -> Kategorie Dokument (nach Endung)', sn.cat==="Dokument", sn.cat);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,140));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
