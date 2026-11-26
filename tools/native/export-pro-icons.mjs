// App-Symbole aus den freigegebenen Vorlagen exportieren (Klaus 2026-11-26, Regel aller Pro-Apps):
//   Basic (Web-App, PWA)      hell ohne Verlauf   artwork/private-brain-pro-light.png → icon-192.png, icon-512.png
//   Pro (Android, Windows)    dunkel mit Verlauf  artwork/private-brain-pro-dark.png  → icon-pro-192.png, icon-pro-512.png,
//                                                 android/…/drawable-nodpi/private_brain_icon.png
// Die dunkle Vorlage baut tools/native/icon/make-pro-dark.py aus private-brain-pro-grey.png.
// Bis 2026-11-25 trugen beide Fassungen dasselbe graue Symbol.
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
const art = (name) => readFile(new URL(`../../artwork/${name}`, import.meta.url));
const browser = await chromium.launch({ executablePath: process.env.CB_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  for (const [vorlage, praefix] of [['private-brain-pro-light.png', 'icon'], ['private-brain-pro-dark.png', 'icon-pro']]) {
    const source = await art(vorlage);
    for (const size of [512, 192]) {
      const png = await page.evaluate(async ({ data, size }) => {
        const image = new Image(); image.src = data; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
        const context = canvas.getContext('2d');
        context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, size, size);
        return canvas.toDataURL('image/png').split(',')[1];
      }, { data: `data:image/png;base64,${source.toString('base64')}`, size });
      await writeFile(new URL(`../../${praefix}-${size}.png`, import.meta.url), Buffer.from(png, 'base64'));
    }
  }
  await copyFile(new URL('../../icon-pro-512.png', import.meta.url), new URL('../../android/app/src/main/res/drawable-nodpi/private_brain_icon.png', import.meta.url));
} finally { await browser.close(); }
console.log('Basic (hell) und Pro (dunkel) je 512/192 px exportiert, Pro nach Android kopiert.');
