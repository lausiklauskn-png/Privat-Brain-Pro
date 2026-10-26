/* Klaus 2026-10-26, Sitzung 2. Dieselbe Datei in Private Brain Pro (native/pb-arrange.js) und in
   Private Brain V3 Pro (assets/pb-arrange.js); Android, Windows und PWA einer App laden sie aus demselben Webteil.
   Punkt 3: Explorer-Werkzeugzeile = Auswahl der Ansicht · Suche · Sortieren („D ↓“) · auch im Inhalt · Prüfstand.
            Der kleine ↑ entfällt; zurück geht es über den Pfad („Alle Dateien › E-Mails › …“).
   Punkt 2: ein Anordnungs-Knopf in Explorer, Postfach und Kategorien, in jeder Fenstergröße:
            nebeneinander · übereinander · Ordner ein/aus · alle Ordner einklappen, je Ansicht gemerkt.
   Die bisherigen Bedienelemente bleiben unsichtbar als Zustandshalter im Dokument. Katalog, Mails und Originale
   werden hier nie verändert. Solange nichts gewählt ist, gilt die bisherige Anordnung der jeweiligen App. */
(() => {
  'use strict';
  const ws = window.PBWorkspace;
  if (window.PBArrange || !ws?.explorerState || !ws.restoreExplorer) return;
  const W = {
    de: { choose: 'Ansicht wählen', search: 'Suche', sort: 'Sortieren', by: 'Sortieren nach', direction: 'Reihenfolge',
      name: 'Name', date: 'Datum', size: 'Größe', type: 'Typ', letters: { name: 'N', date: 'D', size: 'G', type: 'T' },
      dirs: { date: ['Neueste oben', 'Älteste oben'], size: ['Größte oben', 'Kleinste oben'], name: ['A → Z', 'Z → A'], type: ['A → Z', 'Z → A'] },
      legend: 'D Datum · N Name · G Größe · T Typ · ↓ absteigend: neueste, größte oder Z oben · ↑ aufsteigend: älteste, kleinste oder A oben',
      arrange: 'Anordnung', side: 'Nebeneinander', stack: 'Übereinander', tree: 'Ordnerbaum anzeigen', folders: 'Ordner anzeigen',
      collapse: 'Alle Ordner einklappen', grip: 'Höhe ändern: ziehen oder Pfeiltasten · Doppelklick: zurücksetzen',
      open: 'Aufklappen', close: 'Zuklappen', none: 'Ohne Kategorie', categories: 'Kategorien', content: 'Inhalt' },
    en: { choose: 'Choose view', search: 'Search', sort: 'Sort', by: 'Sort by', direction: 'Order',
      name: 'Name', date: 'Date', size: 'Size', type: 'Type', letters: { name: 'N', date: 'D', size: 'S', type: 'T' },
      dirs: { date: ['Newest first', 'Oldest first'], size: ['Largest first', 'Smallest first'], name: ['A → Z', 'Z → A'], type: ['A → Z', 'Z → A'] },
      legend: 'D date · N name · S size · T type · ↓ descending: newest, largest or Z on top · ↑ ascending: oldest, smallest or A on top',
      arrange: 'Layout', side: 'Side by side', stack: 'Stacked', tree: 'Show folder tree', folders: 'Show folders',
      collapse: 'Collapse all folders', grip: 'Change height: drag or arrow keys · double-click: reset',
      open: 'Expand', close: 'Collapse', none: 'Uncategorized', categories: 'Categories', content: 'Content' },
    ru: { choose: 'Выбрать вид', search: 'Поиск', sort: 'Сортировка', by: 'Сортировать по', direction: 'Порядок',
      name: 'Имя', date: 'Дата', size: 'Размер', type: 'Тип', letters: { name: 'И', date: 'Д', size: 'Р', type: 'Т' },
      dirs: { date: ['Сначала новые', 'Сначала старые'], size: ['Сначала большие', 'Сначала маленькие'], name: ['А → Я', 'Я → А'], type: ['А → Я', 'Я → А'] },
      legend: 'Д дата · И имя · Р размер · Т тип · ↓ по убыванию: новые, большие или Я сверху · ↑ по возрастанию: старые, маленькие или А сверху',
      arrange: 'Расположение', side: 'Рядом', stack: 'Друг под другом', tree: 'Показать дерево папок', folders: 'Показать папки',
      collapse: 'Свернуть все папки', grip: 'Изменить высоту: перетащите или стрелки · двойной щелчок: сброс',
      open: 'Развернуть', close: 'Свернуть', none: 'Без категории', categories: 'Категории', content: 'Содержимое' },
    pl: { choose: 'Wybierz widok', search: 'Szukaj', sort: 'Sortuj', by: 'Sortuj według', direction: 'Kolejność',
      name: 'Nazwa', date: 'Data', size: 'Rozmiar', type: 'Typ', letters: { name: 'N', date: 'D', size: 'R', type: 'T' },
      dirs: { date: ['Najnowsze u góry', 'Najstarsze u góry'], size: ['Największe u góry', 'Najmniejsze u góry'], name: ['A → Z', 'Z → A'], type: ['A → Z', 'Z → A'] },
      legend: 'D data · N nazwa · R rozmiar · T typ · ↓ malejąco: najnowsze, największe lub Z u góry · ↑ rosnąco: najstarsze, najmniejsze lub A u góry',
      arrange: 'Układ', side: 'Obok siebie', stack: 'Jeden pod drugim', tree: 'Pokaż drzewo folderów', folders: 'Pokaż foldery',
      collapse: 'Zwiń wszystkie foldery', grip: 'Zmień wysokość: przeciągnij lub strzałki · dwuklik: reset',
      open: 'Rozwiń', close: 'Zwiń', none: 'Bez kategorii', categories: 'Kategorie', content: 'Treść' }
  };
  const words = () => W[String(document.documentElement.lang || 'de').slice(0, 2)] || W.de;
  const $ = id => document.getElementById(id);
  const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const setText = (n, v) => { if (n.textContent !== v) n.textContent = v; };
  const setAttr = (n, k, v) => { if (v == null) { if (n.hasAttribute(k)) n.removeAttribute(k); } else if (n.getAttribute(k) !== String(v)) n.setAttribute(k, String(v)); };
  const visible = n => !!n && n.getClientRects().length > 0;

  // ---------- flat line symbols (Pro uses its own set when present, V3 these) ----------
  const PATHS = {
    home: 'm3 10 9-7 9 7 M5 9v12h14V9m-10 12v-8h6v8', mail: 'M3 5h18v14H3Z m0 0 9 7 9-7', file: 'M14 3H5v18h14V8Z M14 3v5h5',
    pdf: 'M14 3H5v18h14V8Z M14 3v5h5 M8 17v-5h2a1.5 1.5 0 0 1 0 3H8', images: 'M3 3h18v18H3Z m1 14 5-6 4 4 3-3 5 5 M8 7h.1',
    note: 'M14 3H5v18h14V8Z M14 3v5h5 M8 12h8m-8 4h6', folder: 'M3 7V4h6l2 3h10v13H3Z',
    sort: 'M7 3v18m-3-3 3 3 3-3 M17 21V3m-3 3 3-3 3 3', chevronDown: 'm6 9 6 6 6-6', chevronRight: 'm9 6 6 6-6 6',
    panel: 'M3 4h18v16H3Z M9 4v16', side: 'M3 4h18v16H3Z M10 4v16', stack: 'M3 4h18v16H3Z M3 11h18',
    tree: 'M4 4h5v4H4Z M6.5 8v10H11 M6.5 13H11 M13 11h7m-7 7h7', collapse: 'M4 4h16v16H4Z M8 12h8', check: 'm5 12 5 5 9-10'
  };
  const OWN = { tree: 1, side: 1, stack: 1, pdf: 1, check: 1 };
  function icon(key) {
    if (!OWN[key] && window.PBIcons?.has?.(key)) { const s = window.PBIcons.create(key); if (s) { s.classList.add('pb-arrange-icon'); return s; } }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'compact-icon pb-arrange-icon'); svg.dataset.iconKey = key;
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    const p = document.createElementNS(svg.namespaceURI, 'path'); p.setAttribute('d', PATHS[key] || PATHS.folder); svg.append(p); return svg;
  }

  // ---------- one popup pattern for the three menus ----------
  const menus = new Set();
  function menu(cls, id) {
    const box = make('details', 'pb-pop-menu ' + cls); if (id) box.id = id;
    const summary = make('summary'), pop = make('div', 'pb-pop'); pop.id = (id || cls) + '-popup' + (id ? '' : '-' + menus.size);
    summary.setAttribute('aria-controls', pop.id); box.append(summary, pop);
    box.addEventListener('toggle', () => { setAttr(summary, 'aria-expanded', String(box.open)); if (box.open) { for (const m of menus) if (m !== box) m.open = false; box.dispatchEvent(new Event('pb-pop-open')); place(box); } });
    box.addEventListener('keydown', e => { if (e.key === 'Escape' && box.open) { e.preventDefault(); box.open = false; summary.focus({ preventScroll: true }); } });
    menus.add(box); return { box, summary, pop };
  }
  function place(box) {
    if (!box.open) return;
    const pop = box.querySelector(':scope>.pb-pop'), a = box.getBoundingClientRect(), width = pop.getBoundingClientRect().width, m = 8;
    pop.style.left = Math.max(m, Math.min(a.left, document.documentElement.clientWidth - m - width)) + 'px';
    const below = Math.max(0, innerHeight - a.bottom - m - 4), above = Math.max(0, a.top - m - 4), up = below < 180 && above > below;
    pop.style.maxHeight = Math.max(1, up ? above : below) + 'px';
    pop.style.top = up ? 'auto' : (a.bottom + 4) + 'px'; pop.style.bottom = up ? (innerHeight - a.top + 4) + 'px' : 'auto';
  }
  function close(box) { box.open = false; box.querySelector(':scope>summary')?.focus({ preventScroll: true }); }
  document.addEventListener('pointerdown', e => { for (const m of menus) if (m.open && !m.contains(e.target)) m.open = false; });
  addEventListener('resize', () => { for (const m of menus) place(m); }, { passive: true });
  document.addEventListener('scroll', e => { for (const m of menus) if (m.open && !m.contains(e.target)) place(m); }, true);
  function option(label, iconKey, onClick) {
    const b = make('button', 'ghost pb-pop-item'); b.type = 'button';
    if (iconKey) b.append(icon(iconKey));
    const span = make('span', 'pb-pop-label', label); b.append(span, icon('check'));
    b.addEventListener('click', onClick); return b;
  }

  // ---------- Punkt 3: Explorer-Werkzeugzeile ----------
  const panel = $('explorerFiles')?.closest('#panel-explorer'), bar = panel?.querySelector('.explorer-toolbar'), select = $('explorerSort');
  const SECTION_ICON = { all: 'home', mail: 'mail', pdf: 'pdf', doc: 'file', photo: 'images', note: 'note', view: 'folder' };
  let view = null, sort = null, sortButtons = new Map(), dirButtons = [];
  const sortKeys = () => select ? [...new Set([...select.options].map(o => o.value.replace(/-r$/, '')))] : [];
  function go(path) {
    if (window.PBNavigation?.folder) window.PBNavigation.folder(path, false);
    else ws.restoreExplorer({ ...ws.explorerState(), path });
  }
  function buildExplorerBar() {
    if (!bar || !ws.explorerSections) return;
    bar.classList.add('pb-explorer-bar');
    view = menu('pb-explorer-view', 'pb-explorer-view');
    view.summary.append(make('span', 'pb-view-icon'), make('span', 'pb-view-label'), icon('chevronDown'));
    view.box.addEventListener('pb-pop-open', fillViews);
    sort = menu('pb-explorer-sort', 'pb-explorer-sort');
    sort.summary.append(icon('sort'), make('span', 'pb-sort-short'));
    const criteria = make('fieldset'), directions = make('fieldset');
    criteria.append(make('legend')); directions.append(make('legend'));
    for (const key of ['date', 'name', 'size', 'type']) {
      const b = make('button', 'ghost pb-pop-item'); b.type = 'button'; b.dataset.sortKey = key;
      b.append(make('span', 'pb-sort-letter'), make('span', 'pb-pop-label'), icon('check'));
      b.addEventListener('click', () => applySort({ sort: key, reverse: false })); criteria.append(b); sortButtons.set(key, b);
    }
    dirButtons = [false, true].map(reverse => {
      const b = make('button', 'ghost pb-pop-item'); b.type = 'button'; b.dataset.sortReverse = String(reverse);
      b.append(make('span', 'pb-pop-label'), icon('check')); b.addEventListener('click', () => applySort({ reverse })); directions.append(b); return b;
    });
    const legend = make('p', 'pb-sort-legend');
    sort.pop.append(criteria, directions, legend);
    sort.box.addEventListener('pb-pop-open', syncBar);
    bar.prepend(view.box, sort.box);
    orderBar();
    new MutationObserver(scheduleOrder).observe(bar, { childList: true });
    const path = $('explorerPath');
    if (path) new MutationObserver(scheduleSync).observe(path, { childList: true, subtree: true, characterData: true });
    select?.addEventListener('change', scheduleSync);
    addEventListener('pb-workspace-refresh', scheduleSync);
    if (typeof ResizeObserver === 'function') new ResizeObserver(scheduleSync).observe(bar);
    // Only foreign changes (Prüfstand text, workspace labels); the own menus would otherwise wake this endlessly.
    new MutationObserver(list => { if (list.some(m => !(m.target.nodeType === 1 ? m.target : m.target.parentElement)?.closest?.('.pb-pop-menu'))) scheduleSync(); }).observe(bar, { subtree: true, characterData: true, childList: true });
    new MutationObserver(scheduleSync).observe(panel, { attributes: true, attributeFilter: ['class'] });
    syncBar();
  }
  function applySort(change) {
    if (select) select.dataset.chosen = '1';
    ws.restoreExplorer({ ...ws.explorerState(), ...change });
    syncBar(); close(sort.box);
  }
  function fillViews() {
    const w = words(), now = ws.explorerSection?.() || { key: 'all' };
    view.pop.replaceChildren();
    for (const s of ws.explorerSections()) {
      if (s.key !== 'all' && !s.count && now.path !== s.path) continue;
      const b = option(s.label, SECTION_ICON[s.key] || 'folder', () => { close(view.box); go(s.path); });
      b.dataset.viewPath = s.path; b.append(make('small', 'pb-pop-count', String(s.count)));
      setAttr(b, 'aria-pressed', String(now.path === s.path)); view.pop.append(b);
    }
    setAttr(view.pop, 'aria-label', w.choose); place(view.box);
  }
  // Sorting is shown on the button itself: letter and arrow, „D ↓“ = newest on top.
  function syncBar() {
    if (!view) return;
    const w = words(), now = ws.explorerSection?.() || { key: 'all', label: '' };
    const slot = view.summary.querySelector('.pb-view-icon'), key = SECTION_ICON[now.key] || 'folder';
    if (slot.firstElementChild?.dataset.iconKey !== key) slot.replaceChildren(icon(key));
    setText(view.summary.querySelector('.pb-view-label'), now.label);
    view.summary.title = w.choose + ': ' + now.label; setAttr(view.summary, 'aria-label', view.summary.title);
    view.box.dataset.section = now.key;
    // At the top the path would only repeat „Alle Dateien“; below it is the way back.
    const path = $('explorerPath'); if (path && path.hidden !== (now.key === 'all')) path.hidden = now.key === 'all';
    const state = ws.explorerState(), supported = sortKeys(), k = supported.includes(state.sort) ? state.sort : 'date', rev = !!state.reverse;
    const dirs = w.dirs[k], down = (k === 'date' || k === 'size') !== rev;
    setText(sort.summary.querySelector('.pb-sort-short'), w.letters[k] + ' ' + (down ? '↓' : '↑'));
    const said = w.sort + ': ' + w[k] + ' · ' + dirs[rev ? 1 : 0];
    sort.summary.title = said + '\n' + w.legend; setAttr(sort.summary, 'aria-label', said);
    const [criteria, directions] = sort.pop.querySelectorAll('fieldset');
    setText(criteria.querySelector('legend'), w.by); setText(directions.querySelector('legend'), w.direction);
    for (const [name, b] of sortButtons) {
      setText(b.querySelector('.pb-sort-letter'), w.letters[name]); setText(b.querySelector('.pb-pop-label'), w[name]);
      setAttr(b, 'aria-pressed', String(name === k)); setAttr(b, 'aria-current', name === k ? 'true' : null); b.disabled = !supported.includes(name); b.hidden = !supported.includes(name);
    }
    dirButtons.forEach((b, i) => { setText(b.querySelector('.pb-pop-label'), dirs[i]); setAttr(b, 'aria-pressed', String(rev === !!i)); });
    setText(sort.pop.querySelector('.pb-sort-legend'), w.legend);
    // Narrow: one row of buttons; „auch im Inhalt“ becomes „Inhalt“, the Prüfstand its shield (full words as tooltip).
    const narrow = bar.clientWidth > 0 && bar.clientWidth < 600;
    setAttr(bar, 'data-narrow', narrow ? '' : null);
    const label = bar.querySelector('.explorer-content'), words2 = label?.querySelector(':scope>span');
    const textNode = words2 && [...words2.childNodes].find(n => n.nodeType === 3 && n.nodeValue.trim());
    if (textNode) {
      const now = textNode.nodeValue.trim();
      if (now !== w.content) label.dataset.full = now;          // the workspace wrote its full words again
      const want = narrow ? w.content : (label.dataset.full || now);
      if (textNode.nodeValue.trim() !== want) textNode.nodeValue = textNode.nodeValue.startsWith(' ') ? ' ' + want : want;
      label.title = label.dataset.full || '';
    }
    const check = bar.querySelector(':scope>.pb-check-all-button');
    if (check) { const said = check.textContent.replace(/\p{Extended_Pictographic}\uFE0F?/gu, '').replace(/\s+/g, ' ').trim(); if (narrow) { if (check.title !== said) check.title = said; setAttr(check, 'aria-label', said); } else if (check.getAttribute('aria-label') === check.title) { check.removeAttribute('aria-label'); } }
    if (view.box.open) fillViews(); place(sort.box);
  }
  // Order: choice (with the layout button beside it) · search · sort · also in content · Prüfstand.
  // Hidden state holders go to the end.
  function orderBar() {
    if (!bar) return;
    const filter = $('explorerFilter'); let field = filter;
    while (field && field.parentElement && field.parentElement !== bar) field = field.parentElement;
    const content = bar.querySelector(':scope>.explorer-order') || $('explorerContent')?.closest('.explorer-toolbar>*');
    const check = bar.querySelector(':scope>.pb-check-all-button');
    const arrange = bar.querySelector(':scope>.pb-arrange');
    const want = [view?.box, arrange, field, sort?.box, content, check].filter(n => n && n.parentElement === bar);
    want.forEach((n, i) => { if (bar.children[i] !== n) bar.insertBefore(n, bar.children[i] || null); });
  }
  let orderQueued = false, syncQueued = false;
  function scheduleOrder() { if (!orderQueued) { orderQueued = true; queueMicrotask(() => { orderQueued = false; orderBar(); }); } }
  // Only while the explorer is on screen; it catches up as soon as it is shown again.
  const explorerShown = () => !!panel && panel.classList.contains('on');
  function scheduleSync() { if (!syncQueued && explorerShown()) { syncQueued = true; queueMicrotask(() => { syncQueued = false; syncBar(); apply(); }); } }

  // ---------- Punkt 2: Anordnung je Ansicht ----------
  const KEY = 'pb_arrange_v1';
  let store = {};
  try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && typeof v === 'object') store = v; } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} };
  function chosen(name) {
    const v = store[name] || {};
    return { mode: v.mode === 'side' || v.mode === 'stack' ? v.mode : null, tree: typeof v.tree === 'boolean' ? v.tree : null,
      height: Number.isFinite(v.height) && v.height > 0 ? v.height : null };
  }
  // Nothing chosen yet: the app keeps its own arrangement for this window size.
  function effective(name) {
    const c = chosen(name);
    if (c.mode === null && c.tree === null) return null;
    return { mode: c.mode || (innerWidth > (name === 'mail' ? 900 : 650) ? 'side' : 'stack'), tree: c.tree ?? true };
  }
  // What is on screen right now (also when nothing was chosen).
  function shown(name) {
    const e = effective(name); if (e) return e;
    const guess = innerWidth > (name === 'mail' ? 900 : 650) ? 'side' : 'stack';
    let first = null, second = null;
    if (name === 'explorer') { first = $('explorerTree'); second = $('explorerFiles'); }
    else if (name === 'mail') { const l = [...document.querySelectorAll('#mailWorkspace .mail-layout')].find(visible); first = l?.querySelector(':scope>.mail-folders'); second = l?.querySelector(':scope>.mail-list'); }
    if (!visible(first)) return { mode: guess, tree: false };
    const a = first.getBoundingClientRect(), b = second?.getBoundingClientRect();
    return { mode: b && a.right <= b.left + 2 ? 'side' : 'stack', tree: true };
  }
  function choose(name, change) {
    const now = shown(name);
    store[name] = { ...(store[name] || {}), mode: store[name]?.mode || now.mode, tree: store[name]?.tree ?? now.tree, ...change };
    save(); apply();
  }
  const buttons = new Set();
  function arrangeButton(name) {
    const m = menu('pb-arrange'); m.box.dataset.arrangeView = name; buttons.add(m);
    m.summary.append(icon('panel'));
    const side = option('', 'side', () => { choose(name, { mode: 'side', tree: true }); close(m.box); });
    const stack = option('', 'stack', () => { choose(name, { mode: 'stack', tree: true }); close(m.box); });
    const tree = option('', 'tree', () => { choose(name, { tree: !shown(name).tree }); close(m.box); });
    const fold = option('', 'collapse', () => { collapseAll(name); close(m.box); });
    side.dataset.arrange = 'side'; stack.dataset.arrange = 'stack'; tree.dataset.arrange = 'tree'; fold.dataset.arrange = 'collapse';
    fold.querySelector('[data-icon-key=check]')?.remove();
    m.pop.append(side, stack, tree, fold);
    m.box.addEventListener('pb-pop-open', () => syncButton(m));
    syncButton(m); return m.box;
  }
  function canCollapse(name) {
    if (name === 'explorer') return !!document.querySelector('#explorerTree .explorer-collapse') && shown('explorer').tree;
    if (name === 'mail') return !!document.querySelector('#mailWorkspace .mail-more-folders[aria-expanded="true"]');
    return orderOpen.size > 0 && shown('order').tree;
  }
  function collapseAll(name) {
    if (name === 'explorer') document.querySelector('#explorerTree .explorer-collapse')?.click();
    else if (name === 'mail') for (const b of document.querySelectorAll('#mailWorkspace .mail-more-folders[aria-expanded="true"]')) b.click();
    else { orderOpen.clear(); saveOrderOpen(); drawOrderTree(); }
  }
  function syncButton(m) {
    const w = words(), name = m.box.dataset.arrangeView, now = shown(name);
    m.summary.title = w.arrange; setAttr(m.summary, 'aria-label', w.arrange);
    const [side, stack, tree, fold] = m.pop.children;
    setText(side.querySelector('.pb-pop-label'), w.side); setText(stack.querySelector('.pb-pop-label'), w.stack);
    setText(tree.querySelector('.pb-pop-label'), name === 'mail' ? w.folders : w.tree); setText(fold.querySelector('.pb-pop-label'), w.collapse);
    setAttr(side, 'aria-pressed', String(now.tree && now.mode === 'side')); setAttr(stack, 'aria-pressed', String(now.tree && now.mode === 'stack'));
    setAttr(tree, 'aria-pressed', String(now.tree)); fold.disabled = !canCollapse(name);
    place(m.box);
  }

  // Stacked: the upper part gets a height that can be dragged (like the column lines side by side).
  function grip(name, layout, before) {
    let g = layout.querySelector(':scope>.pb-stack-grip');
    if (!g) {
      g = make('div', 'pb-stack-grip'); g.tabIndex = 0; g.setAttribute('role', 'separator'); g.setAttribute('aria-orientation', 'horizontal');
      g.dataset.arrangeView = name;
      const upper = () => layout.querySelector(':scope>' + before);
      const set = h => { const max = Math.max(80, layout.getBoundingClientRect().height - 120); const v = Math.round(Math.min(max, Math.max(60, h)));
        store[name] = { ...(store[name] || {}), height: v }; layout.style.setProperty('--pb-stack-size', v + 'px'); };
      g.addEventListener('pointerdown', e => {
        if (e.button !== 0) return; e.preventDefault(); const u = upper(); if (!u) return;
        const y0 = e.clientY, h0 = u.getBoundingClientRect().height; try { g.setPointerCapture(e.pointerId); } catch {}
        document.documentElement.classList.add('pb-stack-dragging');
        const move = ev => set(h0 + ev.clientY - y0);
        const up = () => { g.removeEventListener('pointermove', move); document.documentElement.classList.remove('pb-stack-dragging'); save(); };
        g.addEventListener('pointermove', move); g.addEventListener('pointerup', up, { once: true }); g.addEventListener('pointercancel', up, { once: true });
      });
      g.addEventListener('keydown', e => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return; e.preventDefault();
        set((upper()?.getBoundingClientRect().height || 0) + (e.key === 'ArrowDown' ? 16 : -16)); save();
      });
      g.addEventListener('dblclick', () => { if (store[name]) delete store[name].height; layout.style.removeProperty('--pb-stack-size'); save(); });
    }
    const u = layout.querySelector(':scope>' + before);
    if (u && g.previousElementSibling !== u) u.after(g);
    const w = words(); g.title = w.grip; setAttr(g, 'aria-label', w.grip);
    const h = chosen(name).height;
    if (h) layout.style.setProperty('--pb-stack-size', h + 'px'); else layout.style.removeProperty('--pb-stack-size');
    return g;
  }

  // ---------- Kategorien: optional folder tree (category ▸ files) ----------
  const orderPanel = $('panel-order');
  const ORDER_OPEN = 'pb_arrange_order_open';
  let orderOpen = new Set();
  try { const v = JSON.parse(localStorage.getItem(ORDER_OPEN) || '[]'); if (Array.isArray(v)) orderOpen = new Set(v.map(String)); } catch {}
  const saveOrderOpen = () => { try { localStorage.setItem(ORDER_OPEN, JSON.stringify([...orderOpen])); } catch {} };
  let orderTree = null, orderBarBox = null;
  function buildOrder() {
    if (!orderPanel) return;
    orderBarBox = make('div', 'pb-order-bar'); orderBarBox.append(arrangeButton('order'));
    orderTree = make('nav', 'pb-order-tree');
    orderPanel.prepend(orderBarBox, orderTree);
  }
  function drawOrderTree() {
    if (!orderTree || !shown('order').tree) { orderTree?.replaceChildren(); return; }
    const w = words(), list = typeof CATALOG !== 'undefined' && Array.isArray(CATALOG) ? CATALOG : [];
    const groups = new Map(), seen = new Set();
    for (const r of list) { if (!r?.hash || seen.has(r.hash)) continue; seen.add(r.hash); const c = String(r.category || ''); if (!groups.has(c)) groups.set(c, []); groups.get(c).push(r); }
    setAttr(orderTree, 'aria-label', w.categories);
    orderTree.replaceChildren();
    for (const [cat, files] of [...groups].sort((a, b) => (a[0] || '￿').localeCompare(b[0] || '￿'))) {
      const open = orderOpen.has(cat), row = make('div', 'pb-order-node');
      const tw = make('button', 'ghost pb-order-twisty'); tw.type = 'button'; tw.append(icon(open ? 'chevronDown' : 'chevronRight'));
      tw.title = open ? w.close : w.open; setAttr(tw, 'aria-label', tw.title); setAttr(tw, 'aria-expanded', String(open)); tw.dataset.category = cat;
      const label = make('button', 'ghost pb-order-folder'); label.type = 'button'; label.dataset.category = cat;
      label.append(icon('folder'), make('span', '', (cat || w.none) + ' (' + files.length + ')'));
      const toggle = () => { open ? orderOpen.delete(cat) : orderOpen.add(cat); saveOrderOpen(); drawOrderTree(); };
      tw.onclick = toggle; label.onclick = toggle;
      row.append(tw, label); orderTree.append(row);
      if (open) for (const r of [...files].sort((a, b) => String(a.name).localeCompare(String(b.name)))) {
        const leaf = make('button', 'ghost pb-order-file'); leaf.type = 'button'; leaf.dataset.hash = r.hash;
        leaf.append(icon(r.mail ? 'mail' : /\.pdf$/i.test(r.name || '') ? 'pdf' : 'file'), make('span', '', String(r.name || '')));
        leaf.title = String(r.path || r.name || '');
        // Shows the file in the explorer, where it can be opened; nothing is moved.
        leaf.onclick = () => { ws.restoreExplorer({ ...ws.explorerState(), path: '', filter: String(r.name || '') }); ws.navigate('explorer'); };
        orderTree.append(leaf);
      }
    }
  }
  function placeOrderTree() {
    if (!orderTree) return;
    const e = effective('order');
    if (!(e?.tree && e.mode === 'side')) { for (const k of ['left', 'top', 'width', 'bottom']) orderTree.style.removeProperty(k); return; }
    const cs = getComputedStyle(orderPanel);
    orderTree.style.left = cs.paddingLeft; orderTree.style.top = (orderBarBox.offsetTop + orderBarBox.offsetHeight + 6) + 'px';
    orderTree.style.bottom = cs.paddingBottom;
  }

  // ---------- put the arrangement on the page ----------
  const watched = new WeakSet();
  function apply() {
    const ex = effective('explorer'), layout = panel?.querySelector('.explorer-layout');
    if (layout) {
      setAttr(layout, 'data-pb-arrange', ex ? ex.mode : null);
      if (ex) { const hidden = panel.classList.contains('explorer-tree-hidden'); if (hidden === ex.tree) $('explorerTreeToggle')?.click(); }
      grip('explorer', layout, '#explorerTree');
    }
    const mx = effective('mail');
    for (const l of document.querySelectorAll('#mailWorkspace .mail-layout')) {
      setAttr(l, 'data-pb-arrange', mx ? mx.mode : null); setAttr(l, 'data-pb-folders', mx ? (mx.tree ? 'on' : 'off') : null);
      setAttr(l, 'data-pb-narrow', mx && l.getBoundingClientRect().width < 700 && l.getBoundingClientRect().width > 0 ? '' : null);
      grip('mail', l, '.mail-list');
      if (!watched.has(l) && typeof ResizeObserver === 'function') { watched.add(l); new ResizeObserver(scheduleApply).observe(l); }
      const app = l.closest('.mail-app'), head = app?.querySelector(':scope>.mail-head');
      if (head && !head.querySelector(':scope>.pb-arrange')) head.append(arrangeButton('mail'));
    }
    if (orderPanel && orderTree) {
      const ox = effective('order');
      setAttr(orderPanel, 'data-pb-arrange', ox ? ox.mode : null); setAttr(orderPanel, 'data-pb-tree', ox?.tree ? 'on' : 'off');
      grip('order', orderPanel, '.pb-order-tree');
      if (ox?.tree) { if (!orderTree.childElementCount) drawOrderTree(); } else orderTree.replaceChildren();
      placeOrderTree();
    }
    for (const m of buttons) if (m.box.isConnected) syncButton(m); else buttons.delete(m);
  }
  let applyQueued = false;
  function scheduleApply() { if (!applyQueued) { applyQueued = true; requestAnimationFrame(() => { applyQueued = false; apply(); }); } }

  buildExplorerBar();
  if (bar) { bar.append(arrangeButton('explorer')); orderBar(); }
  buildOrder();
  // The mail apps are built by their own scripts and may appear later (account connected).
  const mailHost = $('mailWorkspace');
  if (mailHost) new MutationObserver(list => { if (list.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches?.('.mail-app,.mail-layout') || n.querySelector?.('.mail-layout'))))) scheduleApply(); }).observe(mailHost, { childList: true, subtree: true });
  addEventListener('pb-workspace-refresh', () => { if (shown('order').tree) drawOrderTree(); scheduleApply(); });
  addEventListener('resize', () => { placeOrderTree(); scheduleApply(); }, { passive: true });
  if (orderPanel) new MutationObserver(() => { if (orderPanel.classList.contains('on')) { drawOrderTree(); placeOrderTree(); } }).observe(orderPanel, { attributes: true, attributeFilter: ['class'] });
  if (typeof ResizeObserver === 'function' && orderPanel) new ResizeObserver(placeOrderTree).observe(orderPanel);
  new MutationObserver(() => { syncBar(); drawOrderTree(); apply(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  apply();
  window.PBArrange = Object.freeze({
    state: name => ({ chosen: chosen(name), shown: shown(name) }),
    choose, collapseAll, refresh: () => { syncBar(); apply(); },
    // Back to the app's own arrangement for this window size.
    reset: name => { delete store[name]; save(); apply(); }
  });
})();
