// Pin der gemeinsamen Bausteine aller Pro-Apps (Quelle Private Brain Pro). Nach jeder Änderung an einer der Dateien unten:
//   node tools/native/pro-bedienung-pins.mjs --schreiben
// danach in Workflow PDF Pro und BookLedgerPro mit deren tools/native/bedienung-nachziehen.mjs kopieren.
// Fassung 3 (2026-10-28 abends): dazu der Gerätecheck (pro-geraet.js). Fassung 2 (Pro-Umbau 4): dazu die Hintergrundaufgabe (pro-hintergrund.js + Android-Dienst de.familyprojekt.hintergrund).
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
export const BAUSTEINE = [
  'native/pro-bedienung.js', 'native/pro-bedienung.css', 'native/pro-hintergrund.js', 'native/pro-geraet.js',
  'android/app/src/main/java/de/familyprojekt/hintergrund/ProHintergrundPlugin.java',
  'android/app/src/main/java/de/familyprojekt/hintergrund/ProHintergrundDienst.java'
];
const dateien = Object.fromEntries(BAUSTEINE.map(p => [p.split('/').pop(), sha(p)]));
const fassung = Number((readFileSync('native/pro-bedienung.js', 'utf8').match(/const FASSUNG = (\d+)/) || [])[1]);
const pin = { _: 'Gemeinsame Bausteine aller Pro-Apps (Bedienung + Hintergrundaufgabe). Quelle: Private Brain Pro. Nie von Hand ändern.', quelle: 'lausiklauskn-png/Privat-Brain-Pro', fassung, pfade: BAUSTEINE, dateien };
const pfad = 'native/pro-bedienung-herkunft.json', text = JSON.stringify(pin, null, 2) + '\n';
if (process.argv.includes('--schreiben')) { writeFileSync(pfad, text); console.log('geschrieben: ' + pfad); }
else { const alt = readFileSync(pfad, 'utf8'); if (alt !== text) { console.error('Pin veraltet: node tools/native/pro-bedienung-pins.mjs --schreiben'); process.exit(1); } console.log('Pin aktuell.'); }
