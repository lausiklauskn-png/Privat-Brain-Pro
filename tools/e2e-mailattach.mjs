// Beweis: E-Mail-Anhänge auto-auspacken + mitlesen (Klaus 2026-07-17). Eine .eml mit einem
// Bild-Anhang (base64 JPEG) und einem Text-Anhang wird importiert: die Mail wird ein Eintrag,
// JEDER Anhang wird ein EIGENER Katalog-Eintrag (Bild/Text), durchsuchbar. Signaturen/winzige
// Teile werden übersprungen. Schalter aus -> keine Anhänge. Mail-Original bleibt unberührt.
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

// Ein echtes kleines JPEG (>700 Byte) im Browser erzeugen und base64-kodieren
const jpgB64 = await page.evaluate(async ()=>{
  const cv=document.createElement("canvas"); cv.width=200; cv.height=150;
  const cx=cv.getContext("2d"); cx.fillStyle="#28c"; cx.fillRect(0,0,200,150); cx.fillStyle="#fff"; cx.fillRect(20,20,120,60);
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.85));
  const buf=new Uint8Array(await blob.arrayBuffer());
  let s=""; for(const b of buf) s+=String.fromCharCode(b);
  return btoa(s);
});
const wrap = s => s.replace(/(.{76})/g,"$1\n");
const B = "GRENZE_abc123";
const EML = [
  'From: Klaus <klaus@example.com>',
  'To: du@example.com',
  'Subject: Fotos vom Wochenende',
  'Date: Mon, 3 Jun 2024 10:00:00 +0200',
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary="'+B+'"',
  '',
  '--'+B,
  'Content-Type: text/plain; charset=utf-8',
  '',
  'Hallo, hier die Bilder und die Notiz. Gruss Klaus.',
  '',
  '--'+B,
  'Content-Type: image/jpeg; name="strandfoto.jpg"',
  'Content-Transfer-Encoding: base64',
  'Content-Disposition: attachment; filename="strandfoto.jpg"',
  '',
  wrap(jpgB64),
  '',
  '--'+B,
  'Content-Type: text/plain; name="einkaufsliste.txt"',
  'Content-Transfer-Encoding: base64',
  'Content-Disposition: attachment; filename="einkaufsliste.txt"',
  '',
  Buffer.from("Einkaufsliste: Brot, Butter, Kaffee, Tomaten und Reisebuero-Angebot fuer Mallorca.","utf8").toString("base64"),
  '',
  '--'+B,
  'Content-Type: application/pkcs7-signature; name="smime.p7s"',
  'Content-Transfer-Encoding: base64',
  'Content-Disposition: attachment; filename="smime.p7s"',
  '',
  Buffer.from("nur-signatur-muell","utf8").toString("base64"),
  '',
  '--'+B+'--',
  ''
].join('\n');

// 1) Parser findet die Anhänge (ohne Signatur-Filter — der greift erst beim Import)
const p = await page.evaluate((eml)=>{
  const m = window.PBMail.parseEml(eml);
  return { n:(m.attachments||[]).length, names:(m.attachments||[]).map(a=>a.filename), body:/Notiz/.test(m.body) };
}, EML);
ok('Parser findet 3 Anhänge', p.n===3, p.names.join(', '));
ok('Mail-Text bleibt erhalten (ohne Anhang-Müll)', p.body===true);

// 2) Import (Schalter AN): Mail + nützliche Anhänge werden eigene Einträge, Signatur übersprungen
const imp = await page.evaluate(async (eml)=>{
  localStorage.setItem("pb_mail_attach","1");
  const f=new File([eml],"wochenende.eml",{type:"message/rfc822"});
  const added=await window.PBMail.importFile(f);
  rebuildIndex();
  const mail=CATALOG.find(r=>r.category==='E-Mail' && /Fotos vom Wochenende/.test(r.name));
  const img=CATALOG.find(r=>/strandfoto\.jpg/.test(r.name));
  const txt=CATALOG.find(r=>/einkaufsliste\.txt/.test(r.name));
  const sig=CATALOG.find(r=>/smime\.p7s/.test(r.name));
  return { added, mail:!!mail, img:img&&img.category, txt:txt&&txt.category,
           imgPath: img&&img.path, sig:!!sig };
}, EML);
ok('Import zählt Mail + 2 nützliche Anhänge (3)', imp.added===3, 'added='+imp.added);
ok('Mail selbst ist ein eigener Eintrag', imp.mail===true);
ok('Bild-Anhang = eigener Eintrag (Kategorie Foto/Bild)', imp.img==='Foto/Bild', imp.img);
ok('Text-Anhang = eigener Eintrag (Text/Notiz)', imp.txt==='Text/Notiz', imp.txt);
ok('Anhang-Pfad zeigt Herkunft (Mail-Anhang/…)', /^Mail-Anhang\//.test(imp.imgPath||''), imp.imgPath);
ok('Signatur (.p7s) wird übersprungen (kein Eintrag)', imp.sig===false);

// 3) Anhang-Inhalt ist durchsuchbar (Text im Anhang)
const found = await page.evaluate(()=> search("Mallorca Reisebuero", null).map(h=>h.r.name).some(n=>/einkaufsliste/.test(n)) );
ok('Text-Anhang ist per Bedeutung/Wort auffindbar', found===true);

// 4) Schalter AUS: keine Anhänge, nur die Mail
const off = await page.evaluate(async (eml)=>{
  localStorage.setItem("pb_mail_attach","0");
  const eml2 = eml.replace("Fotos vom Wochenende","Zweite Mail ohne Anhang-Import").replace(/strandfoto\.jpg/g,"zweitbild.jpg").replace(/einkaufsliste\.txt/g,"zweitliste.txt");
  const f=new File([eml2],"zweite.eml",{type:"message/rfc822"});
  await window.PBMail.importFile(f); rebuildIndex();
  return { img: !!CATALOG.find(r=>/zweitbild/.test(r.name)), mail: !!CATALOG.find(r=>/Zweite Mail ohne/.test(r.name)) };
}, EML);
ok('Schalter AUS: Anhang NICHT importiert', off.img===false);
ok('Schalter AUS: Mail selbst trotzdem da', off.mail===true);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,160));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
