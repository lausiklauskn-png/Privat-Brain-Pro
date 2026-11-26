#!/usr/bin/env python3
"""Private Brain Pro – dunkles App-Symbol (Klaus 2026-11-26). ERSATZWEG: die gültige Vorlage
artwork/private-brain-pro-dark.png hat Klaus mit ChatGPT neu erzeugen lassen; dieses Skript
überschreibt sie. Nur benutzen, wenn kein neues Bild zur Hand ist.

Regel für alle Pro-Apps: die Pro-Fassung (Android, Windows) trägt einen dunklen
Grund mit Verlauf von der Mitte nach außen, die Basic-Fassung (Web-App) ist hell.
Das 3D-Motiv (Kugeln, Verbindungen, leuchtender Kern) bleibt unverändert; nur der
graue Grund mit seinem weißen Schein wird durch einen dunklen violetten Verlauf
ersetzt, der Schein bleibt als violettes Leuchten erhalten.

    python3 -I tools/native/icon/make-pro-dark.py           # schreibt artwork/private-brain-pro-dark.png
    python3 -I tools/native/icon/make-pro-dark.py --blau    # blauer Verlauf statt violett

Nur Python 3 + numpy + Pillow. Liest artwork/private-brain-pro-grey.png.
"""
import argparse, os
import numpy as np
from PIL import Image, ImageFilter

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.abspath(os.path.join(HIER, '..', '..', '..'))
ap = argparse.ArgumentParser()
ap.add_argument('--blau', action='store_true')
ap.add_argument('--out', default=os.path.join(WURZEL, 'artwork', 'private-brain-pro-dark-umgefaerbt.png'))
A = ap.parse_args()

# Mitte, Zwischenton, Rand; dazu die Farbe, in die der frühere weiße Schein übergeht.
FARBEN = {
    # Klaus 2026-11-26: „in der Mitte heller, damit das besser zur Geltung kommt“
    'violett': (((128, 98, 215), (48, 30, 112), (10, 7, 28)), (190, 160, 255)),
    'blau': (((70, 130, 215), (22, 60, 125), (5, 16, 40)), (170, 200, 255)),
}
(c0, c1, c2), schein = FARBEN['blau' if A.blau else 'violett']

src = np.asarray(Image.open(os.path.join(WURZEL, 'artwork', 'private-brain-pro-grey.png')).convert('RGB')).astype(float) / 255
h, w, _ = src.shape
mx, mn = src.max(2), src.min(2)
satt = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
# Grund = wenig Farbe; Motiv = gesättigt (Kugeln blau/violett, Kern orange).
grund = np.clip(1 - (satt - 0.08) / 0.22, 0, 1)
R, G, B = src[..., 0], src[..., 1], src[..., 2]
orange = (R > 0.6) & (G > 0.3) & (B < 0.45) & (R > B + 0.25)
yy, xx = np.mgrid[0:h, 0:w]
if orange.any():  # der weiß glühende Kern der Mittelkugel ist ungesättigt, gehört aber zum Motiv
    cy, cx = yy[orange].mean(), xx[orange].mean()
    grund[np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) < np.sqrt(orange.sum() / np.pi) * 1.6] = 0
grund = np.asarray(Image.fromarray((grund * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(w / 512))).astype(float) / 255

r = np.sqrt((xx - w / 2) ** 2 + (yy - h / 2) ** 2) / (w / 2 * 1.2)
t = np.clip(r, 0, 1)[..., None]
a, b, c = [np.array(x) / 255 for x in (c0, c1, c2)]
verlauf = np.where(t < 0.55, a + (b - a) * (t / 0.55), b + (c - b) * ((t - 0.55) / 0.45))
hell = src.mean(2)
basis = np.median(hell[: h // 50 + 1, : w // 50 + 1])
leuchten = np.clip((hell - basis) / (1 - basis), 0, 1)[..., None] * 0.55
grundneu = verlauf + (np.array(schein) / 255 - verlauf) * leuchten
aus = grund[..., None] * grundneu + (1 - grund[..., None]) * src
Image.fromarray((np.clip(aus, 0, 1) * 255).astype('uint8')).save(A.out, optimize=True)
print('geschrieben:', A.out, 'Rand', '#%02x%02x%02x' % c2)
