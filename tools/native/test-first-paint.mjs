// Regression for the delivered first frame, not a loading cover or a fast CPU.
// Native services are fixtures; this proves browser rendering/adoption, not Tab S6 speed.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {chromium} from 'playwright-core';

const root = resolve(process.env.PB_FIRST_PAINT_ROOT || 'www');
const origin = 'https://localhost/';
const sourceVersion = (await readFile('android/app/build.gradle', 'utf8')).match(/^\s*versionName\s+"([^"]+)"/m)?.[1];
assert.ok(sourceVersion, 'The fixture must use the actual app version');
const displayVersion = 'v' + sourceVersion.replace(/-debug$/, '').replace(/^(\d+)\.(\d+)\.\d+-preview\.(\d+)$/, '$1.$2.$3');
const profiles = {
  klarblau: {background:'#f6f8fc', accent:'#2563eb'}, graphit: {background:'#f7f8fa', accent:'#475569'},
  petrol: {background:'#f5f9f9', accent:'#0f766e'}, nachtblau: {background:'#111827', accent:'#7ca7ff'}
};
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml', '.woff2':'font/woff2'};
let browser, count = 0;
const ok = (name, value) => {assert.ok(value, name); console.log('✓ ' + name); count++;};
const deadline = async (name, promise) => {
  let timer;
  try {return await Promise.race([promise, new Promise((_, reject) => {timer = setTimeout(() => reject(new Error(name + ': no response within 45 seconds')), 45000);})]);}
  finally {clearTimeout(timer);}
};
const frames = page => deadline('Two rendering frames', page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))));

function snapshot() {
  const html = document.documentElement, body = document.body;
  if (!body || !document.getElementById('q')) return null;
  const visible = node => {
    if (!node) return false;
    const style = getComputedStyle(node), rect = node.getBoundingClientRect();
    return rect.width > 2 && rect.height > 2 && style.display !== 'none' && style.visibility === 'visible' && Number(style.opacity) > 0 && !node.closest('[hidden]') && node.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});
  };
  const renderedText = root => {
    if (!root) return '';
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), text = [];
    for (let node; (node = walk.nextNode());) {
      const element = node.parentElement;
      if (!element || element.closest('.compact-label,[aria-hidden="true"],script,style') || !visible(element)) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      if ([...range.getClientRects()].some(rect => rect.width > 2 && rect.height > 2)) text.push(node.nodeValue);
    }
    return text.join(' ');
  };
  const nav = [...document.querySelectorAll('.main-pages>.tab')];
  const mean = document.querySelector('#mode [data-m="mean"]'), label = mean?.querySelector('[data-i18n="modeMeaningShort"]');
  const range = document.createRange(); if (label) range.selectNodeContents(label);
  const labelRects = label ? [...range.getClientRects()].filter(rect => rect.width > 0) : [];
  const style = getComputedStyle(html), bodyStyle = getComputedStyle(body);
  const controlsText = renderedText(document.querySelector('header.top')) + renderedText(document.querySelector('.native-toolbar-row')) + renderedText(document.getElementById('panel-search'));
  const footer = document.querySelector('.wrap footer, #panel-settings footer');
  return {
    marker:html.dataset.pbPrerender, charset:document.characterSet, theme:html.dataset.pbTheme, background:style.getPropertyValue('--bg').trim().toLowerCase(), accent:style.getPropertyValue('--acc').trim().toLowerCase(),
    bodyVisible:visible(body) && visible(document.querySelector('.wrap')), bodyImage:bodyStyle.backgroundImage,
    nav:nav.map(button => button.dataset.tab), navIcons:nav.length === 7 && nav.every(button => !!button.querySelector('svg.compact-icon')),
    navImages:nav.map(button => getComputedStyle(button).backgroundImage), navHeights:nav.map(button => button.getBoundingClientRect().height),
    quick:visible(document.querySelector('.native-toolbar-quick [data-tab="settings"]')) && visible(document.getElementById('pb-palette-button')),
    settingsIcon:!!document.querySelector('.native-toolbar-quick [data-tab="settings"] svg'), paletteIcon:!!document.querySelector('#pb-palette-button svg'),
    headerIcons:!!document.querySelector('header.top .native-options>summary svg') && document.querySelectorAll('header.top .native-navigation button svg').length === 2,
    lamp:visible(document.querySelector('header.top .native-net-lamp')), language:document.getElementById('pb-search-language')?.textContent.trim(),
    languageVisible:visible(document.getElementById('pb-search-language')), languageAnchors:!!document.querySelector('#pb-input-language-quick>#pb-search-language') && !!document.querySelector('#pb-search-language-menu'), micIcon:!!document.querySelector('#mic svg'),
    languages:[...document.querySelectorAll('#pb-search-language-menu [data-input-language]')].map(button => button.dataset.inputLanguage),
    pressedLanguages:[...document.querySelectorAll('#pb-search-language-menu [aria-pressed="true"]')].map(button => button.dataset.inputLanguage), inputLanguage:document.getElementById('q').lang,
    meaningVisible:visible(mean), meaning:label?.textContent.trim(), meaningHeight:mean?.getBoundingClientRect().height,
    meaningSingleLine:labelRects.length > 0 && labelRects.every(rect => Math.abs(rect.top - labelRects[0].top) < 1),
    meaningFits:!!mean && mean.scrollWidth <= mean.clientWidth + 1,
    nameButtons:document.querySelectorAll('#mode [data-m="name"]').length,
    intro:document.querySelectorAll('.search-welcome,[data-ws="find"],[data-ws="findHelp"]').length,
    legacyNav:!!document.querySelector('.wrap>.workspace-tools,.wrap>nav.main-pages'),
    legacyVisibleText:/Namenssuche|Bedeutungssuche|Was möchtest du finden|Dateien hinzufügen/.test(controlsText), controlsText,
    emoji:/[🎤💾🔗🔎📥📁✉📊🗂🧹⚙🌙🔄]/u.test(controlsText),
    footerInSettings:!!footer?.closest('#panel-settings'), version:document.getElementById('pbVersion')?.textContent.trim()
  };
}

