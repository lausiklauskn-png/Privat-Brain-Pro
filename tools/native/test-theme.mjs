// Appearance profiles must survive restart and remain compatible with the original light/dark control.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {chromium} from 'playwright-core';
import {navigateTo} from './test-navigation-helper.mjs';
const root = resolve(process.env.PB_THEME_TEST_ROOT || 'www'), origin = 'https://localhost/';
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
async function chooseProfile(page,name){
  await page.locator('#pb-palette-button').click();
  await page.locator('[data-pb-palette-choice="'+name+'"]').click();
}
// Resize events and ResizeObservers finish on a rendering frame, after the
// viewport command itself can resolve. Measure the settled layout, not a stale
// popup position from the preceding desktop width.
async function layoutReady(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
try {
  browser = await chromium.launch({executablePath:process.env.CB_CHROMIUM || '/usr/bin/chromium', args:['--no-sandbox']});
  async function fixture(legacy = 'tag', preference = null, device = {}) {
    const context = await browser.newContext({viewport:{width:1280,height:900},...device}), errors = [];
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
    await page.locator('#pb-theme-settings').waitFor({state:'attached'});
    await page.locator('#pb-palette-button').waitFor();await layoutReady(page);
    return {context, page, errors};
  }
  let {context, page, errors} = await fixture();
  ok('Existing light preference becomes the modern light profile', await page.locator('html').getAttribute('data-pb-theme') === 'klarblau');
  ok('Settings has no duplicate appearance card while its original source remains available',await page.locator('#pb-theme-settings').evaluate(card=>card.hidden&&card.getBoundingClientRect().height===0&&card.querySelectorAll('[data-pb-theme-choice]').length===4));
  const profiles = [['klarblau','#2563eb'],['graphit','#475569'],['petrol','#0f766e'],['nachtblau','#7ca7ff']];
  for (const [name, accent] of profiles) {
    await chooseProfile(page,name);
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
  await chooseProfile(page,'petrol');
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
    await layoutReady(page);
    ok(`${width}px: the appearance source never becomes a second visible settings card`,await page.locator('#pb-theme-settings').evaluate(card=>card.hidden&&card.getBoundingClientRect().height===0&&card.getBoundingClientRect().width===0));
  }
  await page.locator('#pb-palette-button').click();
  await page.locator('[data-pb-palette-choice="klarblau"]').focus();
  await page.keyboard.press('Tab');
  ok('Theme choice retains a visible keyboard focus ring', await page.locator('[data-pb-palette-choice="graphit"]').evaluate(button => document.activeElement === button && getComputedStyle(button).outlineStyle !== 'none'));
  await page.keyboard.press('Escape');
  await navigateTo(page, 'search');
  await page.locator('#q').fill('Synthetic theme preview');
  const paletteButton=page.locator('#pb-palette-button'),palette=page.locator('#pb-palette');
  await paletteButton.waitFor();
  ok('The direct palette is an icon-only control beside the original Settings tab',await paletteButton.evaluate(button=>{
    const rect=button.getBoundingClientRect(),target=matchMedia('(any-pointer:fine)').matches?32:44;
    return button.parentElement.classList.contains('native-toolbar-quick')&&!button.closest('.main-pages')&&
      button.parentElement.querySelectorAll('.tab[data-tab=settings]').length===1&&rect.width>=target&&rect.height>=target&&
      button.querySelector('svg[data-icon-key=palette]')&&!button.textContent.trim()&&button.getAttribute('aria-label')==='Farbthema wählen';
  }));
  for(const [name] of profiles){
    await paletteButton.click();await palette.waitFor();
    ok(name+': the direct palette focuses the current choice and offers four existing profiles',await page.evaluate(()=>{
      const popup=document.getElementById('pb-palette');return popup.querySelectorAll('[data-pb-palette-choice]').length===4&&
        document.activeElement===popup.querySelector('[aria-pressed=true]')&&document.querySelectorAll('#pb-theme-settings [data-pb-theme-choice]').length===4;
    }));
    await page.locator('[data-pb-palette-choice="'+name+'"]').click();
    ok(name+': choosing a swatch applies immediately without losing the page or query',await page.evaluate(name=>
      PBTheme.current()===name&&document.documentElement.dataset.pbTheme===name&&document.querySelector('.panel.on').id==='panel-search'&&
      document.getElementById('q').value==='Synthetic theme preview'&&document.getElementById('pb-palette').hidden&&
      document.activeElement===document.getElementById('pb-palette-button')&&document.querySelectorAll('#pb-palette [aria-pressed=true]').length===1&&
      document.querySelector('#pb-palette [aria-pressed=true]').dataset.pbPaletteChoice===name,name));
  }
  await paletteButton.click();await page.locator('[data-pb-palette-choice=graphit]').click();
  await page.reload();await page.waitForFunction(()=>window.PBTheme?.current()==='graphit'&&document.getElementById('pb-palette-button'));
  ok('A profile chosen through the quick palette survives restart',await page.locator('html').getAttribute('data-pb-theme')==='graphit');
  await navigateTo(page,'search');await paletteButton.click();await page.keyboard.press('Escape');
  ok('Escape closes the palette and returns focus to its trigger',await palette.isHidden()&&await paletteButton.getAttribute('aria-expanded')==='false'&&await paletteButton.evaluate(button=>document.activeElement===button));
  await paletteButton.click();await page.locator('#q').click();
  ok('An outside click closes the palette without stealing the clicked field focus',await palette.isHidden()&&await page.locator('#q').evaluate(field=>document.activeElement===field));
  await paletteButton.click();await page.locator('#q').focus();
  ok('Keyboard focus leaving the nonmodal palette closes it',await palette.isHidden());
  await paletteButton.click();await page.keyboard.press('ArrowDown');
  ok('Arrow keys move between swatches without applying a theme',await page.locator('[data-pb-palette-choice=petrol]').evaluate(button=>document.activeElement===button)&&await page.evaluate(()=>PBTheme.current()==='graphit'));
  await page.keyboard.press('End');
  ok('End focuses the last profile',await page.locator('[data-pb-palette-choice=nachtblau]').evaluate(button=>document.activeElement===button));
  await page.keyboard.press('Home');
  ok('Home focuses the first profile',await page.locator('[data-pb-palette-choice=klarblau]').evaluate(button=>document.activeElement===button));
  await page.keyboard.press('ArrowUp');await page.keyboard.press('Enter');
  ok('Keyboard activation applies the focused profile and returns focus',await page.evaluate(()=>PBTheme.current()==='nachtblau')&&await palette.isHidden()&&await paletteButton.evaluate(button=>document.activeElement===button));
  const paletteWords={de:['Farbthema wählen',['Klarblau','Graphit','Petrol','Nachtblau']],en:['Choose a colour theme',['Clear blue','Graphite','Petrol','Night blue']],ru:['Выбрать цветовую тему',['Чистый синий','Графит','Петроль','Ночной синий']],pl:['Wybierz motyw kolorystyczny',['Czysty błękit','Grafit','Petrol','Nocny błękit']]};
  for(const [language,[label,names]] of Object.entries(paletteWords)){
    await page.evaluate(()=>document.documentElement.style.fontSize='16px');
    await clickMenuControl(page,'[data-lang="'+language+'"]');
    await page.waitForFunction(label=>document.getElementById('pb-palette-button')?.getAttribute('aria-label')===label,label);
    await paletteButton.click();
    ok(language+': the quick palette uses the translated existing theme names',JSON.stringify(await palette.locator('.pb-palette-name').allTextContents())===JSON.stringify(names)&&await paletteButton.getAttribute('title')===label);
    for(const width of [320,390,768,1280,1920])for(const font of [16,24]){
      await page.setViewportSize({width,height:900});await page.evaluate(font=>document.documentElement.style.fontSize=font+'px',font);
      await layoutReady(page);
      const geometry=await palette.evaluate(popup=>{
        const rect=popup.getBoundingClientRect(),trigger=document.getElementById('pb-palette-button').getBoundingClientRect();
        const quick=document.querySelector('.native-toolbar-quick').getBoundingClientRect(),tabs=document.querySelector('.main-pages').getBoundingClientRect();
        const compact=matchMedia('(any-pointer:fine)').matches,target=compact?32:44;
        const choices=[...popup.querySelectorAll('[data-pb-palette-choice]')].map(button=>{const box=button.getBoundingClientRect(),name=button.querySelector('.pb-palette-name');return{rect:box.toJSON(),name:name.textContent,nameScroll:name.scrollWidth,nameWidth:name.clientWidth};});
        const checks={visible:!popup.hidden,inset:rect.left>=7&&rect.right<=innerWidth-7&&rect.top>=7&&rect.bottom<=innerHeight-7,
          noOverflow:popup.scrollWidth<=popup.clientWidth+1,trigger:trigger.left>=0&&trigger.right<=innerWidth&&trigger.width>=target&&trigger.height>=target,
          quickRight:quick.left>=tabs.right-1,choices:choices.length===4&&choices.every(choice=>choice.rect.height>=target&&choice.rect.left>=rect.left&&choice.rect.right<=rect.right&&choice.nameScroll<=choice.nameWidth+1),
          desktopDensity:!compact||parseFloat(getComputedStyle(document.documentElement).fontSize)>16||trigger.height<=34&&choices.every(choice=>choice.rect.height<=34)};
        return{ok:Object.values(checks).every(Boolean),checks,target,viewport:{width:innerWidth,height:innerHeight},popup:rect.toJSON(),trigger:trigger.toJSON(),quick:quick.toJSON(),tabs:tabs.toJSON(),choices};
      });
      if(!geometry.ok)console.error('Palette geometry: '+JSON.stringify(geometry));
      ok(language+'/'+width+'px/'+font+'px: the palette and all four choices fit the viewport with the appropriate targets',geometry.ok);
    }
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({width:320,height:240});
  await page.evaluate(()=>document.documentElement.style.fontSize='16px');await layoutReady(page);await paletteButton.click();
  ok('A short window constrains the palette height and keeps its overflow scrollable',await palette.evaluate(popup=>{const rect=popup.getBoundingClientRect();return rect.top>=7&&rect.bottom<=innerHeight-7&&getComputedStyle(popup).overflowY==='auto';}));
  await page.keyboard.press('Escape');await page.setViewportSize({width:1280,height:900});
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='pb_pro_theme_v1'||key==='pb_pro_light_theme_v1')throw new DOMException('Synthetic storage failure','QuotaExceededError');return original.call(this,key,value);};});
  await paletteButton.click();await page.locator('[data-pb-palette-choice=petrol]').click();
  ok('A failed preference save leaves an honest visible notice in the quick palette',await page.evaluate(()=>PBTheme.current()==='petrol')&&await palette.isVisible()&&await palette.locator('.pb-palette-status').isVisible()&&(await palette.locator('.pb-palette-status').textContent()).length>25);
  await page.keyboard.press('Escape');
  ok('Appearance changes do not raise unhandled app errors', errors.length === 0);
  await context.close();
  ({context, page, errors} = await fixture('dunkel'));
  ok('Existing dark installation starts in Night blue without losing the legacy preference', await page.locator('html').getAttribute('data-pb-theme') === 'nachtblau' && await page.locator('html').getAttribute('data-theme') === 'dunkel');
  await context.close();
  ({context, page, errors} = await fixture('dunkel', 'invalid-theme'));
  ok('Invalid stored profile falls back to the existing installation mode', await page.locator('html').getAttribute('data-pb-theme') === 'nachtblau');
  await context.close();
  for(const [name,device] of [['Touch tablet',{hasTouch:true}],['Portrait touch tablet',{viewport:{width:768,height:1024},hasTouch:true}]]){
    ({context,page,errors}=await fixture('tag',null,device));await page.locator('#pb-palette-button').click();
    ok(name+': palette trigger and choices retain 44px targets',await page.locator('#pb-palette').evaluate(popup=>{
      const trigger=document.getElementById('pb-palette-button').getBoundingClientRect();return !matchMedia('(any-pointer:fine)').matches&&trigger.width>=44&&trigger.height>=44&&
        [...popup.querySelectorAll('[data-pb-palette-choice]')].every(button=>button.getBoundingClientRect().height>=44);
    }));
    ok(name+': no appearance runtime errors',errors.length===0);await context.close();
  }
  console.log(`${count} appearance checks passed (browser UI; no device appearance test claimed).`);
} finally { await browser?.close(); }
