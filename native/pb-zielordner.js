/* Kategorien: Vorschau und Zielordner als Ordnerbaum (Klaus 2026-10-26, Sitzung 5, Punkt 6a).
   Dieselbe Datei in Pro (native/) und V3 (assets/).
   „Vorschau ansehen“ zeigt die künftige Ordnerstruktur direkt unter den Knöpfen als Baum, nicht mehr in einem
   eigenen Fenster. Nach „In neuen Ordner kopieren…“ steht an derselben Stelle der echte Zielordner als Baum: was
   wirklich kopiert wurde, gelesen aus dem gewählten Ordner. Dazu ein Satz hinter ⓘ, was Übersicht, Explorer und
   Kategorien unterscheidet. Das Kopieren selbst bleibt der vorhandene Weg (startReorg in index.html). */
(() => {
  'use strict';
  if (window.PBZielordner) return;
  const order = document.getElementById('panel-order'), note = document.getElementById('reorgNote');
  const preview = document.getElementById('reorgPreview'), start = document.getElementById('reorgStart'), scheme = document.getElementById('reorgScheme');
  if (!order || !note || !preview || !start || !scheme) return;
  const WORDS = {
    de: { why: 'Übersicht zählt deine Dateien und Ordner. Explorer zeigt sie so, wie sie auf dem Gerät liegen. Kategorien ordnet dieselben Dateien nach Bedeutung – nur als Vorschlag, nichts wird verschoben.',
      previewTitle: 'Vorschau: so sähe der neue Ordner aus', summary: '{n} Kopien in {m} Ordnern. Deine Originale bleiben unberührt.', one: '1 Kopie in 1 Ordner. Dein Original bleibt unberührt.',
      nothing: 'Nichts zu ordnen – erst Dateien hinzufügen.', doneTitle: 'Zielordner „{name}“ – das wurde kopiert:', doneEmpty: 'Im Zielordner liegt noch nichts.',
      file: 'Datei', files: 'Dateien', more: '… und {n} weitere', close: 'Ausblenden',
      noAccess: 'Das Kopieren in einen Ordner braucht den Ordnerzugriff des Browsers (Chrome oder Edge, auch als installierte App). In der Android-App kommt es mit dem nächsten Bau „Zielordner bearbeiten“.',
      unreadable: 'Kopiert. Der Zielordner ließ sich danach nicht lesen.' },
    en: { why: 'Overview counts your files and folders. Explorer shows them as they are on the device. Categories orders the same files by meaning – only a suggestion, nothing is moved.',
      previewTitle: 'Preview: this is how the new folder would look', summary: '{n} copies in {m} folders. Your originals stay untouched.', one: '1 copy in 1 folder. Your original stays untouched.',
      nothing: 'Nothing to order – add files first.', doneTitle: 'Target folder “{name}” – this was copied:', doneEmpty: 'The target folder is still empty.',
      file: 'file', files: 'files', more: '… and {n} more', close: 'Hide',
      noAccess: 'Copying into a folder needs the browser’s folder access (Chrome or Edge, also as an installed app). The Android app gets it with the next build, “edit target folder”.',
      unreadable: 'Copied. The target folder could not be read afterwards.' },
    ru: { why: 'Обзор считает файлы и папки. Проводник показывает их так, как они лежат на устройстве. Категории упорядочивают те же файлы по смыслу – только предложение, ничего не перемещается.',
      previewTitle: 'Предпросмотр: так будет выглядеть новая папка', summary: '{n} копий в {m} папках. Оригиналы остаются нетронутыми.', one: '1 копия в 1 папке. Оригинал остаётся нетронутым.',
      nothing: 'Нечего упорядочивать – сначала добавьте файлы.', doneTitle: 'Целевая папка «{name}» – скопировано:', doneEmpty: 'В целевой папке пока ничего нет.',
      file: 'файл', files: 'файлов', more: '… и ещё {n}', close: 'Скрыть',
      noAccess: 'Для копирования в папку нужен доступ браузера к папкам (Chrome или Edge, также как установленное приложение). В приложении для Android это появится со следующей сборкой «Редактировать целевую папку».',
      unreadable: 'Скопировано. Целевую папку после этого не удалось прочитать.' },
    pl: { why: 'Przegląd liczy pliki i foldery. Eksplorator pokazuje je tak, jak leżą na urządzeniu. Kategorie porządkują te same pliki według znaczenia – tylko propozycja, nic nie jest przenoszone.',
      previewTitle: 'Podgląd: tak wyglądałby nowy folder', summary: '{n} kopii w {m} folderach. Oryginały pozostają nietknięte.', one: '1 kopia w 1 folderze. Oryginał pozostaje nietknięty.',
      nothing: 'Nie ma czego porządkować – najpierw dodaj pliki.', doneTitle: 'Folder docelowy „{name}” – to zostało skopiowane:', doneEmpty: 'Folder docelowy jest jeszcze pusty.',
      file: 'plik', files: 'plików', more: '… i jeszcze {n}', close: 'Ukryj',
      noAccess: 'Kopiowanie do folderu wymaga dostępu przeglądarki do folderów (Chrome lub Edge, także jako zainstalowana aplikacja). W aplikacji na Androida pojawi się to w następnej wersji „Edytuj folder docelowy”.',
      unreadable: 'Skopiowano. Folderu docelowego nie udało się potem odczytać.' }
  };
  const words = () => WORDS[String(document.documentElement.lang || 'de').slice(0, 2)] || WORDS.de;
  const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
  const make = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text != null) node.textContent = text; return node; };
  function icon(kind) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.classList.add('pb-zo-icon');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', kind === 'file' ? 'M6 3h8l4 4v14H6Zm8 0v4h4' : 'M3 7V4h6l2 3h10v13H3Z'); svg.append(path); return svg;
  }

  // ⓘ: der Unterschied der drei Seiten, ein Satz. V3 hat eine Einleitung mit ⓘ; Pro nimmt sie beim Start weg und
  // bekommt hier eine neue, die native-help.js als „categories-intro“ mit ⓘ versieht.
  let why = order.querySelector('.pb-cats-why');
  if (!why) {
    let intro = order.querySelector(':scope>p.hint');
    if (!intro) { intro = make('p', 'hint'); document.getElementById('groups').before(intro); }
    why = make('span', 'pb-cats-why'); why.dataset.pbCatsWhy = '1';
    if (intro.textContent.trim()) intro.append(document.createTextNode(' '));
    intro.append(why);
  }

  // Der Baum steht im Kasten „Neu ordnen“ direkt unter den Knöpfen.
  const box = make('div', 'pb-zielordner'); box.hidden = true; box.dataset.pbZielordner = '';
  (note.querySelector(':scope>.btnrow') || note.lastElementChild).after(box);
  let state = null;

  function treeFromPlan(plan) {
    const root = { children: new Map(), files: [], count: 0 };
    for (const [path, count] of plan) {
      let node = root;
      for (const part of String(path).split('/')) {
        if (!node.children.has(part)) node.children.set(part, { children: new Map(), files: [], count: 0 });
        node = node.children.get(part); node.count += count;
      }
      root.count += count;
    }
    return root;
  }
  const LIMIT = 300, DEPTH = 6;
  async function readFolder(handle, depth, budget) {
    const node = { children: new Map(), files: [], count: 0 };
    if (depth > DEPTH) return node;
    const entries = [];
    for await (const entry of handle.values()) entries.push(entry);
    entries.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name, undefined, { numeric: true }) : a.kind === 'directory' ? -1 : 1));
    for (const entry of entries) {
      if (budget.left <= 0) { budget.cut += 1; continue; }
      budget.left -= 1;
      if (entry.kind === 'directory') { const child = await readFolder(entry, depth + 1, budget); node.children.set(entry.name, child); node.count += child.count; }
      else { node.files.push(entry.name); node.count += 1; }
    }
    return node;
  }
  function renderTree(node, budget) {
    const list = make('ul', 'pb-zo-tree');
    for (const [name, child] of node.children) {
      const item = make('li', 'pb-zo-folder'), head = make('span', 'pb-zo-node');
      head.append(icon('folder'), make('span', 'pb-zo-name', name), make('span', 'pb-zo-count', child.count + ' ' + (child.count === 1 ? words().file : words().files)));
      item.append(head);
      if (child.children.size || child.files.length) item.append(renderTree(child, budget));
      list.append(item);
    }
    for (const name of node.files) { const item = make('li', 'pb-zo-file'), head = make('span', 'pb-zo-node'); head.append(icon('file'), make('span', 'pb-zo-name', name)); item.append(head); list.append(item); }
    return list;
  }
  function render() {
    const w = words();
    box.replaceChildren(); box.hidden = !state;
    if (!state) return;
    box.dataset.pbZielordner = state.kind;
    const title = make('p', 'pb-zo-title');
    if (state.kind === 'preview') {
      title.append(make('strong', '', w.previewTitle));
      const total = state.tree.count, folders = state.plan.length;
      const summary = make('p', 'hint pb-zo-summary', total ? (total === 1 && folders === 1 ? w.one : fill(w.summary, { n: total, m: folders })) : w.nothing);
      box.append(title, summary); if (total) box.append(renderTree(state.tree));
    } else if (state.kind === 'done') {
      title.append(make('strong', '', fill(w.doneTitle, { name: state.name })));
      box.append(title);
      if (state.tree.count || state.tree.children.size) box.append(renderTree(state.tree)); else box.append(make('p', 'hint', w.doneEmpty));
      if (state.cut) box.append(make('p', 'hint pb-zo-more', fill(w.more, { n: state.cut })));
    } else {
      box.append(make('p', 'hint pb-zo-note', w[state.text]));
    }
    const close = make('button', 'ghost pb-zo-close', w.close); close.type = 'button'; close.addEventListener('click', () => { state = null; render(); });
    box.append(close);
  }
  function showPreview() {
    if (typeof reorgPlan !== 'function') return;
    const plan = reorgPlan(scheme.value);
    state = { kind: 'preview', plan, tree: treeFromPlan(plan) }; render();
  }
  async function copy() {
    if (typeof startReorg !== 'function') return;
    if (typeof window.showDirectoryPicker !== 'function') { state = { kind: 'note', text: 'noAccess' }; render(); return; }
    // Der vorhandene Kopierweg wählt den Ordner selbst; hier wird nur mitgelesen, welcher es war.
    const pick = window.showDirectoryPicker; let handle = null;
    window.showDirectoryPicker = async function (options) { handle = await pick.call(window, options); return handle; };
    try { await startReorg(); } finally { if (window.showDirectoryPicker !== pick) window.showDirectoryPicker = pick; }
    if (!handle) return;
    try {
      const budget = { left: LIMIT, cut: 0 }, tree = await readFolder(handle, 0, budget);
      state = { kind: 'done', name: handle.name, tree, cut: budget.cut };
    } catch { state = { kind: 'note', text: 'unreadable' }; }
    render();
  }
  // Die Knöpfe behalten ihre Beschriftung; der Weg dahinter wechselt vom Fenster zum Baum darunter.
  preview.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); showPreview(); }, true);
  start.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); copy(); }, true);
  scheme.addEventListener('change', () => { if (state?.kind === 'preview') showPreview(); });
  function language() { why.textContent = words().why; if (state) render(); }
  new MutationObserver(language).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  language();
  window.PBZielordner = Object.freeze({ preview: showPreview, copy, state: () => state, treeFromPlan, close: () => { state = null; render(); } });
})();
