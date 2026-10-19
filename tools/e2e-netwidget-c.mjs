// Beweis Stufe C: KI-Richter (bewertet Antworten nach Bedeutung, opt-in/BYOK) +
// verschlüsselter Schlüssel-Tresor (Modul 20). EU zuerst (Mistral Default), andere
// wählbar, „nur EU"-Filter. Schlüssel liegt NIE im Klartext — Tresor-Round-Trip
// (putSecret/getSecret) headless bewiesen. Live-KI-Aufruf = nur am Tablet mit echtem
// Schlüssel; headless prüft Aufbau/Filter/Persistenz/Tresor/fail-soft.
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
// window.prompt für den Tresor-Test steuern
await page.addInitScript(()=>{ window.__prompts=[]; window.prompt=(m)=>{ return window.__nextPrompt!==undefined?window.__nextPrompt:'geheim-passwort-123'; }; });
await page.goto(`http://127.0.0.1:${PORT}/index.html`, {waitUntil:'load'});
await page.waitForTimeout(700);
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`);};

await page.evaluate(()=>window.PBNetWidget.open()); await page.waitForTimeout(150);
const T='#pbNetPanel .pbnet-tool';

// 1) KI-Richter-Abschnitt vorhanden, Default AUS
const sec = await page.evaluate((T)=>{
  const t=document.querySelector(T);
  const toggle=[...t.querySelectorAll('button')].find(b=>/KI-Richter/.test(b.textContent));
  return { has: !!toggle, off: toggle && /aus/.test(toggle.textContent), meta: window.PBNetWidget._meta.stage };
}, T);
ok('KI-Richter-Abschnitt vorhanden', sec.has===true);
ok('KI-Richter Default AUS (opt-in)', sec.off===true);
ok('Widget als Stufe C markiert', sec.meta==='C');

// 2) Einschalten zeigt Anbieter-Dropdown (EU-gefiltert) + Schlüsselfeld + 🔑-Link
const on = await page.evaluate((T)=>{
  const t=document.querySelector(T);
  [...t.querySelectorAll('button')].find(b=>/KI-Richter/.test(b.textContent)).click();
  const sel=t.querySelector('select.pbnet-field');
  const opts=sel?[...sel.options].map(o=>({v:o.value,t:o.textContent})):[];
  const keyField=!!t.querySelector('input[type="password"]');
  const link=!!t.querySelector('a');
  const eu=[...t.querySelectorAll('button')].some(b=>/nur EU/.test(b.textContent));
  return { opts, keyField, link, eu, def: sel&&sel.value };
}, T);
ok('Anbieter-Dropdown erscheint', on.opts.length>=1, on.opts.map(o=>o.v).join(','));
ok('EU zuerst: Mistral Default', on.def==='mistral');
ok('„nur EU"-Filter: nur EU-Anbieter (Default an)', on.opts.every(o=>/🇪🇺/.test(o.t)), on.opts.map(o=>o.t).join(' | '));
ok('BYOK-Schlüsselfeld vorhanden', on.keyField===true);
ok('🔑 Schlüssel-holen-Link vorhanden', on.link===true);
ok('🇪🇺 nur-EU-Umschalter vorhanden', on.eu===true);

// 3) „nur EU" ausschalten → mehr Anbieter (Claude/Gemini/OpenRouter …)
const euOff = await page.evaluate((T)=>{
  const t=document.querySelector(T);
  [...t.querySelectorAll('button')].find(b=>/nur EU/.test(b.textContent)).click();
  const sel=t.querySelector('select.pbnet-field');
  return { n: sel?sel.options.length:0, ids:[...sel.options].map(o=>o.value) };
}, T);
ok('Ohne EU-Filter mehr Anbieter wählbar', euOff.n>1, euOff.ids.join(','));
ok('Nicht-EU-Anbieter jetzt dabei (z. B. claude)', euOff.ids.includes('claude'));

// 4) Verschlüsselter Tresor-Round-Trip über Modul 20 (kein Klartext at rest)
const tresor = await page.evaluate(async ()=>{
  const S=window.SbkimSafe; if(!S) return {no:true};
  const name='ki_richter_key_mistral';
  await S.removeSecret(name);
  const put=await S.putSecret(name, 'sk-TESTKEY-123', 'geheim-passwort-123');
  const has=await S.hasSecret(name);
  const good=await S.getSecret(name, 'geheim-passwort-123');
  const bad=await S.getSecret(name, 'falsch');
  // Klartext darf NICHT im rohen Blob stehen
  const raw = await (window.SbkimStorage.get('sbkim_safe', 'secret:'+name).catch(()=>null));
  const leak = raw ? JSON.stringify(raw).includes('sk-TESTKEY-123') : false;
  await S.removeSecret(name);
  return { put, has, good, bad, leak };
});
ok('Tresor putSecret/hasSecret ok', !tresor.no && tresor.put===true && tresor.has===true);
ok('Tresor getSecret liefert Schlüssel bei richtigem Passwort', tresor.good==='sk-TESTKEY-123');
ok('Tresor getSecret verweigert bei falschem Passwort', tresor.bad===null);
ok('Kein Klartext-Schlüssel at rest (verschlüsselt)', tresor.leak===false);

// 5) 🔒 im Tresor merken über die UI (window.prompt gemockt) + Status
const uiSave = await page.evaluate(async (T)=>{
  const t=document.querySelector(T);
  const key=t.querySelector('input[type="password"]'); key.value='sk-UI-999'; key.dispatchEvent(new Event('input'));
  window.__nextPrompt='mein-tresor-pw-1';
  [...t.querySelectorAll('button')].find(b=>/im Tresor merken/.test(b.textContent)).click();
  // PBKDF2-600k kann ein paar hundert ms brauchen — nicht fix warten, sondern pollen.
  let stored=false;
  for(let i=0;i<40 && !stored;i++){ await new Promise(r=>setTimeout(r,50)); stored=await window.SbkimSafe.hasSecret('ki_richter_key_mistral'); }
  const status=t.querySelector('div[style*="white-space:pre-wrap"]');
  await window.SbkimSafe.removeSecret('ki_richter_key_mistral');
  return { txt: status?status.textContent:'', stored };
}, T);
ok('🔒 im Tresor merken (UI) speichert verschlüsselt', uiSave.stored===true, `("${(uiSave.txt||'').slice(0,40)}")`);

// 6) KI-Persistenz: an/Anbieter/EU-Wahl in localStorage (NICHT der Schlüssel)
const pref = await page.evaluate(()=>{
  const raw=localStorage.getItem('pb_net_ki_pref_privatbrain');
  return { raw, hasKey: raw?/sk-|apiKey|UI-999/.test(raw):false };
});
ok('KI-Vorwahl persistiert (on/provider/euOnly)', !!pref.raw && /provider/.test(pref.raw), pref.raw);
ok('Schlüssel NICHT in der Vorwahl gespeichert', pref.hasKey===false);

// 7) fail-soft: Frage stellen mit KI an, aber ohne Schlüssel → Vorfilter gilt, kein Crash
const soft = await page.evaluate(async (T)=>{
  const t=document.querySelector(T);
  // KI an lassen, Schlüsselfeld leeren
  const key=t.querySelector('input[type="password"]'); if(key){ key.value=''; key.dispatchEvent(new Event('input')); }
  // judgeResults direkt über eine simulierte Antwort testen wäre intern; wir prüfen,
  // dass hybridMatch ohne Key fail-soft ist (available:false), was das Widget nutzt:
  const jr=await window.SbkimMatch.hybridMatch({text:'test',label:'test'}, [{label:'A',text:'A'}], {apiKey:'', provider:'mistral', euOnly:true});
  return { available: jr.available, hasFallback: Array.isArray(jr.fallbackCandidates) };
}, T);
ok('KI an, kein Schlüssel → fail-soft (Vorfilter, kein Crash)', soft.available===false && soft.hasFallback===true);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,180));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
