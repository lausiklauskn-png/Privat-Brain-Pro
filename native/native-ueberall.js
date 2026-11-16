/* Suchleiste der Startseite in Private Brain Pro (Klaus 2026-11-16, Gerätetest 1.0.52, Punkte 3, 5, 6, 7, 16 – „V1“).
   Vorher stand „Überall suchen“ als eigener Kasten mit eigener Trefferliste unter den Filtern; „Suchen“ füllte nur diese Liste,
   die große Trefferliste blieb leer. Jetzt gibt es eine Suche und eine Liste:
   • im Suchfeld: × leert, die Lupe (und Enter) sucht
   • in der Reihe daneben: „Überall“ (an/aus, gemerkt) und ein Zahnrad mit den Quellen
   • die Treffer der anderen Pro-Apps (Tresorordner) und aus dem Netz stehen als Gruppen mit Herkunft direkt unter der Trefferliste
   • die Filter tragen Namen (Art, Kategorie, Zeitraum, Tag), die Sortierung steht am Ende
   Die Logik bleibt der gemeinsame Baustein native/pro-ueberall.js (suchen, gruppieren, Wörter); hier steht nur, was Private Brain
   dazugibt. Diese App selbst durchsucht die Trefferliste der Seite (renderResults), darum fragt „Überall“ nur Tresor und Netz.
   Kein Netz von selbst: Tresor und Netz werden nur nach einem Tipp auf die Lupe oder Enter gefragt, das Netz nur mit Haken. */
