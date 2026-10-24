/* Four local appearance profiles; preserve the existing light/dark control and its handler. */
(() => {
  'use strict';
  if (window.PBTheme) return;
  const root = document.documentElement;
  const KEY = 'pb_pro_theme_v1', LIGHT_KEY = 'pb_pro_light_theme_v1';
  const NAMES = ['klarblau', 'graphit', 'petrol', 'nachtblau'];
  const BACKGROUNDS = { klarblau: '#f6f8fc', graphit: '#f7f8fa', petrol: '#f5f9f9', nachtblau: '#111827' };
  const ACCENTS = { klarblau: '#2563eb', graphit: '#475569', petrol: '#0f766e', nachtblau: '#7ca7ff' };
  const WORDS = {
    de: { title: 'Erscheinungsbild', group: 'Farbthema wählen', help: 'Ein Thema ändert die Farben. Deine Daten und Funktionen bleiben gleich.',
      names: ['Klarblau', 'Graphit', 'Petrol', 'Nachtblau'], descriptions: ['Helle Flächen und ein klarer blauer Akzent.', 'Neutrale Grautöne für konzentriertes Arbeiten.', 'Helle Flächen und ein ruhiger Petrolakzent.', 'Dunkle Flächen mit gut lesbaren hellen Akzenten.'],
      selected: 'Ausgewählt: {name}', unsaved: 'Das Thema gilt für diese Sitzung; die Einstellung konnte nicht gespeichert werden.' },
    en: { title: 'Appearance', group: 'Choose a colour theme', help: 'A theme changes the colours. Your data and functions stay the same.',
      names: ['Clear blue', 'Graphite', 'Petrol', 'Night blue'], descriptions: ['Light surfaces with a clear blue accent.', 'Neutral greys for focused work.', 'Light surfaces with a calm teal accent.', 'Dark surfaces with clearly readable light accents.'],
      selected: 'Selected: {name}', unsaved: 'The theme applies to this session; the preference could not be saved.' },
    ru: { title: 'Оформление', group: 'Выбрать цветовую тему', help: 'Тема меняет цвета. Данные и функции остаются прежними.',
      names: ['Чистый синий', 'Графит', 'Петроль', 'Ночной синий'], descriptions: ['Светлые поверхности и чёткий синий акцент.', 'Нейтральные серые тона для сосредоточенной работы.', 'Светлые поверхности и спокойный бирюзовый акцент.', 'Тёмные поверхности и хорошо читаемые светлые акценты.'],
      selected: 'Выбрано: {name}', unsaved: 'Тема действует в этом сеансе; сохранить настройку не удалось.' },
    pl: { title: 'Wygląd', group: 'Wybierz motyw kolorystyczny', help: 'Motyw zmienia kolory. Dane i funkcje pozostają bez zmian.',
      names: ['Czysty błękit', 'Grafit', 'Petrol', 'Nocny błękit'], descriptions: ['Jasne powierzchnie i wyraźny niebieski akcent.', 'Neutralne szarości ułatwiające skupienie.', 'Jasne powierzchnie i spokojny morski akcent.', 'Ciemne powierzchnie i czytelne jasne akcenty.'],
      selected: 'Wybrano: {name}', unsaved: 'Motyw obowiązuje w tej sesji; nie udało się zapisać ustawienia.' }
  };
  const words = () => WORDS[(root.lang || 'de').slice(0, 2)] || WORDS.de;
  const valid = name => NAMES.includes(name);
  const isLight = name => valid(name) && name !== 'nachtblau';
  const dark = () => root.getAttribute('data-theme') === 'dunkel';
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  let current = null, lastLight = read(LIGHT_KEY), unsaved = false, started = false;
  if (!isLight(lastLight)) lastLight = 'klarblau';

  function save() {
    try { localStorage.setItem(KEY, current); localStorage.setItem(LIGHT_KEY, lastLight); unsaved = false; }
    catch { unsaved = true; }
  }
  function setLegacyMode(wantDark) {
    if (dark() === wantDark) return;
    // applyTheme is private in today's index.html; use its public control rather than replace it.
    if (typeof window.applyTheme === 'function') window.applyTheme(wantDark ? 'dunkel' : 'tag');
    else {
      const toggle = document.getElementById('themeToggle');
      if (toggle) toggle.click();
    }
    // A missing legacy control must not prevent the chosen appearance from being usable.
    if (dark() !== wantDark) {
      if (wantDark) root.setAttribute('data-theme', 'dunkel');
      else root.removeAttribute('data-theme');
    }
  }
  function syncAppearance() {
    root.setAttribute('data-pb-theme', current);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BACKGROUNDS[current]);
    render();
    window.dispatchEvent(new CustomEvent('pb:theme', { detail: { name: current, mode: current === 'nachtblau' ? 'dunkel' : 'tag' } }));
  }
  function choose(name, persist = true) {
    if (!valid(name)) return false;
    current = name;
    if (isLight(name)) lastLight = name;
    setLegacyMode(name === 'nachtblau');
    if (persist) save();
    syncAppearance();
    return true;
  }
  function text(node, value) { if (node.textContent !== value) node.textContent = value; }
  function render() {
    const parent = document.getElementById('panel-settings');
    if (!parent || !current) return;
    let panel = document.getElementById('pb-theme-settings');
    if (!panel) {
      panel = document.createElement('section'); panel.id = 'pb-theme-settings'; panel.className = 'note pb-theme-settings';
      panel.setAttribute('aria-labelledby', 'pb-theme-heading');
      const heading = document.createElement('h3'); heading.id = 'pb-theme-heading';
      const help = document.createElement('p'); help.className = 'pb-theme-help';
      const choices = document.createElement('div'); choices.className = 'pb-theme-choices'; choices.setAttribute('role', 'group');
      for (const name of NAMES) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'pb-theme-choice'; button.dataset.pbThemeChoice = name;
        button.style.setProperty('--pb-choice-accent', ACCENTS[name]);
        const face = document.createElement('span'); face.className = 'pb-theme-face';
        const swatch = document.createElement('span'); swatch.className = 'pb-theme-swatch'; swatch.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span'); label.className = 'pb-theme-name';
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        tick.setAttribute('viewBox', '0 0 24 24'); tick.setAttribute('aria-hidden', 'true'); tick.setAttribute('focusable', 'false'); tick.classList.add('pb-theme-tick');
        const path = document.createElementNS(tick.namespaceURI, 'path'); path.setAttribute('d', 'm5 12 4 4L19 6'); tick.append(path);
        face.append(swatch, label, tick); button.append(face); button.addEventListener('click', () => choose(name)); choices.append(button);
      }
      const description = document.createElement('p'); description.className = 'pb-theme-description';
      const status = document.createElement('p'); status.className = 'pb-theme-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
      panel.append(heading, help, choices, description, status); parent.prepend(panel);
    }
    const w = words(), selected = NAMES.indexOf(current);
    text(panel.querySelector('h3'), w.title); text(panel.querySelector('.pb-theme-help'), w.help);
    panel.querySelector('.pb-theme-choices').setAttribute('aria-label', w.group);
    panel.querySelectorAll('[data-pb-theme-choice]').forEach(button => {
      const i = NAMES.indexOf(button.dataset.pbThemeChoice);
      text(button.querySelector('.pb-theme-name'), w.names[i]);
      button.setAttribute('aria-pressed', String(button.dataset.pbThemeChoice === current));
      button.title = w.names[i] + ' · ' + w.descriptions[i];
    });
    text(panel.querySelector('.pb-theme-description'), w.descriptions[selected]);
    const status=panel.querySelector('.pb-theme-status');
    status.classList.toggle('pb-help-status-redundant',!unsaved);
    text(status, w.selected.replace('{name}', w.names[selected]) + (unsaved ? ' · ' + w.unsaved : ''));
  }
  function start() {
    if (started) return; started = true;
    const saved = read(KEY);
    choose(valid(saved) ? saved : dark() ? 'nachtblau' : 'klarblau');
    new MutationObserver(mutations => {
      if (mutations.some(item => item.attributeName === 'data-theme')) {
        const expectDark = current === 'nachtblau';
        if (dark() !== expectDark) choose(dark() ? 'nachtblau' : lastLight);
        else document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BACKGROUNDS[current]);
      }
      if (mutations.some(item => item.attributeName === 'lang')) render();
    }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'lang'] });
  }
  window.PBTheme = Object.freeze({ choose, current: () => current, themes: Object.freeze([...NAMES]), refresh: render });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
