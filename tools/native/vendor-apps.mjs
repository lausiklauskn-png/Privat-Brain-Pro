// Copies Klaus' tools unchanged into apps/<dir>/ from local clones (default /home/user/lausiklauskn-png/<dir>, or
// APPS_SRC=/path). Records the source commit and a SHA-256 of every file in apps/SOURCES.json, so a later copy can be
// compared and nothing is changed by hand here. Usage: node tools/native/vendor-apps.mjs [dir …]
import { cp, mkdir, readFile, rm, writeFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const config = JSON.parse(await readFile(join(root, 'tools/native/apps.json'), 'utf8'));
const want = process.argv.slice(2);
const sourcesPath = join(root, 'apps/SOURCES.json');
let sources = {}; try { sources = JSON.parse(await readFile(sourcesPath, 'utf8')); } catch { /* first run */ }
async function walk(dir) { const out = []; for (const e of await readdir(dir, { withFileTypes: true })) { const p = join(dir, e.name); if (e.isDirectory()) out.push(...await walk(p)); else out.push(p); } return out; }
for (const app of config.apps) {
  if (want.length && !want.includes(app.dir)) continue;
  const src = join(process.env.APPS_SRC || '/home/user/lausiklauskn-png', app.dir), dest = join(root, 'apps', app.dir);
  const commit = execFileSync('git', ['-C', src, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  await rm(dest, { recursive: true, force: true }); await mkdir(dest, { recursive: true });
  for (const f of app.files) { await mkdir(join(dest, f, '..'), { recursive: true }); await cp(join(src, f), join(dest, f), { recursive: true }); }
  const files = {};
  for (const p of (await walk(dest)).sort()) files[relative(dest, p)] = createHash('sha256').update(await readFile(p)).digest('hex');
  sources[app.dir] = { repo: app.repo, commit, files: Object.keys(files).length, sha256: files };
  console.log(`${app.dir}: ${Object.keys(files).length} files from ${app.repo} @ ${commit.slice(0, 7)}`);
}
await writeFile(sourcesPath, JSON.stringify(sources, null, 1) + '\n');
