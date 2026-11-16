/* Such-Frage lesen (Klaus 15.11.2026, Punkte 2, 3 und Frage-Weg): ein Suchfeld für alles.
   „ich suche alle Rechnungen von Anthropic aus dem Oktober“ → Kästchen Art = Rechnung, Absender ≈ anthropic, Monat = Oktober;
   Füllwörter fallen weg, was übrig bleibt, geht an Wort- und Bedeutungssuche. Einzahl „Rechnung“ = eine bestimmte erwartet
   (die passendste oben), Mehrzahl „Rechnungen“ = alle (nach Absender gruppiert).
   Reine Funktionen ohne Seite: dieselbe Datei misst die Such-Proben in Node (tools/messen-suche.mjs). */
(function (wurzel) {
  'use strict';
  const fold = (s) => String(s || '').toLocaleLowerCase('de').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  // dieselbe vorsichtige Kürzung wie die Suche der App (index.html stem)
  const stem = (w) => w.replace(/(ungen|ung|heiten|heit|keiten|keit|nisse|niss|innen|isch|lich|bar)$/, '').replace(/(en|er|es|em|nd|st)$/, '').replace(/(e|n|s)$/, '') || w;

  const FUELL = new Set(('ich du er sie es wir ihr mir mich mein meine meinen meiner meinem unser unsere unseren dein deine '
    + 'suche suchen such sucht finde finden find zeig zeige zeigen zeigt gib gibt brauche brauch hole hol hab habe hatte haben '
    + 'bitte mal noch nur auch alle alles allen aller jede jeden jedes welche welcher welches wo wann was gibt es ist sind war '
    + 'der die das den dem des ein eine einen einem einer und oder mit ohne zu zum zur im in am an auf aus von vom bei beim fur uber '
    + 'dateien datei dokument dokumente unterlagen sachen sache '
    + 'i me my mine show find search look looking for please all any every the a an of from with and or to in on at by some files file documents').split(/\s+/));
  const VON = new Set(['von', 'vom', 'from', 'bei', 'by']);

  // Arten des Sortier-Kerns: Wort (gefaltet) → [Art, Mehrzahl]
  const ARTEN = {};
  const art = (wert, einzahl, mehrzahl) => { for (const w of einzahl) ARTEN[w] = [wert, false]; for (const w of mehrzahl) ARTEN[w] = [wert, true]; };
  art('Rechnung', ['rechnung', 'invoice', 'receipt', 'quittung', 'beleg', 'faktura'], ['rechnungen', 'invoices', 'receipts', 'quittungen', 'belege']);
  art('Mahnung', ['mahnung', 'zahlungserinnerung', 'reminder'], ['mahnungen', 'zahlungserinnerungen', 'reminders']);
  art('Vertrag', ['vertrag', 'contract', 'agreement', 'versicherungsschein', 'police'], ['vertrage', 'vertraege', 'contracts', 'agreements', 'policen']);
  art('Kündigung', ['kundigung', 'kuendigung', 'cancellation'], ['kundigungen', 'kuendigungen', 'cancellations']);
  art('Bescheid', ['bescheid', 'steuerbescheid'], ['bescheide', 'steuerbescheide']);
  art('Kontoauszug', ['kontoauszug', 'statement'], ['kontoauszuge', 'kontoauszuege', 'statements']);
  art('Abrechnung', ['abrechnung', 'gehaltsabrechnung', 'lohnabrechnung', 'nebenkostenabrechnung'], ['abrechnungen', 'gehaltsabrechnungen', 'lohnabrechnungen']);
  art('Befund', ['befund', 'arztbrief', 'laborbefund'], ['befunde', 'arztbriefe']);
  art('Termin', ['termin', 'einladung', 'appointment'], ['termine', 'einladungen', 'appointments']);
  art('Aufforderung', ['aufforderung'], ['aufforderungen']);
  art('Angebot/Werbung', ['angebot', 'werbung', 'newsletter', 'offer', 'offerte', 'kostenvoranschlag'], ['angebote', 'offers', 'offerten']);
  art('Kassenbon', ['kassenbon', 'kassenzettel'], ['kassenbons', 'kassenzettel']);
  art('Bescheinigung', ['bescheinigung', 'urkunde', 'certificate'], ['bescheinigungen', 'urkunden', 'certificates']);
  const ART_LANG = Object.keys(ARTEN).filter((a) => a.length >= 6).sort((x, y) => y.length - x.length);
  /** Art eines einzelnen Wortes: genau („Rechnung“) oder als längstes Endstück („Beitragsrechnung“; „Jahresabrechnung“ ist Abrechnung). */
  const artAusWort = (t) => (ARTEN[t] || ARTEN[ART_LANG.find((a) => t.length > a.length && t.endsWith(a))] || [])[0];
  // Formen der Datei
  const FORMEN = {};
  for (const w of ['pdf', 'pdfs']) FORMEN[w] = ['pdf', w === 'pdfs'];
  for (const w of ['mail', 'email', 'e-mail', 'nachricht']) FORMEN[w] = ['mail', false];
  for (const w of ['mails', 'emails', 'e-mails', 'nachrichten']) FORMEN[w] = ['mail', true];
  for (const w of ['foto', 'bild', 'photo', 'image', 'picture', 'scan']) FORMEN[w] = ['foto', false];
  for (const w of ['fotos', 'bilder', 'photos', 'images', 'pictures', 'scans']) FORMEN[w] = ['foto', true];
  const FORM_NAME = { pdf: 'PDF', mail: 'E-Mail', foto: 'Foto' };
  const MONATE = [['januar', 'january', 'jan'], ['februar', 'february', 'feb'], ['marz', 'maerz', 'march'], ['april'], ['mai', 'may'], ['juni', 'june'],
    ['juli', 'july'], ['august'], ['september', 'sept'], ['oktober', 'october', 'okt'], ['november', 'nov'], ['dezember', 'december', 'dez']];
  const MONAT_NAME = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const MONAT = {}; MONATE.forEach((l, i) => l.forEach((w) => { MONAT[w] = i + 1; }));
  const ALLGEMEIN = new Set(['gmbh', 'mbh', 'inc', 'ltd', 'llc', 'pbc', 'corp', 'co', 'kg', 'ag', 'eg', 'ev', 'se', 'ug', 'ohg', 'gbr', 'und', 'the', 'der', 'die', 'das',
    'fur', 'von', 'and', 'of', 'mit', 'service', 'team', 'info', 'noreply', 'no', 'reply', 'mail', 'kundenservice', 'online', 'de', 'com', 'org', 'net', 'www']);
  const worte = (s) => fold(s).split(/[^\p{L}\p{N}-]+/u).map((w) => w.replace(/^-+|-+$/g, '')).filter(Boolean);

  /** Was die Sammlung kennt: Absender-Wörter, Bereiche, eigene Kategorien. eltern(r) = Mail, aus der ein Anhang stammt. */
  function kontext(eintraege, eltern) {
    const absender = new Map(), bereiche = new Set(), eigene = new Set(), kategorien = new Set();
    const merke = (name) => { const n = String(name || '').replace(/<[^>]*>/g, ' ').replace(/"/g, '').trim(); if (!n) return;
      for (const w of worte(n)) if (w.length >= 3 && !ALLGEMEIN.has(w) && !/^\d+$/.test(w)) { if (!absender.has(w)) absender.set(w, new Map()); const m = absender.get(w); m.set(n, (m.get(n) || 0) + 1); } };
    for (const r of eintraege) {
      if (r.kern?.absender) merke(r.kern.absender);
      if (r.mail?.from) merke(mailName(r.mail.from));
      if (r.kern?.bereich) bereiche.add(r.kern.bereich);
      if (r.eigeneKategorie) eigene.add(r.eigeneKategorie);
      if (r.category) kategorien.add(r.category);
    }
    const label = new Map([...absender].map(([w, m]) => [w, [...m].sort((a, b) => b[1] - a[1])[0][0]]));
    // Wortschatz der Sammlung (Namen, Betreffs, Absender, Wörter des Inhalts) – erst gebaut, wenn das Zusammenziehen ihn braucht.
    let schatz = null;
    const vokabel = () => { if (schatz) return schatz; schatz = new Set(absender.keys());
      for (const r of eintraege) { for (const w of worte([r.name, r.mail?.subject].filter(Boolean).join(' '))) if (w.length >= 4) schatz.add(w); for (const w in (r.tf || {})) if (w.length >= 4) schatz.add(w); }
      return schatz; };
    return { absender: label, bereiche: [...bereiche], eigene: [...eigene], kategorien: [...kategorien], eltern: eltern || (() => null), vokabel };
  }
  const mailName = (from) => { const s = String(from || ''); const m = s.match(/^\s*"?([^"<]+?)"?\s*<[^>]+>/); return (m ? m[1] : s.replace(/@.*/, '')).trim(); };

  /** Höchstens ein Zeichen Unterschied (eines fehlt, ist zu viel oder ist ein anderes). */
  function fastGleich(a, b) {
    if (a === b) return true; const d = a.length - b.length; if (d > 1 || d < -1) return false;
    let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return d === 0 ? a.slice(i + 1) === b.slice(i + 1) : d > 0 ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
  }
  /** Diktat trennt Wörter („An Tropic“ für „Anthropic“, Klaus 16.11.2026): zwei Nachbarwörter zusammenziehen, wenn die Sammlung
      das zusammengeschriebene Wort kennt – genau, oder ab 7 Zeichen mit einem Zeichen Unterschied und gleichem Anfang.
      Ergebnis: die Frage mit dem bekannten Wort, oder '' (nichts zusammenzuziehen). Erfindet nie ein Wort. */
  function zusammen(text, ctx) {
    const roh = worte(text), v = ctx && ctx.vokabel ? ctx.vokabel() : null; if (!v || roh.length < 2) return '';
    const kennt = (w) => v.has(w) || v.has(stem(w));
    const aus = []; let geaendert = false;
    for (let i = 0; i < roh.length; i++) {
      const a = roh[i], b = roh[i + 1];
      if (b && !(kennt(a) && kennt(b) && !FUELL.has(a) && !FUELL.has(b)) && !/^\d+$/.test(a + b)) {
        const z = a + b; let fund = z.length >= 5 && kennt(z) ? z : '';
        // Ein Zeichen Unterschied nur, wenn die Teile selbst keine Wörter der Sammlung sind und das gefundene Wort nicht bloß
        // eine andere Form eines Teils ist. Sonst wurde aus „brief an mama“ „briefen mama“ und aus „rechnung in berlin“
        // „rechnungen berlin“ (Generalprüfung 16.11.2026). „an tropic“ → „anthropic“ bleibt: „tropic“ kennt die Sammlung nicht.
        const frei = (w) => FUELL.has(w) || !kennt(w);
        if (!fund && z.length >= 7 && frei(a) && frei(b)) for (const w of v) if (w[0] === z[0] && w.length >= 7 && fastGleich(w, z) && stem(w) !== stem(a) && stem(w) !== stem(b)) { fund = w; break; }
        if (fund) { aus.push(fund); i++; geaendert = true; continue; }
      }
      aus.push(a);
    }
    return geaendert ? aus.join(' ') : '';
  }

  /** Frage lesen. ignorieren = Wörter, die als Text bleiben sollen (× an einem erkannten Kästchen). */
  function lesen(text, ctx, ignorieren, { ohneFelder = false } = {}) {
    const roh = worte(text), kaestchen = [], rest = [], bonus = [], ign = ignorieren || new Set();
    let mehrzahl = null, nachVon = false;
    const dazu = (k) => { if (!kaestchen.some((x) => x.feld === k.feld && x.wert === k.wert)) kaestchen.push(k); };
    for (let i = 0; i < roh.length; i++) {
      const w = roh[i];
      if (ign.has(w)) { rest.push(w); nachVon = false; continue; }
      if (VON.has(w)) { nachVon = true; continue; }
      if (FUELL.has(w)) continue;
      if (ohneFelder && ARTEN[w]) { rest.push(w); if (mehrzahl === null) mehrzahl = ARTEN[w][1]; continue; }
      // Zusammengesetzt: „Handyrechnung“, „Nebenkostenabrechnung“ → Art + Vorderteil als Hinweis für die Reihenfolge
      const teil = !ohneFelder && ART_LANG.find((a) => a !== w && w.length - a.length >= 4 && w.endsWith(a));
      if (teil) { const [a, m] = ARTEN[w] || ARTEN[teil]; dazu({ feld: 'art', wert: a, label: a.replace('/Werbung', ''), wort: w, weich: true }); if (mehrzahl === null) mehrzahl = m; bonus.push(w, w.slice(0, w.length - teil.length)); nachVon = false; continue; }
      if (ARTEN[w]) { const [a, m] = ARTEN[w]; bonus.push(w); dazu({ feld: 'art', wert: a, label: a.replace('/Werbung', ''), wort: w, weich: true }); if (mehrzahl === null) mehrzahl = m; nachVon = false; continue; }
      if (FORMEN[w]) { const [f, m] = FORMEN[w]; dazu({ feld: 'form', wert: f, label: FORM_NAME[f], wort: w }); if (mehrzahl === null) mehrzahl = m; nachVon = false; continue; }
      if (MONAT[w]) { const jahr = /^(19|20)\d\d$/.test(roh[i + 1] || '') ? Number(roh[++i]) : null; dazu({ feld: 'monat', wert: MONAT[w], jahr, label: MONAT_NAME[MONAT[w] - 1] + (jahr ? ' ' + jahr : ''), wort: w }); nachVon = false; continue; }
      if (/^(19|20)\d\d$/.test(w)) { dazu({ feld: 'jahr', wert: Number(w), label: w, wort: w }); nachVon = false; continue; }
      if (ctx && !ohneFelder && w.length >= 3 && ctx.absender.has(w)) {
        // „Nordlicht Labs“: zwei Wörter desselben Absenders bleiben ein Kästchen
        const vor = kaestchen[kaestchen.length - 1];
        if (vor && vor.feld === 'absender' && vor.label === ctx.absender.get(w) && roh[i - 1] === vor.letztes) { vor.letztes = w; (vor.mehr = vor.mehr || []).push(w); continue; }
        dazu({ feld: 'absender', wert: w, label: ctx.absender.get(w), wort: w, letztes: w, weich: !nachVon }); nachVon = false; continue; }
      const eig = ctx && !ohneFelder && ctx.eigene.find((e) => fold(e) === w || (w.length >= 5 && stem(fold(e)) === stem(w)));
      if (eig) { dazu({ feld: 'eigene', wert: eig, label: eig, wort: w }); continue; }
      const ber = ctx && !ohneFelder && !nachVon && w.length >= 5 && ctx.bereiche.find((b) => worte(b).some((t) => t.length >= 5 && (stem(t) === stem(w) || t.startsWith(w) || w.startsWith(t))));
      if (ber) { dazu({ feld: 'bereich', wert: ber, label: ber, wort: w, weich: true }); continue; }
      rest.push(w); nachVon = false;
    }
    return { kaestchen, rest, bonus, mehrzahl: mehrzahl === true, einzahl: mehrzahl === false };
  }

  const isPdf = (r) => /\.pdf$/i.test(String(r.name || '')) || String(r.type || '') === 'application/pdf' || String(r.ext || '').replace(/^\./, '').toLowerCase() === 'pdf';
  const isBild = (r) => /^image\//.test(String(r.type || '')) || /^(png|jpe?g|webp|gif|bmp|tiff?|heic)$/i.test(String(r.ext || '').replace(/^\./, ''));
  const ALT_ART = { Rechnung: 'Rechnung', Vertrag: 'Vertrag', Angebot: 'Angebot/Werbung' };
  /** Art eines Eintrags: Kern; ist er unsicher und sagt die alte Liste Rechnung/Vertrag/Angebot, gilt die alte (Punkt 1). */
  function artVon(r) { const k = r.kern || {}; if (k.art && k.artSicher) return k.art; return ALT_ART[r.category] || k.art || ''; }
  function datumVon(r) { const k = r.kern || {}; const d = r.mail?.date ? new Date(r.mail.date) : k.datum ? new Date(k.datum) : new Date(Number(r.date) || 0); return isNaN(d) ? null : d; }
  function absenderText(r, ctx) { const p = ctx?.eltern?.(r); return fold([r.kern?.absender, r.mail?.from && mailName(r.mail.from), r.mail?.from, p?.mail?.from && mailName(p.mail.from), p?.kern?.absender].filter(Boolean).join(' ')); }

  const istAbsender = (r, k, ctx) => absenderText(r, ctx).split(/[^\p{L}\p{N}-]+/u).includes(k.wert);
  function kastchenPasst(r, k, ctx) {
    switch (k.feld) {
      // Eine getippte Art gilt auch, wenn das Wort im Namen oder Betreff steht („Angebot“ findet „Fahrzeug-Angebot“), ein angeklicktes Kästchen nur nach Art.
      case 'art': return artVon(r) === k.wert || (!!k.weich && worte([r.name, r.mail?.subject].join(' ')).some((t) => artAusWort(t) === k.wert));
      case 'form': return k.wert === 'pdf' ? isPdf(r) : k.wert === 'mail' ? !!r.mail || String(r.ext || '') === 'eml' : isBild(r);
      // Getippt ohne „von“: der Name darf auch nur im Text stehen („Anthropic“ findet die Rechnung als PDF); „von Anthropic“ und ein
      // angeklicktes Kästchen gelten nur für den echten Absender. Echte Absender stehen oben (passt: +3).
      case 'absender': return istAbsender(r, k, ctx) || (!!k.weich && [k.wort, ...(k.mehr || [])].every((w) => trifft(feldText(r, ctx) + ' ' + inhaltText(r), w)));
      case 'bereich': return r.kern?.bereich === k.wert || (k.weich && trifft(feldText(r, ctx) + ' ' + inhaltText(r), k.wort));
      case 'eigene': return r.eigeneKategorie === k.wert;
      case 'kategorie': return String(r.category || '') === k.wert;
      case 'monat': { const d = datumVon(r); return !!d && d.getMonth() + 1 === k.wert && (!k.jahr || d.getFullYear() === k.jahr); }
      case 'jahr': { const d = datumVon(r); return !!d && d.getFullYear() === k.wert; }
      default: return true;
    }
  }
  /** Name, Pfad und Felder als Suchtext (Punkt 2: Art, Absender, Bereich und Kategorie zählen mit). */
  function feldText(r, ctx) {
    const k = r.kern || {};
    return fold([r.name, r.path, r.category, r.eigeneKategorie, artVon(r), k.absender, k.bereich, k.person, r.mail?.from, r.mail?.subject, absenderText(r, ctx), ...(r.tags || [])].filter(Boolean).join(' '));
  }
  function inhaltText(r) { return fold([r.snippet, r.summary, r.mailBody, r.ende, r.ocrText, r.caption].filter(Boolean).join(' ')); }
  const GLEICHE = {}; for (const [w, [a]] of Object.entries(ARTEN)) (GLEICHE[a] = GLEICHE[a] || []).push(w);
  function trifft(hay, w) { if (hay.includes(w) || (w.length >= 5 && hay.includes(stem(w)))) return true; const a = ARTEN[w]; return !!a && GLEICHE[a[0]].some((x) => hay.includes(x)); }

  /** Ein Eintrag gegen die gelesene Frage. Ergebnis: null (passt nicht) oder { punkte, wo: 'feld'|'inhalt'|'teilweise' }.
      Zuerst Treffer in Name und Feldern, darunter Treffer nur im Inhalt; Wörter, die man wörtlich schrieb, rücken nach oben. */
  function passt(r, frage, kaestchen, ctx, { teilweise = false } = {}) {
    for (const k of kaestchen) if (!kastchenPasst(r, k, ctx)) return null;
    const f = feldText(r, ctx), t = f + ' ' + inhaltText(r), tf = r.tf || {};
    const extra = (frage.bonus || []).filter((w) => w.length >= 4 && t.includes(w)).length + frage.rest.filter((w) => fold(r.name).includes(w)).length
      + 3 * kaestchen.filter((k) => k.feld === 'absender' && k.weich && istAbsender(r, k, ctx)).length;
    if (!frage.rest.length) return { punkte: 1 + extra, wo: 'feld' };
    if (frage.rest.every((w) => trifft(f, w))) return { punkte: 10 + extra, wo: 'feld' };
    const imText = (w) => trifft(t, w) || Object.prototype.hasOwnProperty.call(tf, stem(w));
    if (frage.rest.every(imText)) return { punkte: 5 + extra + frage.rest.filter((w) => trifft(f, w)).length, wo: 'inhalt' };
    if (!teilweise) return null;
    const n = frage.rest.filter(imText).length;
    return n * 2 >= frage.rest.length && n ? { punkte: n + extra, wo: 'teilweise' } : null;
  }

  /** Ganze Suche über eine Liste. Findet sie nichts, kommen Einträge, die mindestens die Hälfte der Wörter enthalten. */
  function suchen(eintraege, text, fest, ctx, ignorieren, wahl) {
    const erst = suchenGenau(eintraege, text, fest, ctx, ignorieren, wahl);
    if (erst.treffer.length && !erst.teilweise) return erst;
    const anders = zusammen(text, ctx); if (!anders) return erst;
    const zweit = suchenGenau(eintraege, anders, fest, ctx, ignorieren, wahl);
    return zweit.treffer.length && !zweit.teilweise ? Object.assign(zweit, { verstanden: anders }) : erst;
  }
  function suchenGenau(eintraege, text, fest, ctx, ignorieren, wahl) {
    const frage = lesen(text, ctx, ignorieren, wahl || {}), alle = [...(fest || []), ...frage.kaestchen];
    const lauf = (teilweise, ks) => eintraege.map((r) => ({ r, p: passt(r, frage, ks, ctx, { teilweise }) })).filter((x) => x.p);
    let treffer = lauf(false, alle), teil = false;
    if (!treffer.length && frage.rest.length > 1) { treffer = lauf(true, alle); teil = treffer.length > 0; }
    let ohne = [];
    if (!treffer.length && alle.length) ohne = alle.map((k) => ({ k, n: lauf(false, alle.filter((x) => x !== k)).length })).filter((x) => x.n);
    treffer.sort((a, b) => b.p.punkte - a.p.punkte || ((datumVon(b.r) || 0) - (datumVon(a.r) || 0)));
    return { frage, kaestchen: alle, treffer, teilweise: teil, imInhalt: treffer.some((x) => x.p.wo !== 'feld'), ohne };
  }

  wurzel.PBSuchFrage = { fold, stem, lesen, kontext, passt, suchen, zusammen, artVon, datumVon, mailName, feldText };
})(typeof window !== 'undefined' ? window : globalThis);
