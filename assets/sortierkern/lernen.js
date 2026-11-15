// Erzeugt aus Datei-Organizer lib/lernen.ts (scripts/kern-js.mjs). Nicht von Hand ändern.
const LERNBAR = ["kategorie"];
const lernbar = (f) => LERNBAR.includes(f);
const schluessel = (absender) => absender.toLowerCase().replace(/\s+/g, " ").trim();
function lernen(regeln, datei, k) {
  if (!lernbar(k.feld)) return regeln;
  const abs = datei.felder.absender?.wert;
  if (!abs || abs === "unbekannt" || /^eigenes foto/i.test(abs)) return regeln;
  const sache = k.von && k.von !== "Archiv" ? k.von : void 0;
  let r = stimme(regeln, abs, void 0, k);
  if (sache) r = stimme(r, abs, sache, k);
  return r;
}
function stimme(regeln, abs, sache, k) {
  const s = schluessel(abs);
  const alt = regeln.find((r) => schluessel(r.wenn.absender) === s && r.feld === k.feld && (r.wenn.sache || void 0) === sache);
  const stimmen = { ...alt?.stimmen || (alt ? { [alt.dann]: alt.anzahl } : {}) };
  stimmen[k.zu] = (stimmen[k.zu] || 0) + 1;
  const [dann, anzahl] = Object.entries(stimmen).sort((a, b) => b[1] - a[1])[0];
  const neu = { wenn: { absender: alt?.wenn.absender || abs, ...sache ? { sache } : {} }, feld: k.feld, dann, anzahl, stimmen };
  return alt ? regeln.map((r) => r === alt ? neu : r) : [...regeln, neu];
}
function lernregelAnwenden(d, r) {
  if (!d.felder.absender || schluessel(d.felder.absender.wert) !== schluessel(r.wenn.absender)) return;
  if (d.bestaetigt?.[r.feld]) return;
  const jetzt = d.felder[r.feld];
  const kernWert = jetzt ? jetzt.quelle === "regel" ? jetzt.wert : jetzt.vorher : void 0;
  const gegen = Object.entries(r.stimmen || {}).filter(([w]) => w !== r.dann).reduce((a, [, n]) => a + n, 0);
  if (r.wenn.sache) {
    if (kernWert !== r.wenn.sache) return;
  } else if (gegen > 0) return;
  if (jetzt?.wert === r.dann && jetzt.sicher) return;
  const sicher = r.anzahl >= 2 && r.anzahl >= 2 * gegen;
  if (!sicher && jetzt?.sicher) return;
  if (jetzt?.sicher && jetzt.quelle === "regel" && jetzt.wert !== r.dann && (r.anzahl < 3 || gegen > 0)) return;
  const bei = r.wenn.sache ? `bei \u201E${r.wenn.absender}\u201C, wenn \u201E${r.wenn.sache}\u201C vorgeschlagen war,` : `bei \u201E${r.wenn.absender}\u201C`;
  d.felder[r.feld] = { wert: r.dann, sicher, grund: `von dir gelernt: ${bei} ${r.anzahl === 1 ? "einmal" : `${r.anzahl}-mal`} so eingeordnet${gegen ? `, ${gegen}-mal anders` : ""}`, quelle: "gelernt", vorher: kernWert };
}
function korrigieren(d, feld, zu) {
  const n = { ...d, felder: { ...d.felder }, bestaetigt: { ...d.bestaetigt, [feld]: true } };
  const alt = d.felder[feld];
  n.felder[feld] = { wert: zu, sicher: true, grund: alt && alt.wert === zu ? "von dir best\xE4tigt" : `von dir korrigiert (vorher \u201E${alt?.wert ?? "\u2013"}\u201C)`, quelle: "du" };
  return n;
}
function regelnAufAlle(dateien, regeln) {
  return dateien.map((d) => {
    if (d.stufe < 4) return d;
    const n = { ...d, felder: { ...d.felder } };
    for (const r of regeln) if (r.feld !== "betrifft" || d.stufe >= 5) lernregelAnwenden(n, r);
    return n;
  });
}
export {
  korrigieren,
  lernen,
  lernregelAnwenden,
  regelnAufAlle,
  schluessel
};
