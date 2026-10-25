/* 🎬 Filme in der App (Klaus 2026-10-25): „in einem Video-Button, genau wie oben bei Workflow PDF … jeweils in der
   entsprechenden Version von der App“. Ein Knopf in der Kopfleiste öffnet das Anleitungsvideo (Klaus: nur die Erklärung, nicht den Werbefilm, sonst wird es überladen).
   Die Filme liegen auf der Family-Projekt-Videoseite (Family-Projekt.de-Video, je Film EINE Fassung, Teile mit SHA-256):
   - Browserfassung auf github.io: derselbe Ursprung wie die Videoseite → deren Spieler (abspielen.html) streamt im Fenster.
   - App (Android, Windows): das Anleitungsvideo steckt fest in der App (filme/filme.json, beim Bau gegen SHA-256 geprüft);
     Vorschaubild mit großem ▶, Abspielen sofort, auch ohne Internet (Klaus: „Hauptsache, es funktioniert auch auf fremden
     Rechnern oder Android-Geräten“). Fehlt es, werden die Teile von der Videoseite geholt und je Teil geprüft.
   - „Herunterladen“ öffnet die Videoseite mit ?laden= (prüft und speichert die ganze Datei); in der App im Browser.
   Nichts wird vor dem Tipp geladen. Dieselbe Datei steht in Privat-Brain-Pro-V3 und Privat-Brain-Pro. */
