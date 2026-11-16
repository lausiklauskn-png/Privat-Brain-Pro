// Generalprüfung 16.11.2026, Kopfleiste: (1) Hauptleiste – alle sieben Seiten sind im schmalen Fenster erkennbar erreichbar
// (Pfeil auf weicher Kante, Tipp schiebt weiter); (2) das Update-Fähnchen ist am Handy frei antippbar.
// Geprüft gegen das gebaute www/ mit gestellter Brücke.
import { start, ok, total } from './_gp-harness.mjs';
const h = await start();
const PAGES = ['search', 'intake', 'explorer', 'mail', 'dash', 'order', 'dupes'];
try {
  const strip = page => page.evaluate(() => {
    const bar = document.querySelector('.main-pages'), view = bar.getBoundingClientRect();
    const arrow = name => { const a = document.querySelector('.pb-leiste-' + name); if (!a || a.hidden) return null; const r = a.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { left: r.left, right: r.right, width: r.width, height: r.height, hit: !!hit && (hit === a || a.contains(hit)), title: a.title }; };
    return { overflow: bar.scrollWidth - bar.clientWidth, at: bar.scrollLeft, left: view.left, right: view.right, height: document.querySelector('.main-pages .tab').getBoundingClientRect().height,
      links: arrow('links'), rechts: arrow('rechts'), scrollX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      full: [...bar.querySelectorAll('.tab')].filter(t => { const r = t.getBoundingClientRect(); return r.left >= view.left - 1 && r.right <= view.right + 1; }).map(t => t.dataset.tab) };
  });
  for (const width of [320, 360, 412, 600, 800]) {
    const touch = width < 700, page = await h.open({ width, touch });
    let s = await strip(page);
    if (s.overflow <= 2) {
      ok(`${width}px: alle sieben Seiten stehen ganz in der Leiste, kein Pfeil nötig`, s.full.length === 7 && !s.links && !s.rechts);
    } else {
      ok(`${width}px: rechts liegen noch Seiten – dort steht ein antippbarer Pfeil am Ende der Leiste, links keiner`, !!s.rechts && s.rechts.hit && !s.links && Math.abs(s.rechts.right - s.right) <= 1 && s.rechts.width >= 22 && s.rechts.title.length > 5);
      if (!s.rechts) { await page.context().close(); continue; }
      ok(`${width}px: der Pfeil ist so hoch wie die Knöpfe der Leiste und die Seite läuft nicht quer`, Math.abs(s.rechts.height - s.height) <= 1 && s.scrollX <= 0);
      const seen = new Set(s.full); let taps = 0;
      while (s.rechts && taps < 8) {
        const before = s.at;
        if (touch) await page.tap('.pb-leiste-rechts'); else await page.click('.pb-leiste-rechts');
        await page.waitForFunction(b => document.querySelector('.main-pages').scrollLeft > b + 5, before);
        await page.waitForTimeout(450); s = await strip(page); s.full.forEach(t => seen.add(t)); taps++;
      }
      ok(`${width}px: nur mit Tipps auf den Pfeil waren alle sieben Seiten ganz zu sehen (${taps} Tipps)`, PAGES.every(t => seen.has(t)) && taps <= 6);
      ok(`${width}px: am Ende steht rechts kein Pfeil mehr, links führt einer zurück`, !s.rechts && !!s.links && s.links.hit && Math.abs(s.links.left - s.left) <= 1);
      await page.locator('.main-pages [data-tab="dupes"]').click();
      ok(`${width}px: die letzte Seite „Doppelte“ lässt sich danach direkt öffnen`, await page.evaluate(() => document.getElementById('panel-dupes').classList.contains('on')));
      let back = 0;
      while (s.links && back < 8) { const before = s.at; if (touch) await page.tap('.pb-leiste-links'); else await page.click('.pb-leiste-links'); await page.waitForFunction(b => document.querySelector('.main-pages').scrollLeft < b - 5, before); await page.waitForTimeout(450); s = await strip(page); back++; }
      ok(`${width}px: der linke Pfeil führt bis zur ersten Seite zurück`, s.at === 0 && s.full.includes('search') && !!s.rechts);
    }
    await page.context().close();
  }
  // Pfeile sind Zeigehilfen: nicht in der Tab-Reihenfolge, die sieben Reiter bleiben unverändert in der Leiste.
  let page = await h.open({ width: 360, touch: true });
  ok('Die Pfeile stehen außerhalb der Leiste, nicht in der Tab-Reihenfolge, und die Leiste hat weiter genau sieben Reiter', await page.evaluate(() => [...document.querySelectorAll('.pb-leiste-pfeil')].every(a => a.tabIndex === -1 && !a.closest('.main-pages') && a.querySelector('svg')) && document.querySelectorAll('.pb-leiste-pfeil').length === 2 && document.querySelectorAll('.main-pages>.tab').length === 7));
  const titles = { en: 'More pages to the right', ru: 'Ещё страницы справа', pl: 'Więcej stron po prawej' };
  for (const [lang, title] of Object.entries(titles)) {
    await page.evaluate(l => document.querySelector(`[data-lang="${l}"]`)?.click() ?? (document.documentElement.lang = l), lang);
    await page.waitForFunction(t => document.querySelector('.pb-leiste-rechts')?.title === t, title, { timeout: 4000 }).catch(() => {});
    ok(`Der Pfeil ist auf ${lang} beschriftet`, await page.evaluate(t => document.querySelector('.pb-leiste-rechts')?.title === t, title));
  }
  await page.context().close();

  // 2 · Update-Fähnchen frei antippbar
  const fahne = page => page.evaluate(() => {
    const f = document.getElementById('pbUpdateFahne'); if (!f) return null;
    const r = f.getBoundingClientRect(); let free = 0; const cover = new Set();
    for (let i = 0; i < 17; i++) { const e = document.elementFromPoint(r.left + (i + .5) * r.width / 17, r.top + r.height / 2); if (e === f) free++; else cover.add(e?.className || e?.tagName); }
    const head = document.querySelector('header').getBoundingClientRect(), tab = document.querySelector('.main-pages .tab').getBoundingClientRect();
    return { free, cover: [...cover], height: r.height, left: r.left, right: r.right, bottom: r.bottom, text: f.textContent, headBottom: head.bottom, tabTop: tab.top, next: document.getElementById('pbVersion').nextElementSibling === f };
  });
  const heights = {};
  for (const width of [320, 360, 412, 600, 800]) {
    const plain = await h.open({ width, touch: width < 700 });
    heights[width] = await plain.evaluate(() => document.querySelector('.main-pages .tab').getBoundingClientRect().top); await plain.context().close();
    page = await h.open({ width, touch: width < 700, update: '1.0.54' });
    await page.waitForSelector('#pbUpdateFahne');
    const f = await fahne(page);
    ok(`${width}px: das Fähnchen „Update 1.0.54“ ist an allen 17 Messpunkten antippbar (frei: ${f.free}${f.cover.length ? ', verdeckt von ' + f.cover.join('/') : ''})`, f.free === 17 && f.text === 'Update 1.0.54' && f.next);
    ok(`${width}px: das Fähnchen bleibt flach (mindestens 20 px hoch), im Bild, über der Hauptleiste, und verschiebt die Seite nicht`, f.height >= 20 && f.height <= 32 && f.left >= 0 && f.right <= width && f.bottom <= f.tabTop && f.tabTop === heights[width]);
    if (width === 360) {
      await page.tap('#pbUpdateFahne');
      ok('360px: ein Tipp auf das Fähnchen trifft das Fähnchen (nicht Siegel oder Lampe)', await page.evaluate(() => new Promise(r => { let hit = false; const f = document.getElementById('pbUpdateFahne'); f.addEventListener('click', () => { hit = true; }, { once: true }); const b = f.getBoundingClientRect(); document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2).click(); r(hit); })));
    }
    await page.context().close();
  }
  ok('Keine Skriptfehler: ' + h.errors.join(' | '), h.errors.length === 0);
  console.log(`Generalprüfung Kopfleiste: ${total()} bestanden`);
} finally { await h.stop(); }
