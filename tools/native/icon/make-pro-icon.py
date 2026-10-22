#!/usr/bin/env python3
"""Private Brain Pro – Icon-Vorschlag im Stil von Workflow PDF Pro.

Baut aus dem vorhandenen 3D-Motiv (artwork/private-brain-pro-light.png) einen
1024er Master: vollflächig, ohne gezeichneten Rahmen, außen grau, zur Mitte ein
heller, weicher Verlauf (Profil am Workflow-PDF-Pro-Icon gemessen).

Nur Python 3 + numpy + Pillow. Liest die Quellbilder, schreibt nur in OUT.
    python3 -I make-icon.py [--edge "#a3a6ad"] [--out DIR]
"""
import argparse, math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

PB_SRC = '/home/user/Privat-Brain-Pro/artwork/private-brain-pro-light.png'
PB_CUR512 = '/home/user/Privat-Brain-Pro/icon-512.png'
WF_SRC = '/home/user/workflow-pdf-pro/android/app/src/main/res/drawable-nodpi/workflow_pro_icon.png'
WF_BG = '#E0231B'          # @color/workflow_icon_background
PB_CUR_BG = '#faf6f0'      # @color/pro_icon_background (heute)

ap = argparse.ArgumentParser()
ap.add_argument('--out', default=os.path.dirname(os.path.abspath(__file__)))
ap.add_argument('--edge', default='#a3a6ad', help='Grau am Rand (außen)')
ap.add_argument('--center', default='#fdf9f3', help='Helle Mitte (= heutiger Elfenbein-Grund des Motivs)')
ap.add_argument('--t0', type=float, default=0.38, help='Verlauf beginnt (Anteil der halben Kante)')
ap.add_argument('--t1', type=float, default=0.90, help='Verlauf endet (Anteil der halben Kante)')
ap.add_argument('--motif-r', type=float, default=0.87, help='äußerster Motivpunkt (Anteil der halben Kante)')
ap.add_argument('--suffix', default='')
A = ap.parse_args()
OUT = A.out
os.makedirs(OUT, exist_ok=True)
SS = 2048                  # Arbeitsauflösung = 2x Master (Supersampling)


def hexrgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float64) / 255


def to_lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


def f_img(a):                      # float-Kanal -> PIL 'F'
    return Image.fromarray(a.astype(np.float32), 'F')


def resize_f(arr, size, box=None):  # Lanczos je Kanal in float
    if arr.ndim == 2:
        return np.asarray(f_img(arr).resize(size, Image.LANCZOS, box=box), np.float64)
    return np.dstack([resize_f(arr[..., i], size, box) for i in range(arr.shape[2])])


def quantize(srgb, seed=1):         # Dither ±0,5 LSB gegen Stufen im Verlauf
    rng = np.random.default_rng(seed)
    q = np.floor(np.clip(srgb, 0, 1) * 255 + rng.random(srgb.shape))
    return np.clip(q, 0, 255).astype(np.uint8)


def blur_f(a, sigma):              # Gauß in float (FFT, Rand gespiegelt)
    pad = int(4 * sigma) + 1
    if a.ndim == 3: return np.dstack([blur_f(a[..., i], sigma) for i in range(a.shape[2])])
    p = np.pad(a, pad, mode='reflect')
    k = np.fft.fftfreq(p.shape[0])[:, None] ** 2 + np.fft.fftfreq(p.shape[1])[None, :] ** 2
    out = np.real(np.fft.ifft2(np.fft.fft2(p) * np.exp(-2 * (math.pi * sigma) ** 2 * k)))
    return out[pad:-pad, pad:-pad]


def blur(mask, r):
    im = Image.fromarray(np.clip(mask * 255 + 0.5, 0, 255).astype(np.uint8), 'L')
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r)), np.float64) / 255


# ---------------------------------------------------------------- Quelle lesen
src8 = np.asarray(Image.open(PB_SRC).convert('RGB'), np.float64) / 255
H = src8.shape[0]; assert src8.shape[:2] == (H, H)
lum = src8 @ [0.2126, 0.7152, 0.0722]
c0 = (H - 1) / 2


def inner_edge(line):
    """Von außen nach innen: Ende des Chromrahmens = erstes Pixel, ab dem 6 Pixel hell bleiben."""
    seen_dark = False
    for i in range(len(line) - 6):
        if line[i] < 0.8: seen_dark = True
        if seen_dark and (line[i:i + 6] > 0.88).all(): return i
    raise SystemExit('Rahmenkante nicht gefunden')


