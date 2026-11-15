// Such-Proben messen (Klaus 15.11.2026, Frage-Weg): 50 Fragen an einem erfundenen Bestand (tools/such-proben/).
// Verglichen: alt (Explorer bis 1.0.50: jedes Wort in Name/Pfad, mit Haken auch im Inhalt) · neu ohne Kern-Kästchen
// (Füllwörter, Grundformen, Inhalt von selbst; Felder des Kerns zählen nicht) · neu mit Kern (Frage lesen → Kästchen).
// Aufruf: node tools/messen-suche.mjs [--einzeln]   Rückgabe 1, wenn „neu mit Kern“ nicht besser ist als beide anderen.
import { readFileSync } from 'node:fs'; import vm from 'node:vm';
import { BESTAND, ELTERN } from './such-proben/bestand.mjs'; import { FRAGEN } from './such-proben/fragen.mjs';
const PB = new URL('..', import.meta.url).pathname;
const { felder } = await import(PB + 'assets/sortierkern-anschluss-kern.mjs').catch(async () => {
  // Node: Anschluss ohne Seite (gleiche Rechnung wie assets/sortierkern-anschluss.js)
  const { siebe } = await import(PB + 'assets/sortierkern/siebe.js'); const { absenderName } = await import(PB + 'assets/sortierkern/eml.js');
  const wert = (w) => (w && w.wert && !['unbekannt', 'Unklar', 'keine Frist'].includes(w.wert) ? String(w.wert) : '');
  return { felder(r, mutter) {
    const text = r.text || '', mail = r.mail; const iso = mail ? new Date(mail.date).toISOString().slice(0, 10) : undefined;
    const x = siebe({ pfad: r.name, name: r.name, art: r.bild ? 'bild' : mail ? 'mail' : 'pdf', groesse: text.length || 1, geaendert: r.date, kopfText: text.slice(0, 1500), volltext: text, felder: {}, stufe: 1, ...(mail ? { email: { von: mail.from, betreff: mail.subject, datum: iso } } : {}) }, 5).felder;
    let absender = wert(x.absender), sicher = !!x.absender?.sicher; if ((!absender || !sicher) && mutter?.mail?.from) { absender = absenderName(mutter.mail.from); sicher = true; }
    return { art: wert(x.schriftstueck), artSicher: !!x.schriftstueck?.sicher, bereich: wert(x.kategorie), absender, absenderSicher: sicher, datum: wert(x.datum) };
  } };
});
const ctxVm = { console }; ctxVm.globalThis = ctxVm; vm.createContext(ctxVm); vm.runInContext(readFileSync(PB + 'assets/such-frage.js', 'utf8'), ctxVm);
const S = ctxVm.PBSuchFrage;
// Katalog wie in der App
const html = readFileSync(PB + 'index.html', 'utf8'), stueck = (a, e) => { const i = html.indexOf(a), j = html.indexOf(e, i); return html.slice(i, j); };
const alt = {}; vm.createContext(alt); vm.runInContext([stueck('function extOf(name){', '\n'), stueck('function fold(s){', '\n}\n') + '\n}', stueck('const CATS = [', 'function catIcon'), stueck('function stem(w){', '// kleine Synonym'), 'this.suggestCategory=suggestCategory;this.stem=stem;'].join('\n'), alt);
const nachId = new Map();
const katalog = BESTAND.map((b) => { const r = { id: b.id, hash: b.id, name: b.name, path: (b.mail ? 'Mail/' + S.mailName(b.mail.from) + '/' : 'Eingang/') + b.name, date: b.date, type: b.bild ? 'image/jpeg' : b.mail ? 'message/rfc822' : 'application/pdf', ext: b.bild ? 'jpg' : b.mail ? 'eml' : 'pdf', snippet: (b.text || '').slice(0, 600), ende: (b.text || '').slice(-600), caption: b.caption, mail: b.mail, mailBody: b.mail ? b.text : undefined, category: b.mail ? 'E-Mail' : alt.suggestCategory(b.name, b.text) }; nachId.set(b.id, r); return r; });
for (const [kind, mutter] of Object.entries(ELTERN)) nachId.get(kind).fromMail = mutter;
for (const r of katalog) r.kern = felder({ ...BESTAND.find((b) => b.id === r.id) }, r.fromMail ? BESTAND.find((b) => b.id === r.fromMail) : null);
const eltern = (r) => (r.fromMail ? nachId.get(r.fromMail) : null);
const ctx = S.kontext(katalog, eltern);

const foldAlt = (s) => String(s || '').toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
const wege = {
  'alt (Name/Pfad)': (q) => { const w = foldAlt(q).split(/\s+/).filter(Boolean); return katalog.filter((r) => w.every((x) => foldAlt(r.name + ' ' + r.path).includes(x))).sort((a, b) => b.date - a.date); },
  'alt (+ Inhalt)': (q) => { const w = foldAlt(q).split(/\s+/).filter(Boolean); return katalog.filter((r) => { const n = foldAlt(r.name + ' ' + r.path); if (w.every((x) => n.includes(x))) return true; const t = foldAlt([r.snippet, r.mailBody, r.ende, r.caption].join(' ')); return w.every((x) => t.includes(x)); }).sort((a, b) => b.date - a.date); },
  'neu ohne Kern': (q) => { const ohneFelder = katalog.map((r) => ({ ...r, kern: undefined, category: undefined })); return S.suchen(ohneFelder, q, [], { ...S.kontext([], eltern), eltern }, null, { ohneFelder: true }).treffer.map((x) => nachId.get(x.r.id)); },
  'neu mit Kern': (q) => S.suchen(katalog, q, [], ctx).treffer.map((x) => x.r),
};
const einzeln = process.argv.includes('--einzeln'), erg = {};
for (const [weg, f] of Object.entries(wege)) {
  let richtig = 0, erste = 0, vollst = 0, falsch = 0; const fehl = [];
  for (const q of FRAGEN) {
    const ids = f(q.f).map((r) => r.id);
    let ok;
    if (q.alle) { const soll = new Set(q.alle), ist = new Set(ids); ok = soll.size === ist.size && [...soll].every((x) => ist.has(x)); if ([...soll].every((x) => ist.has(x))) vollst++; falsch += ids.filter((x) => !soll.has(x)).length; }
    else { ok = q.eine.includes(ids[0]); if (ok) erste++; falsch += ids.length > 12 ? 1 : 0; }
    if (ok) richtig++; else fehl.push(`${q.f} → ${ids.slice(0, 8).join(',') || '–'}`);
  }
  erg[weg] = richtig;
  console.log(`${weg.padEnd(16)} richtig ${String(richtig).padStart(2)}/${FRAGEN.length} · Mehrzahl vollständig ${vollst}/${FRAGEN.filter((q) => q.alle).length} · Einzahl an erster Stelle ${erste}/${FRAGEN.filter((q) => !q.alle).length} · falsche Treffer ${falsch}`);
  if (einzeln) fehl.forEach((x) => console.log('   ✗ ' + x));
}
const besser = erg['neu mit Kern'] > erg['alt (+ Inhalt)'] && erg['neu mit Kern'] > erg['neu ohne Kern'];
console.log(besser ? 'Frage-Weg mit Kern ist besser als alt und als neu ohne Kern.' : 'ROT: Frage-Weg mit Kern ist nicht besser.');
process.exit(besser ? 0 : 1);
