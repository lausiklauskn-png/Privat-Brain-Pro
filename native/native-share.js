/* Shared into Private Brain Pro (Klaus 2026-10-21: the app should appear in Android's share list).
   Android hands the files to ProShare, which keeps a private copy. Here they are read in chunks,
   handed to the same import as "Dateien hinzufügen" (signBatch: reading, catalog, checks) and
   then deleted from the native inbox. Nothing goes to the network. */
(() => {
  'use strict';
  const plugin = window.Capacitor?.Plugins?.ProShare;
  if (!plugin) return;
  const FILE_LIMIT = 80 * 1024 * 1024;           // same cap as "Dateien hinzufügen"
  const MAIL = /\.(eml|mbox)$/i;                  // mail exports keep no cap, like the mail import
  const WORDS = {
    de: ['{n} geteilte Datei(en) werden eingelesen …', '{n} geteilte Datei(en) eingelesen.', '{n} Datei(en) waren zu groß (über 80 MB) und wurden nicht übernommen.', 'Eine geteilte Datei kam nicht an. Bitte noch einmal teilen.'],
    en: ['Reading {n} shared file(s) …', '{n} shared file(s) added.', '{n} file(s) were too large (over 80 MB) and were not added.', 'A shared file did not arrive. Please share it again.'],
    ru: ['Читаю {n} полученный(х) файл(ов) …', 'Добавлено файлов: {n}.', 'Файлов слишком большого размера (более 80 МБ): {n}, не добавлены.', 'Файл не получен. Поделитесь им ещё раз.'],
    pl: ['Wczytywanie {n} udostępnionych plików …', 'Dodano udostępnione pliki: {n}.', 'Za duże pliki (ponad 80 MB): {n}, nie dodano.', 'Udostępniony plik nie dotarł. Udostępnij go ponownie.']
  };
  const say = (i, n) => (WORDS[document.documentElement.lang] || WORDS.de)[i].replace('{n}', String(n));
  const note = message => { if (typeof window.toast === 'function') window.toast(message, 4200); };
  const ready = () => typeof window.signBatch === 'function' && window.PBWorkspace;

  function bytes(base64) { const raw = atob(base64), out = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i); return out; }

  async function readItem(item) {
    const parts = []; let offset = 0;
    for (;;) {
      const { data } = await plugin.read({ id: item.id, offset });
      if (!data) break;
      const chunk = bytes(data); parts.push(chunk); offset += chunk.length;
      if (offset > item.size) throw new Error('size');
    }
    if (offset !== item.size) throw new Error('size');
    return new File(parts, item.name, { type: item.mime || 'application/octet-stream', lastModified: Date.now() });
  }

  let running = false, again = false;
  async function waitForImport() {
    // signBatch deliberately ignores a second concurrent call. Keep the
    // native inbox until that call can actually accept the selected files.
    while (typeof signing !== 'undefined' && signing) await new Promise(resolve => setTimeout(resolve, 120));
  }
  async function collect() {
    if (running) { again = true; return; }
    running = true;
    try {
      do {
        again = false;
        await waitForImport();
        const { items = [], refused = 0 } = await plugin.pending();
        let missing = refused;
        if (!items.length) { if (missing) note(say(3, missing)); continue; }
        const take = items.filter(i => i.size <= FILE_LIMIT || MAIL.test(i.name)), tooBig = items.length - take.length;
        const entries = [];
        if (take.length) note(say(0, take.length));
        for (const item of take) {
          try { entries.push({ file: await readItem(item), path: item.name, dirId: null }); }
          catch { missing++; }
        }
        if (entries.length) {
          await waitForImport();
          window.PBWorkspace.navigate?.('intake');
          await window.signBatch(entries);
        }
        // Without a problem the import's own "Fertig · …" message stays. With one, a closing message
        // carries every notice (a toast replaces the previous one, so separate ones would be lost).
        const parts = [];
        if (entries.length && (tooBig || missing)) parts.push(say(1, entries.length));
        if (tooBig) parts.push(say(2, tooBig));
        if (missing) parts.push(say(3, missing));
        if (parts.length) note(parts.join(' '));
        for (const item of items) await plugin.done({ id: item.id }).catch(() => {});
      } while (again);
    } finally { running = false; }
  }

  plugin.addListener?.('shared', () => { if (ready()) collect(); });
  const start = () => { if (ready()) collect(); else setTimeout(start, 300); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
  window.PBShare = { collect };
})();
