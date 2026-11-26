// App-Symbole aus den freigegebenen Vorlagen exportieren (Klaus 2026-11-26, Regel aller Pro-Apps):
//   Basic (Web-App, PWA)      hell ohne Verlauf   artwork/private-brain-pro-light.png → icon-192.png, icon-512.png
//   Pro (Android, Windows)    dunkel mit Verlauf  artwork/private-brain-pro-dark.png  → icon-pro-192.png, icon-pro-512.png,
//                                                 android/…/drawable-nodpi/private_brain_icon.png
// Die dunkle Vorlage hat Klaus am 2026-11-26 mit ChatGPT neu erzeugen lassen (Prompt im PR #163). Ersatzweg ohne neues
// Bild: tools/native/icon/make-pro-dark.py färbt private-brain-pro-grey.png um (feinere Kanten, schlechter).
// Bis 2026-11-25 trugen beide Fassungen dasselbe graue Symbol.
import { readFile, writeFile } from 'node:fs/promises';
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
  // Android legt das Bild als Vordergrund (inset 13 %) auf @color/pro_icon_background. Die Ecken der Vorlage sind
  // dunkler als ihr Rand; ohne weichen Übergang stünde im runden Symbol ein sichtbares Quadrat. Deshalb läuft das
  // Bild an seinen Kanten weich in Durchsicht aus (Motiv bleibt ganz), der Grund dahinter trägt die Randfarbe.
  const pro = await readFile(new URL('../../icon-pro-512.png', import.meta.url));
  const fg = await page.evaluate(async ({ data }) => {
    const image = new Image(); image.src = data; await image.decode();
    const s = 512, canvas = document.createElement('canvas'); canvas.width = canvas.height = s;
    const c = canvas.getContext('2d'); c.drawImage(image, 0, 0, s, s);
    const maske = document.createElement('canvas'); maske.width = maske.height = s;
    const m = maske.getContext('2d'); m.filter = 'blur(18px)'; m.fillStyle = '#000';
    m.beginPath(); m.roundRect(40, 40, s - 80, s - 80, 90); m.fill();
    c.globalCompositeOperation = 'destination-in'; c.drawImage(maske, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  }, { data: `data:image/png;base64,${pro.toString('base64')}` });
  await writeFile(new URL('../../android/app/src/main/res/drawable-nodpi/private_brain_icon.png', import.meta.url), Buffer.from(fg, 'base64'));
} finally { await browser.close(); }
console.log('Basic (hell) und Pro (dunkel) je 512/192 px exportiert, Pro nach Android kopiert.');