function assertShell(name, state, theme = 'klarblau', language = 'de') {
  assert.ok(state, name + ': actual shell exists');
  assert.equal(state.marker, 'shell', name + ': built shell marker');
  assert.equal(state.charset, 'UTF-8', name + ': actual HTML encoding');
  assert.equal(state.theme, theme, name + ': chosen theme is applied before adapters');
  assert.equal(state.background, profiles[theme].background, name + ': modern background token');
  assert.equal(state.accent, profiles[theme].accent, name + ': modern accent token');
  assert.ok(state.bodyVisible, name + ': real content is visible without a loading cover');
  assert.equal(state.bodyImage, 'none', name + ': no legacy background gradient');
  assert.deepEqual(state.nav, ['search','intake','explorer','mail','dash','order','dupes'], name + ': seven original routes');
  assert.ok(state.navIcons && state.navImages.every(image => image === 'none') && state.navHeights.every(height => height > 20 && height <= 46), name + ': line icons and compact flat buttons');
  assert.ok(state.quick && state.settingsIcon && state.paletteIcon && state.headerIcons && state.lamp, name + ': complete modern controls');
  assert.ok(state.languageVisible && state.language === language.toUpperCase() && state.languageAnchors && state.micIcon, name + ': compact language and microphone');
  assert.deepEqual(state.languages, ['de','en','ru','pl','tr','ar','uk','es','fr','it','pt'], name + ': all eleven language choices are already delivered');
  assert.ok(state.meaningVisible && state.meaning === 'Bedeutung' && state.meaningSingleLine && state.meaningFits && state.meaningHeight <= 46, name + ': compact single-line meaning switch');
  assert.equal(state.nameButtons, 0, name + ': no obsolete filename button');
  assert.equal(state.intro, 0, name + ': no redundant welcome block');
  assert.ok(!state.legacyNav && !state.legacyVisibleText && !state.emoji, name + ': no old navigation, labels or decorative emoji; ' + JSON.stringify({legacyNav:state.legacyNav,legacyVisibleText:state.legacyVisibleText,emoji:state.emoji,text:state.controlsText}));
  assert.ok(state.footerInSettings, name + ': legal footer starts in Settings');
  assert.equal(state.version, displayVersion, name + ': build version needs no device round-trip');
  ok(name, true);
}

