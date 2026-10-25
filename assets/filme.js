/* 🎬 Filme in der App (Klaus 2026-10-25): „in einem Video-Button, genau wie oben bei Workflow PDF … jeweils in der
   entsprechenden Version von der App“. Ein Knopf in der Kopfleiste öffnet Werbefilm und Handbuchvideo.
   Die Filme liegen auf der Family-Projekt-Videoseite (Family-Projekt.de-Video, je Film EINE Fassung, Teile mit SHA-256):
   - Browserfassung auf github.io: derselbe Ursprung wie die Videoseite → deren Spieler (abspielen.html) streamt im Fenster.
   - App (Android, Windows): die Teile werden geholt, Größe und SHA-256 je Teil geprüft, dann spielt der Film im Fenster.
   - „Herunterladen“ öffnet die Videoseite mit ?laden= (prüft und speichert die ganze Datei); in der App im Browser.
   Nichts wird vor dem Tipp geladen. Dieselbe Datei steht in Privat-Brain-Pro-V3 und Privat-Brain-Pro. */
(() => {
  'use strict';
  const BASE = window.PB_FILME_BASIS || 'https://lausiklauskn-png.github.io/Family-Projekt.de-Video/';
  const FILME = [
    { id: 'private-brain-pro-film', key: 'film' },
    { id: 'private-brain-pro-handbuch', key: 'handbuch' }
  ];
  const W = {
    de: { button: 'Filme', title: 'Filme: Werbefilm und Handbuchvideo', film: 'Werbefilm', handbuch: 'Handbuchvideo',
      play: 'Abspielen', download: 'Herunterladen', close: 'Schließen', loading: 'Film wird geladen und geprüft …',
      part: 'Teil {i} von {n} · {a} von {b}', ready: 'Geprüft. Der Film läuft.', offline: 'Ohne Internet lässt sich der Film nicht laden. Er liegt auf der Family-Projekt-Videoseite und wird nicht auf dem Gerät gespeichert.',
      failed: 'Der Film ließ sich nicht laden: {e}', bad: 'Ein Teil kam beschädigt an. Bitte noch einmal versuchen.', browser: 'Im Browser abspielen',
      note: 'Die Filme liegen auf der Family-Projekt-Videoseite; jeder Teil wird geprüft. Herunterladen speichert die ganze Datei in voller Qualität.' },
    en: { button: 'Films', title: 'Films: promo film and manual video', film: 'Promo film', handbuch: 'Manual video',
      play: 'Play', download: 'Download', close: 'Close', loading: 'Loading and checking the film …',
      part: 'Part {i} of {n} · {a} of {b}', ready: 'Checked. The film is playing.', offline: 'Without internet the film cannot load. It lives on the Family-Projekt video page and is not stored on the device.',
      failed: 'The film could not be loaded: {e}', bad: 'A part arrived damaged. Please try again.', browser: 'Play in the browser',
      note: 'The films live on the Family-Projekt video page; every part is checked. Download saves the whole file in full quality.' },
    ru: { button: 'Фильмы', title: 'Фильмы: рекламный ролик и видеоинструкция', film: 'Рекламный ролик', handbuch: 'Видеоинструкция',
      play: 'Смотреть', download: 'Скачать', close: 'Закрыть', loading: 'Фильм загружается и проверяется …',
      part: 'Часть {i} из {n} · {a} из {b}', ready: 'Проверено. Фильм воспроизводится.', offline: 'Без интернета фильм не загрузится.',
      failed: 'Не удалось загрузить фильм: {e}', bad: 'Часть пришла повреждённой. Попробуйте ещё раз.', browser: 'Смотреть в браузере',
      note: 'Фильмы хранятся на странице Family-Projekt; каждая часть проверяется. «Скачать» сохраняет весь файл в полном качестве.' },
    pl: { button: 'Filmy', title: 'Filmy: film reklamowy i wideo-instrukcja', film: 'Film reklamowy', handbuch: 'Wideo-instrukcja',
      play: 'Odtwórz', download: 'Pobierz', close: 'Zamknij', loading: 'Film jest ładowany i sprawdzany …',
      part: 'Część {i} z {n} · {a} z {b}', ready: 'Sprawdzono. Film jest odtwarzany.', offline: 'Bez internetu filmu nie można załadować.',
      failed: 'Nie udało się załadować filmu: {e}', bad: 'Część dotarła uszkodzona. Spróbuj ponownie.', browser: 'Odtwórz w przeglądarce',
      note: 'Filmy są na stronie wideo Family-Projekt; każda część jest sprawdzana. „Pobierz” zapisuje cały plik w pełnej jakości.' }
  };
  const t = k => (W[document.documentElement.lang] || W.de)[k];
  const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);
  const mb = n => (n / 1e6).toLocaleString(document.documentElement.lang || 'de', { maximumFractionDigits: 1 }) + ' MB';
  const ICON = 'M3 5h18v14H3Z M3 9h18 M3 15h18 M7 5v4 M12 5v4 M17 5v4 M7 15v4 M12 15v4 M17 15v4';
  const NS = 'http://www.w3.org/2000/svg';
  const sameOrigin = (() => { try { return new URL(BASE).origin === location.origin; } catch { return false; } })();

  function openExternal(url) {
    const links = window.Capacitor?.Plugins?.ProLinks;
    if (typeof links?.open === 'function') return links.open({ url }).catch(() => window.open(url, '_blank', 'noopener'));
    window.open(url, '_blank', 'noopener');
  }
  const playUrl = id => BASE + 'abspielen.html?id=' + encodeURIComponent(id);
  const loadUrl = id => BASE + 'index.html?laden=' + encodeURIComponent(id) + '#video-' + encodeURIComponent(id);

  let listPromise = null;
  function list() {
    listPromise ||= fetch(BASE + 'videos.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('videos.json ' + r.status); return r.json(); })
      .catch(e => { listPromise = null; throw e; });
    return listPromise;
  }
  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  const blobs = new Map();   // je Sitzung: ein geprüfter Film wird nicht zweimal geholt

  /** Holt alle Teile, prüft Größe und SHA-256 je Teil und liefert eine Blob-Adresse (in der App). */
  async function fetchFilm(id, signal, progress) {
    if (blobs.has(id)) return blobs.get(id);
    const entry = (await list()).videos?.find(v => v.id === id);
    if (!entry || !Array.isArray(entry.teile) || !entry.teile.length) throw new Error('unbekannter Film');
    const parts = [], total = entry.teile.reduce((s, p) => s + p.groesse, 0);
    let done = 0;
    for (let i = 0; i < entry.teile.length; i++) {
      const want = entry.teile[i], url = BASE + 'videos/' + id + '/teil-' + String(i).padStart(2, '0') + '.bin';
      let ok = null;
      for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
        const res = await fetch(url, { signal, cache: 'no-store' });
        if (!res.ok) { if (attempt === 3) throw new Error('Teil ' + (i + 1) + ': ' + res.status); continue; }
        const reader = res.body.getReader(), chunks = []; let got = 0;
        for (;;) {
          const { done: end, value } = await reader.read(); if (end) break;
          chunks.push(value); got += value.length; progress(i + 1, entry.teile.length, done + got, total);
        }
        const buf = await new Blob(chunks).arrayBuffer();
        if (buf.byteLength === want.groesse && hex(await crypto.subtle.digest('SHA-256', buf)) === want.sha256) ok = buf;
        else if (attempt === 3) throw Object.assign(new Error('bad'), { bad: true });
      }
      parts.push(ok); done += want.groesse; progress(i + 1, entry.teile.length, done, total);
    }
    const url = URL.createObjectURL(new Blob(parts, { type: 'video/mp4' }));
    blobs.set(id, url);
    return url;
  }

  // Eigene Gestaltung, damit die Datei in V3 und in Pro gleich aussieht (Farben aus den Themen der App).
  function style() {
    if (document.getElementById('pbFilmeStil')) return;
    const st = document.createElement('style'); st.id = 'pbFilmeStil';
    st.textContent = '.pb-filme{width:min(960px,96vw);max-width:96vw}.pb-filme h2{margin:0 0 8px;font-size:1.05rem}'
      + '.pb-filme-wahl{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}.pb-filme-wahl [aria-pressed=true]{border-color:var(--acc,#2b62c4);color:var(--acc,#2b62c4);font-weight:600}'
      + '.pb-filme-buehne{position:relative;width:100%;aspect-ratio:16/9;max-height:62vh;background:#000;border-radius:10px;overflow:hidden;display:grid;place-items:center}'
      + '.pb-filme-buehne video,.pb-filme-buehne iframe{width:100%;height:100%;border:0;display:block;background:#000}'
      + '.pb-filme-balken{height:6px;border-radius:3px;background:var(--line,#ddd);overflow:hidden;margin:8px 0 0}.pb-filme-balken>i{display:block;height:100%;width:0;background:var(--acc,#2b62c4);transition:width .2s}'
      + '.pb-filme-status{min-height:1.2em;margin:6px 0 0}.pb-filme .btnrow{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}.pb-filme .pb-filme-wahl{justify-content:flex-start}';
    document.head.append(st);
  }
  function svg(cls) {
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', cls); s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    const p = document.createElementNS(NS, 'path'); p.setAttribute('d', ICON); s.append(p); return s;
  }
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  function dialog() {
    style();
    const d = make('dialog', 'live-dialog pb-filme'); d.setAttribute('aria-labelledby', 'pbFilmeTitel');
    const h = make('h2', null, t('title')); h.id = 'pbFilmeTitel';
    const pick = make('div', 'btnrow pb-filme-wahl');
    const stage = make('div', 'pb-filme-buehne');
    const status = make('p', 'hint pb-filme-status'); status.setAttribute('role', 'status');
    const bar = make('div', 'pb-filme-balken'); const fillEl = make('i'); bar.append(fillEl); bar.hidden = true;
    const actions = make('div', 'btnrow');
    const dl = make('button', 'ghost', t('download')); dl.type = 'button'; dl.dataset.filmeLaden = '1';
    const ext = make('button', 'ghost', t('browser')); ext.type = 'button'; ext.dataset.filmeBrowser = '1'; if (sameOrigin) { ext.hidden = true; ext.style.display = 'none'; }
    const close = make('button', 'primary', t('close')); close.type = 'button';
    actions.append(dl, ext, close);
    d.append(h, pick, stage, bar, status, make('p', 'hint', t('note')), actions);
    let current = FILME[0].id, ctrl = null;
    const offline = navigator.onLine === false;
    const stop = () => { ctrl?.abort(); ctrl = null; stage.querySelectorAll('video').forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); }); stage.replaceChildren(); };
    async function show(id, start) {
      current = id; stop(); bar.hidden = true;
      pick.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.film === id)));
      if (offline) { status.textContent = t('offline'); return; }
      if (sameOrigin) {   // Browserfassung: der erprobte Spieler der Videoseite streamt (Service Worker der Videoseite)
        const f = make('iframe', 'pb-filme-rahmen'); f.title = t(FILME.find(x => x.id === id).key);
        f.allow = 'fullscreen; autoplay'; f.allowFullscreen = true; f.src = playUrl(id) + (start ? '&start=1' : '');
        stage.append(f); status.textContent = ''; return;
      }
      if (!start) { status.textContent = ''; const b = make('button', 'primary pb-filme-start', '▶ ' + t('play')); b.type = 'button'; b.onclick = () => show(id, true); stage.append(b); return; }
      ctrl = new AbortController(); const my = ctrl;
      status.textContent = t('loading'); bar.hidden = false; fillEl.style.width = '0%';
      try {
        const url = await fetchFilm(id, my.signal, (i, n, a, b) => { if (my !== ctrl) return; fillEl.style.width = (100 * a / b).toFixed(1) + '%'; status.textContent = fill(t('part'), { i, n, a: mb(a), b: mb(b) }); });
        if (my !== ctrl) return;
        const v = make('video'); v.controls = true; v.playsInline = true; v.src = url; v.dataset.filmeVideo = id;
        stage.append(v); bar.hidden = true; status.textContent = t('ready'); v.play().catch(() => {});
      } catch (e) {
        if (my !== ctrl || e?.name === 'AbortError') return;
        bar.hidden = true; status.textContent = e?.bad ? t('bad') : fill(t('failed'), { e: e?.message || e });
      }
    }
    for (const f of FILME) {
      const b = make('button', 'ghost', t(f.key)); b.type = 'button'; b.dataset.film = f.id;
      list().then(l => { const e = l.videos?.find(v => v.id === f.id); if (e) { b.textContent = t(f.key) + ' · ' + Math.floor(e.dauer / 60) + ':' + String(Math.round(e.dauer % 60)).padStart(2, '0'); dl.dataset[f.key] = mb(e.groesse); } }).catch(() => {});
      b.onclick = () => show(f.id, sameOrigin ? false : true);
      pick.append(b);
    }
    dl.onclick = () => { stage.querySelectorAll('video').forEach(v => v.pause()); openExternal(loadUrl(current)); };
    ext.onclick = () => { stage.querySelectorAll('video').forEach(v => v.pause()); openExternal(playUrl(current)); };
    close.onclick = () => d.close();
    d.addEventListener('close', () => { stop(); d.remove(); });
    document.body.append(d); d.showModal(); show(current, false);
    window.__pbFilmeDialog = d;
  }

  function button() {
    const tools = document.querySelector('header .tools'); if (!tools) return;
    let b = document.getElementById('pbFilme');
    if (!b) {
      b = make('button', 'ghost compact-tool pb-filme-knopf'); b.type = 'button'; b.id = 'pbFilme'; b.append(svg('compact-icon'));
      // Neben dem Design-Knopf bzw. dem Zahnrad in der Navigationsleiste; rechts oben schwebt das Siegel.
      const after = document.getElementById('pbLookBtn') || document.querySelector('.workspace-tools [data-tab="settings"], .main-pages [data-tab="settings"]');
      if (after) after.after(b); else tools.prepend(b);
    }
    if (b.dataset.wired) return; b.dataset.wired = '1';
    const label = () => { b.title = t('title'); b.setAttribute('aria-label', t('title')); };
    label(); new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    b.addEventListener('click', dialog);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', button); else button();
  window.PBFilme = { open: dialog, base: BASE };
})();
