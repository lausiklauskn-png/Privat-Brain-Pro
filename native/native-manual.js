/* Benutzerhandbuch Private Brain Pro: Anzeige in der App.
   Inhalt steht in handbuch-de.js. Ein Wort mit Erklärung springt zu seinem Absatz;
   zurück geht es über „↩ zurück“, durch erneutes Antippen des markierten Ziels oder
   mit der Android-Zurück-Taste. Links zu Anbietern öffnen den Browser. */
(() => {
  'use strict';
  const data = window.PB_HANDBUCH_DE;
  if (!data) return;
  const links = window.Capacitor?.Plugins?.ProLinks;
  const lang = () => Math.max(0, ['de', 'en', 'ru', 'pl'].indexOf(document.documentElement.lang));
  const W = {
    open: ['📖 Benutzerhandbuch', '📖 User manual', '📖 Руководство', '📖 Instrukcja'],
    close: ['✕ Schließen', '✕ Close', '✕ Закрыть', '✕ Zamknij'],
    toc: ['☰ Inhalt', '☰ Contents', '☰ Содержание', '☰ Spis treści'],
    back: ['↩ zurück', '↩ back', '↩ назад', '↩ wstecz'],
    terms: ['Begriffe von A bis Z', 'Terms A to Z', 'Термины', 'Pojęcia'],
    onlyGerman: ['', 'The manual is currently available in German only.', 'Руководство пока только на немецком языке.', 'Instrukcja jest obecnie dostępna tylko po niemiecku.'],
    guideVault: ['📖 Anleitung: Speicherort einrichten', '📖 Guide: set up storage location', '📖 Инструкция: место хранения', '📖 Instrukcja: miejsce zapisu'],
    browser: ['öffnet den Browser', 'opens the browser', 'открывает браузер', 'otwiera przeglądarkę']
  };
  const t = key => W[key][lang()];
  const slug = text => 'hb-' + String(text).toLocaleLowerCase('de').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const make = (tag, text, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };

  // ---------- targets: chapters, marked paragraphs, steps and terms ----------
  const targets = new Set();
  for (const k of data.kapitel) { targets.add('hb-' + k.id); for (const b of k.bloecke) if (b.id) targets.add('hb-' + b.id); }
  for (const b of data.begriffe) targets.add(b.id ? 'hb-' + b.id : slug(b.name));
  const termTarget = name => { const b = data.begriffe.find(x => x.name === name); return b ? (b.id ? 'hb-' + b.id : slug(b.name)) : ''; };

  /** Inline markup: [[Wort]] / [[Wort|ziel]] jumps, {{https://…|Text}} opens the browser, **fett**. */
  function inline(text) {
    const out = document.createDocumentFragment();
    const pattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\{\{(https:\/\/[^|}\s]+)\|([^}]+)\}\}|\*\*([^*]+)\*\*/g;
    let last = 0, m;
    while ((m = pattern.exec(text))) {
      out.append(document.createTextNode(text.slice(last, m.index)));
      if (m[1]) {
        const target = m[2] ? 'hb-' + m[2] : termTarget(m[1]);
        const a = make('a', m[1], 'hb-sprung'); a.href = '#' + target; a.dataset.target = target;
        out.append(a);
      } else if (m[3]) {
        const a = make('a', m[4] + ' ↗', 'hb-extern'); a.href = m[3]; a.dataset.url = m[3]; a.title = t('browser'); a.rel = 'noopener';
        out.append(a);
      } else {
        out.append(make('strong', m[5]));
      }
      last = pattern.lastIndex;
    }
    out.append(document.createTextNode(text.slice(last)));
    return out;
  }

  // ---------- the manual window ----------
  const dialog = make('dialog', null, 'pb-handbuch'); dialog.id = 'pbHandbuch';
  dialog.setAttribute('aria-labelledby', 'pbHandbuchTitel');
  const head = make('div', null, 'hb-kopf'), title = make('h2', data.titel), stand = make('p', data.stand, 'hb-stand');
  title.id = 'pbHandbuchTitel';
  const nav = make('div', null, 'hb-leiste');
  const tocLink = make('a', null, 'hb-leiste-link'); tocLink.href = '#hb-inhalt';
  const backLink = make('a', null, 'hb-leiste-link hb-zurueck'); backLink.href = '#'; backLink.hidden = true;
  const closeLink = make('a', null, 'hb-leiste-link'); closeLink.href = '#';
  nav.append(tocLink, backLink, closeLink);
  const note = make('p', null, 'hb-hinweis');
  head.append(title, stand, nav, note);
  const body = make('div', null, 'hb-inhalt');
  dialog.append(head, body);

  function build() {
    const toc = make('nav', null, 'hb-verzeichnis'); toc.id = 'hb-inhalt';
    const list = make('ol');
    for (const k of data.kapitel) { const li = make('li'), a = make('a', k.titel, 'hb-sprung'); a.href = '#hb-' + k.id; a.dataset.target = 'hb-' + k.id; li.append(a); list.append(li); }
    const li = make('li'), a = make('a', W.terms[0], 'hb-sprung'); a.href = '#hb-begriffe'; a.dataset.target = 'hb-begriffe'; li.append(a); list.append(li);
    toc.append(list);
    const parts = [toc];
    for (const k of data.kapitel) {
      const section = make('section', null, 'hb-kapitel'), h = make('h3', k.titel, 'hb-titel');
      section.id = 'hb-' + k.id; section.append(h);
      for (const b of k.bloecke) {
        if (b.schritte) {
          const ol = make('ol', null, 'hb-schritte');
          for (const s of b.schritte) { const li = make('li'); li.append(inline(s)); ol.append(li); }
          section.append(ol);
        } else {
          const p = make('p'); if (b.id) p.id = 'hb-' + b.id; p.append(inline(b.p)); section.append(p);
        }
      }
      parts.push(section);
    }
    const terms = make('section', null, 'hb-kapitel'), th = make('h3', W.terms[0], 'hb-titel'), dl = make('dl', null, 'hb-begriffe');
    terms.id = 'hb-begriffe'; terms.append(th);
    for (const b of [...data.begriffe].sort((x, y) => x.name.localeCompare(y.name, 'de'))) {
      const dt = make('dt', null, 'hb-titel'), dd = make('dd');
      dt.id = b.id ? 'hb-' + b.id : slug(b.name); dt.textContent = b.name; dd.append(inline(b.text));
      dl.append(dt, dd);
    }
    terms.append(dl); parts.push(terms);
    body.replaceChildren(...parts);
  }
  function labels() {
    tocLink.textContent = t('toc'); backLink.textContent = t('back'); closeLink.textContent = t('close');
    note.textContent = t('onlyGerman'); note.hidden = !note.textContent;
  }

  // ---------- jumping and returning ----------
  const stack = [];
  let current = null;
  function flash(el) { el.classList.remove('hb-markiert'); void el.offsetWidth; el.classList.add('hb-markiert'); }
  function jump(id, from) {
    const target = body.querySelector('#' + CSS.escape(id));
    if (!target) return;
    if (from) stack.push(from);
    current = target;
    target.scrollIntoView({ block: 'start' });
    flash(target);
    backLink.hidden = !stack.length;
  }
  function back() {
    const from = stack.pop();
    current = null;
    backLink.hidden = !stack.length;
    if (!from) return false;
    from.scrollIntoView({ block: 'center' });
    from.focus({ preventScroll: true });
    flash(from);
    return true;
  }
  body.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (link?.dataset.target) { event.preventDefault(); jump(link.dataset.target, link); return; }
    if (link?.dataset.url) {
      event.preventDefault();
      if (!event.isTrusted) return;
      if (typeof links?.open === 'function') void links.open({ url: link.dataset.url });
      else window.open(link.dataset.url, '_blank', 'noopener');
      return;
    }
    // A second tap on the word just jumped to returns to where it was used.
    const title = event.target.closest('.hb-titel');
    if (title && stack.length && (title === current || title.parentElement === current)) back();
  });
  tocLink.onclick = event => { event.preventDefault(); jump('hb-inhalt', null); };
  backLink.onclick = event => { event.preventDefault(); back(); };
  closeLink.onclick = event => { event.preventDefault(); dialog.close(); };
  // Android Back and Escape first step back through jumps, then close the manual.
  dialog.addEventListener('cancel', event => { if (stack.length) { event.preventDefault(); back(); } });
  dialog.addEventListener('close', () => { stack.length = 0; current = null; backLink.hidden = true; });

  function open(target) {
    if (!body.childElementCount) build();
    labels();
    if (!dialog.isConnected) document.body.append(dialog);
    if (!dialog.open) dialog.showModal();
    stack.length = 0; backLink.hidden = true;
    if (target) jump(target.startsWith('hb-') ? target : 'hb-' + target, null);
    else body.scrollTop = 0;
  }
  const entry = (text, target, cls) => {
    const a = make('a', text, 'hb-einstieg ' + (cls || '')); a.href = '#';
    a.onclick = event => { event.preventDefault(); open(target); };
    return a;
  };

  // ---------- ways in ----------
  const settingsLine = make('p', null, 'hb-einstiegszeile'); settingsLine.id = 'handbuchLink';
  function mountEntries() {
    settingsLine.replaceChildren(entry(t('open'), '', 'hb-haupt'));
    const settings = document.getElementById('panel-settings');
    if (settings && !settingsLine.isConnected) settings.prepend(settingsLine);
    const vault = document.getElementById('vaultPlace');
    let vaultLink = document.getElementById('handbuchSpeicherort');
    if (vault && !vaultLink) { vaultLink = entry('', 'speicherort'); vaultLink.id = 'handbuchSpeicherort'; vault.querySelector('.hint')?.after(vaultLink); }
    if (vaultLink) vaultLink.textContent = t('guideVault');
  }
  window.PBHandbuch = { open, back, targets: () => [...targets, 'hb-inhalt', 'hb-begriffe'] };
  mountEntries();
  void window.PBSchutz?.refresh?.();
  new MutationObserver(() => { mountEntries(); if (dialog.open) labels(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
