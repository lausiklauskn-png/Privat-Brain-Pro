#!/usr/bin/env node
// Gegenprobe „Alle Konten“ als Postfach (Klaus 22.11.2026): baut je einen Fehler in eine Wegwerf-Kopie von www/ ein und
// verlangt, dass test-mail-alle-konten.mjs rot wird. Braucht ein gebautes www/ und CB_CHROMIUM wie die Probe.
// NUR_FALL=<Teil des Titels> für einen Fall.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const L = 'www/assets/live-mail.js', I = 'www/native-mail-index.js';
const faelle = [
  // Kontrolle ohne Fehler: muss GRÜN bleiben, sonst wäre jeder Fall aus dem falschen Grund rot.
  ['Kontrolle (ohne Fehler)', L, '"use strict";', '"use strict";'],
  ['Index liest Spam und Papierkorb nicht', I, ".filter(f => !f.collection && !f.noSelect &&", ".filter(f => !f.collection && !['\\\\Junk','\\\\Trash'].includes(f.specialUse) && !/spam|papierkorb/i.test(f.path) && !f.noSelect &&"],
  ['Gmail-Sammelordner wird mitgelesen', I, ".filter(f => !f.collection && !f.noSelect &&", ".filter(f => !f.noSelect &&"],
  ['Anhang-Angaben werden nicht gemerkt', I, '    if (files.length) rec.mailFiles = files; else delete rec.mailFiles;', ''],
  ['Sammelaktion nicht je Konto getrennt', L, 'const k = item.account + "\\n" + item.folder + "\\n" + item.validity;', 'const k = "eins";'],
  ['Ziel nach dem ersten Konto statt je Konto', L, '      const dest = type === "move" ? resolveTarget(acc, target) : null;', '      const dest = type === "move" ? resolveTarget(items.find((x) => selected.has(keyOf(x))).account, target) : null;'],
  ['Liste zeigt alles auf einmal', L, '  const PAGE_SHOW = 15;', '  const PAGE_SHOW = 1000;'],
  ['Ordnerzahlen nur vom ersten Konto', L, 'for (const a of known) for (const f of allFolders[a.id].list) if (f.role === role', 'for (const a of known.slice(0, 1)) for (const f of allFolders[a.id].list) if (f.role === role'],
  ['Mail öffnet im falschen Konto', L, '    if (allMode) useItemAccount(item);\n', ''],
  ['Wahl „Alle Konten“ wird nicht gemerkt', L, '    allMode = true; choice(ALL);', '    allMode = true;'],
  ['Kein Vorausladen', L, '    const page = items.filter((i) => !i.local).slice(0, shownCount);', '    const page = [];'],
  ['Vorausladen markiert als gelesen', L, '        prefetched.set(k, data);', '        prefetched.set(k, data); await api("/" + encodeURIComponent(ctx.account) + "/messages/" + item.uid + "/action", { folder: ctx.folder, validity: ctx.validity, action: "read" });'],
  ['Werkzeuge öffnen wieder die eigene Seite', L, '    PBMailIndex.mount(list, mode);', '    PBMailIndex.show(true);'],
];

const nur = process.env.NUR_FALL;
let gefangen = 0, durch = 0, falsch = 0;
for (const [titel, datei, alt, neu] of faelle) {
  if (nur && !titel.includes(nur)) continue;
  const tmp = mkdtempSync(join(tmpdir(), 'alle-konten-gp-'));
  try {
    cpSync(join(repo, 'www'), join(tmp, 'www'), { recursive: true });
    mkdirSync(join(tmp, 'tools/native'), { recursive: true });
    cpSync(join(repo, 'tools/native/test-mail-alle-konten.mjs'), join(tmp, 'tools/native/test-mail-alle-konten.mjs'));
    symlinkSync(join(repo, 'node_modules'), join(tmp, 'node_modules'));
    const pfad = join(tmp, datei), text = readFileSync(pfad, 'utf8');
    if (text.split(alt).length !== 2) { console.log('✗ TOTER ANKER: ' + titel); falsch++; continue; }
    const neuText = text.replace(alt, neu);
    if (alt !== neu && neuText === text) { console.log('✗ NICHTS GEÄNDERT: ' + titel); falsch++; continue; }
    writeFileSync(pfad, neuText);
    let gruen = true;
    try { execFileSync('node', ['tools/native/test-mail-alle-konten.mjs'], { cwd: tmp, stdio: 'pipe', timeout: 240000 }); }
    catch { gruen = false; }
    const kontrolle = titel.startsWith('Kontrolle');
    if (kontrolle) { if (gruen) console.log('✓ ' + titel + ' bleibt grün'); else { console.log('✗ ' + titel + ' ist rot'); falsch++; } }
    else if (gruen) { console.log('✗ DURCHGERUTSCHT: ' + titel); durch++; }
    else { console.log('✓ gefangen: ' + titel); gefangen++; }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}
console.log(`${gefangen} gefangen · ${durch} durchgerutscht · ${falsch} aus falschem Grund/tote Anker`);
process.exit(durch || falsch ? 1 : 0);
