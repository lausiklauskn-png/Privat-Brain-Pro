import { adaptRecovery } from './adapt-recovery.mjs';
import { bundleSemanticModel } from './fetch-semantic-model.mjs';
import { cp, mkdir, readFile, rm, writeFile, lstat, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
const out = join(root, 'www');
// Explicit public inputs: never package the checkout, services, credentials or caches.
const inputs = ['assets', 'modules', 'models', 'vendor', 'sbkim/spore.json', 'icon-192.png', 'icon-512.png',
  'catalog-emblem.png', 'pb-caption.js', 'sicherheit.html', 'impressum.html', 'LICENSE', 'RECHTE.md'];
async function rejectLinks(path) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink()) throw new Error('No symlinks in native web assets');
  if (stat.isDirectory()) for (const entry of await readdir(path)) await rejectLinks(join(path, entry));
}
const files = execFileSync('git', ['ls-files', '-z', '--', ...inputs], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
for (const input of files) await rejectLinks(join(root, input));
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const input of files) {
  await mkdir(join(out, input, '..'), { recursive: true });
  await cp(join(root, input), join(out, input), { recursive: true });
}
let html = await readFile(join(root, 'index.html'), 'utf8');
// Native branding is independent of the unchanged PWA source.
for (const [before, after] of [
  ['<title>Private Brain — nach Bedeutung suchen</title>', '<title>Private Brain Pro — nach Bedeutung suchen</title>'],
  ['<meta name="apple-mobile-web-app-title" content="Private Brain">', '<meta name="apple-mobile-web-app-title" content="Private Brain Pro">'],
  ['<h1>Private Brain</h1>', '<h1>Private Brain Pro</h1>']
]) {
  if (!html.includes(before)) throw new Error('Review native branding after source changes');
  html = html.replace(before, after);
}
const worker = 'if("serviceWorker" in navigator){ try{ await navigator.serviceWorker.register("sw.js"); }catch{} }';
if (!html.includes(worker)) throw new Error('Review native service-worker adaptation after source changes');
html = html.replace(worker, '// Native assets are updated by Android; no service worker.');
html = html.replace(/<script src="assets\/installieren\.js[^>]*><\/script>/, '');
html = html.replace(/<link[^>]*rel="manifest"[^>]*>/g, '');
// Pro has one licensed pin board (Kimboard). Do not start the PWA's second,
// floating board: it has its own pointer handlers and bypasses the tool gate.
// Its module and previously stored data stay unchanged in the source.
const legacyPin = '<script type="module" src="modules/pinnwand-widget.js"></script>';
if (!html.includes(legacyPin)) throw new Error('Review legacy pin board adaptation after source changes');
html = html.replace(legacyPin, '');
const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' https: wss:; worker-src 'self' blob:; media-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'";
html = html.replace('<head>', `<head>\n<meta http-equiv="Content-Security-Policy" content="${csp}">\n<script src="native-network.js"></script>\n<script src="native-semantic.js"></script>\n<script src="native-seal-place.js"></script>`);
const start = 'initEmbedding();  // echtes Bedeutungs-Modell laden';
if (!html.includes(start)) throw new Error('Review native model start after source changes');
// The model starts only through the switch (native-semantic.js): when loaded, checked and not after a crash.
html = html.replace(start, '(window.PBSemantic ? PBSemantic.start(initEmbedding) : initEmbedding());  // Bedeutungs-Modell über den Schalter');
html = html.replace('</head>', '<link rel="stylesheet" href="native.css">\n<link rel="stylesheet" href="design-tokens.css">\n<link rel="stylesheet" href="design-layout.css">\n</head>');
html = adaptRecovery(html);
html = html.replace('</body>', '<script src="native-recovery.js"></script>\n<script src="native-originals.js"></script>\n<script src="native-folders.js"></script>\n<script src="native-vault.js"></script>\n<script src="native-protect.js"></script>\n<script src="native-categories.js"></script>\n<script src="native-mycel.js"></script>\n<script src="native-mail-expiry.js"></script>\n<script src="native-unsubscribe.js"></script>\n<script src="native-mail-index.js"></script>\n<script src="native-mail-ai.js"></script>\n<script src="native-keys.js"></script>\n<script src="native-check.js"></script>\n<script src="native-license.js"></script>\n<script src="native-tools.js"></script>\n<script src="native-pdf.js"></script>\n<script src="native-speech.js"></script>\n<script src="native-share.js"></script>\n<script src="native-navigation.js"></script>\n<script src="native.js"></script>\n<script src="native-theme.js"></script>\n<script src="native-toolbar.js"></script>\n</body>');
if (!html.includes('<script src="assets/live-mail.js')) throw new Error('Review native mail adapter injection after source changes');
html = html.replace(/<script src="assets\/live-mail\.js/, '<script src="native-mail.js"></script>\n<script src="native-mail-view.js"></script>\n<script src="native-mail-folders.js"></script>\n<script src="assets/live-mail.js');
// The app-owned status initializer must accept the native local asset origin.
const statusPath = join(out, 'assets/schutz-init.js');
let statusInit = await readFile(statusPath, 'utf8');
const origins = 'var ALLOWED_ORIGINS = ["https://lausiklauskn-png.github.io"];';
if (!statusInit.includes(origins)) throw new Error('Review native status origin after source changes');
statusInit = statusInit.replace(origins, 'var ALLOWED_ORIGINS = ["https://lausiklauskn-png.github.io", "https://localhost"];');
await writeFile(statusPath, statusInit);
await writeFile(join(out, 'index.html'), html);
// Klaus' tools (tools/native/apps.json): copied unchanged into apps/<dir>/, adjusted here only for the app window.
const apps = JSON.parse(await readFile(join(root, 'tools/native/apps.json'), 'utf8')).apps;
// Tools hand files out as blob: addresses; reading one back must be allowed in their pages.
const toolCsp = csp.replace("connect-src 'self'", "connect-src 'self' blob: data:");
if (toolCsp === csp) throw new Error('Review tool CSP after source changes');
for (const app of apps) {
  const from = join(root, 'apps', app.dir), to = join(out, app.dir);
  await cp(from, to, { recursive: true });
  for (const name of await readdir(to)) {
    if (!name.endsWith('.html')) continue;
    let page = await readFile(join(to, name), 'utf8');
    if (!page.includes('<head>')) throw new Error('Review tool page head: ' + app.dir + '/' + name);
    page = page.replace('<head>', `<head>\n<meta http-equiv="Content-Security-Policy" content="${toolCsp}">\n<script>window.PB_TOOL_ID=${JSON.stringify(app.id)};</script>\n<script src="../tool-gate.js"></script>`);
    page = page.replace(/<link[^>]*rel=["']manifest["'][^>]*>/g, '');
    await writeFile(join(to, name), page);
  }
  // The tools' status initialiser must accept the app's local origin (as for Private Brain Pro above).
  const init = join(to, 'assets/schutz-init.js');
  let text = await readFile(init, 'utf8').catch(() => null);
  if (text !== null) {
    if (!text.includes(origins)) throw new Error('Review tool status origin: ' + app.dir);
    await writeFile(init, text.replace(origins, 'var ALLOWED_ORIGINS = ["https://lausiklauskn-png.github.io", "https://localhost"];'));
  }
  // Module 24 reads PDFs with pdf.js from Workflow PDF's address; in the app the same pdf.js is bundled.
  const ocr = join(to, 'modules/24_ocr_eingabe.js');
  text = await readFile(ocr, 'utf8').catch(() => null);
  if (text !== null && text.includes('/Workflow-PDF/vendor/pdfjs/')) await writeFile(ocr, text.split('/Workflow-PDF/vendor/pdfjs/').join('/vendor/pdfjs/'));
}
for (const name of ['native-recovery.js', 'native.js', 'native-network.js', 'native-toolbar.js', 'native-theme.js', 'design-tokens.css', 'design-layout.css', 'native-originals.js', 'native-folders.js', 'native-vault.js', 'native-protect.js', 'native-navigation.js', 'native-pdf.js', 'native.css', 'native-mail.js', 'native-mail-view.js', 'native-mail-folders.js', 'native-categories.js', 'native-mycel.js', 'native-seal-place.js', 'native-mail-expiry.js', 'native-unsubscribe.js', 'native-mail-index.js', 'native-speech.js', 'native-share.js', 'native-mail-ai.js', 'native-semantic.js', 'native-keys.js', 'native-check.js', 'native-license.js', 'native-tools.js', 'tool-gate.js', 'license-keys.json']) await cp(join(root, 'native', name), join(out, name));
await cp(join(root, 'node_modules/@capacitor/core/LICENSE'), join(out, 'CAPACITOR-LICENSE'));
// Meaning model and transformers.js inside the app (Klaus 2026-10-21), checked against fixed hashes.
await bundleSemanticModel(out);
// The same fixed hashes and sources for loading the model with the switch in the app.
await cp(join(root, 'native/tool-icons'), join(out, 'tool-icons'), { recursive: true });   // own icons of the tools (☰)
await cp(join(root, 'tools/native/semantic-model.json'), join(out, 'semantic-model.json'));
console.log('Native web bundle prepared from explicit public inputs.');
