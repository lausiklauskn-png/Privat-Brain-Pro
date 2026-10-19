/* Private Brain / Company Brain — Reinigung und Prüfung vor der KI (Klaus 2026-10-14).
 *
 * App-eigener Klebstoff, steht IDENTISCH in Privat-Brain und Company-Brain.
 * Vorbild sind Workflow PDF #112/#113 und die Rezeptbücher („Seiten als Bild",
 * „einmal anhalten"): was an eine KI geht, wird vorher geprüft und gereinigt.
 *
 *   · Bilder gehen NIE als Original hinaus — sie werden neu gezeichnet (JPEG),
 *     dabei fallen EXIF/GPS/XMP und alles Angehängte weg. Klappt das nicht,
 *     geht NICHTS hinaus (bildOhneMeta → null).
 *   · Ein PDF geht nie roh an Mistral OCR — die Seiten werden mit pdf.js
 *     gezeichnet (300 dpi), versteckter Text wird in der Kopie zugedeckt, es
 *     gehen Bilder hinaus (pdfSeitenFuersNetz).
 *   · Text an eine KI (🔗 KI zu einer Datei) wird mit der Prüfliste geprüft
 *     (pruefer-mail.js, byte-1:1); bei einem PDF kommt der Text aus pdf.js,
 *     OHNE die Stücke, die man auf der Seite nicht sieht (pdfTextSauber).
 *   · Fund → EINMAL anhalten je Sendevorgang (halt / reiniger).
 *
 * Die Rechnung (was ist versteckt?) steht in modules/reinigung.js — byte-1:1
 * aus Workflow PDF (WFP.Reinigung). pdf.js kommt aus window.KI_REINIGUNG_PDFJS
 * (Vorgabe /Workflow-PDF/vendor/pdfjs/, dieselbe Adresse wie bei den Rezeptbüchern).
 *
 * ⚠ GRENZEN, benannt: nur die ersten 10 Seiten eines PDFs · Text über einem Foto
 *   oder über sichtbarer Schrift bleibt · schräger Text wird nicht beurteilt ·
 *   die Prüfliste sucht feste Wendungen, eine umformulierte Anweisung fällt durch ·
 *   Texte Deutsch und Englisch, die übrigen Sprachen zeigen Deutsch.
 */