mid = int(round(c0))
sides = [inner_edge(lum[mid, :]), inner_edge(lum[mid, ::-1]), inner_edge(lum[:, mid]), inner_edge(lum[::-1, mid])]
inset = float(np.mean(sides))
diag = float(np.mean([inner_edge(np.diag(lum)), inner_edge(np.diag(lum[::-1, ::-1]))]))
radius = (diag - inset) / (1 - 1 / math.sqrt(2))
print(f'Rahmen innen: Abstand {sides} -> {inset:.1f} px, Diagonale {diag:.1f} px, Eckradius {radius:.1f} px (von {H})')

yy, xx = np.mgrid[0:H, 0:H].astype(np.float64)
half = c0 - inset
qx = np.abs(xx - c0) - (half - radius); qy = np.abs(yy - c0) - (half - radius)
sd = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - radius
dist = -sd                                         # >0 innen, Abstand zur Rahmen-Innenkante

# Hintergrund des Motivs als Funktion des Randabstands (Innenschatten des alten Rahmens)
DMAX = 160
bins = np.clip(np.round(dist).astype(int), -1, DMAX)
prof = np.zeros((DMAX + 1, 3))
for k in range(DMAX + 1):
    sel = bins == k
    prof[k] = np.median(src8[sel], axis=0) if sel.any() else prof[k - 1]
core_bg = np.median(prof[110:DMAX], axis=0)     # ringförmig gemessen, das Motiv in der Mitte stört so nicht
prof[-1] = core_bg
kern = np.ones(9) / 9
prof_s = np.stack([np.convolve(np.pad(prof[:, i], 4, mode='edge'), kern, 'valid') for i in range(3)], 1)
print('Grund innen (Elfenbein):', '#%02x%02x%02x' % tuple(np.round(core_bg * 255).astype(int)),
      '| Innenschatten am Rahmen:', '#%02x%02x%02x' % tuple(np.round(prof_s[2] * 255).astype(int)))
B = prof_s[np.clip(bins, 0, DMAX)]
B[dist > DMAX] = core_bg

# --------------------------------------------- Motiv-Maske (Kugeln, Linien, Glühen)
Bl = B @ [0.2126, 0.7152, 0.0722]
dark = np.clip(1 - lum / np.maximum(Bl, 1e-6), 0, 1)
chroma = np.clip((src8.max(2) - src8.min(2)) - (B.max(2) - B.min(2)), 0, 1)
a_dark = smoothstep(0.30, 0.55, dark)
a_chr = smoothstep(0.06, 0.20, chroma)
inside = smoothstep(30, 55, dist)                   # alter Rahmen + Innenschatten nie Motiv
core = np.maximum(a_dark, a_chr) * inside
# Löcher (Glanzlichter in den Kugeln) füllen: von außen fluten
bin_im = Image.fromarray(np.where(core > 0.5, 255, 0).astype(np.uint8), 'L').copy()  # copy: sonst schreibgeschützter Puffer, floodfill wirkt nicht
ImageDraw.floodfill(bin_im, (0, 0), 128)
filled_im = Image.fromarray(np.where(np.asarray(bin_im) != 128, 255, 0).astype(np.uint8), 'L')
# 1 px einziehen: die weiche Kante liegt dann auf der Kugel, nicht im alten Elfenbein-Grund (kein Lichthof)
filled = np.asarray(filled_im.filter(ImageFilter.MinFilter(3)), np.float64) / 255
# helle Linienkerne sitzen zwischen violettem Glühen: Farbmaske leicht erweitern
chr_dil = np.asarray(Image.fromarray((a_chr * inside * 255).astype(np.uint8), 'L').filter(ImageFilter.MaxFilter(7)), np.float64) / 255
alpha = np.maximum.reduce([core, blur(filled, 1.2), blur(chr_dil, 2.5) * inside])
alpha = np.clip(alpha, 0, 1)

# Weiches (Schatten): multiplikativ übertragen, im linearen Licht
I_lin = to_lin(src8)
M = I_lin / np.maximum(to_lin(B), 1e-6)
M = np.clip(M, 0, 1.25)
# alte Rahmenzone weich ausblenden (breit, damit weder Rahmen-Geist noch harte Schattenkante bleibt)
M = 1 + (M - 1) * smoothstep(4, 120, dist)[..., None]
alpha *= inside
# Körnung des alten Elfenbein-Grunds nicht auf das neue Grau übertragen: abseits des Motivs M leicht glätten
near = np.clip(blur_f(alpha, 4), 0, 1)[..., None]
M = blur_f(M, 2.0) * (1 - near) + M * near
if os.environ.get('DEBUG'):
    for nm, a in (('core', core), ('filled', filled), ('adark', a_dark), ('achr', a_chr)):
        Image.fromarray((np.clip(a,0,1) * 255).astype(np.uint8), 'L').resize((600, 600)).save(os.path.join(OUT, 'work', nm + '.png'))
    Image.fromarray((alpha * 255).astype(np.uint8), 'L').save(os.path.join(OUT, 'work', 'alpha.png'))

