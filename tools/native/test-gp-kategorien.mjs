// Generalprüfung 16.11.2026, Dateien/Kategorien: (3) Kachel und Liste zählen gleich; (4) eine zweite Kategorie wechselt,
// statt die Liste zu leeren; (5) Esc klappt die Leiste unter „+ Neuer Ordner“ zu. Gebautes www/, gestellte Brücke.
import { start, ok, total } from './_gp-harness.mjs';
const h = await start();
try {
  const page = await h.open({ width: 1100, height: 900 });
  await page.waitForFunction(() => window.PBWorkspace && window.PBSuchFrage && typeof db !== 'undefined' && db && typeof idbPut === 'function');
  await page.evaluate(async () => {
    const now = Date.now(), day = 864e5;
    const add = async (name, category, extra = {}) => {
      const toks = tokens(name);
      const r = { hash: await sha256(new TextEncoder().encode(name).buffer), name, path: 'Unterlagen/' + name, type: 'application/pdf', ext: 'pdf', date: now - day, size: 21000, snippet: name, summary: '', vector: buildVector(toks), tf: termFreq(toks), category, dirId: null, nameTokens: tokens(name), dupes: [], tags: [], ...extra };
      await idbPut('catalog', r); CATALOG.push(r); HASHSET.add(r.hash);
    };
    for (let i = 1; i <= 4; i++) await add('Rechnung-' + i + '.pdf', 'Rechnung', i <= 2 ? { eigeneKategorie: 'Strom' } : {});
    await add('Mietvertrag.pdf', 'Vertrag', { eigeneKategorie: 'Versicherung' }); await add('Handyvertrag.pdf', 'Vertrag');
    // Eine Mail mit der alten Kategorie „E-Mail“, die der Sortier-Kern sicher als Rechnung einordnet (der gemeldete Fall).
    await add('Ihre Rechnung im Anhang.eml', 'E-Mail', { type: 'message/rfc822', ext: 'eml', mail: { from: 'Stadtwerke <service@stadtwerke.example>', subject: 'Ihre Rechnung im Anhang', date: new Date(now - day).toISOString() }, kern: { art: 'Rechnung', artSicher: true, absender: 'Stadtwerke' } });
    window.gpAdd = add;
    await add('Notiz.txt', 'Dokument', { type: 'text/plain', ext: 'txt' });
    rebuildIndex(); refreshAll();
  });
  const rows = () => page.evaluate(() => [...document.querySelectorAll('#explorerFiles .explorer-row')].map(r => r.querySelector('.explorer-name,.fname,strong')?.textContent || r.textContent).length);
  const chips = () => page.evaluate(() => [...document.querySelectorAll('#explorerChips .explorer-chip')].map(c => c.textContent.replace(/\s*×$/, '')));
  const tree = name => page.evaluate(n => { const b = [...document.querySelectorAll('#explorerTree [data-category]')].find(b => decodeURIComponent(b.dataset.category) === 'category:' + n); return b ? { text: b.textContent.trim(), current: b.getAttribute('aria-current') } : null; }, name);

  // 3 · eine Zählweise
  await page.locator('.main-pages [data-tab="order"]').click();
  await page.waitForSelector('#groups [data-overview-path^="category:"]');
  const tile = await page.evaluate(() => { const b = [...document.querySelectorAll('#groups [data-overview-path]')].find(b => decodeURIComponent(b.dataset.overviewPath) === 'category:Rechnung'); return b ? b.children[1].textContent : ''; });
  const tileCount = Number((tile.match(/\d+/) || [])[0]);
  await page.evaluate(() => [...document.querySelectorAll('#groups [data-overview-path]')].find(b => decodeURIComponent(b.dataset.overviewPath) === 'category:Rechnung').click());
  await page.waitForFunction(() => document.getElementById('panel-explorer').classList.contains('on') && document.querySelector('#explorerChips .explorer-chip'));
  ok(`Der gemeldete Fall (4 Rechnungen + 1 Rechnungs-Mail): Kachel und Liste zeigen dieselbe Zahl (Kachel ${tileCount}, Liste ${await rows()})`, tileCount === await rows() && tileCount === 5);
  // Alte Kategorie „Rechnung“, der Kern sagt sicher etwas anderes: darf weder aus der Zahl noch aus der Liste fallen.
  await page.evaluate(async () => { await window.gpAdd('Mahnung-Altfall.pdf', 'Rechnung', { kern: { art: 'Mahnung', artSicher: true } }); rebuildIndex(); refreshAll(); });
  await page.waitForTimeout(300);
  const listed = await rows(), left = await tree('Rechnung');
  ok(`Mit einer Datei „alte Kategorie Rechnung, Kern sagt Mahnung“ dazu: links und Liste zählen sie beide mit (Liste ${listed})`, listed === 6);
  ok(`Links steht dieselbe Zahl und der Eintrag ist markiert (${left?.text})`, left?.text.endsWith('(' + listed + ')') && left.current === 'location');
  ok('In der Liste stehen die Mail, die der Sortier-Kern als Rechnung einordnet, und die Datei mit alter Kategorie „Rechnung“', await page.evaluate(() => { const t = document.getElementById('explorerFiles').textContent; return t.includes('Ihre Rechnung im Anhang') && t.includes('Mahnung-Altfall'); }));
  for (const name of ['Vertrag', 'E-Mail', 'Dokument']) {
    await page.evaluate(n => [...document.querySelectorAll('#explorerTree [data-category]')].find(b => decodeURIComponent(b.dataset.category) === 'category:' + n).click(), name);
    const l = await tree(name), n = await rows();
    ok(`„${name}“: Zahl links und Liste stimmen überein (${l.text}, Liste ${n})`, l.text.endsWith('(' + n + ')') && n > 0);
  }

  // 4 · zweite Kategorie wechselt
  await page.evaluate(() => document.querySelector('#explorerTree [data-category="category:E-Mail"]').click());
  ok('Erste Kategorie „E-Mail“: ein Kästchen, eine Zeile', (await chips()).join('|') === 'E-Mail' && await rows() === 1);
  await page.evaluate(() => document.querySelector('#explorerTree [data-category="category:Vertrag"]').click());
  ok('Zweite Kategorie „Vertrag“ angetippt: das Kästchen wechselt, die Liste zeigt die zwei Verträge (nicht leer)', (await chips()).join('|') === 'Vertrag' && await rows() === 2 && !(await page.locator('#explorerFiles .explorer-empty').count()));
  ok('Links ist nur noch „Vertrag“ markiert', (await tree('Vertrag')).current === 'location' && (await tree('E-Mail')).current === 'false');
  await page.evaluate(() => document.querySelector('#explorerTree [data-eigene-kategorie="Strom"]')?.click());
  ok('Eine eigene Kategorie dazu bleibt kombinierbar (Vertrag + Strom: zwei Kästchen)', (await chips()).join('|') === 'Vertrag|Strom');
  await page.evaluate(() => document.querySelector('#explorerChips .explorer-chip[data-feld="gruppe"]')?.click());
  ok('× nimmt ein Kästchen weiter einzeln weg; „Strom“ zeigt seine zwei Dateien', (await chips()).join('|') === 'Strom' && await rows() === 2);
  await page.evaluate(() => document.querySelector('#explorerTree [data-eigene-kategorie="Versicherung"]').click());
  ok('Zweite eigene Kategorie „Versicherung“ angetippt: wechselt, eine Zeile (nicht leer)', (await chips()).join('|') === 'Versicherung' && await rows() === 1);
  await page.evaluate(() => document.querySelector('#explorerTree [data-category="category:Rechnung"]').click());
  ok('Kategorie und eigene Kategorie zusammen ohne Treffer: „Ohne …“ bietet beide Wege an', (await chips()).join('|') === 'Versicherung|Rechnung' && await rows() === 0 && await page.locator('#explorerFiles .explorer-without button').count() === 2);
  await page.evaluate(() => [...document.querySelectorAll('#explorerFiles .explorer-without button')].find(b => b.textContent.includes('Rechnung'))?.click());
  ok('„Ohne Rechnung“ nimmt das Kategorie-Kästchen weg', (await chips()).join('|') === 'Versicherung' && await rows() === 1);
  await page.fill('#explorerFilter', 'Mietvertrag'); await page.dispatchEvent('#explorerFilter', 'input'); await page.waitForTimeout(300);
  ok('Ein Suchwort lässt sich mit dem Kästchen kombinieren', await rows() === 1);
  await page.fill('#explorerFilter', ''); await page.dispatchEvent('#explorerFilter', 'input');

  // 5 · Esc klappt „+ Neuer Ordner“ zu
  await page.locator('.main-pages [data-tab="order"]').click();
  await page.locator('#reorgTile').click();
  ok('„+ Neuer Ordner“ klappt die Leiste auf', await page.evaluate(() => !document.getElementById('reorgNote').hidden && document.getElementById('reorgTile').getAttribute('aria-expanded') === 'true'));
  await page.focus('#reorgScheme'); await page.keyboard.press('Escape');
  ok('Esc im Feld „Schema“ klappt die Leiste zu, der Fokus steht wieder auf der Kachel', await page.evaluate(() => document.getElementById('reorgNote').hidden && document.getElementById('reorgTile').getAttribute('aria-expanded') === 'false' && document.activeElement?.id === 'reorgTile'));
  await page.keyboard.press('Enter');
  ok('Die Kachel klappt danach wieder auf (Enter)', await page.evaluate(() => !document.getElementById('reorgNote').hidden));
  await page.keyboard.press('Escape');
  ok('Esc auf der Kachel selbst klappt ebenfalls zu; die Seite Kategorien bleibt offen', await page.evaluate(() => document.getElementById('reorgNote').hidden && document.getElementById('panel-order').classList.contains('on')));
  ok('Keine Skriptfehler: ' + h.errors.join(' | '), h.errors.length === 0);
  console.log(`Generalprüfung Dateien/Kategorien: ${total()} bestanden`);
} finally { await h.stop(); }
