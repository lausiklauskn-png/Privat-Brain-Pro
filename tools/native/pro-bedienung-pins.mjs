// Pin der gemeinsamen Bedien-Bausteine (Quelle Private Brain Pro). Nach jeder Änderung an native/pro-bedienung.js/.css:
//   node tools/native/pro-bedienung-pins.mjs --schreiben
// danach in Workflow PDF Pro und BookLedgerPro mit deren tools/native/bedienung-nachziehen.mjs kopieren.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const dateien = { 'pro-bedienung.js': sha('native/pro-bedienung.js'), 'pro-bedienung.css': sha('native/pro-bedienung.css') };
const fassung = Number((readFileSync('native/pro-bedienung.js', 'utf8').match(/const FASSUNG = (\d+)/) || [])[1]);
const pin = { _: 'Gemeinsame Bedien-Bausteine aller Pro-Apps. Quelle: Private Brain Pro (native/). Nie von Hand ändern.', quelle: 'lausiklauskn-png/Privat-Brain-Pro', fassung, dateien };
const pfad = 'native/pro-bedienung-herkunft.json', text = JSON.stringify(pin, null, 2) + '\n';
if (process.argv.includes('--schreiben')) { writeFileSync(pfad, text); console.log('geschrieben: ' + pfad); }
else { const alt = readFileSync(pfad, 'utf8'); if (alt !== text) { console.error('Pin veraltet: node tools/native/pro-bedienung-pins.mjs --schreiben'); process.exit(1); } console.log('Pin aktuell.'); }
