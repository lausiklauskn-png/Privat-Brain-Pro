// Update-Fähnchen (Klaus 2026-11-13): erscheint von selbst neben der Versionsnummer, sobald ein Update bereitsteht.
// Geprüft gegen das gebaute www/ mit gestellter Brücke (ProDevice, ProUpdates, ProNetwork) – kein echter Netzabruf.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright-core';
const root = resolve('www');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.json':'application/json', '.woff2':'font/woff2', '.svg':'image/svg+xml' };
const server = createServer(async (req, res) => {
  const path = resolve(root, '.' + new URL(req.url, 'http://local').pathname.replace(/\/$/, '/index.html'));
  if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try { const body = await readFile(path); res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
let browser, count = 0;
function ok(name, value) { assert.ok(value, name); console.log('✓ ' + name); count++; }
const HOUR = 60 * 60 * 1000;
try {
  ok('The packaged app script is the source file', (await readFile('native/native.js')).equals(await readFile(root + '/native.js')) && (await readFile('native/native.css')).equals(await readFile(root + '/native.css')));
  browser = await chromium.launch({ executablePath: process.env.CB_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const url = `http://127.0.0.1:${server.address().port}/`;
  const errors = [];
  // mode: what the native check answers; offline: the app's internet switch; width: viewport.
  async function open({ mode = 'current', offline = false, version = '1.0.50', width = 1000, lang = '' } = {}) {
    const context = await browser.newContext({ viewport: { width, height: 760 } });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', r => r.request().url().startsWith(url) ? r.continue() : r.abort());
    await page.addInitScript(([mode, offline, version, lang]) => {
      if (lang) try { localStorage.setItem('pb_lang', lang); } catch { /* default language */ }
      window.updateCalls = 0; window.downloadCalls = 0; window.updateMode = mode; window.netOffline = offline;
      window.Capacitor = { Plugins: {
        ProDevice: { async getInfo() { return { versionName: '1.0.49', platform: 'android', nativeMail: false }; } },
        ProNetwork: { async getState() { return { offline: window.netOffline }; }, async setOffline({ offline }) { window.netOffline = offline; return { offline }; } },
        ProUpdates: {
          async check() {
            window.updateCalls++;
            if (window.netOffline) { const e = new Error('offline'); e.code = 'APP_OFFLINE'; throw e; }
            if (window.updateMode === 'error') throw new Error('no network');
            return window.updateMode === 'available' ? { status: 'available', version } : { status: window.updateMode, version: '1.0.49' };
          },
          async openDownload() { window.downloadCalls++; }
        }
      } };
    }, [mode, offline, version, lang]);
    await page.goto(url);
    await page.waitForSelector('#native-update-check', { state: 'attached' });
    await page.waitForFunction(() => window.PBUpdateFahne && document.getElementById('pbVersion'));
    await page.evaluate(() => window.PBNetwork.initialized);
    await page.waitForTimeout(250);
    return page;
  }
  const flag = page => page.evaluate(() => { const f = document.getElementById('pbUpdateFahne'); return f ? { text: f.textContent, title: f.title, next: document.getElementById('pbVersion').nextElementSibling === f, tag: f.tagName } : null; });
  const calls = page => page.evaluate(() => window.updateCalls);

  // 1 · gleiche Fassung: still geprüft, kein Fähnchen, keine Meldung
  let page = await open({ mode: 'current' });
  ok('Same version: one silent check at start', await calls(page) === 1);
  ok('Same version: no flag next to v1.0.49', await flag(page) === null && (await page.locator('#pbVersion').textContent()) === 'v1.0.49');
  ok('Same version: the silent check leaves the settings notice untouched and opens nothing', await page.evaluate(() => document.querySelector('.native-updates p').textContent.includes('GitHub') && document.getElementById('native-update-download').hidden && window.downloadCalls === 0));
  // höchstens stündlich
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(150);
  ok('Returning to the app within the hour does not check again', await calls(page) === 1);
  await page.evaluate(() => { window.updateMode = 'available'; });
  await page.evaluate(h => window.PBUpdateFahne.pruefen(Date.now() + h - 60000), HOUR);
  ok('59 minutes later: still no new check', await calls(page) === 1 && await flag(page) === null);
  await page.evaluate(h => window.PBUpdateFahne.pruefen(Date.now() + h + 1000), HOUR);
  ok('After an hour the next check runs and the flag appears without a tap', await calls(page) === 2 && (await flag(page))?.text === 'Update 1.0.50');
  await page.context().close();

  // 2 · neuere Fassung beim Start
  page = await open({ mode: 'available' });
  const f = await flag(page);
  ok('Newer version: flag "Update 1.0.50" directly after the version number, as a button', f && f.text === 'Update 1.0.50' && f.next && f.tag === 'BUTTON' && f.title.includes('1.0.50'));
  ok('Newer version: nothing is downloaded or opened by itself', await page.evaluate(() => window.downloadCalls === 0 && document.getElementById('native-update-download').hidden));
  ok('The flag is flat and readable (no shadow, no emoji, at most 24px high)', await page.locator('#pbUpdateFahne').evaluate(e => { const c = getComputedStyle(e), r = e.getBoundingClientRect(); return c.boxShadow === 'none' && r.height <= 24 && r.width > 0 && !/\p{Extended_Pictographic}/u.test(e.textContent + e.title) && c.color !== c.backgroundColor; }));
  await page.locator('#pbUpdateFahne').click();
  await page.locator('#native-update-download').waitFor({ state: 'visible' });
  ok('Tap on the flag opens the existing update path: settings with the new version and the download button', await page.locator('.native-updates').textContent().then(t => t.includes('1.0.50') && t.includes('1.0.49')) && await page.evaluate(() => document.activeElement?.id === 'native-update-download' && window.downloadCalls === 0));
  await page.locator('#native-update-download').click();
  ok('The download button calls the checked native target once', await page.evaluate(() => window.downloadCalls === 1));
  await page.evaluate(() => { window.updateMode = 'current'; });
  await page.locator('#native-update-check').click();
  await page.waitForFunction(() => !document.getElementById('native-update-check').disabled);
  ok('After a check that reports the current version the flag is gone', await flag(page) === null);
  await page.context().close();

  // 3 · Internetschalter „getrennt“: kein Abruf, kein Fähnchen, keine Meldung
  page = await open({ mode: 'available', offline: true });
  ok('Internet switch off: no update request leaves the app at start', await calls(page) === 0);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.evaluate(h => window.PBUpdateFahne.pruefen(Date.now() + 2 * h), HOUR);
  ok('Internet switch off: none on return or after hours either, no flag, no notice', await calls(page) === 0 && await flag(page) === null && await page.evaluate(() => document.querySelector('.native-updates p').textContent.includes('GitHub')));
  await page.evaluate(() => window.PBNetwork.setOffline(false));
  await page.evaluate(() => window.PBUpdateFahne.pruefen());
  ok('Internet allowed again: the next silent check shows the flag', await calls(page) === 1 && (await flag(page))?.text === 'Update 1.0.50');
  await page.context().close();

  // 4 · ohne Netz / Fehler: still
  page = await open({ mode: 'error' });
  ok('No network: the failed silent check shows no flag and no message', await calls(page) === 1 && await flag(page) === null && await page.evaluate(() => document.querySelector('.native-updates p').textContent.includes('GitHub')));
  await page.evaluate(() => { window.updateMode = 'available'; });
  await page.evaluate(() => window.PBUpdateFahne.pruefen(Date.now() + 60000));
  ok('After a failure the next try waits five minutes', await calls(page) === 1);
  await page.evaluate(() => window.PBUpdateFahne.pruefen(Date.now() + 6 * 60000));
  ok('… and then finds the update', await calls(page) === 2 && (await flag(page))?.text === 'Update 1.0.50');
  await page.evaluate(() => { window.updateMode = 'error'; });
  await page.evaluate(h => window.PBUpdateFahne.pruefen(Date.now() + 3 * h), HOUR);
  ok('A later failure keeps the known flag and stays silent', await calls(page) === 3 && (await flag(page))?.text === 'Update 1.0.50');
  await page.context().close();

  // 5 · Entwicklungsfassung
  page = await open({ mode: 'unsupported' });
  ok('Development build (unsupported): no flag', await flag(page) === null);
  await page.context().close();

  // 6 · Sprachen und schmale Breite
  page = await open({ mode: 'available', width: 320 });
  for (const [lang, word] of [['en', 'Update available'], ['ru', 'Доступно обновление'], ['pl', 'Dostępna aktualizacja'], ['de', 'Update verfügbar']]) {
    await page.evaluate(l => { document.documentElement.lang = l; }, lang);
    await page.waitForFunction(w => document.getElementById('pbUpdateFahne')?.title.includes(w), word);
    ok(`${lang}: the flag is translated`, (await flag(page)).title.includes('1.0.50'));
  }
  ok('320px: name, version and flag stay inside the window', await page.evaluate(() => { const r = document.getElementById('pbUpdateFahne').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && document.documentElement.scrollWidth <= innerWidth; }));
  await page.context().close();
  ok('No runtime errors' + (errors.length ? ': ' + errors.join(' | ') : ''), errors.length === 0);
} finally { await browser?.close(); await new Promise(r => server.close(r)); }
console.log(`${count} update flag checks passed`);