# Größe: äußerster Motivpunkt wie beim W-Floh (gemessen ≈ 0,87 der halben Kante)
ys, xs = np.nonzero(alpha > 0.5)
r_src = float(np.max(np.hypot(xs - c0, ys - c0)))
scale = (A.motif_r * SS / 2) / r_src
print(f'Motiv: äußerster Punkt {r_src:.0f} px vom Mittelpunkt -> Skalierung {scale:.4f} (Arbeitsbild {SS})')


def place(arr, fill):
    """Quelle zentriert in SSxSS, Maßstab scale; außerhalb = fill."""
    P = 8                                           # Rand aus fill, damit Lanczos am Rand nichts erfindet
    pad = np.empty((H + 2 * P, H + 2 * P) + arr.shape[2:]); pad[...] = fill
    pad[P:P + H, P:P + H] = arr
    size = int(round((H + 2 * P) * scale))
    res = resize_f(pad, (size, size))
    outa = np.empty((SS, SS) + arr.shape[2:]); outa[...] = fill
    o = (SS - size) // 2
    s0 = max(0, -o); d0 = max(0, o); L = min(size - s0, SS - d0)
    outa[d0:d0 + L, d0:d0 + L] = res[s0:s0 + L, s0:s0 + L]
    return outa


I_t = place(I_lin, 0)
M_t = np.clip(place(M, 1), 0, 1.25)
a_t = np.clip(place(alpha, 0), 0, 1)

# ---------------------------------------------------- Hintergrund wie Workflow PDF Pro
g = (np.arange(SS) + 0.5) / SS * 2 - 1
gx, gy = np.meshgrid(g, g)
r = np.hypot(gx, gy)
t = smoothstep(A.t0, A.t1, r)[..., None]
N = to_lin(hexrgb(A.center)) * (1 - t) + to_lin(hexrgb(A.edge)) * t   # Mischung im linearen Licht
out_lin = a_t[..., None] * I_t + (1 - a_t[..., None]) * N * M_t
master_ss = to_srgb(out_lin)                        # 2048, float sRGB


def export(arr_ss, size, name, seed=1):
    img = resize_f(arr_ss, (size, size)) if size != arr_ss.shape[0] else arr_ss
    Image.fromarray(quantize(img, seed), 'RGB').save(os.path.join(OUT, name), optimize=True)
    return img


sfx = A.suffix
master = export(master_ss, 1024, f'master-1024{sfx}.png')
for s in (512, 192, 96, 48):
    export(master_ss, s, f'preview-{s}{sfx}.png')
# Android: Vordergrund-Bitmap für drawable-nodpi (wie workflow_pro_icon.png) + Hintergrundfarbe
print('Android-Hintergrundfarbe (Rand):', A.edge)

# ------------------------------------------------------------- Masken-Vorschau
VIEW = 512                                         # 72dp-Fenster, wie der Launcher es zeigt


def adaptive(img_srgb, bg_hex, inset):
    """108dp-Ebene: Hintergrundfarbe + Bitmap mit inset; zurück: mittlere 72dp, 4x gerechnet."""
    layer = int(VIEW * 108 / 72) * 2                # 1536 (2x)
    canvas = np.empty((layer, layer, 3)); canvas[...] = hexrgb(bg_hex)
    bm = int(round(layer * (1 - 2 * inset)))
    sm = resize_f(img_srgb, (bm, bm))
    o = (layer - bm) // 2
    canvas[o:o + bm, o:o + bm] = sm
    v0 = (layer - VIEW * 2) // 2
    return canvas[v0:v0 + VIEW * 2, v0:v0 + VIEW * 2]


def mask(kind, n):
    g = (np.arange(n) + 0.5) / n * 2 - 1
    X, Y = np.meshgrid(g, g)
    if kind == 'circle': m = np.hypot(X, Y) <= 1
    elif kind == 'squircle': m = np.abs(X) ** 4.5 + np.abs(Y) ** 4.5 <= 1
    else:                                           # Rundquadrat, Radius 22 %
        R = 0.44; q = np.maximum(np.abs(np.stack([X, Y])) - (1 - R), 0)
        m = np.hypot(q[0], q[1]) <= R
    return m.astype(np.float64)