(() => {
  'use strict';
  const BASE = window.PB_FILME_BASIS || 'https://lausiklauskn-png.github.io/Family-Projekt.de-Video/';
  const FILME = [
    { id: 'private-brain-pro-handbuch', key: 'handbuch' }
  ];
  const W = {
    de: { button: 'Filme', title: 'Anleitungsvideo: was Private Brain kann', film: 'Werbefilm', handbuch: 'Handbuchvideo',
      play: 'Abspielen', download: 'Herunterladen', close: 'Schließen', loading: 'Film wird geladen und geprüft …',
      part: 'Teil {i} von {n} · {a} von {b}', ready: 'Geprüft. Der Film läuft.', offline: 'Ohne Internet lässt sich der Film nicht laden. Er liegt auf der Family-Projekt-Videoseite und wird nicht auf dem Gerät gespeichert.',
      failed: 'Der Film ließ sich nicht laden: {e}', bad: 'Ein Teil kam beschädigt an. Bitte noch einmal versuchen.', browser: 'Im Browser abspielen',
      note: 'Herunterladen speichert das Video in voller Qualität auf dem Gerät.' },
    en: { button: 'Films', title: 'Manual video: what Private Brain can do', film: 'Promo film', handbuch: 'Manual video',
      play: 'Play', download: 'Download', close: 'Close', loading: 'Loading and checking the film …',
      part: 'Part {i} of {n} · {a} of {b}', ready: 'Checked. The film is playing.', offline: 'Without internet the film cannot load. It lives on the Family-Projekt video page and is not stored on the device.',
      failed: 'The film could not be loaded: {e}', bad: 'A part arrived damaged. Please try again.', browser: 'Play in the browser',
      note: 'Download saves the video in full quality on the device.' },
    ru: { button: 'Фильмы', title: 'Видеоинструкция: что умеет Private Brain', film: 'Рекламный ролик', handbuch: 'Видеоинструкция',
      play: 'Смотреть', download: 'Скачать', close: 'Закрыть', loading: 'Фильм загружается и проверяется …',
      part: 'Часть {i} из {n} · {a} из {b}', ready: 'Проверено. Фильм воспроизводится.', offline: 'Без интернета фильм не загрузится.',
      failed: 'Не удалось загрузить фильм: {e}', bad: 'Часть пришла повреждённой. Попробуйте ещё раз.', browser: 'Смотреть в браузере',
      note: '«Скачать» сохраняет видео в полном качестве на устройстве.' },
    pl: { button: 'Filmy', title: 'Wideo-instrukcja: co potrafi Private Brain', film: 'Film reklamowy', handbuch: 'Wideo-instrukcja',
      play: 'Odtwórz', download: 'Pobierz', close: 'Zamknij', loading: 'Film jest ładowany i sprawdzany …',
      part: 'Część {i} z {n} · {a} z {b}', ready: 'Sprawdzono. Film jest odtwarzany.', offline: 'Bez internetu filmu nie można załadować.',
      failed: 'Nie udało się załadować filmu: {e}', bad: 'Część dotarła uszkodzona. Spróbuj ponownie.', browser: 'Odtwórz w przeglądarce',
      note: '„Pobierz” zapisuje wideo w pełnej jakości na urządzeniu.' }
  };
  const t = k => (W[document.documentElement.lang] || W.de)[k];
  const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);
  const mb = n => (n / 1e6).toLocaleString(document.documentElement.lang || 'de', { maximumFractionDigits: 1 }) + ' MB';
  const ICON = 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18Z M10 8.5v7l6-3.5Z';   // ▶ im Kreis: ein Abspiel-Knopf wie bei Workflow PDF
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
  // Fest eingebaute Filme (nur APK/Windows); in der Browserfassung fehlt filme/ und es bleibt beim Streamen.
  let localPromise = null;
  const local = () => (localPromise ||= fetch('filme/filme.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => new Map((j?.filme || []).map(f => [f.id, f]))).catch(() => new Map()));
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
      + '.pb-filme-poster{all:unset;position:absolute;inset:0;cursor:pointer;display:block}.pb-filme-poster img{width:100%;height:100%;object-fit:contain;display:block}'
      + '.pb-filme-poster .pb-filme-play{position:absolute;left:50%;top:50%;width:84px;height:84px;margin:-42px 0 0 -42px;border-radius:50%;background:rgba(0,0,0,.55);box-shadow:0 0 0 3px rgba(255,255,255,.85);display:grid;place-items:center}'
      + '.pb-filme-poster .pb-filme-play::before{content:"";margin-left:8px;border-style:solid;border-width:18px 0 18px 30px;border-color:transparent transparent transparent #fff}'
      + '.pb-filme-poster:hover .pb-filme-play,.pb-filme-poster:focus-visible .pb-filme-play{background:var(--acc,#2b62c4)}'
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
    let seq = 0;
    async function show(id, start) {
      current = id; stop(); bar.hidden = true; const my0 = ++seq;
      pick.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.film === id)));
      const built = sameOrigin ? null : (await local()).get(id);   // die PWA auf github.io streamt von der Videoseite
      if (my0 !== seq) return;
      if (built) {   // App: eingebautes Video, Vorschaubild mit großem ▶, startet sofort
        status.textContent = '';
        const play = () => { stage.replaceChildren(); const v = make('video'); v.controls = true; v.playsInline = true; v.preload = 'auto'; v.poster = built.poster; v.src = built.video; v.dataset.filmeVideo = id; v.dataset.filmeLokal = '1'; stage.append(v); v.play().catch(() => {}); };
        if (start) return play();
        const b = make('button', 'pb-filme-poster'); b.type = 'button'; b.setAttribute('aria-label', t('play') + ': ' + t(FILME.find(x => x.id === id).key));
        const img = make('img'); img.alt = ''; img.src = built.poster; b.append(img, make('span', 'pb-filme-play')); b.onclick = play; stage.append(b); return;
      }
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
        const again = make('button', 'primary pb-filme-start', '▶ ' + t('play')); again.type = 'button'; again.onclick = () => show(id, true); stage.append(again);   // noch einmal versuchen
      }
    }
    for (const f of FILME) {
      const b = make('button', 'ghost', t(f.key)); b.type = 'button'; b.dataset.film = f.id;
      list().then(l => { const e = l.videos?.find(v => v.id === f.id); if (e) { b.textContent = t(f.key) + ' · ' + Math.floor(e.dauer / 60) + ':' + String(Math.round(e.dauer % 60)).padStart(2, '0'); dl.dataset[f.key] = mb(e.groesse); } }).catch(() => {});
      b.onclick = () => show(f.id, sameOrigin ? false : true);
      pick.append(b);
    }
    if (FILME.length < 2) { pick.hidden = true; pick.style.display = 'none'; }   // ein Film: keine Auswahl
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
