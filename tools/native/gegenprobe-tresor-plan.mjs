#!/usr/bin/env node
// Gegenprobe zum gemeinsamen Tresor-Plan (Klaus 2026-11-03): nimmt je eine Korrektur in einer Wegwerf-Kopie zurück und verlangt,
// dass test-tresor-plan.mjs rot wird. Braucht ein gebautes www/, CB_CHROMIUM und javac/java (TRESOR_JARS wie die Probe).
// NUR_FALL=<Teil des Titels> für einen Fall. Das Repo selbst wird nie verändert.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const P = 'android/app/src/main/java/de/familyprojekt/privatebrain/pro/';
const faelle = [
  ['Kontrolle (ohne Eingriff)', 'www/native-recovery.js', "'use strict';", "'use strict';"],
  ['Ersatzschlüssel: keine Warnung, Ergebnis still übernommen', 'www/native-recovery.js', 'if(!result?.nebenTresor||!await warn())return result;', 'return result;'],
  ['Ersatzschlüssel: nach Abbrechen nur „abgebrochen“ statt Tresor-Meldung', 'www/index.html', "result.nebenTresor?'beside':'cancelled'", "'cancelled'"],
  ['Hilfe ohne Hinweis auf unverschlüsselte Ablagekopien', 'www/native-wo-liegt-was.js', "['app', 'verbinden', 'speicherort', 'ablage', 'original', 'ersatz']", "['app', 'verbinden', 'speicherort', 'original', 'ersatz']"],
  ['Hilfe-Knopf nicht im Kasten', 'www/native-wo-liegt-was.js', "if (!knopf.isConnected) { const row = card.querySelector('.btnrow'); row ? row.after(knopf) : card.append(knopf); }", ''],
  ['Speicherort: Code statt Meldung', 'www/native-vault.js', '    VAULT_FOLDER_IM_TRESOR: [', '    VAULT_FOLDER_IM_TRESOR_WEG: ['],
  ['Speicherort-Dialog ohne Hinweissatz', 'www/native-vault.js', ' Gibt es schon den gemeinsamen Tresor aller Pro-Apps: Wähle den Ordner, in dem „tresorordner.json“ liegt – Private Brain nutzt darin seinen Ordner „Private Brain“.', ''],
  ['Pro-Tresor verbinden: falscher Ordner nur als Code', 'www/native-pro-verbund.js', 'if(!text)throw error;note=text;', 'throw error;'],
  ['JVM: Verwaltung nur am Namen erkannt', P + 'OrdnerWahl.java', 'if (k.toLowerCase(Locale.ROOT).matches("(kennwort|ersatz|fach)-[a-z0-9-]+\\\\.json")) return VERWALTUNG;', 'if (false) return VERWALTUNG;'],
  ['JVM: Datei direkt neben „Private Brain“ nicht erkannt', P + 'OrdnerWahl.java', 'if (eltern != null && eltern.equalsIgnoreCase(eltern(ziel))) return true;', ''],
  ['JVM: Fach einer anderen App als Speicherort erlaubt', P + 'OrdnerWahl.java', 'if (FACH.equals(art) && !a.gibtEs(KOPF_APP)', 'if (false && !a.gibtEs(KOPF_APP)'],
  ['JVM: Tresor ohne tresorordner.json gilt als passend', P + 'OrdnerWahl.java', '        return "NEU";\n', '        return null;\n'],
  ['Java: Ersatzschlüssel ohne Tresor-Prüfung geschrieben', P + 'ProFilesPlugin.java', '                if (nebenTresor(destination)) {', '                if (false) {'],
  ['Java: Speicherort ohne Ordner-Prüfung', P + 'ProVaultPlugin.java', 'String falsch = OrdnerWahl.speicherortFehler(', 'String falsch = null; String alt = String.valueOf('],
  ['Java: neuer Tresor ohne eigenen Haken', P + 'ProVaultPlugin.java', '            if (anlegen && !confirmNeu.isChecked()) { status.setText(tt[7]); return; }\n', ''],
];
let gefangen = 0, durch = 0;
for (const [titel, datei, alt, neu] of faelle) {
  if (process.env.NUR_FALL && !titel.includes(process.env.NUR_FALL) && !titel.startsWith('Kontrolle')) continue;
  const tmp = mkdtempSync(join(tmpdir(), 'gegenprobe-tresor-plan-'));
  try {
    mkdirSync(join(tmp, 'tools/native'), { recursive: true });
    for (const n of ['test-tresor-plan.mjs', 'test-navigation-helper.mjs']) cpSync(join(repo, 'tools/native', n), join(tmp, 'tools/native', n));
    cpSync(join(repo, 'android/app/src'), join(tmp, 'android/app/src'), { recursive: true });
    cpSync(join(repo, 'www'), join(tmp, 'www'), { recursive: true });
    symlinkSync(join(repo, 'node_modules'), join(tmp, 'node_modules'));
    const text = readFileSync(join(tmp, datei), 'utf8');
    if (!text.includes(alt)) { console.log(`TOTER ANKER    ${titel}`); durch++; continue; }
    const geaendert = text.replace(alt, neu);
    if (!titel.startsWith('Kontrolle') && geaendert === text) { console.log(`OHNE WIRKUNG   ${titel}`); durch++; continue; }
    writeFileSync(join(tmp, datei), geaendert);
    let rot = false;
    try { execFileSync('node', [join(tmp, 'tools/native/test-tresor-plan.mjs')], { stdio: 'pipe', cwd: tmp, timeout: 240000, env: { ...process.env, PB_PRO_TEST_ROOT: join(tmp, 'www') } }); }
    catch { rot = true; }
    if (titel.startsWith('Kontrolle')) { console.log(`${rot ? 'KONTROLLE ROT ' : 'KONTROLLE GRÜN'} ${titel}`); if (rot) durch++; continue; }
    console.log(`${rot ? 'GEFANGEN      ' : 'DURCHGERUTSCHT'} ${titel}`);
    rot ? gefangen++ : durch++;
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}
console.log(`\n${gefangen} gefangen · ${durch} durchgerutscht`);
process.exit(durch ? 1 : 0);