function installFixture(config, takeSnapshot) {
  const originalGet = Storage.prototype.getItem, originalSet = Storage.prototype.setItem;
  const themeKey = key => ['pb_pro_theme_v1','pb_pro_light_theme_v1'].includes(key);
  if (!originalGet.call(localStorage, 'first-paint-fixture-seeded')) {
    originalSet.call(localStorage, 'pb_lang', 'de'); originalSet.call(localStorage, 'pb_theme', 'tag');
    originalSet.call(localStorage, 'pb_input_language_v1', config.inputLanguage);
    if (config.profile !== null) originalSet.call(localStorage, 'pb_pro_theme_v1', config.profile);
    originalSet.call(localStorage, 'first-paint-user-sentinel', 'keep this user preference');
    originalSet.call(localStorage, 'first-paint-fixture-seeded', 'yes');
  }
  if (config.denied) {
    Storage.prototype.getItem = function(key) {if (themeKey(key)) throw new DOMException('Fixture denied theme reads', 'SecurityError'); return originalGet.call(this, key);};
    Storage.prototype.setItem = function(key, value) {if (themeKey(key)) throw new DOMException('Fixture denied theme writes', 'SecurityError'); return originalSet.call(this, key, value);};
  }
  const selectors = ['.native-toolbar-row','.main-pages',...['search','intake','explorer','mail','dash','order','dupes'].map(name => '.main-pages>[data-tab="' + name + '"]'),'.native-toolbar-quick [data-tab="settings"]',
    '#pb-palette-button','header.top .native-options','header.top .native-navigation','header.top .native-net-lamp',
    '#pb-input-language-quick','#pb-search-language','#pb-search-language-menu','#q','#mode [data-m="mean"]','#mic','#pbVersion','#panel-settings footer'];
  const state = window.__firstPaint = {phase:'parsing', samples:[], paints:[], releases:[], nodes:null, nodeChanges:[], frameCount:0, active:true};
  state.snapshot = takeSnapshot;
  const keepNodes = () => {
    if (state.nodes) {
      for (const [selector, node] of state.nodes) if (document.querySelector(selector) !== node && !state.nodeChanges.includes(selector)) state.nodeChanges.push(selector);
      return;
    }
    const nodes = selectors.map(selector => [selector, document.querySelector(selector)]);
    if (nodes.every(([, node]) => node)) state.nodes = nodes;
  };
  new MutationObserver(keepNodes).observe(document, {subtree:true, childList:true});
  const capture = () => {
    if (!state.active) return;
    keepNodes();
    const view = takeSnapshot();
    if (view && state.samples.length < 180) state.samples.push({phase:state.phase, time:performance.now(), frame:state.frameCount++, view});
    requestAnimationFrame(capture);
  };
  requestAnimationFrame(capture);
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) if (entry.name === 'first-contentful-paint') state.paints.push({name:entry.name, startTime:entry.startTime, observedAt:performance.now()});
  }).observe({type:'paint', buffered:true});
  let releaseDevice;
  const device = {platform:'android', versionName:config.version + '-debug', versionCode:config.code, nativeMail:false};
  const deviceReady = new Promise(resolve => {releaseDevice = () => resolve(device);});
  window.__paintFixture = {deviceCalls:0, speechCalls:[], releaseDevice};
  window.__CB_EMBED_STUB__ = {
    async embedQuery() {return Float32Array.from({length:384}, (_, i) => i === 0 ? 1 : 0);},
    async embedPassage() {return Float32Array.from({length:384}, (_, i) => i === 0 ? 1 : 0);},
    async embedPassageBatch(texts) {return texts.map(() => Float32Array.from({length:384}, (_, i) => i === 0 ? 1 : 0));}
  };
  window.Capacitor = {isNativePlatform:() => true, getPlatform:() => 'android', Plugins:{
    ProDevice:{async getInfo() {window.__paintFixture.deviceCalls++; return deviceReady;}},
    ProNetwork:{async getState() {return {offline:true};}, async setOffline({offline}) {return {offline};}},
    ProSpeech:{async listen(options) {window.__paintFixture.speechCalls.push(options); return {text:'first paint spoken', cancelled:false};}}
  }};
}

function barrier() {
  let release, seen;
  return {wait:new Promise(resolve => {release = resolve;}), hit:new Promise(resolve => {seen = resolve;}), release, seen};
}

