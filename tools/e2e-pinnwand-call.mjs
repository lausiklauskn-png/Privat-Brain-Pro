// Beweis: der PB-Pinnwand-Flieger kann einen 1:1 Ende-zu-Ende-verschlüsselten
// Sprach-/Video-Anruf (WhatsApp-artig) — Medien via WebRTC (DTLS-SRTP, P2P),
// Signaling verschlüsselt über das vorhandene Nostr-Relais (dm_crypto, ECDH).
// Chromium mit Fake-Media (getUserMedia liefert headless einen Fake-Stream).
// NICHT headless prüfbar: der echte Zwei-Geräte-Anruf über Live-Relais (= Klaus' Browser).
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
const browser = await chromium.launch({ executablePath:EXEC, args:[
  '--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream',
]});
const page = await browser.newPage();
const errors=[]; page.on('pageerror', e=>errors.push(e.message));
// Einen bekannten Kontakt vorab hinterlegen (64 Hex), damit die 📞/📹-Knöpfe erscheinen.
const CONTACT = 'ab'.repeat(32);
await page.addInitScript((c)=>{ try{ localStorage.setItem('sbkim_pinnwand_contacts_privatbrain', JSON.stringify({[c]:{name:'Firma Tester',pinnedAt:1}})); }catch(_e){} }, CONTACT);
await page.goto(`http://127.0.0.1:${PORT}/index.html`, {waitUntil:'load'});
await page.waitForTimeout(700);
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`);};

// 1) Call-API vorhanden + als call-fähig markiert
const api = await page.evaluate(()=>({
  has: !!(window.PBPinnwand && window.PBPinnwand._call),
  meta: !!(window.PBPinnwand && window.PBPinnwand._meta && window.PBPinnwand._meta.call),
  pub: (window.PBPinnwand && window.PBPinnwand._call && window.PBPinnwand._call.pub) || '',
}));
ok('Call-API (PBPinnwand._call) vorhanden', api.has===true);
ok('Widget als call-fähig markiert (_meta.call)', api.meta===true);
ok('Eigener Anruf-pubkey vorhanden (64 hex)', /^[0-9a-f]{64}$/.test(api.pub));

// 2) ICE-Konfig: Default (2 STUN) + via localStorage überschreibbar
const ice = await page.evaluate(()=>{
  const def = window.PBPinnwand._call.iceServers();
  localStorage.setItem('sbkim_pinnwand_ice_privatbrain', JSON.stringify([{urls:'turn:turn.example.org:3478',username:'u',credential:'p'}]));
  const over = window.PBPinnwand._call.iceServers();
  localStorage.removeItem('sbkim_pinnwand_ice_privatbrain');
  const back = window.PBPinnwand._call.iceServers();
  return { defLen:def.length, defStun:/stun:/.test(JSON.stringify(def)), overTurn:/turn:turn.example.org/.test(JSON.stringify(over)), backStun:/stun:/.test(JSON.stringify(back)) };
});
ok('ICE-Default = zwei STUN-Server', ice.defLen===2 && ice.defStun===true, 'n='+ice.defLen);
ok('ICE via sbkim_pinnwand_ice_privatbrain überschreibbar (TURN)', ice.overTurn===true);
ok('ICE fällt ohne Override auf STUN-Default zurück', ice.backStun===true);

// 3) RTCPeerConnection mit Default-ICE + createOffer liefert SDP (mit Fake-Stream)
const pcTest = await page.evaluate(async ()=>{
  try{
    const pc = window.PBPinnwand._call.newPeer();
    const st = await navigator.mediaDevices.getUserMedia({audio:true,video:false});
    st.getTracks().forEach(t=>pc.addTrack(t,st));
    const offer = await pc.createOffer();
    const okSdp = !!(offer && offer.sdp && /^v=0/.test(offer.sdp));
    st.getTracks().forEach(t=>t.stop()); pc.close();
    return { okSdp };
  }catch(e){ return { err:String(e) }; }
});
ok('RTCPeerConnection + createOffer liefert SDP (Fake-Stream)', pcTest.okSdp===true, pcTest.err||'');

// 4) Signaling-'offer' E2E-Round-Trip über dm_crypto (Fremder → null)
const rt = await page.evaluate(async ()=>{
  const c = window.PBPinnwand._call;
  const dm = await import('/modules/dm_crypto.js');
  const B = dm.newIdentity(), C = dm.newIdentity();
  const payload = { v:1, type:'offer', callId:'t1', sdp:'v=0\r\n', video:false };
  // Widget verschlüsselt FÜR B; B entschlüsselt mit Widget-pub (ECDH symmetrisch)
  const content = await c.encrypt(B.pub, payload);
  const atB = await dm.dmDecrypt(content, B.priv, c.pub);
  const parsedB = atB ? JSON.parse(atB) : null;
  const atC = await dm.dmDecrypt(content, C.priv, c.pub); // Fremder
  // Eingehend: B verschlüsselt FÜR Widget; Widget entschlüsselt via c.decrypt(content,B.pub)
  const inbound = await dm.dmEncrypt(JSON.stringify(payload), B.priv, c.pub);
  const parsedIn = await c.decrypt(inbound, B.pub);
  const strangerIn = await c.decrypt(inbound, C.pub);
  return {
    prefixed: dm.isDm(content),
    outOk: parsedB && parsedB.type==='offer' && parsedB.callId==='t1',
    stranger: atC===null,
    inOk: parsedIn && parsedIn.type==='offer' && parsedIn.callId==='t1',
    strangerIn: strangerIn===null,
  };
});
ok('Signaling-Content ist dm_crypto-Geheimtext', rt.prefixed===true);
ok('Anruf-Signal E2E-Round-Trip lesbar (raus + rein)', rt.outOk===true && rt.inOk===true);
ok('Fremder kann Signal NICHT lesen (→ null)', rt.stranger===true && rt.strangerIn===true);

// 5) Kontakte-Overlay: 📞 Anrufen + 📹 Video pro Kontakt
const btns = await page.evaluate(async ()=>{
  window.PBPinnwand.open(); await new Promise(r=>setTimeout(r,80));
  document.querySelector('#pbpin-dm-contacts').click(); await new Promise(r=>setTimeout(r,80));
  const all = [...document.querySelectorAll('.pbpin-callbtn')];
  const call = all.filter(b=>/Anrufen/.test(b.textContent)).length;
  const vid = all.filter(b=>/Video/.test(b.textContent)).length;
  // Overlay wieder schließen
  const closeBtn = [...document.querySelectorAll('button')].find(b=>b.textContent==='Schließen'); if(closeBtn) closeBtn.click();
  return { call, vid };
});
ok('📞 Anrufen-Knopf pro Kontakt vorhanden', btns.call>=1, 'n='+btns.call);
ok('📹 Video-Knopf pro Kontakt vorhanden', btns.vid>=1, 'n='+btns.vid);

// 6) Eingehendes (entschlüsseltes) 'offer' → Klingel-UI (Annehmen/Ablehnen) mit Namen
const ring = await page.evaluate(async (contact)=>{
  const c = window.PBPinnwand._call;
  c.deliver(contact, { v:1, type:'offer', callId:'ring1', sdp:'v=0\r\n', video:true });
  await new Promise(r=>setTimeout(r,60));
  const el = document.querySelector('#pbpin-ring');
  const shown = el && getComputedStyle(el).display!=='none';
  const txt = el ? el.textContent : '';
  const accept = !!document.querySelector('#pbpin-ring-accept');
  const reject = !!document.querySelector('#pbpin-ring-reject');
  const ringing = c.isRinging();
  document.querySelector('#pbpin-ring-reject').click(); // ablehnen → aufräumen
  await new Promise(r=>setTimeout(r,40));
  const gone = !document.querySelector('#pbpin-ring');
  return { shown, txt, accept, reject, ringing, gone, notRingingAfter: !c.isRinging() };
}, CONTACT);
ok('Eingehendes Offer zeigt Klingel-UI', ring.shown===true && ring.ringing===true);
ok('Klingel nennt den Kontakt-Namen', /Firma Tester/.test(ring.txt), '"'+ring.txt.slice(0,50)+'"');
ok('Klingel hat Annehmen + Ablehnen', ring.accept===true && ring.reject===true);
ok('Ablehnen räumt die Klingel auf', ring.gone===true && ring.notRingingAfter===true);

// 7) startCall (Fake-Stream) öffnet Anruf-Fenster; Auflegen räumt auf (PC closed, Fenster weg)
const life = await page.evaluate(async (contact)=>{
  const c = window.PBPinnwand._call;
  await c.startCall(contact, false); // Ton-Anruf, Fake-Mikro
  await new Promise(r=>setTimeout(r,250));
  const st = c.state();
  const pc = c.peer();
  const winBefore = !!document.querySelector('#pbpin-callwin');
  const stateBefore = pc ? pc.connectionState : 'none';
  c.hangup();
  await new Promise(r=>setTimeout(r,120));
  const winAfter = !!document.querySelector('#pbpin-callwin');
  const stateAfter = pc ? pc.connectionState : 'none';
  const cleared = c.state()===null;
  return { st, winBefore, stateBefore, winAfter, stateAfter, cleared };
}, CONTACT);
ok('startCall öffnet das Anruf-Fenster + setzt aktiven Anruf', life.winBefore===true && !!life.st, 'state='+JSON.stringify(life.st));
ok('Auflegen räumt auf: Anruf-Fenster weg + Zustand null', life.winAfter===false && life.cleared===true);
ok('Auflegen schließt die RTCPeerConnection (connectionState closed)', life.stateAfter==='closed', life.stateBefore+' → '+life.stateAfter);

// 8) getUserMedia-nicht-verfügbar → fail-soft (kein Crash, kein aktiver Anruf)
const failsoft = await page.evaluate(async (contact)=>{
  const c = window.PBPinnwand._call;
  const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = ()=>Promise.reject(new Error('NotAllowedError'));
  let threw=false;
  try { await c.startCall(contact, false); } catch(e){ threw=true; }
  await new Promise(r=>setTimeout(r,80));
  const noCall = c.state()===null;
  const noWin = !document.querySelector('#pbpin-callwin');
  navigator.mediaDevices.getUserMedia = orig; // wiederherstellen
  return { threw, noCall, noWin };
}, CONTACT);
ok('getUserMedia-Fehler ist fail-soft (kein Throw, kein Anruf, kein Fenster)', failsoft.threw===false && failsoft.noCall===true && failsoft.noWin===true);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,200));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
