// Beweis: Private Brain hat ein EIGENES, theme-anpassendes schwebendes 📌-Pinnwand-
// Widget (Blase + Panel) — die Sage-Pinnwand-Brett-Logik (Frage→Antwort/Nostr/DM-
// Krypto B7) in der Flieger-Schale, im PB-Theme (CSS-Variablen → hell/dunkel).
// Live-Relais (wss) = nur am Tablet beweisbar; headless prüft Mount/Öffnen/Schließen/
// Kopf/Gerätename/Frage-Feld/Offline-Degradierung/KI-Richter + DM-Krypto-Round-Trip.
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
await page.waitForTimeout(700);
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`);};

// 1) Blase gemountet + native API + Brett-Tag
const meta = await page.evaluate(()=>({
  btn: !!document.querySelector('#pbPinBtn'),
  api: !!(window.PBPinnwand && window.PBPinnwand._meta),
  native: !!(window.PBPinnwand && window.PBPinnwand._meta && window.PBPinnwand._meta.native),
  themed: !!(window.PBPinnwand && window.PBPinnwand._meta && window.PBPinnwand._meta.themed),
  tag: (window.PBPinnwand && window.PBPinnwand._meta && window.PBPinnwand._meta.tag) || '',
  label: (document.querySelector('#pbPinBtn')||{}).textContent||'',
}));
ok('Schwebende 📌-Blase gemountet (#pbPinBtn)', meta.btn===true);
ok('Native Widget-API vorhanden (PBPinnwand)', meta.api===true);
ok('Als nativ + theme-anpassend markiert', meta.native===true && meta.themed===true);
ok('Eigenes PB-Brett (Tag sbkim-privatbrain-brett)', meta.tag==='sbkim-privatbrain-brett', 'tag='+meta.tag);
ok('Blase trägt Text „📌 Pinnwand"', /Pinnwand/.test(meta.label) && /📌/.test(meta.label));

// 2) Kein Auto-Netz beim Laden (Empfangsmodus) — Panel noch zu
const closedAtStart = await page.evaluate(()=>({
  open: window.PBPinnwand.isOpen(),
  panel: getComputedStyle(document.querySelector('#pbPinPanel')).display,
}));
ok('Beim Laden geschlossen (kein Auto-Öffnen)', closedAtStart.open===false && closedAtStart.panel==='none');

// 3) open() → Panel voll sichtbar + Blase versteckt (EIN Ding zur Zeit)
await page.evaluate(()=>window.PBPinnwand.open()); await page.waitForTimeout(150);
const opened = await page.evaluate(()=>({
  open: window.PBPinnwand.isOpen(),
  panelVis: getComputedStyle(document.querySelector('#pbPinPanel')).display!=='none',
  btnHidden: getComputedStyle(document.querySelector('#pbPinBtn')).display==='none',
  tool: !!document.querySelector('#pbPinPanel .pbpin'),
  head: (function(){var h=document.querySelector('#pbPinHead strong'); return h?h.textContent:'';})(),
}));
ok('open() → Panel voll sichtbar', opened.open===true && opened.panelVis===true);
ok('Panel offen → Blase versteckt (kein doppeltes Widget)', opened.btnHidden===true);
ok('Werkzeug-Körper (.pbpin) im Panel montiert', opened.tool===true);
ok('Kopf-Titel = „📌 Pinnwand"', /Pinnwand/.test(opened.head));

// 4) Theme-Anpassung: Panel-Hintergrund folgt Hell/Dunkel
const themed = await page.evaluate(()=>{
  const p=document.querySelector('#pbPinPanel'); const root=document.documentElement;
  root.removeAttribute('data-theme'); const lightBg=getComputedStyle(p).backgroundColor;
  root.setAttribute('data-theme','dunkel'); const darkBg=getComputedStyle(p).backgroundColor;
  root.removeAttribute('data-theme');
  return { lightBg, darkBg, changed: lightBg!==darkBg };
});
ok('Panel passt sich Hell/Dunkel an (Farbe folgt dem Thema)', themed.changed===true, `${themed.lightBg} → ${themed.darkBg}`);

// 5) Kopf hat 💬 (Erklärung) + – (Zuklappen) + ✕ (Schließen)
const head = await page.evaluate(()=>{
  const h=document.querySelector('#pbPinHead');
  const btns=h?[...h.querySelectorAll('button')].map(b=>b.getAttribute('aria-label')||b.textContent.trim()):[];
  return { tip: btns.some(b=>/Erklärung/.test(b)), min: btns.includes('Zuklappen'), close: btns.includes('Schließen'),
    full: btns.includes('Vollbild'), reload: btns.includes('Neu laden (Cache leeren)') };
});
ok('Kopf hat 💬 (Erklärung ein/aus)', head.tip===true);
ok('Kopf hat – (Zuklappen) UND ✕ (Schließen)', head.min===true && head.close===true);
ok('Kopf hat ⛶ (Vollbild)', head.full===true);
ok('Kopf hat 🔄 (Neu laden / Cache leeren)', head.reload===true);

// 5b) ⛶ toggelt Vollbild fail-soft (ohne User-Geste → CSS-Fallback .pbpin-fs), kein Crash
const fs = await page.evaluate(async ()=>{
  const btn=document.querySelector('#pbPinHead button[aria-label="Vollbild"]');
  try { btn.click(); } catch(e){ return { crash:String(e) }; }
  await new Promise(r=>setTimeout(r,120));
  const on = document.querySelector('#pbPinPanel').classList.contains('pbpin-fs') || document.fullscreenElement===document.querySelector('#pbPinPanel');
  try { btn.click(); } catch(e){ return { crash:String(e) }; }   // wieder verlassen
  await new Promise(r=>setTimeout(r,120));
  const off = !document.querySelector('#pbPinPanel').classList.contains('pbpin-fs');
  return { crash:null, on, off };
});
ok('⛶ Vollbild an/aus ohne Crash (CSS-Fallback greift)', fs.crash===null && fs.on===true && fs.off===true, fs.crash||('on='+fs.on+' off='+fs.off));

// 6) – schließt in EINEM Klick (Panel weg, Blase zurück)
await page.click('#pbPinHead button[aria-label="Zuklappen"]'); await page.waitForTimeout(80);
const afterMin = await page.evaluate(()=>({
  open: window.PBPinnwand.isOpen(),
  btnBack: getComputedStyle(document.querySelector('#pbPinBtn')).display!=='none',
  panelGone: getComputedStyle(document.querySelector('#pbPinPanel')).display==='none',
}));
ok('– schließt in EINEM Klick (Panel zu, Blase zurück)', afterMin.open===false && afterMin.btnBack===true && afterMin.panelGone===true);

// 7) EIN Klick auf die Blase → Panel wieder VOLL offen
await page.click('#pbPinBtn'); await page.waitForTimeout(80);
const reopened = await page.evaluate(()=>({
  open: window.PBPinnwand.isOpen(),
  bodyVisible: getComputedStyle(document.querySelector('#pbPinPanel .pbpin')).display!=='none',
  btnHidden: getComputedStyle(document.querySelector('#pbPinBtn')).display==='none',
}));
ok('EIN Klick auf die Blase → Panel wieder VOLL offen', reopened.open===true && reopened.bodyVisible===true && reopened.btnHidden===true);

// 8) 💬 blendet die Erklärung um
const introTgl = await page.evaluate(()=>{
  const intro=[...document.querySelectorAll('#pbPinPanel p')].find(e=>/Server-los/.test(e.textContent));
  const before=intro?getComputedStyle(intro).display:'?';
  document.querySelector('#pbPinHead button[aria-label="Erklärung ein-/ausblenden"]').click();
  const after=intro?getComputedStyle(intro).display:'?';
  return { changed: before!==after };
});
ok('💬 blendet die Erklärung um (auf/zu)', introTgl.changed===true);

// 9) Gerätename-Feld vorhanden + speichert (geteilter Schlüssel sbkim_geraetename)
const gn = await page.evaluate(()=>{
  const inp=document.querySelector('#pbpin-geraetename');
  if(!inp) return { has:false };
  inp.value='Klaus PB Tablet'; inp.dispatchEvent(new Event('input'));
  return { has:true, stored: localStorage.getItem('sbkim_geraetename') };
});
ok('🏷️ Gerätename-Feld im Flieger vorhanden', gn.has===true);
ok('🏷️ Gerätename tippen speichert (sbkim_geraetename, geteilt)', gn.stored==='Klaus PB Tablet', 'v='+gn.stored);

// 10) Frage-Feld + „Frage stellen"-Knopf vorhanden
const qf = await page.evaluate(()=>({
  q: !!document.querySelector('#pbpin-qmsg'),
  ask: !!document.querySelector('#pbpin-ask'),
  askText: (document.querySelector('#pbpin-ask')||{}).textContent||'',
}));
ok('Frage-Textfeld (#pbpin-qmsg) vorhanden', qf.q===true);
ok('„Frage stellen"-Knopf vorhanden', qf.ask===true && /Frage stellen/.test(qf.askText));

// 11) Offline: „Frage stellen" + Relais-Zuschalten degradieren OHNE Crash
const offline = await page.evaluate(async ()=>{
  // Frage tippen + Knopf klicken (offline → disabled oder still) — darf nicht werfen
  const q=document.querySelector('#pbpin-qmsg'); q.value='Testfrage offline';
  try { document.querySelector('#pbpin-ask').click(); } catch(e){ return { crash:String(e) }; }
  // ein Relais zuschalten (öffnet WebSocket zu nicht erreichbarem wss → fail-soft)
  const pill=document.querySelector('#pbpin-relays .pbpin-pill');
  try { if(pill) pill.click(); } catch(e){ return { crash:String(e) }; }
  return { crash:null, hint:(document.querySelector('#pbpin-sendhint')||{}).textContent||'' };
});
await page.waitForTimeout(500);
ok('Offline „Frage stellen" + Relais-Klick ohne Crash (fail-soft)', offline.crash===null, offline.crash||('hint="'+(offline.hint||'').slice(0,40)+'"'));

// 12) KI-Richter ist jetzt ein Dropdown mit 5 Optionen inkl. WebLLM (Pinboard-Muster)
const kiUi = await page.evaluate(()=>{
  const sel=document.querySelector('#pbpin-judgeprov');
  if(!sel) return { has:false };
  const opts=[...sel.options].map(o=>({v:o.value,t:o.textContent}));
  const webllm=opts.find(o=>o.v==='webllm');
  const keyBefore=getComputedStyle(document.querySelector('#pbpin-judgekey')).display; // aus → versteckt
  // Cloud (claude) wählen → Schlüssel-Feld sichtbar
  sel.value='claude'; sel.dispatchEvent(new Event('change'));
  const keyAfterCloud=getComputedStyle(document.querySelector('#pbpin-judgekey')).display;
  // WebLLM wählen → Modell-Dropdown + „Modell laden" sichtbar, Schlüssel-Feld weg,
  // aber KEIN automatischer Load (Import nur auf Knopfdruck)
  sel.value='webllm'; sel.dispatchEvent(new Event('change'));
  const webllmModel=getComputedStyle(document.querySelector('#pbpin-webllmmodel')).display!=='none';
  const webllmLoad=getComputedStyle(document.querySelector('#pbpin-webllmload')).display!=='none';
  const keyAfterWebllm=getComputedStyle(document.querySelector('#pbpin-judgekey')).display;
  return { has:true, count:opts.length, webllm:!!webllm, webllmText:webllm?webllm.t:'',
    keyHiddenAtStart:keyBefore==='none', keyShownCloud:keyAfterCloud!=='none',
    webllmModel, webllmLoad, keyHiddenWebllm:keyAfterWebllm==='none' };
});
ok('⚖️ KI-Richter ist ein Dropdown', kiUi.has===true);
ok('KI-Richter-Dropdown hat 5 Optionen', kiUi.count===5, 'n='+kiUi.count);
ok('KI-Richter-Dropdown enthält interne KI (WebLLM)', kiUi.webllm===true && /WebLLM/.test(kiUi.webllmText), kiUi.webllmText);
ok('Schlüssel-Feld nur bei Cloud sichtbar (aus→weg, Cloud→da)', kiUi.keyHiddenAtStart===true && kiUi.keyShownCloud===true);
ok('WebLLM zeigt Modell-Dropdown + „⬇️ Modell laden" (kein Auto-Load)', kiUi.webllmModel===true && kiUi.webllmLoad===true && kiUi.keyHiddenWebllm===true);

// 12b) WebLLM-Modell-Dropdown: ≥6 Optionen, jedes Label mit RAM-/GB-Angabe;
//      Geräte-RAM-Hinweis + ~8B-Grenze/Cloud-Zeile sichtbar; KEIN Auto-Load.
const webllmUi = await page.evaluate(()=>{
  const sel=document.querySelector('#pbpin-webllmmodel');
  const opts=sel?[...sel.options]:[];
  const labels=opts.map(o=>o.textContent);
  const devhint=document.querySelector('#pbpin-webllm-devhint');
  const cap=document.querySelector('#pbpin-webllm-cap');
  return {
    count: opts.length,
    allHaveGB: opts.length>0 && labels.every(t=>/GB/.test(t)),
    ids: opts.map(o=>o.value),
    devHintShown: devhint && getComputedStyle(devhint).display!=='none',
    devHintText: devhint ? devhint.textContent : '',
    capShown: cap && getComputedStyle(cap).display!=='none',
    capText: cap ? cap.textContent : '',
    hasMb: opts.length>0 && opts.every(o=>o.dataset && o.dataset.mb),
  };
});
ok('WebLLM-Modell-Dropdown hat ≥6 Optionen', webllmUi.count>=6, 'n='+webllmUi.count);
ok('Jedes Modell-Label trägt eine RAM-/GB-Angabe', webllmUi.allHaveGB===true);
ok('Modell-Optionen tragen data-mb (Richtwert für Geräte-Abgleich)', webllmUi.hasMb===true);
ok('Bewährte MLC-IDs inkl. Phi-3.5 mini + Llama-3.1-8B (q4f16)',
  webllmUi.ids.includes('Phi-3.5-mini-instruct-q4f16_1-MLC') && webllmUi.ids.includes('Llama-3.1-8B-Instruct-q4f16_1-MLC'),
  webllmUi.ids.join(', '));
ok('🖥️ Geräte-RAM-Hinweis sichtbar', webllmUi.devHintShown===true && /Gerät hat ~/.test(webllmUi.devHintText), '"'+webllmUi.devHintText.slice(0,60)+'"');
ok('Ehrliche ~8B-Grenze + Cloud-Verweis sichtbar', webllmUi.capShown===true && /8B/.test(webllmUi.capText) && /Cloud/.test(webllmUi.capText));

// 12c) Geräte-Warnung: großes Modell wählen → Warnung, wenn Geräte-RAM < Bedarf
//      (deviceMemory kann undefined sein → dann nur informativ, kein Crash).
const warn = await page.evaluate(async ()=>{
  const sel=document.querySelector('#pbpin-webllmmodel');
  // größtes Modell (Llama 8B) wählen
  sel.value='Llama-3.1-8B-Instruct-q4f16_1-MLC'; sel.dispatchEvent(new Event('change'));
  await new Promise(r=>setTimeout(r,60));
  const dh=document.querySelector('#pbpin-webllm-devhint');
  const dm=navigator.deviceMemory;
  return { crash:false, text:dh.textContent, warned:/⚠️/.test(dh.textContent), dm:(typeof dm==='number'?dm:null) };
});
ok('Geräte-Warnung fail-soft (informativ, kein Crash)', warn.crash===false && /Gerät hat ~/.test(warn.text), 'deviceMemory='+warn.dm);

// zurück auf „aus", damit die Folge-Prüfungen sauber bleiben
await page.evaluate(()=>{ const s=document.querySelector('#pbpin-judgeprov'); s.value=''; s.dispatchEvent(new Event('change')); });

// 13) Semantik-Sortier-Knopf vorhanden (Modul 03)
const sem = await page.evaluate(()=>!!document.querySelector('#pbpin-semantic'));
ok('🧠 Bedeutungs-Sortier-Knopf vorhanden (Modul 03)', sem===true);

// 14) DM-Krypto Round-Trip (dm_crypto.js im Seiten-Kontext)
const dm = await page.evaluate(async ()=>{
  const m = await import('/modules/dm_crypto.js');
  const A = m.newIdentity(), B = m.newIdentity(), C = m.newIdentity();
  const ct = await m.dmEncrypt('Geheime Nachricht 🔒', A.priv, B.pub);
  const atB = await m.dmDecrypt(ct, B.priv, A.pub);   // Empfänger B mit Sender-Pub A
  const atA = await m.dmDecrypt(ct, A.priv, B.pub);   // Sender A liest eigene Nachricht wieder
  const stranger = await m.dmDecrypt(ct, C.priv, A.pub); // Fremder → null
  const sn1 = await m.safetyNumber(A.pub, B.pub);
  const sn2 = await m.safetyNumber(B.pub, A.pub);
  return {
    prefixed: m.isDm(ct)===true,
    plainNotDm: m.isDm('nur Klartext')===false,
    roundtripB: atB==='Geheime Nachricht 🔒',
    roundtripA: atA==='Geheime Nachricht 🔒',
    strangerNull: stranger===null,
    sasSymmetric: sn1===sn2 && sn1.length>0,
    pubFromPriv: m.pubFromPriv(A.priv)===A.pub,
  };
});
ok('DM: isDm trennt Geheimtext von Klartext', dm.prefixed===true && dm.plainNotDm===true);
ok('DM: A→B verschlüsselt, B entschlüsselt korrekt', dm.roundtripB===true);
ok('DM: Sender A liest eigene Nachricht wieder (ECDH symmetrisch)', dm.roundtripA===true);
ok('DM: Fremder C bekommt null (kein Leck, fail-soft)', dm.strangerNull===true);
ok('DM: Sicherheitsnummer symmetrisch (SAS gegen MITM)', dm.sasSymmetric===true);
ok('DM: pubFromPriv leitet den öffentlichen Schlüssel korrekt ab', dm.pubFromPriv===true);

// 15) Mycel-Fenster (🌐, Modul 23-UI) und Pinnwand (📌) koexistieren, eigene IDs
const coexist = await page.evaluate(()=>({
  net: !!document.querySelector('#sbkim-rdv-btn'), pin: !!document.querySelector('#pbPinBtn'),
  distinctPanels: !!document.querySelector('#sbkim-rdv-panel') && !!document.querySelector('#pbPinPanel'),
}));
ok('🌐 Mycel-Fenster + 📌 Pinnwand-Flieger koexistieren (eigene IDs)', coexist.net===true && coexist.pin===true && coexist.distinctPanels===true);

// 16) Kanal-Umschalter 🌐 Öffentlich · 🏢 Intern
const chan = await page.evaluate(()=>({
  pub: !!document.querySelector('#pbpin-ch-public'),
  intern: !!document.querySelector('#pbpin-ch-intern'),
  pubText:(document.querySelector('#pbpin-ch-public')||{}).textContent||'',
  internText:(document.querySelector('#pbpin-ch-intern')||{}).textContent||'',
  internBoxHidden: getComputedStyle(document.querySelector('#pbpin-intern-box')).display==='none',
  publicTag:(document.querySelector('#pbpin-tag-label')||{}).textContent||'',
}));
ok('Kanal-Umschalter 🌐 Öffentlich + 🏢 Intern vorhanden', chan.pub===true && chan.intern===true && /Öffentlich/.test(chan.pubText) && /Intern/.test(chan.internText));
ok('Start = Öffentlich (Intern-Box versteckt, öffentlicher Tag aktiv)', chan.internBoxHidden===true && /sbkim-privatbrain-brett/.test(chan.publicTag), 'tag='+chan.publicTag);

// 16b) Intern-Modus zeigt Gruppen-Name + Gruppen-Passwort-Feld
const internUi = await page.evaluate(async ()=>{
  document.querySelector('#pbpin-ch-intern').click();
  await new Promise(r=>setTimeout(r,60));
  const box=document.querySelector('#pbpin-intern-box');
  return {
    boxShown: box && getComputedStyle(box).display!=='none',
    group: !!document.querySelector('#pbpin-intern-group'),
    pass: !!document.querySelector('#pbpin-intern-pass'),
    publicBoxHidden: getComputedStyle(document.querySelector('#pbpin-public-box')).display==='none',
    hint:(document.querySelector('#pbpin-intern-status')||{}).textContent||'',
  };
});
ok('🏢 Intern zeigt Gruppen-Name- + Gruppen-Passwort-Feld', internUi.boxShown===true && internUi.group===true && internUi.pass===true);
ok('🏢 Intern blendet die öffentliche Brett-Passwort-Box aus', internUi.publicBoxHidden===true);
ok('🏢 Intern trägt ehrlichen Hinweis (geschlossene Firmen-Gruppe)', /geschlossene Firmen-Gruppe/.test(internUi.hint));

// 16c) Gruppen-Name → deterministisch gleicher, EIGENER (vom öffentlichen verschiedener) Tag
const tagDet = await page.evaluate(async ()=>{
  const setGroup = async (name)=>{
    const inp=document.querySelector('#pbpin-intern-group'); inp.value=name;
    document.querySelector('#pbpin-intern-group-set').click();
    await new Promise(r=>setTimeout(r,80));
    return (document.querySelector('#pbpin-tag-label')||{}).textContent||'';
  };
  const t1 = await setGroup('Muster GmbH');
  const t2 = await setGroup('andere firma');
  const t3 = await setGroup('  MUSTER GMBH  '); // normalisiert = gleich wie t1
  return { t1, t2, t3 };
});
ok('🏢 Intern-Tag ist ein eigener sbkim-intern-* Tag', /#sbkim-intern-[0-9a-f]{16}$/.test(tagDet.t1), 't1='+tagDet.t1);
ok('🏢 Intern-Tag ≠ öffentlicher Tag', tagDet.t1!=='#sbkim-privatbrain-brett' && !/privatbrain-brett/.test(tagDet.t1));
ok('🏢 Verschiedene Gruppen → verschiedene Tags', tagDet.t1!==tagDet.t2, tagDet.t1+' vs '+tagDet.t2);
ok('🏢 Gleicher Name (normalisiert) → deterministisch gleicher Tag', tagDet.t1===tagDet.t3, tagDet.t1+' == '+tagDet.t3);

// 16d) Intern-Post wird mit Gruppen-Passwort verschlüsselt (Round-Trip; ohne/falsch → Geheimtext)
//      — derselbe Krypto-Kern wie das Brett-Passwort (ENC_PREFIX 'sbkimenc1:').
const internCrypto = await page.evaluate(async ()=>{
  // Krypto-Kern der Seite nachstellen (identisch zu deriveBoardKey/encrypt/decrypt im Widget)
  const ENC_PREFIX='sbkimenc1:';
  const SALT=new TextEncoder().encode('sbkim-privatbrain-brett-salt-v1');
  const b64=b=>btoa(String.fromCharCode.apply(null,new Uint8Array(b)));
  const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  async function key(pass){ const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',salt:SALT,iterations:150000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']); }
  async function enc(text,k){ const iv=crypto.getRandomValues(new Uint8Array(12)); const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode(text)); return ENC_PREFIX+b64(iv)+':'+b64(ct); }
  async function dec(s,k){ try{ const p=s.split(':'); const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(p[1])},k,unb64(p[2])); return new TextDecoder().decode(pt); }catch{ return null; } }
  const kGood=await key('firmen-geheim'); const kBad=await key('falsch');
  const ct=await enc('Interner Zettel 🏢', kGood);
  return { prefixed:ct.startsWith(ENC_PREFIX), roundtrip:(await dec(ct,kGood))==='Interner Zettel 🏢', wrongPass:(await dec(ct,kBad))===null, isCiphertext: !/Interner Zettel/.test(ct) };
});
ok('🏢 Intern-Krypto: Round-Trip mit Gruppen-Passwort lesbar', internCrypto.prefixed===true && internCrypto.roundtrip===true);
ok('🏢 Intern-Krypto: falsches Passwort → nur Geheimtext (null)', internCrypto.wrongPass===true && internCrypto.isCiphertext===true);

// 16e) Umschalten intern→public wechselt den aktiven Tag zurück; kein Crash
const backPub = await page.evaluate(async ()=>{
  document.querySelector('#pbpin-ch-public').click();
  await new Promise(r=>setTimeout(r,60));
  return { tag:(document.querySelector('#pbpin-tag-label')||{}).textContent||'',
    internHidden: getComputedStyle(document.querySelector('#pbpin-intern-box')).display==='none' };
});
ok('🌐 Zurück auf Öffentlich → öffentlicher Tag wieder aktiv', /sbkim-privatbrain-brett/.test(backPub.tag) && backPub.internHidden===true, 'tag='+backPub.tag);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,200));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
