// Gemeinsamer Aufbau der Generalprüfungs-Proben: gebautes www/, gestellte Brücke, kein Netz.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright-core';
const root = resolve('www');
const types = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.png':'image/png', '.json':'application/json', '.woff2':'font/woff2', '.svg':'image/svg+xml', '.wasm':'application/wasm' };
export async function start() {
  const server = createServer(async (req, res) => {
    const path = resolve(root, '.' + new URL(req.url, 'http://local').pathname.replace(/\/$/, '/index.html'));
    if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    try { const body = await readFile(path); res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' }).end(body); }
    catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ executablePath: process.env.CB_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const url = `http://127.0.0.1:${server.address().port}/`;
  const errors = [];
  // update: Version, die die gestellte Updateprüfung meldet ('' = aktuell); themen: Einstellungen nach Themen wie am Gerät.
  async function open({ width = 1000, height = 760, lang = '', update = '', themen = false, touch = false, scale = 1, vault = null, storage = {} } = {}) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, deviceScaleFactor: scale });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', r => r.request().url().startsWith(url) ? r.continue() : r.abort());
    await page.addInitScript(([lang, update, themen, vault, storage]) => {
      try {
        if (lang) localStorage.setItem('pb_lang', lang);
        if (themen) localStorage.setItem('pb_einstellungen_themen', 'an');
        for (const [k, v] of Object.entries(storage)) localStorage.setItem(k, v);
      } catch { /* defaults */ }
      window.vaultCalls = [];
      const plugins = {
        ProDevice: { async getInfo() { return { versionName: '1.0.53', platform: 'android', nativeMail: false }; } },
        ProNetwork: { async getState() { return { offline: false }; }, async setOffline({ offline }) { return { offline }; } },
        ProUpdates: { async check() { return update ? { status: 'available', version: update } : { status: 'current', version: '1.0.53' }; }, async openDownload() {}, async install() { return { gestartet: true }; } }
      };
      if (vault) plugins.ProVault = new Proxy({}, { get(_, name) { return async args => { window.vaultCalls.push(String(name)); if (name === 'state') return vault; if (name === 'diagnose') return { fall: 'ok' }; if (name === 'tresorZustand') return { gewaehlt: false }; return {}; }; } });
      window.Capacitor = { Plugins: plugins };
    }, [lang, update, themen, vault, storage]);
    await page.goto(url);
    await page.waitForFunction(() => document.getElementById('pbVersion') && document.querySelector('.native-toolbar-row .main-pages'));
    await page.waitForTimeout(400);
    return page;
  }
  return { open, errors, url, async stop() { await browser.close(); server.close(); } };
}
let count = 0, red = 0;
// GP_WEITER=1: nach einem roten Punkt weiterlaufen und am Ende zählen (für „vorher rot“ und die Gegenproben).
export function ok(name, value) {
  if (!value) { console.error('✗ ' + name); red++; if (!process.env.GP_WEITER) throw new Error(name); return; }
  console.log('✓ ' + name); count++;
}
export const total = () => { if (red) { console.error(red + ' ROT'); process.exitCode = 1; } return count; };