async function fixture({width = 1280, profile = null, denied = false, inputLanguage = 'de', delays = []} = {}) {
  const context = await browser.newContext({viewport:{width,height:900}, serviceWorkers:'block'}), page = await context.newPage();
  page.setDefaultNavigationTimeout(90000); // Includes the explicit CPU-throttled script barriers.
  const gates = new Map(delays.map(name => [name, barrier()]));
  let armed = false;
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(origin).origin) return route.fulfill({status:404, body:''});
    const path = resolve(root, '.' + url.pathname.replace(/\/$/, '/index.html'));
    if (!path.startsWith(root + sep)) return route.abort();
    const gate = armed && gates.get(url.pathname.slice(1));
    if (gate) {gate.seen(); await gate.wait;}
    try {return await route.fulfill({contentType:types[extname(path)] || 'application/octet-stream', body:await readFile(path)});}
    catch {return route.fulfill({status:404, body:''});}
  });
  const code = Number((await readFile('android/app/build.gradle', 'utf8')).match(/^\s*versionCode\s+(\d+)/m)?.[1]);
  await context.addInitScript({content:'(' + installFixture.toString() + ')(' + JSON.stringify({profile,denied,inputLanguage,version:sourceVersion,code}) + ',' + snapshot.toString() + ');'});
  return {context,page,errors,gates,arm:() => {armed = true;},releaseAll:() => {for (const gate of gates.values()) gate.release();}};
}

async function ready(page) {
  await page.waitForFunction(() => window.PBTheme?.current() && window.PBInputLanguage && window.PBNavigation && window.PBWorkspace && typeof db !== 'undefined' && db && document.querySelector('#mic.pb-search-dictate'));
}
async function clickMenu(page, selector) {
  if (!await page.locator(selector).isVisible()) await page.locator('.native-options>summary').click();
  await page.locator(selector).click();
}

