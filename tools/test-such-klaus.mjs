// Klaus' Suchbeispiele vom Gerätetest 1.0.52 (16.11.2026): getrenntes Diktat („An Tropic“), Absender-Suche (Rewe, Aldi, yfood),
// Dokument nach Inhalt (Ordnung auf Japanisch). Geprüft wird die Frage-Suche (assets/such-frage.js), die „Dateien“ benutzt und
// deren Zusammenziehen auch die Startseite ruft. Erfundener Bestand, keine echten Daten. Aufruf: node tools/test-such-klaus.mjs
import { readFileSync } from 'node:fs'; import vm from 'node:vm';
const c = { console }; c.globalThis = c; vm.createContext(c);
vm.runInContext(readFileSync(new URL('../assets/such-frage.js', import.meta.url), 'utf8'), c);
const S = c.PBSuchFrage;
const tf = (t) => Object.fromEntries(S.fold(t).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2).map((w) => [S.stem(w), 1]));
const dok = (id, name, text, kern = {}) => ({ hash: id, id, name, path: 'Dokumente/' + name, type: 'application/pdf', ext: 'pdf', date: Date.UTC(2026, 9, 2), snippet: text, tf: tf(name + ' ' + text), kern, tags: [] });
const mail = (id, from, subject, body, kern = {}) => ({ hash: id, id, name: subject + '.eml', path: 'Mail/' + subject, type: 'message/rfc822', ext: 'eml', date: Date.UTC(2026, 9, 5), mail: { from, subject, date: Date.UTC(2026, 9, 5) }, mailBody: body, snippet: body, tf: tf(subject + ' ' + from + ' ' + body), kern: { absender: S.mailName(from), absenderSicher: true, ...kern }, tags: [] });
const K = [
  dok('pdf-anthropic', 'Invoice-7F3A2C.pdf', 'Invoice Anthropic, PBC. Bill to Klaus. Claude Pro subscription. Amount due $20.00.', { art: 'Rechnung', artSicher: true }),
  dok('pdf-japan', 'Ordnung auf Japanisch.pdf', 'Aufräumen in fünf Schritten. Aussortieren, sauber halten, reinigen, Reinigungsmittel sparsam verwenden.', { art: 'Brief' }),
  dok('pdf-putz', 'Putzplan Küche.pdf', 'Arbeitsflächen wischen, Boden säubern, Kühlschrank reinigen. Reinigungsmittel unter der Spüle.'),
  dok('pdf-miete', 'Mietvertrag.pdf', 'Mietvertrag über die Wohnung Lindenweg 4. Im Haus ist ein ALDI um die Ecke.', { art: 'Vertrag', artSicher: true }),
  mail('m-rewe', 'REWE <newsletter@rewe.de>', 'Deine Angebote der Woche', 'Frische Angebote in deinem Markt.'),
  mail('m-aldi', 'ALDI SÜD <info@aldi-sued.de>', 'Neu ab Montag', 'Unsere Aktionsartikel ab Montag.'),
  mail('m-yfood', 'yfood <hello@yfood.eu>', 'Deine Bestellung ist unterwegs', 'Trinkmahlzeit Classic Choco, 12 Flaschen.'),
  mail('m-anthropic', 'Anthropic <billing@anthropic.com>', 'Your receipt from Anthropic, PBC', 'Receipt for your Claude Pro subscription.', { art: 'Rechnung', artSicher: true }),
];
const ctx = S.kontext(K, () => null);
const ids = (q) => S.suchen(K, q, [], ctx).treffer.map((x) => x.r.id);
let rot = 0, n = 0;
const ok = (name, wert, zeig) => { n++; if (wert) console.log('✓ ' + name); else { rot++; console.log('✗ ' + name + (zeig !== undefined ? ' → ' + JSON.stringify(zeig) : '')); } };
const hat = (q, ...soll) => { const i = ids(q); ok(`„${q}“ findet ${soll.join(' + ')}`, soll.every((s) => i.includes(s)), i); };
const erste = (q, soll) => { const i = ids(q); ok(`„${q}“: ${soll} steht oben`, i[0] === soll, i); };

hat('rechnung an tropic', 'pdf-anthropic', 'm-anthropic');      // Diktat trennt das Wort und lässt das h weg
hat('an tropic', 'pdf-anthropic', 'm-anthropic');
hat('rechnung anthropic', 'pdf-anthropic', 'm-anthropic');      // Absender erkannt: das PDF mit dem Wort im Text bleibt dabei
erste('anthropic', 'm-anthropic');                              // echter Absender steht vor „kommt im Text vor“
erste('rewe', 'm-rewe'); erste('yfood', 'm-yfood'); erste('y food', 'm-yfood');
erste('aldi', 'm-aldi'); hat('aldi', 'pdf-miete');              // Absender oben, Erwähnung im Text darunter
erste('ordnung auf japanisch', 'pdf-japan'); erste('japanisch ordnung', 'pdf-japan'); erste('pdf ordnung auf japanisch', 'pdf-japan');
hat('reinigungsmittel', 'pdf-japan', 'pdf-putz'); hat('aufräumen', 'pdf-japan');
// Gegenstücke: Zusammenziehen darf nichts erfinden und richtige Fragen nicht verbiegen
ok('„miet vertrag“ wird zu „mietvertrag“', S.zusammen && S.zusammen('miet vertrag', ctx) === 'mietvertrag', S.zusammen && S.zusammen('miet vertrag', ctx));
ok('„neu ab montag“ bleibt, wie es ist', S.zusammen && S.zusammen('neu ab montag', ctx) === '', S.zusammen && S.zusammen('neu ab montag', ctx));
ok('„xy qz“ wird nicht verbogen und findet nichts', S.zusammen && S.zusammen('xy qz', ctx) === '' && ids('xy qz').length === 0);
ok('Suche sagt, wie sie die Frage verstanden hat', S.suchen(K, 'rechnung an tropic', [], ctx).verstanden === 'rechnung anthropic', S.suchen(K, 'rechnung an tropic', [], ctx).verstanden);
// Generalprüfung 16.11.2026: normale Sätze mit Füllwort dürfen nicht zu einem nie gemeinten Wort zusammengezogen werden.
{
  const K2 = [dok('r24', 'Rechnungen 2024.pdf', 'Sammlung der Rechnungen aus Berlin.'), dok('amt', 'Briefen an das Amt.pdf', 'Antwort auf den Bescheid.'), dok('mama', 'Brief Mama.pdf', 'Liebe Mama, viele Grüße.'),
    dok('anth', 'Invoice.pdf', 'Invoice Anthropic, PBC.')];
  const c2 = S.kontext(K2, () => null);
  ok('„brief an mama“ wird nicht zu „briefen mama“', S.zusammen('brief an mama', c2) === '', S.zusammen('brief an mama', c2));
  ok('„rechnung in berlin“ wird nicht zu „rechnungen berlin“', S.zusammen('rechnung in berlin', c2) === '', S.zusammen('rechnung in berlin', c2));
  ok('„briefe an mama“ bleibt auch, wie es ist', S.zusammen('briefe an mama', c2) === '', S.zusammen('briefe an mama', c2));
  ok('im selben Bestand geht „an tropic“ → „anthropic“ weiter', S.zusammen('an tropic', c2) === 'anthropic', S.zusammen('an tropic', c2));
}
console.log(rot ? `ROT: ${rot} von ${n}` : `${n} Proben zu Klaus' Suchbeispielen bestanden (erfundener Bestand, nicht am Gerät).`);
process.exit(rot ? 1 : 0);
