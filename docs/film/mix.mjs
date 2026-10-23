// Sound for the film: Family Projekt music (0→45 s, then again from 7.5 s, cut on the beat) and synthesised effects
// at the moments the film itself reports (toene.json). Then frames + sound → MP4.
// node mix.mjs [--ziel=private-brain-pro-film.mp4]
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join,resolve} from 'node:path';
const here=resolve(new URL('.',import.meta.url).pathname);
const arg=n=>{const a=process.argv.find(x=>x.startsWith('--'+n+'='));return a?a.split('=')[1]:null;};
const DAUER=105,SR=48000,N=DAUER*SR;
import {readdirSync} from 'node:fs';
// the film was photographed in parts; every part reports its sound marks, merged here without duplicates
const T={};for(const f of readdirSync(here).filter(f=>/^toene(-[\d.]+)?\.json$/.test(f))){const o=JSON.parse(readFileSync(join(here,f),'utf8'));for(const k in o)T[k]=[...new Set([...(T[k]||[]),...o[k]])].sort((a,b)=>a-b);}
const L=new Float32Array(N),R=new Float32Array(N);
let seed=7;const rnd=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296*2-1;
const add=(t,dur,fn,vol=1,pan=0)=>{const s0=Math.round(t*SR),n=Math.round(dur*SR);for(let i=0;i<n&&s0+i<N;i++){if(s0+i<0)continue;const v=fn(i/SR,i/n)*vol;L[s0+i]+=v*(1-pan)*.5*2;R[s0+i]+=v*(1+pan)*.5*2;}};
// whoosh: filtered noise swelling in and out
let lp=0;const whoosh=(t,vol)=>{lp=0;add(t-.45,.9,(x,u)=>{const n=rnd();lp+= (n-lp)*(.05+.25*Math.sin(Math.PI*u));return lp*Math.sin(Math.PI*u)**2;},vol);};
for(const t of T.whoosh)whoosh(t,.55);
// tick when a piece locks in: short bright click with a soft body, alternating sides
let k=0;for(const t of T.tick){const f=1800+((k*373)%900);add(t,.06,(x,u)=>Math.sin(2*Math.PI*f*x)*Math.exp(-70*x)*.6+Math.sin(2*Math.PI*420*x)*Math.exp(-40*x)*.3,.16,(k++%2?.4:-.4));}
// zack: deep hit + bright shimmer
for(const t of T.zack){add(t,.6,(x)=>Math.sin(2*Math.PI*(55+40*Math.exp(-8*x))*x)*Math.exp(-6*x),1.0);add(t,.9,(x)=>rnd()*Math.exp(-5*x)*.25+Math.sin(2*Math.PI*3200*x)*Math.exp(-9*x)*.15,.7);}
// scan beam, stamp, pops, taps
for(const t of T.strahl)add(t,2.0,(x,u)=>.25*Math.sin(2*Math.PI*(300+500*x)*x)*(.6+.4*Math.sin(2*Math.PI*12*x))*Math.sin(Math.PI*u),.5);
for(const t of T.stempel)add(t,.4,(x)=>Math.sin(2*Math.PI*70*x)*Math.exp(-9*x)+rnd()*Math.exp(-60*x)*.4,1.2);
for(const t of T.plopp)add(t,.25,(x)=>.6*Math.sin(2*Math.PI*(600+900*x)*x)*Math.exp(-18*x),.5);
for(const t of T.tipp)add(t,.08,(x)=>Math.sin(2*Math.PI*2400*x)*Math.exp(-90*x),.6);
// write effects as 16-bit wav
const buf=Buffer.alloc(44+N*4);buf.write('RIFF',0);buf.writeUInt32LE(36+N*4,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(2,22);buf.writeUInt32LE(SR,24);buf.writeUInt32LE(SR*4,28);buf.writeUInt16LE(4,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(N*4,40);
for(let i=0;i<N;i++){buf.writeInt16LE(Math.max(-32767,Math.min(32767,Math.round(L[i]*32767*.8))),44+i*4);buf.writeInt16LE(Math.max(-32767,Math.min(32767,Math.round(R[i]*32767*.8))),46+i*4);}
writeFileSync(join(here,'effekte.wav'),buf);
// DJ mix (Klaus 2026-10-23): Family Projekt (F major, 128 BPM) carries the film; "Risk" from the security film (E major,
// 117.5 BPM) is lifted one semitone and sped up to 128, "Friends" from the Workflow PDF film (C major, 112.3 BPM) is
// sped up to 128 (C is a neighbour key of F). Cross-fades over two bars; Family Projekt footage stays on its own music.
const musik=join(here,'fp','musik.m4a'),risk=join(here,'musik','neu-befehle-quer.wav'),friends=join(here,'musik','workfloh-pdf-quer.wav');
const ziel=join(here,arg('ziel')||'private-brain-pro-film.mp4');
const RISK=128/117.5,FRI=128/112.3,SEMI=Math.pow(2,1/12);
const seg=(inp,name,src0,src1,film0,opts)=>{const {tempo=1,pitch=1,fin=0,fout=0,gain=1,hp=0}=opts||{};const len=(src1-src0)/tempo;
  let f=`[${inp}:a]atrim=${src0}:${src1},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo`;
  if(tempo!==1||pitch!==1)f+=`,rubberband=tempo=${tempo.toFixed(5)}:pitch=${pitch.toFixed(5)}`;
  f+=`,volume=${gain}`;if(fin)f+=`,afade=t=in:d=${fin}`;if(fout)f+=`,afade=t=out:st=${(len-fout).toFixed(3)}:d=${fout}`;
  f+=`,adelay=${Math.round(film0*1000)}|${Math.round(film0*1000)}[${name}]`;return f;};
const filter=[
  seg(1,'a',0,37.6,0,{fout:1.0}),
  seg(3,'b',8.0-1.0*RISK,8.0+22.0*RISK,36.6,{tempo:RISK,pitch:SEMI,fin:1.0,fout:1.0,gain:0.58}),
  seg(5,'c',21.5,37.9,59.0,{fin:0.6,fout:1.0}),
  seg(4,'d',87.5-0.6*FRI,87.5+15.0*FRI,74.4,{tempo:FRI,fin:0.6,fout:1.0,gain:1.35}),
  seg(6,'e',51.5,67.5,89.0,{fin:0.6,fout:2.0}),
  `[a][b][c][d][e]amix=inputs=5:normalize=0:duration=longest,volume=0.85[mu]`,
  `[2:a]volume=1.0[fx]`,
  `[mu][fx]amix=inputs=2:normalize=0:duration=first,atrim=0:${DAUER},alimiter=limit=0.92[ton]`];
if(arg('nur-ton')){execFileSync('ffmpeg',['-y','-loglevel','error','-i',musik,'-i',musik,'-i',join(here,'effekte.wav'),'-i',risk,'-i',friends,'-i',musik,'-i',musik,'-filter_complex',filter.join(';'),'-map','[ton]','-c:a','aac','-b:a','192k','-t',String(DAUER),join(here,'ton-probe.m4a')],{stdio:'inherit'});console.log('Ton fertig');process.exit(0);}
execFileSync('ffmpeg',['-y','-loglevel','error','-framerate','30','-i',join(here,'_roh','b%05d.jpg'),'-i',musik,'-i',join(here,'effekte.wav'),'-i',risk,'-i',friends,'-i',musik,'-i',musik,
  '-filter_complex',filter.join(';'),'-map','0:v','-map','[ton]','-c:v','libx264','-preset','slow','-crf',arg('crf')||'21','-pix_fmt','yuv420p','-movflags','+faststart',
  '-c:a','aac','-b:a','192k','-t',String(DAUER),ziel],{stdio:'inherit'});
console.log('fertig:',ziel);
