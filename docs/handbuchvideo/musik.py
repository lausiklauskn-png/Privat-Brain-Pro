# Musik für das Handbuchvideo, passend zur Videolänge D (Sekunden):
#   handbuch-mix.wav       „Inspiring“ (Anfang, baut sich auf) → fließend in „City Travel“ (endet mit dem Video)
#   handbuch-uplifting.wav „Corporate Uplifting“ allein, Ende auf das Videoende gelegt
# Beide Mix-Titel sind auf 123,5 BPM und A-Dur gebracht (insp-a.wav, city-a.wav), die Schläge liegen übereinander.
import sys, numpy as np, librosa, soundfile as sf
D = float(sys.argv[1]); SR = 48000
rms = lambda x: np.sqrt((x ** 2).mean())
ramp = lambda t, t0, t1, up: (np.sin if up else np.cos)(np.clip((t - t0) / (t1 - t0), 0, 1) * np.pi / 2)
# ── Mix ──
A, _ = sf.read('insp-a.wav'); C, _ = sf.read('city-a.wav')
A *= .25 / rms(A[int(60 * SR):int(110 * SR)]); C *= .25 / rms(C[int(30 * SR):int(80 * SR)])
lc = len(C) / SR
sr = 22050; hop = 64; fps = sr / hop
a, _ = librosa.load('insp-a.wav', sr=sr); c, _ = librosa.load('city-a.wav', sr=sr)
oa = librosa.onset.onset_strength(y=a, sr=sr, hop_length=hop); oc = librosa.onset.onset_strength(y=c, sr=sr, hop_length=hop)
base = D - lc + .4
# Übergang dort, wo „Inspiring“ noch voll ist (bis ~113 s); liegt das Ende von City später, beginnt City entsprechend später
x0 = min(base + 14, 112)   # Mitte des gemeinsamen Teils
best = (-9, base)
for o in np.arange(base - .6, base + .6, 1 / fps):
    Aa = oa[int((x0 - 6) * fps):int((x0 + 5) * fps)]; Cc = oc[max(0, int((x0 - 6 - o) * fps)):int((x0 + 5 - o) * fps)]
    n = min(len(Aa), len(Cc));
    if n < 50: continue
    Aa = Aa[:n] - Aa[:n].mean(); Cc = Cc[:n] - Cc[:n].mean(); k = float(Aa @ Cc / (np.linalg.norm(Aa) * np.linalg.norm(Cc) + 1e-9))
    if k > best[0]: best = (k, o)
k, o = best
N = int((D + 1) * SR); out = np.zeros((N, 2))
ta = np.arange(len(A)) / SR; fa = ramp(ta, x0 - 7, x0 + 6, False); na = min(len(A), N); out[:na] += A[:na] * fa[:na, None]
i0 = int(o * SR); tc = np.arange(len(C)) / SR + o; fc = ramp(tc, o, o + 15, True)
if i0 < 0: C = C[-i0:]; fc = fc[-i0:]; i0 = 0
nc = min(len(C), N - i0); out[i0:i0 + nc] += C[:nc] * fc[:nc, None]
pk = np.abs(out).max(); out *= (.95 / pk if pk > .95 else 1)
sf.write('handbuch-mix.wav', out[:int(D * SR)], SR)
print(f'Mix: City ab {o:.2f} s, Übergang um {x0:.1f} s, Schlag-Deckung {k:.2f}')
# ── Corporate Uplifting allein ──
U, _ = sf.read('uplifting.wav'); lu = len(U) / SR; TAKT = 2.244
if D <= lu - .5:
    start = lu - D - .3; U2 = U[int(start * SR):]
    print(f'Uplifting: ab {start:.1f} s, endet mit dem Video')
else:
    extra = int(np.ceil((D - lu + .5) / TAKT)); L = extra * TAKT   # ganze Takte aus der Mitte wiederholen
    s0 = 60.0; f = int(.25 * SR); xf = np.sin(np.linspace(0, np.pi / 2, f))[:, None]
    def naht(x, y): return np.concatenate([x[:-f], x[-f:] * np.cos(np.arcsin(xf)) + y[:f] * xf, y[f:]])   # gleich laute Überblendung
    e = int((s0 + L) * SR)
    U2 = naht(naht(U[:e + f], U[int(s0 * SR):e + f]), U[e:])   # Takte s0…s0+L zweimal, beide Nähte weich
    print(f'Uplifting: {extra} Takte ab {s0:.0f} s wiederholt')
sf.write('handbuch-uplifting.wav', U2[:int(D * SR)], SR)
