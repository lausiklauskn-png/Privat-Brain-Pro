// Export Android/header sizes from the approved light Pro artwork; never touch the PWA checkout.
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
const source = await readFile(new URL('../../artwork/private-brain-pro-light.png', import.meta.url));
const browser = await chromium.launch({ executablePath: process.env.CB_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  for (const size of [512, 192]) {
    const png = await page.evaluate(async ({ data, size }) => {
      const image = new Image(); image.src = data; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
      const context = canvas.getContext('2d');
      context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, size, size);
      return canvas.toDataURL('image/png').split(',')[1];
    }, { data: `data:image/png;base64,${source.toString('base64')}`, size });
    await writeFile(new URL(`../../icon-${size}.png`, import.meta.url), Buffer.from(png, 'base64'));
  }
  await copyFile(new URL('../../icon-512.png', import.meta.url), new URL('../../android/app/src/main/res/drawable-nodpi/private_brain_icon.png', import.meta.url));
} finally { await browser.close(); }
console.log('Light Pro icons exported at 512/192 px and copied to Android.');
