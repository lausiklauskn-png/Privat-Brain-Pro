#!/usr/bin/env node
// Gegenprobe für das zweite Bedeutungs-Modell (Pro-Umbau 5): baut je einen Fehler in eine Wegwerf-Kopie von www/ ein und
// verlangt, dass test-meaning.mjs rot wird. Braucht ein gebautes www/ und CB_CHROMIUM. NUR_FALL=<Teil des Titels> für einen Fall.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const M = 'native-meaning.js', I = 'index.html';
const faelle = [
  ['Kontrolle (ohne Fehler)', M, "'use strict';", "'use strict';"],
  ['Suche liest weiter nur r.evec (Haken fehlt)', I, 'const eco = ecoOf(qe, r);', 'const eco = (qe && r.evec) ? cosineE(qe, r.evec) : 0;'],
  ['Halb eingeordnet wird schon genutzt', M, '      if (!stand().komplett) return false;\n', ''],
  ['Texte ohne e5-Rolle „passage: “', M, "embed(texts.map(s => 'passage: ' + s))", 'embed(texts)'],
  ['Frage ohne e5-Rolle „query: “', M, "embed(['query: ' + String(query || '')])", 'embed([String(query || \'\')])'],
  ['Einordnen startet nach dem Laden von selbst', M, "    try { native = await plugin.install({ stage }); live = null; }", "    try { native = await plugin.install({ stage }); live = null; setTimeout(einordnen, 0); }"],
  ['Vektoren am Katalog-Eintrag (gemischt)', M, '        if (vectors.stage === stage) for (const row of rows) vectors.map.set(row.h, row);', '        if (vectors.stage === stage) for (const row of rows) vectors.map.set(row.h, row);\n        for (const r of batch) r.evec = Array.from(rows[0].v);'],
  ['Ohne Hintergrundaufgabe', M, '    if (window.ProHintergrund) {', '    if (false) {'],
  ['Abbrechen wird überhört', M, '        if (job.abort.signal.aborted || wahl !== stage) break;', '        if (wahl !== stage) break;'],
  ['Modell startet beim App-Start', M, '    await loadVectors(wahl);\n    await refresh();', "    await loadVectors(wahl);\n    await refresh();\n    if (wahl) starten(wahl);"],
  // Doppelt gesichert (bereit() und starten()): beide Stellen fallen, sonst fängt die andere.
  ['Absturzschutz fehlt', M, ['      const z = st(s); if (!z.installed || z.crashes > 0) return false;', '    if (!st(stage).installed || st(stage).crashes > 0) return Promise.resolve(false);'], ['      const z = st(s); if (!z.installed) return false;', '    if (!st(stage).installed) return Promise.resolve(false);']],
  ['Entfernen lässt die Werte liegen', M, "    try { await tx(stage, 'readwrite', s => s.clear()); } catch { /* leer */ }", ''],
  ['Kein Gerätecheck vor dem Laden', M, "    if (window.ProGeraet) { try { const v = await window.ProGeraet.vorDemLaden(GERAET[stage]);", "    if (false) { try { const v = await window.ProGeraet.vorDemLaden(GERAET[stage]);"],
];
const nur = process.env.NUR_FALL;
let gefangen = 0, durch = 0, falsch = 0;
for (const [titel, datei, alt, neu] of faelle) {
  if (nur && !titel.includes(nur)) continue;
  const tmp = mkdtempSync(join(tmpdir(), 'meaning-gp-'));
  try {
    cpSync(join(repo, 'www'), join(tmp, 'www'), { recursive: true });
    const pfad = join(tmp, 'www', datei), text = readFileSync(pfad, 'utf8');
    const alte = [].concat(alt), neue = [].concat(neu);
    if (alte.some(x => text.split(x).length !== 2)) { console.log('✗ TOTER ANKER: ' + titel); falsch++; continue; }
    let neuText = text; alte.forEach((x, i) => { neuText = neuText.replace(x, neue[i]); });
    if (titel.startsWith('Kontrolle') ? neuText !== text : neuText === text) { console.log('✗ EINGRIFF OHNE WIRKUNG: ' + titel); falsch++; continue; }
    writeFileSync(pfad, neuText);
    let rot = false;
    try { execFileSync('node', [join(repo, 'tools/native/test-meaning.mjs')], { cwd: tmp, env: { ...process.env, PB_WWW: join(tmp, 'www') }, stdio: 'pipe', timeout: 240000 }); }
    catch { rot = true; }
    if (titel.startsWith('Kontrolle')) { console.log((rot ? '✗ KONTROLLE ROT: ' : '✓ Kontrolle grün: ') + titel); if (rot) falsch++; }
    else if (rot) { console.log('✓ gefangen: ' + titel); gefangen++; }
    else { console.log('✗ DURCHGERUTSCHT: ' + titel); durch++; }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}
console.log(`${gefangen} gefangen · ${durch} durchgerutscht · ${falsch} Fehler der Gegenprobe`);
if (durch || falsch) process.exitCode = 1;
