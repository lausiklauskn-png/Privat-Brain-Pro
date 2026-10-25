// Build-only: das Anleitungsvideo kommt fest in APK und Windows-App (Klaus 2026-10-25: „in die App reinladen“,
// „Hauptsache, es funktioniert auch auf fremden Rechnern oder Android-Geräten“). Quelle ist Family-Projekt.de-Video;
// jeder Teil und die ganze Datei werden gegen tools/native/film-pins.json geprüft, sonst scheitert der Bau.
// PB_FILM_SOURCE=<Ordner eines Family-Projekt.de-Video-Klons> liest dieselben Teile lokal statt aus dem Netz.
// Die Browserfassung (Pages) nimmt den Ordner filme/ wieder heraus und streamt von der Videoseite.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile, rename, rm} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cache = join(root, '.cache/filme');
const sha = data => createHash('sha256').update(data).digest('hex');
const safe = v => { if (typeof v !== 'string' || !/^[a-z0-9-]+(\.[a-z0-9]+)?$/.test(v)) throw new Error('Invalid film name: ' + v); return v; };

async function source(pins, path) {
  const local = process.env.PB_FILM_SOURCE;
  if (local) return readFile(join(resolve(local), path));
  if (!pins.quelle.startsWith('https://lausiklauskn-png.github.io/')) throw new Error('Unreviewed film source');
  let last;
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(pins.quelle + path, {signal: AbortSignal.timeout(120000)});
      if (!res.ok) throw new Error(path + ' ' + res.status);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) { last = e; await new Promise(r => setTimeout(r, 2000 * 2 ** i)); }
  }
  throw last;
}
async function checked(pins, path, size, hash) {
  const data = await source(pins, path);
  if (data.length !== size || sha(data) !== hash) throw new Error('Film part differs from its pin: ' + path);
  return data;
}
async function cached(name, size, hash, make) {
  const file = join(cache, name);
  try { const d = await readFile(file); if (d.length === size && sha(d) === hash) return d; } catch {}
  const data = await make();
  await mkdir(cache, {recursive: true}); await writeFile(file + '.part', data); await rename(file + '.part', file);
  return data;
}

export async function bundleFilms(out) {
  const pins = JSON.parse(await readFile(join(root, 'tools/native/film-pins.json'), 'utf8'));
  if (pins.version !== 1 || !Array.isArray(pins.filme) || !pins.filme.length) throw new Error('Unreviewed film pins');
  const dir = join(out, 'filme'); await rm(dir, {recursive: true, force: true}); await mkdir(dir, {recursive: true});
  const list = [];
  for (const f of pins.filme) {
    const id = safe(f.id), datei = safe(f.datei);
    if (!/^[a-f0-9]{64}$/.test(f.sha256) || f.teile.reduce((n, t) => n + t.groesse, 0) !== f.groesse) throw new Error('Inconsistent film pin: ' + id);
    const video = await cached(datei, f.groesse, f.sha256, async () => {
      const parts = [];
      for (let i = 0; i < f.teile.length; i++) parts.push(await checked(pins, `videos/${id}/teil-${String(i).padStart(2, '0')}.bin`, f.teile[i].groesse, f.teile[i].sha256));
      const whole = Buffer.concat(parts);
      if (sha(whole) !== f.sha256) throw new Error('Assembled film differs from its pin: ' + id);
      return whole;
    });
    const poster = await cached(id + '.jpg', f.vorschau.groesse, f.vorschau.sha256, () => checked(pins, f.vorschau.pfad, f.vorschau.groesse, f.vorschau.sha256));
    await writeFile(join(dir, datei), video); await writeFile(join(dir, id + '.jpg'), poster);
    list.push({id, video: 'filme/' + datei, poster: 'filme/' + id + '.jpg', type: f.type, dauer: f.dauer, groesse: f.groesse});
  }
  await writeFile(join(dir, 'filme.json'), JSON.stringify({version: 1, filme: list}, null, 2) + '\n');
  return list.length;
}
