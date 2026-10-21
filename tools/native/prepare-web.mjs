import { adaptRecovery } from './adapt-recovery.mjs';
import { cp, mkdir, readFile, rm, writeFile, lstat, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
const out = join(root, 'www');
// Explicit public inputs: never package the checkout, services, credentials or caches.
const inputs = ['assets', 'modules', 'models', 'sbkim/spore.json', 'icon-192.png', 'icon-512.png',
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
const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' https: wss:; worker-src 'self' blob:; media-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'";
html = html.replace('<head>', `<head>\n<meta http-equiv="Content-Security-Policy" content="${csp}">\n<script src="native-network.js"></script>\n<script src="native-seal-place.js"></script>`);
html = html.replace('</head>', '<link rel="stylesheet" href="native.css">\n</head>');
html = adaptRecovery(html);
html = html.replace('</body>', '<script src="native-recovery.js"></script>\n<script src="native-originals.js"></script>\n<script src="native-folders.js"></script>\n<script src="native-vault.js"></script>\n<script src="native-protect.js"></script>\n<script src="native-categories.js"></script>\n<script src="native-mycel.js"></script>\n<script src="native-mail-expiry.js"></script>\n<script src="native-unsubscribe.js"></script>\n<script src="native-mail-index.js"></script>\n<script src="native-pdf.js"></script>\n<script src="native-speech.js"></script>\n<script src="native-share.js"></script>\n<script src="native-navigation.js"></script>\n<script src="native.js"></script>\n<script src="native-toolbar.js"></script>\n</body>');
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
for (const name of ['native-recovery.js', 'native.js', 'native-network.js', 'native-toolbar.js', 'native-originals.js', 'native-folders.js', 'native-vault.js', 'native-protect.js', 'native-navigation.js', 'native-pdf.js', 'native.css', 'native-mail.js', 'native-mail-view.js', 'native-mail-folders.js', 'native-categories.js', 'native-mycel.js', 'native-seal-place.js', 'native-mail-expiry.js', 'native-unsubscribe.js', 'native-mail-index.js', 'native-speech.js', 'native-share.js']) await cp(join(root, 'native', name), join(out, name));
await cp(join(root, 'node_modules/@capacitor/core/LICENSE'), join(out, 'CAPACITOR-LICENSE'));
console.log('Native web bundle prepared from explicit public inputs.');
