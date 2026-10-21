// Reading the validity of offers in newsletters. Pure logic; no browser, no network.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const sandbox = {window: {}};
vm.runInNewContext(readFileSync(new URL('../../native/native-mail-expiry.js', import.meta.url), 'utf8'), sandbox);
const {find, expired, DAY} = sandbox.window.PBMailExpiry;
let count = 0;
const at = (y, m, d) => new Date(y, m - 1, d, 23, 59, 59).getTime();
const mail = new Date(2026, 9, 20, 8, 0).getTime(); // Tuesday 2026-10-20
function same(name, text, expected, reference = mail) {
  const r = find(text, reference);
  assert.equal(r.until, expected, name + ' → ' + (r.until ? new Date(r.until).toISOString() : 'null') + ' (' + r.phrase + ')');
  console.log('✓ ' + name); count++;
}
same('gültig bis mit Punkt-Datum', 'Unsere Angebote sind gültig bis 26.10.', at(2026, 10, 26));
same('gültig bis zum mit Jahr', 'Gültig bis zum 31.10.2026, solange der Vorrat reicht.', at(2026, 10, 31));
same('zweistellige Jahreszahl', 'Aktion gültig bis 2.11.26', at(2026, 11, 2));
same('Zeitraum vom … bis …', 'Angebote vom 20.10. bis 25.10.', at(2026, 10, 25));
same('Zeitraum mit Gedankenstrich', 'Aktionszeitraum: 20.10.2026 – 26.10.2026', at(2026, 10, 26));
same('Monatsname deutsch', 'Nur noch bis 3. November!', at(2026, 11, 3));
same('Monatsname englisch', 'Offer valid until October 28, 2026', at(2026, 10, 28));
same('endet am', 'Der Sale endet am 24.10.', at(2026, 10, 24));
same('Kalenderwoche', 'Die Angebote der KW 43 für Sie', at(2026, 10, 25));
same('Überschneidung: das späteste Ende gilt', 'Wochenangebote bis 25.10. · Neue Sorten gültig bis 15.11.', at(2026, 11, 15));
same('Umlaute und geschütztes Leerzeichen', 'GÜLTIG\u00a0BIS\u00a026.10.', at(2026, 10, 26));
same('Dezember-Mail, Januar-Angebot', 'Gültig bis 6.1.', at(2027, 1, 6), new Date(2026, 11, 20).getTime());
same('KW über den Jahreswechsel', 'Angebote KW 1', at(2027, 1, 10), new Date(2026, 11, 28).getTime());
same('Einzelnes Datum ohne Signalwort zählt nicht', 'Ihre Bestellung vom 12.10. ist unterwegs.', null);
same('Frisches Datum ohne Signalwort zählt auch nicht', 'Ihre Bestellung vom 19.10. ist unterwegs, Lieferung am 23.10.', null);
same('Wochentag ohne Datum ist unklar', 'Nur bis Sonntag!', null);
same('Kein Datum', 'Entdecken Sie unsere neue Kollektion.', null);
same('Unmögliches Datum', 'gültig bis 31.02.', null);
same('Weit zurückliegendes Ende macht unsicher', 'gültig bis 01.03.2025', null);
same('Zu weit in der Zukunft macht unsicher', 'gültig bis 01.01.2030', null);
same('Uhrzeit ist kein Datum', 'Bestellen Sie bis 12.30 Uhr', null);
assert.equal(expired(at(2026, 10, 26), new Date(2026, 10 - 1, 27, 12).getTime()), false); console.log('✓ Am Tag danach noch nicht abgelaufen (1 Tag Puffer)'); count++;
assert.equal(expired(at(2026, 10, 26), new Date(2026, 10 - 1, 28, 0, 30).getTime()), true); console.log('✓ Zwei Tage danach abgelaufen'); count++;
assert.equal(expired(null, Date.now() + 1000 * DAY), false); console.log('✓ Ohne Datum nie abgelaufen'); count++;
console.log(`${count} expiry checks passed (pure logic).`);
