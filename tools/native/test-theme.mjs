// Appearance profiles must survive restart and remain compatible with the original light/dark control.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {chromium} from 'playwright-core';
import {navigateTo} from './test-navigation-helper.mjs';
const root = resolve('www'), origin = 'https://localhost/';
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.woff2':'font/woff2'};
let browser, count = 0;
const ok = (name, value) => { assert.ok(value, name); console.log('✓ ' + name); count++; };
function luminance(color) {
  const components = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return components[0] * .2126 + components[1] * .7152 + components[2] * .0722;
}
const contrast = (one, two) => { const [a, b] = [luminance(one), luminance(two)].sort((x, y) => x - y); return (b + .05) / (a + .05); };
async function clickMenuControl(page, selector) {
  const target = page.locator(selector);
  await target.waitFor({state:'attached'});
  if (!await target.isVisible()) {
    const menu = page.locator('.native-options');
    if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
    await target.waitFor({state:'visible'});
  }
  await target.click();
}
try {
  browser = await chromium.launch({executablePath:process.env.CB_CHROMIUM || '/usr/bin/chromium', args:['--no-sandbox']});
  async function fixture(legacy = 'tag', preference = null) {
    const context = await browser.newContext({viewport:{width:1280,height:900}}), errors = [];
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      const url = route.request().url();
      if (!url.startsWith(origin)) return route.fulfill({status:404,body:''});
      const path = resolve(root, '.' + new URL(url).pathname.replace(/\/$/, '/index.html'));
      if (!path.startsWith(root + '/')) return route.abort();
      try { return route.fulfill({contentType:types[extname(path)] || 'application/octet-stream',body:await readFile(path)}); }
      catch { return route.fulfill({status:404,body:''}); }
    });
    await page.addInitScript(({legacy, preference}) => {
      if (!localStorage.getItem('fixture-theme-seeded')) {
        localStorage.setItem('pb_theme', legacy);
        if (preference !== null) localStorage.setItem('pb_pro_theme_v1', preference);
        localStorage.setItem('fixture-theme-seeded', 'true');
      }
      window.Capacitor = {isNativePlatform:()=>true, Plugins:{ProDevice:{async getInfo(){return{versionName:'fixture'};}}}};
    }, {legacy, preference});
    await page.goto(origin);
    await page.waitForFunction(() => window.PBTheme?.current() && window.PBWorkspace && typeof db !== 'undefined' && db);
    await page.locator('#mailWorkspace .mail-app .mail-button.mail-primary').first().waitFor({state:'attached'});
    await navigateTo(page, 'settings');
    await page.locator('#pb-theme-settings').waitFor();
    return {context, page, errors};
  }
  let {context, page, errors} = await fixture();
  ok('Existing light preference becomes the modern light profile', await page.locator('html').getAttribute('data-pb-theme') === 'klarblau');
  const profiles = [['klarblau','#2563eb'],['graphit','#475569'],['petrol','#0f766e'],['nachtblau','#7ca7ff']];
  for (const [name, accent] of profiles) {
    await page.locator(`[data-pb-theme-choice="${name}"]`).click();
    const state = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const sample = document.createElement('span'); sample.style.color = 'var(--ink)'; sample.style.backgroundColor = 'var(--card)'; document.body.append(sample);
      const text = getComputedStyle(sample).color, background = getComputedStyle(sample).backgroundColor;
      sample.style.color = 'var(--mut)'; const muted = getComputedStyle(sample).color;
      sample.style.color = 'var(--pb-on-accent)'; sample.style.backgroundColor = 'var(--acc)'; const primary = getComputedStyle(sample).color, primaryBg = getComputedStyle(sample).backgroundColor; sample.remove();
      const control = document.createElement('button'); control.className = 'primary'; control.textContent = 'Theme contrast probe'; document.body.append(control);
      const actualPrimary = getComputedStyle(control).color, actualPrimaryBg = getComputedStyle(control).backgroundColor; control.remove();
      // Read the real mail controls inside the existing mount: the mail-specific
      // cascade can override the generic primary styles, especially in dark mode.
      const mailPrimaries = [...document.querySelectorAll('#mailWorkspace .mail-app .mail-button.mail-primary')].map(button => {
        const paint = getComputedStyle(button);
        const labels = [...button.querySelectorAll('.compact-caption,.compact-label')].filter(label => label.textContent.trim());
        return {background:paint.backgroundColor,image:paint.backgroundImage,colors:[paint.color,...labels.map(label => getComputedStyle(label).color)]};
      });
      return {name:document.documentElement.dataset.pbTheme,dark:document.documentElement.dataset.theme === 'dunkel',accent:style.getPropertyValue('--acc').trim(),text,background,muted,primary,primaryBg,actualPrimary,actualPrimaryBg,mailPrimaries};
    });
    ok(`${name}: selected profile changes actual colours and keeps legacy mode compatible`, state.name === name && state.accent === accent && state.dark === (name === 'nachtblau') && await page.locator('[data-pb-theme-choice][aria-pressed="true"]').count() === 1);
    ok(`${name}: normal, secondary and primary button text meet 4.5:1`, contrast(state.text,state.background) >= 4.5 && contrast(state.muted,state.background) >= 4.5 && contrast(state.primary,state.primaryBg) >= 4.5);
    ok(`${name}: an actual primary button consumes the accessible theme colours`, contrast(state.actualPrimary,state.actualPrimaryBg) >= 4.5);
    ok(`${name}: real mail primary controls and captions use the theme accent with 4.5:1 contrast`, state.mailPrimaries.length > 0 && state.mailPrimaries.every(control => control.background === state.primaryBg && control.image === 'none' && control.colors.every(color => contrast(color,control.background) >= 4.5)));
  }
  await page.locator('[data-pb-theme-choice="petrol"]').click();
  await page.reload(); await page.waitForFunction(() => window.PBTheme?.current() === 'petrol');
  ok('Explicit light profile survives an app restart', await page.locator('html').getAttribute('data-pb-theme') === 'petrol');
  await clickMenuControl(page, '#themeToggle'); await page.waitForFunction(() => document.documentElement.dataset.pbTheme === 'nachtblau');
  ok('Original light/dark control still switches to dark and updates browser chrome', await page.locator('html').getAttribute('data-theme') === 'dunkel' && await page.locator('meta[name="theme-color"]').getAttribute('content') === '#111827');
  await clickMenuControl(page, '#themeToggle'); await page.waitForFunction(() => document.documentElement.dataset.pbTheme === 'petrol');
  ok('Returning to light restores the previously selected light profile', await page.locator('html').getAttribute('data-theme') !== 'dunkel');
  await navigateTo(page, 'settings');
  for (const [language, heading] of [['en','Appearance'],['ru','Оформление'],['pl','Wygląd'],['de','Erscheinungsbild']]) {
    await clickMenuControl(page, `[data-lang="${language}"]`);
    await page.waitForFunction(value => document.getElementById('pb-theme-heading')?.textContent === value, heading);
    ok(`${language}: theme chooser labels follow the existing language control`, (await page.locator('#pb-theme-heading').textContent()) === heading && (await page.locator('#pb-theme-settings .pb-theme-status').textContent()).length > 8);
  }
  for (const width of [320,412,768,1280,1920]) {
    await page.setViewportSize({width,height:900});
    ok(`${width}px: all theme names remain readable with 44px targets`, await page.locator('#pb-theme-settings .pb-theme-choice').evaluateAll(buttons => buttons.length === 4 && buttons.every(button => {const rect=button.getBoundingClientRect(),name=button.querySelector('.pb-theme-name');return rect.height >= 44 && rect.left >= 0 && rect.right <= innerWidth && name.scrollWidth <= name.getBoundingClientRect().width + 1;})));
  }
  await page.locator('[data-pb-theme-choice="klarblau"]').focus();
  await page.keyboard.press('Tab');
  ok('Theme choice retains a visible keyboard focus ring', await page.locator('[data-pb-theme-choice="graphit"]').evaluate(button => document.activeElement === button && getComputedStyle(button).outlineStyle !== 'none'));
  ok('Appearance changes do not raise unhandled app errors', errors.length === 0);
  await context.close();
  ({context, page, errors} = await fixture('dunkel'));
  ok('Existing dark installation starts in Night blue without losing the legacy preference', await page.locator('html').getAttribute('data-pb-theme') === 'nachtblau' && await page.locator('html').getAttribute('data-theme') === 'dunkel');
  await context.close();
  ({context, page, errors} = await fixture('dunkel', 'invalid-theme'));
  ok('Invalid stored profile falls back to the existing installation mode', await page.locator('html').getAttribute('data-pb-theme') === 'nachtblau');
  await context.close();
  console.log(`${count} appearance checks passed (browser UI; no device appearance test claimed).`);
} finally { await browser?.close(); }
