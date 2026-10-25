// Puzzle-Aufbau aus dem Werbefilm (0–22,4 s, mit seinen Effekten, ohne dessen Musik) + Handbuch-Aufnahme.
// Musik optional über das Ganze: MUSIK=/pfad.mp3 node zusammen.mjs
// Eine Fassung (Klaus 2026-10-25): TON=/pfad/altes-handbuch.mp4 legt die fertige Tonspur des vorigen Handbuchs darunter
// (Musik ♪1 samt Puzzle-Geräuschen des Anfangs); die neuen Tipp-Geräusche kommen dazu. Ist die neue Aufnahme kürzer oder
// länger, wird in der Mitte der Musik ein Stück in ganzen Takten herausgenommen bzw. wiederholt (weich überblendet).
import { execFileSync } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HIER = path.dirname(fileURLToPath(import.meta.url)), FILM = path.join(HIER, '..', 'film');
const HOCH = !!process.env.HOCH, LAGE = HOCH ? 'hoch' : 'quer';
const INTRO = 22.4, UEB = 0.8, APP = path.join(HIER, '_roh', LAGE, `pb-erklaer-${LAGE}.mp4`);
const appDauer = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', APP]).toString();
const dauer = INTRO + appDauer - UEB, MUSIK = process.env.MUSIK && fs.existsSync(process.env.MUSIK) ? process.env.MUSIK : null;
const aus = path.join(HIER, process.env.AUS || (MUSIK ? 'private-brain-pro-handbuch.mp4' : 'private-brain-pro-handbuch-ohne-musik.mp4'));
const FILMVIDEO = process.env.FILMVIDEO || path.join(FILM, 'pb-film-1080p.mp4');
const inp = ['-i', FILMVIDEO, '-i', path.join(FILM, 'effekte.wav'), '-i', APP];
if (MUSIK) inp.push('-stream_loop', '-1', '-i', MUSIK);
let f = (HOCH   // hochkant: der quer gebaute Anfang mittig, darüber und darunter dasselbe Bild weich und dunkler
  ? `[0:v]trim=0:${INTRO},setpts=PTS-STARTPTS,fps=30,split[a][b];[a]scale=-2:1920,crop=1080:1920,boxblur=28:4,eq=brightness=-0.12[bg];[b]scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2,format=yuv420p,settb=1/30[iv];`
  : `[0:v]trim=0:${INTRO},setpts=PTS-STARTPTS,fps=30,format=yuv420p,settb=1/30[iv];`) + `[2:v]fps=30,format=yuv420p,settb=1/30[av];`
  + `[iv][av]xfade=transition=fade:duration=${UEB}:offset=${INTRO - UEB},format=yuv420p[v];`
  + `[1:a]atrim=0:${INTRO},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,volume=0.8[ia];`
  + `[2:a]aformat=sample_rates=48000:channel_layouts=stereo[aa];[ia][aa]acrossfade=d=${UEB}[fx]`;
if (MUSIK) f += `;[3:a]atrim=0:${dauer.toFixed(3)},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,volume=0.7,afade=t=in:d=1,afade=t=out:st=${(dauer - 3).toFixed(3)}:d=3[mu];[mu][fx]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.92[a]`;
else f += ';[fx]anull[a]';
const TON = process.env.TON && fs.existsSync(process.env.TON) ? process.env.TON : null;
if (TON) {
  const alt = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', TON]).toString();
  const TAKT = 60 / 123.5 * 4, X = TAKT, C = +(process.env.SCHNITT || 140);   // Musik ♪1 läuft mit 123,5 BPM; Schnitt in „City Travel“
  const delta = Math.round((alt - dauer) / TAKT) * TAKT;   // >0 kürzen, <0 verlängern (ganze Takte)
  inp.length = 0; inp.push('-i', FILMVIDEO, '-i', TON, '-i', APP);
  f = f.replace(/;\[1:a\][\s\S]*$/, '');   // nur das Bild aus dem Puzzle-Anfang; sein Ton steckt schon in TON
  f += `;[1:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit[t1][t2];[t1]atrim=0:${C},asetpts=PTS-STARTPTS[m1];[t2]atrim=${(C + delta - X).toFixed(3)},asetpts=PTS-STARTPTS[m2];`
    + `[m1][m2]acrossfade=d=${X.toFixed(3)}:c1=tri:c2=tri,atrim=0:${dauer.toFixed(3)},afade=t=out:st=${(dauer - 2.5).toFixed(3)}:d=2.5[mu];`
    + `[2:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${Math.round((INTRO - UEB) * 1000)}|${Math.round((INTRO - UEB) * 1000)},volume=0.9[fx];`
    + `[mu][fx]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.92[a]`;
  console.log(`Tonspur: alt ${alt.toFixed(1)} s, neu ${dauer.toFixed(1)} s, ${delta >= 0 ? 'herausgenommen' : 'wiederholt'} ${Math.abs(delta).toFixed(2)} s ab ${C} s`);
}
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...inp, '-filter_complex', f, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', dauer.toFixed(3), aus], { stdio: 'inherit' });
console.log(`${aus}: ${dauer.toFixed(1)} s, ${(fs.statSync(aus).size / 1e6).toFixed(1)} MB`);
