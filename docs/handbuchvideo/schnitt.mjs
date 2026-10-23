// Aufnahme → MP4 (wie Workflow PDF): Bilder mit echten Zeitstempeln → 30 fps, Klick-Geräusch an jedem Tipp,
// Musik optional (MUSIK=/pfad.mp3, Klaus sucht sie selbst aus; liegt nie im Repo).
//   [MUSIK=…] node schnitt.mjs probe|quer
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const HIER = path.dirname(fileURLToPath(import.meta.url)), NAME = process.argv[2] || 'probe', ROH = path.join(HIER, '_roh', NAME);
const MUSIK = process.env.MUSIK && fs.existsSync(process.env.MUSIK) ? process.env.MUSIK : null;
const Z = JSON.parse(fs.readFileSync(path.join(ROH, 'zeiten.json'), 'utf8')), b = Z.bilder, t0 = b[0].t;
const dauer = b[b.length - 1].t - t0 + 0.04, liste = [];
b.forEach((x, i) => liste.push(`file '${path.join(ROH, 'bilder', x.datei)}'`, `duration ${Math.max(0.001, i + 1 < b.length ? b[i + 1].t - x.t : 0.04).toFixed(4)}`));
liste.push(`file '${path.join(ROH, 'bilder', b[b.length - 1].datei)}'`); fs.writeFileSync(path.join(ROH, 'liste.txt'), liste.join('\n'));
const RATE = 44100, n = Math.round(RATE * 0.07), pcm = Buffer.alloc(44 + n * 2);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + n * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
pcm.writeUInt32LE(RATE, 24); pcm.writeUInt32LE(RATE * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(n * 2, 40);
let s = 7; const z = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;
for (let i = 0; i < n; i++) { const t = i / RATE; const v = (Math.sin(2 * Math.PI * 1650 * t) * .55 + Math.sin(2 * Math.PI * 820 * t) * .35 + z() * .25 * Math.exp(-t * 400)) * Math.exp(-t * 90); pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 30000), 44 + i * 2); }
const KLICK = path.join(ROH, 'klick.wav'); fs.writeFileSync(KLICK, pcm);
const klicks = (Z.klicks || []).map(k => k - t0).filter(k => k >= 0 && k < dauer);
const eing = ['-f', 'concat', '-safe', '0', '-i', path.join(ROH, 'liste.txt')];
eing.push(...(MUSIK ? ['-stream_loop', '-1', '-i', MUSIK] : ['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo']));
klicks.forEach(() => eing.push('-i', KLICK));
let fil = `[1:a]atrim=0:${dauer.toFixed(3)},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=stereo,volume=${MUSIK ? .75 : 1}${MUSIK ? `,afade=t=in:d=1,afade=t=out:st=${Math.max(0, dauer - 2.5).toFixed(3)}:d=2.5` : ''}[m]`;
const mix = ['[m]']; klicks.forEach((k, i) => { fil += `;[${i + 2}:a]adelay=${Math.round(k * 1000)}|${Math.round(k * 1000)},volume=0.9[k${i}]`; mix.push(`[k${i}]`); });
fil += `;${mix.join('')}amix=inputs=${mix.length}:normalize=0:duration=first[a];[0:v]fps=30,format=yuv420p[v]`;
const aus = path.join(ROH, `pb-erklaer-${NAME}.mp4`);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...eing, '-filter_complex', fil, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-tune', 'animation',
  '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-t', dauer.toFixed(3), aus], { stdio: 'inherit' });
console.log(`${aus}: ${dauer.toFixed(1)} s, ${klicks.length} Klicks, Musik ${MUSIK ? 'ja' : 'nein'}, ${(fs.statSync(aus).size / 1e6).toFixed(1)} MB`);
