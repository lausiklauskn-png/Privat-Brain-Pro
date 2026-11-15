// Erzeugt aus Datei-Organizer lib/siebe.ts (scripts/kern-js.mjs). Nicht von Hand ändern.
import { istGehaltsabrechnung, gehaltLesen } from "./gehalt.js";
import { absenderAusGruss, erkenneAbsender, erkenneBetrag, erkenneBetrifft, erkenneDatum, erkenneFrist, erkenneKategorie, erkenneNummern, erkenneSchriftstueck } from "./erkennen.js";
import { FOTOS } from "./kategorien.js";
import { absenderName } from "./eml.js";
import { absenderWaehlen } from "./absenderwahl.js";
import { fristWaehlen } from "./fristwahl.js";
import { lernregelAnwenden } from "./lernen.js";
import { artMitModell, bereichMitModell } from "./wortmodell.js";
const STUFEN = [
  { nr: 0, name: "Eingang", kurz: "alles in einem Ordner" },
  { nr: 1, name: "Art", kurz: "Dateikopf, Doppelte" },
  { nr: 2, name: "Kopf", kurz: "Briefkopf, Foto-Daten" },
  { nr: 3, name: "Kategorie", kurz: "Lebensbereich, Nummern" },
  { nr: 4, name: "Absender", kurz: "wer schreibt" },
  { nr: 5, name: "Inhalt", kurz: "wer ist gemeint, Frist" }
];
const KOPF_ZEICHEN = 1500;
const gesperrt = (d) => Boolean(d.auffaellig || d.doppeltVon);
const textOhne = (d) => !d.kopfText && !d.volltext;
function setze(d, feld, wert) {
  if (!wert || d.bestaetigt?.[feld]) return;
  d.felder[feld] = wert;
}
function siebe(datei, stufe, regeln = []) {
  const d = { ...datei, felder: { ...datei.felder } };
  if (gesperrt(d) || stufe <= d.stufe && stufe !== 0) return d;
  if (d.groesse === 0) {
    d.stufe = Math.max(d.stufe, stufe);
    return d;
  }
  const kopf = (d.kopfText || d.volltext || "").slice(0, KOPF_ZEICHEN);
  const voll = d.volltext || d.kopfText || "";
  if (stufe >= 2 && d.stufe < 2) {
    if (d.art === "bild" && textOhne(d)) {
      setze(d, "schriftstueck", { wert: "Foto", sicher: true, grund: d.bild?.aufnahme ? "Bild ohne lesbaren Text, Aufnahmedaten vorhanden" : "Bild ohne lesbaren Text", quelle: "regel" });
      if (d.bild?.aufnahme) setze(d, "datum", { wert: d.bild.aufnahme.slice(0, 10), sicher: true, grund: `Aufnahme laut Foto-Daten${d.bild.modell ? ` (${d.bild.modell})` : ""}`, quelle: "regel" });
    } else {
      setze(d, "schriftstueck", istGehaltsabrechnung(voll) ? { wert: "Abrechnung", sicher: true, grund: "Gehaltsabrechnung erkannt (Brutto, Netto, Abz\xFCge)", quelle: "regel" } : artMitModell(erkenneSchriftstueck(kopf, d.email?.betreff), `${d.email?.betreff || ""}
${voll}`));
      const datum = d.email?.datum ? { wert: d.email.datum, sicher: true, grund: "Datum der E-Mail", quelle: "regel" } : erkenneDatum(kopf);
      setze(d, "datum", datum || (d.geaendert ? { wert: new Date(d.geaendert).toISOString().slice(0, 10), sicher: false, grund: "kein Datum im Text \u2013 \xC4nderungsdatum der Datei", quelle: "regel" } : void 0));
    }
  }
  if (stufe >= 3 && d.stufe < 3) {
    if (d.art === "bild" && textOhne(d)) setze(d, "kategorie", { wert: FOTOS, sicher: true, grund: "Foto ohne lesbaren Text \u2013 selbst zuordnen oder aus dem Organizer nehmen (Sortieren \u203A Fotos ohne Text)", quelle: "regel" });
    else if (istGehaltsabrechnung(voll)) setze(d, "kategorie", { wert: "Rente, Arbeit & Sozialversicherung", sicher: true, grund: "Gehaltsabrechnung", quelle: "regel" });
    else setze(d, "kategorie", bereichMitModell(erkenneKategorie(`${d.email?.betreff || ""}
${kopf}`, d.email?.von || erkenneAbsender(kopf)?.wert || absenderAusGruss(voll)?.wert || "", d.felder.schriftstueck?.wert), `${d.email?.betreff || ""}
${voll}`));
    d.felder.nummern = erkenneNummern(kopf + "\n" + (d.email?.betreff || ""));
  }
  if (stufe >= 4 && d.stufe < 4) {
    if (d.email?.von) setze(d, "absender", { wert: absenderName(d.email.von), sicher: true, grund: "Absender der E-Mail", quelle: "regel" });
    else if (!textOhne(d)) {
      const kopfW = erkenneAbsender(kopf), gruss = absenderAusGruss(voll), regel = kopfW || gruss;
      setze(d, "absender", (regel?.sicher ? regel : absenderWaehlen(voll, { kopf: kopfW, gruss })) || regel || { wert: "unbekannt", sicher: false, grund: "kein Absender im Kopf gefunden", quelle: "regel" });
    } else if (d.art === "bild") setze(d, "absender", { wert: d.bild?.modell ? `eigenes Foto (${d.bild.modell})` : "eigenes Foto", sicher: true, grund: "Foto ohne Text", quelle: "regel" });
    else setze(d, "absender", { wert: "unbekannt", sicher: false, grund: "kein lesbarer Text (Scan ohne Textebene?)", quelle: "regel" });
    for (const r of regeln) lernregelAnwenden(d, r);
  }
  if (stufe >= 5 && d.stufe < 5) {
    if (!textOhne(d)) {
      const weitere = erkenneNummern(voll).filter((n) => !d.felder.nummern?.some((x) => x.art === n.art && x.wert === n.wert));
      d.felder.nummern = [...d.felder.nummern || [], ...weitere];
      setze(d, "betrifft", erkenneBetrifft(voll) || { wert: "unbekannt", sicher: false, grund: "keine Anrede, kein Anschriftfeld", quelle: "regel" });
      const fr = erkenneFrist(voll, d.felder.datum?.wert, d.felder.datum?.sicher !== false);
      setze(d, "frist", fr?.sicher ? fr : fristWaehlen(voll, fr, d.felder.datum));
      setze(d, "betrag", erkenneBetrag(voll));
      const g = gehaltLesen(voll);
      if (g) {
        d.gehalt = g;
        if (g.auszahlung) setze(d, "betrag", { wert: `${g.auszahlung} \u20AC`, sicher: true, grund: "Auszahlungsbetrag der Gehaltsabrechnung", quelle: "regel" });
      }
    }
    for (const r of regeln) lernregelAnwenden(d, r);
  }
  d.stufe = Math.max(d.stufe, stufe);
  return d;
}
function unsichereFelder(d, stufe) {
  if (gesperrt(d)) return [];
  const je = { 2: ["schriftstueck"], 3: ["kategorie"], 4: ["absender"], 5: ["betrifft"] };
  return (je[stufe] || []).filter((f) => {
    const v = d.felder[f];
    return v && !v.sicher && !d.bestaetigt?.[f];
  });
}
const istUnsicher = (d, stufe) => unsichereFelder(d, stufe).length > 0;
const offeneFelder = (d) => [2, 3, 4, 5].filter((s) => s <= d.stufe).flatMap((s) => unsichereFelder(d, s));
export {
  KOPF_ZEICHEN,
  STUFEN,
  gesperrt,
  istUnsicher,
  offeneFelder,
  siebe,
  unsichereFelder
};
