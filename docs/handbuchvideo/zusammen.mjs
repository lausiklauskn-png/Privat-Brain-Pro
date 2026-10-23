// Puzzle-Aufbau aus dem Werbefilm (0–22,4 s, mit seinen Effekten, ohne dessen Musik) + Handbuch-Aufnahme.
// Musik optional über das Ganze: MUSIK=/pfad.mp3 node zusammen.mjs
import { execFileSync } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HIER = path.dirname(fileURLToPath(import.meta.url)), FILM = path.join(HIER, '..', 'film');
const INTRO = 22.4, UEB = 0.8, APP = path.join(HIER, '_roh', 'quer', 'pb-erklaer-quer.mp4');
const appDauer = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', APP]).toString();
const dauer = INTRO + appDauer - UEB, MUSIK = process.env.MUSIK && fs.existsSync(process.env.MUSIK) ? process.env.MUSIK : null;
const aus = path.join(HIER, MUSIK ? 'private-brain-pro-handbuch.mp4' : 'private-brain-pro-handbuch-ohne-musik.mp4');
const inp = ['-i', path.join(FILM, 'pb-film-1080p.mp4'), '-i', path.join(FILM, 'effekte.wav'), '-i', APP];
if (MUSIK) inp.push('-stream_loop', '-1', '-i', MUSIK);
let f = `[0:v]trim=0:${INTRO},setpts=PTS-STARTPTS,fps=30,format=yuv420p,settb=1/30[iv];[2:v]fps=30,format=yuv420p,settb=1/30[av];`
  + `[iv][av]xfade=transition=fade:duration=${UEB}:offset=${INTRO - UEB}[v];`
  + `[1:a]atrim=0:${INTRO},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,volume=0.8[ia];`
  + `[2:a]aformat=sample_rates=48000:channel_layouts=stereo[aa];[ia][aa]acrossfade=d=${UEB}[fx]`;
if (MUSIK) f += `;[3:a]atrim=0:${dauer.toFixed(3)},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,volume=0.7,afade=t=in:d=1,afade=t=out:st=${(dauer - 3).toFixed(3)}:d=3[mu];[mu][fx]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.92[a]`;
else f += ';[fx]anull[a]';
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...inp, '-filter_complex', f, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', dauer.toFixed(3), aus], { stdio: 'inherit' });
console.log(`${aus}: ${dauer.toFixed(1)} s, ${(fs.statSync(aus).size / 1e6).toFixed(1)} MB`);
