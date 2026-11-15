// Erzeugt aus Datei-Organizer lib/gehalt.ts (scripts/kern-js.mjs). Nicht von Hand ändern.
const MON = ["januar", "februar", "m\xE4rz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember"];
const BETRAG = String.raw`(\d{1,3}(?:\.\d{3})*,\d{2})`;
const zeile = (t, wort) => {
  const m = t.match(new RegExp(`^\\s*(?:\\d{3,4}\\s+)?${wort}[^\\n\\d]{0,40}?${BETRAG}`, "im"));
  return m?.[1];
};
function istGehaltsabrechnung(text) {
  const t = text.toLowerCase();
  return /(brutto|bezüge|entgelt|bruttolohn)/.test(t) && /(netto|auszahlung)/.test(t) && /(lohnsteuer|rentenversicherung|krankenversicherung|sv-nummer|sozialversicherung)/.test(t);
}
function gehaltLesen(text) {
  if (!istGehaltsabrechnung(text)) return null;
  const t = text.replace(/\r/g, "");
  const g = { bezuege: [] };
  const m1 = t.match(new RegExp(`(${MON.join("|")})\\s+(20\\d{2})`, "i"));
  const m2 = t.match(/abrechnungszeitraum\s*:?\s*(\d{2})\.(20\d{2})/i);
  if (m1) g.zeitraum = `${m1[2]}-${String(MON.indexOf(m1[1].toLowerCase()) + 1).padStart(2, "0")}`;
  else if (m2) g.zeitraum = `${m2[2]}-${m2[1]}`;
  g.brutto = zeile(t, "(?:gesamt-brutto|bruttolohn gesamt|gesamtbrutto|brutto gesamt|bruttobez\xFCge)");
  g.netto = zeile(t, "(?:nettobez\xFCge|nettolohn|nettoverdienst|netto)");
  g.auszahlung = zeile(t, "(?:auszahlungsbetrag|auszahlung|\xFCberweisungsbetrag)");
  g.lohnsteuer = zeile(t, "lohnsteuer");
  g.kirchensteuer = zeile(t, "kirchensteuer");
  g.soli = zeile(t, "solidarit\xE4tszuschlag");
  g.kv = zeile(t, "krankenversicherung");
  g.rv = zeile(t, "rentenversicherung");
  g.av = zeile(t, "arbeitslosenversicherung");
  g.pv = zeile(t, "pflegeversicherung");
  g.steuerklasse = t.match(/(?:st\.?\s?kl\.?|steuerklasse)\s*:?\s*([1-6])\b/i)?.[1];
  const id = t.match(/(?:steuer-id|identifikationsnummer)[^\d\n]{0,20}((?:\d\s?){11})/i)?.[1];
  if (id) g.steuerId = id.replace(/\s/g, "");
  const sv = t.match(/(?:sv-nummer|sozialversicherungsnummer|versicherungsnummer)\s*:?\s*(\d{2}\s?\d{6}\s?[A-Z]\s?\d{3})/i)?.[1];
  if (sv) g.svNummer = sv.replace(/\s/g, "");
  g.krankenkasse = t.match(/krankenkasse\s*:?\s+([^\n]+?)(?:\s{2,}|$)/im)?.[1]?.trim();
  g.personalNr = t.match(/personal-?\s?(?:nr\.?|nummer)\s*:?\s*(\d{3,})/i)?.[1];
  const bis = t.search(/gesamt-brutto|bruttolohn gesamt|gesamtbrutto/i);
  for (const z of t.slice(0, bis > 0 ? bis : t.length).split("\n")) {
    const m = z.match(new RegExp(`^\\s*(?:\\d{4}\\s+)?([A-Za-z\xC4\xD6\xDC\xE4\xF6\xFC\xDF][^:\\d]{2,40}?)\\s*:?\\s+${BETRAG}(?:\\s*EUR)?\\s*$`));
    if (m && !/steuer-id|personal|eintritt|sv-nummer|kinderfreibetrag/i.test(m[1])) g.bezuege.push({ bezeichnung: m[1].trim(), betrag: m[2] });
  }
  return g;
}
export {
  gehaltLesen,
  istGehaltsabrechnung
};