try {
  browser = await chromium.launch({executablePath:process.env.CB_CHROMIUM || '/usr/bin/chromium', args:['--no-sandbox']});
  for (const width of [1280,390]) {
    console.log('Checking delivered HTML with JavaScript disabled at ' + width + 'px');
    const context = await browser.newContext({viewport:{width,height:900}, javaScriptEnabled:false, hasTouch:width === 390, isMobile:width === 390, serviceWorkers:'block'});
    const page = await context.newPage();
    await page.route('**/*', async route => {
      const url = new URL(route.request().url()); if (url.origin !== new URL(origin).origin) return route.abort();
      const path = resolve(root, '.' + url.pathname.replace(/\/$/, '/index.html'));
      if (!path.startsWith(root + sep)) return route.abort();
      try {return route.fulfill({contentType:types[extname(path)] || 'application/octet-stream', body:await readFile(path)});}
      catch {return route.fulfill({status:404, body:''});}
    });
    // Script-disabled pages need no runtime frame callback: layout is measured
    // synchronously after the actual delivered stylesheets have loaded.
    await page.goto(origin);
    assertShell(`${width}px with JavaScript disabled: the delivered first HTML is modern and visible`, await page.evaluate(snapshot));
    await context.close();
  }

  const savedLanguage = await fixture({profile:'petrol', inputLanguage:'ru', delays:['native-input-language.js']});
  try {
    savedLanguage.arm(); const loaded = savedLanguage.page.goto(origin, {waitUntil:'domcontentloaded'}); loaded.catch(() => {});
    await deadline('Request for saved-language adapter', savedLanguage.gates.get('native-input-language.js').hit); await frames(savedLanguage.page);
    const initial = await savedLanguage.page.evaluate(() => __firstPaint.snapshot());
    assertShell('Saved Russian input preference is visible before the language adapter', initial, 'petrol', 'ru');
    assert.deepEqual(initial.pressedLanguages, ['ru'], 'Only the saved Russian language is pressed in the delivered menu');
    assert.equal(initial.inputLanguage, 'ru', 'The actual search input receives the saved language before hydration');
    savedLanguage.gates.get('native-input-language.js').release(); await loaded; await ready(savedLanguage.page);
    ok('Russian chip, input language and all eleven menu choices survive runtime adoption', await savedLanguage.page.evaluate(() => PBInputLanguage.current() === 'ru' && document.getElementById('pb-search-language').textContent === 'RU' && document.querySelectorAll('#pb-search-language-menu [data-input-language]').length === 11 && document.querySelectorAll('#pb-search-language-menu [aria-pressed="true"]').length === 1 && document.querySelector('#pb-search-language-menu [aria-pressed="true"]').dataset.inputLanguage === 'ru' && __firstPaint.nodeChanges.length === 0));
    ok('Early language restoration leaves the saved preference unchanged', await savedLanguage.page.evaluate(() => localStorage.getItem('pb_input_language_v1') === 'ru') && savedLanguage.errors.length === 0);
  } finally {savedLanguage.releaseAll(); await savedLanguage.context.close();}

  const delayed = ['native-input-language.js','native.js','native-theme.js','native-toolbar.js'];
  const slow = await fixture({profile:'petrol', delays:delayed});
  try {
    console.log('Seeding catalog and storage before the deliberately delayed reload');
    await slow.page.goto(origin); await ready(slow.page);
    await slow.page.setInputFiles('#fileInput', {name:'first-paint-preserved.txt', mimeType:'text/plain', buffer:Buffer.from('A real catalog fixture survives the new first HTML.')});
    await slow.page.waitForFunction(() => CATALOG.some(record => record.name === 'first-paint-preserved.txt'));
    await slow.page.waitForFunction(async () => (await idbGetAll('catalog')).some(record => record.name === 'first-paint-preserved.txt'));
    await slow.page.evaluate(async () => {const cache = await caches.open('unrelated-app-first-paint'); await cache.put('/unrelated-first-paint', new Response('keep this unrelated app cache'));});
    const before = await slow.page.evaluate(async () => ({catalog:JSON.stringify((await idbGetAll('catalog')).map(({hash,name,path,size,text,tags}) => ({hash,name,path,size,text,tags}))), preference:localStorage.getItem('first-paint-user-sentinel')}));
    assert.ok(JSON.parse(before.catalog).some(record => record.name === 'first-paint-preserved.txt'), 'The exact captured persistence baseline must contain the imported record');
    const cdp = await slow.context.newCDPSession(slow.page); await cdp.send('Emulation.setCPUThrottlingRate', {rate:6});
    slow.arm();
    const loaded = slow.page.reload({waitUntil:'domcontentloaded'});
    loaded.catch(() => {}); // Preserve the original assertion if cleanup cancels navigation.
    for (const name of delayed) {
      await deadline('Request for ' + name, slow.gates.get(name).hit);
      await slow.page.evaluate(name => {__firstPaint.phase = 'waiting for ' + name;}, name);
      await frames(slow.page);
      assertShell(`CPU-throttled while ${name} is deliberately pending`, await slow.page.evaluate(() => __firstPaint.snapshot()), 'petrol');
      await slow.page.waitForFunction(() => __firstPaint.nodes);
      await slow.page.evaluate(name => {__firstPaint.releases.push({name,time:performance.now()});}, name);
      slow.gates.get(name).release();
    }
    await loaded; await ready(slow.page); await frames(slow.page);
    await slow.page.waitForFunction(() => __firstPaint.paints.length > 0 && __firstPaint.nodes && __paintFixture.deviceCalls > 0);
    const observation = await slow.page.evaluate(() => ({samples:__firstPaint.samples, paints:__firstPaint.paints, releases:__firstPaint.releases, nodeChanges:__firstPaint.nodeChanges, version:document.getElementById('pbVersion').textContent}));
    assert.ok(observation.samples.length >= delayed.length, 'Rendering frames were actually sampled');
    assert.ok(delayed.every(name => observation.samples.some(sample => sample.phase === 'waiting for ' + name)), 'Each deliberately stalled adapter had an observed rendering frame');
    for (const {view} of observation.samples) assertShellFrame(view, 'petrol');
    assert.ok(observation.paints[0].startTime <= observation.releases[0].time, 'FCP must occur while the first adapter is still deliberately blocked');
    ok('FCP occurs before adapter release; every observed rendering frame retains the modern theme and shell', true);
    ok('Build version remains correct while the native device response is still pending', observation.version === displayVersion);
    await slow.page.evaluate(() => __paintFixture.releaseDevice());
    await slow.page.waitForFunction(() => window.PBVersionShown && document.querySelector('.native-status')?.textContent.includes('Private Brain Pro'));
    await frames(slow.page);
    ok('Hydration adopts the original visible nodes instead of replacing controls or legal footer', await slow.page.evaluate(() => __firstPaint.nodeChanges.length === 0 && __firstPaint.nodes.every(([selector,node]) => document.querySelector(selector) === node)));
    const ids = await slow.page.evaluate(() => {const all = [...document.querySelectorAll('[id]')].map(node => node.id); return all.filter((id,index) => all.indexOf(id) !== index);});
    ok('Hydration creates no duplicate IDs, navigation, palette or speech-language picker', ids.length === 0 && await slow.page.locator('.native-toolbar-row').count() === 1 && await slow.page.locator('#pb-palette-button').count() === 1 && await slow.page.locator('#pb-search-language').count() === 1 && await slow.page.locator('header .native-navigation').count() === 1);
    const mean = slow.page.locator('#mode [data-m="mean"]'), pressed = await mean.getAttribute('aria-pressed');
    await mean.click(); assert.notEqual(await mean.getAttribute('aria-pressed'), pressed); await mean.click();
    ok('The original meaning-search handler still toggles on and off after adoption', await mean.getAttribute('aria-pressed') === pressed);
    await slow.page.locator('.main-pages [data-tab="intake"]').click(); await slow.page.locator('#panel-intake').waitFor({state:'visible'});
    await slow.page.locator('header .native-navigation button').first().click(); await slow.page.locator('#q').waitFor({state:'visible'});
    ok('Original page navigation and visible Back remain wired after adoption', await slow.page.locator('#panel-search').isVisible());
    await slow.page.locator('#pb-palette-button').click(); await slow.page.locator('[data-pb-palette-choice="graphit"]').click();
    ok('The adopted palette still changes and saves the actual chosen theme', await slow.page.evaluate(() => PBTheme.current() === 'graphit' && localStorage.getItem('pb_pro_theme_v1') === 'graphit'));
    await slow.page.locator('#pb-search-language').click(); await slow.page.locator('#pb-search-language-menu [data-input-language="ru"]').click();
    await slow.page.locator('#q').fill(''); await slow.page.locator('#mic').click();
    await slow.page.waitForFunction(() => document.getElementById('q').value === 'first paint spoken');
    ok('The same microphone remains functional and requests the selected Russian locale once', await slow.page.evaluate(() => __paintFixture.speechCalls.length === 1 && __paintFixture.speechCalls[0].language === 'ru-RU'));
    await clickMenu(slow.page, '[data-lang="en"]');
    await slow.page.waitForFunction(() => document.documentElement.lang === 'en' && document.getElementById('pb-palette-button').getAttribute('aria-label') === 'Choose a colour theme');
    ok('Existing interface-language handlers translate adopted controls without replacing the independent input preference', await slow.page.evaluate(() => PBInputLanguage.current() === 'ru' && document.getElementById('pb-search-language').textContent === 'RU'));
    const after = await slow.page.evaluate(async () => ({catalog:JSON.stringify((await idbGetAll('catalog')).map(({hash,name,path,size,text,tags}) => ({hash,name,path,size,text,tags}))), preference:localStorage.getItem('first-paint-user-sentinel'), cache:await (await caches.open('unrelated-app-first-paint')).match('/unrelated-first-paint').then(response => response?.text())}));
    ok('A catalog record, existing user preference and unrelated application cache survive the new startup', after.catalog === before.catalog && after.preference === before.preference && after.cache === 'keep this unrelated app cache');
    ok('Delayed startup and subsequent interactions have no unhandled application errors', slow.errors.length === 0);
    await slow.page.evaluate(() => {__firstPaint.active = false;});
  } finally {slow.releaseAll(); await slow.context.close();}

  for (const item of [...Object.keys(profiles).map(profile => ({profile,expected:profile})), {profile:'invalid-theme',expected:'klarblau'}, {profile:'petrol',denied:true,expected:'klarblau'}]) {
    const test = await fixture({profile:item.profile, denied:item.denied, delays:['native-theme.js']});
    try {
      test.arm(); const loaded = test.page.goto(origin, {waitUntil:'domcontentloaded'});
      loaded.catch(() => {});
      await deadline('Request for saved-theme adapter', test.gates.get('native-theme.js').hit); await frames(test.page);
      assertShell(`Saved ${item.denied ? 'unreadable' : item.profile} preference before the theme adapter`, await test.page.evaluate(() => __firstPaint.snapshot()), item.expected);
      test.gates.get('native-theme.js').release(); await loaded; await ready(test.page);
      ok(`${item.denied ? 'Denied theme storage' : item.profile}: early and hydrated theme agree without hiding content`, await test.page.evaluate(expected => PBTheme.current() === expected && document.documentElement.dataset.pbTheme === expected && localStorage.getItem('first-paint-user-sentinel') === 'keep this user preference', item.expected));
      ok(`${item.denied ? 'Denied theme storage' : item.profile}: no unhandled bootstrap error`, test.errors.length === 0);
    } finally {test.releaseAll(); await test.context.close();}
  }
} finally {await browser?.close();}

function assertShellFrame(state, theme) {
  assert.ok(state && state.bodyVisible && state.marker === 'shell' && state.theme === theme && state.background === profiles[theme].background && state.accent === profiles[theme].accent && state.bodyImage === 'none' && !state.legacyNav && !state.legacyVisibleText && !state.emoji, 'An observed rendering frame exposed the legacy shell or theme: ' + JSON.stringify(state));
}
console.log(`${count} first-paint and runtime-adoption checks passed (native services simulated; no physical-device performance claim).`);
