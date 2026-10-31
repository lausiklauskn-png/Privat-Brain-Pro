// Gegenprobe zu test-chefcode.mjs (Pro-Umbau 14): je Fall eine Sabotage in native/pro-chefcode.js (und der Kopie in www/), dann die Probe.
// Jeder Fall muss eine rote Zeile bringen. Die Datei wird immer zurückgesetzt. Aufruf: node tools/native/gegenprobe-chefcode.mjs [NUR_FALL=…]
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const QUELLE = 'native/pro-chefcode.js', KOPIE = 'www/pro-chefcode.js';
// Nicht als Fall: „Felder nach einer Aktion leeren“ ist ein doppelter Riegel — der Kasten baut die Felder danach ohnehin neu
// (gemessen 2026-10-31: die Sabotage allein rutscht durch, weil sie nichts ändert).
const FAELLE = [
  ['setzen ohne Entsperren', "if (!entsperrt(rdv)) return { ok: false, grund: 'gesperrt' };\n    return netzSetzen(rdv, code);", 'return netzSetzen(rdv, code);'],
  ['entfernen ohne Entsperren', "if (!entsperrt(rdv)) return { ok: false, grund: 'gesperrt' };\n    const antwortete = !!(rdv._meta && rdv._meta.answering);\n    try { if (typeof rdv.clearNetwork", 'const antwortete = !!(rdv._meta && rdv._meta.answering);\n    try { if (typeof rdv.clearNetwork'],
  ['Prüfsumme des Zettels nicht geprüft', "if (ps[0] !== u[u.length - 3] || ps[1] !== u[u.length - 2] || ps[2] !== u[u.length - 1]) return { ok: false, grund: 'zettelFalsch' };", ''],
  ['PIN im Klartext gespeichert', [["return { s: b64(salz), h: b64(await pinWert(pin, salz)) };", "return { s: b64(salz), h: b64(await pinWert(pin, salz)), p: String(pin) };"],
    ["JSON.stringify({ v: 1, rolle: rec.rolle, s: rec.s, h: rec.h,", "JSON.stringify({ v: 1, rolle: rec.rolle, s: rec.s, h: rec.h, p: rec.p,"]]],
  ['Fehlversuche ohne Wartezeit', 'if (rec.f >= SPERRE_AB) rec.bis', 'if (false) rec.bis'],
  ['Gesperrt zeigt das Code-Feld', "if (!z.offen) {\n", "if (!z.offen) { bereich.append(geheimFeld(wort('feld'), 'proCcFeld', false));\n"],
  ['PIN-Wiederholung nicht verglichen', "if (String(pin).trim() !== String(pin2 == null ? '' : pin2).trim()) return { ok: false, grund: 'pinUngleich' };\n    const z = zustand(rdv);", 'const z = zustand(rdv);'],
  ['Mitarbeiter ist nach dem Beitritt entsperrt', "if (!alt || alt.rolle !== 'chef') sperren(rdv);", 'offenBis.set(schluessel(rdv), Date.now() + OFFEN_MS);'],
];
const nur = process.env.NUR_FALL || '';
const roh = await readFile(QUELLE, 'utf8');
let gefangen = 0, durch = 0, tot = 0, falsch = 0;
const leer = spawnSync('node', ['tools/native/test-chefcode.mjs'], { encoding: 'utf8', timeout: 600000 });
if (leer.status !== 0) { console.log('Die Probe ist schon ohne Sabotage rot (Browser? CB_CHROMIUM) — Gegenprobe misst nichts.\n' + (leer.stderr || '').slice(-400)); process.exit(2); }
try {
  for (const [name, a, b] of FAELLE) {
    if (nur && !name.includes(nur)) continue;
    const paare = Array.isArray(a) ? a : [[a, b]];
    if (paare.some(([alt]) => !roh.includes(alt))) { console.log('TOTER ANKER: ' + name); tot++; continue; }
    let s = roh; for (const [alt, neu] of paare) s = s.replace(alt, neu);
    if (s === roh) { console.log('TOTER ANKER (nichts geändert): ' + name); tot++; continue; }
    await writeFile(QUELLE, s); await writeFile(KOPIE, s);
    const r = spawnSync('node', ['tools/native/test-chefcode.mjs'], { encoding: 'utf8', timeout: 600000 });
    const z = (r.stderr + r.stdout).match(/AssertionError \[ERR_ASSERTION\]: ([^\n]*)/);
    if (r.status !== 0 && z) { gefangen++; console.log('gefangen: ' + name + ' — rot: ' + z[1].slice(0, 140)); }
    else if (r.status !== 0) { falsch++; console.log('AUS FALSCHEM GRUND: ' + name + ' — ' + (r.stderr || '').trim().split('\n').slice(-3).join(' ').slice(0, 200)); }
    else { durch++; console.log('DURCHGERUTSCHT: ' + name); }
  }
} finally { await writeFile(QUELLE, roh); await writeFile(KOPIE, roh); }
console.log(`${gefangen} gefangen · ${durch} durchgerutscht · ${falsch} aus falschem Grund · ${tot} tote Anker`);
process.exit(durch || tot || falsch ? 1 : 0);
