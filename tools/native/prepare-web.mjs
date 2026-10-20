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
const worker = 'if("serviceWorker" in navigator){ try{ await navigator.serviceWorker.register("sw.js"); }catch{} }';
if (!html.includes(worker)) throw new Error('Review native service-worker adaptation after source changes');
html = html.replace(worker, '// Native assets are updated by Android; no service worker.');
html = html.replace(/<script src="assets\/installieren\.js[^>]*><\/script>/, '');
html = html.replace(/<link[^>]*rel="manifest"[^>]*>/g, '');
const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' https: wss:; worker-src 'self' blob:; media-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'";
html = html.replace('<head>', `<head>\n<meta http-equiv="Content-Security-Policy" content="${csp}">`);
html = html.replace('</head>', '<link rel="stylesheet" href="native.css">\n</head>');
html = html.replace('</body>', '<script src="native-originals.js"></script>\n<script src="native-navigation.js"></script>\n<script src="native.js"></script>\n</body>');
if (!html.includes('<script src="assets/live-mail.js')) throw new Error('Review native mail adapter injection after source changes');
html = html.replace(/<script src="assets\/live-mail\.js/, '<script src="native-mail.js"></script>\n<script src="native-mail-view.js"></script>\n<script src="native-mail-folders.js"></script>\n<script src="assets/live-mail.js');
await writeFile(join(out, 'index.html'), html);
for (const name of ['native.js', 'native-originals.js', 'native-navigation.js', 'native.css', 'native-mail.js', 'native-mail-view.js', 'native-mail-folders.js']) await cp(join(root, 'native', name), join(out, name));
await cp(join(root, 'node_modules/@capacitor/core/LICENSE'), join(out, 'CAPACITOR-LICENSE'));
console.log('Native web bundle prepared from explicit public inputs.');