def masked(view2x, kind, bg=(1, 1, 1)):
    n = view2x.shape[0] * 2                         # Maske 4x, dann verkleinern = glatte Kante
    m = resize_f(mask(kind, n), (VIEW, VIEW))[..., None]
    v = resize_f(view2x, (VIEW, VIEW))
    return v * m + np.array(bg) * (1 - m)


def load_srgb(p, bg=None):
    im = Image.open(p)
    if im.mode in ('RGBA', 'LA') and bg is not None:
        base = Image.new('RGBA', im.size, bg); base.alpha_composite(im.convert('RGBA')); im = base
    return np.asarray(im.convert('RGB'), np.float64) / 255


new_view = adaptive(master_ss, A.edge, 0.13)
for kind in ('circle', 'squircle', 'roundrect'):
    Image.fromarray(quantize(masked(new_view, kind, (0.93, 0.94, 0.95))), 'RGB').save(
        os.path.join(OUT, f'adaptive-{kind}{sfx}.png'), optimize=True)

# ------------------------------------------------------------------ Vergleich
cur_src = load_srgb(PB_SRC); cur512 = load_srgb(PB_CUR512, PB_CUR_BG)
wf_src = load_srgb(WF_SRC)
cur_view = adaptive(cur512, PB_CUR_BG, 0.18)       # heutiges ic_launcher.xml: inset 18 %
wf_view = adaptive(wf_src, WF_BG, 0.13)            # workflow_launcher_foreground.xml: inset 13 %
cells = [[resize_f(cur_src, (VIEW, VIEW)), resize_f(master_ss, (VIEW, VIEW)), resize_f(wf_src, (VIEW, VIEW))],
         [masked(cur_view, 'circle', (0.93, 0.94, 0.95)), masked(new_view, 'circle', (0.93, 0.94, 0.95)),
          masked(wf_view, 'circle', (0.93, 0.94, 0.95))],
         [masked(cur_view, 'squircle', (0.93, 0.94, 0.95)), masked(new_view, 'squircle', (0.93, 0.94, 0.95)),
          masked(wf_view, 'squircle', (0.93, 0.94, 0.95))]]
pad, head = 24, 56
Wc = 3 * VIEW + 4 * pad
Hc = head + 3 * VIEW + 4 * pad + 3 * 30
sheet = Image.new('RGB', (Wc, Hc), (237, 239, 242))
dr = ImageDraw.Draw(sheet)
try:
    fb = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26)
    fr = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 20)
except OSError:
    fb = fr = ImageFont.load_default()
titles = ['Private Brain Pro heute', 'Vorschlag (neu)', 'Workflow PDF Pro (Vorbild)']
rows = ['Bilddatei (quadratisch)', 'Android-Launcher, Kreis', 'Android-Launcher, Squircle']
for j, tt in enumerate(titles):
    dr.text((pad + j * (VIEW + pad) + VIEW / 2, head / 2 + 6), tt, fill=(30, 32, 38), font=fb, anchor='mm')
y = head
for i, row in enumerate(cells):
    dr.text((pad, y + 6), rows[i], fill=(90, 94, 102), font=fr)
    y += 30
    for j, cell in enumerate(row):
        sheet.paste(Image.fromarray(quantize(cell), 'RGB'), (pad + j * (VIEW + pad), y))
    y += VIEW + pad
sheet.save(os.path.join(OUT, f'compare{sfx}.png'), optimize=True)

# kleine Größen nebeneinander (Pixelprüfung)
strip = Image.new('RGB', (1024 + 512 + 192 + 96 + 48 + 6 * 16, 1024 + 32), (237, 239, 242))
x = 16
for s in (1024, 512, 192, 96, 48):
    strip.paste(Image.open(os.path.join(OUT, f'master-1024{sfx}.png' if s == 1024 else f'preview-{s}{sfx}.png')), (x, 16))
    x += s + 16
strip.save(os.path.join(OUT, f'sizes{sfx}.png'), optimize=True)

# Verlauf auf Stufen prüfen: größter Sprung zwischen Nachbarpixeln im reinen Hintergrund
m8 = np.asarray(Image.open(os.path.join(OUT, f'master-1024{sfx}.png')), np.int16)
col = m8[40:200, 500:524, :].mean(1)               # oben Mitte: Verlauf ohne Motiv, 24 px breit gemittelt
step = np.abs(np.diff(col, axis=0)).max()
print(f'Verlauf oben Mitte (Zeile 40-200): größter Schritt {step:.2f} Stufen je Pixel (glatt < 1)')
print('fertig:', OUT)
