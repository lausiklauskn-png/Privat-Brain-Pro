#!/usr/bin/env node
// Gegenprobe für Schritt D2 (Tresorordner): baut je einen Fehler in eine Wegwerf-Kopie ein und verlangt, dass die
// zuständige Probe rot wird. JVM-Fälle brauchen javac/java und TRESOR_JARS (junit-4.13.2.jar, hamcrest-core-1.3.jar);
// Browser-Fälle ein gebautes www/ und CB_CHROMIUM wie test-tresorordner.mjs. NUR_FALL=<Teil des Titels> für einen Fall.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const J = 'android/app/src/main/java/de/familyprojekt/';
const E = J + 'privatebrain/pro/TresorEinzug.java';
const faelle = [
  // Kontrollen ohne Fehler: müssen GRÜN bleiben, sonst wäre jeder Fall aus dem falschen Grund rot.
  ['jvm', 'Kontrolle JVM (ohne Fehler)', E, 'final class TresorEinzug {', 'final class TresorEinzug {'],
  ['web', 'Kontrolle Browser (ohne Fehler)', 'www/native-tresorordner.js', "'use strict';", "'use strict';"],
  ['jvm', 'Kennung des Tresors nicht geprüft', E, 'return tresorId != null && tresorId.equals(kopf.get("id")) ? "PASST" : "FREMDER_TRESOR";', 'return "PASST";'],
  ['jvm', 'Ordner „Private Brain“ selbst wird angenommen', E, 'if (a.gibtEs(TRESOR_KOPF)) return "IST_FACH";', ''],
  ['jvm', 'Einzug schreibt in „Private Brain/“', E, '        t.fachEinziehen(FACH, datenSchluessel);\n', '        t.fachEinziehen(FACH, datenSchluessel);\n        t.ablegen(FACH, "", "spur", "text/plain", 0, new java.io.ByteArrayInputStream(new byte[1]), "");\n'],
  ['jvm', 'Rechnungsmail landet im eigenen Fach statt im Eingang', E, 'return t.ablegen(EINGANG_BLP, MAILS,', 'return t.ablegen(FACH, MAILS,'],
  ['jvm', 'Verzeichnis wird jedes Mal neu geschrieben', E, '        if (gleich) return false;\n', ''],
  ['jvm', 'Schreiber/Format kommen von außen', E, 'm.put("schreiber", APP); m.put("verschluesselung", "app");', 'm.put("schreiber", z.getOrDefault("schreiber", APP)); m.put("verschluesselung", z.getOrDefault("verschluesselung", "app"));'],
  ['web', 'Abschnitt nicht im Kasten Speicherort', 'www/native-tresorordner.js', "    if (!card || section.isConnected) return Boolean(card);", "    return false;"],
  ['web', 'Mail-Zeile trägt den ganzen Mailtext', 'www/native-tresorordner.js', "auszug: kurz(r.snippet || r.summary || ''),", "auszug: String(r.mailBody || r.snippet || ''),"],
  ['web', 'Teilen fragt nicht, legt still ab', 'www/native-tresorordner.js', '    const wahl = await frage();', "    const wahl = 'tresor';"],
  ['web', 'Ohne offenen Ordner wird trotzdem gefragt', 'www/native-tresorordner.js', "    if (!(z?.offen && z.eingezogen && z.pruefung === 'PASST')) return device.openOriginal(args);", ''],
  ['web', 'Mailinhalt geht durch die Seite', 'www/native-tresorordner.js', "auszug: kurz(meta.auszug) });", "auszug: kurz(meta.auszug), raw: 'From: x' });"],
  ['web', 'Hintergrund schreibt in fremden Ordner', 'www/native-tresorordner.js', "      if (!(z.offen && z.eingezogen && z.pruefung === 'PASST')) return null;", "      if (!(z.offen && z.eingezogen)) return null;"],
];

const nur = process.env.NUR_FALL;
let gefangen = 0, durch = 0;
for (const [art, titel, datei, alt, neu] of faelle) {
  if (nur && !titel.includes(nur)) continue;
  const tmp = mkdtempSync(join(tmpdir(), 'tresor-d2-gp-'));
  try {
    if (art === 'jvm') cpSync(join(repo, 'android/app/src'), join(tmp, 'android/app/src'), { recursive: true });
    else {
      cpSync(join(repo, 'www'), join(tmp, 'www'), { recursive: true });
      mkdirSync(join(tmp, 'tools/native'), { recursive: true });
      for (const n of ['test-tresorordner.mjs', 'test-navigation-helper.mjs']) cpSync(join(repo, 'tools/native', n), join(tmp, 'tools/native', n));
      symlinkSync(join(repo, 'node_modules'), join(tmp, 'node_modules'));
    }
    const text = readFileSync(join(tmp, datei), 'utf8');
    if (!text.includes(alt)) { console.log(`TOTER ANKER    ${titel}`); durch++; continue; }
    writeFileSync(join(tmp, datei), text.replace(alt, neu));
    let rot = false;
    try {
      if (art === 'jvm') {
        const jars = process.env.TRESOR_JARS; if (!jars) { console.error('TRESOR_JARS fehlt'); process.exit(2); }
        const cp = [join(jars, 'junit-4.13.2.jar'), join(jars, 'hamcrest-core-1.3.jar')].join(':');
        const a = join(tmp, 'jvm/a'), b = join(tmp, 'jvm/b'), cls = join(tmp, 'jvm/cls');
        for (const d of [a, b, cls]) mkdirSync(d, { recursive: true });
        for (const n of readdirSync(join(tmp, J, 'tresor'))) if (n !== 'SafAblage.java') cpSync(join(tmp, J, 'tresor', n), join(a, n));
        for (const n of ['TresorEinzug.java', 'VaultCrypto.java']) cpSync(join(tmp, J, 'privatebrain/pro', n), join(b, n));
        cpSync(join(tmp, 'android/app/src/test/java/de/familyprojekt/privatebrain/pro/TresorEinzugTest.java'), join(b, 'TresorEinzugTest.java'));
        execFileSync('javac', ['-encoding', 'UTF-8', '-d', cls, '-cp', cp, ...readdirSync(a).map(n => join(a, n)), ...readdirSync(b).map(n => join(b, n))], { stdio: 'pipe' });
        execFileSync('java', ['-Dsun.jnu.encoding=UTF-8', '-Dfile.encoding=UTF-8', '-cp', cls + ':' + cp, 'org.junit.runner.JUnitCore', 'de.familyprojekt.privatebrain.pro.TresorEinzugTest'], { stdio: 'pipe', env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } });
      } else execFileSync('node', [join(tmp, 'tools/native/test-tresorordner.mjs')], { stdio: 'pipe', cwd: tmp, timeout: 240000 });
    } catch { rot = true; }
    if (titel.startsWith('Kontrolle')) { console.log(`${rot ? 'KONTROLLE ROT ' : 'KONTROLLE GRÜN'} ${titel}`); if (rot) durch++; continue; }
    console.log(`${rot ? 'GEFANGEN      ' : 'DURCHGERUTSCHT'} ${titel}`);
    rot ? gefangen++ : durch++;
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}
console.log(`\n${gefangen} gefangen · ${durch} durchgerutscht`);
process.exit(durch ? 1 : 0);