(() => {
  'use strict';
  if (window.PBUeberall) return;
  const root = document.documentElement;
  const vault = () => window.Capacitor?.Plugins?.ProVault;
  function tresor() {
    const api = vault();
    if (!api || typeof api.tresorFach !== 'function' || typeof api.tresorZustand !== 'function') return null;
    return {
      zustand: async () => { const z = await api.tresorZustand({}); return { gewaehlt: !!z.gewaehlt, offen: !!(z.offen) }; },
      fach: fach => api.tresorFach({ fach })
    };
  }
  const W = {
    de: { leeren: 'Suchfeld leeren', los: 'Suchen', ueberall: 'Überall', ueberallLang: 'Auch in den anderen Pro-Apps und im Netz suchen', quellen: 'Quellen für „Überall“',
      qApp: 'Private Brain (immer dabei)', art: 'Art', kategorie: 'Kategorie', zeitraum: 'Zeitraum', tag: 'Tag', sortieren: 'Sortieren', alle: 'Alle', beliebig: 'Beliebig',
      doc: 'Dokumente', text: 'Notizen', img: 'Fotos und Bilder', sheet: 'Tabellen', d7: 'Letzte 7 Tage', d30: 'Letzte 30 Tage', d365: 'Letzte 12 Monate',
      rel: 'Passendste zuerst', neu: 'Neueste zuerst', alt: 'Älteste zuerst', size: 'Größte zuerst', name: 'Name A–Z', andere: 'Aus anderen Programmen' },
    en: { leeren: 'Clear search field', los: 'Search', ueberall: 'Everywhere', ueberallLang: 'Also search the other Pro apps and the network', quellen: 'Sources for “Everywhere”',
      qApp: 'Private Brain (always included)', art: 'Kind', kategorie: 'Category', zeitraum: 'Period', tag: 'Tag', sortieren: 'Sort', alle: 'All', beliebig: 'Any time',
      doc: 'Documents', text: 'Notes', img: 'Photos and images', sheet: 'Spreadsheets', d7: 'Last 7 days', d30: 'Last 30 days', d365: 'Last 12 months',
      rel: 'Best match first', neu: 'Newest first', alt: 'Oldest first', size: 'Largest first', name: 'Name A–Z', andere: 'From other programs' },
    ru: { leeren: 'Очистить поле поиска', los: 'Искать', ueberall: 'Везде', ueberallLang: 'Искать также в других Pro-приложениях и в сети', quellen: 'Источники для «Везде»',
      qApp: 'Private Brain (всегда)', art: 'Вид', kategorie: 'Категория', zeitraum: 'Период', tag: 'Метка', sortieren: 'Сортировка', alle: 'Все', beliebig: 'Любой',
      doc: 'Документы', text: 'Заметки', img: 'Фото и изображения', sheet: 'Таблицы', d7: 'Последние 7 дней', d30: 'Последние 30 дней', d365: 'Последние 12 месяцев',
      rel: 'Сначала подходящие', neu: 'Сначала новые', alt: 'Сначала старые', size: 'Сначала большие', name: 'Имя А–Я', andere: 'Из других программ' },
    pl: { leeren: 'Wyczyść pole wyszukiwania', los: 'Szukaj', ueberall: 'Wszędzie', ueberallLang: 'Szukaj też w innych aplikacjach Pro i w sieci', quellen: 'Źródła dla „Wszędzie”',
      qApp: 'Private Brain (zawsze)', art: 'Rodzaj', kategorie: 'Kategoria', zeitraum: 'Okres', tag: 'Tag', sortieren: 'Sortowanie', alle: 'Wszystkie', beliebig: 'Dowolny',
      doc: 'Dokumenty', text: 'Notatki', img: 'Zdjęcia i obrazy', sheet: 'Arkusze', d7: 'Ostatnie 7 dni', d30: 'Ostatnie 30 dni', d365: 'Ostatnie 12 miesięcy',
      rel: 'Najtrafniejsze', neu: 'Najnowsze', alt: 'Najstarsze', size: 'Największe', name: 'Nazwa A–Z', andere: 'Z innych programów' }
  };
  const t = k => (W[String(root.lang || 'de').slice(0, 2)] || W.de)[k] || W.de[k];
  const el = (tag, klasse, text) => { const n = document.createElement(tag); if (klasse) n.className = klasse; if (text != null) n.textContent = text; return n; };
  const NS = 'http://www.w3.org/2000/svg';
  const ICON = {
    lupe: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', kreuz: 'M6 6l12 12 M18 6L6 18',
    pfeil: 'M6 9l6 6 6-6',
    rad: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.3.9a7.6 7.6 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.6 7.6 0 0 0-1.7 1l-2.3-.9-2 3.4 2 1.5a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9a7.6 7.6 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7.6 7.6 0 0 0 1.7-1l2.3.9 2-3.4z'
  };
  function bild(name) {
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false'); s.classList.add('pb-such-bild');
    const p = document.createElementNS(NS, 'path'); p.setAttribute('d', ICON[name]); s.append(p); return s;
  }
  function knopf(id, name, klasse) { const b = el('button', klasse); b.type = 'button'; b.id = id; b.append(bild(name)); return b; }

  // ---------- Quellen (derselbe Speicher wie der gemeinsame Baustein) und „Überall“ an/aus ----------
  const MERK = 'pro_ueberall_quellen_v1', AN = 'pb_ueberall_an_v1';
  function quellen() {
    const v = { app: true, tresor: true, netz: false };
    try { const g = JSON.parse(localStorage.getItem(MERK) || 'null'); if (g && typeof g === 'object') for (const k of Object.keys(v)) if (typeof g[k] === 'boolean') v[k] = g[k]; } catch { /* Vorgabe */ }
    return v;
  }
  function quelleMerken(k, wert) { const q = quellen(); q[k] = !!wert; try { localStorage.setItem(MERK, JSON.stringify(q)); } catch { /* nur Komfort */ } }
  const istAn = () => { try { return localStorage.getItem(AN) !== '0'; } catch { return true; } };
  const anMerken = wert => { try { localStorage.setItem(AN, wert ? '1' : '0'); } catch { /* nur Komfort */ } };

  let teile = null, lauf = 0;

  // ---------- Gruppen der anderen Programme unter der Trefferliste ----------
  function zeigen(erg) {
    const U = window.ProUeberall, { liste, status } = teile;
    liste.replaceChildren();
    const saetze = [...erg.hinweise];
    if (erg.treffer.length) saetze.unshift(t('andere') + ': ' + U.wort('ergebnis', { n: erg.treffer.length }));
    status.replaceChildren(document.createTextNode(saetze.join(' ')));
    if (erg.netz) {
      const n = el('span', 'pro-ue-netzinfo', ' ' + erg.netz.info); n.dataset.proUeNetzinfo = ''; status.append(n);
      if (erg.netz.zu && window.ProBedienung) status.append(' ', window.ProBedienung.knopf(U.wort('mycel'), { name: 'mycel-oeffnen', beiTipp: () => { try { window.SbkimRendezvousUI?.show?.(); } catch { /* fail-soft */ } } }));
    }
    for (const g of U.gruppieren(erg.treffer)) {
      const s = el('section', 'pro-ue-gruppe'); s.dataset.proUeGruppe = g.schluessel;
      const fach = U.FAECHER.find(f => f.fach === g.typ);
      s.append(el('h4', 'pro-ue-gruppe-titel', (g.herkunft === 'netz' ? U.wort('gNetz') : U.wort('gTresor', { o: fach ? fach.ordner : g.typ })) + ' · ' + g.liste.length));
      const ul = el('ul', 'pro-ue-ul');
      for (const z of g.liste) {
        const li = el('li', 'pro-ue-zeile'); li.dataset.proUeHerkunft = z.herkunft; li.dataset.proUeTyp = z.typ || '';
        li.append(el('span', 'pro-ue-name', z.name || '–'));
        let stelle = z.stelle || '';
        if (z.herkunft === 'netz') stelle = U.wort('vonKnoten', { k: z.knoten || '?' }) + (z.bestaetigt ? '' : ' · ' + U.wort('unbestaetigt')) + (z.ausgeschlossen ? ' · ' + U.wort('nichtKi') : '');
        else if (fach && fach.app !== 'Private Brain Pro') stelle = (stelle ? stelle + ' · ' : '') + U.wort('nurZeile', { a: fach.app });
        if (stelle) li.append(el('span', 'pro-ue-stelle', stelle));
        ul.append(li);
      }
      s.append(ul); liste.append(s);
    }
    teile.bereich.hidden = !status.textContent && !liste.childElementCount;
  }

  /** Eine Suche: zuerst die Trefferliste dieser App, dann – wenn „Überall“ an ist – Tresorordner und (mit Haken) Netz. */
  async function suchen() {
    const U = window.ProUeberall, feld = document.getElementById('q'), frage = String(feld?.value || '').trim();
    const meiner = ++lauf;
    if (typeof renderResults === 'function') { try { await renderResults(feld.value); } catch { /* die Liste meldet ihren Fehler selbst */ } }
    teile.liste.replaceChildren(); teile.status.textContent = ''; teile.bereich.hidden = true;
    if (!U || !istAn() || !U.suchwoerter(frage).length) return null;
    const q = quellen(), br = tresor();
    if (!(q.tresor && br) && !q.netz) return null;
    teile.bereich.hidden = false; teile.status.textContent = U.wort('sucht'); teile.los.setAttribute('aria-busy', 'true');
    let erg;
    try {
      erg = await U.suchen(frage, { tresor: br, tresorOhne: ['private-brain'], netz: window.SbkimRendezvous || null,
        quellen: { app: false, tresor: q.tresor && !!br, netz: q.netz }, beiStand: s => { if (meiner === lauf) teile.status.textContent = s; } });
    } catch (e) { erg = { treffer: [], hinweise: [U.wort('fehler', { e: String((e && e.message) || e) })], netz: null }; }
    finally { teile.los.removeAttribute('aria-busy'); }
    if (meiner !== lauf) return null;   // eine neuere Suche hat übernommen
    zeigen(erg);
    return erg;
  }

  // ---------- Filterzeile: Namen, Reihenfolge, klare Wörter ----------
  const FILTER_NAMEN = [['fType', 'art'], ['fCat', 'kategorie'], ['fDate', 'zeitraum'], ['fTag', 'tag'], ['fSort', 'sortieren']];
  function filterOrdnen() {
    const bar = document.getElementById('filterbar'); if (!bar) return;
    const merken = document.getElementById('fSave'), zurueck = document.getElementById('fReset');
    for (const [id, name] of FILTER_NAMEN) {
      const sel = document.getElementById(id); if (!sel) continue;
      let l = sel.closest('label.pb-filter');
      if (!l) { l = el('label', 'pb-filter'); l.dataset.pbFilter = name; l.append(el('small')); sel.before(l); l.append(sel); }
      if (id === 'fSort') l.classList.add('pb-filter-ende');
      bar.append(l);
    }
    // Reihenfolge: Art · Kategorie · Zeitraum · Tag · merken · zurücksetzen · Sortieren (am Ende)
    const sort = document.getElementById('fSort')?.closest('label.pb-filter');
    if (sort) { if (merken) sort.before(merken); if (zurueck) sort.before(zurueck); }
    // Arten in derselben Reihenfolge wie bei „Dateien“ (Dokumente, Notizen, Fotos und Bilder), Tabellen danach
    const art = document.getElementById('fType');
    if (art) for (const v of ['doc', 'text', 'img', 'sheet']) { const o = art.querySelector(`option[value="${v}"]`); if (o) art.append(o); }
    filterWoerter();
  }
  function filterWoerter() {
    for (const [id, name] of FILTER_NAMEN) {
      const sel = document.getElementById(id), l = sel?.closest('label.pb-filter'); if (!l) continue;
      l.firstElementChild.textContent = t(name); sel.title = t(name); sel.setAttribute('aria-label', t(name));
    }
    const setze = (id, wert, text) => { const o = document.querySelector(`#${id} option[value="${wert}"]`); if (o) o.textContent = text; };
    setze('fType', '', t('alle')); setze('fCat', '', t('alle')); setze('fTag', '', t('alle')); setze('fDate', '', t('beliebig'));
    for (const v of ['doc', 'text', 'img', 'sheet']) setze('fType', v, t(v));
    setze('fDate', '7', t('d7')); setze('fDate', '30', t('d30')); setze('fDate', '365', t('d365'));
    setze('fSort', 'rel', t('rel')); setze('fSort', 'new', t('neu')); setze('fSort', 'old', t('alt')); setze('fSort', 'size', t('size')); setze('fSort', 'name', t('name'));
  }

  function woerter() {
    if (!teile) return;
    const U = window.ProUeberall;
    teile.leeren.title = t('leeren'); teile.leeren.setAttribute('aria-label', t('leeren'));
    teile.los.title = t('los'); teile.los.setAttribute('aria-label', t('los'));
    teile.ueberall.textContent = t('ueberall'); teile.ueberall.title = t('ueberallLang');
    teile.rad.title = t('quellen'); teile.rad.setAttribute('aria-label', t('quellen'));
    teile.quellen.setAttribute('aria-label', t('quellen'));
    for (const l of teile.quellen.querySelectorAll('label')) {
      const k = l.dataset.pbQuelle; l.lastElementChild.textContent = k === 'app' ? t('qApp') : U ? U.wort(k === 'tresor' ? 'qTresor' : 'qNetz') : k;
    }
    filterWoerter();
  }

  function einsetzen() {
    if (!window.ProUeberall) return false;
    const panel = document.getElementById('panel-search'), box = panel?.querySelector('.searchbox'), feld = document.getElementById('q');
    if (!panel || !box || !feld) return false;
    if (teile) return true;
    // 1) × und Lupe am Suchfeld
    const huelle = el('span', 'pb-such-feld'); feld.before(huelle); huelle.append(feld);
    const leeren = knopf('pbSuchLeeren', 'kreuz', 'pb-such-knopf'), los = knopf('pbSuchLos', 'lupe', 'pb-such-knopf pb-such-los');
    huelle.append(leeren, los);
    const leerZeigen = () => { leeren.hidden = !feld.value; };
    leeren.addEventListener('click', () => { feld.value = ''; feld.dispatchEvent(new Event('input', { bubbles: true })); leerZeigen(); lauf++; teile.liste.replaceChildren(); teile.status.textContent = ''; teile.bereich.hidden = true; feld.focus(); });
    feld.addEventListener('input', leerZeigen);
    los.addEventListener('click', () => { void suchen(); });
    feld.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); void suchen(); } });
    // 2) „Überall“ und Zahnrad in der Reihe der Suchleiste
    const ueberall = el('button', 'pb-such-ueberall'); ueberall.type = 'button'; ueberall.id = 'pbUeberallKnopf';
    const rad = knopf('pbUeberallRad', 'pfeil', 'pb-such-knopf pb-such-rad');   // kein zweites Zahnrad (Klaus 16.11.): ein kleiner Pfeil am Knopf rad.setAttribute('aria-expanded', 'false'); rad.setAttribute('aria-controls', 'pbUeberallQuellen');
    const qBox = el('div', 'pb-such-quellen'); qBox.id = 'pbUeberallQuellen'; qBox.hidden = true; qBox.setAttribute('role', 'group');
    const q0 = quellen();
    const haken = (k, an, fest) => { const l = el('label', 'pro-ue-quelle'), cb = el('input'); l.dataset.pbQuelle = k; cb.type = 'checkbox'; cb.checked = an; cb.disabled = !!fest; cb.dataset.proUeQuelle = k;
      cb.addEventListener('change', () => quelleMerken(k, cb.checked)); l.append(cb, el('span')); qBox.append(l); };
    haken('app', true, true);
    if (tresor()) haken('tresor', q0.tresor);
    haken('netz', q0.netz);
    const anSetzen = wert => { ueberall.setAttribute('aria-pressed', String(wert)); rad.disabled = !wert; if (!wert) { qBox.hidden = true; rad.setAttribute('aria-expanded', 'false'); } };
    ueberall.addEventListener('click', () => { const neu = ueberall.getAttribute('aria-pressed') !== 'true'; anMerken(neu); anSetzen(neu); if (!neu) { lauf++; teile.liste.replaceChildren(); teile.status.textContent = ''; teile.bereich.hidden = true; } });
    rad.addEventListener('click', () => { qBox.hidden = !qBox.hidden; rad.setAttribute('aria-expanded', String(!qBox.hidden)); });
    // Eigene Reihe unter dem Suchfeld: Bildbeschreibung · ⓘ · Überall · Zahnrad. So bleibt das Suchfeld auch am Handy bei großer
    // Schrift zweizeilig, und alles, was die Suche erweitert, steht nebeneinander.
    const reihe = el('div', 'pb-such-reihe'); reihe.id = 'pbSuchReihe';
    const paar = el('span', 'pb-such-paar'); paar.append(ueberall, rad);
    reihe.append(paar); box.after(reihe); reihe.after(qBox);
    // Klaus 16.11.2026: „Bedeutung“ ist nur an/aus und gehört eine Etage tiefer, neben „Bildbeschreibung“ und „Überall“.
    const modus = document.getElementById('mode'); if (modus) reihe.prepend(modus);
    // „Bildbeschreibung“ hat schon eine eigene flache Reihe (#pb-bild-row, pb-bildbeschreibung.js). Gibt es sie, ziehen „Bedeutung“
    // und „Überall“ dort ein (vor die aufklappbare Erklärung); sonst bleibt die eigene Reihe.
    const zurBildReihe = () => { const r = document.getElementById('pb-bild-row'); if (!r || r.contains(paar)) return;
      const vor = r.querySelector('.pb-help-content'); if (modus) r.insertBefore(modus, vor); r.insertBefore(paar, vor); r.after(qBox); reihe.remove(); };
    zurBildReihe(); new MutationObserver(zurBildReihe).observe(panel, { childList: true });
    // 3) Bereich für die Treffer der anderen Programme direkt unter der Trefferliste
    const bereich = el('section', 'pro-ue pb-such-andere'); bereich.id = 'pbUeberall'; bereich.dataset.proUe = ''; bereich.hidden = true;
    const status = el('p', 'pro-ue-status'); status.setAttribute('role', 'status'); status.dataset.proUeStatus = '';
    const liste = el('div', 'pro-ue-liste'); liste.dataset.proUeListe = '';
    bereich.append(status, liste);
    (document.getElementById('results') || panel.lastElementChild).after(bereich);
    teile = { leeren, los, ueberall, rad, quellen: qBox, bereich, status, liste };
    anSetzen(istAn()); leerZeigen(); filterOrdnen(); woerter();
    new MutationObserver(woerter).observe(root, { attributes: true, attributeFilter: ['lang'] });
    window.PBUeberall = { element: bereich, suchen };
    return true;
  }
  if (!einsetzen()) document.addEventListener('DOMContentLoaded', einsetzen, { once: true });
})();
