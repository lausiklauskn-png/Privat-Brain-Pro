// Begleitdatei an die Familienakte gegen den echten Leser der Familienakte prüfen (lib/uebergabe-vorschlaege.ts, Repo
// Meine-Familienakte). Ohne Nachbar-Repo: nur das Format (Rückgabe 0 mit Hinweis). Aufruf: node tools/test-familienakte-begleitung.mjs [pfad-familienakte]
import { readFileSync, existsSync } from 'node:fs'; import { join, resolve } from 'node:path'; import vm from 'node:vm'; import { createHash } from 'node:crypto';
const PB = new URL('..', import.meta.url).pathname, FA = resolve(process.argv[2] || join(PB, '../Meine-Familienakte'));
let gruen = 0, rot = 0; const ok = (n, c, i = '') => { if (c) { gruen++; console.log('✓ ' + n); } else { rot++; console.log('✗ ROT: ' + n + (i ? ' – ' + i : '')); } };
const ctx = {}; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['assets/such-frage.js', 'assets/familienakte-begleitung.js']) vm.runInContext(readFileSync(join(PB, f), 'utf8'), ctx);
const B = ctx.PBFamilienakteBegleitung;
const bytes = { 'Invoice-AB12CD-0002.pdf': 'Invoice …', 'Abschlag_November.pdf': 'Rechnung …', 'Foto.jpg': 'jpg' };
const sha = (s) => createHash('sha256').update(s).digest('hex');
const recs = [
  { r: { name: 'Invoice-AB12CD-0002.pdf', path: 'Mail-Anhang/Nordlicht Labs/Invoice-AB12CD-0002.pdf', fromMail: 'm1', ext: 'pdf', eigeneKategorie: 'Abos', kern: { art: 'Rechnung', artSicher: true, absender: 'Nordlicht Labs, Inc', bereich: 'Finanzen & Verträge', frist: '2026-11-03', betrag: '$20.00' } }, name: 'Invoice-AB12CD-0002.pdf' },
  { r: { name: 'Abschlag_November.pdf', path: 'Eingang/Abschlag_November.pdf', ext: 'pdf', kern: { art: 'Rechnung', artSicher: true, absender: 'Stadtwerke Beispielstadt GmbH', bereich: 'Haus & Wohnung', frist: '2026-11-15' } }, name: 'Abschlag_November.pdf' },
  { r: { name: 'Foto.jpg', type: 'image/jpeg', ext: 'jpg', kern: { art: 'Foto' } }, name: 'Foto.jpg' },
];
for (const x of recs) x.sha256 = sha(bytes[x.name]);
const b = B.begleitdatei(recs), data = JSON.parse(b.text);
ok('Name und Vertrag wie in der Familienakte', b.name === 'familienakte-uebergabe.json' && data.vertrag === 'familienakte-uebergabe/1' && data.quelle === 'Private Brain Pro' && data.dateien.length === 3);
ok('Unterteilung: Herkunft › Kategorie im Feld „vorgang“ (eigene Kategorie zuerst)', data.dateien[0].vorgang === 'Mail-Anhang › Abos' && data.dateien[1].vorgang === 'Datei › Rechnung' && data.dateien[2].vorgang === 'Foto › Foto', JSON.stringify(data.dateien.map((d) => d.vorgang)));
ok('Bereich, Art und Hinweis (Absender, Frist) aus dem Kern', data.dateien[0].lebensbereich === 'Finanzen & Verträge' && data.dateien[0].dokumentart === 'Rechnung' && /Absender: Nordlicht Labs/.test(data.dateien[0].hinweis) && /Frist: 2026-11-03/.test(data.dateien[0].hinweis));
ok('Höchstens 30 Einträge (Grenze der Familienakte)', JSON.parse(B.begleitdatei(Array.from({ length: 40 }, (_, i) => ({ r: { name: 'd' + i + '.pdf' }, name: 'd' + i + '.pdf' }))).text).dateien.length === 30);
ok('Steuerzeichen im Namen werden entfernt', B.eintrag({ name: 'x', kern: {} }, 'a\u0007b.pdf').name === 'a b.pdf');
// Gegen den echten Leser der Familienakte
const leser = join(FA, 'lib/uebergabe-vorschlaege.ts');
if (!existsSync(leser)) console.log('Hinweis: Familienakte nicht neben Private Brain – Leser nicht geprüft.');
else {
  const { uebergabeVorschlaege } = await import(leser);
  const files = [...recs.map((x) => new File([bytes[x.name]], x.name)), new File([b.text], b.name, { type: 'application/json' })];
  const { vorschlaege, hinweise } = await uebergabeVorschlaege(files);
  const v = (n) => vorschlaege.get(files.find((f) => f.name === n));
  ok('Familienakte liest alle drei Vorschläge', vorschlaege.size === 3, [...hinweise.values()].join(' | '));
  ok('Familienakte übernimmt Bereich, Art und Unterteilung der Rechnung', v('Invoice-AB12CD-0002.pdf')?.lebensbereich === 'Finanzen & Verträge' && v('Invoice-AB12CD-0002.pdf')?.dokumentart === 'Rechnung' && v('Invoice-AB12CD-0002.pdf')?.vorgang === 'Mail-Anhang › Abos');
  ok('Familienakte prüft die Prüfsumme: falsche Datei bekommt keinen Vorschlag', await (async () => { const f2 = [new File(['anders'], 'Abschlag_November.pdf'), new File([b.text], b.name)]; return !(await uebergabeVorschlaege(f2)).vorschlaege.size; })());
}
console.log(`Begleitdatei Familienakte: ${gruen} grün · ${rot} ROT`); process.exit(rot ? 1 : 0);
