// Beweis Stufe 2: Mail-Import. Parst .eml/.mbox (Encoded-Word-Betreff, quoted-printable,
// mbox mit mehreren Nachrichten), macht jede Mail zu einem Katalog-Eintrag (E-Mail),
// Dedupe, und legt eine Mail verschlüsselt in den Tresor (kind pb-mail, Roundtrip).
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
const page = await browser.newPage({ acceptDownloads:true });
const errors=[]; page.on('pageerror', e=>errors.push(e.message));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, {waitUntil:'load'});
await page.waitForTimeout(500);
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`);};

const EML = [
  'From: =?utf-8?Q?Reiseb=C3=BCro?= Sonne <info@reise.example>',
  'To: klaus@example.com',
  'Subject: =?utf-8?Q?Ihr_Angebot_f=C3=BCr_Mallorca?=',
  'Date: Mon, 3 Jun 2019 10:00:00 +0200',
  'Content-Type: text/plain; charset=utf-8',
  'Content-Transfer-Encoding: quoted-printable',
  '',
  'Sehr geehrter Herr Klaus,=0A=0Aunser Sonderangebot f=C3=BCr Mallorca:=0AFlug + Hotel 7 N=C3=A4chte f=C3=BCr 499 Euro.'
].join('\n');

const MBOX = [
  'From 111@x Mon Jun 03 10:00:00 2019',
  'From: A <a@x.de>',
  'Subject: Erste Mail ueber Pilze',
  'Date: Mon, 3 Jun 2019 10:00:00 +0200',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'Hallo, das ist die erste Nachricht ueber Pilze im Wald.',
  '',
  'From 222@x Tue Jun 04 11:00:00 2019',
  'From: B <b@x.de>',
  'Subject: Zweite Mail',
  'Date: Tue, 4 Jun 2019 11:00:00 +0200',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'Zweite Nachricht, kurzer Text.'
].join('\n');

// 1) Parser
const p = await page.evaluate(([eml,mbox])=>{
  const e=window.PBMail.parseEml(eml); const m=window.PBMail.parseMbox(mbox);
  return { subj:e.subject, from:e.from, bodyHasMallorca:/Mallorca/.test(e.body), bodyHas499:/499/.test(e.body), bodyHasNewline:/\n/.test(e.body),
           mboxN:m.length, mSubj0:m[0]&&m[0].subject, mSubj1:m[1]&&m[1].subject };
}, [EML, MBOX]);
ok('EML: Betreff Encoded-Word entschlüsselt', p.subj==='Ihr Angebot für Mallorca', p.subj);
ok('EML: quoted-printable Body (Umlaute + Zeilen)', p.bodyHasMallorca && p.bodyHas499 && p.bodyHasNewline);
ok('MBOX: 2 Nachrichten getrennt', p.mboxN===2, 'n='+p.mboxN);
ok('MBOX: Betreffe geparst', p.mSubj0==='Erste Mail ueber Pilze' && p.mSubj1==='Zweite Mail', p.mSubj0+' / '+p.mSubj1);

// 2) Import (eml + mbox) -> Katalog-Einträge
const imp = await page.evaluate(async ([eml,mbox])=>{
  const f1=new File([eml],"angebot.eml",{type:"message/rfc822"});
  const f2=new File([mbox],"takeout.mbox",{type:"application/mbox"});
  const a=await window.PBMail.importFile(f1);
  const b=await window.PBMail.importFile(f2);
  const mails=CATALOG.filter(r=>r.category==='E-Mail');
  const mallorca=CATALOG.find(r=>/Mallorca/.test(r.name));
  return { a, b, mailCount:mails.length, hasMallorca:!!mallorca, mallorcaHash:mallorca&&mallorca.hash, mallorcaHasBody: mallorca&&/499/.test(mallorca.mailBody||'') };
}, [EML, MBOX]);
ok('Import EML: 1 neue Mail', imp.a===1, 'a='+imp.a);
ok('Import MBOX: 2 neue Mails', imp.b===2, 'b='+imp.b);
ok('3 E-Mail-Einträge im Katalog', imp.mailCount===3, 'n='+imp.mailCount);
ok('Mail-Body im Eintrag gespeichert (mailBody)', imp.mallorcaHasBody);

// 3) Dedupe
const dup = await page.evaluate(async (eml)=>{ const f=new File([eml],"angebot.eml",{type:"message/rfc822"}); return await window.PBMail.importFile(f); }, EML);
ok('Dieselbe Mail doppelt importieren -> 0 neu (Dedupe)', dup===0, 'n='+dup);

// 4) Mail verschlüsselt in den Tresor (kind pb-mail, Roundtrip)
await page.click('.tab[data-tab="settings"]'); await page.waitForTimeout(120);
await page.click('#tresorSetup'); await page.waitForTimeout(120);
await page.fill('#tzPw','geheimes-tresor-passwort'); await page.fill('#tzPw2','geheimes-tresor-passwort');
await page.click('#tzMk'); await page.waitForTimeout(250); await page.check('#tzSaved'); await page.waitForTimeout(60);
await page.click('#tzFinish'); await page.waitForTimeout(900);
const vault = await page.evaluate(async (hash)=>{
  await window.PBVault.store(hash);
  const items=await window.PBVault.list(); const it=items[0];
  const plain=it?await window.PBTresor.decrypt(it.enc):null;
  // encHasPlain: auf echte WÖRTER prüfen, nicht auf "499" — drei Ziffern tauchen in
  // zufälligem Base64-Chiffrat irgendwann zufällig auf (flakiger Testlauf 2026-07-17).
  return { n:items.length, kind:plain&&plain.kind, textHas499: plain&&/499/.test(plain.text||''), encHasPlain: it?/Mallorca|Sonderangebot|Reisebüro/i.test(JSON.stringify(it.enc)):true };
}, imp.mallorcaHash);
ok('Mail liegt im Tresor (1 Eintrag, kind pb-mail)', vault.n===1 && vault.kind==='pb-mail', vault.kind);
ok('Mail-Tresor Roundtrip: Text entschlüsselt (enthält 499)', vault.textHas499===true);
ok('Kein Klartext im verschlüsselten Mail-Eintrag', vault.encHasPlain===false);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,160));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