(function (welt) {
  'use strict';
  var SEITEN_MAX = 10, DPI = 300, MAX_KANTE = 5000, GUETE = 0.92, DECKEL = 4 * 1024 * 1024;
  var TEXT_MAX = 8000;
  var SPERRT = ['KI-ANWEISUNG', 'UNSICHTBARE-ZEICHEN', 'VERSTECKTER-TEXT'];

  var TXT = {
    de: {
      verstecktT: 'Versteckten Text gefunden',
      verstecktP: 'In „{n}" steht Text, den man auf der Seite nicht sieht. Eine KI würde ihn trotzdem lesen.',
      verstecktS: 'Gesendet wird die sichere Fassung: ohne diesen Text. Die Datei selbst bleibt unverändert.',
      anweisungT: 'Anweisung an eine KI gefunden',
      anweisungP: 'Im Text von „{n}" steht etwas, das sich an eine KI richtet. Das kann aus einer fremden Datei stammen.',
      anweisungS: 'Gefunden über eine feste Liste von Wendungen — auch ein Text, der so etwas nur zitiert, wird gemeldet.',
      ja: 'Ohne ihn senden', trotzdem: 'Trotzdem senden', nein: 'Abbrechen', mehr: '… und weitere Stellen.', seite: 'Seite', zeile: 'Zeile',
      winzig: 'winzige Schrift', aussen: 'außerhalb der Seite',
      unsichtbar: 'auf der Seite nicht zu sehen (gleiche Farbe wie der Grund oder unsichtbar gesetzt)', meta: 'Bild-Metadaten',
      'KI-ANWEISUNG': 'Anweisung an eine KI', 'UNSICHTBARE-ZEICHEN': 'unsichtbare Zeichen', 'VERSTECKTER-TEXT': 'versteckter Text',
      UNGEPRUEFT: 'nicht geprüft — die Prüfliste fehlt'
    },
    en: {
      verstecktT: 'Hidden text found',
      verstecktP: '"{n}" contains text you cannot see on the page. An AI would still read it.',
      verstecktS: 'The safe version is sent: without this text. The file itself stays unchanged.',
      anweisungT: 'Instruction to an AI found',
      anweisungP: 'The text of "{n}" contains something addressed to an AI. It may come from a foreign file.',
      anweisungS: 'Found with a fixed list of phrases — a text that only quotes such a phrase is reported too.',
      ja: 'Send without it', trotzdem: 'Send anyway', nein: 'Cancel', mehr: '… and more.', seite: 'Page', zeile: 'Line',
      winzig: 'tiny text', aussen: 'outside the page',
      unsichtbar: 'not visible on the page (same colour as the background or set invisible)', meta: 'image metadata',
      'KI-ANWEISUNG': 'instruction to an AI', 'UNSICHTBARE-ZEICHEN': 'invisible characters', 'VERSTECKTER-TEXT': 'hidden text',
      UNGEPRUEFT: 'not checked — the check list is missing'
    }
  };
  function sprache() {
    try { return String(document.documentElement.lang || '').slice(0, 2).toLowerCase() === 'en' ? 'en' : 'de'; } catch (_e) { return 'de'; }
  }
  function KT(k, v) {
    var l = TXT[sprache()], s = (l && l[k]) || TXT.de[k] || k;
    if (v) for (var x in v) s = s.split('{' + x + '}').join(v[x]);
    return s;
  }

  function pdfjsPfad() { return new URL(welt.KI_REINIGUNG_PDFJS || '/Workflow-PDF/vendor/pdfjs/', location.href).href; }
  function skript(src) {
    return new Promise(function (ok, nein) {
      var s = document.createElement('script'); s.src = src; s.async = false;
      s.onload = function () { ok(); }; s.onerror = function () { nein(new Error('lädt nicht: ' + src.split('?')[0])); };
      document.head.appendChild(s);
    });
  }
  function reinigung() {
    if (welt.WFP && welt.WFP.Reinigung) return welt.WFP.Reinigung;
    throw new Error('Reinigung fehlt (modules/reinigung.js nicht geladen)');
  }
  async function pdfjs() {
    if (!welt.pdfjsLib) {
      await skript(pdfjsPfad() + 'pdf.min.js');
      welt.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsPfad() + 'pdf.worker.min.js';
    }
    return welt.pdfjsLib;
  }
  function bytes(q) {
    if (q instanceof Uint8Array) return Promise.resolve(q);
    if (q instanceof ArrayBuffer) return Promise.resolve(new Uint8Array(q));
    return q.arrayBuffer().then(function (a) { return new Uint8Array(a); });
  }
  function leinwand(w, h) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  }

  /* Ein Bild neu gezeichnet, ohne Metadaten. Lange Kante höchstens maxKante.
     @returns Blob (image/jpeg) oder null — dann geht NICHTS hinaus. */
  async function bildOhneMeta(blob, maxKante) {
    var m = maxKante || 1024;
    try {
      var bmp = await createImageBitmap(blob);
      var s = Math.min(1, m / Math.max(bmp.width, bmp.height));
      var w = Math.max(1, Math.round(bmp.width * s)), h = Math.max(1, Math.round(bmp.height * s));
      var c = leinwand(w, h), x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(bmp, 0, 0, w, h);
      if (bmp.close) bmp.close();
      var out = await new Promise(function (r) { c.toBlob(r, 'image/jpeg', 0.9); });
      c.width = c.height = 0;
      if (!out || !out.size) return null;
      // Chromium hängt an jedes JPEG aus einer Leinwand ein ICC-Profil; das bleibt (sagt nichts
      // über Gerät, Ort oder Person). EXIF/XMP/Kommentar nimmt jpegOhneMeta trotzdem heraus.
      try {
        var R = reinigung(), u8 = new Uint8Array(await out.arrayBuffer()), r = R.jpegOhneMeta(u8);
        if (r.entfernt.length) out = new Blob([r.bytes], { type: 'image/jpeg' });
      } catch (_e) { /* Leinwand-JPEG trägt ohnehin keine Kamera-Angaben */ }
      return out;
    } catch (_e) { return null; }
  }

  function seiteJpeg(c) {
    var u = c.toDataURL('image/jpeg', GUETE); if (u.length <= DECKEL) return u;
    u = c.toDataURL('image/jpeg', 0.85); if (u.length <= DECKEL) return u;
    var f = Math.sqrt(DECKEL / u.length) * 0.95, k = leinwand(Math.max(1, Math.round(c.width * f)), Math.max(1, Math.round(c.height * f)));
    var kx = k.getContext('2d'); kx.fillStyle = '#fff'; kx.fillRect(0, 0, k.width, k.height); kx.drawImage(c, 0, 0, k.width, k.height);
    u = k.toDataURL('image/jpeg', 0.85); k.width = k.height = 0; return u;
  }

  /* Eine Seite zeichnen und ihre Textstücke beurteilen.
     @returns {c, x, img, stuecke:[{s, st, g}], vp} — g = Grund oder null (sichtbar). */
  async function seiteLesen(L, R, p, skala) {
    var vp = p.getViewport({ scale: skala });
    var c = leinwand(Math.round(vp.width), Math.round(vp.height));
    var x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    await p.render({ canvasContext: x, viewport: vp }).promise;
    var img = x.getImageData(0, 0, c.width, c.height), stuecke = [];
    var tc = await p.getTextContent();
    for (var i = 0; i < tc.items.length; i++) {
      var t = tc.items[i]; if (!t.str) continue;
      var tr = L.Util.transform(vp.transform, t.transform);
      var schraeg = Math.abs(Math.atan2(tr[1], tr[0])) > 0.05;   // schräger Text: nicht beurteilt (Grenze)
      var st = { s: t.str, x: tr[4] / vp.scale, y: tr[5] / vp.scale, w: t.width, fh: Math.hypot(tr[2], tr[3]) / vp.scale };
      stuecke.push({ s: t.str, eol: !!t.hasEOL, st: st, g: (schraeg || !t.str.trim()) ? null : R.versteckt(st, img, vp.scale) });
    }
    return { c: c, x: x, img: img, stuecke: stuecke, vp: vp };
  }

  /* Ein PDF als Seitenbilder: gezeichnet (300 dpi), versteckter Text in der Kopie zugedeckt,
     Metadaten aus dem JPEG. @returns {bilder:[data:image/jpeg], liste:[{seite,text,grund}], seiten, gesamt} */
  async function pdfSeitenFuersNetz(quelle) {
    var R = reinigung(), L = await pdfjs();
    var pdf = await L.getDocument({ data: await bytes(quelle), isEvalSupported: false }).promise;   // CVE-2024-4367
    var n = Math.min(pdf.numPages, SEITEN_MAX), bilder = [], liste = [];
    for (var i = 1; i <= n; i++) {
      var p = await pdf.getPage(i), v1 = p.getViewport({ scale: 1 });
      var s = await seiteLesen(L, R, p, Math.min(DPI / 72, MAX_KANTE / Math.max(v1.width, v1.height)));
      var zu = 0;
      s.stuecke.forEach(function (k) {
        if (k.g) { liste.push({ seite: i, text: k.s, grund: k.g }); R.zudecken(s.img, k.st, s.vp.scale); zu++; }
      });
      if (zu) s.x.putImageData(s.img, 0, 0);
      var m = R.datenAdresseOhneMeta(seiteJpeg(s.c));
      m.entfernt.forEach(function (e) { liste.push({ seite: i, text: e.art + ' (' + e.bytes + ' Byte)', grund: 'meta' }); });
      bilder.push(m.url); s.c.width = s.c.height = 0; try { p.cleanup(); } catch (_e) {}
    }
    var gesamt = pdf.numPages; try { pdf.destroy(); } catch (_e) {}
    return { bilder: bilder, liste: liste, seiten: n, gesamt: gesamt };
  }

  /* Der Text eines PDFs, wie man ihn auf der Seite SIEHT — ohne versteckte Stücke.
     @returns {text, liste:[{seite,text,grund}], seiten, gesamt} */
  async function pdfTextSauber(quelle) {
    var R = reinigung(), L = await pdfjs();
    var pdf = await L.getDocument({ data: await bytes(quelle), isEvalSupported: false }).promise;
    var n = Math.min(pdf.numPages, SEITEN_MAX), teile = [], liste = [], laenge = 0, i;
    for (i = 1; i <= n && laenge < TEXT_MAX; i++) {
      var p = await pdf.getPage(i);
      var s = await seiteLesen(L, R, p, 2);
      var zeile = '';
      s.stuecke.forEach(function (k) {
        if (k.g) { liste.push({ seite: i, text: k.s, grund: k.g }); return; }
        zeile += k.s + (k.eol ? '\n' : ' ');
      });
      teile.push(zeile.replace(/[ \t]+/g, ' ').trim()); laenge += zeile.length;
      s.c.width = s.c.height = 0; try { p.cleanup(); } catch (_e) {}
    }
    var gesamt = pdf.numPages; try { pdf.destroy(); } catch (_e) {}
    return { text: teile.join('\n\n').slice(0, TEXT_MAX), liste: liste, seiten: i - 1, gesamt: gesamt };
  }

  /* Text mit der Prüfliste prüfen. Ohne Liste: ein Eintrag UNGEPRUEFT (fail-closed). */
  function textPruefen(text) {
    var L = welt.PrueferMail;
    if (!L || typeof L.pruefeMail !== 'function') return [{ kennung: 'UNGEPRUEFT', zeile: null }];
    try {
      return ((L.pruefeMail(String(text || '')).stellen) || [])
        .filter(function (s) { return SPERRT.indexOf(s.kennung) !== -1; })
        .map(function (s) { return { kennung: s.kennung, zeile: (typeof s.zeile === 'number') ? s.zeile : null }; });
    } catch (_e) { return [{ kennung: 'UNGEPRUEFT', zeile: null }]; }
  }

  /* Der Halt. art 'versteckt' (Ohne ihn senden) oder 'anweisung' (Trotzdem senden).
     eintraege: [{grund|kennung, seite?, zeile?, text?}]. → Promise<true|false> */
  function halt(art, name, eintraege) {
    return new Promise(function (fertig) {
      var alt = document.getElementById('kiHaltOv'); if (alt) alt.remove();
      var ov = document.createElement('div'); ov.id = 'kiHaltOv';
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px';
      var box = document.createElement('div');
      box.setAttribute('data-ki-halt', art);
      box.style.cssText = 'background:var(--card,#fff);color:var(--ink,#111);max-width:520px;width:100%;max-height:85vh;overflow:auto;border-radius:12px;padding:16px 18px;box-shadow:0 8px 30px rgba(0,0,0,.35);font-family:inherit';
      function el(tag, txt, par) { var e = document.createElement(tag); if (txt != null) e.textContent = txt; (par || box).appendChild(e); return e; }
      var vor = art === 'versteckt' ? 'versteckt' : 'anweisung';
      el('h3', KT(vor + 'T')).style.margin = '0 0 8px';
      el('p', KT(vor + 'P', { n: name || 'Datei' }));
      var ul = el('ul'); ul.style.paddingLeft = '18px';
      eintraege.slice(0, 8).forEach(function (e) {
        var li = el('li', null, ul); li.setAttribute('data-ki-stueck', e.grund || e.kennung || '');
        el('b', KT(e.grund || e.kennung), li);
        var wo = (e.seite ? ' · ' + KT('seite') + ' ' + e.seite : '') + (e.zeile ? ' · ' + KT('zeile') + ' ' + e.zeile : '');
        if (wo) li.appendChild(document.createTextNode(wo));
        if (e.text) { el('br', null, li); li.appendChild(document.createTextNode('„' + String(e.text).slice(0, 120) + '“')); }
      });
      if (eintraege.length > 8) el('p', KT('mehr')).style.fontSize = '.8rem';
      el('p', KT(vor + 'S')).style.fontSize = '.85rem';
      var reihe = el('div'); reihe.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap';
      var nein = el('button', KT('nein'), reihe); nein.setAttribute('data-ki-nein', '');
      var ja = el('button', KT(art === 'versteckt' ? 'ja' : 'trotzdem'), reihe); ja.setAttribute('data-ki-ja', ''); ja.className = 'primary';
      ja.onclick = function () { ov.remove(); fertig(true); };
      nein.onclick = function () { ov.remove(); fertig(false); };
      ov.appendChild(box); document.body.appendChild(ov);
    });
  }

  /* Einmal je Sendevorgang anhalten: {halt(name, liste) → true|false, st}.
     Nach „Abbrechen" geht in DIESEM Vorgang nichts mehr mit Fund hinaus. */
  function reiniger() {
    var st = { gefragt: false, ok: true, n: 0 };
    return {
      st: st,
      halt: async function (name, liste) {
        if (!liste || !liste.length) return st.ok;
        if (!st.gefragt) { st.gefragt = true; st.ok = await halt('versteckt', name, liste); }
        if (st.ok) st.n += liste.length;
        return st.ok;
      }
    };
  }

  /* Der Vermerk am Katalog-Eintrag — erst NACH dem Senden. */
  function vermerken(rec, liste, weg) {
    try { return reinigung().vermerken(rec, liste, weg); } catch (_e) { return 0; }
  }

  welt.KiReinigung = {
    bildOhneMeta: bildOhneMeta, pdfSeitenFuersNetz: pdfSeitenFuersNetz, pdfTextSauber: pdfTextSauber,
    textPruefen: textPruefen, halt: halt, reiniger: reiniger, vermerken: vermerken,
    _meta: { SEITEN_MAX: SEITEN_MAX, DPI: DPI, SPERRT: SPERRT.slice() }
  };
})(typeof window !== 'undefined' ? window : globalThis);
